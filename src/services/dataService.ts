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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTIONS = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  ORDERS: "orders",
  CATEGORIES: "categories",
  USERS: "users",
};

type Listener = (data: any) => void;

export const dataService = {
  // Subscription
  subscribe: (key: keyof typeof COLLECTIONS, callback: Listener) => {
    const path = COLLECTIONS[key];
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      callback(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  },

  // Auth & Users
  getCurrentUser: (): User | null => {
    const user = auth.currentUser;
    if (!user) return null;
    return {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || "",
      email: user.email || "",
      addresses: [],
      created_date: new Date().toISOString(),
    };
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password || "");
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          addresses: data.addresses || []
        } as User;
      } else {
        // If user document doesn't exist (e.g. legacy user), create it
        const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
          email: firebaseUser.email || "",
          addresses: [],
          role: isAdmin ? 'admin' : 'user',
          created_date: new Date().toISOString(),
        };
        await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
        return newUser;
      }
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  },

  loginWithGoogle: async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          addresses: data.addresses || []
        } as User;
      } else {
        // Create new user document if it doesn't exist
        const isAdmin = firebaseUser.email === "rajukumbhar2323@gmail.com" || firebaseUser.email === "admin@kalaa.com";
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          addresses: [],
          role: isAdmin ? 'admin' : 'user',
          created_date: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUser);
        return newUser;
      }
    } catch (error) {
      console.error("Google login error:", error);
      return null;
    }
  },

  register: async (userData: Partial<User>): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email || "", userData.password || "");
      const firebaseUser = userCredential.user;
      
      const isAdmin = userData.email === "rajukumbhar2323@gmail.com" || userData.email === "admin@kalaa.com";
      const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name || "",
        email: userData.email || "",
        age: userData.age,
        mobile: userData.mobile,
        addresses: userData.addresses || [],
        role: isAdmin ? 'admin' : 'user',
        created_date: new Date().toISOString(),
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
      return newUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.USERS);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          callback({
            ...data,
            addresses: data.addresses || []
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
          });
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
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PRODUCTS);
      return [];
    }
  },

  saveProduct: async (product: Product) => {
    try {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
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
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CUSTOMERS);
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
  getOrders: async (): Promise<Order[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ORDERS);
      return [];
    }
  },

  getUserOrders: async (email: string): Promise<Order[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.ORDERS), where("customer_phone", "==", email));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ORDERS);
      return [];
    }
  },

  saveOrder: async (order: Order) => {
    try {
      await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), order);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.ORDERS}/${order.id}`);
    }
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
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      return snapshot.docs.map(doc => doc.data().name);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CATEGORIES);
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
