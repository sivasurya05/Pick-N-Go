import * as React from "react"
import { cn } from "@/components/ui/Input"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
}

function Badge({ className, variant = 'primary', ...props }: BadgeProps) {
  const variants = {
    primary: "bg-primary/5 text-primary",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
    secondary: "bg-slate-100 text-slate-500",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
