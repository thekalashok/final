import { supabase } from '../supabase';
import { Product, Customer, Order, User } from '../types';

const COLLECTIONS = {
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  ORDERS: "orders",
  CATEGORIES: "categories",
  USERS: "users",
};

type Listener = (data: any) => void;

export const supabaseService = {
  // Auth & Users
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from(COLLECTIONS.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) return profile as User;

    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.id,
      email: user.email || "",
      mobile: user.phone || "",
      addresses: [],
      created_date: new Date().toISOString(),
      emailVerified: !!user.email_confirmed_at
    };
  },

  loginWithGoogle: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin'
      }
    });
    
    if (error) throw error;
    return null; // Redirecting...
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
          callback(profile as User);
        } else {
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
          // Try to create profile if it doesn't exist
          await supabase.from(COLLECTIONS.USERS).upsert(newUser);
          callback(newUser);
        }
      } else {
        callback(null);
      }
    });
    return () => subscription.unsubscribe();
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.PRODUCTS)
      .select('*')
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data as Product[];
  },

  saveProduct: async (product: Product) => {
    const { error } = await supabase
      .from(COLLECTIONS.PRODUCTS)
      .upsert(product);
    if (error) throw error;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.PRODUCTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .select('*')
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data as Customer[];
  },

  saveCustomer: async (customer: Customer) => {
    const { error } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .upsert(customer);
    if (error) throw error;
  },

  deleteCustomer: async (id: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.CUSTOMERS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .select('*')
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data as Order[];
  },

  getUserOrders: async (email: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .select('*')
      .eq('customer_phone', email)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data as Order[];
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .select('*')
      .eq('order_number', orderNumber)
      .single();
    
    if (error) return null;
    return data as Order;
  },

  saveOrder: async (order: Order) => {
    const { error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .upsert(order);
    if (error) throw error;
  },

  subscribeToOrder: (orderId: string, callback: (order: Order | null) => void) => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: COLLECTIONS.ORDERS,
        filter: `id=eq.${orderId}`
      }, (payload) => {
        callback(payload.new as Order);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToUserOrders: (email: string, callback: (orders: Order[]) => void) => {
    const channel = supabase
      .channel(`user-orders-${email}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: COLLECTIONS.ORDERS,
        filter: `customer_phone=eq.${email}`
      }, async () => {
        // Re-fetch all orders for this user on any change
        const orders = await supabaseService.getUserOrders(email);
        callback(orders);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },

  deleteOrder: async (id: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.ORDERS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from(COLLECTIONS.CATEGORIES)
      .select('name');
    
    if (error) throw error;
    return data.map(c => c.name);
  },

  saveCategory: async (category: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.CATEGORIES)
      .upsert({ name: category.toLowerCase() });
    if (error) throw error;
  },

  deleteCategory: async (category: string) => {
    const { error } = await supabase
      .from(COLLECTIONS.CATEGORIES)
      .delete()
      .eq('name', category.toLowerCase());
    if (error) throw error;
  },

  // Real-time generic subscription (similar to Firebase onSnapshot)
  subscribe: (key: keyof typeof COLLECTIONS, callback: Listener) => {
    const table = COLLECTIONS[key];
    
    // Initial fetch
    (async () => {
      const { data } = await supabase.from(table).select('*');
      if (data) callback(data);
    })();

    const channel = supabase
      .channel(`table-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, async () => {
        const { data } = await supabase.from(table).select('*');
        if (data) callback(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
