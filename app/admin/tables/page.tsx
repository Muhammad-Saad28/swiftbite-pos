"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { 
  getPOSTables, 
  getPOSOrders, 
  reservePOSTable, 
  cancelPOSTableReservation, 
  POSTable, 
  POSOrder 
} from "@/lib/pos-data";
import { Utensils, Users, Plus, Calendar, XCircle, Phone, User } from "lucide-react";

export default function AdminTablesPage() {
  const [tables, setTables] = useState<POSTable[]>([]);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [selectedTable, setSelectedTable] = useState<POSTable | null>(null);

  // Add Table State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");

  // Reservation Modal State
  const [reservingTable, setReservingTable] = useState<POSTable | null>(null);
  const [reservedBy, setReservedBy] = useState("");
  const [reservedPhone, setReservedPhone] = useState("");
  const [reservedTime, setReservedTime] = useState("");

  const refreshData = async () => {
    const [fetchedTables, fetchedOrders] = await Promise.all([
      getPOSTables(),
      getPOSOrders(),
    ]);
    setTables(fetchedTables);
    setOrders(fetchedOrders);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddTable = () => {
    if (!newTableNum) return;
    const num = parseInt(newTableNum, 10);
    const cap = parseInt(newCapacity, 10) || 4;
    setTables([
      ...tables,
      { id: `t_${Date.now()}`, table_number: num, capacity: cap, status: "available" },
    ]);
    setIsAddModalOpen(false);
    setNewTableNum("");
  };

  const handleReserve = async () => {
    if (!reservingTable || !reservedBy) return;
    await reservePOSTable(reservingTable.table_number, reservedBy, reservedPhone, reservedTime);
    setReservingTable(null);
    setReservedBy("");
    setReservedPhone("");
    setReservedTime("");
    await refreshData();
  };

  const handleCancelReservation = async (tableNum: number) => {
    await cancelPOSTableReservation(tableNum);
    setSelectedTable(null);
    await refreshData();
  };

  const getActiveOrderForTable = (tableNumber: number) => {
    return orders.find(
      (o) => o.table_number === tableNumber && o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Table Management & Reservations</h1>
          <p className="text-xs text-zinc-400">Configure floor layout, reserve tables for guests, and monitor occupancy</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Table</span>
        </Button>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((t) => {
          const activeOrder = getActiveOrderForTable(t.table_number);
          return (
            <Card
              key={t.id}
              onClick={() => setSelectedTable(t)}
              className={`cursor-pointer transition-all border p-4 flex flex-col justify-between h-44 ${
                t.status === "occupied"
                  ? "bg-orange-950/20 border-orange-500/40 hover:border-orange-500"
                  : t.status === "reserved"
                  ? "bg-sky-950/20 border-sky-500/40 hover:border-sky-500"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl font-black text-white">
                  #{t.table_number.toString().padStart(2, "0")}
                </span>
                <Badge variant={t.status}>{t.status}</Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-xs text-zinc-400 space-x-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>Cap: {t.capacity} Seats</span>
                </div>

                {t.status === "reserved" && (
                  <p className="text-[11px] font-bold text-sky-400 truncate">
                    Res: {t.reserved_by || "Guest"}
                  </p>
                )}

                {activeOrder ? (
                  <p className="text-[11px] font-bold text-orange-400 truncate">
                    Order #{activeOrder.id} (Rs. {activeOrder.total})
                  </p>
                ) : t.status !== "reserved" ? (
                  <p className="text-[11px] text-emerald-400 font-medium">Ready for guests</p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Table Details Modal */}
      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`Table #${selectedTable?.table_number.toString().padStart(2, "0")} Details`}
      >
        {selectedTable && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs text-zinc-400">Current Status</span>
              <Badge variant={selectedTable.status}>{selectedTable.status}</Badge>
            </div>

            {selectedTable.status === "reserved" && (
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-1 text-xs">
                <p className="font-bold text-sky-300">Reservation Info</p>
                <p className="text-zinc-300">Reserved For: <span className="font-bold text-white">{selectedTable.reserved_by}</span></p>
                {selectedTable.reserved_phone && <p className="text-zinc-400">Phone: {selectedTable.reserved_phone}</p>}
                {selectedTable.reserved_time && <p className="text-zinc-400">Time Slot: {selectedTable.reserved_time}</p>}
              </div>
            )}

            {getActiveOrderForTable(selectedTable.table_number) && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <span className="font-bold text-white text-sm">Active Order Summary</span>
                <p className="text-zinc-400">
                  Order #{getActiveOrderForTable(selectedTable.table_number)?.id} &bull; Waiter: {getActiveOrderForTable(selectedTable.table_number)?.waiter_name}
                </p>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-orange-400">
                  <span>Total Amount</span>
                  <span>Rs. {getActiveOrderForTable(selectedTable.table_number)?.total}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {selectedTable.status === "available" && (
                <Button
                  size="sm"
                  onClick={() => { setReservingTable(selectedTable); setSelectedTable(null); }}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Reserve Table
                </Button>
              )}

              {selectedTable.status === "reserved" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelReservation(selectedTable.table_number)}
                  className="border-red-500/40 text-red-400 hover:bg-red-500/20 font-bold text-xs"
                >
                  Clear Reservation
                </Button>
              )}

              <Button size="sm" variant="ghost" onClick={() => setSelectedTable(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reserve Table Modal */}
      <Modal isOpen={!!reservingTable} onClose={() => setReservingTable(null)} title={`Reserve Table #${reservingTable?.table_number}`}>
        <div className="space-y-4">
          <Input
            label="Guest Name"
            placeholder="e.g. Usman Malik"
            value={reservedBy}
            onChange={(e) => setReservedBy(e.target.value)}
          />
          <Input
            label="Contact Phone"
            placeholder="0300-1234567"
            value={reservedPhone}
            onChange={(e) => setReservedPhone(e.target.value)}
          />
          <Input
            label="Reservation Time Slot"
            placeholder="e.g. 8:30 PM Tonight"
            value={reservedTime}
            onChange={(e) => setReservedTime(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setReservingTable(null)}>Cancel</Button>
            <Button size="sm" onClick={handleReserve} className="bg-sky-600 hover:bg-sky-500 text-white font-bold">
              Save Reservation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Table Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Table">
        <div className="space-y-4">
          <Input
            label="Table Number"
            type="number"
            placeholder="13"
            value={newTableNum}
            onChange={(e) => setNewTableNum(e.target.value)}
          />
          <Input
            label="Seating Capacity"
            type="number"
            placeholder="4"
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddTable} className="bg-orange-600 hover:bg-orange-500 font-bold">Create Table</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
