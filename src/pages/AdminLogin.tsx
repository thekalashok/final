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
      if (user && (user.role === 'admin' || user.email === "rajukumbhar2323@gmail.com")) {
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
            <p className="text-[#8c7e6d] text-sm">Please sign in with your authorized Google account to access the admin panel.</p>
          </div>

          <Button 
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              try {
                await dataService.loginWithGoogle();
                // Redirection happens
              } catch (error) {
                toast.error("An error occurred during Google login");
                setIsLoading(false);
              }
            }}
            className="w-full h-14 rounded-2xl border-[#f5f0e8] text-[#3a322b] font-bold flex items-center justify-center gap-3 hover:bg-[#fdfbf7] transition-all"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-[#3a322b]/30 border-t-[#3a322b] rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Admin Login
              </>
            )}
          </Button>

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
