"use client";
import { useEffect, useState } from "react";
import { LogOut, ShoppingBag, Clock, CheckCircle, User, Mail, Phone, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Order } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Pending'   },
  preparing: { bg: 'bg-blue-50',    text: 'text-blue-600',    label: 'Preparing' },
  ready:     { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Ready!'    },
  collected: { bg: 'bg-slate-100',  text: 'text-slate-500',   label: 'Collected' },
  cancelled: { bg: 'bg-red-50',     text: 'text-red-500',     label: 'Cancelled' },
  confirmed: { bg: 'bg-primary/5',  text: 'text-primary',     label: 'Confirmed' },
};

export default function AccountPage() {
  const router = useRouter();
  const { profile, logout } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (!profile) return;
    fetchOrders();
  }, [profile]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(quantity, price_at_order, menu_items(name, image_url))')
      .eq('student_id', profile?.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  const activeOrders = orders.filter(o => !['collected', 'cancelled'].includes(o.status));
  const pastOrders   = orders.filter(o =>  ['collected', 'cancelled'].includes(o.status));
  const shown = activeTab === 'active' ? activeOrders : pastOrders;

  const totalSpent = orders
    .filter(o => o.status === 'collected')
    .reduce((a, o) => a + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Profile Hero */}
      <div className="bg-white px-5 pt-8 pb-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-lg leading-tight">{profile?.full_name || 'Student'}</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Student Account</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-red-50 border border-red-100 rounded-2xl text-red-400 active:scale-90 transition-transform"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Profile details */}
        <div className="space-y-2">
          {profile?.email && (
            <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-600 truncate">{profile.email}</span>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Phone size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-600">{profile.phone}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Total Orders', value: orders.length, icon: ShoppingBag },
            { label: 'Active',       value: activeOrders.length, icon: Clock },
            { label: 'Completed',    value: pastOrders.filter(o => o.status === 'collected').length, icon: CheckCircle },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <s.icon size={16} className="text-primary mx-auto mb-1" />
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {totalSpent > 0 && (
          <div className="mt-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-primary" />
              <span className="text-sm font-black text-slate-800">Total Spent</span>
            </div>
            <span className="text-base font-black text-primary">₹{totalSpent.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Orders section */}
      <div className="px-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-3 mb-4">
          {(['active', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              {tab === 'active' ? `Active (${activeOrders.length})` : `History (${pastOrders.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {shown.map((order, idx) => {
              const style = STATUS_STYLE[order.status] || STATUS_STYLE['pending'];
              const items = (order as any).order_items || [];
              const firstImg = items[0]?.menu_items?.image_url;
              const names = items.map((i: any) => i.menu_items?.name).filter(Boolean).join(', ');
              const isActive = !['collected', 'cancelled'].includes(order.status);

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => isActive && router.push(`/tracking?id=${order.id}`)}
                  className={`bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 mb-3 ${isActive ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
                >
                  {/* Food thumbnail */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {firstImg
                      ? <img src={firstImg} alt="food" className="w-full h-full object-cover" />
                      : <ShoppingBag size={24} className="m-auto text-slate-300 mt-3" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 truncate mb-0.5">{names || 'Order items'}</p>
                    <p className="font-black text-slate-900 text-sm">₹{order.total_amount}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Status + chevron */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    {isActive && <ChevronRight size={14} className="text-slate-300" />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {shown.length === 0 && !loading && (
          <div className="text-center py-16 opacity-30">
            <ShoppingBag size={44} className="mx-auto mb-3" />
            <p className="font-black text-sm uppercase tracking-widest">
              {activeTab === 'active' ? 'No active orders' : 'No order history'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
