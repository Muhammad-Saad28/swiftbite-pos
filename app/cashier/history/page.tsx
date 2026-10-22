"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPOSOrders, POSOrder } from "@/lib/pos-data";
import { ReceiptModal } from "@/components/receipt-modal";
import { Search, Printer, Receipt, DollarSign, CheckCircle2, Banknote, CreditCard, QrCode } from "lucide-react";

export default function CashierHistoryPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<POSOrder | null>(null);

  useEffect(() => {
    getPOSOrders().then(setOrders);
  }, []);

  const completedOrders = orders.filter((o) => o.status === "completed");

  const cashOrders = completedOrders.filter((o) => !o.payment_method || o.payment_method === "cash");
  const onlineOrders = completedOrders.filter((o) => o.payment_method === "card" || o.payment_method === "qr_online" || o.payment_method === "split");


  const totalCashRevenue = cashOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOnlineRevenue = onlineOrders.reduce((sum, o) => sum + o.total, 0);

  const filtered = completedOrders.filter((o) => {
    return (
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.payment_method && o.payment_method.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const totalSettledRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Settled Receipts & Financial Ledger</h1>
          <p className="text-xs text-zinc-400">Complete archive of closed transactions, collected payments, and thermal reprints</p>
        </div>
      </div>

      {/* Financial Summary Breakdown Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Total Settled Sales</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">Rs. {totalSettledRevenue.toLocaleString()}</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">{completedOrders.length} Completed Orders</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Cash Payments</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">Rs. {totalCashRevenue.toLocaleString()}</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">{cashOrders.length} Cash Transactions</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Banknote className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">Online / Card Transfers</span>
            <span className="text-xl sm:text-2xl font-black text-sky-300 font-mono">Rs. {totalOnlineRevenue.toLocaleString()}</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">{onlineOrders.length} Online / Card Transactions</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full sm:w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search Receipt #, customer, payment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
            <CheckCircle2 className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-400">No settled transactions found</p>
          </div>
        ) : (
          filtered.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800 p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-black text-white">Order #{order.id}</span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(order.completed_at || order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="completed">Settled</Badge>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1 text-xs">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-zinc-300">
                      <span>{item.quantity}x {item.menu_item_name}</span>
                      <span className="font-mono text-zinc-400">Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white text-xs">
                    <span>Paid via: <strong className="uppercase text-emerald-400">{order.payment_method || "Cash"}</strong></span>
                    <span className="text-orange-400 font-mono text-sm">Rs. {order.total}</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedReceiptOrder(order)}
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold flex items-center justify-center space-x-1"
              >
                <Printer className="h-3.5 w-3.5 text-orange-400" />
                <span>Thermal Reprint</span>
              </Button>
            </Card>
          ))
        )}
      </div>

      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
}
