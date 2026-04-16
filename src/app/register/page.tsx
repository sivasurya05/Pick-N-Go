"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Mail, Lock, User, Loader2,
  Utensils, Eye, EyeOff, Phone, CheckCircle2, MailCheck
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName,         setFullName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [phone,            setPhone]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  // "idle" | "pending_verification"
  const [stage, setStage] = useState<"form" | "verify">("form");

  const handleRegister = async () => {
    if (!fullName.trim()) return setError("Please enter your full name");
    if (!email)           return setError("Please enter your email address");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword)     return setError("Passwords do not match");

    setLoading(true);
    setError("");

    try {
      // 1. Create auth user — Supabase sends a verification email automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'student' },
          // DO NOT pass emailRedirectTo here — default Supabase confirmation is enough
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert profile row immediately (unconfirmed user still gets a UUID)
        //    If email confirmation is required, user won't be able to log in until confirmed.
        const { error: profileError } = await supabase.from('profiles').insert({
          id:        authData.user.id,
          role:      'student',
          full_name: fullName.trim(),
          email:     email.toLowerCase(),
          phone:     phone || null,
        });
        // Ignore duplicate key errors (user may have been partially created before)
        if (profileError && !profileError.message.includes('duplicate')) {
          throw profileError;
        }

        // 3. Show email verification screen — DO NOT redirect to /home yet
        setStage("verify");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError("This email is already registered. Try logging in.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Email verification screen ───────────────────────────── */
  if (stage === "verify") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-6"
        >
          <MailCheck size={56} strokeWidth={1.5} />
        </motion.div>

        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Check your email!</h2>
          <p className="text-slate-500 font-medium text-sm px-4 mb-1">
            We sent a verification link to
          </p>
          <p className="text-primary font-black text-sm mb-6">{email}</p>
          <p className="text-slate-400 font-medium text-xs px-6 leading-relaxed mb-8">
            Click the link in the email to verify your account. Come back and log in once verified.
          </p>
        </motion.div>

        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full space-y-3">
          <Button onClick={() => router.push("/login")}>
            <CheckCircle2 size={18} /> Go to Login
          </Button>
          <button
            onClick={async () => {
              await supabase.auth.resend({ type: 'signup', email });
              alert("Verification email resent!");
            }}
            className="w-full text-sm font-bold text-slate-400 py-3 hover:text-primary transition-colors"
          >
            Didn't get it? Resend email
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Registration form ───────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen p-6 bg-white overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-2xl text-slate-600 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Register</h2>
        <div className="w-10" />
      </div>

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-8">
        <div className="inline-flex p-5 bg-slate-50 rounded-[32px] text-primary mb-4">
          <Utensils size={40} />
        </div>
        <h1 className="text-2xl font-extrabold mb-1">Create Account</h1>
        <p className="text-slate-500 font-medium text-sm px-4">Join Pick N&apos; Go — student access</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
          <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Enter your full name" icon={<User size={18} />} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" icon={<Mail size={18} />} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Phone <span className="text-slate-300 normal-case font-medium">(Optional)</span>
          </label>
          <Input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="10-digit mobile number" icon={<Phone size={18} />} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" icon={<Lock size={18} />} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
          <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password" icon={<Lock size={18} />} />
        </div>

        <div className="pt-4 pb-8">
          <Button onClick={handleRegister} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Create Account →"}
          </Button>
          <p className="text-center text-sm text-slate-400 font-medium pt-4">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="text-primary font-bold hover:underline">Login</button>
          </p>
        </div>
      </div>
    </div>
  );
}
