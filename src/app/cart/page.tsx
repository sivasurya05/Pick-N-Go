"use client";
import { useState } from "react";
import { ChevronLeft, Minus, Plus, Trash2, ReceiptText, ShieldCheck, CheckCircle2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, clearCart, profile } = useStore();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal  = cart.reduce((a, i) => a + Number(i.price) * i.quantity, 0);
  const packaging = cart.length > 0 ? 15 : 0;
  const platform  = cart.length > 0 ? 5 : 0;
  const discount  = subtotal > 200 ? 50 : 0;
  const total     = Math.max(0, subtotal + packaging + platform - discount);

  const handlePlaceOrder = async () => {
    if (!profile) return router.push('/login');
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert({ student_id: profile.id, vendor_id: cart[0].vendor_id, total_amount: total, status: 'pending' })
        .select().single();
      if (oErr) throw oErr;

      const { error: iErr } = await supabase.from('order_items').insert(
        cart.map(item => ({ order_id: order.id, menu_item_id: item.id, quantity: item.quantity, price_at_order: item.price }))
      );
      if (iErr) throw iErr;

      setIsSuccess(true);
      setTimeout(() => { clearCart(); router.push(`/tracking?id=${order.id}`); }, 1600);
    } catch (err: any) {
      alert("Order failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6"
        >
          <CheckCircle2 size={60} strokeWidth={2} />
        </motion.div>
        <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-3xl font-black text-slate-900 mb-2"
        >Order Placed!</motion.h2>
        <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-slate-500 font-medium"
        >Connecting you to the canteen kitchen...</motion.p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <button onClick={() => router.back()} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="text-center">
          <h2 className="font-black text-slate-900 text-base">Student Cart</h2>
          {cart.length > 0 && (
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">
              {cart.reduce((a, i) => a + i.quantity, 0)} items
            </p>
          )}
        </div>
        <button onClick={clearCart}
          className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 px-4 pt-4 space-y-3 pb-4">
        <AnimatePresence mode="popLayout">
          {cart.map((item, idx) => (
            <motion.div key={item.id} layout
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -80 }} transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-3xl p-3.5 flex items-center gap-3 shadow-sm border border-slate-100"
            >
              <div className="w-[70px] h-[70px] rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img src={item.image_url || '/food.png'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-sm truncate leading-tight mb-1">{item.name}</h3>
                <p className="text-base font-black text-primary">₹{item.price}</p>
              </div>
              {/* Qty controls */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl flex-shrink-0">
                <button onClick={() => updateQuantity(item.id, -1)}
                  className="w-7 h-7 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                >
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className="font-black text-sm min-w-[18px] text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}
                  className="w-7 h-7 bg-primary text-white shadow-sm rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus size={13} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <Trash2 size={28} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Cart is Empty</h3>
            <p className="text-slate-400 font-medium text-sm px-8 mb-6">Add some delicious items from the menu!</p>
            <button onClick={() => router.push('/home')}
              className="px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/25 text-sm"
            >
              Browse Menu →
            </button>
          </div>
        )}
      </div>

      {/* Bill + Checkout */}
      {cart.length > 0 && (
        <div className="px-4 pb-32 space-y-3">
          {/* Bill Details */}
          <div className="bg-white rounded-3xl p-5 border border-primary/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ReceiptText size={15} className="text-primary" />
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Bill Details</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Item Total',         val: `₹${subtotal}`  },
                { label: 'Packaging & Taxes',  val: `₹${packaging}` },
                { label: 'Platform Fee',        val: `₹${platform}`  },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm font-semibold text-slate-500">
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              {discount > 0 && (
                <div className="flex justify-between text-sm font-black text-emerald-500">
                  <span>Student Discount</span><span>-₹{discount}</span>
                </div>
              )}
              <div className="border-t border-dashed border-slate-100 pt-3 flex justify-between">
                <span className="font-black text-slate-900">To Pay</span>
                <span className="text-xl font-black text-primary">₹{total}</span>
              </div>
            </div>
          </div>

          {/* Safety note */}
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 font-medium">
              Average preparation time is 12 mins. Order tracking available after payment.
            </p>
          </div>

          {/* Place Order Button */}
          <div className="flex gap-3">
            <div className="flex-1 bg-primary/5 border border-primary/20 rounded-2xl px-4 flex items-center">
              <span className="text-primary font-black text-sm">₹ {total}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading}
              className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Confirm Order →</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
