"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  getPOSInventory,
  adjustPOSInventoryStock,
  addPOSInventoryItem,
  deletePOSInventoryItem,
  POSInventoryItem,
} from "@/lib/pos-data";
import {
  Boxes,
  AlertTriangle,
  Plus,
  Minus,
  Package,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingDown,
} from "lucide-react";

/** Strip the trailing SKU suffix e.g. "Chicken boneless raw (CHK_RAW)" → "Chicken boneless raw" */
function cleanName(raw: string): string {
  return raw.replace(/\s*\([A-Z0-9_]+\)\s*$/, "").trim();
}

/** Compute fill % for the mini-progress bar (capped 0–100) */
function stockPercent(qty: number, min: number): number {
  if (min <= 0) return qty > 0 ? 100 : 0;
  return Math.min(100, Math.round((qty / (min * 2)) * 100));
}

const STATUS_META = {
  in_stock: {
    label: "In Stock",
    bar: "bg-emerald-500",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    border: "border-l-emerald-500",
    glow: "",
  },
  low: {
    label: "Low Stock",
    bar: "bg-amber-400",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
    border: "border-l-amber-400",
    glow: "shadow-amber-900/30",
  },
  critical: {
    label: "Critical",
    bar: "bg-rose-500",
    icon: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
    border: "border-l-rose-500",
    glow: "shadow-rose-900/40",
  },
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "in_stock" | "low" | "critical"
  >("all");

  // Adjust Stock State
  const [selectedItem, setSelectedItem] = useState<POSInventoryItem | null>(
    null
  );
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustReason, setAdjustReason] = useState("");

  // Add New Inventory Item State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemMinThreshold, setNewItemMinThreshold] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<POSInventoryItem | null>(
    null
  );

  const refreshData = async () => {
    const fetched = await getPOSInventory();
    setInventory(fetched);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleConfirmAdjust = async () => {
    if (!selectedItem || !adjustQty) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) return;
    const delta = adjustType === "add" ? qty : -qty;
    await adjustPOSInventoryStock(
      selectedItem.id,
      delta,
      adjustReason || "Stock adjustment"
    );
    setSelectedItem(null);
    setAdjustQty("");
    setAdjustReason("");
    await refreshData();
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setIsAdding(true);
    const initialQty = parseFloat(newItemQuantity) || 0;
    const minQty = parseFloat(newItemMinThreshold) || 0;
    await addPOSInventoryItem({
      name: newItemName.trim(),
      unit: newItemUnit.trim().toLowerCase() || "kg",
      quantity: initialQty,
      minimum_quantity: minQty,
    });
    setIsAdding(false);
    setIsAddModalOpen(false);
    setNewItemName("");
    setNewItemUnit("kg");
    setNewItemQuantity("");
    setNewItemMinThreshold("");
    await refreshData();
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    await deletePOSInventoryItem(deletingItem.id);
    setDeletingItem(null);
    await refreshData();
  };

  // Derived counts
  const inStockCount = inventory.filter((i) => i.status === "in_stock").length;
  const lowCount = inventory.filter((i) => i.status === "low").length;
  const criticalCount = inventory.filter((i) => i.status === "critical").length;

  const filteredInventory = inventory.filter((item) => {
    const name = cleanName(item.name).toLowerCase();
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Inventory Control
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track raw ingredients, stock quantities, and minimum thresholds
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-600/20 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </Button>
      </div>

      {/* ── Stat Tiles ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-zinc-900 border-zinc-800 p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Boxes className="h-5 w-5 text-zinc-300" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-none">
              {inventory.length}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">
              Total Items
            </p>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400 leading-none">
              {inStockCount}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">
              In Stock
            </p>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <TrendingDown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400 leading-none">
              {lowCount}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">
              Low Stock
            </p>
          </div>
        </Card>

        <Card
          className={`bg-zinc-900 border-zinc-800 p-4 flex items-center gap-3 ${
            criticalCount > 0 ? "border-rose-900/60" : ""
          }`}
        >
          <div className="p-2 rounded-xl bg-rose-500/10">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-rose-400 leading-none">
              {criticalCount}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">
              Critical
            </p>
          </div>
        </Card>
      </div>

      {/* ── Filters & Search ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: `All (${inventory.length})`, cls: "bg-zinc-800 text-white" },
              { key: "in_stock", label: `In Stock (${inStockCount})`, cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" },
              { key: "low", label: `Low (${lowCount})`, cls: "bg-amber-500/20 text-amber-400 border border-amber-500/40" },
              { key: "critical", label: `Critical (${criticalCount})`, cls: "bg-rose-500/20 text-rose-400 border border-rose-500/40" },
            ] as { key: "all" | "in_stock" | "low" | "critical"; label: string; cls: string }[]
          ).map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === key
                  ? cls
                  : "bg-zinc-950 text-zinc-500 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search ingredient or unit…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
          />
        </div>
      </div>

      {/* ── Card Grid ──────────────────────────────────────── */}
      {filteredInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm font-medium">
            No items match your filters
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Try adjusting the search or filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => {
            const meta =
              STATUS_META[item.status as keyof typeof STATUS_META] ??
              STATUS_META.in_stock;
            const pct = stockPercent(item.quantity, item.minimum_quantity);
            const displayName = cleanName(item.name);

            return (
              <Card
                key={item.id}
                className={`bg-zinc-900 border-zinc-800 border-l-4 ${meta.border} overflow-hidden hover:bg-zinc-850 transition-colors ${meta.glow ? `shadow-lg ${meta.glow}` : ""}`}
              >
                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-zinc-800 shrink-0">
                        <Package className="h-3.5 w-3.5 text-orange-400" />
                      </div>
                      <p
                        className="text-sm font-bold text-white leading-tight line-clamp-2"
                        title={displayName}
                      >
                        {displayName}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 mt-0.5">
                      {meta.icon}
                    </div>
                  </div>

                  {/* Quantity display */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black text-white leading-none">
                        {item.quantity % 1 === 0
                          ? item.quantity
                          : item.quantity.toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 uppercase font-semibold">
                        {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                        Min
                      </p>
                      <p className="text-xs text-zinc-400 font-semibold">
                        {item.minimum_quantity} {item.unit}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${meta.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600">
                      {pct}% of recommended level
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setAdjustType("add");
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Stock
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setAdjustType("remove");
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                      Reduce
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Add New Item Modal ─────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Item"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <Input
            label="Item Name / Ingredient"
            placeholder="e.g. Tomato Paste, Onions, Mayonnaise"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Unit of Measurement
              </label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="pcs">pcs (Pieces)</option>
                <option value="liters">liters</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="packets">packets</option>
                <option value="cans">cans</option>
                <option value="boxes">boxes</option>
              </select>
            </div>

            <Input
              label="Starting Quantity"
              type="number"
              step="any"
              placeholder="e.g. 25.0"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              required
            />
          </div>

          <Input
            label="Minimum Alert Threshold"
            type="number"
            step="any"
            placeholder="e.g. 5.0"
            value={newItemMinThreshold}
            onChange={(e) => setNewItemMinThreshold(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isAdding}
              className="bg-orange-600 hover:bg-orange-500 font-bold"
            >
              {isAdding ? "Adding…" : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Adjust Stock Modal ─────────────────────────────── */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Adjust Stock — ${selectedItem ? cleanName(selectedItem.name) : ""}`}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between text-xs">
              <span className="text-zinc-400">Current Level</span>
              <span className="font-bold text-white">
                {selectedItem.quantity} {selectedItem.unit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType("add")}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  adjustType === "add"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800"
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("remove")}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  adjustType === "remove"
                    ? "bg-rose-600 text-white border-rose-500"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800"
                }`}
              >
                − Reduce Stock
              </button>
            </div>

            <Input
              label={`Quantity to ${adjustType === "add" ? "add" : "remove"} (${selectedItem.unit})`}
              type="number"
              step="any"
              placeholder="e.g. 5.0"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />

            <Input
              label="Reason / Reference"
              placeholder="e.g. Daily shipment, spoilage, audit"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAdjust}
                className="bg-orange-600 hover:bg-orange-500 font-bold"
              >
                Confirm Adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Delete Inventory Item"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-300">
            Are you sure you want to delete{" "}
            <span className="font-bold text-white">
              {deletingItem ? cleanName(deletingItem.name) : ""}
            </span>
            ? Any recipes referencing this ingredient will no longer deduct this
            stock.
          </p>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteItem}
              className="font-bold"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
