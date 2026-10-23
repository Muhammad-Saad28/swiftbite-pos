"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { 
  getPOSOrders, 
  updateOrderStatus, 
  updatePOSOrderPaymentAndDiscount, 
  updatePOSOrderTable,
  confirmRiderCashHandover,
  approveOrderCancellation,
  POSOrder 
} from "@/lib/pos-data";
import { supabase } from "@/lib/supabase/client";
import { ReceiptModal } from "@/components/receipt-modal";
import { KitchenReceiptModal } from "@/components/kitchen-receipt-modal";
import { 
  Search, 
  CheckCircle, 
  Clock, 
  ChefHat, 
  CheckSquare, 
  XCircle, 
  Printer, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  Percent, 
  Tag, 
  Phone, 
  MapPin, 
  User, 
  MessageCircle, 
  BellRing,
  Bike,
  Ban,
  ShieldAlert,
  CheckCircle2,
  Utensils
} from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<POSOrder | null>(null);
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState<POSOrder | null>(null);

  // Payment Checkout Modal State
  const [checkoutOrder, setCheckoutOrder] = useState<POSOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr_online" | "split">("cash");
  const [discountType, setDiscountType] = useState<"percentage" | "flat" | "none">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Audio & Notification State
  const prevOrderCountRef = useRef<number>(0);

  const refreshData = async () => {
    const fetched = await getPOSOrders();
    setOrders(fetched);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);

    // Supabase Realtime channel for instant live order updates
    const channel = supabase
      .channel("pos-orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Play audio chime when a new order arrives
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
      } catch (e) {}
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length]);

  const handleStatusChange = async (orderId: string, status: POSOrder["status"]) => {
    await updateOrderStatus(orderId, status);
    await refreshData();
  };


  const handleApproveCancellation = async (orderId: string) => {
    await approveOrderCancellation(orderId);
    await refreshData();
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    await updateOrderStatus(rejectingId, "rejected", rejectReason || "Rejected by Admin");
    setRejectingId(null);
    setRejectReason("");
    await refreshData();
  };

  const openCheckoutModal = (order: POSOrder) => {
    setCheckoutOrder(order);
    setPaymentMethod(order.payment_method || "cash");
    setDiscountType(order.discount_type || "none");
    setDiscountValue(order.discount_amount || 0);
  };

  const handleFinalizeCheckout = async () => {
    if (!checkoutOrder) return;
    await updatePOSOrderPaymentAndDiscount(checkoutOrder.id, paymentMethod, discountValue, discountType);
    await updateOrderStatus(checkoutOrder.id, "completed");
    setCheckoutOrder(null);
    await refreshData();
  };

  const filteredOrders = orders.filter((o) => {
    let matchesTab = true;
    if (activeTab === "all") matchesTab = true;
    else if (activeTab === "dine_in") matchesTab = o.order_type === "dine_in" || (!o.order_type && !!o.table_number);
    else if (activeTab === "delivery") matchesTab = o.order_type === "delivery";
    else if (activeTab === "cancellation_requests") matchesTab = !!o.cancellation_requested && o.status !== "cancelled" && o.status !== "rejected";
    else if (activeTab === "rejected") matchesTab = o.status === "rejected" || o.status === "cancelled";
    else matchesTab = o.status === activeTab;
    
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(search) ||
      (o.order_number && o.order_number.toString().includes(search)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search)) ||
      (o.customer_phone && o.customer_phone.includes(search)) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(search)) ||
      (o.waiter_name && o.waiter_name.toLowerCase().includes(search)) ||
      (o.table_number && o.table_number.toString().includes(search));

    return matchesTab && matchesSearch;
  });

  const pendingDeliveryCount = orders.filter(o => o.order_type === "delivery" && o.status === "pending").length;

  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "pending", label: "Pending", count: orders.filter(o => o.status === "pending").length },
    { id: "dine_in", label: "🍽️ Dine-In (6 Tables)", count: orders.filter(o => o.order_type === "dine_in" || (!o.order_type && !!o.table_number)).length },
    { id: "delivery", label: "🛵 Online Deliveries", count: orders.filter(o => o.order_type === "delivery").length },
    { id: "accepted", label: "Accepted", count: orders.filter(o => o.status === "accepted").length },
    { id: "preparing", label: "Preparing", count: orders.filter(o => o.status === "preparing").length },
    { id: "ready", label: "Ready", count: orders.filter(o => o.status === "ready").length },
    { id: "cancellation_requests", label: "⚠️ Cancel Requests", count: orders.filter(o => o.cancellation_requested && o.status !== "cancelled" && o.status !== "rejected").length },
    { id: "rejected", label: "Rejected / Cancelled", count: orders.filter(o => o.status === "rejected" || o.status === "cancelled").length },
    { id: "completed", label: "Completed", count: orders.filter(o => o.status === "completed").length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Order Management</h1>
            {pendingDeliveryCount > 0 && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold animate-pulse">
                <BellRing className="h-3.5 w-3.5" />
                <span>{pendingDeliveryCount} New Online</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Realtime live orders &bull; Connected with customer website, dine-in tables, and WhatsApp
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/cashier/pos?orderType=dine_in">
            <Button className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black text-xs h-9 px-3.5 rounded-xl shadow shrink-0">
              <Utensils className="h-3.5 w-3.5 mr-1.5" />
              <span>Punch Dine-In Sale</span>
            </Button>
          </Link>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search Order #, Table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-2 border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === tab.id
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id ? "bg-orange-700 text-white" : "bg-zinc-800 text-zinc-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-zinc-400">No orders match the current filter</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const shortOrderRef = order.order_number 
              ? `#${order.order_number}` 
              : `#${order.id.slice(0, 8).toUpperCase()}`;

            const isDelivery = order.order_type === "delivery";

            // WhatsApp formatting for contacting customer
            const customerWaNumber = order.customer_phone
              ? order.customer_phone.replace(/^0/, "92").replace(/[^0-9]/g, "")
              : null;
            const customerWaMsg = encodeURIComponent(
              `Hello ${order.customer_name || "Customer"}, this is SwiftBite regarding your Order ${shortOrderRef}. Your order status is: ${order.status.toUpperCase()}.`
            );

            return (
              <Card 
                key={order.id} 
                className={`bg-zinc-900 border flex flex-col justify-between p-4 space-y-3 transition-colors ${
                  order.status === "pending" && isDelivery 
                    ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    : "border-zinc-800"
                }`}
              >
                <div className="space-y-3">
                  {/* Order Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-extrabold text-white tracking-tight">
                          Order {shortOrderRef}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isDelivery
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : order.order_type === "takeaway"
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                        }`}>
                          {isDelivery
                            ? "🛵 Online Delivery"
                            : order.order_type === "takeaway"
                            ? "🛍️ Takeaway"
                            : `🍽️ Dine-In • Table #${order.table_number || 1}`}
                        </span>
                      </div>

                      {/* Dine-In 6 Tables Reassign Selector */}
                      {(!order.order_type || order.order_type === "dine_in") && order.status !== "completed" && order.status !== "cancelled" && (
                        <div className="flex items-center space-x-1.5 mt-2 bg-zinc-950/80 border border-orange-500/20 px-2 py-1 rounded-lg w-fit">
                          <Utensils className="h-3 w-3 text-orange-400" />
                          <span className="text-[11px] text-zinc-400 font-bold">Table:</span>
                          <select
                            value={order.table_number || 1}
                            onChange={async (e) => {
                              await updatePOSOrderTable(order.id, parseInt(e.target.value, 10));
                              await refreshData();
                            }}
                            className="bg-zinc-900 border border-zinc-700 text-orange-400 font-black text-[11px] rounded px-1.5 py-0.5 cursor-pointer hover:border-orange-400"
                          >
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>Table {num}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Customer / Table Details */}
                      {isDelivery || order.customer_name ? (
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center space-x-1.5 text-zinc-200 font-bold">
                            <User className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            <span>{order.customer_name || "Online Customer"}</span>
                            {order.customer_phone && (
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="text-zinc-400 hover:text-white font-normal underline ml-1 text-[11px]"
                              >
                                {order.customer_phone}
                              </a>
                            )}
                          </div>

                          {order.delivery_address && (
                            <div className="flex items-start space-x-1.5 text-zinc-400 text-[11px]">
                              <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-relaxed">{order.delivery_address}</span>
                            </div>
                          )}

                          {customerWaNumber && (
                            <div className="pt-1">
                              <a
                                href={`https://wa.me/${customerWaNumber}?text=${customerWaMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold transition-colors"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span>WhatsApp Customer</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 mt-1">
                          {order.customer_name || "Walk-In"} &bull; Server: {order.waiter_name}
                        </p>
                      )}
                    </div>

                    <Badge variant={order.status}>{order.status}</Badge>
                  </div>


                  {/* Cancellation Request Alert Banner */}
                  {order.cancellation_requested && order.status !== "cancelled" && order.status !== "rejected" && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border-2 border-rose-500/60 text-xs space-y-2">
                      <div className="flex items-center justify-between text-rose-300 font-black">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-rose-400" />
                          <span>CANCELLATION APPROVAL REQUESTED</span>
                        </span>
                      </div>
                      <p className="text-zinc-200 text-[11px]">
                        Cashier requested to cancel this order. Reason: <strong className="text-white italic">"{order.cancellation_reason || "Customer request"}"</strong>
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleApproveCancellation(order.id)}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-9 rounded-lg shadow flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>APPROVE & CANCEL ORDER NOW</span>
                      </Button>
                    </div>
                  )}

                  {/* Items Summary */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-zinc-300">
                        <span>{item.menu_item_name} &times; {item.quantity}</span>
                        <span className="text-zinc-400 font-mono">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                    {order.notes && (
                      <p className="text-[11px] text-amber-400/90 pt-1 italic border-t border-zinc-900">
                        Note: "{order.notes}"
                      </p>
                    )}
                    {order.rejection_reason && (
                      <p className="text-[11px] text-rose-400 pt-1">
                        Reason: {order.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-400">Total Bill</span>
                    <span className="text-base font-extrabold text-orange-400 font-mono">Rs. {order.total}</span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedKitchenOrder(order)}
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-bold flex items-center justify-center space-x-1"
                    >
                      <ChefHat className="h-3.5 w-3.5 text-amber-400" />
                      <span>Kitchen KOT</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-bold flex items-center justify-center space-x-1"
                    >
                      <Printer className="h-3.5 w-3.5 text-orange-400" />
                      <span>Final Receipt</span>
                    </Button>
                  </div>

                  {order.status === "pending" && (
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleStatusChange(order.id, "accepted")} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold">
                        Accept Order
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRejectingId(order.id)} className="flex-1 text-xs font-bold">
                        Reject
                      </Button>
                    </div>
                  )}

                  {order.status === "accepted" && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, "preparing")} className="w-full bg-orange-600 hover:bg-orange-500 text-xs font-bold flex items-center justify-center space-x-1">
                      <ChefHat className="h-3.5 w-3.5" />
                      <span>Send to Kitchen (Preparing)</span>
                    </Button>
                  )}

                  {order.status === "preparing" && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, "ready")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold flex items-center justify-center space-x-1">
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>{isDelivery ? "Mark Ready for Rider" : "Mark Ready for Waiter"}</span>
                    </Button>
                  )}

                  {order.status === "ready" && (
                    <Button size="sm" onClick={() => handleStatusChange(order.id, "served")} className="w-full bg-purple-600 hover:bg-purple-500 text-xs font-bold">
                      {isDelivery ? "Out for Delivery" : "Mark Served"}
                    </Button>
                  )}

                  {isDelivery && order.delivery_status === "handover_pending" && order.status !== "completed" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await confirmRiderCashHandover(order.id);
                        await refreshData();
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 rounded-xl shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirm Rider Cash Received & Close Order</span>
                    </Button>
                  )}

                  {(order.status === "served" || order.status === "ready") && order.delivery_status !== "handover_pending" && (
                    <Button size="sm" onClick={() => openCheckoutModal(order)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold">
                      Checkout & Collect Payment
                    </Button>
                  )}

                  {order.status === "completed" && (
                    <div className="text-center py-1 text-[11px] text-zinc-500 font-medium">
                      Payment Method: <span className="text-zinc-300 uppercase font-bold">{order.payment_method || "Cash"}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Final Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Kitchen KOT Receipt Modal */}
      <KitchenReceiptModal
        isOpen={!!selectedKitchenOrder}
        onClose={() => setSelectedKitchenOrder(null)}
        order={selectedKitchenOrder}
      />

      {/* Payment & Checkout Modal */}
      <Modal isOpen={!!checkoutOrder} onClose={() => setCheckoutOrder(null)} title={`Checkout & Collect Payment - Order #${checkoutOrder?.order_number || checkoutOrder?.id.slice(0, 8)}`}>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="text-white font-mono">Rs. {checkoutOrder?.subtotal || 0}</span>
            </div>

            {(() => {
              const subtotal = checkoutOrder?.subtotal || 0;
              const tax = checkoutOrder?.tax || 0;
              let calculatedDiscount = 0;
              if (discountType === "percentage") {
                calculatedDiscount = Math.round(subtotal * ((discountValue || 0) / 100));
              } else if (discountType === "flat") {
                calculatedDiscount = discountValue || 0;
              }
              const finalTotal = Math.max(0, subtotal - calculatedDiscount);

              return (
                <>
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Applied:</span>
                      <span className="font-mono">- Rs. {calculatedDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-zinc-800">
                    <span>Final Amount to Collect:</span>
                    <span className="font-mono text-orange-400 text-lg">Rs. {finalTotal}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  paymentMethod === "cash" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  paymentMethod === "card" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("qr_online")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  paymentMethod === "qr_online" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>QR / Online</span>
              </button>
            </div>
          </div>

          {/* Discount Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">Apply Discount</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setDiscountType("none"); setDiscountValue(0); }}
                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${discountType === "none" ? "bg-orange-600 border-orange-500 text-white shadow-sm" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
              >
                No Discount
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType("percentage");
                  if (discountValue === 0) setDiscountValue(10);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${discountType === "percentage" ? "bg-orange-600 border-orange-500 text-white shadow-sm" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType("flat");
                  if (discountValue === 0) setDiscountValue(100);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${discountType === "flat" ? "bg-orange-600 border-orange-500 text-white shadow-sm" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
              >
                Flat Amount (Rs)
              </button>
            </div>

            {discountType === "percentage" && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 mb-2">
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

            {discountType === "flat" && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 mb-2">
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

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCheckoutOrder(null)}>Cancel</Button>
            <Button size="sm" onClick={handleFinalizeCheckout} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Finalize & Complete Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal isOpen={!!rejectingId} onClose={() => setRejectingId(null)} title="Reject Order">
        <div className="space-y-4">
          <Input
            label="Reason for Rejection"
            placeholder="e.g. Item unavailable"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleReject}>Reject Order</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
