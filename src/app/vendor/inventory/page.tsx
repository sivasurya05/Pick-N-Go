"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit3, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { MenuItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function VendorInventory() {
  const router = useRouter();
  const profile = useStore(s => s.profile);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetchItems();
  }, [profile]);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', profile?.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const toggleAvailability = async (item: MenuItem) => {
    setToggling(item.id);
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    }
    setToggling(null);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Vendor Management</p>
            <h1 className="text-xl font-black text-slate-900">Menu Inventory</h1>
          </div>
          <button
            onClick={() => router.push('/vendor/add-item')}
            className="w-11 h-11 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 transition-opacity ${!item.is_available ? 'opacity-60' : ''}`}
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={item.image_url || '/food.png'} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                    {item.description?.slice(0, 30) || 'No description'}...
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-black text-primary">₹{item.price}</span>
                    {!item.is_available && (
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded">
                        Sold Out
                      </span>
                    )}
                    {item.is_available && (
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/vendor/add-item?edit=${item.id}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-wide"
                  >
                    <Edit3 size={10} /> Edit
                  </button>
                  <button
                    onClick={() => toggleAvailability(item)}
                    disabled={toggling === item.id}
                    className="transition-transform active:scale-90"
                  >
                    {item.is_available
                      ? <ToggleRight size={28} className="text-primary" />
                      : <ToggleLeft size={28} className="text-slate-300" />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-20 opacity-30">
            <Search size={40} className="mx-auto mb-3" />
            <p className="font-black text-sm uppercase tracking-widest">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
