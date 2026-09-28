"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/use-auth";
import { 
  getPOSMenuItems, 
  getPOSCategories, 
  getPOSTables, 
  createPOSOrder, 
  POSMenuItem, 
  POSCategory, 
  POSTable 
} from "@/lib/pos-data";
import { playOrderNotificationSound } from "@/lib/sound";
import { Search, Plus, Minus, Trash2, Send, CheckCircle2, ArrowLeft, ShoppingCart, Table as TableIcon, Utensils, ShoppingBag, Truck, User, Phone, MapPin } from "lucide-react";

interface CartItem {
  item: POSMenuItem;
  quantity: number;
}

export default function WaiterNewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialTableNum = searchParams.get("table") || "7";

  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [menuItems, setMenuItems] = useState<POSMenuItem[]>([]);
  const [tables, setTables] = useState<POSTable[]>([]);

  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [selectedTableNum, setSelectedTableNum] = useState<number>(parseInt(initialTableNum, 10) || 7);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getPOSCategories(), getPOSMenuItems(), getPOSTables()]).then(([c, m, t]) => {
      setCategories(c);
      setMenuItems(m);
      setTables(t);
    });
  }, []);

  const addToCart = (item: POSMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === id) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const targetTable = tables.find((t) => t.table_number === selectedTableNum) || { id: `t${selectedTableNum}`, table_number: selectedTableNum };

    await createPOSOrder({
      table_id: orderType === "dine_in" ? targetTable.id : null,
      table_number: orderType === "dine_in" ? selectedTableNum : null,
      waiter_id: user?.id || "10000000-0000-0000-0000-000000000002",
      waiter_name: user?.name || "Staff Server",
      order_type: orderType,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      delivery_address: orderType === "delivery" ? deliveryAddress : null,
      notes,
      items: cart.map((c) => ({
        menu_item_id: c.item.id,
        menu_item_name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
      })),
    });

    playOrderNotificationSound("new_order");
    setIsSubmitting(false);
    setIsConfirmModalOpen(false);
    router.push("/waiter/orders");
  };

  const filteredItems = menuItems.filter((i) => {
    const matchesCat = selectedCategory === "All" || i.category_name === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && i.available;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Order Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/waiter/tables")} className="text-zinc-400">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Tables</span>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create New Order</h1>
            <p className="text-xs text-zinc-400">Select order mode, add items, and submit to kitchen</p>
          </div>
        </div>

        {/* Order Mode Tabs */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setOrderType("dine_in")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              orderType === "dine_in" ? "bg-orange-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Dine-In</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType("takeaway")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              orderType === "takeaway" ? "bg-orange-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Takeaway</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType("delivery")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              orderType === "delivery" ? "bg-orange-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Delivery</span>
          </button>
        </div>
      </div>

      {/* Mode Specific Inputs */}
      {orderType === "dine_in" ? (
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
          <TableIcon className="h-4 w-4 text-orange-400 ml-1" />
          <span className="text-xs font-bold text-zinc-300">Target Table:</span>
          <select
            value={selectedTableNum}
            onChange={(e) => setSelectedTableNum(parseInt(e.target.value, 10))}
            className="bg-zinc-950 border border-zinc-800 text-orange-400 font-extrabold text-sm rounded-lg px-3 py-1 focus:outline-none"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.table_number}>
                Table #{t.table_number.toString().padStart(2, "0")} ({t.capacity} seats) - {t.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <Input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-xs"
          />
          <Input
            placeholder="Customer Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-xs"
          />
          {orderType === "delivery" && (
            <Input
              placeholder="Delivery Address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Catalog Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex space-x-1 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === "All"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c.name
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 cursor-pointer transition-all p-3 flex flex-col justify-between group space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-white text-xs group-hover:text-orange-400 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded shrink-0">
                      Rs. {item.price}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-tight">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">{item.category_name}</span>
                  <Button size="sm" className="h-7 px-2.5 text-[11px] bg-zinc-800 group-hover:bg-orange-600 text-zinc-200 group-hover:text-white font-bold transition-all">
                    <Plus className="h-3 w-3 mr-1" />
                    <span>Add</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart & Summary Column */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4 text-orange-400" />
                <h3 className="font-black text-white text-sm">Order Basket</h3>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                {cart.reduce((sum, c) => sum + c.quantity, 0)} Items
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  Your order basket is empty. Select items from the menu catalog to begin.
                </div>
              ) : (
                cart.map((c) => (
                  <div key={c.item.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between space-x-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-200 truncate">{c.item.name}</p>
                      <p className="text-[10px] text-zinc-500">Rs. {c.item.price} &times; {c.quantity}</p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(c.item.id, -1)}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-white px-1.5">{c.quantity}</span>
                      <button
                        onClick={() => updateQuantity(c.item.id, 1)}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Special Notes */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                Special Kitchen Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra spicy, no mayo, less oil..."
                className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Totals Breakdown */}
            <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-200">Rs. {subtotal}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>GST Tax (18%)</span>
                <span className="font-mono text-zinc-200">Rs. {tax}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-zinc-800">
                <span>Total Amount</span>
                <span className="font-mono text-orange-400 text-base">Rs. {total}</span>
              </div>
            </div>

            <Button
              disabled={cart.length === 0 || isSubmitting}
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>SUBMIT ORDER TO KITCHEN</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm & Submit Order">
        <div className="space-y-4">
          <p className="text-xs text-zinc-300">
            Submit {orderType.toUpperCase()} order for <span className="font-bold text-orange-400">{cart.reduce((s, c) => s + c.quantity, 0)} item(s)</span> totaling <span className="font-bold text-white">Rs. {total}</span>?
          </p>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
            <p className="text-zinc-400">Order Mode: <span className="text-white font-bold uppercase">{orderType}</span></p>
            {orderType === "dine_in" && <p className="text-zinc-400">Table: <span className="text-orange-400 font-bold">#{selectedTableNum}</span></p>}
            {customerName && <p className="text-zinc-400">Customer: <span className="text-white font-bold">{customerName}</span></p>}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleSendOrder}
              className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Submitting..." : "Confirm & Submit"}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}