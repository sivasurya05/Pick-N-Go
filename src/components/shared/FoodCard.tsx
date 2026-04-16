"use client";
import * as React from "react"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { MenuItem } from "@/types"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useStore } from "@/store/useStore"
import { useRouter } from "next/navigation";

interface FoodCardProps {
  item: MenuItem;
  index: number;
}

export function FoodCard({ item, index }: FoodCardProps) {
  const router = useRouter();
  const addToCart = useStore((state) => state.addToCart);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={() => router.push(`/item/${item.id}`)}
      className="cursor-pointer"
    >
      <Card className="p-3 relative group overflow-hidden h-full border-slate-50 transition-all hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]">
        <div className="aspect-square rounded-[18px] overflow-hidden mb-3 relative bg-slate-50">
          <img 
            src={item.image_url || "/food.png"} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
          {item.rating && (
            <div className="absolute top-2 right-2">
               <Badge variant="secondary" className="bg-white/90 backdrop-blur font-black">
                 ⭐ {item.rating}
               </Badge>
            </div>
          )}
        </div>
        
        <h3 className="font-extrabold text-sm leading-tight mb-1 truncate text-slate-800">
          {item.name}
        </h3>
        <p className="text-primary font-black text-lg">₹{item.price}</p>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(item);
          }}
          className="absolute bottom-3 right-3 bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-90 transition-all z-20"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </Card>
    </motion.div>
  )
}

