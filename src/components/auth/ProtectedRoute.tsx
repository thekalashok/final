import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { dataService } from "../../services/dataService";

export default function ProtectedRoute() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = dataService.onAuthChange((user) => {
      // Check for admin role from the user object
      const isUserAdmin = user?.role === 'admin' || user?.email === "rajukumbhar2323@gmail.com" || user?.email === "admin@kalaa.com";
      
      if (isUserAdmin) {
        localStorage.setItem("isAdminLoggedIn", "true");
        setIsAdmin(true);
      } else {
        // Fallback to localStorage if Supabase is still loading or table is missing
        const wasAdmin = localStorage.getItem("isAdminLoggedIn") === "true";
        setIsAdmin(wasAdmin);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
