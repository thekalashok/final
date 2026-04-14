import { supabase } from "../supabase";
import { Product, Customer, Order, User } from "../types";

const TABLES = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  ORDERS: "orders",
  CATEGORIES: "categories",
  USERS: "users",
  MEDIA: "media",
};

type Listener = (data: any) => void;

export const dataService = {
  getInitialData: (key: keyof typeof TABLES) => {
    return [];
  },

  subscribe: (key: keyof typeof TABLES, callback: Listener) => {
    const table = TABLES[key];
    
    // Initial fetch
    supabase.from(table).select('*').then(({ data, error }) => {
      if (!error && data) {
        callback(data);
      }
    });

    // Subscribe to changes with a unique channel name to avoid conflicts
    const channelId = `public:${table}:${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, async () => {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && data) {
          callback(data);
        }
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
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) return profile as User;

    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.id,
      email: user.email || "",
      addresses: [],
      role: 'user',
      created_date: user.created_at,
      emailVerified: !!user.email_confirmed_at
    };
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profile) return profile as User;
    } catch (e) {
      console.warn("Profile fetch failed, likely table doesn't exist yet:", e);
    }
      
    // Fallback to basic user info if profile table is missing or empty
    return {
      id: data.user.id,
      name: data.user.email?.split('@')[0] || "Admin",
      email: data.user.email || "",
      addresses: [],
      role: (data.user.email === "rajukumbhar2323@gmail.com" || data.user.email === "admin@kalaa.com") ? 'admin' : 'user',
      created_date: data.user.created_at,
      emailVerified: !!data.user.email_confirmed_at
    };
  },

  loginWithGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },

  register: async (userData: Partial<User> & { password?: string }): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email || "",
      password: userData.password || "",
      options: {
        data: {
          full_name: userData.name
        }
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error("Registration failed");

    const isAdmin = userData.email === "rajukumbhar2323@gmail.com" || userData.email === "admin@kalaa.com";
    const newUser: User = {
      id: data.user.id,
      name: userData.name || "",
      email: userData.email || "",
      addresses: userData.addresses || [],
      role: isAdmin ? 'admin' : 'user',
      created_date: new Date().toISOString(),
      emailVerified: false
    };
    
    const { error: profileError } = await supabase.from(TABLES.USERS).insert(newUser);
    if (profileError) throw profileError;

    return newUser;
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            callback(profile as User);
            return;
          }
        } catch (e) {
          console.warn("Auth change profile fetch failed:", e);
        }

        // Create profile or fallback
        const isAdmin = session.user.email === "rajukumbhar2323@gmail.com" || session.user.email === "admin@kalaa.com";
        const newUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "",
          email: session.user.email || "",
          addresses: [],
          role: isAdmin ? 'admin' : 'user',
          created_date: new Date().toISOString(),
          emailVerified: !!session.user.email_confirmed_at
        };
        
        try {
          await supabase.from(TABLES.USERS).insert(newUser);
        } catch (e) {
          console.error("Could not save profile to table, but allowing login:", e);
        }
        
        callback(newUser);
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  },

  updateUser: async (updatedUser: User) => {
    const { error } = await supabase
      .from(TABLES.USERS)
      .update(updatedUser)
      .eq('id', updatedUser.id);
    if (error) throw error;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from(TABLES.PRODUCTS).select('*');
    if (error) throw error;
    return data as Product[];
  },

  saveProduct: async (product: Product) => {
    const { error } = await supabase.from(TABLES.PRODUCTS).upsert(product);
    if (error) throw error;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from(TABLES.PRODUCTS).delete().eq('id', id);
    if (error) throw error;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from(TABLES.CUSTOMERS).select('*');
    if (error) throw error;
    return data as Customer[];
  },

  saveCustomer: async (customer: Customer) => {
    const { error } = await supabase.from(TABLES.CUSTOMERS).upsert(customer);
    if (error) throw error;
  },

  deleteCustomer: async (id: string) => {
    const { error } = await supabase.from(TABLES.CUSTOMERS).delete().eq('id', id);
    if (error) throw error;
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase.from(TABLES.ORDERS).select('*');
    if (error) throw error;
    return data as Order[];
  },

  getUserOrders: async (email: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('customer_phone', email);
    if (error) throw error;
    return data as Order[];
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('order_number', orderNumber)
      .single();
    if (error) return null;
    return data as Order;
  },

  saveOrder: async (order: Order) => {
    const { error } = await supabase.from(TABLES.ORDERS).upsert(order);
    if (error) throw error;
  },

  subscribeToOrder: (orderId: string, callback: (order: Order | null) => void) => {
    supabase.from(TABLES.ORDERS).select('*').eq('id', orderId).single().then(({ data }) => {
      callback(data as Order);
    });

    const channel = supabase
      .channel(`order:${orderId}:${Math.random().toString(36).substring(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.ORDERS, filter: `id=eq.${orderId}` }, (payload) => {
        callback(payload.new as Order);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  subscribeToUserOrders: (email: string, callback: (orders: Order[]) => void) => {
    supabase.from(TABLES.ORDERS).select('*').eq('customer_phone', email).then(({ data }) => {
      callback(data as Order[] || []);
    });

    const channel = supabase
      .channel(`user-orders:${email}:${Math.random().toString(36).substring(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.ORDERS, filter: `customer_phone=eq.${email}` }, async () => {
        const { data } = await supabase.from(TABLES.ORDERS).select('*').eq('customer_phone', email);
        callback(data as Order[] || []);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  deleteOrder: async (id: string) => {
    const { error } = await supabase.from(TABLES.ORDERS).delete().eq('id', id);
    if (error) throw error;
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase.from(TABLES.CATEGORIES).select('name');
    if (error) throw error;
    return data.map(cat => cat.name);
  },

  saveCategory: async (category: string) => {
    const cat = category.toLowerCase();
    const { error } = await supabase.from(TABLES.CATEGORIES).upsert({ id: cat, name: cat });
    if (error) throw error;
  },

  deleteCategory: async (category: string) => {
    const cat = category.toLowerCase();
    const { error } = await supabase.from(TABLES.CATEGORIES).delete().eq('id', cat);
    if (error) throw error;
  },

  // Media
  saveMediaMetadata: async (media: { name: string, url: string, type: string, size: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const mediaDoc = {
      ...media,
      id: Math.random().toString(36).substr(2, 9),
      created_date: new Date().toISOString(),
      created_by: user?.id || "anonymous"
    };
    const { error } = await supabase.from(TABLES.MEDIA).insert(mediaDoc);
    if (error) throw error;
    return mediaDoc;
  },

  getMedia: async () => {
    const { data, error } = await supabase
      .from(TABLES.MEDIA)
      .select('*')
      .order('created_date', { ascending: false });
    if (error) throw error;
    return data;
  }
};
