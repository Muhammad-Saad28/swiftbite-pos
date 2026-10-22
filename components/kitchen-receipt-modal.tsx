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
    const printContent = document.getElementById("kitchen-receipt");
    if (!printContent) {
      window.print();
      return;
    }

    // Open a dedicated isolated print window to prevent double printing and unwanted gaps
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT #${numericReceiptNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              color: #000000 !important;
              background: transparent !important;
              font-family: 'Courier New', Courier, monospace !important;
              font-weight: 900 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              width: 76mm;
              max-width: 76mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              background: #ffffff !important;
              color: #000000 !important;
              font-size: 11px;
              line-height: 1.2;
            }
            .border-b { border-bottom: 1.5px solid #000 !important; }
            .border-t { border-top: 1.5px solid #000 !important; }
            .border-t-2 { border-top: 2px solid #000 !important; }
            .border-y { border-top: 1.5px solid #000 !important; border-bottom: 1.5px solid #000 !important; }
            .border-y-2 { border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; }
            .border-dashed { border-style: dashed !important; }
            .border-dotted { border-style: dotted !important; }
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .items-center { align-items: center !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .uppercase { text-transform: uppercase !important; }
            .whitespace-nowrap { white-space: nowrap !important; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
            className="receipt-container bg-white text-black p-4 rounded-xl shadow-xl border-2 border-black mx-auto max-w-[340px] font-mono leading-tight transition-all"
          >
            {/* Header: Kitchen KOT */}
            <div className="text-center pb-1.5 border-b-2 border-black">
              <h2 className="text-lg font-black tracking-tight text-black uppercase">
                *** KITCHEN ORDER TICKET ***
              </h2>
              <p className="text-[10px] font-black tracking-widest text-black uppercase mt-0.5">
                SWIFTBITE KITCHEN DISPATCH
              </p>
            </div>

            {/* Prominent Order No & Order Type Banner */}
            <div className="my-1.5 py-1 px-2 border-y-2 border-black flex items-center justify-between font-black text-black">
              <div>
                <span className="text-[9px] uppercase tracking-wider block">KOT #</span>
                <span className="text-base font-black tracking-wider">#{numericReceiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider">
                  {order.order_type ? order.order_type.replace("_", " ") : "DINE IN"}
                </span>
              </div>
            </div>

            {/* Server / Customer Meta */}
            <div className="py-1 border-b border-black text-[10px] space-y-0.5 font-bold text-black">
              <div className="flex justify-between items-center">
                <span>Time Placed:</span>
                <span>{formattedTime} ({formattedDate})</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Punched By:</span>
                <span>{order.waiter_name || "Cashier Desk"}</span>
              </div>
              {order.customer_name && (
                <div className="flex justify-between items-center">
                  <span>Customer:</span>
                  <span className="font-black">{order.customer_name}</span>
                </div>
              )}
            </div>

            {/* Kitchen Items to Prepare */}
            <div className="py-1.5 space-y-1">
              <div className="flex justify-between text-[10px] font-black uppercase text-black border-b border-black pb-0.5">
                <span>QTY & ITEM NAME</span>
                <span>STATUS</span>
              </div>

              <div className="divide-y divide-dotted divide-zinc-400">
                {order.items?.map((item, idx) => (
                  <div key={item.id || idx} className="py-1 flex justify-between items-start text-xs font-black text-black">
                    <div className="pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm underline underline-offset-2">
                          {item.quantity}X
                        </span>
                        <span className="text-xs uppercase">{item.menu_item_name}</span>
                      </div>
                      {item.notes && (
                        <div className="text-[9px] font-bold text-black mt-0.5 pl-4">
                          <span>📦 Includes: {item.notes}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-black pt-0.5">[ COOK ]</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions / Notes */}
            {order.notes && (
              <div className="mt-1.5 p-1.5 rounded border border-black text-[10px] font-black text-black">
                <p className="uppercase">⚠️ NOTES: "{order.notes}"</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 text-center border-t-2 border-black mt-2 text-[10px] font-black text-black">
              <p>=== END OF KITCHEN ORDER TICKET ===</p>
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
          *, *::before, *::after {
            color: #000 !important;
            border-color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
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
            width: 76mm !important;
            max-width: 76mm !important;
            padding: 4mm 2mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            color: #000 !important;
            font-family: monospace, Courier, monospace !important;
            font-weight: 900 !important;
          }
        }
      `}</style>
    </Modal>
  );
}
