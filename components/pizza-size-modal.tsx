"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { POSMenuItem, PizzaSizeOption, getPizzaSizes } from "@/lib/pos-data";
import { Pizza, CheckCircle, Plus } from "lucide-react";

interface PizzaSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: POSMenuItem | null;
  onSelectSize: (item: POSMenuItem, size: PizzaSizeOption) => void;
}

export function PizzaSizeModal({ isOpen, onClose, item, onSelectSize }: PizzaSizeModalProps) {
  const [selectedSize, setSelectedSize] = useState<PizzaSizeOption | null>(null);

  const sizes = item ? getPizzaSizes(item) : [];

  useEffect(() => {
    if (item && sizes.length > 0) {
      // Default to Medium or first size
      const defaultSize = sizes.find((s) => s.size === "Medium") || sizes[0];
      setSelectedSize(defaultSize);
    }
  }, [item]);

  if (!item) return null;

  const handleConfirm = () => {
    if (selectedSize && item) {
      onSelectSize(item, selectedSize);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Pizza Size">
      <div className="space-y-4">
        {/* Item Info Banner */}
        <div className="flex items-center space-x-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-500">
                <Pizza className="h-8 w-8" />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-black text-white text-base leading-tight">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{item.description}</p>
            )}
            <span className="inline-block mt-1 text-[10px] font-bold uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
              Pizza Flavor
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Choose Size ({sizes.length} Available Sizes):
          </p>
          {sizes.length === 2 && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
              Small not available
            </span>
          )}
        </div>

        {/* Pizza Sizes Grid */}
        <div className={`grid ${sizes.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"} gap-3`}>
          {sizes.map((s) => {
            const isSelected = selectedSize?.size === s.size;
            return (
              <div
                key={s.size}
                onClick={() => setSelectedSize(s)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? "bg-orange-600/15 border-orange-500 shadow-md shadow-orange-600/20"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-sm font-black ${isSelected ? "text-orange-400" : "text-white"}`}>
                      {s.label}
                    </span>
                    {s.description && (
                      <p className="text-[11px] text-zinc-400">{s.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 text-orange-400 shrink-0" />
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-baseline justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Rate</span>
                  <span className="text-base font-black font-mono text-white">
                    Rs. {s.price.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleConfirm}
            disabled={!selectedSize}
            className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>
              ADD {selectedSize?.size.toUpperCase()} TO ORDER &bull; Rs. {selectedSize?.price.toLocaleString()}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
