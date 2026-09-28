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
  POSOrder 
} from "@/lib/pos-data";
import { ReceiptModal } from "@/components/receipt-modal";
import { Search, CheckCircle, Clock, ChefHat, CheckSquare, XCircle, Printer, CreditCard, DollarSign, QrCode, Percent, Tag } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<POSOrder | null>(null);

  // Payment Checkout Modal State
  const [checkoutOrder, setCheckoutOrder] = useState<POSOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr_online" | "split">("cash");
  const [discountType, setDiscountType] = useState<"percentage" | "flat" | "none">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const refreshData = async () => {
    const fetched = await getPOSOrders();
    setOrders(fetched);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, status: POSOrder["status"]) => {
    await updateOrderStatus(orderId, status);
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
    const matchesTab = activeTab === "all" || o.status === activeTab;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.waiter_name && o.waiter_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.table_number && o.table_number.toString().includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: "all", label: "All Orders", count: orders.length },
    { id: "pending", label: "Pending", count: orders.filter(o => o.status === "pending").length },
    { id: "accepted", label: "Accepted", count: orders.filter(o => o.status === "accepted").length },
    { id: "preparing", label: "Preparing", count: orders.filter(o => o.status === "preparing").length },
    { id: "ready", label: "Ready", count: orders.filter(o => o.status === "ready").length },
    { id: "completed", label: "Completed", count: orders.filter(o => o.status === "completed").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Order Management</h1>
          <p className="text-xs text-zinc-400">Control order lifecycles, apply discounts, collect payments & print thermal receipts</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by Order #, Table, Waiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
            />
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
            <span className="capitalize">{tab.label}</span>
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
          filteredOrders.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800 flex flex-col justify-between p-4 space-y-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-extrabold text-white">Order #{order.id}</span>
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                        {order.order_type || "Dine-In"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {order.table_number ? `Table ${order.table_number.toString().padStart(2, "0")}` : order.customer_name || "Walk-In"} &bull; Server: {order.waiter_name}
                    </p>
                  </div>
                  <Badge variant={order.status}>{order.status}</Badge>
                </div>

                {/* Items Summary */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-zinc-300">
                      <span>{item.menu_item_name} &times; {item.quantity}</span>
                      <span className="text-zinc-400">Rs. {item.price * item.quantity}</span>
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
                  <span className="text-zinc-400">Net Bill Total</span>
                  <span className="text-base font-extrabold text-orange-400">Rs. {order.total}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedReceiptOrder(order)}
                  className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <Printer className="h-3.5 w-3.5 text-orange-400" />
                  <span>Thermal Receipt</span>
                </Button>

                {order.status === "pending" && (
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => handleStatusChange(order.id, "accepted")} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold">
                      Accept
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
                    <span>Mark Ready for Waiter</span>
                  </Button>
                )}

                {order.status === "ready" && (
                  <Button size="sm" onClick={() => handleStatusChange(order.id, "served")} className="w-full bg-purple-600 hover:bg-purple-500 text-xs font-bold">
                    Mark Served
                  </Button>
                )}

                {(order.status === "served" || order.status === "ready") && (
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
          ))
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Payment & Checkout Modal */}
      <Modal isOpen={!!checkoutOrder} onClose={() => setCheckoutOrder(null)} title={`Checkout & Collect Payment - Order #${checkoutOrder?.id}`}>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="text-white font-mono">Rs. {checkoutOrder?.subtotal || 0}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>GST Tax (18%):</span>
              <span className="text-white font-mono">Rs. {checkoutOrder?.tax || 0}</span>
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
              const finalTotal = Math.max(0, (subtotal + tax) - calculatedDiscount);

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
                className={`py-1.5 rounded-lg text-xs font-bold border ${discountType === "none" ? "bg-orange-600 border-orange-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}
              >
                No Discount
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`py-1.5 rounded-lg text-xs font-bold border ${discountType === "percentage" ? "bg-orange-600 border-orange-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("flat")}
                className={`py-1.5 rounded-lg text-xs font-bold border ${discountType === "flat" ? "bg-orange-600 border-orange-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}
              >
                Flat Amount (Rs)
              </button>
            </div>

            {discountType !== "none" && (
              <Input
                type="number"
                placeholder={discountType === "percentage" ? "Discount Percentage (e.g. 10 for 10%)" : "Flat Discount Amount (e.g. 200)"}
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
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
