"use client";

import { supabase } from "@/lib/supabase/client";

export interface POSCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface POSMenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
  featured: boolean;
  category_name?: string;
}

export interface POSTable {
  id: string;
  table_number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  reserved_by?: string | null;
  reserved_phone?: string | null;
  reserved_time?: string | null;
}

export interface POSOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name?: string;
  quantity: number;
  price: number;
  notes?: string | null;
}

export interface POSOrder {
  id: string;
  order_number?: number | string;
  table_id: string | null;
  table_number?: number;
  waiter_id: string | null;
  waiter_name?: string;
  status: "draft" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed" | "rejected" | "cancelled";
  order_type: "dine_in" | "takeaway" | "delivery";
  payment_method?: "cash" | "card" | "qr_online" | "split" | null;
  subtotal: number;
  tax: number;
  discount_amount: number;
  discount_type: "percentage" | "flat" | "none";
  total: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  items?: POSOrderItem[];
  rejection_reason?: string;
}

export function formatOrderNumber(orderIdOrNumber: string | number | undefined, indexFallback: number = 1): string {
  if (!orderIdOrNumber) {
    return String(indexFallback).padStart(7, "0");
  }
  // If it's a numeric number or string of pure digits
  const str = String(orderIdOrNumber).trim();
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return String(num).padStart(7, "0");
  }
  // If it's a UUID (e.g. 545275df-8297-4d4e-bcc6-8d5f1b3ef470)
  // Extract hex digits and convert to deterministic numeric representation or use fallback
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const numericVal = (hash % 900000) + 1;
  return String(numericVal).padStart(7, "0");
}

export interface POSInventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
  updated_at: string;
  status?: "in_stock" | "low" | "critical";
}

export interface POSMenuItemIngredient {
  id: string;
  menu_item_id: string;
  inventory_id: string;
  inventory_name?: string;
  unit?: string;
  quantity_required: number;
}

export interface POSUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "waiter" | "kitchen";
  active: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface POSNotification {
  id: string;
  user_id?: string;
  type: "new_order" | "order_ready" | "order_rejected" | "low_stock" | "info";
  message: string;
  read: boolean;
  created_at: string;
}

// In-Memory Fallback Dataset
let mockTables: POSTable[] = [
  { id: "t1", table_number: 1, capacity: 2, status: "available" },
  { id: "t2", table_number: 2, capacity: 4, status: "available" },
  { id: "t3", table_number: 3, capacity: 4, status: "available" },
  { id: "t4", table_number: 4, capacity: 6, status: "available" },
  { id: "t5", table_number: 5, capacity: 2, status: "available" },
  { id: "t6", table_number: 6, capacity: 4, status: "available" },
  { id: "t7", table_number: 7, capacity: 4, status: "available" },
  { id: "t8", table_number: 8, capacity: 8, status: "available" },
  { id: "t9", table_number: 9, capacity: 4, status: "available" },
  { id: "t10", table_number: 10, capacity: 6, status: "available" },
  { id: "t11", table_number: 11, capacity: 2, status: "available" },
  { id: "t12", table_number: 12, capacity: 4, status: "available" },
];

let mockCategories: POSCategory[] = [
  { id: "c0000000-0000-0000-0000-000000000001", name: "Burgers", active: true },
  { id: "c0000000-0000-0000-0000-000000000002", name: "Pizza", active: true },
  { id: "c0000000-0000-0000-0000-000000000003", name: "Wraps", active: true },
  { id: "c0000000-0000-0000-0000-000000000004", name: "Fried Chicken", active: true },
  { id: "c0000000-0000-0000-0000-000000000005", name: "Pasta", active: true },
  { id: "c0000000-0000-0000-0000-000000000006", name: "Rice", active: true },
  { id: "c0000000-0000-0000-0000-000000000007", name: "Appetizers", active: true },
  { id: "c0000000-0000-0000-0000-000000000008", name: "Drinks", active: true },
  { id: "c0000000-0000-0000-0000-000000000009", name: "Desserts", active: true },
  { id: "c0000000-0000-0000-0000-000000000010", name: "Deals", active: true },
];

