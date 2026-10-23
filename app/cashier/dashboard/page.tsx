"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { 
  getPOSOrders, 
  updateOrderStatus, 
  updatePOSOrderPaymentAndDiscount, 
  getPOSUsers,
  assignOrderRider,
  confirmRiderCashHandover,
  CANCELLATION_PIN,
  requestOrderCancellation,
  startOrderKitchenTimer,
  stopOrderKitchenTimer,
  setOrderTimer,
  POSOrder, 
  POSUser 
} from "@/lib/pos-data";
import { ReceiptModal } from "@/components/receipt-modal";
import { KitchenReceiptModal } from "@/components/kitchen-receipt-modal";
import { LiveTimerBadge } from "@/components/live-timer-badge";
import { 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Printer, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  Percent, 
  Sparkles,
  Bike,
  Utensils,
  ShoppingBag,
  Truck,
  CheckCircle2,
  HandCoins,
  ChefHat,
  Ban,
  ShieldAlert,
  KeyRound
} from "lucide-react";
import Link from "next/link";

export default function CashierDashboardPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [riders, setRiders] = useState<POSUser[]>([]);
  const [activeTab, setActiveTab] = useState<string>("pending_confirmation");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<POSOrder | null>(null);
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState<POSOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<POSOrder | null>(null);
  const [cancelPin, setCancelPin] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Settlement Checkout Modal State
  const [checkoutOrder, setCheckoutOrder] = useState<POSOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr_online" | "split">("cash");
  const [discountType, setDiscountType] = useState<"percentage" | "flat" | "none">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>("");

  // Payment Success Confirmation Modal State
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    order: POSOrder;
    paidAmount: number;
    paymentMethod: string;
    discountAmt: number;
    changeDue: number;
  } | null>(null);

  // Assign Rider Modal State
  const [dispatchOrder, setDispatchOrder] = useState<POSOrder | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");

  const refreshData = async () => {
    const [fetchedOrders, fetchedUsers] = await Promise.all([
      getPOSOrders(),
      getPOSUsers(),
    ]);
    setOrders(fetchedOrders);
    setRiders(fetchedUsers.filter(u => u.role === "rider" && (u.status === "approved" || (!u.status && u.active))));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Confirm order and send to kitchen
  const handleConfirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "accepted");
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      await startOrderKitchenTimer(orderId);
      setSelectedKitchenOrder({ ...targetOrder, status: "accepted" });
    }
    await refreshData();
  };



  const handleOpenKitchenKOT = async (order: POSOrder) => {
    let startedTime: string | null = null;
    // Start kitchen timer when KOT receipt is opened/printed
    startedTime = await startOrderKitchenTimer(order.id);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, kitchen_started_at: o.kitchen_started_at || startedTime } : o
      )
    );
    setSelectedKitchenOrder({
      ...order,
      kitchen_started_at: order.kitchen_started_at || startedTime,
    });
    await refreshData();
  };



  const handleStopRiderTimer = async (orderId: string) => {
    const stoppedTime = await setOrderTimer(orderId, "handover_completed_at");
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, handover_completed_at: stoppedTime } : o
      )
    );
    await refreshData();
  };

  const handleRiderDeparted = async (orderId: string) => {
    // Start rider trip timer & stop kitchen preparation timer when rider leaves
    const [startedTime] = await Promise.all([
      setOrderTimer(orderId, "ride_started_at"),
      stopOrderKitchenTimer(orderId),
    ]);
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              ride_started_at: startedTime,
              delivery_status: "picked_up",
              served_at: o.served_at || nowIso,
            }
          : o
      )
    );
    await refreshData();
  };

  const handleMarkServed = async (orderId: string) => {
    await stopOrderKitchenTimer(orderId);
    await refreshData();
  };

  const handleOpenCancelModal = (order: POSOrder) => {
    setCancellingOrder(order);
    setCancelPin("");
    setCancelReason("");
    setCancelError(null);
    setCancelSuccess(null);
  };

  const handleCancelWithPin = async () => {
    if (!cancellingOrder) return;
    setCancelError(null);
    if (cancelPin.trim() !== CANCELLATION_PIN) {
      setCancelError("Incorrect PIN! Enter valid supervisor PIN or request Admin Approval.");
      return;
    }
    await updateOrderStatus(cancellingOrder.id, "cancelled", cancelReason || "Cancelled with Supervisor PIN");
    setCancellingOrder(null);
    await refreshData();
  };

  const handleRequestAdminApproval = async () => {
    if (!cancellingOrder) return;
    setCancelError(null);
    await requestOrderCancellation(cancellingOrder.id, cancelReason || "Customer cancellation requested by cashier");
    setCancelSuccess("Cancellation request submitted to Admin! Waiting for Admin confirmation.");
    setTimeout(async () => {
      setCancellingOrder(null);
      await refreshData();
    }, 1200);
  };

  const handleRejectOrder = async () => {
    if (!rejectingId) return;
    await updateOrderStatus(rejectingId, "rejected", rejectReason || "Rejected by Cashier Desk");
    setRejectingId(null);
    setRejectReason("");
    await refreshData();
  };

  const openCheckoutModal = (order: POSOrder) => {
    setCheckoutOrder(order);
    setPaymentMethod(order.payment_method || "cash");
    setDiscountType(order.discount_type || "none");
    setDiscountValue(order.discount_amount || 0);
    setCashTendered(order.total.toString());
  };

  const handleFinalizeSettlement = async () => {
    if (!checkoutOrder) return;
    const subtotal = checkoutOrder.subtotal || 0;
    let discountAmt = 0;
    if (discountType === "percentage") discountAmt = Math.round(subtotal * ((discountValue || 0) / 100));
    else if (discountType === "flat") discountAmt = discountValue || 0;
    const netTotal = Math.max(0, subtotal - discountAmt);
    const tendered = parseFloat(cashTendered) || netTotal;
    const change = Math.max(0, tendered - netTotal);

    await updatePOSOrderPaymentAndDiscount(checkoutOrder.id, paymentMethod, discountValue, discountType);
    await updateOrderStatus(checkoutOrder.id, "completed");
    
    const updatedOrder: POSOrder = {
      ...checkoutOrder,
      payment_method: paymentMethod,
      discount_amount: discountValue,
      discount_type: discountType,
      total: netTotal,
      status: "completed",
    };

    // Show Confirmation Screen
    setPaymentSuccessData({
      order: updatedOrder,
      paidAmount: netTotal,
      paymentMethod,
      discountAmt,
      changeDue: paymentMethod === "cash" ? change : 0,
    });

    setCheckoutOrder(null);
    await refreshData();
  };

  const handleConfirmRiderCashHandover = async (orderId: string) => {
    await confirmRiderCashHandover(orderId);
    await refreshData();
  };

  const handleAssignRider = async () => {
    if (!dispatchOrder || !selectedRiderId) return;
    const rider = riders.find(r => r.id === selectedRiderId);
    if (rider) {
      await assignOrderRider(dispatchOrder.id, rider.id, rider.name);
    }
    setDispatchOrder(null);
    setSelectedRiderId("");
    await refreshData();
  };

  // Filter queues
  const pendingOrders = orders.filter(o => o.status === "pending");
  const readyForSettlement = orders.filter(o => o.status !== "completed" && o.status !== "rejected" && o.status !== "cancelled" && o.delivery_status !== "handover_pending");
  const rejectedOrCancelledOrders = orders.filter(o => o.status === "rejected" || o.status === "cancelled");
  const activeDeliveries = orders.filter(o => o.order_type === "delivery" && o.status !== "completed" && o.status !== "rejected" && o.status !== "cancelled");
  const riderHandovers = orders.filter(o => o.order_type === "delivery" && o.delivery_status === "handover_pending" && o.status !== "completed" && o.status !== "rejected" && o.status !== "cancelled");
  const totalRiderCashOwed = riderHandovers.reduce((sum, o) => sum + (o.total || 0), 0);

  const filteredOrders = orders.filter((o) => {
    let matchesTab = true;
    if (activeTab === "pending_confirmation") matchesTab = o.status === "pending";
    else if (activeTab === "settlement") matchesTab = o.status !== "completed" && o.status !== "rejected" && o.status !== "cancelled" && o.delivery_status !== "handover_pending";
    else if (activeTab === "delivery") matchesTab = o.order_type === "delivery" && o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected";
    else if (activeTab === "rider_handover") matchesTab = o.delivery_status === "handover_pending" && o.status !== "completed";
    else if (activeTab === "completed") matchesTab = o.status === "completed";
    else if (activeTab === "rejected") matchesTab = o.status === "rejected" || o.status === "cancelled";

    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.waiter_name && o.waiter_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.table_number && o.table_number.toString().includes(searchQuery));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Front Desk Authorization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Cashier Control & Billing Station
          </h1>
          <p className="text-xs text-zinc-400">
            Confirm incoming waiter orders, collect payments, apply bill discounts & dispatch delivery orders
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/cashier/pos">
            <Button className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black text-xs h-10 px-4 rounded-xl shadow-lg shadow-orange-600/20">
              <CreditCard className="h-4 w-4 mr-1.5" />
              <span>NEW EXPRESS SALE</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Awaiting Confirmation</span>
            <Clock className="h-4 w-4" />
          </span>
          <p className="text-3xl font-black text-white mt-2">{pendingOrders.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Waiter orders to confirm</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Ready for Settlement</span>
            <DollarSign className="h-4 w-4" />
          </span>
          <p className="text-3xl font-black text-white mt-2">{readyForSettlement.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Bills to collect</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>Delivery Orders</span>
            <Bike className="h-4 w-4" />
          </span>
          <p className="text-3xl font-black text-white mt-2">{activeDeliveries.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Rider dispatch & trips</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Riders</span>
            <Truck className="h-4 w-4" />
          </span>
          <p className="text-3xl font-black text-white mt-2">{riders.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Available for dispatch</p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("pending_confirmation")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "pending_confirmation"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <span>Confirm Orders</span>
            {pendingOrders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "pending_confirmation" ? "bg-zinc-950 text-amber-400" : "bg-amber-500 text-zinc-950"
              }`}>
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settlement")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "settlement"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <span>Bill Settlement</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "settlement" ? "bg-emerald-700 text-white" : "bg-zinc-800 text-zinc-400"
            }`}>
              {readyForSettlement.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rider_handover")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "rider_handover"
                ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <span>💵 Rider Cash Handover</span>
            {riderHandovers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-zinc-950 text-amber-400 animate-pulse">
                {riderHandovers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("delivery")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "delivery"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <span>Delivery Dispatch</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === "delivery" ? "bg-sky-700 text-white" : "bg-zinc-800 text-zinc-400"
            }`}>
              {activeDeliveries.length}
            </span>
          </button>


          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>Rejected / Cancelled</span>
            {rejectedOrCancelledOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-black">
                {rejectedOrCancelledOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            Settled History
          </button>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search Order #, Table, Waiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
            <CheckCircle2 className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-400">No orders found in this section</p>
            <p className="text-xs text-zinc-600">Active incoming orders will show up automatically in real-time.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === "pending";
            const isDelivery = order.order_type === "delivery";

            return (
              <Card
                key={order.id}
                className={`bg-zinc-900 border flex flex-col justify-between p-5 space-y-4 transition-all ${
                  isPending
                    ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                    : "border-zinc-800"
                }`}
              >
                <div className="space-y-3">
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-white">Order #{order.id}</span>
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase">
                          {isDelivery ? "Delivery" : order.order_type === "takeaway" ? "Takeaway" : `Dine-In • Table #${order.table_number || 1}`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {order.customer_name || "Counter Walk-in"} &bull; Server: {order.waiter_name || "Cashier"}
                      </p>
                    </div>
                    <Badge variant={order.status}>{order.status}</Badge>
                  </div>

                  {/* Delivery Specific Rider Info */}
                  {isDelivery && (
                    <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/30 text-xs space-y-1">
                      <div className="flex justify-between items-center text-sky-300 font-bold">
                        <span>Rider Status:</span>
                        <span className="uppercase text-[11px]">{order.delivery_status || "Unassigned"}</span>
                      </div>
                      {order.assigned_rider_name ? (
                        <p className="text-zinc-300 text-[11px]">Assigned to: <strong className="text-white">{order.assigned_rider_name}</strong></p>
                      ) : (
                        <p className="text-amber-400 text-[11px]">⚠️ Needs delivery rider assignment</p>
                      )}
                      {order.delivery_address && (
                        <p className="text-[10px] text-zinc-400 truncate">Dest: {order.delivery_address}</p>
                      )}
                    </div>
                  )}


                  {/* Active Timers Display */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {/* Kitchen Prep Timer (starts when KOT clicked, stops when Rider Left for delivery or Mark Served) */}
                    {order.kitchen_started_at && (
                      <LiveTimerBadge
                        startTime={order.kitchen_started_at}
                        endTime={order.served_at}
                        label="Kitchen"
                        variant="kitchen"
                      />
                    )}

                    {/* Rider Out / COD Timer: starts when Rider Leaves, ends when Cash is Submitted */}
                    {isDelivery && order.ride_started_at && (
                      <LiveTimerBadge
                        startTime={order.ride_started_at}
                        endTime={order.handover_completed_at}
                        label="Rider Left"
                        variant="ride"
                      />
                    )}
                  </div>

                  {/* Items List */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-zinc-300">
                        <span>{item.quantity}x {item.menu_item_name}</span>
                        <span className="text-zinc-400 font-mono">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                    {order.notes && (
                      <p className="text-[11px] text-amber-400/90 pt-1 italic border-t border-zinc-900">
                        📝 "{order.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-400 font-medium">Bill Total</span>
                    <span className="text-lg font-black text-orange-400 font-mono">Rs. {order.total}</span>
                  </div>
                </div>

                {/* Cashier Action Controls */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">


                  {/* Rider Cash Handover Action */}
                  {isDelivery && order.delivery_status === "handover_pending" && order.status !== "completed" && (
                    <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-400 font-black uppercase text-[10px] flex items-center gap-1">
                          <HandCoins className="h-3.5 w-3.5" />
                          <span>Rider Cash Handover</span>
                        </span>
                        <span className="font-mono font-black text-white text-sm">
                          Rs. {order.total}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        Rider <strong className="text-white">{order.assigned_rider_name || order.waiter_name || "Rider"}</strong> has delivered this order. Collect physical cash from rider and confirm below to close.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmRiderCashHandover(order.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 rounded-xl shadow-md flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>CONFIRM CASH RECEIVED & CLOSE ORDER</span>
                      </Button>
                    </div>
                  )}

                  
                  {/* Rider Left / Dispatch Departure Button (Starts Rider Out Timer) */}
                  {isDelivery && order.status !== "completed" && order.status !== "cancelled" && order.status !== "rejected" && (
                    <div className="pt-1">
                      {!order.ride_started_at ? (
                        <Button
                          size="sm"
                          onClick={() => handleRiderDeparted(order.id)}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs h-10 rounded-xl shadow-md flex items-center justify-center space-x-2"
                        >
                          <Bike className="h-4 w-4" />
                          <span>🛵 RIDER LEFT (START TIMER)</span>
                        </Button>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-500/40 flex items-center justify-between text-xs">
                            <span className="text-sky-300 font-bold flex items-center gap-1.5">
                              <Bike className="h-3.5 w-3.5 text-sky-400" />
                              <span>Rider on Road:</span>
                            </span>
                            <LiveTimerBadge
                              startTime={order.ride_started_at}
                              endTime={order.handover_completed_at}
                              label="Out"
                              variant="ride"
                            />
                          </div>

                          {!order.handover_completed_at && (
                            <Button
                              size="sm"
                              onClick={() => handleStopRiderTimer(order.id)}
                              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-9 rounded-xl shadow-md flex items-center justify-center space-x-1.5"
                            >
                              <Clock className="h-4 w-4" />
                              <span>STOP RIDER TIMER</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}




                  {/* Cancel Order Action (Requires PIN or Admin Approval) */}
                  {order.status !== "completed" && order.status !== "rejected" && order.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenCancelModal(order)}
                      className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center justify-center space-x-1"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>{order.cancellation_requested ? "Cancellation Pending Approval" : "Cancel Order (PIN / Approval)"}</span>
                    </Button>
                  )}


                  {/* Mark Served Button: stops kitchen timer and marks served */}
                  {order.kitchen_started_at && !order.served_at && order.status !== "completed" && order.status !== "cancelled" && order.status !== "rejected" && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkServed(order.id)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs h-9 flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/20"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>MARK SERVED (STOP KITCHEN TIMER)</span>
                    </Button>
                  )}

                  {/* Settle Bill / Collect Payment (Primary in Bill Settlement) */}
                  {activeTab === "settlement" && order.status !== "completed" && (
                    <Button
                      size="sm"
                      onClick={() => openCheckoutModal(order)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Collect Payment & Settle Bill</span>
                    </Button>
                  )}

                  {/* Print Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenKitchenKOT(order)}
                      className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-[11px] font-bold flex items-center justify-center space-x-1"
                    >
                      <ChefHat className="h-3.5 w-3.5 text-amber-400" />
                      <span>Kitchen KOT</span>
                    </Button>
                    
                    {/* Final Receipt: Only shown in Bill Settlement or Completed History tabs */}
                    {(activeTab === "settlement" || activeTab === "completed") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-[11px] font-bold flex items-center justify-center space-x-1"
                      >
                        <Printer className="h-3.5 w-3.5 text-orange-400" />
                        <span>Final Receipt</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveTab("settlement");
                          openCheckoutModal(order);
                        }}
                        className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center space-x-1"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Go to Settle Bill</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>


      {/* Cancel Order Modal with PIN or Admin Approval */}
      <Modal
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        title={`Cancel Order #${cancellingOrder?.id}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1 text-rose-300">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Security Authorization Required to Cancel</span>
            </p>
            <p className="text-zinc-300 text-[11px]">
              To cancel this active order, enter the supervisor authorization PIN or send an instant Cancellation Request for Admin approval.
            </p>
          </div>

          {cancelError && (
            <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
              ⚠️ {cancelError}
            </div>
          )}

          {cancelSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              ✓ {cancelSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Reason for Cancellation
            </label>
            <Input
              placeholder="e.g. Customer changed mind, wrong punch, item out of stock"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <KeyRound className="h-4 w-4 text-orange-400" />
              <label className="text-xs font-black uppercase text-zinc-200">
                Method 1: Fast Authorization with Supervisor PIN
              </label>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={cancelPin}
                onChange={(e) => setCancelPin(e.target.value)}
                className="font-mono tracking-widest text-base"
              />
              <Button
                onClick={handleCancelWithPin}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-4 shrink-0"
              >
                Cancel with PIN
              </Button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-[11px] font-bold uppercase">OR</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-sky-400" />
              <label className="text-xs font-black uppercase text-zinc-200">
                Method 2: Request Admin Approval
              </label>
            </div>
            <p className="text-[11px] text-zinc-400">
              If PIN is unavailable, click below to notify the Admin dashboard. The order will be cancelled as soon as Admin confirms it.
            </p>
            <Button
              variant="outline"
              onClick={handleRequestAdminApproval}
              className="w-full border-sky-500/40 text-sky-400 hover:bg-sky-500/10 font-bold text-xs"
            >
              Send Cancellation Request to Admin
            </Button>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setCancellingOrder(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Order Modal */}
      <Modal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title={`Reject Order #${rejectingId}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Please enter a reason for rejecting this order so the waiter and customer are notified.
          </p>
          <Input
            label="Rejection Reason"
            placeholder="e.g. Sold out, kitchen closing, customer cancelled"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleRejectOrder} className="font-bold">
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Delivery Rider Modal */}
      <Modal
        isOpen={!!dispatchOrder}
        onClose={() => setDispatchOrder(null)}
        title={`Dispatch Order #${dispatchOrder?.id} to Rider`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1">
            <p className="text-zinc-400">Customer: <strong className="text-white">{dispatchOrder?.customer_name || "N/A"}</strong> ({dispatchOrder?.customer_phone || "No phone"})</p>
            <p className="text-zinc-400">Address: <strong className="text-zinc-200">{dispatchOrder?.delivery_address || "None specified"}</strong></p>
            <p className="text-zinc-400">Total COD Amount: <strong className="text-orange-400">Rs. {dispatchOrder?.total}</strong></p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Select Available Rider
            </label>
            <select
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Choose Rider --</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setDispatchOrder(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedRiderId}
              onClick={handleAssignRider}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold"
            >
              Dispatch to Rider
            </Button>
          </div>
        </div>
      </Modal>

      {/* Collect Payment & Settle Bill Modal */}
      <Modal
        isOpen={!!checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        title={`Collect Payment - Order #${checkoutOrder?.id}`}
      >
        {checkoutOrder && (
          <div className="space-y-4">
            {/* Bill Summary */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="text-white">Rs. {checkoutOrder.subtotal}</span>
              </div>

              {(() => {
                const subtotal = checkoutOrder.subtotal || 0;
                let discountAmt = 0;
                if (discountType === "percentage") {
                  discountAmt = Math.round(subtotal * ((discountValue || 0) / 100));
                } else if (discountType === "flat") {
                  discountAmt = discountValue || 0;
                }
                const net = Math.max(0, subtotal - discountAmt);
                return (
                  <>
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"}):</span>
                        <span>- Rs. {discountAmt}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline font-sans">
                      <span className="font-black text-white text-sm">TOTAL DUE:</span>
                      <span className="text-2xl font-black text-orange-400 font-mono">Rs. {net}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Discount Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Apply Discount
              </label>
              
              {/* Discount Mode Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setDiscountType("none"); setDiscountValue(0); }}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    discountType === "none"
                      ? "bg-orange-600 text-white border-orange-500 shadow-sm"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  No Discount
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType("percentage");
                    if (discountValue === 0) setDiscountValue(10);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    discountType === "percentage"
                      ? "bg-orange-600 text-white border-orange-500 shadow-sm"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType("flat");
                    if (discountValue === 0) setDiscountValue(100);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    discountType === "flat"
                      ? "bg-orange-600 text-white border-orange-500 shadow-sm"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  Flat Amount (Rs)
                </button>
              </div>

              {/* Custom Input & Quick Presets for Percentage */}
              {discountType === "percentage" && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                  <Input
                    label="Enter Any Discount Percentage (%)"
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    placeholder="e.g. 5, 10, 15, 20, 25..."
                    value={discountValue === 0 ? "" : discountValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDiscountValue(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
                    }}
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono font-bold"
                  />
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Quick:</span>
                    {[5, 10, 15, 20, 25, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountValue(pct)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                          discountValue === pct
                            ? "bg-orange-600 text-white border-orange-500"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Input & Quick Presets for Flat Amount */}
              {discountType === "flat" && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                  <Input
                    label="Enter Any Flat Cut-Off Amount (Rs)"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 50, 100, 200, 500..."
                    value={discountValue === 0 ? "" : discountValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDiscountValue(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono font-bold"
                  />
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Quick:</span>
                    {[50, 100, 150, 200, 300, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDiscountValue(amt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                          discountValue === amt
                            ? "bg-orange-600 text-white border-orange-500"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        Rs.{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: DollarSign },
                  { id: "card", label: "Card / POS", icon: CreditCard },
                  { id: "qr_online", label: "QR Online", icon: QrCode },
                  { id: "split", label: "Split", icon: Percent },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Change Return Calculation */}
            {paymentMethod === "cash" && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <Input
                  label="Cash Tendered (Received)"
                  type="number"
                  placeholder="e.g. 2000"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                />
                {(() => {
                  const tendered = parseFloat(cashTendered) || 0;
                  const subtotal = checkoutOrder.subtotal || 0;
                  let discountAmt = 0;
                  if (discountType === "percentage") discountAmt = Math.round(subtotal * ((discountValue || 0) / 100));
                  else if (discountType === "flat") discountAmt = discountValue || 0;
                  const net = Math.max(0, subtotal - discountAmt);
                  const change = tendered - net;

                  return (
                    <div className="flex justify-between items-center text-xs font-mono pt-1">
                      <span className="text-zinc-400">Change Due to Customer:</span>
                      <span className={`font-black text-sm ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Rs. {change >= 0 ? change : 0}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setCheckoutOrder(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleFinalizeSettlement}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5"
              >
                Confirm Payment & Settle
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Success Confirmation Modal */}
      <Modal
        isOpen={!!paymentSuccessData}
        onClose={() => setPaymentSuccessData(null)}
        title="Payment Confirmation"
      >
        {paymentSuccessData && (
          <div className="space-y-5 text-center py-2">
            {/* Success Check Animation Icon */}
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Payment Successful & Order Closed
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">
                Rs. {paymentSuccessData.paidAmount.toLocaleString()}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Order #{paymentSuccessData.order.id} &bull; {paymentSuccessData.order.customer_name || "Counter Walk-in"}
              </p>
            </div>

            {/* Transaction Breakdown Summary */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Payment Method:</span>
                <span className="font-bold text-white uppercase bg-zinc-900 px-2 py-0.5 rounded font-sans">
                  {paymentSuccessData.paymentMethod.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Items Ordered:</span>
                <span className="text-zinc-200">{paymentSuccessData.order.items?.length || 0} Item(s)</span>
              </div>
              {paymentSuccessData.discountAmt > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount Applied:</span>
                  <span>- Rs. {paymentSuccessData.discountAmt.toLocaleString()}</span>
                </div>
              )}
              {paymentSuccessData.changeDue > 0 && (
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline font-sans">
                  <span className="text-zinc-300 font-semibold">Change Given:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    Rs. {paymentSuccessData.changeDue.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPaymentSuccessData(null)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold text-xs h-11 rounded-xl"
              >
                Close & Next Order
              </Button>
              <Button
                onClick={() => {
                  const ord = paymentSuccessData.order;
                  setPaymentSuccessData(null);
                  setSelectedReceiptOrder(ord);
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs h-11 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Thermal Receipt</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Thermal Final Receipt Print Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Kitchen KOT Receipt Print Modal */}
      <KitchenReceiptModal
        isOpen={!!selectedKitchenOrder}
        onClose={() => setSelectedKitchenOrder(null)}
        order={selectedKitchenOrder}
      />
    </div>
  );
}
