import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, Receipt, ExternalLink, LogOut, Scissors } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { dataService } from "../../services/dataService";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Receipt, label: "Billing", path: "/admin/billing" },
  { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
  { icon: Users, label: "Customers", path: "/admin/customers" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dataService.logout();
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/admin/login");
    if (onNavigate) onNavigate();
  };

  return (
    <div className="w-full lg:w-60 h-full bg-slate-900 text-white flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
          <Scissors className="text-white w-6 h-6" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">KALAA</span>
      </div>

      <nav className="flex-grow px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
          onClick={() => {
            navigate("/");
            if (onNavigate) onNavigate();
          }}
        >
          <ExternalLink className="w-5 h-5 mr-3" />
          View Shop
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
