"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { POSOrder } from "@/lib/pos-data";
import { Printer, Download, CheckCircle2 } from "lucide-react";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt & Thermal Print">
      <div className="space-y-4">
        {/* Printable Area */}
        <div id="thermal-receipt" className="bg-white text-zinc-950 p-6 rounded-xl font-mono text-xs shadow-inner space-y-4 border border-zinc-200">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-zinc-400 pb-3">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 uppercase">SWIFTBITE POS</h2>
            <p className="text-[11px] text-zinc-600 font-sans font-semibold">Premium Fast Food & Burgers</p>
            <p className="text-[10px] text-zinc-500">Main Boulevard, DHA Phase 5, Lahore</p>
            <p className="text-[10px] text-zinc-500">Tel: +92 (42) 111-474-558</p>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-400 pb-3">
            <div className="flex justify-between">
              <span className="font-bold">Receipt #:</span>
              <span>#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Date & Time:</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Order Type:</span>
              <span className="uppercase font-bold text-orange-600">{order.order_type || "Dine-In"}</span>
            </div>
            {order.table_number && (
              <div className="flex justify-between">
                <span className="font-bold">Table #:</span>
                <span>Table {order.table_number.toString().padStart(2, "0")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-bold">Staff Server:</span>
              <span>{order.waiter_name || "Staff"}</span>
            </div>

            {order.customer_name && (
              <div className="pt-1 mt-1 border-t border-dotted border-zinc-300">
                <div className="flex justify-between">
                  <span className="font-bold">Customer:</span>
                  <span>{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex justify-between">
                    <span className="font-bold">Phone:</span>
                    <span>{order.customer_phone}</span>
                  </div>
                )}
                {order.delivery_address && (
                  <div className="text-[10px] text-zinc-600 pt-0.5">
                    <span className="font-bold">Address: </span>
                    <span>{order.delivery_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Header */}
          <div className="border-b border-zinc-400 pb-1 font-bold flex justify-between uppercase text-[10px]">
            <span>Item & Quantity</span>
            <span>Price</span>
          </div>

          {/* Items List */}
          <div className="space-y-1.5 border-b border-dashed border-zinc-400 pb-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-[11px]">
                <div className="pr-2">
                  <span className="font-bold">{item.menu_item_name}</span>
                  <span className="text-zinc-600 ml-1.5">&times; {item.quantity}</span>
                </div>
                <span className="font-bold">Rs. {item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1 text-[11px] pt-1 border-b border-dashed border-zinc-400 pb-3">
            <div className="flex justify-between text-zinc-700">
              <span>Subtotal:</span>
              <span>Rs. {order.subtotal}</span>
            </div>
            <div className="flex justify-between text-zinc-700">
              <span>GST Tax (18%):</span>
              <span>Rs. {order.tax}</span>
            </div>

            {calcDiscountValue > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount ({isPercentage ? `${discountAmount}%` : "Flat"}):</span>
                <span>- Rs. {calcDiscountValue}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-black pt-2 text-zinc-950 border-t border-zinc-950">
              <span>NET TOTAL:</span>
              <span className="text-base">Rs. {order.total}</span>
            </div>

            {order.payment_method && (
              <div className="flex justify-between text-[11px] pt-1 text-zinc-600">
                <span>Payment Method:</span>
                <span className="uppercase font-bold text-zinc-900">{order.payment_method.replace("_", " ")}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-zinc-500 space-y-0.5 pt-1">
            <p className="font-bold text-zinc-800">Thank you for dining with SwiftBite!</p>
            <p>Please visit again soon &bull; Have a great day!</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center space-x-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Thermal Receipt</span>
          </Button>
        </div>
      </div>

      {/* Print Specific CSS Styles */}
      <style jsx global>{`
        @media print {
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
            width: 80mm;
            padding: 10px;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </Modal>
  );
}
