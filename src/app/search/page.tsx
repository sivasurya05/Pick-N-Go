"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, X, Star, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { MenuItem, Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const router = useRouter();
  const addToCart = useStore(s => s.addToCart);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [recentSearches] = useState(["Biryani", "Cold Coffee", "Burger", "Fries"]);

  useEffect(() => {
    const fetchAll = async () => {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('menu_items').select('*').eq('is_available', true),
        supabase.from('categories').select('*'),
      ]);
      setAllItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
    };
    fetchAll();
  }, []);

  const doSearch = useCallback((q: string, cat: string) => {
    setLoading(true);
    const filtered = allItems.filter(i => {
      const matchQ = !q || i.name.toLowerCase().includes(q.toLowerCase()) || (i.description || '').toLowerCase().includes(q.toLowerCase());
      const matchCat = cat === 'all' || i.category_id === cat;
      return matchQ && matchCat;
    });
    setTimeout(() => { setResults(filtered); setLoading(false); }, 200);
  }, [allItems]);

  useEffect(() => {
    if (query.length > 0 || activeCategory !== 'all') {
      doSearch(query, activeCategory);
    } else {
      setResults([]);
    }
  }, [query, activeCategory, doSearch]);

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
  };

  const showResults = query.length > 0 || activeCategory !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Find Anything</p>
            <h1 className="text-xl font-black text-slate-900">Search</h1>
          </div>
          <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <SlidersHorizontal size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items, cuisines..."
            className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-primary/40 focus:bg-white transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mt-3">
          {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-bold text-xs transition-all border flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Empty state — show recent & popular */}
        {!showResults && (
          <div>
            {/* Recent searches */}
            <div className="mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 active:scale-95 transition-transform shadow-sm"
                  >
                    <Search size={12} className="text-slate-400" />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular items grid */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Popular Right Now</h3>
              <div className="grid grid-cols-2 gap-3">
                {[...allItems].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => router.push(`/item/${item.id}`)}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:scale-[0.97] transition-transform"
                  >
                    <div className="h-28 relative bg-slate-100">
                      <img src={item.image_url || '/food.png'} alt={item.name} className="w-full h-full object-cover" />
                      {item.rating && (
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-lg shadow-sm">
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          <span className="text-[9px] font-black text-slate-700">{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-slate-800 truncate mb-0.5">{item.name}</p>
                      <p className="text-sm font-black text-primary">₹{item.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search results */}
        {showResults && (
          <div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-44 bg-slate-200 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                  {query && <span> for "{query}"</span>}
                </p>
                <AnimatePresence mode="popLayout">
                  {results.length > 0 ? (
                    <div className="space-y-3">
                      {results.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => router.push(`/item/${item.id}`)}
                          className="bg-white rounded-3xl p-3 flex items-center gap-4 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                            <img src={item.image_url || '/food.png'} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              {item.description?.slice(0, 40)}...
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-sm font-black text-primary">₹{item.price}</span>
                              {item.rating && (
                                <div className="flex items-center gap-0.5">
                                  <Star size={10} className="fill-amber-400 text-amber-400" />
                                  <span className="text-[10px] font-bold text-slate-500">{item.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); addToCart(item); }}
                            className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/20 font-black text-lg flex-shrink-0 active:scale-90 transition-transform"
                          >
                            +
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 opacity-30">
                      <Search size={48} className="mx-auto mb-4" />
                      <p className="font-black text-sm uppercase tracking-widest">No results found</p>
                      <p className="text-xs font-medium mt-1">Try a different name or category</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