let mockMenuItems: POSMenuItem[] = [
  { id: "f0000000-0000-0000-0000-000000000001", category_id: "c0000000-0000-0000-0000-000000000001", category_name: "Burgers", name: "Classic Smash Burger", description: "Double beef patty with cheese", price: 450, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80", available: true, featured: true },
  { id: "f0000000-0000-0000-0000-000000000002", category_id: "c0000000-0000-0000-0000-000000000001", category_name: "Burgers", name: "Spicy Crispy Chicken", description: "Crispy fried chicken breast", price: 400, image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=400&q=80", available: true, featured: true },
  { id: "f0000000-0000-0000-0000-000000000003", category_id: "c0000000-0000-0000-0000-000000000002", category_name: "Pizza", name: "Pepperoni Pizza", description: "12-inch classic pepperoni", price: 1200, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80", available: true, featured: true },
  { id: "f0000000-0000-0000-0000-000000000004", category_id: "c0000000-0000-0000-0000-000000000002", category_name: "Pizza", name: "Margherita Pizza", description: "12-inch pizza with fresh tomatoes", price: 1000, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80", available: true, featured: false },
  { id: "f0000000-0000-0000-0000-000000000005", category_id: "c0000000-0000-0000-0000-000000000003", category_name: "Wraps", name: "Grilled Chicken Wrap", description: "Tortilla wrap with chicken", price: 350, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80", available: true, featured: false },
  { id: "f0000000-0000-0000-0000-000000000006", category_id: "c0000000-0000-0000-0000-000000000004", category_name: "Fried Chicken", name: "3pc Fried Chicken", description: "Crispy golden fried chicken", price: 600, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80", available: true, featured: true },
  { id: "f0000000-0000-0000-0000-000000000007", category_id: "c0000000-0000-0000-0000-000000000005", category_name: "Pasta", name: "Fettuccine Alfredo", description: "Creamy pasta with chicken", price: 750, image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80", available: true, featured: false },
  { id: "f0000000-0000-0000-0000-000000000008", category_id: "c0000000-0000-0000-0000-000000000006", category_name: "Rice", name: "Spicy Rice Bowl", description: "Rice with chicken chunks", price: 550, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80", available: true, featured: false },
  { id: "f0000000-0000-0000-0000-000000000009", category_id: "c0000000-0000-0000-0000-000000000007", category_name: "Appetizers", name: "Loaded Fries", description: "Fries topped with cheese", price: 350, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=400&q=80", available: true, featured: true },
  { id: "f0000000-0000-0000-0000-000000000010", category_id: "c0000000-0000-0000-0000-000000000008", category_name: "Drinks", name: "Cola 500ml", description: "Chilled soft drink", price: 150, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80", available: true, featured: false },
  { id: "f0000000-0000-0000-0000-000000000011", category_id: "c0000000-0000-0000-0000-000000000009", category_name: "Desserts", name: "Chocolate Brownie", description: "Warm brownie with syrup", price: 250, image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=400&q=80", available: true, featured: false },
  { id: "f0000000-0000-0000-0000-000000000012", category_id: "c0000000-0000-0000-0000-000000000010", category_name: "Deals", name: "Family Deal 1", description: "2 Burgers, 1 Pizza, 4 Drinks", price: 2500, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80", available: true, featured: true },
];

let mockOrders: POSOrder[] = [];
let mockNotifications: POSNotification[] = [];

let mockInventory: POSInventoryItem[] = [
  { id: "e0000000-0000-0000-0000-000000000001", name: "Chicken", unit: "kg", quantity: 20.0, minimum_quantity: 5.0, updated_at: new Date().toISOString(), status: "in_stock" },
  { id: "e0000000-0000-0000-0000-000000000002", name: "Beef", unit: "kg", quantity: 15.0, minimum_quantity: 3.0, updated_at: new Date().toISOString(), status: "in_stock" },
  { id: "e0000000-0000-0000-0000-000000000003", name: "Pizza Dough", unit: "pcs", quantity: 50.0, minimum_quantity: 10.0, updated_at: new Date().toISOString(), status: "in_stock" },
  { id: "e0000000-0000-0000-0000-000000000004", name: "Cheese", unit: "kg", quantity: 10.0, minimum_quantity: 2.0, updated_at: new Date().toISOString(), status: "in_stock" },
  { id: "e0000000-0000-0000-0000-000000000005", name: "Burger Buns", unit: "pcs", quantity: 100.0, minimum_quantity: 20.0, updated_at: new Date().toISOString(), status: "in_stock" },
  { id: "e0000000-0000-0000-0000-000000000006", name: "Fries", unit: "kg", quantity: 30.0, minimum_quantity: 5.0, updated_at: new Date().toISOString(), status: "in_stock" },
  { id: "e0000000-0000-0000-0000-000000000007", name: "Soft Drinks", unit: "pcs", quantity: 100.0, minimum_quantity: 24.0, updated_at: new Date().toISOString(), status: "in_stock" },
];

let mockUsers: POSUser[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Admin Manager", email: "admin@swiftbite", role: "admin", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000002", name: "Ali Hassan", email: "ali@swiftbite", role: "waiter", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000003", name: "Afaq Ahmed", email: "afaq@swiftbite", role: "waiter", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000004", name: "Chef Rehan", email: "rehan@swiftbite", role: "kitchen", active: true, status: "approved", created_at: new Date().toISOString() },
];

let mockIngredients: POSMenuItemIngredient[] = [
  { id: "ing1", menu_item_id: "f0000000-0000-0000-0000-000000000001", inventory_id: "e0000000-0000-0000-0000-000000000002", inventory_name: "Beef", unit: "kg", quantity_required: 0.20 },
  { id: "ing2", menu_item_id: "f0000000-0000-0000-0000-000000000001", inventory_id: "e0000000-0000-0000-0000-000000000005", inventory_name: "Burger Buns", unit: "pcs", quantity_required: 1.0 },
  { id: "ing3", menu_item_id: "f0000000-0000-0000-0000-000000000002", inventory_id: "e0000000-0000-0000-0000-000000000001", inventory_name: "Chicken", unit: "kg", quantity_required: 0.15 },
  { id: "ing4", menu_item_id: "f0000000-0000-0000-0000-000000000002", inventory_id: "e0000000-0000-0000-0000-000000000005", inventory_name: "Burger Buns", unit: "pcs", quantity_required: 1.0 },
  { id: "ing5", menu_item_id: "f0000000-0000-0000-0000-000000000003", inventory_id: "e0000000-0000-0000-0000-000000000003", inventory_name: "Pizza Dough", unit: "pcs", quantity_required: 1.0 },
  { id: "ing6", menu_item_id: "f0000000-0000-0000-0000-000000000003", inventory_id: "e0000000-0000-0000-0000-000000000004", inventory_name: "Cheese", unit: "kg", quantity_required: 0.20 },
  { id: "ing7", menu_item_id: "f0000000-0000-0000-0000-000000000009", inventory_id: "e0000000-0000-0000-0000-000000000006", inventory_name: "Fries", unit: "kg", quantity_required: 0.25 },
  { id: "ing8", menu_item_id: "f0000000-0000-0000-0000-000000000010", inventory_id: "e0000000-0000-0000-0000-000000000007", inventory_name: "Soft Drinks", unit: "pcs", quantity_required: 1.0 },
];

// Data Fetchers & Manipulators

export async function getPOSTables(): Promise<POSTable[]> {
  try {
    const { data, error } = await supabase.from("tables").select("*").order("table_number");
    if (!error && data && data.length > 0) return data as POSTable[];
  } catch (e) {}
  return mockTables;
}

export async function addPOSTable(tableNumber: number, capacity: number): Promise<POSTable> {
  let newTable: POSTable = {
    id: `t_${Date.now()}`,
    table_number: tableNumber,
    capacity: capacity,
    status: "available",
  };

  try {
    const { data, error } = await supabase
      .from("tables")
      .insert({
        table_number: tableNumber,
        capacity: capacity,
        status: "available",
      })
      .select()
      .single();

    if (!error && data) {
      newTable = data as POSTable;
    }
  } catch (e) {}

  mockTables.push(newTable);
  return newTable;
}

export async function deletePOSTable(tableNumber: number): Promise<boolean> {
  mockTables = mockTables.filter(t => t.table_number !== tableNumber);
  try {
    await supabase.from("tables").delete().eq("table_number", tableNumber);
  } catch (e) {}
  return true;
}

export async function reservePOSTable(
  tableNumber: number,
  reservedBy: string,
  reservedPhone: string,
  reservedTime: string
): Promise<boolean> {
  const target = mockTables.find(t => t.table_number === tableNumber);
  if (target) {
    target.status = "reserved";
    target.reserved_by = reservedBy;
    target.reserved_phone = reservedPhone;
    target.reserved_time = reservedTime;
  }
  try {
    const { error } = await supabase
      .from("tables")
      .update({
        status: "reserved",
        reserved_by: reservedBy,
        reserved_phone: reservedPhone,
        reserved_time: reservedTime,
      })
      .eq("table_number", tableNumber);
    if (!error) return true;
  } catch (e) {}
  return true;
}

export async function cancelPOSTableReservation(tableNumber: number): Promise<boolean> {
  const target = mockTables.find(t => t.table_number === tableNumber);
  if (target) {
    target.status = "available";
    target.reserved_by = null;
    target.reserved_phone = null;
    target.reserved_time = null;
  }
  try {
    const { error } = await supabase
      .from("tables")
      .update({
        status: "available",
        reserved_by: null,
        reserved_phone: null,
        reserved_time: null,
      })
      .eq("table_number", tableNumber);
    if (!error) return true;
  } catch (e) {}
  return true;
}

export async function getPOSCategories(): Promise<POSCategory[]> {
  try {
    const { data, error } = await supabase.from("categories").select("*").eq("active", true);
    if (!error && data && data.length > 0) return data as POSCategory[];
  } catch (e) {}
  return mockCategories;
}

export async function getPOSMenuItems(): Promise<POSMenuItem[]> {
  try {
    const { data, error } = await supabase.from("menu_items").select("*, categories(name)").order("name");
    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        ...item,
        category_name: item.categories?.name || "General",
      }));
    }
  } catch (e) {}
  return mockMenuItems;
}

export async function addPOSMenuItem(item: {
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
}): Promise<POSMenuItem> {
  const cat = mockCategories.find(c => c.id === item.category_id);
  let newItem: POSMenuItem = {
    id: `m_${Date.now()}`,
    category_id: item.category_id || null,
    category_name: cat?.name || "General",
    name: item.name,
    description: item.description || null,
    price: item.price,
    image: item.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
    available: true,
    featured: false,
  };

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        category_id: item.category_id || null,
        name: item.name,
        description: item.description || null,
        price: item.price,
        image: newItem.image,
        available: true,
      })
      .select("*, categories(name)")
      .single();

    if (!error && data) {
      newItem = {
        ...data,
        category_name: data.categories?.name || cat?.name || "General",
      };
    }
  } catch (e) {}

  mockMenuItems.unshift(newItem);
  return newItem;
}

export async function togglePOSMenuItemAvailability(id: string, available: boolean): Promise<boolean> {
  const found = mockMenuItems.find(m => m.id === id);
  if (found) found.available = available;
  try {
    await supabase.from("menu_items").update({ available }).eq("id", id);
  } catch (e) {}
  return true;
}

export async function deletePOSMenuItem(id: string): Promise<boolean> {
  mockMenuItems = mockMenuItems.filter(m => m.id !== id);
  try {
    await supabase.from("menu_items").delete().eq("id", id);
  } catch (e) {}
  return true;
}

export async function getPOSOrders(waiterId?: string): Promise<POSOrder[]> {
  try {
    let query = supabase
      .from("orders")
      .select("*, tables(table_number), users!orders_waiter_id_fkey(name), order_items(*, menu_items(name))")
      .order("created_at", { ascending: false });

    if (waiterId) {
      query = query.eq("waiter_id", waiterId);
    }

    const { data, error } = await query;

    if (!error && data) {
      const totalCount = data.length;
      return data.map((order: any, idx: number) => ({
        ...order,
        order_number: totalCount - idx,
        table_number: order.tables?.table_number,
        waiter_name: order.users?.name || "Staff",
        items: order.order_items?.map((item: any) => ({
          ...item,
          menu_item_name: item.menu_items?.name || "Item",
        })),
      }));
    }
  } catch (e) {}

  if (waiterId) {
    return mockOrders.filter(o => o.waiter_id === waiterId);
  }
  return mockOrders;
}

export async function createPOSOrder(order: {
  table_id?: string | null;
  table_number?: number | null;
  waiter_id: string;
  waiter_name: string;
  order_type?: "dine_in" | "takeaway" | "delivery";
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  notes?: string | null;
  items: { menu_item_id: string; menu_item_name: string; quantity: number; price: number }[];
}): Promise<POSOrder> {
  const orderType = order.order_type || "dine_in";
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;
  const nextNum = mockOrders.length + 1;
  const orderId = (1000 + nextNum).toString();

  const newOrder: POSOrder = {
    id: orderId,
    order_number: nextNum,
    table_id: order.table_id || null,
    table_number: order.table_number || undefined,
    waiter_id: order.waiter_id,
    waiter_name: order.waiter_name,
    status: "pending",
    order_type: orderType,
    subtotal,
    tax,
    discount_amount: 0,
    discount_type: "none",
    total,
    customer_name: order.customer_name || null,
    customer_phone: order.customer_phone || null,
    delivery_address: order.delivery_address || null,
    notes: order.notes || null,
    created_at: new Date().toISOString(),
    completed_at: null,
    items: order.items.map((item, idx) => ({
      id: `oi_${orderId}_${idx}`,
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  // Occupy table if Dine-In
  if (orderType === "dine_in" && order.table_number) {
    updateTableStatusInMock(order.table_number, "occupied");
    try {
      await supabase.from("tables").update({ status: "occupied" }).eq("table_number", order.table_number);
    } catch (e) {}
  }

  // Insert into Supabase
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        table_id: order.table_id && !order.table_id.startsWith("t") ? order.table_id : null,
        waiter_id: order.waiter_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.waiter_id) ? order.waiter_id : null,
        status: "pending",
        order_type: orderType,
        subtotal,
        tax,
        discount_amount: 0,
        discount_type: "none",
        total,
        customer_name: order.customer_name || null,
        customer_phone: order.customer_phone || null,
        delivery_address: order.delivery_address || null,
        notes: order.notes || null,
      })
      .select()
      .single();

    if (!error && data) {
      const insertedItems = order.items.map((item) => ({
        order_id: data.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
      }));
      await supabase.from("order_items").insert(insertedItems);
      newOrder.id = data.id;
    }
  } catch (e) {}

  mockOrders = [newOrder, ...mockOrders];
  addNotificationToMock(
    "new_order",
    `New ${orderType.toUpperCase()} Order #${newOrder.id} ${order.table_number ? `(Table ${order.table_number})` : ""}`
  );

  return newOrder;
}

export async function updatePOSOrderPaymentAndDiscount(
  orderId: string,
  paymentMethod: "cash" | "card" | "qr_online" | "split",
  discountAmount: number,
  discountType: "percentage" | "flat" | "none"
): Promise<boolean> {
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.payment_method = paymentMethod;
    target.discount_amount = discountAmount;
    target.discount_type = discountType;

    const discountVal = discountType === "percentage"
      ? Math.round(target.subtotal * (discountAmount / 100))
      : discountAmount;

    target.total = Math.max(0, (target.subtotal + target.tax) - discountVal);
  }

  try {
    const { data: orderData } = await supabase.from("orders").select("subtotal, tax").eq("id", orderId).single();
    if (orderData) {
      const subtotal = orderData.subtotal || 0;
      const tax = orderData.tax || 0;
      const discountVal = discountType === "percentage"
        ? Math.round(subtotal * (discountAmount / 100))
        : discountAmount;

      const total = Math.max(0, (subtotal + tax) - discountVal);

      await supabase
        .from("orders")
        .update({
          payment_method: paymentMethod,
          discount_amount: discountAmount,
          discount_type: discountType,
          total,
        })
        .eq("id", orderId);
    }
  } catch (e) {}

  return true;
}

export async function updatePOSOrderItems(
  orderId: string,
  newItems: { menu_item_id: string; menu_item_name: string; quantity: number; price: number }[],
  notes?: string
): Promise<boolean> {
  const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.subtotal = subtotal;
    target.tax = tax;
    target.total = total;
    if (notes !== undefined) target.notes = notes;
    target.items = newItems.map((item, idx) => ({
      id: `oi_${orderId}_${idx}`,
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      quantity: item.quantity,
      price: item.price,
    }));
  }

  try {
    // Delete existing items & insert new
    await supabase.from("order_items").delete().eq("order_id", orderId);
    const insertedItems = newItems.map((item) => ({
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
    }));
    await supabase.from("order_items").insert(insertedItems);
    await supabase.from("orders").update({ subtotal, tax, total, notes: notes || null }).eq("id", orderId);
  } catch (e) {}

  return true;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: POSOrder["status"],
  reason?: string
): Promise<boolean> {
  try {
    const payload: any = { status: newStatus };
    if (newStatus === "completed") payload.completed_at = new Date().toISOString();
    if (reason) payload.rejection_reason = reason;
    await supabase.from("orders").update(payload).eq("id", orderId);
  } catch (e) {}

  const idx = mockOrders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    mockOrders[idx] = {
      ...mockOrders[idx],
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : mockOrders[idx].completed_at,
      rejection_reason: reason || mockOrders[idx].rejection_reason,
    };

    if (newStatus === "completed" || newStatus === "cancelled" || newStatus === "rejected") {
      if (mockOrders[idx].table_number) {
        updateTableStatusInMock(mockOrders[idx].table_number!, "available");
        try {
          await supabase.from("tables").update({ status: "available" }).eq("table_number", mockOrders[idx].table_number);
        } catch (e) {}
      }
    }

    if (newStatus === "ready") {
      addNotificationToMock("order_ready", `Order #${orderId} is Ready for Pickup!`);
    } else if (newStatus === "rejected") {
      addNotificationToMock("order_rejected", `Order #${orderId} was rejected (${reason || "Unavailable"})`);
    }
    return true;
  }
  return false;
}

export async function getPOSInventory(): Promise<POSInventoryItem[]> {
  try {
    const { data, error } = await supabase.from("inventory").select("*").order("name");
    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        ...item,
        status: item.quantity <= item.minimum_quantity ? "critical" : item.quantity <= item.minimum_quantity * 2 ? "low" : "in_stock",
      }));
    }
  } catch (e) {}

  return mockInventory.map(item => ({
    ...item,
    status: item.quantity <= item.minimum_quantity ? "critical" : item.quantity <= item.minimum_quantity * 2 ? "low" : "in_stock",
  }));
}

