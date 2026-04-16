"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Mail, Lock, Loader2, Utensils, Eye, EyeOff, Store, GraduationCap, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const userRole = useStore(s => s.userRole);
  const setProfile = useStore(s => s.setProfile);
  const profile   = useStore(s => s.profile);

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [restoring, setRestoring]   = useState(true);
  const [error, setError]           = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ── Auto-restore session on mount ────────────────────── */
  useEffect(() => {
    const restore = async () => {
      // If we already have a profile in the store, redirect immediately
      if (profile) {
        redirectByRole(profile.role);
        return;
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (p) {
          setProfile(p);
          redirectByRole(p.role);
          return;
        }
      }
      setRestoring(false);
    };
    restore();
  }, []);

  const redirectByRole = (role: string) => {
    if (role === 'admin')  router.push('/admin');
    else if (role === 'vendor') router.push('/vendor/dashboard');
    else router.push('/home');
  };

  const handleLogin = async () => {
    if (!email)    return setError("Please enter your email address");
    if (!password) return setError("Please enter your password");

    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        // Block login if email not yet confirmed
        if (!authData.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setError("Please verify your email before logging in. Check your inbox for the confirmation link.");
          setLoading(false);
          return;
        }

        const { data: p, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (pErr || !p) {
          // Profile row missing — auto-create based on userRole selected on splash
          const fallbackRole = userRole === 'vendor' ? 'vendor' : userRole === 'admin' ? 'admin' : 'student';
          const { data: newProfile, error: createErr } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              role: fallbackRole,
              full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
              email: authData.user.email,
            })
            .select()
            .single();

          if (createErr) throw new Error("Could not create profile: " + createErr.message);
          setProfile(newProfile);
          redirectByRole(newProfile.role);
          return;
        }

        // Warn if role mismatch (but don't block — admin can log in from any tab)
        if (userRole && p.role !== userRole && p.role !== 'admin') {
          setError(`Note: This account is a "${p.role}" account. Redirecting...`);
          await new Promise(r => setTimeout(r, 1200));
        }

        setProfile(p);
        redirectByRole(p.role);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Invalid login credentials')) {
        setError("Wrong email or password. Please try again.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, { icon: any; label: string; color: string }> = {
    student: { icon: GraduationCap, label: "Student",  color: "text-primary"      },
    vendor:  { icon: Store,         label: "Vendor",   color: "text-emerald-500"  },
    admin:   { icon: ShieldCheck,   label: "Admin",    color: "text-amber-500"    },
  };
  const roleInfo = userRole ? roleLabels[userRole] : null;

  if (restoring) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-2xl text-slate-600 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Login</h2>
        <div className="w-10" />
      </div>

      {/* Icon + heading */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-8">
        <div className="inline-flex p-6 bg-slate-50 rounded-[32px] text-primary mb-5">
          <Utensils size={44} />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Welcome back!</h1>

        {/* Show selected role badge */}
        {roleInfo && (
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${roleInfo.color} bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full mb-2`}>
            <roleInfo.icon size={11} /> Signing in as {roleInfo.label}
          </div>
        )}

        <p className="text-slate-400 font-medium text-sm px-6">
          Enter your credentials to continue
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-5 p-4 rounded-2xl text-xs font-bold text-center ${
            error.startsWith('Note:') ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="your@email.com"
            icon={<Mail size={18} />}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your password"
              icon={<Lock size={18} />}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button onClick={handleLogin} disabled={loading} className="mt-2">
          {loading ? <Loader2 className="animate-spin" /> : "Login Now →"}
        </Button>

        {(!userRole || userRole === 'student') && (
          <p className="text-center text-sm text-slate-400 font-medium pt-1">
            New student?{" "}
            <button onClick={() => router.push("/register")} className="text-primary font-bold hover:underline">
              Register Account
            </button>
          </p>
        )}

        {userRole === 'vendor' && (
          <p className="text-center text-sm text-slate-400 font-medium pt-1">
            New vendor?{" "}
            <button onClick={() => router.push("/vendor/register")} className="text-primary font-bold hover:underline">
              Apply for an Account
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
