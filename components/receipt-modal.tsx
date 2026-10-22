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
    window.print();
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
            className="receipt-container bg-white text-black p-4 rounded-xl shadow-xl border border-zinc-300 mx-auto max-w-[340px] font-mono leading-tight transition-all"
          >
          {/* Top Brand Logo & Restaurant Header - Compact & Crisp Black & White */}
          <div className="text-center pb-2 border-b border-black">
            <h2 className="text-lg font-black tracking-tighter text-black uppercase">
              SWIFTBITE POS
            </h2>
            <p className="text-[10px] font-black text-black tracking-wider uppercase">
              GOURMET BURGERS & FAST FOOD
            </p>
            <p className="text-[9px] text-black font-semibold mt-0.5 leading-tight">
              Main G.T. Road, near Orange Line Station, Lahore
            </p>
            <p className="text-[9px] text-black font-bold">
              Tel: 0321-2490006 / 0306-4656951
            </p>
          </div>

          {/* Receipt Number & Type Bar */}
          <div className="my-1.5 py-1 px-2 border-y border-black flex items-center justify-between font-black text-black text-xs">
            <span>RECEIPT #{numericReceiptNo}</span>
            <span className="uppercase tracking-wider">
              {order.order_type ? order.order_type.replace("_", " ") : "DINE-IN"}
            </span>
          </div>

          {/* Metadata Grid - Compact Single-Line Black Text */}
          <div className="py-1 text-[10px] space-y-0.5 font-bold text-black border-b border-dashed border-black">
            <div className="flex justify-between items-center">
              <span>Date:</span>
              <span>{formattedDate} {formattedTime}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Cashier:</span>
              <span>{order.waiter_name || "Admin"}</span>
            </div>

            {order.customer_name && (
              <div className="flex justify-between items-center">
                <span>Customer:</span>
                <span className="font-black">{order.customer_name}</span>
              </div>
            )}

            {order.customer_phone && (
              <div className="flex justify-between items-center">
                <span>Phone:</span>
                <span>{order.customer_phone}</span>
              </div>
            )}

            {order.delivery_address && (
              <div className="flex justify-between items-start pt-0.5">
                <span className="shrink-0 mr-2">Address:</span>
                <span className="text-right font-semibold">{order.delivery_address}</span>
              </div>
            )}
          </div>

          {/* Items Table - Dense & High Contrast Black */}
          <div className="py-1 space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase text-black border-b border-black pb-0.5">
              <span>ITEM</span>
              <span>QTY &times; RATE</span>
              <span>AMOUNT</span>
            </div>

            <div className="divide-y divide-dotted divide-zinc-400">
              {order.items?.map((item) => (
                <div key={item.id} className="py-1 text-xs text-black">
                  <div className="flex justify-between items-start font-black">
                    <span className="pr-2">{item.menu_item_name}</span>
                    <span className="whitespace-nowrap">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-black mt-0.5">
                    <span>{item.quantity} &times; Rs. {item.price.toLocaleString()}</span>
                  </div>
                  {item.notes && (
                    <p className="text-[9px] font-bold text-black mt-0.5 leading-tight italic">
                      + {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-1.5 border-t-2 border-black space-y-0.5 text-xs font-black text-black">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>

            {calcDiscountValue > 0 && (
              <div className="flex justify-between">
                <span>Discount ({isPercentage ? `${discountAmount}%` : "Flat"}):</span>
                <span>- Rs. {calcDiscountValue.toLocaleString()}</span>
              </div>
            )}

            {/* Total Highlight */}
            <div className="pt-1 mt-1 border-t border-black flex justify-between items-baseline text-sm font-black">
              <span className="uppercase tracking-wider">NET TOTAL</span>
              <span className="text-base tracking-tight">
                Rs. {order.total.toLocaleString()}
              </span>
            </div>

            {order.payment_method && (
              <div className="pt-1 flex justify-between text-[10px] uppercase font-black">
                <span>Payment:</span>
                <span>{order.payment_method.replace("_", " ")}</span>
              </div>
            )}
          </div>

          {/* Footer - Minimal Compact */}
          <div className="pt-2 text-center text-black border-t border-dashed border-black mt-1.5 space-y-0.5">
            <p className="text-[10px] font-black uppercase">
              *** THANK YOU FOR YOUR VISIT ***
            </p>
            <p className="text-[8px] font-bold">
              Software by SwiftBite POS
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
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-orange-600/20 text-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </Button>
        </div>
      </div>

      {/* High Quality Thermal Print Stylesheet */}
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
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
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
