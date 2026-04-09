import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Package, CheckCircle2, Clock, XCircle, Truck, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { dataService } from "../services/dataService";
import { Order, OrderStatus } from "../types";
import { Link } from "react-router-dom";

const STATUS_STEPS: { id: OrderStatus; label: string; icon: any }[] = [
  { id: "pending", label: "Order Placed", icon: Clock },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "processing", label: "Processing", icon: Package },
  { id: "completed", label: "Delivered", icon: Truck },
];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const foundOrder = await dataService.getOrderByNumber(orderNumber.trim());
      setOrder(foundOrder);
      if (!foundOrder) {
        toast.error("Order not found. Please check the number and try again.");
      }
    } catch (error) {
      toast.error("Failed to track order. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndex = (status: OrderStatus) => {
    if (status === "cancelled") return -1;
    return STATUS_STEPS.findIndex((s) => s.id === status);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-[#8c7e6d] hover:text-[#3a322b] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-[#3a322b]/5 p-8 md:p-12 border border-[#ece4d5]">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#3a322b] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Search className="text-white w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#4a3f35] mb-2">
              Track Your Order
            </h1>
            <p className="text-[#8c7e6d]">
              Enter your order number to see the current status of your shipment.
            </p>
          </div>

          <form onSubmit={handleTrack} className="max-w-md mx-auto mb-12">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="orderNumber" className="sr-only">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g. ORD-12345"
                  className="h-12 border-slate-200 rounded-xl focus-visible:ring-[#3a322b]"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#3a322b] hover:bg-[#4a3f35] h-12 px-8 rounded-xl text-white font-bold transition-all"
              >
                {isLoading ? "Searching..." : "Track"}
              </Button>
            </div>
          </form>

          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3a322b]"></div>
            </div>
          )}

          {!isLoading && hasSearched && !order && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">Order Not Found</h3>
              <p className="text-slate-500 text-sm mt-1">
                We couldn't find an order with that number.
              </p>
            </motion.div>
          )}

          {!isLoading && order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">Order Number</p>
                    <p className="text-xl font-bold text-[#3a322b]">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium mb-1">Order Date</p>
                    <p className="text-[#3a322b] font-medium">
                      {new Date(order.created_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {order.status === 'cancelled' ? (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                    <XCircle className="w-6 h-6" />
                    <div>
                      <p className="font-bold">Order Cancelled</p>
                      <p className="text-sm text-red-500">This order has been cancelled.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative pt-8 pb-4">
                    <div className="absolute top-12 left-0 w-full h-1 bg-slate-200 rounded-full -z-10"></div>
                    <div 
                      className="absolute top-12 left-0 h-1 bg-[#3a322b] rounded-full -z-10 transition-all duration-500"
                      style={{ 
                        width: `${(Math.max(0, getStatusIndex(order.status)) / (STATUS_STEPS.length - 1)) * 100}%` 
                      }}
                    ></div>
                    
                    <div className="flex justify-between">
                      {STATUS_STEPS.map((step, index) => {
                        const isCompleted = getStatusIndex(order.status) >= index;
                        const isCurrent = getStatusIndex(order.status) === index;
                        const Icon = step.icon;
                        
                        return (
                          <div key={step.id} className="flex flex-col items-center relative">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                                isCompleted 
                                  ? 'bg-[#3a322b] text-white shadow-md' 
                                  : 'bg-white border-2 border-slate-200 text-slate-400'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <p className={`text-xs md:text-sm font-medium text-center ${
                              isCurrent ? 'text-[#3a322b] font-bold' : 
                              isCompleted ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-[#3a322b] mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-slate-400" />
                    Order Details
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.quantity}x {item.product_name}</span>
                        <span className="font-medium text-[#3a322b]">₹{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between font-bold">
                      <span className="text-[#3a322b]">Total</span>
                      <span className="text-[#3a322b]">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-[#3a322b] mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-slate-400" />
                    Shipping Details
                  </h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p className="font-medium text-[#3a322b]">{order.customer_name}</p>
                    <p>{order.customer_phone}</p>
                    <p className="whitespace-pre-wrap mt-2">{order.customer_address}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
