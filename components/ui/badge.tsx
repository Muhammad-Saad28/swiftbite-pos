"use client";

import React from "react";
import { cn } from "./utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "draft" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed" | "rejected" | "cancelled" | "available" | "occupied" | "reserved" | "in_stock" | "low" | "critical" | "default" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const styles: Record<string, string> = {
    default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
    outline: "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
    
    // Order Statuses
    draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 font-medium dark:bg-zinc-500/20 dark:text-zinc-400",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold dark:bg-amber-500/20 dark:text-amber-400",
    accepted: "bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold dark:bg-blue-500/20 dark:text-blue-400",
    preparing: "bg-orange-500/10 text-orange-600 border-orange-500/20 font-semibold animate-pulse dark:bg-orange-500/20 dark:text-orange-400",
    ready: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold dark:bg-emerald-500/20 dark:text-emerald-400",
    served: "bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold dark:bg-purple-500/20 dark:text-purple-400",
    completed: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20 font-medium dark:bg-zinc-500/20 dark:text-zinc-400",
    rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold dark:bg-rose-500/20 dark:text-rose-400",
    cancelled: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-normal line-through dark:bg-zinc-500/20 dark:text-zinc-400",

    // Table Statuses
    available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
    occupied: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400",
    reserved: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400",

    // Inventory Statuses
    in_stock: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
    low: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
    critical: "bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold animate-pulse dark:bg-rose-500/20 dark:text-rose-400"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors capitalize",
        styles[variant] || styles.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}