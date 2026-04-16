"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Store, UserPlus, Users, ChevronLeft,
  Mail, Lock, User, Phone, Loader2, CheckCircle2, Eye, EyeOff,
  LogOut, RefreshCw, AlertCircle, ClipboardList, X, Check
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Profile } from "@/types";

type Application = {
  id: string;
  shop_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function AdminPanel() {
  const router = useRouter();
  const profile = useStore(s => s.profile);
  const logout  = useStore(s => s.logout);

  const [activeTab, setActiveTab] = useState<"applications" | "register" | "manage">("applications");
  const [vendors,  setVendors]  = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [apps,     setApps]     = useState<Application[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const [vendorForm, setVendorForm] = useState({
    full_name: "", email: "", phone: "", password: "",
  });

  useEffect(() => {
    if (profile && profile.role !== "admin") { router.push("/"); return; }
    fetchAll();
  }, [profile]);

  const fetchAll = async () => {
    setFetching(true);
    const [profilesRes, appsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("vendor_applications").select("*").order("created_at", { ascending: false }),
    ]);
    if (profilesRes.data) {
      setVendors(profilesRes.data.filter(p => p.role === "vendor"));
      setStudents(profilesRes.data.filter(p => p.role === "student"));
    }
    if (appsRes.data) setApps(appsRes.data as Application[]);
    setFetching(false);
  };

  /* ── Approve application ─────────────────────────────── */
  const handleApprove = async (app: Application) => {
    setActionId(app.id);
    setError("");
    try {
      let userId: string | null = null;

      // Check if vendor already created an auth account during registration
      const storedNote = (app as any).admin_note || "";
      const uidMatch = storedNote.match(/auth_uid:([a-f0-9-]{36})/);
      if (uidMatch) {
        userId = uidMatch[1];
      } else {
        // Vendor applied without password flow — create auth account with a temp password
        const tempPassword = `PNG_${Math.random().toString(36).slice(2, 10)}@1`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: app.email, password: tempPassword,
          options: { data: { full_name: app.shop_name, role: 'vendor' } },
        });
        if (authErr && !authErr.message.includes('already registered')) throw authErr;
        userId = authData?.user?.id || null;
        if (!userId) throw new Error("Could not create auth account.");
      }

      // Create the vendor profile row
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: userId, role: 'vendor',
        full_name: app.shop_name, email: app.email, phone: app.phone || null,
      });
      if (profileErr && !profileErr.message.includes('duplicate')) throw profileErr;

      // Mark application as approved
      await supabase.from('vendor_applications').update({
        status: 'approved', reviewed_at: new Date().toISOString(),
        admin_note: storedNote + ' | approved',
      }).eq('id', app.id);

      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
      setSuccess(`✅ "${app.shop_name}" approved! They can now log in with their registered password.`);
      fetchAll();
    } catch (err: any) {
      setError(err.message || "Approval failed.");
    }
    setActionId(null);
  };

  /* ── Reject application ──────────────────────────────── */
  const handleReject = async (app: Application) => {
    setActionId(app.id);
    await supabase.from('vendor_applications').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', app.id);
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
    setActionId(null);
  };

  /* ── Direct register vendor (admin creates directly) ─── */
  const handleRegisterVendor = async () => {
    if (!vendorForm.full_name.trim()) return setError("Shop name required");
    if (!vendorForm.email)            return setError("Email required");
    if (vendorForm.password.length < 6) return setError("Password must be 6+ chars");

    setLoading(true); setError(""); setSuccess("");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: vendorForm.email, password: vendorForm.password,
        options: { data: { full_name: vendorForm.full_name, role: 'vendor' } },
      });
      if (authErr) throw authErr;

      if (authData.user) {
        const { error: pErr } = await supabase.from('profiles').insert({
          id: authData.user.id, role: 'vendor',
          full_name: vendorForm.full_name, email: vendorForm.email, phone: vendorForm.phone || null,
        });
        if (pErr && !pErr.message.includes('duplicate')) throw pErr;
        setSuccess(`✅ Vendor "${vendorForm.full_name}" registered directly!`);
        setVendorForm({ full_name: "", email: "", phone: "", password: "" });
        fetchAll();
      }
    } catch (err: any) {
      setError(err.message?.includes('already registered') ? "Email already registered." : err.message || "Failed.");
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); logout(); router.push("/"); };

  /* ── Auth guard ──────────────────────────────────────── */
  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-400 mx-auto mb-6">
          <ShieldCheck size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 font-medium mb-8">This panel is only accessible to administrators.</p>
        <Button onClick={() => router.push("/login")} className="max-w-[200px] mx-auto">Login as Admin</Button>
      </div>
    );
  }

  const pendingCount = apps.filter(a => a.status === 'pending').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────── */}
      <div className="bg-slate-900 p-6 pb-8 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <button onClick={() => router.push("/")} className="p-3 bg-white/10 rounded-2xl text-white border border-white/10">
            <ChevronLeft size={20} />
          </button>
          <Badge variant="primary" className="bg-primary/20 text-primary-light border border-primary/30 px-3 py-1">
            <ShieldCheck size={12} className="mr-1" /> Admin Panel
          </Badge>
          <button onClick={handleLogout} className="p-3 bg-white/10 rounded-2xl text-white border border-white/10">
            <LogOut size={20} />
          </button>
        </div>

        <div className="relative z-10 mb-5">
          <h1 className="text-xl font-black text-white mb-0.5">Welcome, {profile.full_name}</h1>
          <p className="text-white/40 text-xs font-medium">Manage vendors, students & applications</p>
        </div>

        <div className="flex gap-3 relative z-10">
          {[
            { label: 'Vendors',  value: vendors.length,  icon: Store },
            { label: 'Students', value: students.length, icon: Users },
            { label: 'Pending',  value: pendingCount,    icon: ClipboardList },
          ].map((s, i) => (
            <div key={i} className="flex-1 bg-white/10 backdrop-blur p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-white/40 text-[8px] font-black uppercase tracking-widest mb-1.5">
                <s.icon size={10} /> {s.label}
              </div>
              <p className={`text-xl font-black ${i === 2 && pendingCount > 0 ? 'text-amber-400' : 'text-white'}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Nav ────────────────────────────────── */}
      <div className="flex gap-2 px-5 -mt-4 relative z-20 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'applications', label: 'Applications', icon: ClipboardList, badge: pendingCount },
          { key: 'register',     label: 'Add Vendor',   icon: UserPlus,      badge: 0 },
          { key: 'manage',       label: 'Users',        icon: Users,         badge: 0 },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setError(""); setSuccess(""); }}
            className={`flex-1 min-w-[110px] py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg relative ${
              activeTab === tab.key ? 'bg-primary text-white shadow-primary/30' : 'bg-white text-slate-400 shadow-slate-100/50'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
            {tab.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-amber-400 text-white text-[8px] font-black rounded-full flex items-center justify-center px-1">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────── */}
      <div className="flex-1 px-5 pt-4 pb-28 space-y-4">

        {/* Alerts */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold whitespace-pre-line"
            >
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-start gap-2"
            >
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── APPLICATIONS TAB ──────────────────── */}
          {activeTab === "applications" && (
            <motion.div key="apps" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Vendor Applications ({apps.length})
                </p>
                <button onClick={fetchAll} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <RefreshCw size={13} className={fetching ? "animate-spin text-primary" : "text-slate-400"} />
                </button>
              </div>

              {/* Filter view — show pending first */}
              {['pending', 'approved', 'rejected'].map(statusGroup => {
                const grouped = apps.filter(a => a.status === statusGroup);
                if (grouped.length === 0) return null;
                return (
                  <div key={statusGroup}>
                    <p className={`text-[8px] font-black uppercase tracking-widest mb-2 ml-1 ${
                      statusGroup === 'pending' ? 'text-amber-500' : statusGroup === 'approved' ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {statusGroup === 'pending' ? '⏳' : statusGroup === 'approved' ? '✅' : '❌'} {statusGroup} ({grouped.length})
                    </p>
                    <div className="space-y-3">
                      {grouped.map((app, i) => (
                        <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <Card className={`p-4 border ${statusGroup === 'pending' ? 'border-amber-100' : 'border-slate-100'}`}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 ${
                                statusGroup === 'pending' ? 'bg-amber-50 text-amber-600' : statusGroup === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {app.shop_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-900 text-sm truncate">{app.shop_name}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">{app.owner_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{app.email}</p>
                                {app.phone && <p className="text-[10px] text-slate-400 font-medium">{app.phone}</p>}
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0 ${
                                statusGroup === 'pending' ? 'bg-amber-100 text-amber-600' : statusGroup === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                              }`}>{statusGroup}</span>
                            </div>

                            {app.description && (
                              <p className="text-xs text-slate-500 font-medium mb-3 bg-slate-50 p-2.5 rounded-xl leading-relaxed">
                                {app.description}
                              </p>
                            )}

                            <p className="text-[9px] text-slate-400 font-medium mb-3">
                              Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>

                            {statusGroup === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(app)}
                                  disabled={actionId === app.id}
                                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-all disabled:opacity-60"
                                >
                                  {actionId === app.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(app)}
                                  disabled={actionId === app.id}
                                  className="flex-1 py-2.5 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-60"
                                >
                                  <X size={13} /> Reject
                                </button>
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {apps.length === 0 && !fetching && (
                <div className="text-center py-16 opacity-40">
                  <ClipboardList size={40} className="mx-auto mb-3" />
                  <p className="font-bold text-sm uppercase tracking-widest">No applications yet</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── DIRECT REGISTER TAB ──────────────── */}
          {activeTab === "register" && (
            <motion.div key="register" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary"><Store size={20} /></div>
                <div>
                  <h3 className="font-black text-slate-900">Register Vendor Directly</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bypass application flow</p>
                </div>
              </div>

              <Card className="p-5 border-none shadow-xl shadow-slate-100/50">
                <div className="space-y-4">
                  {[
                    { label: 'Shop / Vendor Name', key: 'full_name', type: 'text', placeholder: 'e.g. Butty XO', icon: <Store size={18}/> },
                    { label: 'Vendor Email',        key: 'email',     type: 'email', placeholder: 'vendor@campus.com', icon: <Mail size={18}/> },
                    { label: 'Phone (Optional)',    key: 'phone',     type: 'tel',   placeholder: '10-digit number', icon: <Phone size={18}/> },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                      <Input type={f.type} value={(vendorForm as any)[f.key]}
                        onChange={e => setVendorForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} icon={f.icon} maxLength={f.key === 'phone' ? 10 : undefined} />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={vendorForm.password}
                        onChange={e => setVendorForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 6 characters" icon={<Lock size={18}/>} />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Button onClick={handleRegisterVendor} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18}/> Register Vendor</>}
              </Button>
            </motion.div>
          )}

          {/* ── MANAGE USERS TAB ─────────────────── */}
          {activeTab === "manage" && (
            <motion.div key="manage" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All Users</p>
                <button onClick={fetchAll} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <RefreshCw size={13} className={fetching ? "animate-spin text-primary" : "text-slate-400"} />
                </button>
              </div>

              {/* Vendors */}
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Vendors ({vendors.length})</p>
                <div className="space-y-2">
                  {vendors.map((v, i) => (
                    <Card key={v.id} className="p-3.5 border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-black">
                          {v.full_name?.charAt(0)?.toUpperCase() || 'V'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{v.full_name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{v.email}</p>
                        </div>
                        <Badge variant="primary" className="text-[8px]">Vendor</Badge>
                      </div>
                    </Card>
                  ))}
                  {vendors.length === 0 && <p className="text-center py-6 text-slate-400 font-bold text-sm">No vendors yet</p>}
                </div>
              </div>

              {/* Students */}
              <div>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 ml-1">Students ({students.length})</p>
                <div className="space-y-2">
                  {students.map((s, i) => (
                    <Card key={s.id} className="p-3.5 border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 font-black">
                          {s.full_name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{s.full_name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{s.email}</p>
                        </div>
                        <Badge variant="success" className="text-[8px]">Student</Badge>
                      </div>
                    </Card>
                  ))}
                  {students.length === 0 && <p className="text-center py-6 text-slate-400 font-bold text-sm">No students yet</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
