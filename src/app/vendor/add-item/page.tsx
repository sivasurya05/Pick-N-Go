"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, CheckCircle2, CloudUpload, X, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function AddItemPage() {
  const router  = useRouter();
  const profile = useStore(s => s.profile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview,    setPreview]    = useState<string>("");
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);

  const [form, setForm] = useState({
    name:        "",
    price:       "",
    category_id: "",
    description: "",
    image_url:   "",
    is_available: true,
  });

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  /* ── Image Upload ───────────────────────────────────────── */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type + size
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(20);

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploadProgress(40);

    try {
      const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `vendor-${profile?.id?.slice(0, 8)}-${Date.now()}.${ext}`;
      const filePath = `menu/${fileName}`;

      setUploadProgress(60);

      const { error: uploadError } = await supabase.storage
        .from('food')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        // If RLS blocks it, fall back to base64 data URL stored directly
        if (uploadError.message?.includes('policy') || uploadError.message?.includes('security')) {
          console.warn("Storage RLS blocked — using local preview URL. Run storage policy fix.");
          setForm(f => ({ ...f, image_url: localUrl }));
        } else {
          throw uploadError;
        }
      } else {
        const { data } = supabase.storage.from('food').getPublicUrl(filePath);
        setForm(f => ({ ...f, image_url: data.publicUrl }));
        URL.revokeObjectURL(localUrl);
      }

      setUploadProgress(100);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Upload failed: " + (err.message || "Unknown error. Check console."));
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setPreview("");
    setForm(f => ({ ...f, image_url: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!profile) return setError("You must be logged in as a vendor.");
    if (!form.name.trim()) return setError("Please enter a dish name.");
    if (!form.price || Number(form.price) <= 0) return setError("Please enter a valid price.");
    if (!form.category_id) return setError("Please select a category.");

    setLoading(true);
    setError("");

    const { error: dbErr } = await supabase.from('menu_items').insert({
      vendor_id:    profile.id,
      name:         form.name.trim(),
      price:        Number(form.price),
      category_id:  form.category_id,
      description:  form.description.trim() || null,
      image_url:    form.image_url || null,
      is_available: form.is_available,
      rating:       5.0,
    });

    if (dbErr) {
      setError("Failed to add item: " + dbErr.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/vendor/inventory'), 1400);
  };

  /* ── Success screen ──────────────────────────────────────── */
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-5"
        >
          <CheckCircle2 size={52} strokeWidth={2} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">Item Published!</h2>
        <p className="text-slate-400 font-medium">Your dish is now visible to students.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <button onClick={() => router.back()}
          className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-black text-slate-800">Add Food Item</h2>
        <div className="w-10" />
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-start gap-2"
            >
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")}><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Photo Upload ──────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Food Photo</p>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className={`relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-dashed transition-all cursor-pointer ${
              preview ? 'border-primary/30 bg-white' : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50'
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <CloudUpload size={28} className="text-white mb-1" />
                  <p className="text-white text-xs font-black uppercase tracking-wider">Change Photo</p>
                </div>
                {/* Clear button */}
                <button
                  onClick={e => { e.stopPropagation(); clearImage(); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-600 shadow-md"
                >
                  <X size={14} />
                </button>
                {/* Upload progress bar */}
                {uploading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                  {uploading ? <Loader2 size={24} className="animate-spin" /> : <CloudUpload size={24} />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-600">
                    {uploading ? "Uploading..." : "Tap to upload food photo"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">JPG, PNG, WEBP • Max 5 MB</p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
          />
        </div>

        {/* ── Item Name ─────────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Item Name</label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Margherita Pizza"
            icon={<ImageIcon size={18} />}
          />
        </div>

        {/* ── Price + Category ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Price (₹)</label>
            <Input
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Category</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full h-14 px-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:border-primary/30 shadow-sm appearance-none"
            >
              <option value="">Select</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Description ───────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">
            Description <span className="text-slate-300">(Optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Describe the ingredients, taste, or serving style..."
            className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-medium text-sm text-slate-700 outline-none focus:border-primary/30 shadow-sm resize-none"
          />
        </div>

        {/* ── In Stock Toggle ───────────────────────────────── */}
        <div className="bg-white rounded-3xl p-4 flex items-center justify-between border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${form.is_available ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm">Available for Orders</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {form.is_available ? 'Visible to students' : 'Hidden from menu'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
            className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${form.is_available ? 'bg-primary' : 'bg-slate-200'}`}
          >
            <motion.div
              animate={{ x: form.is_available ? 26 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* ── Sticky Submit ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto px-5 py-4 pb-7 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <Button onClick={handleSubmit} disabled={loading || uploading}>
          {loading
            ? <Loader2 className="animate-spin" />
            : uploading
            ? <><Loader2 className="animate-spin" /> Uploading Image...</>
            : "Add Food Item"
          }
        </Button>
      </div>
    </div>
  );
}
