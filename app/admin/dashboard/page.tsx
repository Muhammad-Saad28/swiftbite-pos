"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { 
  getPOSOrders, 
  getPOSTables, 
  getPOSInventory, 
  updateOrderStatus, 
  POSOrder, 
  POSTable, 
  POSInventoryItem 
} from "@/lib/pos-data";
import { DollarSign, ShoppingBag, Utensils, AlertTriangle, CheckCircle, XCircle, ArrowUpRight, Clock, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from "recharts";

// Mock Data for Charts
const revenueData = [
  { name: 'Mon', revenue: 12500 },
  { name: 'Tue', revenue: 15200 },
  { name: 'Wed', revenue: 11800 },
  { name: 'Thu', revenue: 18400 },
  { name: 'Fri', revenue: 24500 },
  { name: 'Sat', revenue: 32000 },
  { name: 'Sun', revenue: 28900 },
];

const popularItemsData = [
  { name: 'Smash Burger', sales: 145 },
  { name: 'Fried Chicken', sales: 112 },
  { name: 'Pepperoni Pizza', sales: 85 },
  { name: 'Loaded Fries', sales: 64 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl shadow-black/50">
        <p className="text-zinc-400 text-xs mb-1 font-semibold">{label}</p>
        <p className="text-orange-500 font-black text-sm">
          Rs. {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl shadow-black/50">
        <p className="text-zinc-400 text-xs mb-1 font-semibold">{label}</p>
        <p className="text-white font-black text-sm">
          {payload[0].value} Sales
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [tables, setTables] = useState<POSTable[]>([]);
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reject Modal State
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const refreshData = async () => {
    const [fetchedOrders, fetchedTables, fetchedInv] = await Promise.all([
      getPOSOrders(),
      getPOSTables(),
      getPOSInventory(),
    ]);
    setOrders(fetchedOrders);
    setTables(fetchedTables);
    setInventory(fetchedInv);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = async (id: string) => {
    await updateOrderStatus(id, "accepted");
    await refreshData();
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    await updateOrderStatus(rejectingOrderId, "rejected", rejectReason || "Item unavailable");
    setRejectingOrderId(null);
    setRejectReason("");
    await refreshData();
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800 rounded-md animate-pulse" />
            <div className="h-4 w-48 bg-zinc-800/50 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-48 bg-zinc-800 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                <div className="h-8 w-8 bg-zinc-800 rounded-xl animate-pulse" />
              </div>
              <div className="h-8 w-32 bg-zinc-800 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
          <div className="h-80 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const todayRevenue = orders
    .filter(o => o.status === "completed" || o.status === "served" || o.status === "ready" || o.status === "preparing" || o.status === "accepted")
    .reduce((sum, o) => sum + o.total, 0);

  const activeOrdersCount = orders.filter(o => o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected").length;
  const pendingOrders = orders.filter(o => o.status === "pending");
  const occupiedTables = tables.filter(t => t.status === "occupied").length;
  const lowStockItems = inventory.filter(i => i.status === "low" || i.status === "critical");

  return (
    <div className="space-y-8 pb-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Executive Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time SwiftBite POS operational overview & analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/admin/orders">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-all hover:scale-105 font-bold px-6">
              <span>Manage Live Orders ({activeOrdersCount})</span>
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Low Stock Alert Banners */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-4 shadow-[0_0_20px_rgba(244,63,94,0.1)] backdrop-blur-md">
          <div className="p-2 bg-rose-500/20 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div className="flex-1 text-sm mt-1">
            <span className="font-bold text-rose-400">Critical Inventory Alert: </span>
            {lowStockItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(", ")} requires immediate restocking.
          </div>
          <Link href="/admin/inventory">
            <Button size="sm" variant="outline" className="text-xs border-rose-500/30 hover:bg-rose-500/20 text-rose-200 mt-0.5">
              Restock Now
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-orange-500/10" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(255,184,0,0.2)]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black text-white">Rs. {todayRevenue.toLocaleString()}</span>
            <div className="flex items-center mt-2 space-x-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <p className="text-[11px] text-emerald-400 font-bold">+12% vs yesterday</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black text-white">{orders.length}</span>
            <p className="text-[11px] text-zinc-400 font-bold mt-2 tracking-wide">{activeOrdersCount} actively in progress</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Tables</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Utensils className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black text-white">{occupiedTables} <span className="text-xl text-zinc-600">/ {tables.length}</span></span>
            <p className="text-[11px] text-emerald-400 font-bold mt-2 tracking-wide">{Math.round((occupiedTables / (tables.length || 1)) * 100)}% Occupancy Rate</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/10" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Approval</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-black text-white">{pendingOrders.length}</span>
            <div className="flex items-center mt-2 space-x-1">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <p className="text-[11px] text-rose-400 font-bold">Needs admin decision</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Weekly Revenue Trend</span>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/5">This Week</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB800" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292929" vertical={false} />
                  <XAxis dataKey="name" stroke="#A3A3A3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A3A3A3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#FFB800" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Items Chart */}
        <Card className="bg-zinc-900/50 border-zinc-800/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Popular Items</span>
              <Utensils className="h-4 w-4 text-zinc-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularItemsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292929" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#A3A3A3" fontSize={12} tickLine={false} axisLine={false} hide />
                  <YAxis dataKey="name" type="category" stroke="#E4E4E7" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{fill: '#1C1C1C'}} />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                    {popularItemsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#FFB800" : index === 1 ? "#F59E0B" : "#D97706"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders Action Section */}
      <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800/50 pb-4">
          <CardTitle className="text-white flex items-center space-x-3 text-xl">
            <span>Incoming Waiter Orders Awaiting Approval</span>
            {pendingOrders.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingOrders.length} Pending
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {pendingOrders.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-white tracking-wide">Queue is Empty</p>
                <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">All submitted waiter orders have been accepted or processed. Enjoy the calm!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {pendingOrders.map((order) => (
                <div key={order.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-lg relative group transition-all hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(255,184,0,0.1)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-white text-lg">Order #{order.id}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1.5 text-xs font-medium">
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">Table {order.table_number ? order.table_number.toString().padStart(2, "0") : "N/A"}</span>
                        <span className="text-zinc-500">&bull;</span>
                        <span className="text-zinc-400">Waiter: {order.waiter_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-orange-400">Rs. {order.total}</span>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total</p>
                    </div>
                  </div>

                  {/* Itemized List */}
                  <div className="mt-4 pt-3 pb-2 border-y border-zinc-800/80 space-y-2 text-sm text-zinc-300">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center group/item">
                        <span className="font-medium group-hover/item:text-white transition-colors">{item.quantity}x {item.menu_item_name}</span>
                        <span className="text-zinc-500 font-mono text-xs">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <p className="text-xs text-amber-400/90 italic font-medium">📝 Note: "{order.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-4">
                    <Button
                      size="default"
                      onClick={() => handleAcceptOrder(order.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => setRejectingOrderId(order.id)}
                      className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold rounded-xl transition-all"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!rejectingOrderId}
        onClose={() => setRejectingOrderId(null)}
        title={`Reject Order #${rejectingOrderId}`}
      >
        <div className="space-y-5">
          <p className="text-sm text-zinc-400">
            Please provide a rejection reason for the waiter. This helps them inform the customer properly.
          </p>
          <div className="space-y-2">
            <Input
              label="Rejection Reason"
              placeholder="e.g. Chicken unavailable, Kitchen closed..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-zinc-950 border-zinc-800 focus:border-rose-500 focus:ring-rose-500/20"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setRejectingOrderId(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReject} className="rounded-xl bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20">
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}