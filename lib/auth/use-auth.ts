"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { addPOSUser } from "@/lib/pos-data";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "admin" | "waiter" | "kitchen" | "cashier" | "rider";
  status?: "pending" | "approved" | "rejected";
}

// System Registered Credentials Mapping
export const SYSTEM_USERS: { email: string; password: string; role: "admin" | "waiter" | "kitchen" | "cashier" | "rider"; name: string; id: string }[] = [
  { id: "10000000-0000-0000-0000-000000000001", email: "admin@swiftbite", password: "admin123", role: "admin", name: "Admin Manager" },
  { id: "10000000-0000-0000-0000-000000000002", email: "ali@swiftbite", password: "ali1@123", role: "waiter", name: "Ali Hassan" },
  { id: "10000000-0000-0000-0000-000000000003", email: "afaq@swiftbite", password: "afaq1@123", role: "waiter", name: "Afaq Ahmed" },
  { id: "10000000-0000-0000-0000-000000000004", email: "rehan@swiftbite", password: "rehan@123", role: "kitchen", name: "Chef Rehan" },
  { id: "10000000-0000-0000-0000-000000000005", email: "cashier@swiftbite", password: "cashier123", role: "cashier", name: "Sara Cashier" },
  { id: "45c4adc6-62aa-42ac-b081-859d94273753", email: "rider@swiftbite", password: "rider123", role: "rider", name: "Zubair Rider" },
];

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole") as "admin" | "waiter" | "kitchen" | "cashier" | "rider" | null;
      const storedEmail = localStorage.getItem("userEmail");
      const storedName = localStorage.getItem("userName");
      const storedId = localStorage.getItem("userId");
      const storedStatus = (localStorage.getItem("userStatus") || "approved") as "pending" | "approved" | "rejected";

      if (storedRole && storedEmail) {
        setUser({
          id: storedId || "u_user",
          name: storedName || "Staff Member",
          email: storedEmail,
          role: storedRole,
          status: storedStatus,
        });
      } else {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role || "waiter") as "admin" | "waiter" | "kitchen" | "cashier" | "rider";
        const email = session.user.email || "";
        const name = session.user.user_metadata?.name || email.split("@")[0] || "User";
        const id = session.user.id;
        const status = (session.user.user_metadata?.status || "approved") as "pending" | "approved" | "rejected";

        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", name);
        localStorage.setItem("userId", id);
        localStorage.setItem("userStatus", status);

        setUser({ id, name, email, role, status });
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const checkApprovalStatus = useCallback(async () => {
    if (!user?.email) return false;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("status, active")
        .eq("email", user.email)
        .single();

      if (!error && data) {
        const newStatus = data.status as "pending" | "approved" | "rejected";
        localStorage.setItem("userStatus", newStatus);
        setUser((prev) => (prev ? { ...prev, status: newStatus } : null));
        return newStatus === "approved";
      }
    } catch (e) {}
    return user.status === "approved";
  }, [user?.email, user?.status]);

  const signIn = useCallback(async (inputEmail: string, inputPassword: string, selectedRole?: "admin" | "waiter" | "kitchen" | "cashier" | "rider") => {
    setLoading(true);

    const cleanEmail = inputEmail.trim().toLowerCase();

    // 1. Try Supabase Database Users Query
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", cleanEmail)
        .single();

      if (!error && data) {
        if (data.password !== inputPassword) {
          setLoading(false);
          throw new Error("Invalid email or password");
        }
        if (data.status === "pending" || (!data.active && data.status !== "rejected")) {
          setLoading(false);
          throw new Error("Your account registration is pending admin approval. Please ask an admin to accept your request.");
        }
        if (data.status === "rejected") {
          setLoading(false);
          throw new Error("Your registration request was rejected by an administrator.");
        }

        const role = data.role as "admin" | "waiter" | "kitchen" | "cashier" | "rider";
        if (selectedRole && role !== selectedRole) {
          setLoading(false);
          throw new Error(`This account is registered as a ${role.toUpperCase()}. Please switch to the ${role.toUpperCase()} tab to sign in.`);
        }
        const name = data.name || cleanEmail;
        const id = data.id;
        const status = (data.status || "approved") as "pending" | "approved" | "rejected";

        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", cleanEmail);
        localStorage.setItem("userName", name);
        localStorage.setItem("userId", id);
        localStorage.setItem("userStatus", status);

        setUser({ id, name, email: cleanEmail, role, status });
        setLoading(false);
        return { role, status };
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("pending") || e.message.includes("rejected"))) {
        setLoading(false);
        throw e;
      }
    }

    // 2. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: inputPassword });
      if (!error && data.user) {
        const role = (data.user.user_metadata?.role || selectedRole || "waiter") as "admin" | "waiter" | "kitchen" | "cashier" | "rider";
        if (selectedRole && role !== selectedRole) {
          setLoading(false);
          throw new Error(`This account is registered as a ${role.toUpperCase()}. Please switch to the ${role.toUpperCase()} tab to sign in.`);
        }
        const name = data.user.user_metadata?.name || cleanEmail.split("@")[0];
        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", cleanEmail);
        localStorage.setItem("userName", name);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userStatus", "approved");
        setUser({ id: data.user.id, name, email: cleanEmail, role, status: "approved" });
        setLoading(false);
        return { role, status: "approved" };
      }
    } catch (e) {}

    // 3. System & Locally Registered Credentials Matching
    const allRegisteredUsers = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("swiftbite_registered_users") || "[]")
      : [];

    const localMatch = allRegisteredUsers.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    );

    if (localMatch) {
      if (selectedRole && localMatch.role !== selectedRole) {
        setLoading(false);
        throw new Error(`This account is registered as a ${localMatch.role.toUpperCase()}. Please switch to the ${localMatch.role.toUpperCase()} tab to sign in.`);
      }

      if (localMatch.status === "pending" || (!localMatch.active && localMatch.status !== "rejected")) {
        setLoading(false);
        throw new Error("Your account registration is pending admin approval. Please ask an admin to accept your request.");
      }
      if (localMatch.status === "rejected") {
        setLoading(false);
        throw new Error("Your registration request was rejected by an administrator.");
      }

      localStorage.setItem("userRole", localMatch.role);
      localStorage.setItem("userEmail", localMatch.email);
      localStorage.setItem("userName", localMatch.name);
      localStorage.setItem("userId", localMatch.id);
      localStorage.setItem("userStatus", localMatch.status);

      setUser({ id: localMatch.id, name: localMatch.name, email: localMatch.email, role: localMatch.role, status: localMatch.status });
      setLoading(false);
      return { role: localMatch.role, status: localMatch.status };
    }

    const matchedUser = SYSTEM_USERS.find(
      (u) =>
        (u.email.toLowerCase() === cleanEmail || u.email.toLowerCase() === `${cleanEmail}.com` || cleanEmail.startsWith(u.email.toLowerCase())) &&
        u.password === inputPassword
    );

    if (matchedUser) {
      if (selectedRole && matchedUser.role !== selectedRole) {
        setLoading(false);
        throw new Error(`This account is registered as a ${matchedUser.role.toUpperCase()}. Please switch to the ${matchedUser.role.toUpperCase()} tab to sign in.`);
      }

      localStorage.setItem("userRole", matchedUser.role);
      localStorage.setItem("userEmail", matchedUser.email);
      localStorage.setItem("userName", matchedUser.name);
      localStorage.setItem("userId", matchedUser.id);
      localStorage.setItem("userStatus", "approved");

      setUser({ id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, role: matchedUser.role, status: "approved" });
      setLoading(false);
      return { role: matchedUser.role, status: "approved" };
    }

    setLoading(false);
    throw new Error("Invalid email or password");
  }, []);

  const register = useCallback(async (name: string, inputEmail: string, password: string, role: "admin" | "waiter" | "kitchen" | "cashier" | "rider") => {
    setLoading(true);
    const cleanEmail = inputEmail.trim().toLowerCase();
    const isStaff = role !== "admin";
    const status = isStaff ? "pending" : "approved";
    const active = !isStaff;

    let assignedId = `u_${Date.now()}`;

    // Direct Supabase database insertion into 'users' table
    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          name,
          email: cleanEmail,
          password,
          role,
          active,
          status,
        })
        .select()
        .single();

      if (!error && data) {
        assignedId = data.id;
      }
    } catch (e) {}

    // Sync to POS user store & local storage cache
    const posUser = await addPOSUser({ name, email: cleanEmail, role, status, password });
    if (posUser?.id) assignedId = posUser.id;

    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", cleanEmail);
    localStorage.setItem("userName", name);
    localStorage.setItem("userId", assignedId);
    localStorage.setItem("userStatus", status);

    setUser({ id: assignedId, name, email: cleanEmail, role, status });
    setLoading(false);
    return { role, status, isPending: isStaff };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userStatus");
    setUser(null);
  }, []);

  return { user, loading, signIn, register, signOut, refreshUser, checkApprovalStatus };
}