import { supabaseService } from "./supabaseService";
import { Product, Customer, Order, User } from "../types";

export const dataService = {
  getInitialData: (key: any) => {
    // Supabase doesn't have a direct equivalent for getInitialData in the same way,
    // so we return an empty array and let the subscription/fetch handle it.
    return [];
  },
  
  // Subscription
  subscribe: (key: any, callback: (data: any) => void) => {
    return supabaseService.subscribe(key, callback);
  },

  // Auth & Users
  getCurrentUser: async (): Promise<User | null> => {
    // Check for hardcoded admin session first
    const adminSession = localStorage.getItem('kalaa_admin_session');
    if (adminSession === 'true') {
      return {
        id: 'admin-id',
        name: 'Kalaa Admin',
        email: 'admin@kalaa.com',
        role: 'admin',
        addresses: [],
        created_date: new Date().toISOString()
      };
    }
    return supabaseService.getCurrentUser();
  },

  login: async (adminId: string, password: string): Promise<boolean> => {
    if (adminId === 'Kalaa' && password === 'Rajo@9321') {
      localStorage.setItem('kalaa_admin_session', 'true');
      return true;
    }
    return false;
  },

  loginWithGoogle: async (): Promise<User | null> => {
    return supabaseService.loginWithGoogle();
  },

  logout: async () => {
    localStorage.removeItem('kalaa_admin_session');
    return supabaseService.logout();
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    // Check for hardcoded admin session
    const adminSession = localStorage.getItem('kalaa_admin_session');
    if (adminSession === 'true') {
      callback({
        id: 'admin-id',
        name: 'Kalaa Admin',
        email: 'admin@kalaa.com',
        role: 'admin',
        addresses: [],
        created_date: new Date().toISOString()
      });
      // Return a no-op unsubscribe
      return () => {};
    }
    return supabaseService.onAuthChange(callback);
  },

  updateUser: async (updatedUser: User) => {
    // Supabase upsert handles update
    const { data, error } = await (await import('../supabase')).supabase
      .from('users')
      .upsert(updatedUser);
    if (error) throw error;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    return supabaseService.getProducts();
  },

  saveProduct: async (product: Product) => {
    return supabaseService.saveProduct(product);
  },

  deleteProduct: async (id: string) => {
    return supabaseService.deleteProduct(id);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    return supabaseService.getCustomers();
  },

  saveCustomer: async (customer: Customer) => {
    return supabaseService.saveCustomer(customer);
  },

  deleteCustomer: async (id: string) => {
    return supabaseService.deleteCustomer(id);
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    return supabaseService.getOrders();
  },

  getUserOrders: async (email: string): Promise<Order[]> => {
    return supabaseService.getUserOrders(email);
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    return supabaseService.getOrderByNumber(orderNumber);
  },

  saveOrder: async (order: Order) => {
    return supabaseService.saveOrder(order);
  },

  subscribeToOrder: (orderId: string, callback: (order: Order | null) => void) => {
    return supabaseService.subscribeToOrder(orderId, callback);
  },

  subscribeToUserOrders: (email: string, callback: (orders: Order[]) => void) => {
    return supabaseService.subscribeToUserOrders(email, callback);
  },

  deleteOrder: async (id: string) => {
    return supabaseService.deleteOrder(id);
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    return supabaseService.getCategories();
  },

  saveCategory: async (category: string) => {
    return supabaseService.saveCategory(category);
  },

  deleteCategory: async (category: string) => {
    return supabaseService.deleteCategory(category);
  },
};

