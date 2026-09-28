"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getPOSOrders, getPOSMenuItems, POSOrder } from "@/lib/pos-data";
import { BarChart3, TrendingUp, DollarSign, Award, CheckCircle } from "lucide-react";

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [range, setRange] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    getPOSOrders().then(setOrders);
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "served").length;
  const avgOrderVal = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // Popular items ranking calculation
  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.items?.forEach((i) => {
      const key = i.menu_item_name || "Unknown";
      if (!itemCounts[key]) itemCounts[key] = { name: key, count: 0, revenue: 0 };
      itemCounts[key].count += i.quantity;
      itemCounts[key].revenue += i.price * i.quantity;
    });
  });

  const popularItems = Object.values(itemCounts).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sales & Performance Analytics</h1>
          <p className="text-xs text-zinc-400">Financial reports, tax totals, and top-performing dishes</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setRange("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              range === "today" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setRange("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              range === "week" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setRange("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              range === "month" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gross Sales</span>
          <p className="text-2xl font-black text-white mt-2">Rs. {totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Includes tax & subtotal</p>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tax Total (18%)</span>
          <p className="text-2xl font-black text-amber-400 mt-2">Rs. {totalTax.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 font-medium mt-1">Government sales tax</p>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Avg Order Value</span>
          <p className="text-2xl font-black text-white mt-2">Rs. {avgOrderVal.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 font-medium mt-1">Per processed order</p>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fulfilled Orders</span>
          <p className="text-2xl font-black text-emerald-400 mt-2">{completedOrders}</p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Successfully served</p>
        </Card>
      </div>

      {/* Top Selling Dishes Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-400" />
            <span>Top Selling Menu Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {popularItems.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-7 w-7 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-black text-xs">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.name}</h4>
                    <p className="text-[11px] text-zinc-400">{item.count} units ordered</p>
                  </div>
                </div>
                <span className="font-extrabold text-orange-400 text-xs">
                  Rs. {item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
