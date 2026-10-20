"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/use-auth";
import { getPOSOrders, POSOrder } from "@/lib/pos-data";
import { CheckCircle2, History, DollarSign, MapPin } from "lucide-react";

export default function RiderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<POSOrder[]>([]);

  useEffect(() => {
    getPOSOrders().then(setOrders);
  }, []);

  const completedTrips = orders.filter(
    (o) =>
      o.order_type === "delivery" &&
      (o.status === "completed" || o.delivery_status === "delivered") &&
      (!user || o.assigned_rider_id === user.id || (user.name && o.assigned_rider_name?.toLowerCase() === user.name.toLowerCase()))
  );

  const totalCodCollected = completedTrips.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Rider Delivery History & Cash Deposit</h1>
          <p className="text-xs text-zinc-400">Log of all completed doorstep drop-offs and collected Cash on Delivery</p>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center space-x-3">
          <span className="text-xs text-zinc-400">Total COD Collected:</span>
          <span className="text-base font-black text-emerald-400 font-mono">Rs. {totalCodCollected.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-3">
        {completedTrips.length === 0 ? (
          <div className="p-10 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
            <History className="h-7 w-7 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-400">No completed delivery trips found yet</p>
            <p className="text-xs text-zinc-600">Once you deliver orders and confirm COD handover, your trips will appear here.</p>
          </div>
        ) : (
          completedTrips.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-white text-sm">Order #{order.id}</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Customer: {order.customer_name || "Guest"} ({order.customer_phone || "N/A"})
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 text-sm">Rs. {order.total}</span>
                  <Badge variant="completed" className="ml-2">Delivered</Badge>
                </div>
              </div>

              {order.delivery_address && (
                <div className="flex items-center space-x-1.5 text-xs text-zinc-300 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
