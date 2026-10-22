"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getPOSOrders, POSOrder } from "@/lib/pos-data";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Calendar, 
  CalendarDays, 
  CreditCard, 
  Banknote, 
  ShoppingBag, 
  CheckCircle,
  Clock,
  ChevronDown
} from "lucide-react";

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed (0 = Jan)

  useEffect(() => {
    getPOSOrders().then(setOrders);
  }, []);

  // Filter valid completed/served orders for strict accounting (also fallback to all valid non-cancelled orders)
  const validOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== "cancelled" && o.status !== "rejected"
    );
  }, [orders]);

  // Extract all unique years present in orders (default to current year if none)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    validOrders.forEach((o) => {
      if (o.created_at) {
        const y = new Date(o.created_at).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [validOrders]);

  // Yearly calculations
  const yearlyStats = useMemo(() => {
    const yearOrders = validOrders.filter((o) => {
      const d = new Date(o.created_at);
      return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
    });

    const totalRevenue = yearOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrdersCount = yearOrders.length;
    const completedOrdersCount = yearOrders.filter(
      (o) => o.status === "completed" || o.status === "served"
    ).length;

    // Payment breakdowns for the year
    const cashRevenue = yearOrders
      .filter((o) => o.payment_method === "cash" || !o.payment_method)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const digitalRevenue = yearOrders
      .filter((o) => o.payment_method === "card" || o.payment_method === "qr_online" || o.payment_method === "split")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const avgMonthlyRevenue = Math.round(totalRevenue / 12);
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    return {
      totalRevenue,
      totalOrdersCount,
      completedOrdersCount,
      cashRevenue,
      digitalRevenue,
      avgMonthlyRevenue,
      avgOrderValue,
      yearOrders,
    };
  }, [validOrders, selectedYear]);

  // Month-by-month breakdown for the selected year (Jan - Dec)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthBreakdown = useMemo(() => {
    return monthNames.map((name, index) => {
      const mOrders = yearlyStats.yearOrders.filter((o) => {
        const d = new Date(o.created_at);
        return !isNaN(d.getTime()) && d.getMonth() === index;
      });

      const revenue = mOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const ordersCount = mOrders.length;
      const cash = mOrders
        .filter((o) => o.payment_method === "cash" || !o.payment_method)
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const digital = mOrders
        .filter((o) => o.payment_method === "card" || o.payment_method === "qr_online" || o.payment_method === "split")
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        monthIndex: index,
        monthName: name,
        revenue,
        ordersCount,
        cash,
        digital,
      };
    });
  }, [yearlyStats.yearOrders, monthNames]);

  // Monthly stats for the actively selected month
  const selectedMonthStats = useMemo(() => {
    return monthBreakdown[selectedMonth] || {
      monthIndex: selectedMonth,
      monthName: monthNames[selectedMonth],
      revenue: 0,
      ordersCount: 0,
      cash: 0,
      digital: 0,
    };
  }, [monthBreakdown, selectedMonth, monthNames]);

  // Top items overall in the selected period
  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  yearlyStats.yearOrders.forEach((o) => {
    o.items?.forEach((i) => {
      const key = i.menu_item_name || "Unknown";
      if (!itemCounts[key]) itemCounts[key] = { name: key, count: 0, revenue: 0 };
      itemCounts[key].count += i.quantity;
      itemCounts[key].revenue += i.price * i.quantity;
    });
  });
  const popularItems = Object.values(itemCounts).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 pb-10">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Revenue & Financial Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">Detailed calculation of monthly and yearly business revenue</p>
        </div>
        
        {/* Year Selector Control */}
        <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl shadow-inner">
          <div className="flex items-center space-x-2 px-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>Select Year:</span>
          </div>
          <div className="flex space-x-1">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  selectedYear === year
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(255,184,0,0.3)] scale-105"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: YEARLY REVENUE OVERVIEW CARDS */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-black text-white tracking-wide">
            Year {selectedYear} Revenue Summary
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/10" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Annual Revenue</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(255,184,0,0.2)]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <span className="text-3xl font-black text-white">Rs. {yearlyStats.totalRevenue.toLocaleString()}</span>
              <p className="text-[11px] text-zinc-400 font-medium mt-1">Full year gross earnings for {selectedYear}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Monthly Revenue</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <span className="text-3xl font-black text-emerald-400">Rs. {yearlyStats.avgMonthlyRevenue.toLocaleString()}</span>
              <p className="text-[11px] text-zinc-400 font-medium mt-1">12-month run rate benchmark</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Annual Orders</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <span className="text-3xl font-black text-white">{yearlyStats.totalOrdersCount}</span>
              <p className="text-[11px] text-zinc-400 font-medium mt-1">{yearlyStats.completedOrdersCount} successfully fulfilled</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/10" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Order Value</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <span className="text-3xl font-black text-purple-300">Rs. {yearlyStats.avgOrderValue.toLocaleString()}</span>
              <p className="text-[11px] text-zinc-400 font-medium mt-1">Average spend per ticket</p>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 2: MONTHLY CALCULATOR & ACTIVE MONTH DETAIL */}
      <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50 border-b border-zinc-800/60 pb-5">
          <div>
            <CardTitle className="text-white flex items-center space-x-2 text-xl font-black">
              <CalendarDays className="h-5 w-5 text-orange-400" />
              <span>Monthly Revenue Calculator & Ledger</span>
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              Select any month below to inspect itemized revenue, cash vs digital collections, and order volume.
            </p>
          </div>

          {/* Quick Month Selector Tabs */}
          <div className="flex items-center bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 overflow-x-auto max-w-full">
            {monthNames.map((name, idx) => (
              <button
                key={name}
                onClick={() => setSelectedMonth(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedMonth === idx
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 font-black"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Selected Month Highlight Cards */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900/80 border border-zinc-800/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">Selected Month</span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  {selectedMonthStats.monthName} {selectedYear} Revenue
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  {selectedMonthStats.ordersCount} Total Orders
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Monthly Gross</span>
                <p className="text-3xl font-black text-white mt-2">Rs. {selectedMonthStats.revenue.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">All fulfilled customer orders</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                  <Banknote className="w-3.5 h-3.5 mr-1" />
                  <span>Cash Handover Revenue</span>
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-2">Rs. {selectedMonthStats.cash.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">Cash desk & COD collected</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                  <span>Digital / Card / QR</span>
                </span>
                <p className="text-2xl font-black text-cyan-300 mt-2">Rs. {selectedMonthStats.digital.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">Online transfers & card swipe</p>
              </div>
            </div>
          </div>

          {/* Full Year Month-by-Month Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              All 12 Months Breakdown ({selectedYear})
            </h4>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Month</th>
                    <th className="py-3.5 px-4 text-center">Orders Count</th>
                    <th className="py-3.5 px-4 text-right">Cash Revenue</th>
                    <th className="py-3.5 px-4 text-right">Digital / Online</th>
                    <th className="py-3.5 px-4 text-right">Gross Total</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {monthBreakdown.map((m) => {
                    const isSelected = selectedMonth === m.monthIndex;
                    return (
                      <tr 
                        key={m.monthIndex}
                        className={`transition-colors ${
                          isSelected 
                            ? "bg-orange-500/10 font-bold" 
                            : "hover:bg-zinc-900/40"
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${m.revenue > 0 ? "bg-emerald-400" : "bg-zinc-600"}`} />
                          <span>{m.monthName}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-black uppercase">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-zinc-300 font-semibold">
                          {m.ordersCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-300">
                          Rs. {m.cash.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-cyan-300">
                          Rs. {m.digital.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-orange-400 text-base">
                          Rs. {m.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedMonth(m.monthIndex)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-orange-600 text-white"
                                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            }`}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-900/90 font-black text-white">
                    <td className="py-4 px-4 text-sm uppercase tracking-wider">Annual Total ({selectedYear})</td>
                    <td className="py-4 px-4 text-center text-base">{yearlyStats.totalOrdersCount}</td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-400 text-base">Rs. {yearlyStats.cashRevenue.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono text-cyan-300 text-base">Rs. {yearlyStats.digitalRevenue.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono text-orange-400 text-lg">Rs. {yearlyStats.totalRevenue.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: TOP SELLING ITEMS FOR THE YEAR */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-400" />
            <span>Top Performing Menu Items ({selectedYear})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {popularItems.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">No orders recorded for year {selectedYear}.</p>
          ) : (
            <div className="space-y-3">
              {popularItems.slice(0, 6).map((item, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
