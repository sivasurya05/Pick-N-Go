"use client";
import { useEffect, useState } from "react";
import { Search, CheckCircle, Clock, Package, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderStatus } from "@/types";

const tabs: { label: string; status: OrderStatus; icon: any; color: string }[] = [
  { label: 'New',       status: 'pending',   icon: Clock,        color: 'text-amber-500'  },
  { label: 'Preparing', status: 'preparing', icon: Package,      color: 'text-blue-500'   },
  { label: 'Ready',     status: 'ready',     icon: CheckCircle,  color: 'text-emerald-500'},
];

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-600',
  preparing: 'bg-blue-50 text-blue-600',
  ready:     'bg-emerald-50 text-emerald-600',
  collected: 'bg-slate-100 text-slate-400',
  cancelled: 'bg-red-50 text-red-400',
};

export default function VendorOrders() {
  const profile = useStore(s => s.profile);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchOrders();

    const channel = supabase
      .channel('vendor-orders-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${profile.id}` },
        (payload) => setOrders(prev => [payload.new as Order, ...prev])
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, profiles:student_id(full_name, email), order_items(quantity, menu_items(name, price))')
      .eq('vendor_id', profile?.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const filtered = orders.filter(o => o.status === activeTab);
  const counts: Record<OrderStatus, number> = {
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    confirmed: 0,
    collected: 0,
    cancelled: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-black text-slate-900">Incoming Orders</h1>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">
              {profile?.full_name} • Live Updates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <Search size={16} className="text-slate-400" />
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              <Wifi size={10} /> {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-4 pt-4 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all relative ${
              activeTab === tab.status
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {counts[tab.status] > 0 && (
              <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                activeTab === tab.status ? 'bg-white text-primary' : 'bg-primary text-white'
              }`}>
                {counts[tab.status]}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="px-4 pt-2 space-y-4">
        {loading ? (
          <p className="text-center py-16 text-slate-400 font-bold text-sm">Loading orders...</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((order, idx) => {
              const studentName = (order as any).profiles?.full_name || 'Student';
              const items = (order as any).order_items || [];
              const itemSummary = items.map((i: any) => `${i.quantity}× ${i.menu_items?.name}`).join(', ');
              const initials = studentName.slice(0, 2).toUpperCase();

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm"
                >
                  {/* Order top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary text-sm">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{studentName}</h4>
                        <p className="text-[9px] text-slate-400 font-bold tracking-wider">
                          #{order.id.slice(0, 8).toUpperCase()} •{' '}
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${STATUS_COLORS[order.status] || 'bg-slate-50 text-slate-400'}`}>
                        {order.status}
                      </span>
                      <span className="font-black text-slate-900 text-sm">₹{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-slate-50 rounded-2xl px-3 py-2 mb-4">
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{itemSummary || 'No items'}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="flex-1 py-3 bg-red-50 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-100"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="flex-[2] py-3 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                          Accept Order ✓
                        </button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="w-full py-3 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md"
                      >
                        Mark as Ready 🍽️
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(order.id, 'collected')}
                        className="w-full py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest"
                      >
                        Order Collected ✓
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 opacity-30">
                <Clock size={44} className="mx-auto mb-3" />
                <p className="font-black text-sm uppercase tracking-widest">No {activeTab} orders</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
