"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, LogOut, XCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

export function PendingApprovalScreen() {
  const router = useRouter();
  const { user, signOut, checkApprovalStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setMessage(null);
    const isApproved = await checkApprovalStatus();
    setIsChecking(false);

    if (isApproved) {
      setMessage("Your account has been approved! Unlocking dashboard...");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setMessage("Your registration is still pending admin approval. Please check back shortly.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isRejected = user?.status === "rejected";

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Background Accent Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 text-center">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
            <img src="/logo.jpeg" alt="SwiftBite POS Logo" className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">SWIFTBITE POS</h1>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
            {user?.role?.toUpperCase()} ACCESS PANEL
          </p>
        </div>

        {/* Main Status Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Icon Indicator */}
          <div className="flex justify-center">
            {isRejected ? (
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 shadow-xl">
                <XCircle className="h-12 w-12" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-xl ring-8 ring-amber-500/5">
                <Clock className="h-12 w-12 animate-pulse" />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">
              {isRejected ? "Registration Request Rejected" : "Registration Pending Approval"}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {isRejected
                ? "Your request to join as staff was rejected by an administrator. Please contact your restaurant manager."
                : `Hello ${user?.name || "Staff"}! Your ${user?.role || "staff"} account registration has been submitted. The dashboard will be accessible once an Admin accepts your registration.`}
            </p>
          </div>

          {/* Staff Info Badge */}
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-left space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Staff Name:</span>
              <span className="text-zinc-200 font-bold">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Email Address:</span>
              <span className="text-zinc-300">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
              <span className="text-zinc-500">Status:</span>
              <span
                className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                  isRejected ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {isRejected ? "REJECTED BY ADMIN" : "PENDING ADMIN ACCEPTANCE"}
              </span>
            </div>
          </div>

          {/* Dynamic Feedback Message */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                message.includes("approved")
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-zinc-800/80 text-zinc-300"
              }`}
            >
              {message.includes("approved") ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {!isRejected && (
              <Button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
                <span>{isChecking ? "Checking Approval Status..." : "Check Approval Status"}</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full h-10 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out to Login Screen</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          SwiftBite POS &bull; Production System Integration
        </p>
      </div>
    </div>
  );
}
