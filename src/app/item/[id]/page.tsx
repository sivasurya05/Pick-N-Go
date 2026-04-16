"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Minus, Plus, Share2, Star,
  Clock, Flame, ShoppingCart, Heart, Store,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { MenuItem, Profile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [vendor, setVendor] = useState<Profile | null>(null);
  const [category, setCategory] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const addToCart = useStore(s => s.addToCart);
  const cart = useStore(s => s.cart);
  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);

  useEffect(() => {
    async function fetchItem() {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        setItem(data);
        // Fetch vendor + category in parallel
        const [vendorRes, catRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', data.vendor_id).single(),
          data.category_id
            ? supabase.from('categories').select('name').eq('id', data.category_id).single()
            : Promise.resolve({ data: null }),
        ]);
        if (vendorRes.data) setVendor(vendorRes.data);
        if (catRes.data)    setCategory((catRes.data as any).name || "");
      }
      setLoading(false);
    }
    fetchItem();
  }, [id]);

  const handleAddToCart = () => {
    if (!item) return;
    for (let i = 0; i < quantity; i++) addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!item) return;
    for (let i = 0; i < quantity; i++) addToCart(item);
    router.push('/cart');
  };

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-64 bg-slate-200 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded-full w-1/2 animate-pulse" />
          <div className="h-8 bg-slate-200 rounded-full w-3/4 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
        <p className="text-5xl">🍽️</p>
        <h2 className="text-xl font-black text-slate-900">Item not found</h2>
        <button onClick={() => router.back()} className="px-6 py-3 bg-primary text-white font-black rounded-2xl">
          Go Back
        </button>
      </div>
    );
  }

  const discounted = Number(item.price) + Math.round(Number(item.price) * 0.18);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Hero Image ─────────────────────────────────────── */}
      <div className="relative h-[52vw] min-h-[220px] max-h-[320px] w-full overflow-hidden bg-slate-100">
        {!imgError ? (
          <motion.img
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={item.image_url || "/food.png"}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
        )}

        {/* gradient fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />

        {/* Top buttons */}
        <div className="absolute top-0 left-0 right-0 px-5 pt-12 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white/25 backdrop-blur-md rounded-2xl text-white border border-white/20 shadow-lg active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(l => !l)}
              className="p-2.5 bg-white/25 backdrop-blur-md rounded-2xl text-white border border-white/20 shadow-lg active:scale-90 transition-transform"
            >
              <Heart size={20} className={liked ? "fill-red-400 text-red-400" : ""} />
            </button>
            <button className="p-2.5 bg-white/25 backdrop-blur-md rounded-2xl text-white border border-white/20 shadow-lg active:scale-90 transition-transform">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Rating pill */}
        {item.rating && (
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-100">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="font-black text-sm text-slate-800">{item.rating}</span>
          </div>
        )}
      </div>

      {/* ── Content Card ────────────────────────────────────── */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 bg-white -mt-5 rounded-t-[36px] px-6 pt-6 pb-36 relative z-10 shadow-[0_-8px_40px_rgba(0,0,0,0.06)]"
      >
        {/* Category + stock badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {vendor && (
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Store size={10} />
              {vendor.full_name}
            </div>
          )}
          {category && (
            <span className="text-[9px] font-black text-primary bg-primary/8 px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary/15">
              {category}
            </span>
          )}
          {item.is_available
            ? <span className="ml-auto text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-widest">In Stock</span>
            : <span className="ml-auto text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase tracking-widest">Sold Out</span>
          }
        </div>

        {/* Name */}
        <h1 className="text-[1.6rem] font-black text-slate-900 leading-tight mb-3">
          {item.name}
        </h1>

        {/* Price row */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl font-black text-primary">₹{item.price}</span>
          <span className="text-slate-300 line-through font-semibold text-base">₹{discounted}</span>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Save {Math.round(((discounted - Number(item.price)) / discounted) * 100)}%
          </span>
        </div>

        {/* Info chips */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={15} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prep Time</p>
              <p className="text-sm font-black text-slate-800 leading-tight">12 mins</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Flame size={15} className="text-orange-400" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calories</p>
              <p className="text-sm font-black text-slate-800 leading-tight">240 kcal</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</h3>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {item.description ||
              "A campus favourite prepared fresh every day with premium ingredients and a careful blend of spices. Perfect for a satisfying meal between classes."}
          </p>
        </div>

        {/* Tags row */}
        <div className="flex gap-2 flex-wrap mb-8">
          {["Fresh", "Canteen Special", "Popular"].map(tag => (
            <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Sticky Bottom Bar ────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white border-t border-slate-100 px-5 py-4 pb-7 z-50 shadow-[0_-8px_40px_rgba(0,0,0,0.07)]">
        <div className="flex items-center gap-3">
          {/* Qty stepper */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition-transform font-black text-lg"
            >
              <Minus size={15} strokeWidth={2.5} />
            </button>
            <span className="font-black text-base min-w-[22px] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/20 active:scale-90 transition-transform"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={!item.is_available}
            className="flex-1 relative overflow-hidden flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-wide shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6333EF)' }}
          >
            <AnimatePresence mode="wait">
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-white flex items-center gap-1.5"
                >
                  ✓ Added to Cart!
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-white flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Add to Cart · ₹{Number(item.price) * quantity}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
}
