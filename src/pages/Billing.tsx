import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Phone, MapPin, CreditCard, Trash2, Plus, Minus, Receipt } from "lucide-react";
import { dataService } from "../services/dataService";
import { Product, LineItem, Order, PaymentMethod } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import CartItem from "../components/billing/CartItem";
import { toast } from "sonner";

export default function Billing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<LineItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const loadProducts = async () => {
      const initialProducts = await dataService.getProducts();
      setProducts(initialProducts.filter(p => p.status === "active"));
    };
    loadProducts();

    // Subscribe to live updates
    const unsubscribe = dataService.subscribe("PRODUCTS", (newProducts) => {
      setProducts(newProducts.filter((p: any) => p.status === "active"));
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
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

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      order_number: `POS-${Date.now()}`,
      customer_name: customerInfo.name || "Walk-in Customer",
      customer_phone: customerInfo.phone || "N/A",
      customer_address: customerInfo.address || "N/A",
      items: cart,
      subtotal,
      discount,
      total,
      payment_method: paymentMethod,
      status: "completed",
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: "admin",
    };

    await dataService.saveOrder(newOrder);
    
    // Save customer if info provided
    if (customerInfo.name && customerInfo.phone) {
      await dataService.saveCustomer({
        id: Math.random().toString(36).substr(2, 9),
        ...customerInfo,
        notes: "Added via POS",
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by: "admin",
      });
    }

    setCart([]);
    setCustomerInfo({ name: "", phone: "", address: "" });
    setDiscount(0);
    toast.success("Sale completed successfully!");
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-8 overflow-hidden">
      {/* Product Selection */}
      <div className="flex-grow flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-display">Point of Sale</h1>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search products..."
              className="pl-12 h-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-brand-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-grow pr-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="group text-left bg-white p-4 rounded-3xl border border-slate-100 hover:border-brand-500 hover:shadow-lg transition-all"
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors" />
                </div>
                <h4 className="font-bold text-sm line-clamp-1">{product.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-brand-500 font-bold">₹{product.price}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Stock: {product.stock}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart & Checkout */}
      <div className="w-[450px] flex flex-col gap-6 h-full">
        <Card className="flex-grow flex flex-col overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-brand-500" />
                Current Cart
              </span>
              <Badge className="bg-slate-100 text-slate-900 border-none rounded-full px-3 py-1">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} items
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-grow flex flex-col p-8 pt-4 overflow-hidden">
            <ScrollArea className="flex-grow -mx-2 px-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                  <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                  <div key={item.product_id}>
                    <CartItem
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={(id) => updateQuantity(id, -item.quantity)}
                    />
                  </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Customer Name</Label>
                    <Input 
                      placeholder="Optional" 
                      className="rounded-xl bg-slate-50 border-none"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone</Label>
                    <Input 
                      placeholder="Optional" 
                      className="rounded-xl bg-slate-50 border-none"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Shipping Address</Label>
                  <Input 
                    placeholder="Enter delivery address" 
                    className="rounded-xl bg-slate-50 border-none"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Payment</Label>
                    <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="UPI">UPI / Digital</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Discount (₹)</Label>
                    <Input 
                      type="number" 
                      className="rounded-xl bg-slate-50 border-none"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-3 shadow-xl">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Discount</span>
                  <span className="text-red-400">-₹{discount}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-3xl font-bold font-display text-brand-400">₹{total}</span>
                </div>
              </div>

              <Button 
                className="w-full h-16 bg-brand-500 hover:bg-brand-600 text-white rounded-[1.5rem] text-xl font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                onClick={handleCompleteSale}
              >
                <Receipt className="w-6 h-6 mr-3" />
                Complete Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
