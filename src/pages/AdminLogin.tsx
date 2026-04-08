import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { dataService } from "../services/dataService";

export default function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = dataService.getCurrentUser();
      // For now, we'll use the same localStorage flag or a better check
      if (localStorage.getItem("isAdminLoggedIn") === "true") {
        navigate("/admin");
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // We use the same email/password for admin in this simple setup
      // In a real app, we'd check the 'role' field in the user document
      const user = await dataService.login(adminId, password);
      
      if (user) {
        // Here we should ideally check if user.role === 'admin'
        // For now, we'll keep the hardcoded check for the specific admin account
        if (adminId === "admin@kalaa.com" || adminId === "rajukumbhar2323@gmail.com") {
          localStorage.setItem("isAdminLoggedIn", "true");
          toast.success("Welcome back, Admin!");
          navigate("/admin");
        } else {
          toast.error("You do not have admin privileges.");
          await dataService.logout();
        }
      } else {
        toast.error("Invalid Admin ID or Password");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#3a322b] text-white mb-6 shadow-xl shadow-[#3a322b]/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-widest text-[#3a322b] uppercase mb-2">
            KALAA
          </h1>
          <p className="text-[#8c7e6d] tracking-[0.2em] text-xs uppercase font-medium">
            Admin Control Center
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#3a322b]/5 border border-[#f5f0e8]">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8c7e6d] ml-1">
                Admin ID
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7e6d] transition-colors group-focus-within:text-[#3a322b]" />
                <Input
                  type="text"
                  placeholder="Enter your admin ID"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-[#f5f0e8] bg-[#fdfbf7] focus-visible:ring-[#3a322b] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8c7e6d] ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7e6d] transition-colors group-focus-within:text-[#3a322b]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-[#f5f0e8] bg-[#fdfbf7] focus-visible:ring-[#3a322b] transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#3a322b] hover:bg-[#4a3f35] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#3a322b]/20 transition-all group"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Access Panel</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#f5f0e8] text-center">
            <div className="flex items-center justify-center gap-2 text-[#8c7e6d] text-xs font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Secure Admin Access Only</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[#8c7e6d] text-xs">
          &copy; 2026 KALAA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
