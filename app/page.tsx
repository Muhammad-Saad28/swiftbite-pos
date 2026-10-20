"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "kitchen") {
        router.replace("/kitchen/dashboard");
      } else if (user.role === "cashier") {
        router.replace("/cashier/dashboard");
      } else if (user.role === "rider") {
        router.replace("/rider/dashboard");
      } else {
        router.replace("/waiter/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl ring-4 ring-orange-500/10">
          <img src="/logo.jpeg" alt="SwiftBite Logo" className="h-16 w-auto object-contain animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">SWIFTBITE POS</h1>
          <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase">Restaurant Ecosystem</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-orange-400 font-medium pt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading system environment...</span>
        </div>
      </div>
    </div>
  );
}
