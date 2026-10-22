"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { POSOrder, formatOrderNumber } from "@/lib/pos-data";
import { Printer, ChefHat, Clock, AlertCircle } from "lucide-react";

interface KitchenReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: POSOrder | null;
}

export function KitchenReceiptModal({ isOpen, onClose, order }: KitchenReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const numericReceiptNo = formatOrderNumber(order.order_number || order.id);

  const orderDate = new Date(order.created_at);
  const formattedTime = orderDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const formattedDate = orderDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kitchen Order Ticket (KOT)">
      <div className="space-y-4">
        {/* Printable Area - Scrollable Preview Container */}
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div
            id="kitchen-receipt"
            className="receipt-container bg-white text-zinc-950 p-6 sm:p-7 rounded-2xl shadow-xl border-2 border-zinc-950 mx-auto max-w-[380px] font-mono transition-all"
          >
            {/* Header: Kitchen KOT */}
            <div className="text-center pb-3 border-b-2 border-black">
              <div className="inline-flex items-center justify-center p-1.5 rounded-xl bg-black text-white mb-1.5">
                <ChefHat className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-black uppercase">
                *** KITCHEN ORDER TICKET ***
              </h2>
              <p className="text-xs font-black tracking-widest text-zinc-800 uppercase mt-0.5">
                SWIFTBITE KITCHEN DISPATCH
              </p>
            </div>

            {/* Prominent Order No & Order Type Banner */}
            <div className="my-3 py-2.5 px-3 bg-zinc-100 border-2 border-black rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 block">
                  KOT # / ORDER #
                </span>
                <span className="text-xl font-black tracking-wider text-black">
                  #{numericReceiptNo}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-black text-white font-black text-xs uppercase tracking-wider">
                  {order.order_type ? order.order_type.replace("_", " ") : "DINE IN"}
                </span>
              </div>
            </div>

            {/* Server / Customer Meta */}
            <div className="py-2.5 border-y-2 border-dashed border-black text-xs space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-700 font-bold">Time Placed:</span>
                <span className="font-black text-black">{formattedTime} ({formattedDate})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-700 font-bold">Punched By:</span>
                <span className="font-black text-black">{order.waiter_name || "Cashier Desk"}</span>
              </div>
              {order.customer_name && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-700 font-bold">Customer:</span>
                  <span className="font-black text-black">{order.customer_name}</span>
                </div>
              )}
            </div>

            {/* Kitchen Items to Prepare */}
            <div className="pt-3 pb-2 space-y-2">
              <div className="flex justify-between text-sm font-black uppercase tracking-wider text-black border-b-2 border-black pb-1.5">
                <span>QTY & ITEM NAME</span>
                <span>STATUS</span>
              </div>

              <div className="divide-y divide-dashed divide-zinc-400">
                {order.items?.map((item, idx) => (
                  <div key={item.id || idx} className="py-3 flex justify-between items-start">
                    <div className="pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black px-2 py-0.5 rounded bg-black text-white">
                          {item.quantity}x
                        </span>
                        <span className="text-base font-black text-black">
                          {item.menu_item_name}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="mt-1.5 pl-8 text-xs font-black text-black bg-zinc-100 p-2 rounded-lg border-2 border-black space-y-1">
                          <p className="text-[11px] uppercase font-black tracking-wider text-zinc-800">COMBO ITEMS TO PREPARE:</p>
                          <p className="text-sm font-black text-black leading-tight">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-zinc-700 pt-1">[ COOK ]</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions / Notes */}
            {order.notes && (
              <div className="mt-3 p-3 rounded border-2 border-black bg-zinc-100 text-sm">
                <p className="font-black text-black uppercase flex items-center gap-1 mb-0.5 text-xs">
                  <AlertCircle className="h-4 w-4 text-black" />
                  <span>KITCHEN SPECIAL NOTES:</span>
                </p>
                <p className="font-black text-black italic text-sm">"{order.notes}"</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 pb-1 text-center border-t-2 border-black mt-4 text-xs space-y-1">
              <p className="font-black uppercase tracking-wider text-black text-xs">
                === END OF KITCHEN ORDER TICKET ===
              </p>
              <p className="text-zinc-750 font-bold">Send physical print to kitchen line</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-zinc-900 hover:bg-black text-white font-black flex items-center space-x-1.5 text-xs px-4"
          >
            <Printer className="h-4 w-4 text-orange-400" />
            <span>Print Kitchen KOT (Thermal)</span>
          </Button>
        </div>
      </div>

      {/* Print Styles for Kitchen Receipt */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          #kitchen-receipt, #kitchen-receipt * {
            visibility: visible;
          }
          #kitchen-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 12px 14px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </Modal>
  );
}
