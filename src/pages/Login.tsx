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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const navigate = useNavigate();

  const handleSendOtp = async (e: FormEvent, selectedChannel: 'sms' | 'whatsapp') => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setChannel(selectedChannel);
    setIsLoading(true);
    const fullPhoneNumber = `+91${phoneNumber}`; // Assuming IN +91 as per image
    const success = await dataService.sendOTP(fullPhoneNumber, selectedChannel);
    setIsLoading(false);
    
    if (success) {
      setIsOtpSent(true);
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
      const user = await dataService.verifyOTP(fullPhoneNumber, otp);
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
            <motion.div
              key="phone-login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#3a322b] mb-1">Sign In / Sign Up</h2>
              </div>
              
              {!isOtpSent ? (
                <form className="space-y-6">
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

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="button"
                      onClick={(e) => handleSendOtp(e, 'sms')}
                      disabled={isLoading || phoneNumber.length < 10}
                      className="flex-1 bg-[#3a322b] hover:bg-[#4a3f35] h-12 rounded-md text-sm font-bold text-white transition-all"
                    >
                      {isLoading && channel === 'sms' ? "Sending..." : "Send SMS"}
                    </Button>
                    <Button 
                      type="button"
                      onClick={(e) => handleSendOtp(e, 'whatsapp')}
                      disabled={isLoading || phoneNumber.length < 10}
                      className="flex-1 bg-[#25D366] hover:bg-[#128C7E] h-12 rounded-md text-sm font-bold text-white transition-all"
                    >
                      {isLoading && channel === 'whatsapp' ? "Sending..." : "Send WhatsApp"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[#8c7e6d] ml-1">Enter OTP</Label>
                    <Input 
                      type="text"
                      placeholder="6-digit code"
                      className="h-14 rounded-2xl border-[#ece4d5] bg-[#fdfbf7] focus-visible:ring-[#9c27b0] text-center text-xl tracking-widest"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                    />
                    <p className="text-xs text-[#8c7e6d] text-center mt-2">
                      Sent to +91 {phoneNumber}
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-[#9c27b0] hover:bg-[#7b1fa2] h-12 rounded-md text-base font-bold text-white transition-all"
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="w-full text-sm text-[#8c7e6d] hover:text-[#3a322b] font-medium"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
