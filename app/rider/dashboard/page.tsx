"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/use-auth";
import { 
  getPOSOrders, 
  updateOrderDeliveryStatus, 
  assignOrderRider, 
  POSOrder 
} from "@/lib/pos-data";
import { supabase } from "@/lib/supabase/client";
import { 
  Bike, 
  Phone, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  MessageCircle,
  HandCoins
} from "lucide-react";

export default function RiderDashboardPage() {
  const { user } = useAuth();

  // If user is not logged in through auth provider, default to a registered Rider profile
  const activeRider = useMemo(() => {
    if (user && user.id) return user;
    return {
      id: "45c4adc6-62aa-42ac-b081-859d94273753",
      name: "Zubair Rider",
      email: "rider@swiftbite",
      role: "rider" as const
    };
  }, [user]);

  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [deliveryFailReason, setDeliveryFailReason] = useState("");
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [codCollected, setCodCollected] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const refreshData = async () => {
    const fetched = await getPOSOrders();
    setOrders(fetched);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);

    // Supabase Realtime channel for live dispatch updates
    const channel = supabase
      .channel("rider-orders-channel")
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

  // Filter delivery orders
  const allDeliveryOrders = orders.filter((o) => o.order_type === "delivery");

  // Orders specifically assigned to this rider
  const myRiderOrders = allDeliveryOrders.filter((o) => {
    const isMine = 
      o.assigned_rider_id === activeRider.id || 
      o.waiter_id === activeRider.id || 
      (o.assigned_rider_name && o.assigned_rider_name.toLowerCase() === activeRider.name.toLowerCase());
    const isTerminal = o.status === "completed" || o.status === "cancelled" || o.status === "rejected" || o.delivery_status === "delivered";
    return isMine && !isTerminal;
  });

  // Active in-transit deliveries
  const inProgressDeliveries = myRiderOrders.filter((o) => o.delivery_status !== "handover_pending");

  // Delivered orders where cash handover to cashier is pending
  const pendingHandoverDeliveries = myRiderOrders.filter((o) => o.delivery_status === "handover_pending");

  // Total cash currently in rider's pocket to handover
  const totalCashToHandover = pendingHandoverDeliveries.reduce((sum, o) => sum + (o.total || 0), 0);

  // Orders available for any rider to claim
  const availableOrders = allDeliveryOrders.filter((o) => {
    const isMine = 
      o.assigned_rider_id === activeRider.id || 
      o.waiter_id === activeRider.id || 
      (o.assigned_rider_name && o.assigned_rider_name.toLowerCase() === activeRider.name.toLowerCase());
    
    const isAssigned = (o.assigned_rider_id && o.delivery_status !== "unassigned") || o.waiter_id;
    const isCompleted = o.status === "completed" || o.status === "cancelled" || o.status === "rejected";

    return !isMine && !isAssigned && !isCompleted;
  });

  const handleClaimDelivery = async (orderId: string) => {
    setActionSuccessMsg(`Delivery Order #${orderId.slice(0, 8)} claimed successfully!`);
    await assignOrderRider(orderId, activeRider.id, activeRider.name);
    await refreshData();
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleMarkPickedUp = async (orderId: string) => {
    await updateOrderDeliveryStatus(orderId, "picked_up");
    await refreshData();
  };

  const handleConfirmDelivered = async () => {
    if (!selectedOrder) return;
    // Set to handover_pending so cash handover to cashier is required to finalize
    await updateOrderDeliveryStatus(selectedOrder.id, "handover_pending");
    setIsDeliverModalOpen(false);
    setSelectedOrder(null);
    setCodCollected("");
    setActionSuccessMsg(`Payment recorded! Please submit Rs. ${selectedOrder.total} cash to the cashier desk.`);
    await refreshData();
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const handleConfirmFailed = async () => {
    if (!selectedOrder) return;
    await updateOrderDeliveryStatus(selectedOrder.id, "failed");
    setIsFailModalOpen(false);
    setSelectedOrder(null);
    setDeliveryFailReason("");
    await refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Rider Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 border border-sky-500/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            Live Dispatch Radar
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Welcome, {activeRider.name}
          </h1>
          <p className="text-xs text-zinc-400">
            Accept deliveries, navigate to customer doorsteps, & handover COD cash to the cashier
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
          <Bike className="h-6 w-6" />
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">My Active Trips</span>
          <p className="text-2xl font-black text-white mt-1">{inProgressDeliveries.length}</p>
        </div>

        <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Cash in Pocket</span>
          <p className="text-2xl font-black text-amber-400 mt-1 font-mono">Rs. {totalCashToHandover}</p>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">{pendingHandoverDeliveries.length} handovers due</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Available to Pick Up</span>
          <p className="text-2xl font-black text-white mt-1">{availableOrders.length}</p>
        </div>
      </div>

      {/* Section 1: DELIVERIES AWAITING CASHIER HANDOVER */}
      {pendingHandoverDeliveries.length > 0 && (
        <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-amber-400 flex items-center space-x-2">
              <HandCoins className="h-4 w-4" />
              <span>Cash Handover Due to Cashier ({pendingHandoverDeliveries.length})</span>
            </h2>
            <span className="text-xs font-bold font-mono text-white bg-amber-500/20 px-2 py-0.5 rounded">
              Total to submit: Rs. {totalCashToHandover}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            You collected payment for the orders below. Give the physical cash to the restaurant cashier so they can officially mark the orders as closed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {pendingHandoverDeliveries.map((order) => {
              const shortOrderRef = order.order_number 
                ? `#${order.order_number}` 
                : `#${order.id.slice(0, 8).toUpperCase()}`;

              return (
                <div key={order.id} className="p-3 bg-zinc-950 border border-amber-500/40 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Order {shortOrderRef}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Handover Pending
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    Customer: <strong className="text-zinc-200">{order.customer_name}</strong>
                  </p>
                  <div className="pt-1 border-t border-zinc-900 flex justify-between font-mono">
                    <span className="text-zinc-400">Cash in Pocket:</span>
                    <span className="text-amber-400 font-black text-sm">Rs. {order.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: MY ACTIVE DELIVERIES (IN TRANSIT) */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Bike className="h-4 w-4 text-sky-400" />
          <span>My Active Route ({inProgressDeliveries.length})</span>
        </h2>

        {inProgressDeliveries.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-1">
            <CheckCircle2 className="h-6 w-6 text-zinc-600 mx-auto" />
            <p className="text-xs font-semibold text-zinc-400">No active deliveries on your route right now</p>
            <p className="text-[11px] text-zinc-600">Claim an available order below to start your trip.</p>
          </div>
        ) : (
          inProgressDeliveries.map((order) => {
            const isPickedUp = order.delivery_status === "picked_up" || order.status === "served";
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || "Lahore")}`;
            const shortOrderRef = order.order_number 
              ? `#${order.order_number}` 
              : `#${order.id.slice(0, 8).toUpperCase()}`;

            // WhatsApp link for customer
            const customerWaNumber = order.customer_phone
              ? order.customer_phone.replace(/^0/, "92").replace(/[^0-9]/g, "")
              : null;
            const customerWaMsg = encodeURIComponent(
              `Hello ${order.customer_name || "Customer"}, your SwiftBite delivery rider (${activeRider.name}) is on the way with your Order ${shortOrderRef}!`
            );

            return (
              <Card
                key={order.id}
                className="bg-zinc-900 border-sky-500/40 p-5 space-y-4 shadow-[0_0_20px_rgba(14,165,233,0.1)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-black text-white">Order {shortOrderRef}</span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Customer: <strong className="text-white">{order.customer_name || "Online Guest"}</strong>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                    isPickedUp ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  }`}>
                    {isPickedUp ? "In Transit (Out for Delivery)" : "Assigned (Pick up at Kitchen)"}
                  </span>
                </div>

                {/* Customer Details & Address */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
                  {order.delivery_address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-zinc-500 text-[10px] block font-bold uppercase">DELIVERY ADDRESS:</span>
                        <span className="font-bold text-zinc-100 leading-relaxed">{order.delivery_address}</span>
                      </div>
                    </div>
                  )}

                  {order.customer_phone && (
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-900 gap-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-mono text-zinc-300">{order.customer_phone}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center space-x-1 hover:bg-emerald-500/30 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Call</span>
                        </a>
                        {customerWaNumber && (
                          <a
                            href={`https://wa.me/${customerWaNumber}?text=${customerWaMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-md bg-[#25D366]/20 text-[#25D366] font-bold text-[10px] flex items-center space-x-1 hover:bg-[#25D366]/30 transition-colors"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Item Summary & COD Total */}
                <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-bold uppercase">CASH TO COLLECT (COD):</span>
                    <span className="text-lg font-black text-orange-400 font-mono">Rs. {order.total}</span>
                  </div>
                  <div className="text-right text-[11px] text-zinc-400">
                    <span>{order.items?.length || 0} Food Item(s)</span>
                  </div>
                </div>

                {/* Navigation and Action Controls */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  {/* Google Maps Shortcut */}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-10 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs flex items-center justify-center space-x-2 border border-zinc-700 transition-colors"
                  >
                    <Navigation className="h-4 w-4 text-sky-400" />
                    <span>Open in Google Maps Navigation</span>
                    <ExternalLink className="h-3 w-3 text-zinc-400" />
                  </a>

                  {/* Picked Up Confirmation */}
                  {!isPickedUp ? (
                    <Button
                      onClick={() => handleMarkPickedUp(order.id)}
                      className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2"
                    >
                      <Bike className="h-4 w-4" />
                      <span>START TRIP (FOOD PICKED UP FROM KITCHEN)</span>
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setCodCollected(order.total.toString());
                          setIsDeliverModalOpen(true);
                        }}
                        className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirm Delivered</span>
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsFailModalOpen(true);
                        }}
                        className="h-11 text-xs font-bold rounded-xl"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Delivery Failed</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Section 3: AVAILABLE DISPATCH QUEUE */}
      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Available Orders Ready for Pickup ({availableOrders.length})</span>
        </h2>

        {availableOrders.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3">No unassigned delivery orders awaiting pickup right now.</p>
        ) : (
          availableOrders.map((order) => {
            const shortOrderRef = order.order_number 
              ? `#${order.order_number}` 
              : `#${order.id.slice(0, 8).toUpperCase()}`;

            return (
              <Card
                key={order.id}
                className="bg-zinc-900 border-zinc-800 p-4 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-bold text-white">Order {shortOrderRef}</span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Customer: <strong className="text-zinc-200">{order.customer_name || "Guest"}</strong> &bull; {order.delivery_address || "Lahore"}
                    </p>
                  </div>
                  <span className="text-base font-mono font-black text-orange-400">Rs. {order.total}</span>
                </div>

                <Button
                  onClick={() => handleClaimDelivery(order.id)}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-sky-600/20"
                >
                  <Bike className="h-4 w-4" />
                  <span>ACCEPT & CLAIM THIS DELIVERY</span>
                </Button>
              </Card>
            );
          })
        )}
      </div>

      {/* Mark Delivered & Record Cash Collection Modal */}
      <Modal
        isOpen={isDeliverModalOpen}
        onClose={() => setIsDeliverModalOpen(false)}
        title={`Confirm Delivery for Order #${selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
            <p className="text-zinc-400">Customer: <strong className="text-white">{selectedOrder?.customer_name}</strong></p>
            <p className="text-zinc-400">Phone: <strong className="text-zinc-200">{selectedOrder?.customer_phone}</strong></p>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline font-mono">
              <span className="text-zinc-400">COD Total Collected:</span>
              <span className="text-xl font-black text-emerald-400">Rs. {selectedOrder?.total}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <HandCoins className="h-4 w-4" />
              <span>Next Step: Cashier Desk Handover</span>
            </span>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Once you confirm delivery, this cash will be logged under your route. Please hand over the physical cash to the restaurant cashier to officially close this order.
            </p>
          </div>

          <Input
            label="Cash Amount Collected from Customer (Rs.)"
            type="number"
            value={codCollected}
            onChange={(e) => setCodCollected(e.target.value)}
          />

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setIsDeliverModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDelivered}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Confirm Delivered & Submit to Cashier
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Delivery Failed Modal */}
      <Modal
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        title={`Report Delivery Issue: Order #${selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Please report why this delivery could not be completed. The restaurant cashier will be notified immediately.
          </p>

          <Input
            label="Reason"
            placeholder="e.g. Customer not responding, wrong address, rejected at gate"
            value={deliveryFailReason}
            onChange={(e) => setDeliveryFailReason(e.target.value)}
          />

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setIsFailModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleConfirmFailed} className="font-bold">
              Submit Failure Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
