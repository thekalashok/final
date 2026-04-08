import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, ArrowRight, Scissors, Phone, MapPin, Calendar, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";

import { dataService } from "../services/dataService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState(1);
  const navigate = useNavigate();

  // Registration states
  const [regData, setRegData] = useState({
    name: "",
    age: "",
    mobile: "",
    address: "",
    email: "",
    password: ""
  });

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const user = await dataService.login(email, password);
    if (user) {
      toast.success("Logged in successfully!");
      setTimeout(() => navigate("/"), 1000);
    } else {
      toast.error("Invalid email or password");
    }
  };

  const handleRegNext = async () => {
    if (regStep === 1) {
      if (!regData.name || !regData.age || !regData.mobile || !regData.address) {
        toast.error("Please fill in all personal details");
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!regData.email || !regData.password) {
        toast.error("Please set your email and password");
        return;
      }
      
      try {
        // Final step: Register
        await dataService.register({
          name: regData.name,
          email: regData.email,
          password: regData.password,
          age: parseInt(regData.age),
          mobile: regData.mobile,
          addresses: [regData.address]
        });
        
        toast.success("Account created successfully! You can now sign in.");
        
        // Switch to login view
        setEmail(regData.email);
        setIsLogin(true);
        setRegStep(1);
        
        // Reset registration data
        setRegData({
          name: "",
          age: "",
          mobile: "",
          address: "",
          email: "",
          password: ""
        });
      } catch (error) {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await dataService.loginWithGoogle();
      if (user) {
        toast.success("Logged in with Google successfully!");
        setTimeout(() => navigate("/"), 1000);
      } else {
        toast.error("Google login failed");
      }
    } catch (error) {
      toast.error("An error occurred during Google login");
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
      <Toaster position="top-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-[#3a322b]/5 p-8 md:p-12 border border-[#ece4d5]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#3a322b] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Scissors className="text-white w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#4a3f35] uppercase tracking-widest">
              KALAA
            </h1>
            <p className="text-[#8c7e6d] text-sm mt-2 text-center">
              {isLogin ? "Welcome back to our artisanal world" : "Join our community of craft lovers"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLoginSubmit} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#8c7e6d] ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-12 h-14 rounded-2xl border-[#ece4d5] bg-[#fdfbf7] focus-visible:ring-[#b0966a]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" title="password" className="text-[#8c7e6d] ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                    <Input 
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 rounded-2xl border-[#ece4d5] bg-[#fdfbf7] focus-visible:ring-[#b0966a]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-14 rounded-2xl text-lg font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#ece4d5]"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-[#8c7e6d]">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full h-14 rounded-2xl border-[#ece4d5] text-[#4a3f35] font-bold flex items-center justify-center gap-3 hover:bg-[#fdfbf7] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Login
                </Button>
              </motion.form>
            ) : (
              <motion.div 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <div className={`w-8 h-2 rounded-full ${regStep >= 1 ? "bg-[#b0966a]" : "bg-[#ece4d5]"}`} />
                    <div className={`w-8 h-2 rounded-full ${regStep >= 2 ? "bg-[#b0966a]" : "bg-[#ece4d5]"}`} />
                  </div>
                  <span className="text-xs font-bold text-[#8c7e6d] uppercase tracking-widest">
                    {regStep === 1 ? "Personal Details" : "Sign In Option"}
                  </span>
                </div>

                {regStep === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#8c7e6d] ml-1">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                        <Input 
                          placeholder="Your Name"
                          className="pl-12 h-12 rounded-xl border-[#ece4d5] bg-[#fdfbf7]"
                          value={regData.name}
                          onChange={(e) => setRegData({...regData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#8c7e6d] ml-1">Age</Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                          <Input 
                            type="number"
                            placeholder="Age"
                            className="pl-12 h-12 rounded-xl border-[#ece4d5] bg-[#fdfbf7]"
                            value={regData.age}
                            onChange={(e) => setRegData({...regData, age: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#8c7e6d] ml-1">Mobile</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                          <Input 
                            placeholder="Phone"
                            className="pl-12 h-12 rounded-xl border-[#ece4d5] bg-[#fdfbf7]"
                            value={regData.mobile}
                            onChange={(e) => setRegData({...regData, mobile: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8c7e6d] ml-1">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                        <Input 
                          placeholder="Full Address"
                          className="pl-12 h-12 rounded-xl border-[#ece4d5] bg-[#fdfbf7]"
                          value={regData.address}
                          onChange={(e) => setRegData({...regData, address: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#8c7e6d] ml-1">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                        <Input 
                          type="email"
                          placeholder="name@example.com"
                          className="pl-12 h-12 rounded-xl border-[#ece4d5] bg-[#fdfbf7]"
                          value={regData.email}
                          onChange={(e) => setRegData({...regData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#8c7e6d] ml-1">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c8b594]" />
                        <Input 
                          type="password"
                          placeholder="••••••••"
                          className="pl-12 h-12 rounded-xl border-[#ece4d5] bg-[#fdfbf7]"
                          value={regData.password}
                          onChange={(e) => setRegData({...regData, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {regStep === 2 && (
                    <Button 
                      variant="outline"
                      onClick={() => setRegStep(1)}
                      className="flex-1 h-12 rounded-xl border-[#ece4d5]"
                    >
                      Back
                    </Button>
                  )}
                  <Button 
                    onClick={handleRegNext}
                    className="flex-[2] bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                  >
                    {regStep === 1 ? "Next: Sign In Option" : "Complete Registration"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setRegStep(1);
              }}
              className="text-[#b0966a] font-bold hover:underline"
            >
              {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate("/")}
            className="text-[#8c7e6d] text-sm hover:text-[#3a322b] transition-colors"
          >
            ← Back to Shop
          </button>
        </div>
      </motion.div>
    </div>
  );
}
