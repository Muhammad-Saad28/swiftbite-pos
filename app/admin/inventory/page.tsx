"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { getPOSInventory, adjustPOSInventoryStock, POSInventoryItem } from "@/lib/pos-data";
import { Boxes, AlertTriangle, Plus, Minus, RefreshCw, CheckCircle, Package } from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<POSInventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustReason, setAdjustReason] = useState("");

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
    const delta = adjustType === "add" ? qty : -qty;
    await adjustPOSInventoryStock(selectedItem.id, delta, adjustReason || "Stock adjustment");
    setSelectedItem(null);
    setAdjustQty("");
    setAdjustReason("");
    await refreshData();
  };

  const lowStockCount = inventory.filter((i) => i.status === "low" || i.status === "critical").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inventory Control</h1>
          <p className="text-xs text-zinc-400">Track raw ingredients, stock quantities, and minimum thresholds</p>
        </div>
        <div className="flex items-center space-x-2">
          {lowStockCount > 0 && (
            <Badge variant="critical">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              {lowStockCount} Items Low / Critical
            </Badge>
          )}
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
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center space-x-2">
                    <Package className="h-4 w-4 text-orange-400" />
                    <span>{item.name}</span>
                  </td>
                  <td className="p-4 font-extrabold text-sm text-zinc-100">
                    {item.quantity} {item.unit}
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
                      Add Stock
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
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
    </div>
  );
}
