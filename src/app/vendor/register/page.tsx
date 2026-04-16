"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, Mail, Phone, User, ArrowLeft, Loader2,
  FileText, CheckCircle2, MailCheck, ChefHat, Lock, Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function VendorRegisterPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "submitted">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    shop_name:        "",
    owner_name:       "",
    email:            "",
    phone:            "",
    description:      "",
    password:         "",
    confirm_password: "",
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleApply = async () => {
    if (!form.shop_name.trim())       return setError("Please enter your shop / stall name.");
    if (!form.owner_name.trim())      return setError("Please enter the owner's full name.");
    if (!form.email)                  return setError("Please enter a contact email.");
    if (!form.email.includes('@'))    return setError("Please enter a valid email address.");
    if (form.password.length < 6)     return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm_password) return setError("Passwords do not match.");

    setLoading(true);
    setError("");

    try {
      // 1. Create auth account — Supabase handles password hashing securely.
      //    The profile is NOT created yet; admin must approve first.
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email.toLowerCase().trim(),
        password: form.password,
        options: {
          data: { full_name: form.shop_name.trim(), role: 'vendor_pending' },
        },
      });

      if (authErr) {
        if (authErr.message.includes('already registered')) {
          setError("An account with this email already exists. Try logging in, or contact admin.");
        } else {
          throw authErr;
        }
        setLoading(false);
        return;
      }

      // 2. Insert application record (profile created only after admin approves)
      const { error: dbErr } = await supabase.from('vendor_applications').insert({
        shop_name:   form.shop_name.trim(),
        owner_name:  form.owner_name.trim(),
        email:       form.email.toLowerCase().trim(),
        phone:       form.phone || null,
        description: form.description.trim() || null,
        status:      'pending',
        admin_note:  authData.user ? `auth_uid:${authData.user.id}` : null,
      });

      if (dbErr && !dbErr.message.includes('duplicate')) {
        throw dbErr;
      }

      // 3. Sign out immediately — vendor cannot log in until admin approves
      await supabase.auth.signOut();

      setStage("submitted");
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Submitted screen ─────────────────────────────────── */
  if (stage === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-6"
        >
          <MailCheck size={52} strokeWidth={1.5} />
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 font-medium text-sm px-4 leading-relaxed mb-2">
            Your application for <span className="font-black text-slate-800">{form.shop_name}</span> has been sent for review.
          </p>
          <p className="text-slate-400 text-xs font-medium px-6 leading-relaxed mb-2">
            Check <span className="text-primary font-bold">{form.email}</span> for a verification link from Supabase.
          </p>
          <p className="text-slate-400 text-xs font-medium px-6 leading-relaxed mb-8">
            Once the admin approves your application, you can log in with the password you just set.
          </p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full">
          <Button onClick={() => router.push("/login")}>
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ── Application form ─────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-black text-slate-800">Vendor Application</h2>
        <div className="w-10" />
      </div>

      <div className="px-5 pt-2 space-y-4">
        {/* Hero */}
        <div className="bg-slate-900 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <div className="w-11 h-11 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-3">
              <ChefHat size={22} />
            </div>
            <h1 className="text-xl font-black text-white mb-1">Join Pick N&apos; Go</h1>
            <p className="text-white/50 text-xs font-medium leading-relaxed">
              Apply to sell food on campus. Admin will review and activate your account.
            </p>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Shop Details ──────────────────────────────── */}
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 pt-1">Shop Details</p>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Shop / Stall Name *</label>
          <Input value={form.shop_name} onChange={e => update('shop_name', e.target.value)}
            placeholder="e.g. Spice Garden, The Wrap Co." icon={<Store size={18} />} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Owner's Full Name *</label>
          <Input value={form.owner_name} onChange={e => update('owner_name', e.target.value)}
            placeholder="Your full name" icon={<User size={18} />} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
            Phone <span className="text-slate-300 normal-case font-medium">(Optional)</span>
          </label>
          <Input type="tel" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)}
            placeholder="10-digit mobile" icon={<Phone size={18} />} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
            What do you sell? <span className="text-slate-300 normal-case font-medium">(Optional)</span>
          </label>
          <div className="relative">
            <FileText size={16} className="absolute left-4 top-4 text-slate-400" />
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              rows={3} placeholder="Briefly describe your menu — biryani, rolls, juices..."
              className="w-full pl-11 pr-4 pt-3.5 pb-3 bg-white border border-slate-100 rounded-2xl font-medium text-sm text-slate-700 outline-none focus:border-primary/30 shadow-sm resize-none"
            />
          </div>
        </div>

        {/* ── Account Credentials ───────────────────────── */}
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 pt-2">Account Credentials</p>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Email Address *</label>
          <Input type="email" value={form.email} onChange={e => update('email', e.target.value)}
            placeholder="your@email.com" icon={<Mail size={18} />} />
          <p className="text-[9px] text-slate-400 font-medium mt-1 ml-1">You'll use this to log in after approval</p>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Password *</label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Min. 6 characters" icon={<Lock size={18} />} />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Confirm Password *</label>
          <div className="relative">
            <Input type={showConfirm ? "text" : "password"} value={form.confirm_password}
              onChange={e => update('confirm_password', e.target.value)}
              placeholder="Re-enter your password" icon={<Lock size={18} />} />
            <button type="button" onClick={() => setShowConfirm(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="flex gap-2.5 items-start p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
          <CheckCircle2 size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
            Your account will be created but <strong>login will only work after admin approves</strong> your application. You'll use your chosen password to log in after approval.
          </p>
        </div>
      </div>

      {/* Sticky Submit */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto px-5 py-4 pb-7 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <Button onClick={handleApply} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <><Store size={18} /> Submit Application</>}
        </Button>
      </div>
    </div>
  );
}
