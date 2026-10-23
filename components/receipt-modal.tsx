"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { POSOrder, formatOrderNumber } from "@/lib/pos-data";
import { Printer, Download, Sparkles, CheckCircle2 } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: POSOrder | null;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    const printElement = document.getElementById("thermal-receipt");
    if (!printElement) {
      window.print();
      return;
    }

    // Remove any existing print iframe
    const existingIframe = document.getElementById("thermal-print-iframe");
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create a hidden, isolated iframe dedicated solely to printing the final receipt
    const iframe = document.createElement("iframe");
    iframe.id = "thermal-print-iframe";
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
          <title>Receipt #${numericReceiptNo}</title>
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
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .inline-flex { display: inline-flex; }
            .inline-block { display: inline-block; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .items-baseline { align-items: baseline; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .space-y-0\\.5 > * + * { margin-top: 2px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-2\\.5 > * + * { margin-top: 10px; }
            .space-x-1 > * + * { margin-left: 4px; }
            .space-x-2 > * + * { margin-left: 8px; }
            .space-x-\\[2px\\] > * + * { margin-left: 2px; }
            .border-b { border-bottom: 1.5px solid #000; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .border-t { border-top: 1.5px solid #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-y-2 { border-top: 2px solid #000; border-bottom: 2px solid #000; }
            .border-2 { border: 2px solid #000; }
            .border { border: 1.5px solid #000; }
            .border-dashed { border-style: dashed !important; }
            .border-dotted { border-style: dotted !important; }
            .rounded { border-radius: 4px; }
            .rounded-lg { border-radius: 6px; }
            .rounded-xl { border-radius: 8px; }
            .rounded-2xl { border-radius: 12px; }
            .rounded-full { border-radius: 9999px; }
            .bg-black { background-color: #000000 !important; color: #ffffff !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-zinc-100, .bg-zinc-200 { background-color: #f4f4f5 !important; }
            .text-white { color: #ffffff !important; }
            .text-black { color: #000000 !important; }
            .font-black { font-weight: 900; }
            .font-extrabold { font-weight: 800; }
            .font-bold { font-weight: 700; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
            .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
            .text-xs { font-size: 11px; line-height: 14px; }
            .text-sm { font-size: 13px; line-height: 16px; }
            .text-base { font-size: 15px; line-height: 18px; }
            .text-lg { font-size: 17px; line-height: 20px; }
            .text-xl { font-size: 19px; line-height: 22px; }
            .text-2xl { font-size: 21px; line-height: 24px; }
            .text-3xl { font-size: 24px; line-height: 26px; }
            .p-1 { padding: 4px; }
            .p-1\\.5 { padding: 6px; }
            .p-2 { padding: 8px; }
            .p-2\\.5 { padding: 10px; }
            .p-3 { padding: 12px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .px-2\\.5 { padding-left: 10px; padding-right: 10px; }
            .px-3 { padding-left: 12px; padding-right: 12px; }
            .px-3\\.5 { padding-left: 14px; padding-right: 14px; }
            .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .pt-0\\.5 { padding-top: 2px; }
            .pt-1 { padding-top: 4px; }
            .pt-1\\.5 { padding-top: 6px; }
            .pt-2 { padding-top: 8px; }
            .pt-2\\.5 { padding-top: 10px; }
            .pt-3 { padding-top: 12px; }
            .pt-3\\.5 { padding-top: 14px; }
            .pt-4 { padding-top: 16px; }
            .pt-5 { padding-top: 20px; }
            .pb-1 { padding-bottom: 4px; }
            .pb-1\\.5 { padding-bottom: 6px; }
            .pb-2 { padding-bottom: 8px; }
            .pb-3 { padding-bottom: 10px; }
            .pb-4 { padding-bottom: 14px; }
            .my-3 { margin-top: 10px; margin-bottom: 10px; }
            .mt-0\\.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .mt-1\\.5 { margin-top: 6px; }
            .mt-2 { margin-top: 8px; }
            .mt-3 { margin-top: 12px; }
            .mb-0\\.5 { margin-bottom: 2px; }
            .mb-1\\.5 { margin-bottom: 6px; }
            .pr-3 { padding-right: 12px; }
            .h-10 { height: 40px; }
            .h-18 { height: 72px; }
            .w-18 { width: 72px; }
            .h-full { height: 100%; }
            .w-full { width: 100%; }
            .leading-snug { line-height: 1.35; }
            .leading-tight { line-height: 1.25; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-tight { letter-spacing: -0.025em; }
            .whitespace-nowrap { white-space: nowrap; }
            .divide-y-2 > * + * { border-top: 2px dashed #000000; }
            .divide-dashed { border-style: dashed; }
            
            /* Clean pagination behavior */
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

    // Allow rendering engine to layout detached DOM before print invocation
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove iframe from DOM after print dialog triggers
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 150);
  };

  const discountAmount = order.discount_amount || 0;
  const isPercentage = order.discount_type === "percentage";
  const calcDiscountValue = isPercentage
    ? Math.round(order.subtotal * (discountAmount / 100))
    : discountAmount;

  // Formatted numeric order sequence (e.g. 0000001, 0000002)
  const numericReceiptNo = formatOrderNumber(order.order_number || order.id);

  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt & Thermal Print">
      <div className="space-y-4">
        {/* Printable Area - Scrollable Preview Container */}
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div
            id="thermal-receipt"
            className="receipt-container bg-white text-zinc-950 p-6 sm:p-7 rounded-2xl shadow-xl border border-zinc-200/80 mx-auto max-w-[380px] font-sans transition-all"
          >
          {/* Top Restaurant Header */}
          <div className="text-center space-y-1.5 pb-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black uppercase font-sans">
                SWIFTBITE POS
              </h2>
              <p className="text-xs font-black text-black tracking-wider uppercase mt-0.5">
                Gourmet Burgers & Fast Food
              </p>
            </div>

            <div className="text-xs text-black leading-snug space-y-0.5 pt-0.5 font-bold">
              <p>Main G.T. Road, near Orange Line Station, Dera Gujran, Lahore</p>
              <p>Phone: 0321-2490006 / 0306-4656951</p>
            </div>
          </div>

          {/* Receipt Number Banner - Clean without boxes */}
          <div className="my-2 py-1 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-black block">
                Receipt Number
              </span>
              <span className="text-base font-black font-mono tracking-wider text-black">
                #{numericReceiptNo}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-block text-xs font-black uppercase tracking-wider text-black">
                {order.order_type ? order.order_type.replace("_", " ") : "Dine-In"}
              </span>
            </div>
          </div>

          {/* Metadata Section - Clean, Darker & Bold */}
          <div className="py-2.5 text-xs sm:text-sm space-y-1.5 font-sans text-black font-black">
            <div className="flex justify-between items-center">
              <span className="text-black font-black uppercase">Date & Time:</span>
              <span className="font-black text-black">{formattedDate}, {formattedTime}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-black font-black uppercase">Cashier:</span>
              <span className="font-black text-black">{order.waiter_name || "Admin Manager"}</span>
            </div>

            {order.customer_name && (
              <div className="space-y-1.5 pt-1 text-black font-black">
                <div className="flex justify-between items-center">
                  <span className="text-black font-black uppercase">Customer:</span>
                  <span className="font-black text-black">{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-black font-black uppercase">Phone:</span>
                    <span className="font-black text-black">{order.customer_phone}</span>
                  </div>
                )}
                {order.delivery_address && (
                  <div className="text-xs sm:text-sm text-black pt-0.5 flex justify-between font-black">
                    <span className="text-black font-black uppercase">Address:</span>
                    <span className="text-right max-w-[65%] font-sans font-black text-black">{order.delivery_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="pt-2 pb-2 space-y-2 text-black font-black font-sans">
            <div className="flex justify-between text-base sm:text-lg font-black uppercase tracking-wider text-black pb-1">
              <span>Item Description</span>
              <span>Amount</span>
            </div>

            <div className="space-y-3">
              {order.items?.map((item) => {
                const isDeal =
                  item.menu_item_name?.toLowerCase().includes("deal") ||
                  item.menu_item_name?.toLowerCase().includes("combo");

                return (
                  <div key={item.id} className="py-1 text-base sm:text-lg font-sans text-black font-black">
                    <div className="flex justify-between items-start">
                      <div className="pr-3 text-left">
                        {/* Main Item Name - Matching Same Boldness and Sans Font as ITEM DESCRIPTION */}
                        <p className="text-base sm:text-lg font-black text-black leading-snug tracking-tight">
                          {item.menu_item_name}
                        </p>
                        <p className="text-sm sm:text-base font-black text-black mt-0.5">
                          {item.quantity} &times; Rs. {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-black whitespace-nowrap text-base sm:text-lg">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Only show includes for Combo Deals */}
                    {isDeal && item.notes && (
                      <div className="mt-1 text-left text-black font-black">
                        <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
                          INCLUDES:
                        </p>
                        <p className="text-sm sm:text-base font-black text-black leading-snug mt-0.5">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-2 space-y-1.5 text-base sm:text-lg font-sans">
            <div className="flex justify-between text-black font-black">
              <span>Subtotal:</span>
              <span className="font-black text-black">Rs. {order.subtotal.toLocaleString()}</span>
            </div>

            {calcDiscountValue > 0 && (
              <div className="flex justify-between text-black font-black">
                <span>Discount ({isPercentage ? `${discountAmount}%` : "Special"}):</span>
                <span>- Rs. {calcDiscountValue.toLocaleString()}</span>
              </div>
            )}

            {/* Total Highlight */}
            <div className="pt-2 flex justify-between items-baseline">
              <div>
                <span className="text-base sm:text-lg font-black uppercase tracking-wider text-black block">
                  Net Amount
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Rs. {order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Greeting - Clean without barcode and without paid by */}
          <div className="pt-4 pb-1 text-center space-y-1 mt-2">
            <div className="text-xs sm:text-sm text-black space-y-1 font-black">
              <p className="font-black text-black text-sm sm:text-base">Thank you for dining with SwiftBite!</p>
              <p className="text-[11px] sm:text-xs font-black">We hope to serve you again soon &bull; Have a wonderful day</p>
            </div>
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
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-orange-600/20 text-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