export async function adjustPOSInventoryStock(id: string, deltaQuantity: number, reason: string): Promise<boolean> {
  const item = mockInventory.find(i => i.id === id);
  if (item) {
    item.quantity = Math.max(0, item.quantity + deltaQuantity);
    item.updated_at = new Date().toISOString();
    try {
      await supabase.from("inventory").update({ quantity: item.quantity, updated_at: item.updated_at }).eq("id", id);
    } catch (e) {}
    return true;
  }
  return false;
}

export async function addPOSInventoryItem(item: {
  name: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
}): Promise<POSInventoryItem> {
  let newItem: POSInventoryItem = {
    id: `inv_${Date.now()}`,
    name: item.name,
    unit: item.unit || "kg",
    quantity: item.quantity >= 0 ? item.quantity : 0,
    minimum_quantity: item.minimum_quantity >= 0 ? item.minimum_quantity : 0,
    updated_at: new Date().toISOString(),
    status: item.quantity <= item.minimum_quantity ? "critical" : item.quantity <= item.minimum_quantity * 2 ? "low" : "in_stock",
  };

  try {
    const { data, error } = await supabase
      .from("inventory")
      .insert({
        name: item.name,
        unit: item.unit || "kg",
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
      })
      .select()
      .single();

    if (!error && data) {
      newItem = {
        ...data,
        status: data.quantity <= data.minimum_quantity ? "critical" : data.quantity <= data.minimum_quantity * 2 ? "low" : "in_stock",
      };
    }
  } catch (e) {}

  mockInventory.push(newItem);
  return newItem;
}

