import { Customer, Order } from "../../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { format } from "date-fns";
import { User, Phone, Mail, MapPin, ShoppingBag, IndianRupee } from "lucide-react";

interface CustomerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  orders: Order[];
}

export default function CustomerDetailDrawer({ open, onOpenChange, customer, orders }: CustomerDetailDrawerProps) {
  if (!customer) return null;

  const totalSpend = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none bg-slate-50">
        <div className="p-8 bg-white border-b border-slate-100">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-bold font-display">Customer Profile</SheetTitle>
          </SheetHeader>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-500 rounded-[2rem] flex items-center justify-center text-white text-3xl font-bold font-display shadow-xl shadow-brand-500/20">
              {customer.name.substring(0, 1)}
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">{customer.name}</h3>
              <p className="text-slate-500 text-sm">Customer since {format(new Date(customer.created_date), "MMM yyyy")}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-grow p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm space-y-1">
                <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold font-display">{totalOrders}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Total Orders</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm space-y-1">
                <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 mb-2">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold font-display">₹{totalSpend}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Total Spend</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="font-medium">{customer.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Address</p>
                    <p className="font-medium">{customer.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Order History</h4>
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No orders yet</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">{order.order_number}</p>
                        <p className="text-xs text-slate-400">{format(new Date(order.created_date), "MMM d, yyyy")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">₹{order.total}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize border-slate-100">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {customer.notes && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Notes</h4>
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-sm text-yellow-800">
                  {customer.notes}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
