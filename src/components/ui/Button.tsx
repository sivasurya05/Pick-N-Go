import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  children: ReactNode;
}

export default function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  const baseStyles = "w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20",
    outline: "bg-transparent border-2 border-slate-100 text-slate-800 hover:bg-slate-50",
    ghost: "bg-transparent text-primary hover:bg-primary/5",
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
