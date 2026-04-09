import { useState, useEffect } from "react";
import { IndianRupee, ShoppingBag, Users, ShoppingCart, ArrowRight } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentOrdersTable from "../components/dashboard/RecentOrdersTable";
import { dataService } from "../services/dataService";
import { Order, Product, Customer } from "../types";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const unsubscribeOrders = dataService.subscribe("ORDERS", (newOrders) => {
      setOrders(newOrders);
    });
    const unsubscribeProducts = dataService.subscribe("PRODUCTS", (newProducts) => {
      setProducts(newProducts);
    });
    const unsubscribeCustomers = dataService.subscribe("CUSTOMERS", (newCustomers) => {
      setCustomers(newCustomers);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((acc, o) => acc + o.total, 0);
  
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const activeProducts = products.filter(p => p.status === "active").length;
  const totalCustomers = customers.length;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">Business Overview</h1>
          <p className="text-slate-500 text-sm md:text-base">Welcome back! Here's what's happening with your shop today.</p>
        </div>
        <Button 
          onClick={() => navigate("/admin/billing")}
          className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-brand-500/20"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue}`}
          icon={IndianRupee}
          trend={12.5}
          trendLabel="vs last month"
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Completed Orders"
          value={completedOrders}
          icon={ShoppingBag}
          trend={8.2}
          trendLabel="vs last month"
          color="bg-green-500/10 text-green-600"
        />
        <StatCard
          title="Active Products"
          value={activeProducts}
          icon={ShoppingCart}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          trend={5.4}
          trendLabel="new this week"
          color="bg-orange-500/10 text-orange-600"
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display">Recent Orders</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/orders")}
            className="text-brand-500 hover:text-brand-600 hover:bg-brand-500/5 font-bold"
          >
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <RecentOrdersTable orders={orders.slice(0, 5)} />
      </div>
    </div>
  );
}
