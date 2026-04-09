import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Scissors, Mail, Lock, User as UserIcon, Phone, MapPin, Calendar, ArrowRight, CheckCircle2, Chrome } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { dataService } from "../services/dataService";
import { User } from "../types";

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    mobile: "",
    email: "",
    password: "",
    address: {
      flatNo: "",
      locality: "",
      city: "",
      state: "",
      pincode: ""
    }
  });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const user = await dataService.login(loginEmail, loginPassword);
      setIsLoading(false);
      if (user) {
        if (!user.emailVerified) {
          setMode('verify');
          return;
        }
        toast.success("Logged in successfully!");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || "Login failed. Please check your credentials.");
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (regStep < 3) {
      setRegStep(regStep + 1);
      return;
    }

    setIsLoading(true);
    try {
      const newUser: Partial<User> & { password?: string } = {
        firstName: regData.firstName,
        lastName: regData.lastName,
        name: `${regData.firstName} ${regData.lastName}`.trim(),
        email: regData.email,
        password: regData.password,
        age: parseInt(regData.age),
        mobile: regData.mobile,
        addresses: [{
          id: Math.random().toString(36).substr(2, 9),
          name: `${regData.firstName} ${regData.lastName}`.trim(),
          phone: regData.mobile,
          flatNo: regData.address.flatNo,
          locality: regData.address.locality,
          city: regData.address.city,
          state: regData.address.state,
          pincode: regData.address.pincode,
          type: 'Home',
          isDefault: true
        }]
      };

      await dataService.register(newUser);
      setIsLoading(false);
      setMode('verify');
      toast.success("Account created! Please verify your email.");
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || "Registration failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await dataService.loginWithGoogle();
      setIsLoading(false);
      if (user) {
        toast.success("Logged in with Google!");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Google login error:", error);
      toast.error(`Google login failed: ${error.message || "Unknown error"}`);
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
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#3a322b] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Scissors className="text-white w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#4a3f35] uppercase tracking-widest">
              KALAA
            </h1>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-[#3a322b]">Welcome Back</h2>
                  <p className="text-[#8c7e6d] text-sm">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#8c7e6d] text-xs">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10 h-12 border-slate-200 rounded-xl focus-visible:ring-[#3a322b]"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#8c7e6d] text-xs">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 border-slate-200 rounded-xl focus-visible:ring-[#3a322b]"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-xl text-base font-bold text-white transition-all"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <Button 
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50"
                >
                  <Chrome className="w-5 h-5" />
                  Google
                </Button>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setMode('register')}
                    className="text-[#3a322b] font-bold hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-[#3a322b]">Create Account</h2>
                  <p className="text-[#8c7e6d] text-sm">Step {regStep} of 3</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {regStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8c7e6d] text-xs">First Name</Label>
                          <Input 
                            placeholder="John"
                            className="h-12 border-slate-200 rounded-xl"
                            value={regData.firstName}
                            onChange={(e) => setRegData({...regData, firstName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8c7e6d] text-xs">Last Name</Label>
                          <Input 
                            placeholder="Doe"
                            className="h-12 border-slate-200 rounded-xl"
                            value={regData.lastName}
                            onChange={(e) => setRegData({...regData, lastName: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8c7e6d] text-xs">Age</Label>
                          <Input 
                            type="number"
                            placeholder="25"
                            className="h-12 border-slate-200 rounded-xl"
                            value={regData.age}
                            onChange={(e) => setRegData({...regData, age: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8c7e6d] text-xs">Mobile</Label>
                          <Input 
                            placeholder="9876543210"
                            className="h-12 border-slate-200 rounded-xl"
                            value={regData.mobile}
                            onChange={(e) => setRegData({...regData, mobile: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[#8c7e6d] text-xs">Flat No / Building</Label>
                        <Input 
                          placeholder="A-101, Sunshine Apt"
                          className="h-12 border-slate-200 rounded-xl"
                          value={regData.address.flatNo}
                          onChange={(e) => setRegData({...regData, address: {...regData.address, flatNo: e.target.value}})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#8c7e6d] text-xs">Locality / Area</Label>
                        <Input 
                          placeholder="Andheri West"
                          className="h-12 border-slate-200 rounded-xl"
                          value={regData.address.locality}
                          onChange={(e) => setRegData({...regData, address: {...regData.address, locality: e.target.value}})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#8c7e6d] text-xs">City</Label>
                          <Input 
                            placeholder="Mumbai"
                            className="h-12 border-slate-200 rounded-xl"
                            value={regData.address.city}
                            onChange={(e) => setRegData({...regData, address: {...regData.address, city: e.target.value}})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#8c7e6d] text-xs">Pincode</Label>
                          <Input 
                            placeholder="400001"
                            className="h-12 border-slate-200 rounded-xl"
                            value={regData.address.pincode}
                            onChange={(e) => setRegData({...regData, address: {...regData.address, pincode: e.target.value}})}
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[#8c7e6d] text-xs">Email Address</Label>
                        <Input 
                          type="email"
                          placeholder="email@example.com"
                          className="h-12 border-slate-200 rounded-xl"
                          value={regData.email}
                          onChange={(e) => setRegData({...regData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#8c7e6d] text-xs">Create Password</Label>
                        <Input 
                          type="password"
                          placeholder="••••••••"
                          className="h-12 border-slate-200 rounded-xl"
                          value={regData.password}
                          onChange={(e) => setRegData({...regData, password: e.target.value})}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {regStep > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setRegStep(regStep - 1)}
                        className="flex-1 h-12 rounded-xl border-slate-200"
                      >
                        Back
                      </Button>
                    )}
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-xl text-base font-bold text-white transition-all"
                    >
                      {isLoading ? "Processing..." : regStep < 3 ? "Next" : "Create Account"}
                    </Button>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{" "}
                  <button 
                    onClick={() => setMode('login')}
                    className="text-[#3a322b] font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </motion.div>
            )}

            {mode === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#3a322b]">Verify Your Email</h2>
                <p className="text-slate-500 leading-relaxed">
                  We've sent a verification link to your email. Please click the link to activate your account.
                </p>
                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-xl text-white font-bold"
                  >
                    I've Verified
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={async () => {
                      await dataService.sendVerification();
                      toast.success("Verification email resent!");
                    }}
                    className="w-full h-12 rounded-xl text-slate-400"
                  >
                    Resend Email
                  </Button>
                </div>
                <button 
                  onClick={() => setMode('login')}
                  className="text-sm text-slate-400 hover:text-[#3a322b] underline"
                >
                  Back to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
