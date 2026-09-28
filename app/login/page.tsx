"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, UserCheck, ChefHat, ArrowRight, Lock, Mail, User, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"admin" | "waiter" | "kitchen">("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, register } = useAuth();

  const handleRoleChange = (newRole: "admin" | "waiter" | "kitchen") => {
    setRole(newRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "register") {
        if (!name) {
          setError("Please enter your full name");
          setIsLoading(false);
          return;
        }
        const res = await register(name, email, password, role);
        if (res.isPending) {
          setSuccess(`Registration submitted for ${name}! Account status is PENDING admin approval. An admin must accept your request before you can sign in.`);
          setPassword("");
          setIsLoading(false);
          return;
        }
        setSuccess("Account registered successfully! Redirecting...");
        setTimeout(() => {
          if (res.role === "admin") router.push("/admin/dashboard");
          else if (res.role === "kitchen") router.push("/kitchen/dashboard");
          else router.push("/waiter/dashboard");
        }, 800);
      } else {
        const res = await signIn(email, password, role);
        if (res.role === "admin") router.push("/admin/dashboard");
        else if (res.role === "kitchen") router.push("/kitchen/dashboard");
        else router.push("/waiter/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4 sm:p-6">
      {/* Subtle Background Accent Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="p-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl mb-1">
            <img src="/logo.jpeg" alt="SwiftBite POS Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">SWIFTBITE POS</h1>
          <p className="text-sm text-zinc-400">Order Management & POS System</p>
        </div>

        {/* Mode Toggle (Sign In vs Register) */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "login" ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In Existing User
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "register" ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Register Credentials
          </button>
        </div>

        {/* Role Selector Tabs (Admin / Waiter / Kitchen) */}
        <div className="grid grid-cols-3 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
              role === "admin"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ADMIN</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("waiter")}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
              role === "waiter"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>WAITER</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("kitchen")}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
              role === "kitchen"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>KITCHEN</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "register"}
                    placeholder="e.g. Ali Hassan"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter email or username"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2"
            >
              <span>
                {isLoading
                  ? "Authenticating..."
                  : mode === "register"
                  ? `Register ${role.toUpperCase()} User`
                  : `Sign In as ${role.toUpperCase()}`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600">
          SwiftBite POS &bull; Production System Integration
        </p>
      </div>
    </div>
  );
}