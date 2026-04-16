"use client";
import { useEffect, useState, Suspense } from "react";
import { ChevronLeft, MoreVertical, QrCode, Phone, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Order, OrderStatus } from "@/types";

const STEPS: { status: OrderStatus; label: string; sub: string }[] = [
  { status: 'pending',   label: 'Order Confirmed',    sub: 'The canteen has received your order.' },
  { status: 'preparing', label: 'Preparing Food',     sub: 'Chef is crafting your meal.' },
  { status: 'ready',     label: 'Ready for Collection', sub: 'Flash your order ID at the counter.' },
  { status: 'collected', label: 'Order Collected',    sub: 'Enjoy your meal! See you again 🎉' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'preparing', 'ready', 'collected'];

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles:vendor_id(full_name, phone, email)')
        .eq('id', orderId)
        .single();
      if (data) setOrder(data);
      setLoading(false);
    };
    fetchOrder();

    const channel = supabase
      .channel(`live-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(prev => prev ? { ...prev, status: payload.new.status } : null)
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Tracking Order...</p>
      </div>
    );
  }
  if (!order) return <div className="p-20 text-center font-bold text-slate-400">Order not found.</div>;

  const currentIdx = STATUS_ORDER.indexOf(order.status as OrderStatus);
  const vendorName = (order as any).profiles?.full_name || 'Campus Canteen';
  const shortId = `#CAN-${order.id.slice(0, 5).toUpperCase()}`;

  const statusLabel = {
    pending:   'Order Confirmed',
    confirmed: 'Confirmed',
    preparing: 'Preparing Your Meal',
    ready:     'Ready for Pickup!',
    collected: 'Enjoy Your Food!',
    cancelled: 'Cancelled',
  }[order.status] || order.status;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between shadow-sm">
        <button onClick={() => router.push('/home')} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Status</p>
          <h2 className="font-black text-slate-900 text-sm">{shortId}</h2>
        </div>
        <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
          <MoreVertical size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Timer Hero */}
      <div className="bg-white mx-4 mt-4 rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.14, 0.06] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary rounded-full blur-[80px]"
        />
        <div className="relative text-center">
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-2">
            {order.status === 'ready' || order.status === 'collected' ? 'Status' : 'Estimated Arrival'}
          </p>
          <motion.h1
            key={order.status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-black text-slate-900 tracking-tighter mb-4"
          >
            {order.status === 'ready' ? 'READY' : order.status === 'collected' ? '✓ DONE' : '08 : 42'}
          </motion.h1>
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-primary rounded-full"
            />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-100" />

          {STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex gap-5 relative ${idx < STEPS.length - 1 ? 'mb-7' : ''}`}
              >
                {/* Dot */}
                <div className={`w-6 h-6 rounded-full border-2 border-white shadow z-10 flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  done ? 'bg-emerald-500' : active ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-200'
                }`}>
                  {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div>
                  <p className={`font-black text-sm leading-tight transition-colors ${done || active ? 'text-slate-900' : 'text-slate-300'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 leading-snug ${done || active ? 'text-slate-500' : 'text-slate-300'}`}>
                    {step.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Vendor Card */}
      <div className="mx-4 mt-4 mb-6 bg-slate-900 rounded-3xl p-5 flex items-center justify-between shadow-2xl shadow-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center font-black text-white text-xl">
            {vendorName.charAt(0)}
          </div>
          <div>
            <h4 className="font-black text-white text-sm">{vendorName}</h4>
            <div className="flex items-center gap-1 mt-0.5 text-white/40 text-[9px] font-bold uppercase tracking-wider">
              <MapPin size={9} /> Campus Canteen • Ground Floor
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white/10 border border-white/10 rounded-2xl text-white">
            <QrCode size={18} />
          </button>
          <button className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30">
            <Phone size={18} />
          </button>
        </div>
      </div>

      {order.status === 'collected' && (
        <div className="mx-4 mb-4">
          <button
            onClick={() => router.push('/home')}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 text-sm uppercase tracking-widest"
          >
            Order Again 🍽️
          </button>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
