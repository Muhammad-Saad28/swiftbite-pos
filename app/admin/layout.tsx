"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  BookOpen, 
  Boxes, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Menu as MenuIcon, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPOSNotifications, POSNotification } from "@/lib/pos-data";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<POSNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    getPOSNotifications().then(setNotifications);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Menu", href: "/admin/menu", icon: BookOpen },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Staff", href: "/admin/staff", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  if (loading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 h-full shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header with Logo from public/logo.png */}
        <div className="h-16 shrink-0 px-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpeg" alt="SwiftBite Logo" className="h-9 w-auto object-contain" />
            <div>
              <span className="font-extrabold tracking-tight text-white text-lg">SWIFTBITE</span>
              <span className="ml-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">POS</span>
            </div>
          </div>
          <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Badge */}
        <div className="shrink-0 p-4 mx-3 my-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
            <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Admin Control</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/25"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 border-t border-zinc-800">
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="shrink-0 h-16 px-4 sm:px-6 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-zinc-100 capitalize">
              {pathname.split("/").pop() || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Realtime Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-zinc-900 animate-ping" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-200">System Notifications</span>
                    <span className="text-[10px] font-semibold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                      {notifications.length} alerts
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                        <p className="font-medium text-zinc-200">{n.message}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(n.created_at).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/cashier/dashboard")}
              className="text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Switch to Cashier View
            </Button>
          </div>
        </header>

        {/* Sub-page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-0">{children}</main>
      </div>
    </div>
  );
}