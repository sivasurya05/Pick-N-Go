"use client";
import { useEffect, useState } from "react";
import { Bell, RefreshCw, TrendingUp, ShoppingBag, Clock, ArrowRight, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "@/types";
import { useRouter } from "next/navigation";

/* tiny sparkline SVG — just illustrative */
function Sparkline({ up }: { up: boolean }) {
  const d = up
    ? "M0,40 C20,38 30,20 50,18 C70,16 80,10 100,8 C120,6 130,4 150,2"
    : "M0,10 C20,12 30,28 50,30 C70,32 80,38 100,36 C120,34 130,38 150,40";
  return (
    <svg viewBox="0 0 150 42" className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6333EF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6333EF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + " L150,42 L0,42 Z"} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#6333EF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function VendorDashboard() {
  const router = useRouter();
  const profile = useStore(s => s.profile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, itemsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, profiles:student_id(full_name, email)')
        .eq('vendor_id', profile?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', profile?.id)
        .eq('is_available', true)
        .order('rating', { ascending: false })
        .limit(4),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (itemsRes.data) setMenuItems(itemsRes.data);
    setLoading(false);
  };

  const revenue = orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? Number(o.total_amount) : 0), 0);
  const todayOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders.reduce((a, o) => a + Number(o.total_amount), 0);
  const pending = orders.filter(o => o.status === 'pending').length;

  const statCards = [
    { label: 'Total Orders', value: orders.length, sub: '+12%', icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/5', up: true },
    { label: 'Daily Revenue', value: `₹${todayRevenue.toLocaleString()}`, sub: '-8%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', up: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Top Header */}
      <div className="bg-white px-5 pt-6 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">
              {profile?.full_name?.charAt(0) || 'V'}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pick N&apos; Go</p>
              <h2 className="font-black text-slate-900 text-sm leading-tight">{profile?.full_name || 'Vendor'}</h2>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">● Vendor Terminal</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <RefreshCw size={16} className={loading ? "animate-spin text-primary" : "text-slate-400"} />
            </button>
            <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl relative">
              <Bell size={16} className="text-slate-600" />
              {pending > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[8px] font-black">
                  {pending}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-start justify-between mb-1">
                  <div className={`${stat.bg} ${stat.color} w-8 h-8 rounded-xl flex items-center justify-center`}>
                    <stat.icon size={16} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-[10px] font-black ${stat.up ? 'text-emerald-500' : 'text-red-400'}`}>
                    <ChevronUp size={10} className={stat.up ? '' : 'rotate-180'} />{stat.sub}
                  </div>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Revenue Overview */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue Insights</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                ₹{revenue.toLocaleString()}
              </h3>
              <p className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5 mt-0.5">
                <ChevronUp size={12} /> +18.4% all time
              </p>
            </div>
            <button className="text-[9px] font-black text-primary uppercase tracking-widest">Weekly</button>
          </div>
          <Sparkline up={true} />
        </div>

        {/* Pending Orders Banner */}
        {pending > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push('/vendor/orders')}
            className="w-full bg-primary text-white rounded-3xl p-4 flex items-center justify-between shadow-xl shadow-primary/25"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div className="text-left">
                <p className="font-black text-sm">{pending} New Order{pending > 1 ? 's' : ''}</p>
                <p className="text-white/70 text-[10px] font-bold">Waiting for your action</p>
              </div>
            </div>
            <ArrowRight size={20} className="opacity-70" />
          </motion.button>
        )}

        {/* Popular Items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-black text-slate-900 text-sm">Popular Items</h2>
            <button
              onClick={() => router.push('/vendor/inventory')}
              className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-0.5"
            >
              Expand <ArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {menuItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-slate-100"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={item.image_url || '/food.png'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {orders.filter(o => o.status !== 'cancelled').length} orders today
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-slate-900 text-sm">₹{item.price}</p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wide">⭐ {item.rating}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {menuItems.length === 0 && !loading && (
              <div className="text-center py-8 opacity-30">
                <ShoppingBag size={36} className="mx-auto mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">No menu items yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
