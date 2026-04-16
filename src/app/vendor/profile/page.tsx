"use client";
import { useEffect, useState } from "react";
import {
  Store, Mail, Phone, Edit3, LogOut, Save, X,
  ShoppingBag, TrendingUp, Star, Package, CheckCircle2, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function VendorProfile() {
  const router = useRouter();
  const { profile, setProfile, logout } = useStore();
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [stats,   setStats]     = useState({ totalOrders: 0, revenue: 0, items: 0, rating: 0 });
  const [saved,   setSaved]     = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone:     profile?.phone     || "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    const [ordersRes, itemsRes] = await Promise.all([
      supabase.from('orders').select('total_amount, status').eq('vendor_id', profile?.id),
      supabase.from('menu_items').select('rating,is_available').eq('vendor_id', profile?.id),
    ]);
    const orders = ordersRes.data || [];
    const items  = itemsRes.data  || [];
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + Number(o.total_amount), 0);
    const avgRating = items.length
      ? items.reduce((a, i) => a + Number(i.rating || 0), 0) / items.length
      : 0;
    setStats({ totalOrders: orders.length, revenue, items: items.length, rating: Math.round(avgRating * 10) / 10 });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name.trim(), phone: form.phone || null })
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  const statCards = [
    { label: 'Total Orders',  value: stats.totalOrders,               icon: ShoppingBag, color: 'text-primary',    bg: 'bg-primary/5'   },
    { label: 'Revenue',       value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp,  color: 'text-emerald-500', bg: 'bg-emerald-50'  },
    { label: 'Menu Items',    value: stats.items,                     icon: Package,     color: 'text-blue-500',   bg: 'bg-blue-50'     },
    { label: 'Avg Rating',    value: stats.rating || '—',             icon: Star,        color: 'text-amber-500',  bg: 'bg-amber-50'    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="bg-white px-5 pt-6 pb-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Vendor Terminal</p>
          <h1 className="text-xl font-black text-slate-900">My Profile</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 bg-red-50 border border-red-100 rounded-2xl text-red-400 active:scale-90 transition-transform"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* ── Avatar + Name Card ────────────────────────────── */}
      <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl flex-shrink-0">
            {(form.full_name || profile?.full_name || 'V').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">● Active Vendor</span>
            </div>
            <h2 className="font-black text-slate-900 text-lg leading-tight truncate">
              {profile?.full_name || 'Vendor'}
            </h2>
            <p className="text-xs font-medium text-slate-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={() => { setEditing(!editing); setForm({ full_name: profile?.full_name || '', phone: profile?.phone || '' }); }}
            className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 ${editing ? 'bg-red-50 border-red-100 text-red-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
          >
            {editing ? <X size={16} /> : <Edit3 size={16} />}
          </button>
        </div>

        {/* Edit form */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Shop / Vendor Name</label>
                  <input
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-primary/40 transition-all"
                    placeholder="Your shop name"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    type="tel"
                    maxLength={10}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-primary/40 transition-all"
                    placeholder="10-digit number"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.full_name.trim()}
                  className="w-full py-3 bg-primary text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved toast */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 flex items-center gap-2 justify-center text-emerald-600 text-xs font-black"
            >
              <CheckCircle2 size={14} /> Profile updated!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Contact Info ──────────────────────────────────── */}
      <div className="mx-4 mt-3 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Contact Details</p>
        <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-2xl border border-slate-100">
          <Mail size={14} className="text-slate-400 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-600 truncate">{profile?.email}</span>
        </div>
        {profile?.phone && (
          <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-2xl border border-slate-100">
            <Phone size={14} className="text-slate-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-600">{profile.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-2xl border border-slate-100">
          <Store size={14} className="text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-slate-600">Vendor Account</span>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────── */}
      <div className="mx-4 mt-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Performance Stats</p>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm"
            >
              <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={16} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{s.value}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div className="mx-4 mt-3 space-y-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Quick Actions</p>
        {[
          { label: 'Manage Menu Items',   icon: Package,     path: '/vendor/inventory', color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { label: 'View All Orders',     icon: ShoppingBag, path: '/vendor/orders',    color: 'text-primary',    bg: 'bg-primary/5' },
          { label: 'Add New Dish',        icon: Store,       path: '/vendor/add-item',  color: 'text-emerald-500', bg: 'bg-emerald-50'},
        ].map((a, i) => (
          <button key={i} onClick={() => router.push(a.path)}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className={`w-9 h-9 ${a.bg} ${a.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <a.icon size={16} />
            </div>
            <span className="font-bold text-sm text-slate-700">{a.label}</span>
            <span className="ml-auto text-slate-300 text-lg font-bold">›</span>
          </button>
        ))}
      </div>

      {/* ── Danger Zone ───────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <button onClick={handleLogout}
          className="w-full py-4 bg-red-50 border border-red-100 text-red-500 font-black rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