export async function deletePOSInventoryItem(id: string): Promise<boolean> {
  mockInventory = mockInventory.filter(i => i.id !== id);
  try {
    await supabase.from("inventory").delete().eq("id", id);
  } catch (e) {}
  return true;
}

export async function getPOSMenuItemIngredients(menuItemId: string): Promise<POSMenuItemIngredient[]> {
  try {
    const { data, error } = await supabase
      .from("menu_item_ingredients")
      .select("*, inventory(name, unit)")
      .eq("menu_item_id", menuItemId);

    if (!error && data) {
      return data.map((item: any) => ({
        ...item,
        inventory_name: item.inventory?.name,
        unit: item.inventory?.unit,
      }));
    }
  } catch (e) {}

  return mockIngredients.filter(i => i.menu_item_id === menuItemId);
}

export async function addPOSMenuItemIngredient(
  menuItemId: string,
  inventoryId: string,
  quantityRequired: number
): Promise<boolean> {
  const inv = mockInventory.find(i => i.id === inventoryId);
  const newIng: POSMenuItemIngredient = {
    id: `ing_${Date.now()}`,
    menu_item_id: menuItemId,
    inventory_id: inventoryId,
    inventory_name: inv?.name || "Ingredient",
    unit: inv?.unit || "kg",
    quantity_required: quantityRequired,
  };
  mockIngredients.push(newIng);

  try {
    await supabase.from("menu_item_ingredients").insert({
      menu_item_id: menuItemId,
      inventory_id: inventoryId,
      quantity_required: quantityRequired,
    });
  } catch (e) {}

  return true;
}

