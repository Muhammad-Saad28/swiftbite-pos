"use client";

import React from "react";
import { cn } from "./utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const variants = {
      primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-sm border border-orange-500/30",
      secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600",
      outline: "border border-zinc-300 bg-transparent hover:bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
      ghost: "hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-10 px-4 text-sm font-medium rounded-lg",
      lg: "h-12 px-6 text-base font-semibold rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";