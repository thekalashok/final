import { supabase } from "../supabase";
import { Product, Customer, Order, User } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  console.error(`Supabase Error [${operationType}] on ${path}:`, error);
  if (operationType !== OperationType.LIST) {
    throw error;
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
  // Subscription
  subscribe: (key: keyof typeof COLLECTIONS, callback: Listener) => {
    const table = COLLECTIONS[key];
    
    // Check cache first
    const cachedData = getCache(table);
    if (cachedData) {
      callback(cachedData.data);
    }

    // Initial fetch
    const fetchInitial = async () => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        handleSupabaseError(error, OperationType.LIST, table);
      } else if (data) {
        setCache(table, data);
        callback(data);
      }
    };
    fetchInitial();

    // Subscribe to changes
    const channel = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
        fetchInitial(); // Re-fetch on any change for simplicity
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Auth & Users
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from(COLLECTIONS.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      return {
        ...profile,
        emailVerified: !!user.email_confirmed_at
      } as User;
    }

    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || user.id,
      email: user.email || "",
      addresses: [],
      created_date: user.created_at,
      emailVerified: !!user.email_confirmed_at
    } as User;
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from(COLLECTIONS.USERS)
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      return {
        ...profile,
        emailVerified: !!data.user.email_confirmed_at
      } as User;
    }

    const isAdmin = data.user.email === "rajukumbhar2323@gmail.com" || data.user.email === "admin@kalaa.com";
    const newUser: User = {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || "",
      email: data.user.email || "",
      addresses: [],
      role: isAdmin ? 'admin' : 'user',
      created_date: new Date().toISOString(),
      emailVerified: !!data.user.email_confirmed_at
    };
    
    await supabase.from(COLLECTIONS.USERS).upsert(newUser);
    return newUser;
  },

  loginWithGoogle: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return null; // OAuth redirect happens
  },

  register: async (userData: Partial<User> & { password?: string }): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email || "",
      password: userData.password || "",
      options: {
        data: {
          name: userData.name
        }
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error("Registration failed");

    const isAdmin = userData.email === "rajukumbhar2323@gmail.com" || userData.email === "admin@kalaa.com";
    const newUser: User = {
      id: data.user.id,
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

    const { error: profileError } = await supabase.from(COLLECTIONS.USERS).insert(newUser);
    if (profileError) throw profileError;

    return newUser;
  },

  sendVerification: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email); // Supabase doesn't have a direct "resend verification" in the same way as Firebase easily, usually handled by signUp
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from(COLLECTIONS.USERS)
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          callback({
            ...profile,
            emailVerified: !!session.user.email_confirmed_at
          } as User);
        } else {
          // Create profile if missing (e.g. after Google Login)
          const isAdmin = session.user.email === "rajukumbhar2323@gmail.com" || session.user.email === "admin@kalaa.com";
          const newUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "",
            email: session.user.email || "",
            addresses: [],
            role: isAdmin ? 'admin' : 'user',
            created_date: session.user.created_at,
            emailVerified: !!session.user.email_confirmed_at
          };
          
          // Attempt to insert, but don't block the callback if it fails (e.g. RLS issues)
          supabase.from(COLLECTIONS.USERS).insert(newUser).then(({ error }) => {
            if (error) console.error("Error creating user profile:", error);
          });

          callback(newUser);
        }
      } else {
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  updateUser: async (updatedUser: User) => {
    const { error } = await supabase
      .from(COLLECTIONS.USERS)
      .upsert(updatedUser);
    if (error) handleSupabaseError(error, OperationType.UPDATE, `${COLLECTIONS.USERS}/${updatedUser.id}`);
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const table = COLLECTIONS.PRODUCTS;
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      handleSupabaseError(error, OperationType.LIST, table);
      return FALLBACK_PRODUCTS;
    }
    setCache(table, data);
    return data || [];
  },

  saveProduct: async (product: Product) => {
    const { error } = await supabase
      .from(COLLECTIONS.PRODUCTS)
      .upsert(product);
    if (error) handleSupabaseError(error, OperationType.WRITE, `${COLLECTIONS.PRODUCTS}/${product.id}`);
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.PRODUCTS)
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, OperationType.DELETE, `${COLLECTIONS.PRODUCTS}/${id}`);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const table = COLLECTIONS.CUSTOMERS;
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      handleSupabaseError(error, OperationType.LIST, table);
      return [];
    }
    setCache(table, data);
    return data || [];
  },

  saveCustomer: async (customer: Customer) => {
    const { error } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .upsert(customer);
    if (error) handleSupabaseError(error, OperationType.WRITE, `${COLLECTIONS.CUSTOMERS}/${customer.id}`);
  },

  deleteCustomer: async (id: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, OperationType.DELETE, `${COLLECTIONS.CUSTOMERS}/${id}`);
  },

  // Orders
  getOrders: async (forceRefresh = false): Promise<Order[]> => {
    const table = COLLECTIONS.ORDERS;
    if (!forceRefresh) {
      const cachedData = getCache(table);
      if (cachedData) return cachedData.data;
    }
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      handleSupabaseError(error, OperationType.LIST, table);
      return [];
    }
    setCache(table, data);
    return data || [];
  },

  getUserOrders: async (email: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .select('*')
      .eq('customer_phone', email);
    if (error) {
      handleSupabaseError(error, OperationType.LIST, COLLECTIONS.ORDERS);
      return [];
    }
    return data || [];
  },

  saveOrder: async (order: Order) => {
    const { error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .upsert(order);
    if (error) handleSupabaseError(error, OperationType.WRITE, `${COLLECTIONS.ORDERS}/${order.id}`);
  },

  deleteOrder: async (id: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, OperationType.DELETE, `${COLLECTIONS.ORDERS}/${id}`);
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const table = COLLECTIONS.CATEGORIES;
    const { data, error } = await supabase.from(table).select('name');
    if (error) {
      handleSupabaseError(error, OperationType.LIST, table);
      return ["amigurumi", "bags", "clothing", "accessories", "home_decor", "custom", "other"];
    }
    const names = data?.map(d => d.name) || [];
    setCache(table, names);
    return names;
  },

  saveCategory: async (category: string) => {
    const cat = category.toLowerCase();
    const { error } = await supabase
      .from(COLLECTIONS.CATEGORIES)
      .upsert({ name: cat });
    if (error) handleSupabaseError(error, OperationType.WRITE, `${COLLECTIONS.CATEGORIES}/${category}`);
  },

  deleteCategory: async (category: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.CATEGORIES)
      .delete()
      .eq('name', category.toLowerCase());
    if (error) handleSupabaseError(error, OperationType.DELETE, `${COLLECTIONS.CATEGORIES}/${category}`);
  },
};
