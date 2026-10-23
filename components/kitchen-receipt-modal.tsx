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
    const printElement = document.getElementById("kitchen-receipt");
    if (!printElement) {
      window.print();
      return;
    }

    // Remove any existing print iframe
    const existingIframe = document.getElementById("kot-print-iframe");
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create a hidden, isolated iframe dedicated solely to printing this KOT
    const iframe = document.createElement("iframe");
    iframe.id = "kot-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KOT #${numericReceiptNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: 100%;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              -webkit-font-smoothing: none !important;
              font-weight: 900 !important;
            }
            .print-wrapper {
              width: 78mm;
              max-width: 78mm;
              margin: 0 auto;
              padding: 4mm 2mm;
            }
            /* Component styling translations for thermal print fidelity */
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .inline-flex { display: inline-flex; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-x-1\\.5 > * + * { margin-left: 6px; }
            .space-x-2 > * + * { margin-left: 8px; }
            .border-b { border-bottom: 1.5px solid #000; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-y-2 { border-top: 2px solid #000; border-bottom: 2px solid #000; }
            .border-2 { border: 2px solid #000; }
            .border-dashed { border-style: dashed !important; }
            .border-dotted { border-style: dotted !important; }
            .rounded { border-radius: 4px; }
            .rounded-lg { border-radius: 6px; }
            .rounded-xl { border-radius: 8px; }
            .bg-black { background-color: #000000 !important; color: #ffffff !important; }
            .text-white { color: #ffffff !important; }
            .text-black { color: #000000 !important; }
            .font-black { font-weight: 900; }
            .font-extrabold { font-weight: 800; }
            .font-bold { font-weight: 700; }
            .text-xs { font-size: 11px; line-height: 14px; }
            .text-sm { font-size: 13px; line-height: 16px; }
            .text-base { font-size: 15px; line-height: 18px; }
            .text-lg { font-size: 16px; line-height: 20px; }
            .text-xl { font-size: 18px; line-height: 22px; }
            .p-1 { padding: 4px; }
            .p-1\\.5 { padding: 6px; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 10px; }
            .px-1\\.5 { padding-left: 6px; padding-right: 6px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .px-2\\.5 { padding-left: 10px; padding-right: 10px; }
            .px-3 { padding-left: 12px; padding-right: 12px; }
            .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .pt-1 { padding-top: 4px; }
            .pt-2 { padding-top: 8px; }
            .pt-3 { padding-top: 10px; }
            .pt-4 { padding-top: 14px; }
            .pb-1 { padding-bottom: 4px; }
            .pb-1\\.5 { padding-bottom: 6px; }
            .pb-2 { padding-bottom: 8px; }
            .pb-3 { padding-bottom: 10px; }
            .my-3 { margin-top: 10px; margin-bottom: 10px; }
            .mt-0\\.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .mt-1\\.5 { margin-top: 6px; }
            .mt-3 { margin-top: 10px; }
            .mt-4 { margin-top: 14px; }
            .mb-0\\.5 { margin-bottom: 2px; }
            .mb-1\\.5 { margin-bottom: 6px; }
            .pr-2 { padding-right: 8px; }
            .pl-8 { padding-left: 28px; }
            .leading-tight { line-height: 1.25; }
            .italic { font-style: italic; }
            .divide-y-2 > * + * { border-top: 2px dashed #000000; }
            .divide-dashed { border-style: dashed; }
            
            /* Prevent unwanted pagination splits */
            .print-wrapper, .print-wrapper * {
              page-break-inside: auto;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Allow browser layout engine to render isolated DOM before printing
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up after print window opens
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 150);
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
            className="receipt-container bg-white text-zinc-950 p-6 sm:p-7 rounded-2xl shadow-xl border-2 border-zinc-950 mx-auto max-w-[380px] font-sans transition-all"
          >
            {/* Header: Kitchen KOT */}
            <div className="text-center pb-3 border-b-2 border-black">
              <div className="inline-flex items-center justify-center p-1.5 rounded-xl bg-black text-white mb-1.5">
                <ChefHat className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-black uppercase font-sans">
                *** KITCHEN ORDER TICKET ***
              </h2>
              <p className="text-xs font-black tracking-widest text-black uppercase mt-0.5">
                SWIFTBITE KITCHEN DISPATCH
              </p>
            </div>

            {/* Prominent Order No & Order Type Banner */}
            <div className="my-3 py-2.5 px-3 bg-zinc-100 border-2 border-black rounded-lg flex items-center justify-between font-sans">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-black block">
                  KOT # / ORDER #
                </span>
                <span className="text-xl font-black tracking-wider text-black">
                  #{numericReceiptNo}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-black text-white font-black text-xs uppercase tracking-wider">
                  {order.order_type ? order.order_type.replace("_", " ") : "DINE IN"}
                  {(!order.order_type || order.order_type === "dine_in") && order.table_number ? ` - TABLE #${order.table_number}` : ""}
                </span>
              </div>
            </div>

            {/* Server / Customer Meta */}
            <div className="py-2.5 border-y-2 border-dashed border-black text-xs space-y-1.5 text-black font-black font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="text-black font-black uppercase">Time Placed:</span>
                <span className="font-black text-black">{formattedTime} ({formattedDate})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-black font-black uppercase">Punched By:</span>
                <span className="font-black text-black">{order.waiter_name || "Cashier Desk"}</span>
              </div>
              {order.customer_name && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-black font-black uppercase">Customer:</span>
                  <span className="font-black text-black">{order.customer_name}</span>
                </div>
              )}
            </div>

            {/* Kitchen Items to Prepare */}
            <div className="pt-3 pb-2 space-y-2 text-black font-black font-sans">
              <div className="flex justify-between text-sm sm:text-base font-black uppercase tracking-wider text-black border-b-2 border-black pb-1.5">
                <span>QTY & ITEM NAME</span>
                <span>STATUS</span>
              </div>

              <div className="divide-y divide-dashed divide-zinc-400">
                {order.items?.map((item, idx) => {
                  const isDeal =
                    item.menu_item_name?.toLowerCase().includes("deal") ||
                    item.menu_item_name?.toLowerCase().includes("combo");

                  return (
                    <div key={item.id || idx} className="py-3 text-black font-black font-sans">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-black px-2 py-0.5 rounded bg-black text-white">
                            {item.quantity}x
                          </span>
                          <span className="text-base sm:text-lg font-black text-black tracking-tight leading-snug">
                            {item.menu_item_name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-black pt-1">[ COOK ]</span>
                      </div>
                      {/* Only show includes for Combo Deals */}
                      {isDeal && item.notes && (
                        <div className="mt-1 text-left text-black font-black font-sans">
                          <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-black">
                            COMBO ITEMS TO PREPARE:
                          </p>
                          <p className="text-sm font-black text-black leading-tight mt-0.5">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
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
    </Modal>
  );
}
