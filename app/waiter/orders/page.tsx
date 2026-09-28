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
  updateOrderStatus, 
  updatePOSOrderItems, 
  getPOSMenuItems, 
  POSOrder, 
  POSMenuItem 
} from "@/lib/pos-data";
import { ReceiptModal } from "@/components/receipt-modal";
import { Clock, CheckCircle2, AlertCircle, Utensils, Sparkles, ChefHat, Printer, Edit, Plus, Minus, Trash2 } from "lucide-react";

export default function WaiterOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [menuItems, setMenuItems] = useState<POSMenuItem[]>([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<POSOrder | null>(null);

  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<POSOrder | null>(null);
  const [editCart, setEditCart] = useState<{ item: POSMenuItem; quantity: number }[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const refreshData = async () => {
    const [fetchedOrders, fetchedMenuItems] = await Promise.all([
      getPOSOrders(user?.id),
      getPOSMenuItems(),
    ]);
    setOrders(fetchedOrders);
    setMenuItems(fetchedMenuItems);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const activeOrders = orders.filter((o) => {
    const isMyOrder =
      !user ||
      (o.waiter_id && o.waiter_id === user.id) ||
      (o.waiter_name && o.waiter_name.toLowerCase() === user.name.toLowerCase());
    return isMyOrder && o.status !== "completed" && o.status !== "cancelled";
  });

  const handleMarkServed = async (id: string) => {
    await updateOrderStatus(id, "served");
    await refreshData();
  };

  const handleCloseOrder = async (id: string) => {
    await updateOrderStatus(id, "completed");
    await refreshData();
  };

  const openEditModal = (order: POSOrder) => {
    setEditingOrder(order);
    setEditNotes(order.notes || "");
    const initialEditCart = (order.items || []).map(i => {
      const foundItem = menuItems.find(m => m.id === i.menu_item_id) || {
        id: i.menu_item_id,
        category_id: null,
        name: i.menu_item_name || "Item",
        description: null,
        price: i.price,
        image: null,
        available: true,
        featured: false,
      };
      return { item: foundItem, quantity: i.quantity };
    });
    setEditCart(initialEditCart);
  };

  const handleSaveOrderEdit = async () => {
    if (!editingOrder || editCart.length === 0) return;
    setIsSavingEdit(true);

    const formattedItems = editCart.map(c => ({
      menu_item_id: c.item.id,
      menu_item_name: c.item.name,
      quantity: c.quantity,
      price: c.item.price,
    }));

    await updatePOSOrderItems(editingOrder.id, formattedItems, editNotes);
    setIsSavingEdit(false);
    setEditingOrder(null);
    await refreshData();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Active Orders Tracker</h1>
        <p className="text-xs text-zinc-400">Track real-time order status, edit active tickets, & print thermal receipts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">No Active Orders</p>
            <p className="text-xs text-zinc-500">All submitted orders are completed or served.</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-white">Order #{order.id}</span>
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                        {order.order_type || "Dine-In"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {order.table_number ? `Table ${order.table_number.toString().padStart(2, "0")}` : order.customer_name || "Walk-In"} &bull; Waiter: {order.waiter_name}
                    </p>
                  </div>
                  <Badge variant={order.status}>{order.status}</Badge>
                </div>

                {/* Progress Steps Indicator */}
                <div className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                    <span className={order.status === "pending" ? "text-amber-400" : "text-emerald-400"}>Pending</span>
                    <span className={order.status === "accepted" ? "text-blue-400" : order.status === "preparing" || order.status === "ready" || order.status === "served" ? "text-emerald-400" : ""}>Accepted</span>
                    <span className={order.status === "preparing" ? "text-orange-400 animate-pulse" : order.status === "ready" || order.status === "served" ? "text-emerald-400" : ""}>Preparing</span>
                    <span className={order.status === "ready" ? "text-emerald-400 font-extrabold" : order.status === "served" ? "text-emerald-400" : ""}>Ready</span>
                    <span className={order.status === "served" ? "text-purple-400" : ""}>Served</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        order.status === "pending"
                          ? "w-1/5 bg-amber-500"
                          : order.status === "accepted"
                          ? "w-2/5 bg-blue-500"
                          : order.status === "preparing"
                          ? "w-3/5 bg-orange-500"
                          : order.status === "ready"
                          ? "w-4/5 bg-emerald-500"
                          : "w-full bg-purple-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Item List */}
                <div className="space-y-1 text-xs text-zinc-300">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.menu_item_name} &times; {item.quantity}</span>
                      <span className="text-zinc-400">Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-[11px] text-amber-400/90 pt-1 italic">Note: "{order.notes}"</p>
                  )}
                  {order.rejection_reason && (
                    <p className="text-[11px] text-rose-400 pt-1">Rejection Reason: "{order.rejection_reason}"</p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400">Total Bill</span>
                  <span className="text-orange-400 font-extrabold text-sm">Rs. {order.total}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex space-x-2">
                  {(order.status === "pending" || order.status === "accepted") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(order)}
                      className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-bold flex items-center justify-center space-x-1"
                    >
                      <Edit className="h-3.5 w-3.5 text-amber-400" />
                      <span>Edit Order</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-bold flex items-center justify-center space-x-1"
                  >
                    <Printer className="h-3.5 w-3.5 text-orange-400" />
                    <span>Print Receipt</span>
                  </Button>
                </div>

                {order.status === "ready" && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkServed(order.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                  >
                    Mark Order as Served
                  </Button>
                )}

                {order.status === "served" && (
                  <Button
                    size="sm"
                    onClick={() => handleCloseOrder(order.id)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
                  >
                    Close Completed Order
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Print Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Edit Order Modal */}
      <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} title={`Edit Order #${editingOrder?.id}`}>
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">Add or modify items on this active order before cooking completes.</p>

          {/* Current Basket Items */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {editCart.map((c) => (
              <div key={c.item.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{c.item.name}</p>
                  <p className="text-[10px] text-zinc-500">Rs. {c.item.price} &times; {c.quantity}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditCart(prev => prev.map(item => item.item.id === c.item.id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item).filter(i => i.quantity > 0));
                    }}
                    className="p-1 rounded bg-zinc-900 text-zinc-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold text-white px-1.5">{c.quantity}</span>
                  <button
                    onClick={() => {
                      setEditCart(prev => prev.map(item => item.item.id === c.item.id ? { ...item, quantity: item.quantity + 1 } : item));
                    }}
                    className="p-1 rounded bg-zinc-900 text-zinc-300"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Additional Menu Item Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Add Dishes from Menu</label>
            <select
              onChange={(e) => {
                const found = menuItems.find(m => m.id === e.target.value);
                if (found) {
                  setEditCart(prev => {
                    const existing = prev.find(i => i.item.id === found.id);
                    if (existing) return prev.map(i => i.item.id === found.id ? { ...i, quantity: i.quantity + 1 } : i);
                    return [...prev, { item: found, quantity: 1 }];
                  });
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
            >
              <option value="">-- Select dish to add to order --</option>
              {menuItems.map(m => (
                <option key={m.id} value={m.id}>{m.name} - Rs. {m.price}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Kitchen Instructions</label>
            <Input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="e.g. Extra mint sauce, well done..."
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingOrder(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveOrderEdit} disabled={isSavingEdit} className="bg-orange-600 hover:bg-orange-500 font-bold">
              {isSavingEdit ? "Saving..." : "Save Order Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}