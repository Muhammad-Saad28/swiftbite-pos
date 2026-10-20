"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { getPOSUsers, addPOSUser, updatePOSUserStatus, POSUser } from "@/lib/pos-data";
import { Users, UserPlus, Shield, UserCheck, CheckCircle2, XCircle, Clock, Check, X, ChefHat, AlertCircle } from "lucide-react";

export default function AdminStaffPage() {
  const [users, setUsers] = useState<POSUser[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "waiter" | "kitchen" | "cashier" | "rider">("waiter");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const refreshData = async () => {
    const fetched = await getPOSUsers();
    setUsers(fetched);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddUser = async () => {
    if (!newName || !newEmail) return;
    await addPOSUser({ name: newName, email: newEmail, role: newRole, status: "approved" });
    setIsAddModalOpen(false);
    setNewName("");
    setNewEmail("");
    await refreshData();
  };

  const handleApprove = async (userId: string) => {
    setIsProcessing(userId);
    await updatePOSUserStatus(userId, "approved");
    await refreshData();
    setIsProcessing(null);
  };

  const handleReject = async (userId: string) => {
    setIsProcessing(userId);
    await updatePOSUserStatus(userId, "rejected");
    await refreshData();
    setIsProcessing(null);
  };

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved" || (!u.status && u.active));
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  const filteredUsers =
    filter === "pending"
      ? pendingUsers
      : filter === "approved"
      ? approvedUsers
      : filter === "rejected"
      ? rejectedUsers
      : users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Staff & Registration Approval</h1>
          <p className="text-xs text-zinc-400">Manage waiter & kitchen registration requests, approve staff, and assign roles</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Approved Staff</span>
        </Button>
      </div>

      {/* Pending Banner Alert if any registration requests exist */}
      {pendingUsers.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                {pendingUsers.length} Pending Staff Registration Request{pendingUsers.length > 1 ? "s" : ""}
              </h4>
              <p className="text-xs text-amber-400/80">
                New waiter or kitchen staff registered and are waiting for your approval before signing in.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setFilter("pending")}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
          >
            Review Pending ({pendingUsers.length})
          </Button>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All Staff ({users.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
            filter === "pending"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Pending Approvals</span>
          {pendingUsers.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "approved" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Approved ({approvedUsers.length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "rejected" ? "bg-red-500/20 text-red-300 border border-red-500/40" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Rejected ({rejectedUsers.length})
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const isPending = u.status === "pending";
          const isApproved = u.status === "approved" || (!u.status && u.active);
          const isRejected = u.status === "rejected";

          return (
            <Card
              key={u.id}
              className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                isPending
                  ? "bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5"
                  : isRejected
                  ? "bg-zinc-900/50 border-zinc-800 opacity-70"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      u.role === "admin"
                        ? "bg-orange-600/20 text-orange-400"
                        : u.role === "kitchen"
                        ? "bg-purple-600/20 text-purple-400"
                        : "bg-emerald-600/20 text-emerald-400"
                    }`}
                  >
                    {u.role === "kitchen" ? <ChefHat className="h-5 w-5" /> : u.role === "admin" ? <Shield className="h-5 w-5" /> : u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{u.name}</h3>
                    <p className="text-xs text-zinc-400">{u.email}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    u.role === "admin"
                      ? "pending"
                      : u.role === "kitchen"
                      ? "preparing"
                      : "accepted"
                  }
                >
                  {u.role.toUpperCase()}
                </Badge>
              </div>

              {/* Approval Actions for Pending Users */}
              {isPending ? (
                <div className="pt-3 border-t border-amber-500/20 flex flex-col space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Pending Registration Approval</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={isProcessing === u.id}
                      onClick={() => handleApprove(u.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing === u.id}
                      onClick={() => handleReject(u.id)}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/20 font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold flex items-center space-x-1 ${
                      isApproved ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approved & Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Registration Rejected</span>
                      </>
                    )}
                  </span>

                  {isApproved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing === u.id}
                      onClick={() => handleReject(u.id)}
                      className="text-[11px] border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                    >
                      Reject
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing === u.id}
                      onClick={() => handleApprove(u.id)}
                      className="text-[11px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Re-Approve
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          No staff members found in this status.
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Directly Add Approved Staff Member">
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Tariq Mahmood"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="tariq@swiftbite.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "admin" | "waiter" | "kitchen" | "cashier" | "rider")}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="waiter">Waiter</option>
              <option value="kitchen">Kitchen Staff</option>
              <option value="cashier">Cashier</option>
              <option value="rider">Rider / Delivery Staff</option>
              <option value="admin">Admin / Manager</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddUser} className="bg-orange-600 hover:bg-orange-500 font-bold">
              Add Approved User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
