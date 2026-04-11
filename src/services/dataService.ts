import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDocFromServer
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  sendEmailVerification,
  ActionCodeSettings,
  User as FirebaseUser
} from "firebase/auth";
import { db, auth } from "../firebase";
import { Product, Customer, Order, User } from "../types";

const googleProvider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes("INTERNAL ASSERTION FAILED") || errorMessage.includes("Unexpected state")) {
    console.error("Firebase Internal Error. Ignoring to prevent crash.", errorMessage);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Don't throw for LIST operations (like onSnapshot) to prevent app crashes
  if (operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}

const COLLECTIONS = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  ORDERS: "orders",
  CATEGORIES: "categories",
  USERS: "users",
};

type Listener = (data: any) => void;

// Simple cache using localStorage to persist across reloads
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCache = (path: string) => {
  try {
    const cached = localStorage.getItem(`cache_${path}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Cache read error", e);
  }
  return null;
};

const setCache = (path: string, data: any) => {
  try {
    localStorage.setItem(`cache_${path}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.error("Cache write error", e);
  }
};

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "fallback-1",
    name: "Handcrafted Amigurumi Bear",
    description: "A cute, soft, and cuddly handcrafted amigurumi bear.",
    price: 499,
    cost_price: 250,
    category: "amigurumi",
    image_url: "https://picsum.photos/seed/amigurumi/400/400",
    stock: 10,
    sku: "FB-AMI-001",
    status: "active",
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    created_by: "system"
  },
  {
    id: "fallback-2",
    name: "Woven Tote Bag",
    description: "A stylish and durable woven tote bag for everyday use.",
    price: 899,
    cost_price: 450,
    category: "bags",
    image_url: "https://picsum.photos/seed/wovenbag/400/400",
    stock: 5,
    sku: "FB-BAG-001",
    status: "active",
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    created_by: "system"
  },
  {
    id: "fallback-3",
    name: "Embroidered Scarf",
    description: "A beautiful hand-embroidered scarf.",
    price: 350,
    cost_price: 150,
    category: "accessories",
    image_url: "https://picsum.photos/seed/scarf/400/400",
    stock: 15,
    sku: "FB-ACC-001",
    status: "active",
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    created_by: "system"
  },
  {
    id: "fallback-4",
    name: "Ceramic Vase",
    description: "A minimalist ceramic vase for your home.",
    price: 1200,
    cost_price: 600,
    category: "home_decor",
    image_url: "https://picsum.photos/seed/vase/400/400",
    stock: 3,
    sku: "FB-HOM-001",
    status: "active",
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    created_by: "system"
  }
];

