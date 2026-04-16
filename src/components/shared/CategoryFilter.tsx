"use client";
import * as React from "react"
import { Category } from "@/types"
import { cn } from "@/components/ui/Input"

interface CategoryFilterProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ categories, activeId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-6 px-6">
      <button
        onClick={() => onSelect('all')}
        className={cn(
          "px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border-2",
          activeId === 'all' 
            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
            : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
        )}
      >
        All items
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border-2",
            activeId === cat.id 
              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
              : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
