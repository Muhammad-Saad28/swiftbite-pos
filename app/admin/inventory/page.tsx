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
  POSInventoryItem 
} from "@/lib/pos-data";
import { Boxes, AlertTriangle, Plus, Minus, Package, Search, Trash2, ArrowUpDown } from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in_stock" | "low" | "critical">("all");
  
  // Adjust Stock State
  const [selectedItem, setSelectedItem] = useState<POSInventoryItem | null>(null);
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
  const [deletingItem, setDeletingItem] = useState<POSInventoryItem | null>(null);

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
    await adjustPOSInventoryStock(selectedItem.id, delta, adjustReason || "Stock adjustment");
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

  const lowStockCount = inventory.filter((i) => i.status === "low" || i.status === "critical").length;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inventory Control</h1>
          <p className="text-xs text-zinc-400">Track raw ingredients, stock quantities, and minimum thresholds</p>
        </div>
        <div className="flex items-center space-x-3">
          {lowStockCount > 0 && (
            <Badge variant="critical">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              {lowStockCount} Low / Critical
            </Badge>
          )}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Inventory Item</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "all"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850"
            }`}
          >
            All Items ({inventory.length})
          </button>
          <button
            onClick={() => setFilterStatus("in_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "in_stock"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850"
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setFilterStatus("low")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "low"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850"
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilterStatus("critical")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "critical"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850"
            }`}
          >
            Critical
          </button>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search ingredient, unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Ingredient / Stock Item</th>
                <th className="p-4">Current Quantity</th>
                <th className="p-4">Min. Threshold</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                    No inventory items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center space-x-2">
                      <Package className="h-4 w-4 text-orange-400 shrink-0" />
                      <span>{item.name}</span>
                    </td>
                    <td className="p-4 font-extrabold text-sm text-zinc-100">
                      {item.quantity} <span className="text-zinc-400 text-xs font-normal">{item.unit}</span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      {item.minimum_quantity} {item.unit}
                    </td>
                    <td className="p-4 uppercase font-semibold text-zinc-400">{item.unit}</td>
                    <td className="p-4">
                      <Badge variant={item.status}>{item.status?.replace("_", " ")}</Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setAdjustType("add");
                        }}
                        className="text-xs border-zinc-700 hover:bg-zinc-800 text-emerald-400"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setAdjustType("remove");
                        }}
                        className="text-xs border-zinc-700 hover:bg-zinc-800 text-rose-400"
                      >
                        <Minus className="h-3.5 w-3.5 mr-1" />
                        Reduce
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingItem(item)}
                        className="text-xs text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add New Inventory Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Stock Item"
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
                <option value="liters">liters (Liters)</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="packets">packets (Packets)</option>
                <option value="cans">cans (Cans)</option>
                <option value="boxes">boxes (Boxes)</option>
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
            placeholder="e.g. 5.0 (Triggers Low-Stock warning)"
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
              {isAdding ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Adjust Stock: ${selectedItem?.name}`}
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
                - Reduce Stock
              </button>
            </div>

            <Input
              label={`Quantity to ${adjustType} (${selectedItem.unit})`}
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

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmAdjust} className="bg-orange-600 hover:bg-orange-500 font-bold">
                Confirm Adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Delete Inventory Item"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-300">
            Are you sure you want to delete <span className="font-bold text-white">{deletingItem?.name}</span>? 
            Any menu dish recipes referencing this ingredient will no longer deduct this stock.
          </p>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleDeleteItem} className="font-bold">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
