import { Order } from "../../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { format } from "date-fns";

interface RecentOrdersTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none">
              <TableHead className="font-bold text-slate-900 whitespace-nowrap">Order ID</TableHead>
              <TableHead className="font-bold text-slate-900 whitespace-nowrap">Customer</TableHead>
              <TableHead className="font-bold text-slate-900 whitespace-nowrap">Date</TableHead>
              <TableHead className="font-bold text-slate-900 whitespace-nowrap">Amount</TableHead>
              <TableHead className="font-bold text-slate-900 text-right whitespace-nowrap">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="font-mono text-xs font-bold text-slate-500 whitespace-nowrap">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{order.customer_name}</TableCell>
                  <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                    {format(new Date(order.created_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-bold whitespace-nowrap">₹{order.total}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Badge variant="outline" className={`capitalize rounded-full px-3 py-0.5 border-none ${statusColors[order.status]}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
