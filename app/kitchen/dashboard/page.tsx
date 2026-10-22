"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPOSOrders, updateOrderStatus, POSOrder } from "@/lib/pos-data";
import { ChefHat, Clock, CheckCircle2, Flame, CheckSquare, Timer } from "lucide-react";

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [prevTicketCount, setPrevTicketCount] = useState(0);

  const refreshData = async () => {
    const fetched = await getPOSOrders();
    setOrders(fetched);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders that need kitchen preparation
  const kitchenTickets = orders.filter(
    (o) => o.status === "accepted" || o.status === "preparing"
  );

  useEffect(() => {
    if (kitchenTickets.length > prevTicketCount && prevTicketCount !== 0) {
      // Play ding sound
      const dingAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAIA/gD8=");
      dingAudio.volume = 0.8;
      dingAudio.play().catch(() => {});
    }
    setPrevTicketCount(kitchenTickets.length);
  }, [kitchenTickets.length, prevTicketCount]);

  const handleStartPreparing = async (id: string) => {
    await updateOrderStatus(id, "preparing");
    await refreshData();
  };

  const handleMarkReady = async (id: string) => {
    await updateOrderStatus(id, "ready");
    await refreshData();
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.3)]">
            <ChefHat className="h-7 w-7 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Kitchen Display System</h1>
            <p className="text-sm text-zinc-400 mt-1 font-medium tracking-wide">Live Order Feed &bull; Auto-syncing</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
            <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            <span className="text-sm font-bold text-white tracking-wider">
              {kitchenTickets.length} ACTIVE TICKETS
            </span>
          </div>
        </div>
      </div>

      {kitchenTickets.length === 0 ? (
        <div className="py-24 text-center rounded-3xl bg-zinc-900/50 border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Board is Clear</h3>
            <p className="text-base text-zinc-500 mt-2 max-w-md mx-auto">Great job! The kitchen is caught up. Waiting for new orders from the floor...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {kitchenTickets.map((order) => {
            const minutesElapsed = Math.max(
              0,
              Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60))
            );

            const isPreparing = order.status === "preparing";
            const isUrgent = minutesElapsed > 15;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl overflow-hidden shadow-2xl transition-all ${
                  isPreparing
                    ? isUrgent
                      ? "bg-rose-950/20 border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                      : "bg-orange-950/20 border-2 border-orange-500/50 shadow-[0_0_15px_rgba(255,184,0,0.1)]"
                    : "bg-zinc-900 border-2 border-zinc-700"
                }`}
              >
                {/* Colored Top Bar */}
                <div className={`h-2 w-full ${isPreparing ? (isUrgent ? 'bg-rose-500' : 'bg-orange-500') : 'bg-blue-500'}`} />
                
                <div className="p-5 flex-1 flex flex-col">
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-zinc-800/80">
                    <div>
                      <span className="text-3xl font-black text-white tracking-tighter block">
                        #{order.id.substring(0, 4)}
                      </span>
                      <span className="text-sm font-bold text-zinc-400 tracking-widest uppercase block mt-1">
                        {order.order_type === "delivery"
                          ? `🛵 Delivery: ${order.customer_name || "Online"}`
                          : order.order_type === "takeaway"
                          ? "🛍️ Takeaway"
                          : `🍽️ Dine-In: ${order.customer_name || "Guest"}`}
                      </span>
                    </div>

                    <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                      isUrgent ? "bg-rose-500 text-white animate-pulse" : "bg-zinc-950 text-zinc-300 border border-zinc-800"
                    }`}>
                      <Timer className="h-4 w-4" />
                      <span>{minutesElapsed}m</span>
                    </div>
                  </div>

                  {/* Highlighted Preparation Notes */}
                  {order.notes && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="font-black uppercase tracking-wider text-[11px] text-amber-500 block mb-1">
                        ⚠️ Note
                      </span>
                      <p className="text-amber-200 text-sm font-semibold">"{order.notes}"</p>
                    </div>
                  )}

                  {/* Itemized Order Checklist */}
                  <div className="mt-5 space-y-3 flex-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-800 pb-2">
                      {order.items?.length || 0} ITEMS TO PREPARE
                    </span>
                    <div className="space-y-2.5">
                      {order.items?.map((item) => (
                         <div
                         key={item.id}
                         className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50"
                       >
                         <span className="text-base font-bold text-zinc-100 uppercase tracking-wide leading-tight max-w-[70%]">
                           {item.menu_item_name}
                         </span>
                         <span className="h-9 min-w-[36px] px-2 rounded-lg bg-zinc-800 text-white font-black text-lg flex items-center justify-center">
                           {item.quantity}
                         </span>
                       </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kitchen Action Buttons */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 mt-auto">
                  {order.status === "accepted" ? (
                    <Button
                      onClick={() => handleStartPreparing(order.id)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm h-14 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-transform hover:-translate-y-1"
                    >
                      <span>COOKING</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm h-14 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-transform hover:-translate-y-1"
                    >
                      <CheckSquare className="mr-2 h-5 w-5" />
                      <span>MARK AS READY</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
