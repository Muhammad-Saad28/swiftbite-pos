"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPOSOrders, POSOrder } from "@/lib/pos-data";
import { useAuth } from "@/lib/auth/use-auth";
import { History, Search, CheckCircle } from "lucide-react";

export default function WaiterHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getPOSOrders(user?.id).then(setOrders);
  }, [user]);

  const historyOrders = orders.filter((o) => {
    const isMyOrder =
      !user ||
      (o.waiter_id && o.waiter_id === user.id) ||
      (o.waiter_name && o.waiter_name.toLowerCase() === user.name.toLowerCase());
    return (
      isMyOrder &&
      (o.status === "completed" || o.status === "cancelled" || o.status === "rejected")
    );
  });

  const filteredHistory = historyOrders.filter(
    (o) =>
      o.id.includes(searchQuery) ||
      (o.table_number && o.table_number.toString().includes(searchQuery))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Order History</h1>
          <p className="text-xs text-zinc-400">View completed and past order records</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHistory.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
            <p className="text-xs font-semibold text-zinc-400">No historical orders match your search</p>
          </div>
        ) : (
          filteredHistory.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-extrabold text-white text-sm">Order #{order.id}</span>
                  <p className="text-xs text-zinc-400">
                    Table {order.table_number ? order.table_number.toString().padStart(2, "0") : "N/A"} &bull; Waiter: {order.waiter_name}
                  </p>
                </div>
                <Badge variant={order.status}>{order.status}</Badge>
              </div>

              <div className="py-2 border-y border-zinc-800/80 space-y-1 text-xs text-zinc-300">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.menu_item_name} &times; {item.quantity}</span>
                    <span className="text-zinc-400">Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-zinc-500">
                  {order.completed_at ? new Date(order.completed_at).toLocaleString() : new Date(order.created_at).toLocaleString()}
                </span>
                <span className="font-extrabold text-orange-400 text-sm">Rs. {order.total}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
