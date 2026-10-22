"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface LiveTimerBadgeProps {
  startTime?: string | null;
  endTime?: string | null;
  label?: string;
  variant?: "kitchen" | "ride" | "return";
  className?: string;
}

export function LiveTimerBadge({
  startTime,
  endTime,
  label,
  variant = "kitchen",
  className = "",
}: LiveTimerBadgeProps) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!startTime) return;

    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) return;

    if (endTime) {
      const endMs = new Date(endTime).getTime();
      setElapsed(Math.max(0, Math.floor((endMs - startMs) / 1000)));
      return;
    }

    const updateTimer = () => {
      const nowMs = Date.now();
      setElapsed(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (!startTime) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isRunning = !endTime;

  let colorClasses = "bg-zinc-800 text-zinc-300 border-zinc-700";
  if (variant === "kitchen") {
    colorClasses = isRunning
      ? "bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse"
      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
  } else if (variant === "ride") {
    colorClasses = isRunning
      ? "bg-sky-500/15 text-sky-400 border-sky-500/40 animate-pulse"
      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
  } else if (variant === "return") {
    colorClasses = isRunning
      ? "bg-purple-500/15 text-purple-400 border-purple-500/40 animate-pulse"
      : "bg-zinc-800 text-zinc-400 border-zinc-700";
  }

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${colorClasses} ${className}`}
    >
      <Clock className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
      {label && <span className="font-sans font-bold text-[10px] uppercase">{label}:</span>}
      <span>{formatted}</span>
      {!isRunning && <span className="text-[10px] font-sans text-zinc-400">(Done)</span>}
    </div>
  );
}
