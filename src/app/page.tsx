"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChefHat, GraduationCap, Store, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { useStore } from "@/store/useStore";
import splashImg from "./splash.png";
import { motion } from "framer-motion";

export default function SplashPage() {
  const router = useRouter();
  const setUserRole = useStore((state) => state.setUserRole);

  const handleSelectRole = (role: 'student' | 'vendor') => {
    setUserRole(role);
    router.push("/login");
  };

  const handleVendorClick = () => {
    // Vendors must apply first — existing vendors can login via the link below
    router.push("/vendor/register");
  };

  return (
    <div className="flex flex-col min-h-screen p-8 bg-white relative overflow-hidden">
      {/* Top Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-extrabold tracking-tight">Pick N&apos; Go</h1>
        <div className="bg-primary/10 p-2 rounded-xl">
          <ChefHat className="text-primary" />
        </div>
      </motion.div>

      {/* Main Illustration */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-12 mb-8"
      >
        <Image 
          src={splashImg} 
          alt="Welcome Illustration" 
          className="rounded-[40px] shadow-2xl shadow-primary/10"
        />
      </motion.div>

      {/* Text Content */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-4"
      >
        <h2 className="text-4xl font-bold text-slate-900">Welcome</h2>
        <p className="text-slate-500 font-medium">
          Delicious food from your campus kitchens, delivered to your spot.
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-auto space-y-4 pt-8"
      >
        <p className="text-center text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-6">
          SIGN IN AS
        </p>
        
        <Button onClick={() => handleSelectRole('student')}>
          <GraduationCap size={20} /> Student
          <div className="ml-auto opacity-50 bg-white/20 p-1 rounded-lg">
            <ChefHat size={14} className="rotate-12" />
          </div>
        </Button>

        <Button variant="outline" onClick={() => { setUserRole('vendor'); router.push("/login"); }}>
          <Store size={20} /> Vendor Login
          <div className="ml-auto opacity-30 bg-slate-100 p-1 rounded-lg">
            <Store size={14} />
          </div>
        </Button>

        <button
          onClick={handleVendorClick}
          className="w-full text-center text-[11px] font-bold text-slate-400 py-1 hover:text-primary transition-colors"
        >
          New vendor? <span className="text-primary underline">Apply for an account</span>
        </button>

        <button
          onClick={() => {
            setUserRole('admin');
            router.push("/login");
          }}
          className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest py-3 hover:text-primary transition-colors"
        >
          <ShieldCheck size={14} /> Admin Login
        </button>
      </motion.div>
    </div>
  );
}
