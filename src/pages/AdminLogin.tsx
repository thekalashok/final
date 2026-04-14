import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { dataService } from "../services/dataService";

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = dataService.onAuthChange((user) => {
      if (user && (user.role === 'admin' || user.email === "rajukumbhar2323@gmail.com" || user.email === "admin@kalaa.com")) {
        localStorage.setItem("isAdminLoggedIn", "true");
        navigate("/admin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

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
            <p className="text-[#8c7e6d] text-sm">Sign in to access the admin panel.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8c7e6d] ml-1">Admin ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7e6d]" />
                <input 
                  type="text"
                  placeholder=""
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[#f5f0e8] bg-[#fdfbf7] focus:outline-none focus:ring-2 focus:ring-[#3a322b]/10 text-[#3a322b]"
                  id="admin-id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8c7e6d] ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7e6d]" />
                <input 
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[#f5f0e8] bg-[#fdfbf7] focus:outline-none focus:ring-2 focus:ring-[#3a322b]/10 text-[#3a322b]"
                  id="admin-password"
                />
              </div>
            </div>

            <Button 
              type="button"
              disabled={isLoading}
              onClick={async () => {
                const adminId = (document.getElementById('admin-id') as HTMLInputElement).value;
                const password = (document.getElementById('admin-password') as HTMLInputElement).value;
                
                if (adminId === "kalaa" && password === "Rajo@9321") {
                  setIsLoading(true);
                  try {
                    // We use a dummy email for Supabase auth that matches these credentials
                    const email = "admin@kalaa.com";
                    const user = await dataService.login(email, password);
                    console.log("Login success:", user);
                    if (user) {
                      localStorage.setItem("isAdminLoggedIn", "true");
                      toast.success("Welcome back, Admin!");
                      navigate("/admin");
                    }
                  } catch (error: any) {
                    console.error("Login error:", error);
                    // If the user doesn't exist in Supabase yet, we'll try to register it once
                    if (error.message?.includes("Invalid login credentials")) {
                      try {
                        await dataService.register({
                          email: "admin@kalaa.com",
                          password: "Rajo@9321",
                          name: "Kalaa Admin"
                        });
                        toast.success("Admin account initialized. Please sign in again.");
                      } catch (regError: any) {
                        toast.error(`Auth Error: ${regError.message}`);
                      }
                    } else if (error.message?.includes("Email not confirmed")) {
                      toast.error("Email not confirmed. Please confirm the user in Supabase Auth dashboard.");
                    } else {
                      toast.error(`Login failed: ${error.message}`);
                    }
                  } finally {
                    setIsLoading(false);
                  }
                } else {
                  toast.error("Invalid Admin ID or Password");
                }
              }}
              className="w-full h-14 rounded-2xl bg-[#3a322b] text-white font-bold hover:bg-[#4a3f35] transition-all shadow-lg shadow-[#3a322b]/10"
            >
              {isLoading ? "Authenticating..." : "Admin Login"}
            </Button>
          </div>

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
