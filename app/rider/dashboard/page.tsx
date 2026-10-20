"use client";

import { useEffect, useState } from "react";
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
  ExternalLink
} from "lucide-react";

export default function RiderDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [deliveryFailReason, setDeliveryFailReason] = useState("");
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [codCollected, setCodCollected] = useState("");

  const refreshData = async () => {
    const fetched = await getPOSOrders();
    setOrders(fetched);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter deliveries
  const allDeliveryOrders = orders.filter((o) => o.order_type === "delivery");

  // Orders available for any rider to claim
  const availableOrders = allDeliveryOrders.filter(
    (o) => (!o.assigned_rider_id || o.delivery_status === "unassigned") && o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected"
  );

  // Orders specifically assigned to this rider that are in transit
  const myActiveDeliveries = allDeliveryOrders.filter(
    (o) => (o.assigned_rider_id === user?.id || (user?.email && o.assigned_rider_name?.toLowerCase() === user.name.toLowerCase())) &&
      o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected"
  );

  const handleClaimDelivery = async (orderId: string) => {
    if (!user) return;
    await assignOrderRider(orderId, user.id, user.name);
    await refreshData();
  };

  const handleMarkPickedUp = async (orderId: string) => {
    await updateOrderDeliveryStatus(orderId, "picked_up");
    await refreshData();
  };

  const handleConfirmDelivered = async () => {
    if (!selectedOrder) return;
    await updateOrderDeliveryStatus(selectedOrder.id, "delivered");
    setIsDeliverModalOpen(false);
    setSelectedOrder(null);
    setCodCollected("");
    await refreshData();
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
            Welcome, {user?.name || "Rider"}
          </h1>
          <p className="text-xs text-zinc-400">
            Accept delivery orders, navigate to customer doorsteps, & collect Cash On Delivery
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
          <Bike className="h-6 w-6" />
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">My Active Trips</span>
          <p className="text-2xl font-black text-white mt-1">{myActiveDeliveries.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Available to Pick Up</span>
          <p className="text-2xl font-black text-white mt-1">{availableOrders.length}</p>
        </div>
      </div>

      {/* Section 1: MY ACTIVE DELIVERIES */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Package className="h-4 w-4 text-sky-400" />
          <span>My Ongoing Deliveries ({myActiveDeliveries.length})</span>
        </h2>

        {myActiveDeliveries.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-1">
            <CheckCircle2 className="h-6 w-6 text-zinc-600 mx-auto" />
            <p className="text-xs font-semibold text-zinc-400">No active deliveries on your route right now</p>
            <p className="text-[11px] text-zinc-600">Claim an available order below to start your trip.</p>
          </div>
        ) : (
          myActiveDeliveries.map((order) => {
            const isPickedUp = order.delivery_status === "picked_up";
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || "Lahore")}`;

            return (
              <Card
                key={order.id}
                className="bg-zinc-900 border-sky-500/40 p-5 space-y-4 shadow-[0_0_20px_rgba(14,165,233,0.1)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-black text-white">Order #{order.id}</span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Customer: <strong className="text-white">{order.customer_name || "Guest"}</strong>
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
                        <span className="text-zinc-500 text-[10px] block">DELIVERY ADDRESS:</span>
                        <span className="font-bold text-zinc-100">{order.delivery_address}</span>
                      </div>
                    </div>
                  )}

                  {order.customer_phone && (
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-mono text-zinc-300">{order.customer_phone}</span>
                      </div>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center space-x-1 hover:bg-emerald-500/30"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call Customer</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Item Summary & COD Total */}
                <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">CASH TO COLLECT (COD):</span>
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
                    className="w-full h-10 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs flex items-center justify-center space-x-2 border border-zinc-700"
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
                      <Package className="h-4 w-4" />
                      <span>I HAVE PICKED UP FOOD FROM RESTAURANT</span>
                    </Button>
                  ) : (
                    /* Final Delivery Completion */
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => { setSelectedOrder(order); setCodCollected(order.total.toString()); setIsDeliverModalOpen(true); }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-11 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Delivered & Paid</span>
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => { setSelectedOrder(order); setIsFailModalOpen(true); }}
                        className="text-xs font-bold h-11 rounded-xl"
                      >
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

      {/* Section 2: AVAILABLE DISPATCH QUEUE */}
      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Available Orders Ready for Pickup ({availableOrders.length})</span>
        </h2>

        {availableOrders.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3">No unassigned delivery orders awaiting pickup right now.</p>
        ) : (
          availableOrders.map((order) => (
            <Card
              key={order.id}
              className="bg-zinc-900 border-zinc-800 p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-base font-bold text-white">Order #{order.id}</span>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Customer: {order.customer_name || "Guest"} &bull; Destination: {order.delivery_address || "Lahore"}
                  </p>
                </div>
                <span className="text-base font-mono font-black text-orange-400">Rs. {order.total}</span>
              </div>

              <Button
                onClick={() => handleClaimDelivery(order.id)}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center space-x-2"
              >
                <Bike className="h-4 w-4" />
                <span>ACCEPT & CLAIM THIS DELIVERY</span>
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Mark Delivered & Collect Cash Modal */}
      <Modal
        isOpen={isDeliverModalOpen}
        onClose={() => setIsDeliverModalOpen(false)}
        title={`Confirm Delivery for Order #${selectedOrder?.id}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
            <p className="text-zinc-400">Customer: <strong className="text-white">{selectedOrder?.customer_name}</strong></p>
            <p className="text-zinc-400">Phone: <strong className="text-zinc-200">{selectedOrder?.customer_phone}</strong></p>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline font-mono">
              <span className="text-zinc-400">COD Total:</span>
              <span className="text-xl font-black text-emerald-400">Rs. {selectedOrder?.total}</span>
            </div>
          </div>

          <Input
            label="Cash Amount Received from Customer (Rs.)"
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
              Confirm Delivery & Handover
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Delivery Failed Modal */}
      <Modal
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        title={`Report Delivery Issue: Order #${selectedOrder?.id}`}
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
