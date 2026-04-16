"use client";
import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { OrderStatus } from "@/types";

interface StatusStep {
  label: string;
  status: OrderStatus | 'completed';
  description: string;
}

const steps: StatusStep[] = [
  { label: "Order Confirmed", status: 'pending', description: "The canteen has received your order." },
  { label: "Preparing Food", status: 'preparing', description: "The chef is busy preparing your delicious meal." },
  { label: "Ready for Pickup", status: 'ready', description: "Flash your order ID at the counter to collect!" },
  { label: "Enjoy your meal", status: 'collected', description: "Hope you enjoyed the food. See you next time!" },
];

export function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentStepIndex = steps.findIndex(s => s.status === currentStatus);

  return (
    <div className="space-y-10 relative">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
      
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex || currentStatus === 'collected';
        const isActive = idx === currentStepIndex;
        
        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-6 relative"
          >
            <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 transition-colors duration-500 ${
              isCompleted ? 'bg-emerald-500' : 
              isActive ? 'bg-primary ring-4 ring-primary/20' : 
              'bg-slate-200'
            }`}>
                {isCompleted && <CheckCircle2 className="text-white w-full h-full p-0.5" />}
            </div>
            <div>
              <h3 className={`font-black transition-colors ${!isCompleted && !isActive ? 'text-slate-300' : 'text-slate-900'}`}>
                {step.label}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
