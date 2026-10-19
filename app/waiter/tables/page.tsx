"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getPOSTables, getPOSOrders, POSTable, POSOrder } from "@/lib/pos-data";
import { Users, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function WaiterTablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<POSTable[]>([]);
  const [orders, setOrders] = useState<POSOrder[]>([]);

  useEffect(() => {
    Promise.all([getPOSTables(), getPOSOrders()]).then(([t, o]) => {
      setTables(t);
      setOrders(o);
    });
  }, []);

  const handleTableClick = (t: POSTable) => {
    // Basic pop sound via base64 audio
    const popAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAIA/gD8=");
    popAudio.volume = 0.5;
    popAudio.play().catch(() => {});
    
    router.push(`/waiter/new-order?table=${t.table_number}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white tracking-tight">Floor Plan</h1>
        <p className="text-sm text-zinc-400 mt-1">Interactive 2D View &bull; Tap a physical table to manage</p>
      </motion.div>

      <div className="bg-zinc-950/50 backdrop-blur-md border-2 border-zinc-800 rounded-[3rem] p-8 sm:p-12 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Subtle grid background to look like a floor blueprint */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-wrap justify-center gap-10"
        >
          {tables.map((t) => {
            const activeOrder = orders.find(
              (o) => o.table_number === t.table_number && o.status !== "completed" && o.status !== "cancelled" && o.status !== "rejected"
            );
            
            const isCircle = t.capacity <= 2;
            const shapeClass = isCircle 
              ? "w-40 h-40 rounded-full" 
              : "w-56 h-40 rounded-[2.5rem]";

            let bgClass = "bg-zinc-900 border-zinc-700 shadow-[0_10px_30px_rgba(0,0,0,0.5)]";
            let glowClass = "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]";
            let textClass = "text-zinc-500";
            
            if (t.status === "occupied") {
              bgClass = "bg-rose-950 border-rose-500 shadow-[0_10px_30px_rgba(244,63,94,0.3)]";
              glowClass = "shadow-[0_0_30px_rgba(244,63,94,0.2)]";
              textClass = "text-rose-400";
            } else if (t.status === "reserved") {
              bgClass = "bg-sky-950 border-sky-500 shadow-[0_10px_30px_rgba(14,165,233,0.3)]";
              glowClass = "shadow-[0_0_30px_rgba(14,165,233,0.2)]";
              textClass = "text-sky-400";
            } else {
              // Available
              bgClass = "bg-zinc-900 border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.1)]";
              glowClass = "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:bg-zinc-800";
              textClass = "text-emerald-400";
            }

            return (
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                key={t.id}
                onClick={() => handleTableClick(t)}
                className={`relative group cursor-pointer border-4 flex flex-col items-center justify-center transition-colors duration-300 ${shapeClass} ${bgClass} ${glowClass}`}
              >
                {/* Seats Indicators (Decorative dots around the table) */}
                {isCircle ? (
                  <>
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full ${t.status === 'occupied' ? 'bg-rose-500' : 'bg-zinc-800'}`} />
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full ${t.status === 'occupied' ? 'bg-rose-500' : 'bg-zinc-800'}`} />
                  </>
                ) : (
                  <>
                    <div className={`absolute -top-3 left-1/4 w-12 h-3 rounded-full ${t.status === 'occupied' ? 'bg-rose-500' : 'bg-zinc-800'}`} />
                    <div className={`absolute -top-3 right-1/4 w-12 h-3 rounded-full ${t.status === 'occupied' ? 'bg-rose-500' : 'bg-zinc-800'}`} />
                    <div className={`absolute -bottom-3 left-1/4 w-12 h-3 rounded-full ${t.status === 'occupied' ? 'bg-rose-500' : 'bg-zinc-800'}`} />
                    <div className={`absolute -bottom-3 right-1/4 w-12 h-3 rounded-full ${t.status === 'occupied' ? 'bg-rose-500' : 'bg-zinc-800'}`} />
                  </>
                )}

                <span className="text-4xl font-black text-white drop-shadow-md">
                  {t.table_number.toString()}
                </span>
                
                <div className={`mt-1 font-bold text-sm tracking-wider uppercase flex items-center space-x-1 ${textClass}`}>
                  {t.status === "available" ? (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>{t.capacity} SEATS</span>
                    </>
                  ) : t.status === "reserved" ? (
                    <span>Reserved</span>
                  ) : (
                    <span>Occupied</span>
                  )}
                </div>

                {activeOrder && (
                  <div className="absolute -bottom-4 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full shadow-lg z-20">
                    <span className="text-xs font-bold text-white">Rs. {activeOrder.total}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
