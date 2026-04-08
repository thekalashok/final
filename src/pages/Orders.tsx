import { useState, useEffect } from "react";
import { Search, Filter, Eye, CheckCircle, Clock, Package, XCircle, Truck } from "lucide-react";
import { dataService } from "../services/dataService";
import { Order, OrderStatus } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
    // Subscribe to live updates
    const unsubscribe = dataService.subscribe("ORDERS", (newOrders) => {
      setOrders(newOrders.sort((a: Order, b: Order) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
    });
    return () => unsubscribe();
  }, []);

  const loadOrders = async () => {
    const initialOrders = await dataService.getOrders();
    setOrders(initialOrders.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await dataService.saveOrder({ ...order, status: newStatus, updated_date: new Date().toISOString() });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...order, status: newStatus });
      }
      toast.success(`Order status updated to ${newStatus}`);
    }
  };

  const filteredOrders = orders.filter(o => 
    (statusFilter === "all" || o.status === statusFilter) &&
    (o.order_number.toLowerCase().includes(search.toLowerCase()) ||
     o.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">Order Management</h1>
          <p className="text-slate-500 text-sm md:text-base">Track and manage all your customer transactions.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by order ID or customer name..."
            className="pl-12 h-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-12 rounded-2xl border-slate-100 bg-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            {["pending", "confirmed", "processing", "completed", "cancelled"].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="font-bold text-slate-900 whitespace-nowrap">Order ID</TableHead>
                <TableHead className="font-bold text-slate-900 whitespace-nowrap">Customer</TableHead>
                <TableHead className="font-bold text-slate-900 whitespace-nowrap">Date</TableHead>
                <TableHead className="font-bold text-slate-900 whitespace-nowrap">Items</TableHead>
                <TableHead className="font-bold text-slate-900 whitespace-nowrap">Total</TableHead>
                <TableHead className="font-bold text-slate-900 whitespace-nowrap">Status</TableHead>
                <TableHead className="font-bold text-slate-900 text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="font-mono text-xs font-bold text-slate-500 whitespace-nowrap">
                      {order.order_number}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{order.customer_name}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {format(new Date(order.created_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {order.items.reduce((acc, i) => acc + i.quantity, 0)} items
                    </TableCell>
                    <TableCell className="font-bold whitespace-nowrap">₹{order.total}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={`capitalize rounded-full px-3 py-0.5 border-none ${statusColors[order.status]}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full w-10 h-10 p-0 hover:bg-brand-500/10 hover:text-brand-500"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-display flex items-center justify-between">
              Order Details
              <Badge variant="outline" className={`capitalize rounded-full px-3 py-1 border-none ${selectedOrder ? statusColors[selectedOrder.status] : ""}`}>
                {selectedOrder?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-8 py-4">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Order Number</p>
                  <p className="font-bold font-mono">{selectedOrder.order_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Order Date</p>
                  <p className="font-bold">{format(new Date(selectedOrder.created_date), "MMMM d, yyyy h:mm a")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Customer</p>
                  <p className="font-bold">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-slate-500">{selectedOrder.customer_phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Shipping Address</p>
                  <p className="font-bold text-sm">{selectedOrder.customer_address || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Payment Method</p>
                  <p className="font-bold uppercase">{selectedOrder.payment_method}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Order Items</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x ₹{item.unit_price}</p>
                      </div>
                      <p className="font-bold">₹{item.total}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Discount</span>
                  <span className="text-red-400">-₹{selectedOrder.discount}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-3xl font-bold font-display text-brand-400">₹{selectedOrder.total}</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "pending", icon: Clock },
                    { id: "confirmed", icon: CheckCircle },
                    { id: "processing", icon: Package },
                    { id: "completed", icon: Truck },
                    { id: "cancelled", icon: XCircle },
                  ].map((s) => (
                    <Button
                      key={s.id}
                      variant={selectedOrder.status === s.id ? "default" : "outline"}
                      size="sm"
                      className={`rounded-xl capitalize ${selectedOrder.status === s.id ? "bg-brand-500" : ""}`}
                      onClick={() => updateStatus(selectedOrder.id, s.id as OrderStatus)}
                    >
                      <s.icon className="w-4 h-4 mr-2" />
                      {s.id}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
