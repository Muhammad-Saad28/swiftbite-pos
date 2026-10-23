"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/use-auth";
import { 
  getPOSMenuItems, 
  getPOSCategories, 
  getPOSTables, 
  createPOSOrder, 
  isPizzaItem,
  hasSmallPizzaSize,
  getPizzaSizes,
  PizzaSizeOption,
  POSMenuItem, 
  POSCategory, 
  POSTable 
} from "@/lib/pos-data";
import { playOrderNotificationSound } from "@/lib/sound";
import { PizzaSizeModal } from "@/components/pizza-size-modal";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft,
  Utensils
} from "lucide-react";
import Link from "next/link";

interface CartItem {
  id: string;
  item: POSMenuItem;
  quantity: number;
  size?: string;
  notes?: string;
}

export default function CashierPOSRegisterPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [menuItems, setMenuItems] = useState<POSMenuItem[]>([]);
  const [tables, setTables] = useState<POSTable[]>([]);

  const [orderType, setOrderType] = useState<"takeaway" | "dine_in" | "delivery">("takeaway");
  const [selectedTableNum, setSelectedTableNum] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pizza Size Modal State
  const [pizzaModalItem, setPizzaModalItem] = useState<POSMenuItem | null>(null);

  useEffect(() => {
    Promise.all([getPOSCategories(), getPOSMenuItems(), getPOSTables()]).then(([c, m, t]) => {
      setCategories(c);
      setMenuItems(m);
      setTables(t);
    });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get("orderType") || params.get("type");
      const tableParam = params.get("table");
      if (typeParam === "dine_in" || typeParam === "takeaway" || typeParam === "delivery") {
        setOrderType(typeParam as any);
      }
      if (tableParam) {
        const num = parseInt(tableParam, 10);
        if (num >= 1 && num <= 6) {
          setSelectedTableNum(num);
          setOrderType("dine_in");
        }
      }
    }
  }, []);

  const handleItemClick = (item: POSMenuItem) => {
    if (isPizzaItem(item)) {
      setPizzaModalItem(item);
    } else {
      addToCart(item);
    }
  };

  const addToCart = (item: POSMenuItem, sizeOption?: PizzaSizeOption) => {
    setCart((prev) => {
      const cartKey = sizeOption ? `${item.id}_${sizeOption.size}` : item.id;
      const existing = prev.find((c) => c.id === cartKey);
      if (existing) {
        return prev.map((c) => (c.id === cartKey ? { ...c, quantity: c.quantity + 1 } : c));
      }

      const itemRecord: POSMenuItem = sizeOption
        ? {
            ...item,
            name: `${item.name} (${sizeOption.size})`,
            price: sizeOption.price,
          }
        : item;

      return [
        ...prev,
        {
          id: cartKey,
          item: itemRecord,
          quantity: 1,
          size: sizeOption?.size,
          notes: sizeOption ? `Size: ${sizeOption.size}` : undefined,
        },
      ];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === cartId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const targetTable = tables.find((t) => t.table_number === selectedTableNum) || { id: `t${selectedTableNum}`, table_number: selectedTableNum };

    await createPOSOrder({
      table_id: orderType === "dine_in" ? targetTable.id : null,
      table_number: orderType === "dine_in" ? selectedTableNum : null,
      waiter_id: user?.id || "10000000-0000-0000-0000-000000000005",
      waiter_name: user?.name || "Cashier Counter",
      order_type: orderType,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      delivery_address: orderType === "delivery" ? deliveryAddress : null,
      notes,
      items: cart.map((c) => ({
        menu_item_id: c.item.id.includes("_") ? c.item.id.split("_")[0] : c.item.id,
        menu_item_name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
        notes: c.notes || null,
      })),
    });

    playOrderNotificationSound("new_order");
    setIsSubmitting(false);
    router.push("/cashier/dashboard");
  };

  const filteredItems = menuItems.filter((i) => {
    const matchesCat = selectedCategory === "All" || i.category_name === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && i.available;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/cashier/dashboard">
            <Button variant="ghost" size="sm" className="text-zinc-400">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Express Counter POS Register</h1>
            <p className="text-xs text-zinc-400">Walk-in takeaway, table billing, and direct delivery order punching</p>
          </div>
        </div>

        {/* Order Mode Selector */}
        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setOrderType("takeaway")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              orderType === "takeaway" ? "bg-orange-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Takeaway (Counter)</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType("dine_in")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              orderType === "dine_in" ? "bg-orange-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Dine-In Table</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType("delivery")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              orderType === "delivery" ? "bg-orange-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Delivery Order</span>
          </button>
        </div>
      </div>

      {/* Dine-In 6 Tables Selector */}
      {orderType === "dine_in" && (
        <div className="bg-zinc-900 border border-orange-500/30 p-3.5 rounded-2xl space-y-2.5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400">
                <Utensils className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider">Select Dine-In Table</span>
                <span className="text-[11px] text-zinc-400 ml-2">(6 Tables Available)</span>
              </div>
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 w-fit">
              Selected: Table #{selectedTableNum}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((tableNum) => {
              const isSelected = selectedTableNum === tableNum;
              const tbl = tables.find((t) => t.table_number === tableNum);
              const isOccupied = tbl?.status === "occupied";
              return (
                <button
                  key={tableNum}
                  type="button"
                  onClick={() => setSelectedTableNum(tableNum)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/30 font-black scale-105"
                      : isOccupied
                      ? "bg-zinc-950/80 border-amber-500/40 text-amber-300 hover:border-amber-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="text-xs font-black">Table {tableNum}</span>
                  <span className={`text-[10px] ${isSelected ? "text-orange-200" : isOccupied ? "text-amber-400 font-semibold" : "text-emerald-400"}`}>
                    {isOccupied ? "Occupied" : "Available"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Catalog Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === "All"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                All Items
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === c.name
                      ? "bg-orange-600 text-white"
                      : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-56">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const isPizza = isPizzaItem(item);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group cursor-pointer rounded-2xl bg-zinc-900 border border-zinc-800 p-3 hover:border-orange-500/50 hover:bg-zinc-850 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-24 w-full bg-zinc-950 rounded-xl overflow-hidden mb-2 relative">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-zinc-950/80 px-1.5 py-0.5 rounded text-orange-400">
                        {item.category_name}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                    </div>
                    {isPizza ? (
                      <div className="mt-0.5">
                        {hasSmallPizzaSize(item.name) ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Sizes: S, M, L
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Sizes: M, L (No Small)
                          </span>
                        )}
                      </div>
                    ) : item.description ? (
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{item.description}</p>
                    ) : null}
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="font-mono font-extrabold text-xs text-orange-400">
                      {isPizza ? `From Rs. ${getPizzaSizes(item)[0]?.price || item.price}` : `Rs. ${item.price}`}
                    </span>
                    <div className="h-6 w-6 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Order Cart & Checkout Side Panel */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-white text-base">Current Cart Ticket</h3>
              <span className="text-xs text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded uppercase">
                {orderType.replace("_", " ")}
              </span>
            </div>

            {/* Context Fields based on Order Type */}
            <div className="space-y-2">
              {orderType === "dine_in" && (
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-bold">Selected Table:</span>
                  <span className="font-black text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                    Table #{selectedTableNum}
                  </span>
                </div>
              )}

              <Input
                label="Customer Name"
                placeholder="Walk-in guest / Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="text-xs"
              />
              <Input
                label="Phone Number"
                placeholder="0300-1234567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="text-xs"
              />
              {orderType === "delivery" && (
                <Input
                  label="Delivery Address"
                  placeholder="House #, Street, Block, Area..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="text-xs"
                />
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 border-y border-zinc-800 py-3">
              {cart.length === 0 ? (
                <p className="text-center py-6 text-zinc-500 text-xs">
                  Cart is empty. Tap menu items on the left to add.
                </p>
              ) : (
                cart.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="pr-2">
                      <div className="flex items-center space-x-1">
                        <p className="font-bold text-white line-clamp-1">{c.item.name}</p>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono">Rs. {c.item.price * c.quantity}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(c.id, -1)}
                        className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-white text-xs">{c.quantity}</span>
                      <button
                        onClick={() => updateQuantity(c.id, 1)}
                        className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(c.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Input
              label="Kitchen / Preparation Note"
              placeholder="e.g. Extra spicy, no onions, pack separately..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />

            {/* Bill Summary */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="text-white">Rs. {subtotal}</span>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline font-sans">
                <span className="font-black text-white text-sm">TOTAL AMOUNT:</span>
                <span className="text-xl font-black text-orange-400 font-mono">Rs. {total}</span>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "Submitting Order..." : "SEND ORDER TO KITCHEN"}</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Pizza Size Selection Modal */}
      <PizzaSizeModal
        isOpen={!!pizzaModalItem}
        onClose={() => setPizzaModalItem(null)}
        item={pizzaModalItem}
        onSelectSize={(item, sizeOption) => addToCart(item, sizeOption)}
      />
    </div>
  );
}
