import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Filter, ShoppingCart, Plus, Minus, X, CreditCard, User, MapPin, Phone, Package, LogOut, History, Settings, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { dataService } from "../../services/dataService";
import { Product, LineItem, Order } from "../../types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<LineItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "" });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isCheckoutOpen && user) {
      setCustomerInfo({
        name: user.name || "",
        phone: user.mobile || "",
        address: user.addresses?.[0] || ""
      });
    }
  }, [isCheckoutOpen, user]);
  const [accountView, setAccountView] = useState<"menu" | "history" | "addresses" | "settings">("menu");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [profileForm, setProfileForm] = useState({ name: "", age: "", mobile: "" });
  const [newAddress, setNewAddress] = useState("");
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      const initialProducts = await dataService.getProducts();
      setProducts(initialProducts.filter(p => p.status === "active"));
      
      const dynamicCats = await dataService.getCategories();
      setCategories([
        { id: "all", label: "All" },
        ...dynamicCats.map(cat => ({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
      ]);
      
      const currentUser = dataService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const orders = await dataService.getUserOrders(currentUser.email);
        setUserOrders(orders);
        setProfileForm({ 
          name: currentUser.name, 
          age: currentUser.age?.toString() || "", 
          mobile: currentUser.mobile || "" 
        });
      }
    };

    loadInitialData();

    const unsubscribeAuth = dataService.onAuthChange(async (updatedUser) => {
      setUser(updatedUser);
      if (updatedUser) {
        const orders = await dataService.getUserOrders(updatedUser.email);
        setUserOrders(orders);
        setProfileForm({ 
          name: updatedUser.name, 
          age: updatedUser.age?.toString() || "", 
          mobile: updatedUser.mobile || "" 
        });
      } else {
        setUserOrders([]);
      }
    });

    const unsubscribeOrders = dataService.subscribe("ORDERS", async () => {
      const curr = dataService.getCurrentUser();
      if (curr) {
        const orders = await dataService.getUserOrders(curr.email);
        setUserOrders(orders);
      }
    });

    const unsubscribeProducts = dataService.subscribe("PRODUCTS", (newProducts) => {
      setProducts(newProducts.filter((p: any) => p.status === "active"));
    });

    const unsubscribeCategories = dataService.subscribe("CATEGORIES", (newCats) => {
      setCategories([
        { id: "all", label: "All" },
        ...newCats.map((cat: string) => ({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
      ]);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const handleLogout = async () => {
    await dataService.logout();
    setAccountView("menu");
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updated = {
      ...user,
      name: profileForm.name,
      age: profileForm.age ? parseInt(profileForm.age) : undefined,
      mobile: profileForm.mobile
    };
    await dataService.updateUser(updated);
    toast.success("Profile updated!");
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAddress) return;
    const updated = {
      ...user,
      addresses: [...user.addresses, newAddress]
    };
    await dataService.updateUser(updated);
    setNewAddress("");
    toast.success("Address added!");
  };

  const removeAddress = async (addr: string) => {
    if (!user) return;
    const updated = {
      ...user,
      addresses: user.addresses.filter(a => a !== addr)
    };
    await dataService.updateUser(updated);
    toast.success("Address removed");
  };

  const filteredProducts = products.filter(p => 
    (category === "all" || p.category.toLowerCase().replace(" ", "_") === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total: product.price
      }];
    });
    toast.success(`${product.name} added to bag!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unit_price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error("Please fill in all customer details.");
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      order_number: `ORD-${Date.now()}`,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      items: cart,
      subtotal: cartTotal,
      discount: 0,
      total: cartTotal,
      payment_method: "UPI",
      status: "pending",
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: "customer",
    };

    await dataService.saveOrder(newOrder);
    setCart([]);
    setIsCheckoutOpen(false);
    setCustomerInfo({ name: "", phone: "", address: "" });
    toast.success("Order placed successfully! We will contact you soon.");
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2519]">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="w-full bg-[#fdfbf7] pt-4 md:pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center gap-6 md:gap-8">
          <div className="w-full flex items-center justify-between md:grid md:grid-cols-3">
            <div className="hidden md:flex items-center">
              {/* Left side empty for balance or could add search here */}
            </div>

            <div className="flex flex-col items-center text-center">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold tracking-[0.3em] md:tracking-[0.6em] text-[#4a3f35] uppercase md:mr-[-0.6em]">
                KALAA
              </h1>
              <p className="text-[9px] md:text-[11px] tracking-[0.3em] md:tracking-[0.5em] text-[#8c7e6d] uppercase mt-2 md:mt-4 font-medium md:mr-[-0.5em]">
                Handcrafted with Love
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 md:gap-3">
              {user ? (
                <Sheet onOpenChange={(open) => !open && setAccountView("menu")}>
                  <SheetTrigger asChild>
                    <button className="w-10 h-10 bg-[#f7f3eb] text-[#3a322b] rounded-full flex items-center justify-center hover:bg-[#ece4d5] transition-all shadow-sm">
                      <User className="w-5 h-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md flex flex-col bg-[#fdfbf7]">
                    <SheetHeader>
                      <SheetTitle className="font-serif text-2xl flex items-center gap-2">
                        {accountView !== "menu" && (
                          <button onClick={() => setAccountView("menu")} className="p-1 hover:bg-[#f7f3eb] rounded-full">
                            <ArrowRight className="w-5 h-5 rotate-180" />
                          </button>
                        )}
                        <User className="w-5 h-5" />
                        {accountView === "menu" ? "My Account" : 
                         accountView === "history" ? "Order History" :
                         accountView === "addresses" ? "Saved Addresses" : "Account Settings"}
                      </SheetTitle>
                    </SheetHeader>
                    
                    <ScrollArea className="flex-grow">
                      {accountView === "menu" && (
                        <>
                          <div className="flex flex-col items-center py-10 border-b border-[#ece4d5]">
                            <div className="w-20 h-20 bg-[#3a322b] rounded-full flex items-center justify-center mb-4 shadow-lg">
                              <User className="text-white w-10 h-10" />
                            </div>
                            <h3 className="font-bold text-xl text-[#4a3f35]">{user.name}</h3>
                            <p className="text-[#8c7e6d] text-sm">{user.email}</p>
                          </div>

                          <div className="py-6 space-y-2">
                            <button 
                              onClick={() => setAccountView("history")}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#f7f3eb] text-[#4a3f35] transition-all"
                            >
                              <History className="w-5 h-5 text-[#b0966a]" />
                              <span className="font-medium">Order History</span>
                            </button>
                            <button 
                              onClick={() => setAccountView("addresses")}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#f7f3eb] text-[#4a3f35] transition-all"
                            >
                              <MapPin className="w-5 h-5 text-[#b0966a]" />
                              <span className="font-medium">Saved Addresses</span>
                            </button>
                            <button 
                              onClick={() => setAccountView("settings")}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#f7f3eb] text-[#4a3f35] transition-all"
                            >
                              <Settings className="w-5 h-5 text-[#b0966a]" />
                              <span className="font-medium">Account Settings</span>
                            </button>
                          </div>
                        </>
                      )}

                      {accountView === "history" && (
                        <div className="py-6 space-y-4">
                          {userOrders.length === 0 ? (
                            <div className="text-center py-10">
                              <Package className="w-12 h-12 text-[#ece4d5] mx-auto mb-4" />
                              <p className="text-[#8c7e6d]">No orders yet</p>
                            </div>
                          ) : (
                            userOrders.map(order => (
                              <div key={order.id} className="bg-white p-4 rounded-2xl border border-[#ece4d5] shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-bold text-[#4a3f35]">{order.order_number}</p>
                                    <p className="text-xs text-[#8c7e6d]">{new Date(order.created_date).toLocaleDateString()}</p>
                                  </div>
                                  <Badge variant="outline" className="capitalize bg-[#f7f3eb] text-[#b0966a] border-none">
                                    {order.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1 mt-3">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-sm text-[#4a3f35] flex justify-between">
                                      <span>{item.quantity}x {item.product_name}</span>
                                      <span>₹{item.total}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-[#f7f3eb] flex justify-between font-bold text-[#3a322b]">
                                  <span>Total</span>
                                  <span>₹{order.total}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {accountView === "addresses" && (
                        <div className="py-6 space-y-6">
                          <form onSubmit={handleAddAddress} className="space-y-3">
                            <Label className="text-[#8c7e6d] ml-1">Add New Address</Label>
                            <div className="flex gap-2">
                              <Input 
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                placeholder="Enter full address..."
                                className="rounded-xl border-[#ece4d5] bg-white"
                              />
                              <Button type="submit" size="icon" className="bg-[#3a322b] shrink-0">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </form>

                          <div className="space-y-3">
                            <Label className="text-[#8c7e6d] ml-1">Your Addresses</Label>
                            {!user.addresses || user.addresses.length === 0 ? (
                              <p className="text-sm text-[#8c7e6d] italic p-4 text-center">No saved addresses</p>
                            ) : (
                              user.addresses.map((addr: string, idx: number) => (
                                <div key={idx} className="flex items-start justify-between p-4 bg-white rounded-2xl border border-[#ece4d5] group">
                                  <div className="flex gap-3">
                                    <MapPin className="w-4 h-4 text-[#b0966a] mt-1" />
                                    <p className="text-sm text-[#4a3f35] leading-relaxed">{addr}</p>
                                  </div>
                                  <button 
                                    onClick={() => removeAddress(addr)}
                                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {accountView === "settings" && (
                        <form onSubmit={handleUpdateProfile} className="py-6 space-y-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-[#8c7e6d] ml-1">Full Name</Label>
                              <Input 
                                value={profileForm.name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                className="h-12 rounded-xl border-[#ece4d5] bg-white"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[#8c7e6d] ml-1">Age</Label>
                                <Input 
                                  type="number"
                                  value={profileForm.age}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                                  className="h-12 rounded-xl border-[#ece4d5] bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[#8c7e6d] ml-1">Mobile</Label>
                                <Input 
                                  value={profileForm.mobile}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, mobile: e.target.value }))}
                                  className="h-12 rounded-xl border-[#ece4d5] bg-white"
                                  placeholder="+91..."
                                />
                              </div>
                            </div>
                          </div>
                          <Button type="submit" className="w-full h-12 bg-[#3a322b] rounded-xl font-bold">
                            Save Changes
                          </Button>
                        </form>
                      )}
                    </ScrollArea>

                    <div className="pt-6 border-t border-[#ece4d5]">
                      <Button 
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center gap-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <button 
                  onClick={() => navigate("/login")}
                  className="w-10 h-10 bg-[#f7f3eb] text-[#3a322b] rounded-full flex items-center justify-center hover:bg-[#ece4d5] transition-all shadow-sm"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#3a322b] text-white px-5 py-2.5 rounded-full hover:bg-[#4a3f35] transition-all shadow-md">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-sm font-medium">Bag</span>
                    {cart.length > 0 && (
                      <span className="bg-white text-[#3a322b] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1">
                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col bg-[#fdfbf7]">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Your Shopping Bag
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="flex-grow mt-8">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#8c7e6d]">
                      <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-medium">Your bag is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map((item) => (
                        <div key={item.product_id} className="flex gap-4 p-4 bg-white rounded-2xl border border-[#ece4d5] shadow-sm">
                          <div className="w-20 h-20 bg-[#f7f3eb] rounded-xl overflow-hidden flex-shrink-0">
                            <img 
                              src={products.find(p => p.id === item.product_id)?.image_url} 
                              alt={item.product_name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-bold text-sm">{item.product_name}</h4>
                            <p className="text-[#b0966a] font-bold text-sm mt-1">₹{item.unit_price}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button 
                                onClick={() => updateQuantity(item.product_id, -1)}
                                className="w-6 h-6 rounded-full bg-[#f7f3eb] flex items-center justify-center hover:bg-[#ece4d5]"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product_id, 1)}
                                className="w-6 h-6 rounded-full bg-[#f7f3eb] flex items-center justify-center hover:bg-[#ece4d5]"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={() => updateQuantity(item.product_id, -item.quantity)}
                            className="text-[#c8b594] hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {cart.length > 0 && (
                  <div className="pt-6 border-t border-[#ece4d5] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8c7e6d]">Subtotal</span>
                      <span className="text-2xl font-serif font-bold">₹{cartTotal}</span>
                    </div>
                    <Button 
                      className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-14 rounded-2xl text-lg font-bold text-white"
                      onClick={() => setIsCheckoutOpen(true)}
                    >
                      Checkout Now
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Categories */}
          <div className="w-full flex flex-wrap justify-center gap-4 md:gap-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${
                  category === cat.id 
                    ? "bg-[#3a322b] text-white" 
                    : "text-[#8c7e6d] hover:text-[#3a322b]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Collection Title Section */}
          <div className="w-full flex flex-col items-center mt-8 md:mt-12 mb-4">
            <p className="text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] text-[#8c7e6d] uppercase font-medium mb-2">
              EST. WITH LOVE
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#4a3f35] mb-4 md:mb-6">
              Our Collection
            </h2>
            <div className="w-full flex items-center justify-center gap-3 md:gap-4">
              <div className="h-[1px] bg-[#ece4d5] flex-grow max-w-[80px] md:max-w-[120px]" />
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#b0966a] rotate-45" />
              <div className="h-[1px] bg-[#ece4d5] flex-grow max-w-[80px] md:max-w-[120px]" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#c8b594]">
            <Search className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-xl font-medium">No products found</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {filteredProducts.map((product, index) => {
              // Create a zig-zag pattern of heights
              const aspectRatios = [
                "aspect-[4/5]",   // Medium
                "aspect-square",  // Small
                "aspect-[3/4]",   // Tall
                "aspect-[4/3]",   // Wide/Short
                "aspect-[2/3]",   // Very Tall
              ];
              const aspectClass = aspectRatios[index % aspectRatios.length];

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-inside-avoid group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="bg-[#f7f3eb] rounded-[1.5rem] overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border border-[#ece4d5]/50">
                    <div className={`relative overflow-hidden bg-white ${aspectClass}`}>
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#c8b594]">
                          <Package className="w-8 h-8 opacity-30" />
                        </div>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#3a322b] opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 text-left">
                      <h3 className="font-serif text-sm font-bold text-[#4a3f35] leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-[#b0966a] mt-1 font-display">
                        ₹{product.price}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#f7f3eb] py-12 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="font-serif text-2xl font-bold text-[#3a322b] tracking-widest uppercase mb-2">
              KALAA
            </h2>
            <p className="text-xs text-[#8c7e6d] tracking-widest uppercase">
              Handcrafted with Love
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-[#8c7e6d]">
            <a href="#" className="hover:text-[#3a322b] transition-colors">Shop</a>
            <a href="#" className="hover:text-[#3a322b] transition-colors">About Us</a>
            <a href="#" className="hover:text-[#3a322b] transition-colors">Contact</a>
            <button 
              onClick={() => navigate("/admin/login")}
              className="hover:text-[#3a322b] transition-colors flex items-center gap-2"
            >
              <Lock className="w-3 h-3" />
              Admin Panel
            </button>
          </div>
          
          <div className="text-xs text-[#8c7e6d] text-center md:text-right">
            <p>&copy; 2026 KALAA. All rights reserved.</p>
            <p className="mt-1">Designed for Artisans.</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none bg-[#fdfbf7]">
          <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[500px]">
            {/* Left: Image */}
            <div className="w-full md:w-5/12 h-64 md:h-auto relative bg-white">
              {selectedProduct?.image_url ? (
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c8b594]">
                  <Package className="w-16 h-16 opacity-20" />
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col relative">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-[#3a322b]/10 hover:bg-[#3a322b]/20 rounded-full flex items-center justify-center text-[#3a322b] transition-all z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex-grow">
                <p className="text-[9px] tracking-[0.3em] text-[#8c7e6d] uppercase font-bold mb-2">
                  {selectedProduct?.category.replace("_", " ")}
                </p>
                <h2 className="font-serif text-2xl font-bold text-[#4a3f35] mb-2 leading-tight">
                  {selectedProduct?.name}
                </h2>
                <p className="text-2xl font-bold text-[#b0966a] mb-4 font-display">
                  ₹{selectedProduct?.price}
                </p>

                <div className="h-[1px] bg-[#ece4d5] w-full mb-4" />

                <p className="text-[#4a3f35] text-sm leading-relaxed mb-4">
                  {selectedProduct?.description}
                </p>
                
                <p className="text-[#8c7e6d] text-xs font-medium">
                  {selectedProduct?.stock} pieces available
                </p>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={() => {
                    if (selectedProduct) {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }
                  }}
                  className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-full text-base font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Bag — ₹{selectedProduct?.price}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] bg-[#fdfbf7] border-[#ece4d5]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#4a3f35]">Checkout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-[#8c7e6d]">
                  <User className="w-4 h-4" /> Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="Your full name" 
                  className="rounded-xl border-[#ece4d5] bg-white focus-visible:ring-[#b0966a]"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-[#8c7e6d]">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input 
                  id="phone" 
                  placeholder="Your phone number" 
                  className="rounded-xl border-[#ece4d5] bg-white focus-visible:ring-[#b0966a]"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-[#8c7e6d]">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </Label>
                {user && user.addresses && user.addresses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {user.addresses.map((addr: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomerInfo(prev => ({ ...prev, address: addr }))}
                        className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                          customerInfo.address === addr 
                            ? "bg-[#3a322b] text-white border-[#3a322b]" 
                            : "bg-white text-[#8c7e6d] border-[#ece4d5] hover:border-[#b0966a]"
                        }`}
                      >
                        Address {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
                <Input 
                  id="address" 
                  placeholder="Full delivery address" 
                  className="rounded-xl border-[#ece4d5] bg-white focus-visible:ring-[#b0966a]"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-6 bg-[#f7f3eb] rounded-3xl space-y-3">
              <div className="flex justify-between text-sm text-[#8c7e6d]">
                <span>Items ({cart.length})</span>
                <span className="font-bold text-[#4a3f35]">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-[#8c7e6d]">
                <span>Delivery</span>
                <span className="text-green-600 font-bold">Free</span>
              </div>
              <div className="pt-3 border-t border-[#ece4d5] flex justify-between items-center">
                <span className="font-bold text-[#4a3f35]">Total Amount</span>
                <span className="text-3xl font-serif font-bold text-[#b0966a]">₹{cartTotal}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border border-[#b0966a]/20 bg-[#b0966a]/5 rounded-2xl">
              <CreditCard className="text-[#b0966a] w-6 h-6" />
              <div>
                <p className="font-bold text-sm text-[#4a3f35]">Payment Method: UPI</p>
                <p className="text-xs text-[#8c7e6d]">Scan QR code on delivery or pay via link</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsCheckoutOpen(false)}
              className="rounded-xl border-[#ece4d5] text-[#8c7e6d]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              className="bg-[#3a322b] hover:bg-[#4a3f35] rounded-xl px-8 text-white"
            >
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
