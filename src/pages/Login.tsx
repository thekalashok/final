import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Scissors } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";

import { dataService } from "../services/dataService";

export default function Login() {
  const [step, setStep] = useState<'phone' | 'details' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [profileData, setProfileData] = useState({ name: "", email: "", gender: "" });
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    const fullPhoneNumber = `+91${phoneNumber}`;
    const exists = await dataService.checkUserExists(fullPhoneNumber);
    setIsLoading(false);

    if (exists) {
      // User exists, go straight to sending OTP
      handleSendOtp(fullPhoneNumber, 'sms'); // Default to SMS for existing users, or we could ask
    } else {
      // New user, ask for details first
      setStep('details');
    }
  };

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profileData.name || !profileData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const fullPhoneNumber = `+91${phoneNumber}`;
    handleSendOtp(fullPhoneNumber, 'sms'); // Default to SMS, or we can add buttons here too
  };

  const handleSendOtp = async (fullPhoneNumber: string, selectedChannel: 'sms' | 'whatsapp') => {
    setChannel(selectedChannel);
    setIsLoading(true);
    const success = await dataService.sendOTP(fullPhoneNumber, selectedChannel);
    setIsLoading(false);
    
    if (success) {
      setStep('otp');
      toast.success(`OTP sent successfully via ${selectedChannel.toUpperCase()}!`);
    } else {
      toast.error("Failed to send OTP. Please check backend configuration.");
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid OTP");
      return;
    }

    setIsLoading(true);
    const fullPhoneNumber = `+91${phoneNumber}`;
    try {
      const user = await dataService.verifyOTP(fullPhoneNumber, otp, profileData);
      setIsLoading(false);
      
      if (user) {
        toast.success("Logged in successfully!");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || "Invalid OTP or verification failed");
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
              Join our community of craft lovers
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#3a322b] mb-1">Sign In / Sign Up</h2>
                </div>
                
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex gap-4">
                      <div className="w-24">
                        <Label className="text-[#8c7e6d] text-xs">Country</Label>
                        <div className="h-12 border-b border-[#ece4d5] flex items-center font-bold text-[#3a322b]">
                          IN +91
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-[#8c7e6d] text-xs">Phone Number</Label>
                        <Input 
                          type="tel"
                          placeholder="Phone Number"
                          className="h-12 border-0 border-b border-[#ece4d5] rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-[#9c27b0] text-lg"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading || phoneNumber.length < 10}
                    className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-md text-base font-bold text-white transition-all"
                  >
                    {isLoading ? "Checking..." : "Continue"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div
                key="details-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#3a322b] mb-1">Welcome to KALAA</h2>
                  <div className="flex items-center gap-2 text-sm text-[#8c7e6d]">
                    <span>Mobile Number: 91{phoneNumber}</span>
                    <button onClick={() => setStep('phone')} className="text-[#9c27b0] font-medium hover:underline">Edit</button>
                  </div>
                  <p className="text-xs text-[#8c7e6d] mt-2">OTP will be sent to this number for verification</p>
                </div>
                
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Input 
                        type="email"
                        placeholder="Email ID*"
                        required
                        className="h-12 bg-[#fdfbf7] border-[#ece4d5] focus-visible:ring-[#9c27b0]"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Input 
                        type="text"
                        placeholder="Name*"
                        required
                        className="h-12 bg-[#fdfbf7] border-[#ece4d5] focus-visible:ring-[#9c27b0]"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <Label className="text-[#8c7e6d] text-xs">Gender</Label>
                      <div className="flex gap-3">
                        {['Female', 'Male', 'Other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setProfileData({...profileData, gender: g})}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                              profileData.gender === g 
                                ? 'border-[#3a322b] bg-[#3a322b] text-white' 
                                : 'border-[#ece4d5] text-[#4a3f35] hover:border-[#3a322b]'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#8c7e6d] text-center">
                    By Signing Up, I agree to <a href="#" className="text-[#9c27b0]">Terms & Conditions</a> and <a href="#" className="text-[#9c27b0]">Privacy Policy</a>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading || !profileData.name || !profileData.email}
                    className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-md text-base font-bold text-white transition-all"
                  >
                    {isLoading ? "Sending OTP..." : "Continue"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#3a322b] mb-1">Join KALAA</h2>
                  <p className="text-[#8c7e6d] text-sm">
                    Please enter OTP sent to 91{phoneNumber}
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <div className="relative">
                      <Input 
                        type="text"
                        placeholder="OTP"
                        className="h-14 bg-[#fdfbf7] border-[#ece4d5] text-xl tracking-widest font-mono pl-4 pr-24"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                      />
                      <button 
                        type="button"
                        onClick={() => handleSendOtp(`+91${phoneNumber}`, channel)}
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9c27b0] hover:text-[#7b1fa2] disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                    <p className="text-xs text-[#8c7e6d] mt-2">Expires in 5:00</p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-md text-base font-bold text-white transition-all"
                  >
                    {isLoading ? "Verifying..." : "Start Shopping"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
