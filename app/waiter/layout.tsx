"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { 
  LayoutDashboard, 
  Utensils, 
  PlusCircle, 
  Clock, 
  History, 
  LogOut, 
  UserCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { PendingApprovalScreen } from "@/components/pending-approval-screen";

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "waiter")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const navItems = [
    { name: "Dashboard", href: "/waiter/dashboard", icon: LayoutDashboard },
    { name: "Tables Map", href: "/waiter/tables", icon: Utensils },
    { name: "New Order", href: "/waiter/new-order", icon: PlusCircle },
    { name: "Active Orders", href: "/waiter/orders", icon: Clock },
    { name: "History", href: "/waiter/history", icon: History },
  ];

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
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-full bg-zinc-900 border-r border-zinc-800 flex-col shrink-0 relative z-50">
        <div className="h-16 shrink-0 px-6 border-b border-zinc-800 flex items-center space-x-3">
          <img src="/logo.jpeg" alt="SwiftBite Logo" className="h-9 w-auto object-contain" />
          <div>
            <span className="font-extrabold tracking-tight text-white text-lg">SWIFTBITE</span>
            <span className="ml-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">WAITER</span>
          </div>
        </div>

        {/* Waiter Profile */}
        <div className="shrink-0 p-4 mx-3 my-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Floor Staff</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/25"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-zinc-800">
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar for Waiter */}
        <header className="shrink-0 h-14 px-4 sm:px-6 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <img src="/logo.jpeg" alt="SwiftBite Logo" className="h-7 w-auto object-contain md:hidden" />
            <span className="font-bold text-sm text-zinc-100">
              Waiter &bull; {user.name}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut().then(() => router.push("/login"))}
              className="text-xs text-rose-400 hover:bg-rose-500/10 md:hidden"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto relative z-0 pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-zinc-900/95 border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around z-40 md:hidden backdrop-blur-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                isActive ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}