"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { 
  CreditCard, 
  PlusCircle, 
  Receipt,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "cashier" && user.role !== "admin"))) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const navItems = [
    { name: "Order Desk & Queue", href: "/cashier/dashboard", icon: CreditCard },
    { name: "Express POS Register", href: "/cashier/pos", icon: PlusCircle },
    { name: "Settled Bills", href: "/cashier/history", icon: Receipt },
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <img src="/logo.jpeg" alt="SwiftBite Logo" className="h-9 w-auto object-contain rounded-full" />
          <div className="flex items-center space-x-2">
            <span className="font-black text-xl text-white tracking-tight">SWIFTBITE</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1">
              <CreditCard className="h-3.5 w-3.5" />
              <span>CASHIER DESK</span>
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-white">{user.name}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{user.role}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={signOut}
            className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 p-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-around z-40 backdrop-blur-lg px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center w-full py-1 text-[10px] font-bold transition-colors ${
                isActive ? "text-orange-500" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
