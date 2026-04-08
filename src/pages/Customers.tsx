import { useState, useEffect } from "react";
import { Search, UserPlus, Eye, Mail, Phone, ShoppingBag } from "lucide-react";
import { dataService } from "../services/dataService";
import { Customer, Order } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import CustomerDetailDrawer from "../components/customers/CustomerDetailDrawer";
import { format } from "date-fns";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [initialCustomers, initialOrders] = await Promise.all([
        dataService.getCustomers(),
        dataService.getOrders()
      ]);
      setCustomers(initialCustomers);
      setOrders(initialOrders);
    };

    loadData();

    const unsubscribeCustomers = dataService.subscribe("CUSTOMERS", (newCustomers) => {
      setCustomers(newCustomers);
    });
    const unsubscribeOrders = dataService.subscribe("ORDERS", (newOrders) => {
      setOrders(newOrders);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerOrders = (customerName: string) => {
    return orders.filter(o => o.customer_name === customerName);
  };

  const getCustomerTotalSpend = (customerName: string) => {
    return getCustomerOrders(customerName).reduce((acc, o) => acc + o.total, 0);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display mb-2">Customer Base</h1>
          <p className="text-slate-500">View and manage your customer relationships and history.</p>
        </div>
        <Button 
          className="bg-brand-500 hover:bg-brand-600 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-brand-500/20"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search by name, phone, or email..."
          className="pl-12 h-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-brand-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-lg">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none">
              <TableHead className="font-bold text-slate-900">Customer</TableHead>
              <TableHead className="font-bold text-slate-900">Contact</TableHead>
              <TableHead className="font-bold text-slate-900">Total Orders</TableHead>
              <TableHead className="font-bold text-slate-900">Total Spend</TableHead>
              <TableHead className="font-bold text-slate-900">Last Order</TableHead>
              <TableHead className="font-bold text-slate-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => {
                const customerOrders = getCustomerOrders(customer.name);
                const lastOrder = customerOrders[0];
                
                return (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 font-bold">
                          {customer.name.substring(0, 1)}
                        </div>
                        <span className="font-bold">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full bg-slate-50 border-none font-bold">
                        {customerOrders.length} orders
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-brand-500">
                      ₹{getCustomerTotalSpend(customer.name)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {lastOrder ? format(new Date(lastOrder.created_date), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full w-10 h-10 p-0 hover:bg-brand-500/10 hover:text-brand-500"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerDetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        customer={selectedCustomer}
        orders={selectedCustomer ? getCustomerOrders(selectedCustomer.name) : []}
      />
    </div>
  );
}
