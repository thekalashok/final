import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { dataService } from "../services/dataService";

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await dataService.getCurrentUser();
      if (user && user.role === 'admin') {
        navigate("/admin");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await dataService.login(adminId, password);
      if (success) {
        toast.success("Login successful!");
        navigate("/admin");
      } else {
        toast.error("Invalid Admin ID or Password");
      }
    } catch (error: any) {
      toast.error("An error occurred during login");
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
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#3a322b] mb-2">Admin Authentication</h2>
            <p className="text-[#8c7e6d] text-sm">Enter your credentials to access the admin panel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#3a322b] uppercase tracking-wider ml-1">Admin ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7e6d]" />
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter Admin ID"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[#f5f0e8] bg-[#fdfbf7] text-[#3a322b] focus:outline-none focus:border-[#3a322b] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#3a322b] uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7e6d]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[#f5f0e8] bg-[#fdfbf7] text-[#3a322b] focus:outline-none focus:border-[#3a322b] transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-[#3a322b] text-white font-bold flex items-center justify-center gap-3 hover:bg-[#4a423b] transition-all shadow-lg shadow-[#3a322b]/20"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
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
