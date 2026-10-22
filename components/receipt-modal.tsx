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
            className="receipt-container bg-white text-zinc-950 p-6 sm:p-7 rounded-2xl shadow-xl border border-zinc-200/80 mx-auto max-w-[380px] font-sans transition-all"
          >
          {/* Top Brand Logo & Restaurant Header */}
          <div className="text-center space-y-2 pb-4 border-b-2 border-black">
            <div className="relative inline-block">
              <div className="h-18 w-18 mx-auto rounded-full p-1 bg-black shadow-md flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="SwiftBite Logo"
                  className="h-full w-full object-cover rounded-full bg-black"
                />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight text-black uppercase font-sans">
                SWIFTBITE POS
              </h2>
              <p className="text-sm font-black text-black tracking-wider uppercase mt-0.5">
                Gourmet Burgers & Fast Food
              </p>
            </div>

            <div className="text-xs text-black leading-snug space-y-0.5 pt-1 font-black">
              <p>Main G.T. Road, near Orange Line Station, Dera Gujran, Lahore</p>
              <p>Phone: 0321-2490006 / 0306-4656951</p>
            </div>
          </div>

          {/* Receipt Number Highlight Banner */}
          <div className="my-3 py-2.5 px-3.5 rounded-xl border-2 border-black bg-white flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-black uppercase tracking-widest text-black block">
                Receipt Number
              </span>
              <span className="text-xl font-black font-mono tracking-wider text-black">
                #{numericReceiptNo}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-block px-3.5 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider bg-black text-white shadow-sm">
                {order.order_type ? order.order_type.replace("_", " ") : "Dine-In"}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="py-3 border-y-2 border-dashed border-black text-sm space-y-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-black font-black">Date & Time:</span>
              <span className="font-black text-black">{formattedDate}, {formattedTime}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-black font-black">Server / Cashier:</span>
              <span className="font-black text-black">{order.waiter_name || "Admin Manager"}</span>
            </div>

            {order.customer_name && (
              <div className="pt-2 mt-2 border-t-2 border-dotted border-black space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-black font-black">Customer:</span>
                  <span className="font-black text-black">{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-black font-black">Phone:</span>
                    <span className="font-black text-black">{order.customer_phone}</span>
                  </div>
                )}
                {order.delivery_address && (
                  <div className="text-xs text-black pt-1 flex justify-between font-black">
                    <span className="text-black font-black">Address:</span>
                    <span className="text-right max-w-[65%] font-sans font-black">{order.delivery_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="pt-3 pb-2 space-y-2.5">
            <div className="flex justify-between text-base font-black uppercase tracking-wider text-black border-b-2 border-black pb-2">
              <span className="text-base font-black">Item Description</span>
              <span className="text-base font-black">Amount</span>
            </div>

            <div className="divide-y-2 divide-dashed divide-black">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-start text-lg font-mono">
                  <div className="pr-3 text-left">
                    <p className="font-black text-black leading-snug text-lg">
                      {item.menu_item_name}
                    </p>
                    {item.notes && (
                      <p className="text-xs font-black text-black mt-1.5 leading-snug bg-white p-2 rounded border-2 border-black">
                        📦 Combo includes: {item.notes}
                      </p>
                    )}
                    <p className="text-sm font-black text-black mt-1">
                      {item.quantity} &times; Rs. {item.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="font-black text-black whitespace-nowrap pt-0.5 text-lg">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 border-t-2 border-black space-y-2 text-base font-mono">
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
            <div className="pt-3.5 mt-2 border-t-2 border-dashed border-black flex justify-between items-baseline">
              <div>
                <span className="text-base font-black uppercase tracking-wider text-black block">
                  Net Amount
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-black tracking-tight">
                  Rs. {order.total.toLocaleString()}
                </span>
              </div>
            </div>

            {order.payment_method && (
              <div className="pt-2.5 border-t-2 border-dotted border-black flex justify-between text-sm items-center font-black">
                <span className="text-black font-black">Paid Via:</span>
                <span className="font-black uppercase tracking-wider text-white bg-black px-2.5 py-1 rounded">
                  {order.payment_method.replace("_", " ")}
                </span>
              </div>
            )}
          </div>

          {/* Barcode & Footer Greeting */}
          <div className="pt-5 pb-1 text-center space-y-2 border-t-2 border-dashed border-black mt-3">
            {/* Decorative Barcode Lines */}
            <div className="flex justify-center items-center space-x-[2px] h-10 py-1">
              {[3, 1, 4, 1, 2, 5, 2, 1, 3, 2, 4, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3].map((w, i) => (
                <span
                  key={i}
                  className="bg-black inline-block h-full"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <p className="text-xs font-mono font-black tracking-widest text-black uppercase">
              *{numericReceiptNo}*
            </p>

            <div className="text-sm text-black space-y-1 pt-1.5 font-black">
              <p className="font-black text-black text-base">Thank you for dining with SwiftBite!</p>
              <p className="text-xs font-black">We hope to serve you again soon &bull; Have a wonderful day</p>
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

      {/* High Quality Thermal Print Stylesheet */}
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
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
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
