"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPOSOrders,
  getPOSInventory,
  getPOSProfitAndLossMetrics,
  POSOrder,
  POSInventoryItem,
  POSProfitLossMetrics,
} from "@/lib/pos-data";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Utensils,
  AlertTriangle,
  Award,
  Calendar,
  CalendarDays,
  CreditCard,
  Banknote,
  ShoppingBag,
  CheckCircle,
  Clock,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Coins,
  Receipt,
  Scale,
  Sparkles,
  PieChart,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { InventoryImportModal } from "@/components/inventory-import-modal";

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  ); // 0-indexed (0 = Jan)

  // Top level active report tab
  const [activeReportView, setActiveReportView] = useState<"pnl" | "revenue">(
    "pnl"
  );

  // Profit & Loss specific states
  const [pnlPeriod, setPnlPeriod] = useState<"today" | "month">("month");
  const [pnlMetrics, setPnlMetrics] = useState<POSProfitLossMetrics | null>(
    null
  );
  const [pnlDetailTab, setPnlDetailTab] = useState<"products" | "waste">(
    "products"
  );
  const [pnlSearchQuery, setPnlSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoadingPnl, setIsLoadingPnl] = useState(false);

  const refreshAllData = async () => {
    const [fetchedOrders, fetchedInv] = await Promise.all([
      getPOSOrders(),
      getPOSInventory(),
    ]);
    setOrders(fetchedOrders);
    setInventory(fetchedInv);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Fetch P&L metrics whenever period, selectedMonth, or selectedYear changes
  useEffect(() => {
    setIsLoadingPnl(true);
    getPOSProfitAndLossMetrics(pnlPeriod, selectedMonth, selectedYear)
      .then((metrics) => {
        setPnlMetrics(metrics);
        setIsLoadingPnl(false);
      })
      .catch(() => setIsLoadingPnl(false));
  }, [pnlPeriod, selectedMonth, selectedYear]);

  // Filter valid completed/served orders for strict accounting
  const validOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== "cancelled" && o.status !== "rejected"
    );
  }, [orders]);

  // Extract all unique years present in orders
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

    const cashRevenue = yearOrders
      .filter((o) => o.payment_method === "cash" || !o.payment_method)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const digitalRevenue = yearOrders
      .filter(
        (o) =>
          o.payment_method === "card" ||
          o.payment_method === "qr_online" ||
          o.payment_method === "split"
      )
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const avgMonthlyRevenue = Math.round(totalRevenue / 12);
    const avgOrderValue =
      totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

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

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Month-by-month breakdown for the selected year
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
        .filter(
          (o) =>
            o.payment_method === "card" ||
            o.payment_method === "qr_online" ||
            o.payment_method === "split"
        )
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

  const selectedMonthStats = useMemo(() => {
    return (
      monthBreakdown[selectedMonth] || {
        monthIndex: selectedMonth,
        monthName: monthNames[selectedMonth],
        revenue: 0,
        ordersCount: 0,
        cash: 0,
        digital: 0,
      }
    );
  }, [monthBreakdown, selectedMonth, monthNames]);

  // Top items overall in the selected period
  const itemCounts: Record<
    string,
    { name: string; count: number; revenue: number }
  > = {};
  yearlyStats.yearOrders.forEach((o) => {
    o.items?.forEach((i) => {
      const key = i.menu_item_name || "Unknown";
      if (!itemCounts[key])
        itemCounts[key] = { name: key, count: 0, revenue: 0 };
      itemCounts[key].count += i.quantity;
      itemCounts[key].revenue += i.price * i.quantity;
    });
  });
  const popularItems = Object.values(itemCounts).sort(
    (a, b) => b.count - a.count
  );

  // Filtered P&L itemized list
  const filteredPnlProducts = useMemo(() => {
    if (!pnlMetrics?.itemizedBreakdown) return [];
    if (!pnlSearchQuery.trim()) return pnlMetrics.itemizedBreakdown;
    const q = pnlSearchQuery.toLowerCase();
    return pnlMetrics.itemizedBreakdown.filter((item) =>
      item.menu_item_name.toLowerCase().includes(q)
    );
  }, [pnlMetrics?.itemizedBreakdown, pnlSearchQuery]);

  // Filtered P&L waste list
  const filteredPnlWaste = useMemo(() => {
    if (!pnlMetrics?.lossBreakdown) return [];
    if (!pnlSearchQuery.trim()) return pnlMetrics.lossBreakdown;
    const q = pnlSearchQuery.toLowerCase();
    return pnlMetrics.lossBreakdown.filter((w) =>
      w.inventory_name.toLowerCase().includes(q)
    );
  }, [pnlMetrics?.lossBreakdown, pnlSearchQuery]);

  // Export P&L Report to CSV
  const handleExportCSV = () => {
    if (!pnlMetrics) return;

    const periodLabel =
      pnlPeriod === "today"
        ? "Today"
        : `${monthNames[selectedMonth]}_${selectedYear}`;

    let csvContent = `SWIFTBITE RESTAURANT POS — PROFIT & LOSS REPORT\n`;
    csvContent += `Report Period:,${periodLabel}\n`;
    csvContent += `Generated On:,${new Date().toLocaleString()}\n\n`;

    csvContent += `FINANCIAL SUMMARY\n`;
    csvContent += `Gross Revenue:,Rs. ${pnlMetrics.revenue}\n`;
    csvContent += `Recipe Production Cost (COGS):,Rs. ${pnlMetrics.productionCost}\n`;
    csvContent += `Gross Profit:,Rs. ${pnlMetrics.grossProfit}\n`;
    csvContent += `Gross Profit Margin:,${pnlMetrics.grossProfitMargin}%\n`;
    csvContent += `Unsold Prep Waste Loss:,Rs. ${pnlMetrics.unsoldLoss}\n`;
    csvContent += `Net Realized Profit:,Rs. ${pnlMetrics.netProfit}\n`;
    csvContent += `Net Profit Margin:,${pnlMetrics.netProfitMargin}%\n\n`;

    csvContent += `PRODUCT PROFITABILITY BREAKDOWN\n`;
    csvContent += `Product Name,Quantity Sold,Revenue (Rs.),Recipe Cost (Rs.),Profit (Rs.),Margin (%)\n`;
    pnlMetrics.itemizedBreakdown.forEach((p) => {
      const margin =
        p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0;
      csvContent += `"${p.menu_item_name}",${p.quantity_sold},${p.revenue},${p.production_cost},${p.profit},${margin}%\n`;
    });

    csvContent += `\nUNSOLD PREP INVENTORY WASTE BREAKDOWN\n`;
    csvContent += `Ingredient Name,Unit,Daily Added,Consumed in Food,Unsold Waste,Unit Cost (Rs.),Loss Amount (Rs.)\n`;
    pnlMetrics.lossBreakdown.forEach((w) => {
      csvContent += `"${w.inventory_name}",${w.unit},${w.added_quantity},${w.consumed_quantity},${w.unsold_quantity},${w.unit_cost},${w.loss_amount}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `swiftbite-pnl-report-${periodLabel.toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── Top Header with Fiscal Year & View Switcher ────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Executive Financial Command
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Financial & Profitability Reports
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Recipe production costs (COGS), perishable prep waste tracking, and sales ledgers.
          </p>
        </div>

        {/* Global Controls: Year + Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector */}
          <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <span className="text-xs font-bold text-zinc-400 px-2 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-orange-400" />
              Year:
            </span>
            <div className="flex space-x-1">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    selectedYear === year
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Import Daily Stock Button */}
          <Button
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            <span>Import Daily Stock</span>
          </Button>

          {/* Export CSV Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl text-xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-emerald-400" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── Main Tab Navigation (P&L vs Sales Ledger) ──────── */}
      <div className="flex space-x-2 p-1.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 max-w-md shadow-inner">
        <button
          type="button"
          onClick={() => setActiveReportView("pnl")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide transition-all ${
            activeReportView === "pnl"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>PROFIT & LOSS (P&L)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveReportView("revenue")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide transition-all ${
            activeReportView === "revenue"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(255,184,0,0.3)] scale-[1.02]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>REVENUE & PAYMENT LEDGER</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: PROFIT & LOSS (EXECUTIVE SUITE)                             */}
      {/* =================================================================== */}
      {activeReportView === "pnl" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Sub-Bar: Period Switcher & Month Pills */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Financial Horizon:
              </span>
              <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPnlPeriod("today")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pnlPeriod === "today"
                      ? "bg-emerald-500 text-zinc-950 shadow-md font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Today's Snapshot
                </button>
                <button
                  type="button"
                  onClick={() => setPnlPeriod("month")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pnlPeriod === "month"
                      ? "bg-emerald-500 text-zinc-950 shadow-md font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Monthly Ledger
                </button>
              </div>
            </div>

            {/* Quick Month Selector if Monthly period */}
            {pnlPeriod === "month" && (
              <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 md:pb-0">
                {monthNames.map((name, idx) => (
                  <button
                    key={name}
                    onClick={() => setSelectedMonth(idx)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedMonth === idx
                        ? "bg-orange-600 text-white shadow-md font-black"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 4 Hero Financial Profit & Loss Cards (The Div Boxes) ─ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Gross Profit */}
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Gross Profit
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <span className="text-3xl font-black text-white">
                  Rs. {(pnlMetrics?.grossProfit || 0).toLocaleString()}
                </span>
                <div className="flex items-center mt-2 space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs text-emerald-400 font-bold">
                    {pnlMetrics?.grossProfitMargin || 0}% margin (Revenue − Production)
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 2: Production Cost (COGS) */}
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/20" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Production Cost (COGS)
                </span>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(255,184,0,0.2)]">
                  <Utensils className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <span className="text-3xl font-black text-amber-400">
                  Rs. {(pnlMetrics?.productionCost || 0).toLocaleString()}
                </span>
                <p className="text-xs text-zinc-400 font-medium mt-2">
                  {pnlMetrics?.soldItemsCount || 0} sold items recipe ingredients
                </p>
              </div>
            </Card>

            {/* Card 3: Unsold Inventory Loss */}
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Unsold Prep Waste Loss
                </span>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <span className="text-3xl font-black text-rose-400">
                  Rs. {(pnlMetrics?.unsoldLoss || 0).toLocaleString()}
                </span>
                <div className="flex items-center mt-2 space-x-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-xs text-rose-400 font-bold">
                    {pnlMetrics?.wasteItemsCount || 0} unconsumed daily added items
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 4: Net Realized Profit */}
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Net Realized Profit
                </span>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <span
                  className={`text-3xl font-black ${
                    (pnlMetrics?.netProfit || 0) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  Rs. {(pnlMetrics?.netProfit || 0).toLocaleString()}
                </span>
                <p className="text-xs text-emerald-400 font-bold mt-2">
                  {pnlMetrics?.netProfitMargin || 0}% net cash after deducting waste
                </p>
              </div>
            </Card>
          </div>

          {/* ── Visual Margin & Efficiency Meter Banner ──────── */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                  Fiscal Health & Cost Distribution
                </span>
                <h3 className="text-xl font-black text-white">
                  Revenue Breakdown (
                  {pnlPeriod === "today"
                    ? "Today"
                    : `${monthNames[selectedMonth]} ${selectedYear}`}
                  )
                </h3>
                <p className="text-xs text-zinc-400 max-w-lg">
                  Total Gross Revenue:{" "}
                  <strong className="text-white font-mono">
                    Rs. {(pnlMetrics?.revenue || 0).toLocaleString()}
                  </strong>
                  . Compare how much goes to ingredients, waste, and net profit.
                </p>
              </div>

              {/* Multi-Segment Percentage Bar */}
              <div className="lg:w-1/2 space-y-2">
                <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800 shadow-inner">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, pnlMetrics?.netProfitMargin || 0)
                      )}%`,
                    }}
                    title={`Net Profit: ${pnlMetrics?.netProfitMargin}%`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{
                      width: `${
                        pnlMetrics?.revenue
                          ? Math.round(
                              (pnlMetrics.productionCost / pnlMetrics.revenue) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                    title="Production Cost (COGS)"
                  />
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{
                      width: `${
                        pnlMetrics?.revenue
                          ? Math.round(
                              (pnlMetrics.unsoldLoss / pnlMetrics.revenue) * 100
                            )
                          : 0
                      }%`,
                    }}
                    title="Unsold Prep Waste"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                    Net Profit ({pnlMetrics?.netProfitMargin || 0}%)
                  </span>
                  <span className="text-amber-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                    COGS (
                    {pnlMetrics?.revenue
                      ? Math.round(
                          (pnlMetrics.productionCost / pnlMetrics.revenue) * 100
                        )
                      : 0}
                    %)
                  </span>
                  <span className="text-rose-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                    Waste (
                    {pnlMetrics?.revenue
                      ? Math.round(
                          (pnlMetrics.unsoldLoss / pnlMetrics.revenue) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Deep Dive P&L Tables (Product Profitability vs Waste) */}
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              {/* Table Sub-Tabs */}
              <div className="flex items-center space-x-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPnlDetailTab("products")}
                  className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    pnlDetailTab === "products"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>
                    Product Profitability Matrix (
                    {pnlMetrics?.itemizedBreakdown.length || 0})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPnlDetailTab("waste")}
                  className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    pnlDetailTab === "waste"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    Daily Prep & Waste Ledger (
                    {pnlMetrics?.lossBreakdown.length || 0})
                  </span>
                </button>
              </div>

              {/* Table Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  placeholder={
                    pnlDetailTab === "products"
                      ? "Search menu product…"
                      : "Search ingredient…"
                  }
                  value={pnlSearchQuery}
                  onChange={(e) => setPnlSearchQuery(e.target.value)}
                  className="pl-8 bg-zinc-950 border-zinc-800 text-xs h-9"
                />
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Tab A: Product Profitability Matrix */}
              {pnlDetailTab === "products" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900/80 sticky top-0 text-zinc-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">Menu Product</th>
                          <th className="py-3 px-3 text-center">Qty Sold</th>
                          <th className="py-3 px-3 text-right">Selling Price</th>
                          <th className="py-3 px-3 text-right">Recipe COGS</th>
                          <th className="py-3 px-3 text-right">Unit Profit</th>
                          <th className="py-3 px-4 text-right">Gross Total</th>
                          <th className="py-3 px-4 text-right">Total Profit</th>
                          <th className="py-3 px-4 text-center">Profit Margin</th>
                          <th className="py-3 px-3 text-center">Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {filteredPnlProducts.length > 0 ? (
                          filteredPnlProducts.map((p, idx) => {
                            const avgPrice =
                              p.quantity_sold > 0
                                ? Math.round(p.revenue / p.quantity_sold)
                                : 0;
                            const unitCost =
                              p.quantity_sold > 0
                                ? Math.round(
                                    p.production_cost / p.quantity_sold
                                  )
                                : 0;
                            const unitProfit = avgPrice - unitCost;
                            const marginPercent =
                              p.revenue > 0
                                ? Math.round((p.profit / p.revenue) * 100)
                                : 0;

                            const isStar = marginPercent >= 60;
                            const isLowMargin = marginPercent < 45;

                            return (
                              <tr key={idx} className="hover:bg-zinc-900/50">
                                <td className="py-3 px-4 font-bold text-white">
                                  {p.menu_item_name}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-zinc-200">
                                  {p.quantity_sold}x
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-zinc-300">
                                  Rs. {avgPrice.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-amber-400/90">
                                  Rs. {unitCost.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                                  Rs. {unitProfit.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-zinc-200">
                                  Rs. {p.revenue.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                                  Rs. {p.profit.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex items-center space-x-1.5 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        isStar
                                          ? "bg-emerald-400"
                                          : isLowMargin
                                          ? "bg-amber-400"
                                          : "bg-blue-400"
                                      }`}
                                    />
                                    <span className="font-mono font-bold text-zinc-200">
                                      {marginPercent}%
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {isStar ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      High Profit Star
                                    </span>
                                  ) : isLowMargin ? (
                                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      High COGS
                                    </span>
                                  ) : (
                                    <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      Standard
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={9}
                              className="py-12 text-center text-zinc-500"
                            >
                              No product sales recorded matching your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {filteredPnlProducts.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-zinc-800 bg-zinc-900/90 font-black text-white text-xs">
                            <td className="py-3 px-4 uppercase tracking-wider">
                              Total
                            </td>
                            <td className="py-3 px-3 text-center">
                              {pnlMetrics?.soldItemsCount || 0}x
                            </td>
                            <td colSpan={3}></td>
                            <td className="py-3 px-4 text-right font-mono text-zinc-300">
                              Rs. {(pnlMetrics?.revenue || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                              Rs. {(pnlMetrics?.grossProfit || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-emerald-400">
                              {pnlMetrics?.grossProfitMargin || 0}% avg
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* Tab B: Daily Prep Waste & Unsold Stock Ledger */}
              {pnlDetailTab === "waste" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900/80 sticky top-0 text-zinc-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">Raw Ingredient</th>
                          <th className="py-3 px-3 text-center">Stock Added</th>
                          <th className="py-3 px-3 text-center">Consumed in Food</th>
                          <th className="py-3 px-3 text-center">Unsold Stock</th>
                          <th className="py-3 px-4 text-right">Cost Per Unit</th>
                          <th className="py-3 px-4 text-right">Unsold Loss Amount</th>
                          <th className="py-3 px-4 text-center">Waste Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {filteredPnlWaste.length > 0 ? (
                          filteredPnlWaste.map((w, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/50">
                              <td className="py-3 px-4 font-bold text-white">
                                {w.inventory_name}
                              </td>
                              <td className="py-3 px-3 text-center font-mono text-zinc-300">
                                {w.added_quantity} {w.unit}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                                {w.consumed_quantity} {w.unit}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-black text-rose-400">
                                {w.unsold_quantity} {w.unit}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-zinc-400">
                                Rs. {w.unit_cost} / {w.unit}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-rose-400 text-sm">
                                Rs. {w.loss_amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                  Unconsumed Prep Loss
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-12 text-center text-zinc-500"
                            >
                              All added ingredients were consumed in orders or no prep additions logged for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {filteredPnlWaste.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-zinc-800 bg-zinc-900/90 font-black text-white text-xs">
                            <td className="py-3 px-4 uppercase tracking-wider">
                              Total Prep Waste Loss
                            </td>
                            <td colSpan={4}></td>
                            <td className="py-3 px-4 text-right font-mono text-rose-400 text-sm">
                              Rs. {(pnlMetrics?.unsoldLoss || 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: REVENUE & SALES PAYMENT LEDGER                              */}
      {/* =================================================================== */}
      {activeReportView === "revenue" && (
        <div className="space-y-8 animate-in fade-in duration-300">
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
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Total Annual Revenue
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(255,184,0,0.2)]">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 relative z-10">
                  <span className="text-3xl font-black text-white">
                    Rs. {yearlyStats.totalRevenue.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    Full year gross earnings for {selectedYear}
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Avg Monthly Revenue
                  </span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 relative z-10">
                  <span className="text-3xl font-black text-emerald-400">
                    Rs. {yearlyStats.avgMonthlyRevenue.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    12-month run rate benchmark
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Total Annual Orders
                  </span>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 relative z-10">
                  <span className="text-3xl font-black text-white">
                    {yearlyStats.totalOrdersCount}
                  </span>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    {yearlyStats.completedOrdersCount} successfully fulfilled
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/10" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Avg Order Value
                  </span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <Banknote className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 relative z-10">
                  <span className="text-3xl font-black text-purple-300">
                    Rs. {yearlyStats.avgOrderValue.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">
                    Average spend per ticket
                  </p>
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
                  Inspect itemized revenue, cash vs digital collections, and order volume.
                </p>
              </div>

              {/* Month Selector Tabs */}
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
                    <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
                      Selected Month
                    </span>
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
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Total Monthly Gross
                    </span>
                    <p className="text-3xl font-black text-white mt-2">
                      Rs. {selectedMonthStats.revenue.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                      All fulfilled customer orders
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                      <Banknote className="w-3.5 h-3.5 mr-1" />
                      <span>Cash Handover Revenue</span>
                    </span>
                    <p className="text-2xl font-black text-emerald-400 mt-2">
                      Rs. {selectedMonthStats.cash.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                      Cash desk & COD collected
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      <span>Digital / Card / QR</span>
                    </span>
                    <p className="text-2xl font-black text-cyan-300 mt-2">
                      Rs. {selectedMonthStats.digital.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                      Online transfers & card swipe
                    </p>
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
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  m.revenue > 0 ? "bg-emerald-400" : "bg-zinc-600"
                                }`}
                              />
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
                        <td className="py-4 px-4 text-sm uppercase tracking-wider">
                          Annual Total ({selectedYear})
                        </td>
                        <td className="py-4 px-4 text-center text-base">
                          {yearlyStats.totalOrdersCount}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-emerald-400 text-base">
                          Rs. {yearlyStats.cashRevenue.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-cyan-300 text-base">
                          Rs. {yearlyStats.digitalRevenue.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-orange-400 text-lg">
                          Rs. {yearlyStats.totalRevenue.toLocaleString()}
                        </td>
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
                <p className="text-sm text-zinc-500 py-6 text-center">
                  No orders recorded for year {selectedYear}.
                </p>
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
                          <h4 className="font-bold text-white text-xs">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            {item.count} units ordered
                          </p>
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
      )}

      {/* ── Daily Inventory Stock Ingestion Modal ──────────── */}
      <InventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        inventory={inventory}
        onImportComplete={refreshAllData}
      />
    </div>
  );
}
