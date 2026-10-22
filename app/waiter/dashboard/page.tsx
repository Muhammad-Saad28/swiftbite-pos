"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { getPOSOrders, getPOSTables, POSOrder, POSTable } from "@/lib/pos-data";
import { PlusCircle, Clock, Utensils, CheckCircle2, ArrowRight, Bell, Sparkles, ChefHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WaiterDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [tables, setTables] = useState<POSTable[]>([]);

  const refreshData = async () => {
    const [fetchedOrders, fetchedTables] = await Promise.all([
      user?.id ? getPOSOrders(user.id) : getPOSOrders(),
      getPOSTables(),
    ]);
    setOrders(fetchedOrders);
    setTables(fetchedTables);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const waiterOrders = orders.filter((o) => {
    if (!user) return false;
    return (
      (o.waiter_id && o.waiter_id === user.id) ||
      (o.waiter_name && o.waiter_name.toLowerCase() === user.name.toLowerCase())
    );
  });

  const pendingCount = waiterOrders.filter((o) => o.status === "pending").length;
  const readyCount = waiterOrders.filter((o) => o.status === "ready").length;
  const preparingCount = waiterOrders.filter((o) => o.status === "preparing").length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">Floor Dashboard</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">{user?.name || "Hassan"}</span></h1>
          <p className="text-sm text-zinc-400 font-medium tracking-wide">Manage tables, create orders, and deliver exceptional service.</p>
        </div>

        <Button
          onClick={() => router.push("/waiter/new-order")}
          className="relative z-10 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black text-sm h-14 px-8 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-transform hover:scale-105 flex items-center space-x-3"
        >
          <PlusCircle className="h-5 w-5" />
          <span>START NEW ORDER</span>
        </Button>
      </div>

      {/* Ready for Pickup Alert */}
      {readyCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-zinc-900 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-black text-emerald-400 tracking-wide">{readyCount} Order(s) Ready for Pickup!</p>
              <p className="text-sm text-emerald-400/80 font-medium">Kitchen has finished preparing. Please serve them to your tables.</p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/waiter/orders")}
            className="bg-emerald-600 hover:bg-emerald-500 text-sm font-black text-white h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/30 shrink-0 w-full sm:w-auto"
          >
            Serve Now
          </Button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Ready</span>
          <p className="text-4xl font-black text-emerald-400 relative z-10">{readyCount}</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Pending</span>
          <p className="text-4xl font-black text-amber-400 relative z-10">{pendingCount}</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Cooking</span>
          <p className="text-4xl font-black text-orange-400 relative z-10">{preparingCount}</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Completed</span>
          <p className="text-4xl font-black text-emerald-400 relative z-10">{orders.filter(o => o.status === "completed" || o.status === "served").length}</p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => router.push("/waiter/new-order")}
          className="group cursor-pointer rounded-3xl bg-zinc-900 border border-zinc-800 p-6 transition-all hover:bg-zinc-800/50 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(255,184,0,0.1)] relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6">
            <PlusCircle className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 group-hover:text-orange-400 transition-colors">Create Order</h3>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">Punch items, add guest preferences, and send orders straight to kitchen.</p>
        </div>

        <div
          onClick={() => router.push("/waiter/orders")}
          className="group cursor-pointer rounded-3xl bg-zinc-900 border border-zinc-800 p-6 transition-all hover:bg-zinc-800/50 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="h-14 w-14 rounded-2xl bg-zinc-800 text-zinc-100 border border-zinc-700 flex items-center justify-center shadow-lg mb-6 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">Track Orders</h3>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">Monitor live progress, check kitchen status, and mark dishes as served.</p>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <h2 className="text-lg font-black text-white flex items-center">
            <ChefHat className="mr-3 h-5 w-5 text-orange-500" />
            Your Live Orders
          </h2>
          <Link href="/waiter/orders" className="text-sm text-orange-500 font-bold hover:text-orange-400 flex items-center group">
            <span>View All</span>
            <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="p-6">
          {waiterOrders.length === 0 ? (
            <div className="text-center py-10">
              <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-8 w-8 text-zinc-600" />
              </div>
              <p className="text-lg font-bold text-zinc-300">No Active Orders</p>
              <p className="text-sm text-zinc-500 mt-1">You don't have any orders currently in progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {waiterOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="flex items-center space-x-3 mb-1.5">
                      <span className="font-black text-white text-base tracking-wide">#{order.id.substring(0, 6)}</span>
                      <Badge variant={order.status} className="px-2 py-0">{order.status}</Badge>
                    </div>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      {order.customer_name || "Counter / Guest"} &bull; {order.items?.length || 0} items
                    </p>
                  </div>
                  <span className="font-black text-orange-400 text-lg">Rs. {order.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}