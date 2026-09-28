"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { ChefHat, LogOut, Bell, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PendingApprovalScreen } from "@/components/pending-approval-screen";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "kitchen")) {
      if (user?.role === "admin") router.push("/admin/dashboard");
      else if (user?.role === "waiter") router.push("/waiter/dashboard");
      else router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (user.status === "pending" || user.status === "rejected") {
    return <PendingApprovalScreen />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Kitchen Header */}
      <header className="h-16 px-4 sm:px-6 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <img src="/logo.jpeg" alt="SwiftBite Logo" className="h-9 w-auto object-contain" />
          <div className="flex items-center space-x-2">
            <span className="font-black text-xl text-white tracking-tight">SWIFTBITE</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1">
              <ChefHat className="h-3.5 w-3.5" />
              <span>KITCHEN DISPLAY (KDS)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-zinc-400 border-r border-zinc-800 pr-4">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-200">Chef {user.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut().then(() => router.push("/login"))}
            className="text-xs text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main KDS Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
