"use client";
import { useEffect, useState } from "react";
import { Bell, Search, RefreshCw, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem, Category, Profile } from "@/types";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

interface VendorWithItems extends Profile {
  items: MenuItem[];
}

export default function StudentHome() {
  const router = useRouter();
  const addToCart = useStore(s => s.addToCart);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorWithItems[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const profile = useStore(s => s.profile);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (profile !== undefined) fetchData(); }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    const [vendorsRes, itemsRes, catsRes, orderRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'vendor'),
      supabase.from('menu_items').select('*').eq('is_available', true),
      supabase.from('categories').select('*'),
      profile ? supabase.from('orders').select('*').eq('student_id', profile.id).in('status', ['pending', 'preparing', 'ready']).order('created_at', { ascending: false }).limit(1) : Promise.resolve({ data: [] }),
    ]);
    const items = itemsRes.data || [];
    const vendorList = (vendorsRes.data || []) as Profile[];
    
    if (orderRes.data && orderRes.data.length > 0) setActiveOrder(orderRes.data[0]);
    else setActiveOrder(null);

    setAllItems(items);
    setCategories(catsRes.data || []);
    setVendors(vendorList.map(v => ({
      ...v,
      items: items.filter(i => i.vendor_id === v.id),
    })).filter(v => v.items.length > 0));
    setLoading(false);
  };

  /* Vendors filtered by category + search */
  const filteredVendors = vendors.map(v => ({
    ...v,
    items: v.items.filter(i => {
      const matchCat = activeCategory === 'all' || i.category_id === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }),
  })).filter(v => v.items.length > 0);

  return (
    <div className="pb-32 bg-slate-50 min-h-screen">
      {/* ── Sticky Header ──────────────────────────────────── */}
      <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Campus Hub • LIVE</p>
            <h1 className="text-xl font-black text-slate-900">Canteen Menu</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <RefreshCw size={16} className={loading ? "animate-spin text-primary" : "text-slate-400"} />
            </button>
            <button 
              onClick={() => {
                if (activeOrder) {
                  router.push(`/tracking?id=${activeOrder.id}`);
                } else {
                  setShowNotificationModal(true);
                  setTimeout(() => setShowNotificationModal(false), 2000);
                }
              }}
              className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl relative active:scale-95 transition-transform"
            >
              <Bell size={16} className="text-slate-600" />
              {activeOrder && <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full" />}
            </button>
          </div>
        </div>

        {/* ── No Notification Toast ────────────────────────────── */}
        <AnimatePresence>
          {showNotificationModal && (
            <motion.div
              initial={{ opacity: 0, y: -10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -10, x: '-50%' }}
              className="absolute top-[80px] left-1/2 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl text-[10px] font-black tracking-widest uppercase pointer-events-none whitespace-nowrap"
            >
              <Bell size={14} className="text-slate-400" /> No Orders Found
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for snacks, meals..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-primary/30 focus:bg-white transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[{ id: 'all', name: 'All Items' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap font-bold text-xs transition-all border flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="px-5 pt-5">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-xl animate-pulse" />
                  <div className="h-4 w-28 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-3 overflow-x-auto">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-40 h-52 bg-slate-200 rounded-3xl animate-pulse flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {/* ── Shops top-to-bottom, items scroll left-to-right ── */}
            {filteredVendors.map((vendor, vi) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: vi * 0.07 }}
                className="mb-7"
              >
                {/* Shop Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                      {vendor.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 leading-tight">{vendor.full_name}</h2>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">● Open Now</p>
                    </div>
                  </div>
                  <button className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-0.5">
                    See All <ChevronRight size={10} />
                  </button>
                </div>

                {/* Horizontal scroll of items */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
                  {vendor.items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => router.push(`/item/${item.id}`)}
                      className="w-40 flex-shrink-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:scale-[0.97] transition-transform"
                    >
                      <div className="h-28 relative overflow-hidden bg-slate-100">
                        <img src={item.image_url || '/food.png'} alt={item.name}
                          className="w-full h-full object-cover" />
                        <button
                          onClick={e => { e.stopPropagation(); addToCart(item); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 text-white font-black text-base leading-none active:scale-90 transition-transform"
                        >
                          +
                        </button>
                        {item.rating && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-lg">
                            <Star size={9} className="fill-amber-400 text-amber-400" />
                            <span className="text-[9px] font-black text-slate-700">{item.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight mb-0.5">{item.name}</p>
                        <p className="text-sm font-black text-primary">₹{item.price}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            {filteredVendors.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 opacity-30">
                <Search size={48} className="mx-auto mb-4" />
                <p className="font-bold uppercase tracking-widest text-sm">No items found</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