export async function deletePOSMenuItemIngredient(ingredientId: string): Promise<boolean> {
  mockIngredients = mockIngredients.filter(i => i.id !== ingredientId);
  try {
    await supabase.from("menu_item_ingredients").delete().eq("id", ingredientId);
  } catch (e) {}
  return true;
}

export async function getPOSUsers(): Promise<POSUser[]> {
  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (!error && data && data.length > 0) return data as POSUser[];
  } catch (e) {}
  return mockUsers;
}

export async function addPOSUser(user: { name: string; email: string; role: "admin" | "waiter" | "kitchen"; status?: "pending" | "approved" | "rejected" }): Promise<POSUser> {
  const isPending = user.role === "waiter" || user.role === "kitchen";
  const userStatus = user.status || (isPending ? "pending" : "approved");
  const isActive = userStatus === "approved";
  
  let insertedUser: POSUser = {
    id: `u_${Date.now()}`,
    name: user.name,
    email: user.email,
    role: user.role,
    active: isActive,
    status: userStatus,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("users")
      .insert({ name: user.name, email: user.email, role: user.role, active: isActive, status: userStatus })
      .select()
      .single();

    if (!error && data) {
      insertedUser = data as POSUser;
    }
  } catch (e) {}

  const existingIdx = mockUsers.findIndex(u => u.email === user.email);
  if (existingIdx >= 0) mockUsers[existingIdx] = insertedUser;
  else mockUsers.push(insertedUser);

  return insertedUser;
}

export async function updatePOSUserStatus(userId: string, newStatus: "approved" | "rejected"): Promise<boolean> {
  const isActive = newStatus === "approved";
  const target = mockUsers.find(u => u.id === userId);
  if (target) {
    target.status = newStatus;
    target.active = isActive;
  }
  try {
    const { error } = await supabase
      .from("users")
      .update({ status: newStatus, active: isActive })
      .eq("id", userId);
    if (!error) return true;
  } catch (e) {}
  return true;
}

export async function getPOSNotifications(): Promise<POSNotification[]> {
  try {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (!error && data && data.length > 0) return data as POSNotification[];
  } catch (e) {}
  return mockNotifications;
}

function updateTableStatusInMock(tableNumber: number, status: "available" | "occupied" | "reserved") {
  const t = mockTables.find(table => table.table_number === tableNumber);
  if (t) t.status = status;
}

function addNotificationToMock(type: POSNotification["type"], message: string) {
  mockNotifications = [
    {
      id: `n_${Date.now()}`,
      type,
      message,
      read: false,
      created_at: new Date().toISOString(),
    },
    ...mockNotifications,
  ];
}