export const dataService = {
  getInitialData: (key: keyof typeof COLLECTIONS) => {
    const path = COLLECTIONS[key];
    const cachedData = getCache(path);
    if (cachedData) {
      return cachedData.data;
    }
    if (path === COLLECTIONS.PRODUCTS) {
      return [];
    }
    if (path === COLLECTIONS.CATEGORIES) {
      return [{ name: "amigurumi" }, { name: "bags" }, { name: "clothing" }, { name: "accessories" }, { name: "home_decor" }, { name: "custom" }, { name: "other" }];
    }
    return [];
  },
  // Subscription
  subscribe: (key: keyof typeof COLLECTIONS, callback: Listener) => {
    const path = COLLECTIONS[key];
    
    // Check cache first for immediate UI update
    const cachedData = getCache(path);
    if (cachedData) {
      callback(cachedData.data);
    }

    let unsubscribe: () => void = () => {};
    let isPolled = false;
    let pollInterval: any = null;

    const startPolling = () => {
      if (isPolled) return;
      isPolled = true;
      console.log(`Falling back to polling for ${path}`);
      pollInterval = setInterval(async () => {
        try {
          const snapshot = await getDocs(query(collection(db, path)));
          const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setCache(path, data);
          callback(data);
        } catch (e) {
          console.error(`Poll failed for ${path}`, e);
        }
      }, 30000);
    };

    try {
      const q = query(collection(db, path));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Update cache
        setCache(path, data);
        callback(data);
      }, (error) => {
        const errorMessage = error.message || String(error);
        
        // Handle internal errors by falling back to polling
        if (errorMessage.includes("INTERNAL ASSERTION FAILED") || errorMessage.includes("Unexpected state")) {
          console.error(`Firestore Internal Error in onSnapshot for ${path}. Falling back to polling.`, errorMessage);
          unsubscribe();
          startPolling();
          return;
        }

        // If quota exceeded, try to use cached data if available
        if (errorMessage.includes("Quota exceeded")) {
          console.warn(`Quota limit exceeded for ${path}.`);
          const currentCache = getCache(path);
          if (currentCache) {
            callback(currentCache.data);
          } else {
            if (path === COLLECTIONS.CATEGORIES) {
              callback(["amigurumi", "bags", "clothing", "accessories", "home_decor", "custom", "other"]);
            } else if (path === COLLECTIONS.PRODUCTS) {
              callback([]);
            } else {
              callback([]);
            }
          }
          return;
        }
        handleFirestoreError(error, OperationType.LIST, path);
      });
    } catch (e) {
      console.error(`Failed to start onSnapshot for ${path}. Falling back to polling.`, e);
      startPolling();
    }

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.error(`Error unsubscribing from ${path}:`, e);
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  },

  // Auth & Users
  getCurrentUser: (): User | null => {
    const user = auth.currentUser;
    if (!user) return null;
    return {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || user.uid,
      email: user.email || "",
      mobile: user.phoneNumber || "",
      addresses: [],
      created_date: new Date().toISOString(),
      emailVerified: user.emailVerified
    };
  },

  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            ...data,
            addresses: data.addresses || [],
            emailVerified: firebaseUser.emailVerified
          } as User;
        } else {
          const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
            email: firebaseUser.email || "",
            addresses: [],
            role: isAdmin ? 'admin' : 'user',
            created_date: new Date().toISOString(),
            emailVerified: firebaseUser.emailVerified
          };
          await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
          return newUser;
        }
      } catch (firestoreError: any) {
        if (firestoreError.message?.includes("Quota exceeded")) {
          console.warn("Quota exceeded during login. Returning fallback user object.");
          const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
          return {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
            email: firebaseUser.email || "",
            addresses: [],
            role: isAdmin ? 'admin' : 'user',
            created_date: new Date().toISOString(),
            emailVerified: firebaseUser.emailVerified
          };
        }
        throw firestoreError;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  },

  loginWithGoogle: async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      try {
        const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            ...data,
            addresses: data.addresses || [],
            emailVerified: firebaseUser.emailVerified
          } as User;
        } else {
          const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            addresses: [],
            role: isAdmin ? 'admin' : 'user',
            created_date: new Date().toISOString(),
            emailVerified: firebaseUser.emailVerified
          };
          await setDoc(userDocRef, newUser);
          return newUser;
        }
      } catch (firestoreError: any) {
        if (firestoreError.message?.includes("Quota exceeded")) {
          console.warn("Quota exceeded during Google login. Returning fallback user object.");
          const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
          return {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
            email: firebaseUser.email || "",
            addresses: [],
            role: isAdmin ? 'admin' : 'user',
            created_date: new Date().toISOString(),
            emailVerified: firebaseUser.emailVerified
          };
        }
        throw firestoreError;
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      throw error;
    }
  },

  register: async (userData: Partial<User> & { password?: string }): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email || "", userData.password || "");
      const firebaseUser = userCredential.user;
      
      // Send verification email
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/admin/login`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(firebaseUser, actionCodeSettings);
      
      const isAdmin = userData.email === "rajukumbhar2323@gmail.com" || userData.email === "admin@kalaa.com";
      const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name || "",
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || "",
        age: userData.age,
        mobile: userData.mobile,
        addresses: userData.addresses || [],
        role: isAdmin ? 'admin' : 'user',
        created_date: new Date().toISOString(),
        emailVerified: false
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
      return newUser;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already registered. Please login instead.");
      }
      handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.USERS);
      throw error;
    }
  },

  sendVerification: async () => {
    if (auth.currentUser) {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/admin/login`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
    }
  },

  reloadUser: async (): Promise<User | null> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const firebaseUser = auth.currentUser;
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          addresses: data.addresses || [],
          emailVerified: firebaseUser.emailVerified
        } as User;
      }
    }
    return null;
  },

  logout: async () => {
    await signOut(auth);
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            callback({
              ...data,
              addresses: data.addresses || [],
              emailVerified: firebaseUser.emailVerified
            } as User);
          } else {
            const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
            callback({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
              email: firebaseUser.email || "",
              addresses: [],
              role: isAdmin ? 'admin' : 'user',
              created_date: new Date().toISOString(),
              emailVerified: firebaseUser.emailVerified
            });
          }
        } catch (error: any) {
          if (error.message?.includes("Quota exceeded")) {
            console.warn("Quota exceeded during auth state change. Returning fallback user object.");
            const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
            callback({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
              email: firebaseUser.email || "",
              addresses: [],
              role: isAdmin ? 'admin' : 'user',
              created_date: new Date().toISOString(),
              emailVerified: firebaseUser.emailVerified
            });
          } else {
            console.error("Auth state change error:", error);
            callback(null);
          }
        }
      } else {
        callback(null);
      }
    });
  },

  updateUser: async (updatedUser: User) => {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, updatedUser.id), updatedUser, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.USERS}/${updatedUser.id}`);
    }
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const path = COLLECTIONS.PRODUCTS;
    const cachedData = getCache(path);
    if (cachedData) {
      return cachedData.data;
    }
    try {
      const snapshot = await getDocs(collection(db, path));
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setCache(path, data);
      return data;
    } catch (error: any) {
      if (error.message.includes("Quota exceeded")) {
        console.warn(`Quota limit exceeded for ${path}.`);
        const currentCache = getCache(path);
        return currentCache ? currentCache.data : FALLBACK_PRODUCTS;
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveProduct: async (product: Product) => {
    try {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
      // Update cache
      const path = COLLECTIONS.PRODUCTS;
      const currentCache = getCache(path);
      if (currentCache) {
        const existingIndex = currentCache.data.findIndex((p: Product) => p.id === product.id);
        if (existingIndex >= 0) {
          currentCache.data[existingIndex] = product;
        } else {
          currentCache.data.push(product);
        }
        setCache(path, currentCache.data);
      } else {
        // If no cache exists, initialize it with fallback products plus the new one
        setCache(path, [...FALLBACK_PRODUCTS, product]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.PRODUCTS}/${product.id}`);
    }
  },

  deleteProduct: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.PRODUCTS}/${id}`);
    }
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const path = COLLECTIONS.CUSTOMERS;
    const cachedData = getCache(path);
    if (cachedData) {
      return cachedData.data;
    }
    try {
      const snapshot = await getDocs(collection(db, path));
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
      setCache(path, data);
      return data;
    } catch (error: any) {
      if (error.message.includes("Quota exceeded")) {
        console.warn(`Quota limit exceeded for ${path}.`);
        const currentCache = getCache(path);
        return currentCache ? currentCache.data : [];
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveCustomer: async (customer: Customer) => {
    try {
      await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.CUSTOMERS}/${customer.id}`);
    }
  },

  deleteCustomer: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.CUSTOMERS}/${id}`);
    }
  },

  // Orders
  getOrders: async (forceRefresh = false): Promise<Order[]> => {
    const path = COLLECTIONS.ORDERS;
    if (!forceRefresh) {
      const cachedData = getCache(path);
      if (cachedData) {
        return cachedData.data;
      }
    }
    try {
      const snapshot = await getDocs(collection(db, path));
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setCache(path, data);
      return data;
    } catch (error: any) {
      if (error.message.includes("Quota exceeded")) {
        console.warn(`Quota limit exceeded for ${path}.`);
        const currentCache = getCache(path);
        return currentCache ? currentCache.data : [];
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  getUserOrders: async (email: string): Promise<Order[]> => {
    const path = `${COLLECTIONS.ORDERS}_${email}`;
    const cachedData = getCache(path);
    if (cachedData) {
      return cachedData.data;
    }
    try {
      const q = query(collection(db, COLLECTIONS.ORDERS), where("customer_phone", "==", email));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setCache(path, data);
      return data;
    } catch (error: any) {
      if (error.message?.includes("Quota exceeded")) {
        console.warn(`Quota limit exceeded for ${path}.`);
        const currentCache = getCache(path);
        return currentCache ? currentCache.data : [];
      }
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ORDERS);
      return [];
    }
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    try {
      // First try to get it by ID (since new orders use order_number as ID)
      const docRef = doc(db, COLLECTIONS.ORDERS, orderNumber);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Order;
      }
      
      // Fallback for older orders that might have a different ID
      const q = query(collection(db, COLLECTIONS.ORDERS), where("order_number", "==", orderNumber));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const oldDoc = snapshot.docs[0];
      return { ...oldDoc.data(), id: oldDoc.id } as Order;
    } catch (error: any) {
      if (error.message?.includes("Quota exceeded")) {
        console.warn(`Quota limit exceeded for getOrderByNumber.`);
        return null;
      }
      // If it's a permission error on the fallback query, we just return null
      // because unauthenticated users can't run queries, only getDoc.
      if (error.message?.includes("Missing or insufficient permissions")) {
        return null;
      }
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ORDERS);
      return null;
    }
  },

  saveOrder: async (order: Order) => {
    try {
      await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), order);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.ORDERS}/${order.id}`);
    }
  },

  subscribeToOrder: (orderId: string, callback: (order: Order | null) => void) => {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ ...doc.data(), id: doc.id } as Order);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error subscribing to order:", error);
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.ORDERS}/${orderId}`);
    });
  },

  subscribeToUserOrders: (email: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, COLLECTIONS.ORDERS), where("customer_phone", "==", email));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      callback(data);
    }, (error) => {
      console.error("Error subscribing to user orders:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ORDERS);
    });
  },

  deleteOrder: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ORDERS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.ORDERS}/${id}`);
    }
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const path = COLLECTIONS.CATEGORIES;
    const cachedData = getCache(path);
    if (cachedData) {
      return cachedData.data;
    }
    try {
      const snapshot = await getDocs(collection(db, path));
      const data = snapshot.docs
        .map(doc => doc.data().name)
        .filter(name => typeof name === 'string' && name.length > 0);
      setCache(path, data);
      return data;
    } catch (error: any) {
      if (error.message.includes("Quota exceeded")) {
        console.warn(`Quota limit exceeded for ${path}.`);
        const currentCache = getCache(path);
        return currentCache ? currentCache.data : ["amigurumi", "bags", "clothing", "accessories", "home_decor", "custom", "other"];
      }
      handleFirestoreError(error, OperationType.LIST, path);
      return ["amigurumi", "bags", "clothing", "accessories", "home_decor", "custom", "other"];
    }
  },

  saveCategory: async (category: string) => {
    try {
      const cat = category.toLowerCase();
      await setDoc(doc(db, COLLECTIONS.CATEGORIES, cat), { name: cat });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.CATEGORIES}/${category}`);
    }
  },

  deleteCategory: async (category: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, category.toLowerCase()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.CATEGORIES}/${category}`);
    }
  },
};
