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
  cancellation_requested?: boolean;
  cancellation_reason?: string;
  assigned_rider_id?: string | null;
  assigned_rider_name?: string | null;
  delivery_status?: "unassigned" | "assigned" | "picked_up" | "handover_pending" | "delivered" | "failed";
  kitchen_started_at?: string | null;
  served_at?: string | null;
  ride_started_at?: string | null;
  delivered_at?: string | null;
  return_started_at?: string | null;
  handover_completed_at?: string | null;
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
  role: "admin" | "waiter" | "kitchen" | "cashier" | "rider";
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

export type PizzaSize = "Small" | "Medium" | "Large";

export interface PizzaSizeOption {
  size: PizzaSize;
  label: string;
  price: number;
  description?: string;
}

export function isPizzaItem(item: { name?: string; category_name?: string }): boolean {
  if (!item) return false;
  const cat = (item.category_name || "").toLowerCase();
  const name = (item.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    cat.includes("pizza") ||
    name.includes("pizza") ||
    [
      "cheesecrustmalai",
      "cheeselover",
      "chickentikkadelight",
      "gardenfresh",
      "kababblast",
      "mexicanfirefajita",
      "maxicanfirefajita",
      "periperi",
      "royalcrowncrust",
      "royalmalaibooti",
      "smokykababcrust",
      "smokeykababcrust",
      "swiftspecial",
    ].includes(name)
  );
}

export function hasSmallPizzaSize(name?: string): boolean {
  if (!name) return true;
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const noSmallList = [
    "royalcrowncrust",
    "kababblast",
    "smokykababcrust",
    "smokeykababcrust",
    "swiftspecial",
    "cheesecrustmalai",
  ];
  return !noSmallList.some((p) => norm.includes(p));
}

interface PizzaPriceConfig {
  Small?: number;
  Medium: number;
  Large: number;
}

const officialPizzaMenuRates: Record<string, PizzaPriceConfig> = {
  "chickentikkadelight": { Small: 550, Medium: 1300, Large: 1600 },
  "mexicanfirefajita": { Small: 550, Medium: 1300, Large: 1600 },
  "maxicanfirefajita": { Small: 550, Medium: 1300, Large: 1600 },
  "royalmalaibooti": { Small: 650, Medium: 1350, Large: 1750 },
  "royalcrowncrust": { Medium: 1400, Large: 1850 },
  "kababblast": { Medium: 1550, Large: 1950 },
  "smokykababcrust": { Medium: 1550, Large: 1950 },
  "smokeykababcrust": { Medium: 1550, Large: 1950 },
  "cheeselover": { Small: 600, Medium: 1200, Large: 1500 },
  "periperi": { Small: 650, Medium: 1350, Large: 1750 },
  "gardenfresh": { Small: 600, Medium: 1200, Large: 1500 },
  "swiftspecial": { Medium: 1500, Large: 1850 },
  "cheesecrustmalai": { Medium: 1400, Large: 1800 },
};

export function getPizzaSizes(item: { name: string; price: number; category_name?: string }): PizzaSizeOption[] {
  const norm = (item.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const config = officialPizzaMenuRates[norm];

  if (config) {
    const list: PizzaSizeOption[] = [];
    if (config.Small) {
      list.push({ size: "Small", label: "Small", price: config.Small, description: 'Personal (7")' });
    }
    list.push({ size: "Medium", label: "Medium", price: config.Medium, description: 'Regular (10")' });
    list.push({ size: "Large", label: "Large", price: config.Large, description: 'Feast (13")' });
    return list;
  }

  // Fallback: check if item is in the no-small list
  const allowSmall = hasSmallPizzaSize(item.name || "");
  const base = item.price > 1000 ? Math.round(item.price * 0.55) : item.price;
  const sPrice = Math.round(base / 50) * 50;
  const mPrice = Math.round((base * 1.8) / 50) * 50;
  const lPrice = Math.round((base * 2.5) / 50) * 50;

  const list: PizzaSizeOption[] = [];
  if (allowSmall) {
    list.push({ size: "Small", label: "Small", price: sPrice, description: 'Personal (7")' });
  }
  list.push({ size: "Medium", label: "Medium", price: mPrice, description: 'Regular (10")' });
  list.push({ size: "Large", label: "Large", price: lPrice, description: 'Feast (13")' });
  return list;
}

// In-Memory Fallback Dataset
let mockTables: POSTable[] = [
  { id: "t1", table_number: 1, capacity: 4, status: "available" },
  { id: "t2", table_number: 2, capacity: 4, status: "available" },
  { id: "t3", table_number: 3, capacity: 4, status: "available" },
  { id: "t4", table_number: 4, capacity: 6, status: "available" },
  { id: "t5", table_number: 5, capacity: 4, status: "available" },
  { id: "t6", table_number: 6, capacity: 6, status: "available" },
];

let mockCategories: POSCategory[] = [
  {
    "id": "10000000-0000-0000-0000-000000000001",
    "name": "Burgers",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000010",
    "name": "Combo Deals",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000008",
    "name": "Fries",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000003",
    "name": "Paratha Rolls",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000007",
    "name": "Pasta",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000004",
    "name": "Pizza",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000006",
    "name": "Sandwiches",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000009",
    "name": "Sauces and Add-ons",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000002",
    "name": "Shawarma",
    "active": true
  },
  {
    "id": "10000000-0000-0000-0000-000000000005",
    "name": "Wraps",
    "active": true
  }
];

let mockMenuItems: POSMenuItem[] = [
  {
    "id": "f0000000-0000-0000-0000-000000000008",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Beef Burger",
    "description": "100% prime beef patty flame-grilled with melted cheddar and pickles.",
    "price": 600,
    "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000001e",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Cheese Crust Malai",
    "description": "Malai booti, onion, tomato, jalapeño",
    "price": 1400,
    "image": "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000001a",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Cheese Lover",
    "description": "Cheese blast",
    "price": 600,
    "image": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000001",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Chicken Burger",
    "description": "Tender chicken patty burger with fresh crisp lettuce and signature sauce.",
    "price": 300,
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000007",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Chicken Grill Burger",
    "description": "Charcoal-grilled juicy chicken breast with BBQ glaze and fresh veggies.",
    "price": 450,
    "image": "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000000f",
    "category_id": "10000000-0000-0000-0000-000000000003",
    "category_name": "Paratha Rolls",
    "name": "Chicken Paratha Roll",
    "description": "Golden crispy fried paratha rolled with seasoned grilled chicken and chutney.",
    "price": 350,
    "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000002",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Chicken Patty Burger",
    "description": "Classic chicken patty served on a toasted bun with house mayo.",
    "price": 300,
    "image": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000000a",
    "category_id": "10000000-0000-0000-0000-000000000002",
    "category_name": "Shawarma",
    "name": "Chicken Shawarma",
    "description": "Traditional slow-roasted spiced chicken wrapped in warm pita with garlic mayo.",
    "price": 300,
    "image": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000014",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Chicken Tikka Delight",
    "description": "Chicken, tomato, capsicum, onion, black olives",
    "price": 550,
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000023",
    "category_id": "10000000-0000-0000-0000-000000000007",
    "category_name": "Pasta",
    "name": "Creamy Pasta",
    "description": "Rich and velvety white sauce pasta with herbs and tender chicken chunks.",
    "price": 350,
    "image": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000024",
    "category_id": "10000000-0000-0000-0000-000000000007",
    "category_name": "Pasta",
    "name": "Crispy Crunch Pasta",
    "description": "Creamy spiced pasta topped with golden crispy fried chicken strips.",
    "price": 450,
    "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000030",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 1 — Zinger Combo",
    "description": "1 Zinger Burger + 1 Regular Fries + 1 Regular Drink",
    "price": 550,
    "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000031",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 2 — Patty Burger Combo",
    "description": "1 Chicken Patty Burger + 1 Regular Fries + 1 Regular Drink + 2 Pc Nuggets",
    "price": 550,
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000032",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 3 — Wings Combo",
    "description": "6 Pc Chicken Wings + 1 Regular Drink + 1 Dip Sauce",
    "price": 630,
    "image": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000033",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 4 — Small Pizza Deal",
    "description": "2 Small Pizzas + 1 Half-Litre Drink",
    "price": 1099,
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000034",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 5 — Medium Pizza Deal",
    "description": "2 Medium Pizzas + 1 One-Litre Drink",
    "price": 2499,
    "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000035",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 6 — Burger & Pizza Combo",
    "description": "1 Zinger Burger + 1 Small Pizza + 1 Half-Litre Drink",
    "price": 999,
    "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000036",
    "category_id": "10000000-0000-0000-0000-000000000010",
    "category_name": "Combo Deals",
    "name": "Deal 7 — Large Pizza Deal",
    "description": "2 Large Pizzas + 1 One-Litre Drink",
    "price": 3099,
    "image": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000002f",
    "category_id": "10000000-0000-0000-0000-000000000009",
    "category_name": "Sauces and Add-ons",
    "name": "Dynamite Sauce",
    "description": "Rich, spicy and creamy explosive dynamite dip.",
    "price": 70,
    "image": "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000001c",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Garden Fresh",
    "description": "Capsicum, onion, tomato, black olives",
    "price": 600,
    "image": "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000002c",
    "category_id": "10000000-0000-0000-0000-000000000009",
    "category_name": "Sauces and Add-ons",
    "name": "Garlic Mayo",
    "description": "Creamy whipped garlic mayonnaise dip.",
    "price": 70,
    "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000021",
    "category_id": "10000000-0000-0000-0000-000000000006",
    "category_name": "Sandwiches",
    "name": "Grill Sandwich",
    "description": "Golden pressed grilled sandwich with savory chicken filling and gooey melted cheese.",
    "price": 550,
    "image": "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000025",
    "category_id": "10000000-0000-0000-0000-000000000008",
    "category_name": "Fries",
    "name": "Half Fries",
    "description": "Regular portion of hot crispy golden French fries.",
    "price": 200,
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000002d",
    "category_id": "10000000-0000-0000-0000-000000000009",
    "category_name": "Sauces and Add-ons",
    "name": "Honey Mustard",
    "description": "Sweet and zesty honey mustard dressing.",
    "price": 70,
    "image": "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000018",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Kabab Blast",
    "description": "Chicken kabab, tomato, onion, jalapeño",
    "price": 1550,
    "image": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000012",
    "category_id": "10000000-0000-0000-0000-000000000003",
    "category_name": "Paratha Rolls",
    "name": "Kabab Paratha Roll",
    "description": "Juicy chicken seekh kabab wrapped in a flaky paratha with spiced yoghurt sauce.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000000e",
    "category_id": "10000000-0000-0000-0000-000000000002",
    "category_name": "Shawarma",
    "name": "Kabab Shawarma",
    "description": "Tender spiced chicken seekh kababs rolled with fresh salad and garlic toum.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000026",
    "category_id": "10000000-0000-0000-0000-000000000008",
    "category_name": "Fries",
    "name": "Large Fries",
    "description": "Large bucket of crispy salted golden French fries.",
    "price": 350,
    "image": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000002a",
    "category_id": "10000000-0000-0000-0000-000000000008",
    "category_name": "Fries",
    "name": "Loaded Fries",
    "description": "Fries loaded with cheddar cheese sauce, chicken chunks, jalapeños, and secret sauce.",
    "price": 650,
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000013",
    "category_id": "10000000-0000-0000-0000-000000000003",
    "category_name": "Paratha Rolls",
    "name": "Malai + Tikka Paratha Roll",
    "description": "Dual flavor blast combining rich malai boti and spicy red tikka in hot paratha.",
    "price": 450,
    "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000000d",
    "category_id": "10000000-0000-0000-0000-000000000002",
    "category_name": "Shawarma",
    "name": "Malai + Tikka Shawarma",
    "description": "Best of both worlds: creamy malai booti and spicy red tikka chunks in one wrap.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000011",
    "category_id": "10000000-0000-0000-0000-000000000003",
    "category_name": "Paratha Rolls",
    "name": "Malai Booti Paratha Roll",
    "description": "Melt-in-mouth creamy malai boti pieces rolled with onions and green chutney.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000000b",
    "category_id": "10000000-0000-0000-0000-000000000002",
    "category_name": "Shawarma",
    "name": "Malai Booti Shawarma",
    "description": "Creamy malai chicken tikka wrapped with onions and mild garlic sauce.",
    "price": 350,
    "image": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000028",
    "category_id": "10000000-0000-0000-0000-000000000008",
    "category_name": "Fries",
    "name": "Masala Fries",
    "description": "Crispy French fries tossed in our signature zesty chaat masala spice blend.",
    "price": 350,
    "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000029",
    "category_id": "10000000-0000-0000-0000-000000000008",
    "category_name": "Fries",
    "name": "Mayo Fries",
    "description": "Hot fries generously drizzled with garlic mayonnaise.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000015",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Mexican Fire Fajita",
    "description": "Chicken, tomato, capsicum, onion, jalapeño",
    "price": 550,
    "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000022",
    "category_id": "10000000-0000-0000-0000-000000000007",
    "category_name": "Pasta",
    "name": "Oven Bake Pasta",
    "description": "Penne pasta baked to golden perfection with mozzarella, marinara, and grilled chicken.",
    "price": 450,
    "image": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000001b",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Peri Peri",
    "description": "Peri peri sauce, chicken, onion, tomato, olives, jalapeño",
    "price": 650,
    "image": "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-00000000002e",
    "category_id": "10000000-0000-0000-0000-000000000009",
    "category_name": "Sauces and Add-ons",
    "name": "Peri Peri Sauce",
    "description": "Fiery peri-peri chili dipping sauce.",
    "price": 70,
    "image": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000004",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Philly Burger",
    "description": "Savory Philly-style burger with caramelized onions and melted cheese.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000005",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Pizza Burger",
    "description": "Fusion delight packed with pizza sauce, mozzarella cheese, herbs, and crispy patty.",
    "price": 450,
    "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000027",
    "category_id": "10000000-0000-0000-0000-000000000008",
    "category_name": "Fries",
    "name": "Plain Fries",
    "description": "Classic lightly salted crispy fries.",
    "price": 350,
    "image": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000017",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Royal Crown Crust",
    "description": "Chicken, tomato, capsicum, onion, black olives",
    "price": 1400,
    "image": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000016",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Royal Malai Booti",
    "description": "Malai booti, tomato, onion, black olives",
    "price": 650,
    "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000019",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Smoky Kabab Crust",
    "description": "Chicken kabab, onion, capsicum, tomato, black olives",
    "price": 1550,
    "image": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000001f",
    "category_id": "10000000-0000-0000-0000-000000000005",
    "category_name": "Wraps",
    "name": "Special Tortilla Wrap",
    "description": "Grilled chicken, fresh lettuce, melted cheese, and signature dressing in a toasted tortilla wrap.",
    "price": 600,
    "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000002b",
    "category_id": "10000000-0000-0000-0000-000000000009",
    "category_name": "Sauces and Add-ons",
    "name": "Sriracha Sauce",
    "description": "Spicy and tangy sriracha dipping sauce.",
    "price": 70,
    "image": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000020",
    "category_id": "10000000-0000-0000-0000-000000000006",
    "category_name": "Sandwiches",
    "name": "Swift Club Sandwich",
    "description": "Triple-decker toasted sandwich loaded with grilled chicken, egg, cheese, and crunchy veggies.",
    "price": 650,
    "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000001d",
    "category_id": "10000000-0000-0000-0000-000000000004",
    "category_name": "Pizza",
    "name": "Swift Special",
    "description": "Half malai and half tikka",
    "price": 1500,
    "image": "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000009",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Swift Special Mighty",
    "description": "Colossal double patty burger with double cheese, crispy bacon-style toppings, and secret Swift sauce.",
    "price": 700,
    "image": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000006",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Tandoori Burger",
    "description": "Smoky tandoori-spiced chicken fillet with refreshing mint mayo.",
    "price": 450,
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": false
  },
  {
    "id": "f0000000-0000-0000-0000-000000000003",
    "category_id": "10000000-0000-0000-0000-000000000001",
    "category_name": "Burgers",
    "name": "Zinger Burger",
    "description": "Crispy deep-fried spicy zinger fillet topped with crunchy lettuce and spicy mayo.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-000000000010",
    "category_id": "10000000-0000-0000-0000-000000000003",
    "category_name": "Paratha Rolls",
    "name": "Zinger Paratha Roll",
    "description": "Crispy zinger chicken fillet rolled in flaky golden paratha with special sauce.",
    "price": 400,
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  },
  {
    "id": "f0000000-0000-0000-0000-00000000000c",
    "category_id": "10000000-0000-0000-0000-000000000002",
    "category_name": "Shawarma",
    "name": "Zinger Shawarma",
    "description": "Crunchy zinger strips wrapped in soft pita with zesty sauce and pickles.",
    "price": 380,
    "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    "available": true,
    "featured": true
  }
];

let mockOrders: POSOrder[] = [];
let mockNotifications: POSNotification[] = [];

let mockInventory: POSInventoryItem[] = [
  {
    "id": "e0000000-0000-0000-0000-000000000001",
    "name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity": 15000.0,
    "minimum_quantity": 3000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000002",
    "name": "Chicken fillet raw (CHK_FILLET)",
    "unit": "g",
    "quantity": 15000.0,
    "minimum_quantity": 3000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000003",
    "name": "Chicken mince (CHK_MINCE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000004",
    "name": "Beef mince (BEEF_MINCE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000005",
    "name": "Ready-made beef patty (BEEF_PATTY)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000006",
    "name": "Ready-made chicken patty (CHK_PATTY)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000007",
    "name": "Chicken wings (WINGS)",
    "unit": "pcs",
    "quantity": 150.0,
    "minimum_quantity": 30.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000008",
    "name": "Chicken nuggets (NUGGET)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000009",
    "name": "Ready-made chicken kabab (KABAB)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000000a",
    "name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000000b",
    "name": "Sesame burger bun (SESAME_BUN)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000000c",
    "name": "Shawarma bread (SHAWARMA_BREAD)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000000d",
    "name": "Paratha (PARATHA)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000000e",
    "name": "Tortilla wrap (TORTILLA)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000000f",
    "name": "Sandwich bread (BREAD)",
    "unit": "slices",
    "quantity": 150.0,
    "minimum_quantity": 30.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000010",
    "name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity": 10000.0,
    "minimum_quantity": 2000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000011",
    "name": "Small pizza base (PIZZA_BASE_S)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000012",
    "name": "Medium pizza base (PIZZA_BASE_M)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000013",
    "name": "Large pizza base (PIZZA_BASE_L)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000014",
    "name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity": 15000.0,
    "minimum_quantity": 3000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000015",
    "name": "Cheddar cheese (CHEDDAR)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000016",
    "name": "Cheese slice (CHEESE_SLICE)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000017",
    "name": "Cream cheese / crust cheese (CREAM_CHEESE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000018",
    "name": "Cooking cream (CREAM)",
    "unit": "ml",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000019",
    "name": "Milk (MILK)",
    "unit": "ml",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000001a",
    "name": "Butter (BUTTER)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000001b",
    "name": "Egg (EGG)",
    "unit": "pcs",
    "quantity": 150.0,
    "minimum_quantity": 30.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000001c",
    "name": "Onion (ONION)",
    "unit": "g",
    "quantity": 10000.0,
    "minimum_quantity": 2000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000001d",
    "name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity": 10000.0,
    "minimum_quantity": 2000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000001e",
    "name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000001f",
    "name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000020",
    "name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000021",
    "name": "Carrot (CARROT)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000022",
    "name": "Jalapenos (JALAPENO)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000023",
    "name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000024",
    "name": "Pickled cucumber (PICKLE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000025",
    "name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity": 25000.0,
    "minimum_quantity": 5000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000026",
    "name": "Raw potatoes (POTATO_RAW)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 0.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000027",
    "name": "Flour / maida (MAIDA)",
    "unit": "g",
    "quantity": 10000.0,
    "minimum_quantity": 2000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000028",
    "name": "Cornflour (CORN_FLOUR)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000029",
    "name": "Breadcrumbs (BREADCRUMB)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000002a",
    "name": "Baking powder (BAKING_POWDER)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000002b",
    "name": "Dry pasta (DRY_PASTA)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000002c",
    "name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000002d",
    "name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000002e",
    "name": "Ketchup (KETCHUP)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000002f",
    "name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000030",
    "name": "Sriracha sauce (SRIRACHA)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000031",
    "name": "Honey mustard sauce (HONEY_MUSTARD)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000032",
    "name": "Peri peri sauce (PERI_PERI_SAUCE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000033",
    "name": "Dynamite sauce (DYNAMITE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000034",
    "name": "Chilli garlic sauce (CHILLI_GARLIC)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000035",
    "name": "Yogurt (YOGURT)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000036",
    "name": "Ginger garlic paste (GINGER_GARLIC)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 500.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000037",
    "name": "Salt (SALT)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 1000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000038",
    "name": "Black pepper (BLACK_PEPPER)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000039",
    "name": "Red chilli powder (RED_CHILLI)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000003a",
    "name": "Paprika / chilli seasoning (PAPRIKA)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000003b",
    "name": "Tikka masala (TIKKA_MASALA)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 200.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000003c",
    "name": "Malai boti marinade / seasoning (MALAI_MARINADE)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 300.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000003d",
    "name": "Fajita seasoning (FAJITA_SEASONING)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000003e",
    "name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000003f",
    "name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000040",
    "name": "Fries masala (FRIES_MASALA)",
    "unit": "g",
    "quantity": 5000.0,
    "minimum_quantity": 200.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000041",
    "name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity": 25000.0,
    "minimum_quantity": 5000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000042",
    "name": "Cooking oil (COOKING_OIL)",
    "unit": "ml",
    "quantity": 10000.0,
    "minimum_quantity": 2000.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000043",
    "name": "Regular drink can/cup (REG_DRINK)",
    "unit": "pcs",
    "quantity": 120.0,
    "minimum_quantity": 24.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000044",
    "name": "Drink bottle 500 ml (DRINK_500)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 12.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000045",
    "name": "Drink bottle 1 litre (DRINK_1L)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 12.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000046",
    "name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity": 250.0,
    "minimum_quantity": 50.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000047",
    "name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity": 250.0,
    "minimum_quantity": 50.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000048",
    "name": "Small pizza box (PACK_PIZZA_S)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000049",
    "name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000004a",
    "name": "Large pizza box (PACK_PIZZA_L)",
    "unit": "pcs",
    "quantity": 100.0,
    "minimum_quantity": 20.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000004b",
    "name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity": 250.0,
    "minimum_quantity": 50.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000004c",
    "name": "Pasta container (PACK_PASTA)",
    "unit": "pcs",
    "quantity": 150.0,
    "minimum_quantity": 30.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000004d",
    "name": "Sandwich box/wrapper (PACK_SANDWICH)",
    "unit": "pcs",
    "quantity": 150.0,
    "minimum_quantity": 30.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000004e",
    "name": "Tortilla wrap packaging (PACK_WRAP)",
    "unit": "pcs",
    "quantity": 150.0,
    "minimum_quantity": 30.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-00000000004f",
    "name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity": 500.0,
    "minimum_quantity": 100.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000050",
    "name": "Takeaway bag (BAG)",
    "unit": "pcs",
    "quantity": 250.0,
    "minimum_quantity": 50.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000051",
    "name": "Aluminium foil usage (FOIL)",
    "unit": "kg",
    "quantity": 50.0,
    "minimum_quantity": 10.0,
    "updated_at": "2026-10-22T14:00:00.000Z",
    "status": "in_stock"
  }
];

let mockUsers: POSUser[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Admin Manager", email: "admin@swiftbite", role: "admin", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000002", name: "Ali Hassan", email: "ali@swiftbite", role: "waiter", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000003", name: "Afaq Ahmed", email: "afaq@swiftbite", role: "waiter", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000004", name: "Chef Rehan", email: "rehan@swiftbite", role: "kitchen", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000005", name: "Sara Cashier", email: "cashier@swiftbite", role: "cashier", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000006", name: "Zubair Rider", email: "rider@swiftbite", role: "rider", active: true, status: "approved", created_at: new Date().toISOString() },
];

let mockIngredients: POSMenuItemIngredient[] = [
  {
    "id": "b0000000-0000-0000-0000-000000000001",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000002",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-000000000006",
    "inventory_name": "Ready-made chicken patty (CHK_PATTY)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000003",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000004",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 12.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000005",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 13.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000006",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000007",
    "menu_item_id": "f0000000-0000-0000-0000-000000000001",
    "inventory_id": "e0000000-0000-0000-0000-00000000002e",
    "inventory_name": "Ketchup (KETCHUP)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000008",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000009",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-000000000006",
    "inventory_name": "Ready-made chicken patty (CHK_PATTY)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000000a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000000b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 12.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000000c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 13.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000000d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000000e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000002",
    "inventory_id": "e0000000-0000-0000-0000-00000000002e",
    "inventory_name": "Ketchup (KETCHUP)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000000f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000010",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-000000000002",
    "inventory_name": "Chicken fillet raw (CHK_FILLET)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000011",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000012",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 7.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000013",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 8.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000014",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000015",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-000000000027",
    "inventory_name": "Flour / maida (MAIDA)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000016",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000017",
    "menu_item_id": "f0000000-0000-0000-0000-000000000003",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000018",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000019",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-000000000004",
    "inventory_name": "Beef mince (BEEF_MINCE)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000001a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000001b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000001c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000001d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000001e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000004",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000001f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000020",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-000000000006",
    "inventory_name": "Ready-made chicken patty (CHK_PATTY)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000021",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000022",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000023",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000024",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000025",
    "menu_item_id": "f0000000-0000-0000-0000-000000000005",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000026",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000027",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000028",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000029",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000002a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000002b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000002c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-00000000003b",
    "inventory_name": "Tikka masala (TIKKA_MASALA)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000002d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000006",
    "inventory_id": "e0000000-0000-0000-0000-000000000035",
    "inventory_name": "Yogurt (YOGURT)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000002e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000002f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000030",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000031",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000032",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000033",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000034",
    "menu_item_id": "f0000000-0000-0000-0000-000000000007",
    "inventory_id": "e0000000-0000-0000-0000-000000000042",
    "inventory_name": "Cooking oil (COOKING_OIL)",
    "unit": "ml",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000035",
    "menu_item_id": "f0000000-0000-0000-0000-000000000008",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000036",
    "menu_item_id": "f0000000-0000-0000-0000-000000000008",
    "inventory_id": "e0000000-0000-0000-0000-000000000005",
    "inventory_name": "Ready-made beef patty (BEEF_PATTY)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000037",
    "menu_item_id": "f0000000-0000-0000-0000-000000000008",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000038",
    "menu_item_id": "f0000000-0000-0000-0000-000000000008",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000039",
    "menu_item_id": "f0000000-0000-0000-0000-000000000008",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000003a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000008",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000003b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-00000000000b",
    "inventory_name": "Sesame burger bun (SESAME_BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000003c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-000000000006",
    "inventory_name": "Ready-made chicken patty (CHK_PATTY)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000003d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000003e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 12.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000003f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 13.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000040",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-000000000016",
    "inventory_name": "Cheese slice (CHEESE_SLICE)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000041",
    "menu_item_id": "f0000000-0000-0000-0000-000000000009",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000042",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-00000000000c",
    "inventory_name": "Shawarma bread (SHAWARMA_BREAD)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000043",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000044",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000045",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000046",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000047",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000048",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000a",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000049",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-00000000000c",
    "inventory_name": "Shawarma bread (SHAWARMA_BREAD)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000004a",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000004b",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000004c",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000004d",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000004e",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000004f",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000b",
    "inventory_id": "e0000000-0000-0000-0000-00000000003c",
    "inventory_name": "Malai boti marinade / seasoning (MALAI_MARINADE)",
    "unit": "g",
    "quantity_required": 8.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000050",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-00000000000c",
    "inventory_name": "Shawarma bread (SHAWARMA_BREAD)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000051",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-000000000002",
    "inventory_name": "Chicken fillet raw (CHK_FILLET)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000052",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000053",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000054",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000055",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000056",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000c",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000057",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-00000000000c",
    "inventory_name": "Shawarma bread (SHAWARMA_BREAD)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000058",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 60.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000059",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000005a",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000005b",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000005c",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000005d",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000d",
    "inventory_id": "e0000000-0000-0000-0000-00000000003c",
    "inventory_name": "Malai boti marinade / seasoning (MALAI_MARINADE)",
    "unit": "g",
    "quantity_required": 8.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000005e",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000e",
    "inventory_id": "e0000000-0000-0000-0000-00000000000c",
    "inventory_name": "Shawarma bread (SHAWARMA_BREAD)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000005f",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000e",
    "inventory_id": "e0000000-0000-0000-0000-000000000009",
    "inventory_name": "Ready-made chicken kabab (KABAB)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000060",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000e",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000061",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000e",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000062",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000e",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000063",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000e",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000064",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000f",
    "inventory_id": "e0000000-0000-0000-0000-00000000000d",
    "inventory_name": "Paratha (PARATHA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000065",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000f",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000066",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000f",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000067",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000f",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000068",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000f",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000069",
    "menu_item_id": "f0000000-0000-0000-0000-00000000000f",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000006a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-00000000000d",
    "inventory_name": "Paratha (PARATHA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000006b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-000000000002",
    "inventory_name": "Chicken fillet raw (CHK_FILLET)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000006c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000006d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000006e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000006f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000070",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-000000000027",
    "inventory_name": "Flour / maida (MAIDA)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000071",
    "menu_item_id": "f0000000-0000-0000-0000-000000000010",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000072",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-00000000000d",
    "inventory_name": "Paratha (PARATHA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000073",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000074",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000075",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000076",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000077",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000078",
    "menu_item_id": "f0000000-0000-0000-0000-000000000011",
    "inventory_id": "e0000000-0000-0000-0000-00000000003c",
    "inventory_name": "Malai boti marinade / seasoning (MALAI_MARINADE)",
    "unit": "g",
    "quantity_required": 8.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000079",
    "menu_item_id": "f0000000-0000-0000-0000-000000000012",
    "inventory_id": "e0000000-0000-0000-0000-00000000000d",
    "inventory_name": "Paratha (PARATHA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000007a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000012",
    "inventory_id": "e0000000-0000-0000-0000-000000000009",
    "inventory_name": "Ready-made chicken kabab (KABAB)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000007b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000012",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000007c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000012",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000007d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000012",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000007e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000012",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000007f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-00000000000d",
    "inventory_name": "Paratha (PARATHA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000080",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000081",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000082",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000083",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-00000000001f",
    "inventory_name": "Cabbage (CABBAGE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000084",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-000000000047",
    "inventory_name": "Shawarma/roll wrapper (PACK_SHAWARMA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000085",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-00000000003c",
    "inventory_name": "Malai boti marinade / seasoning (MALAI_MARINADE)",
    "unit": "g",
    "quantity_required": 8.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000086",
    "menu_item_id": "f0000000-0000-0000-0000-000000000013",
    "inventory_id": "e0000000-0000-0000-0000-00000000003b",
    "inventory_name": "Tikka masala (TIKKA_MASALA)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000087",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000088",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000089",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000008a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000008b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000008c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000008d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000008e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000008f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000090",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000091",
    "menu_item_id": "f0000000-0000-0000-0000-000000000014",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000092",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000093",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000094",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000095",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000096",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000097",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000098",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000099",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-000000000022",
    "inventory_name": "Jalapenos (JALAPENO)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000009a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000009b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000009c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000009d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000015",
    "inventory_id": "e0000000-0000-0000-0000-00000000003d",
    "inventory_name": "Fajita seasoning (FAJITA_SEASONING)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000009e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000009f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a0",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a1",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a2",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a3",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a4",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a5",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-000000000017",
    "inventory_name": "Cream cheese / crust cheese (CREAM_CHEESE)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a6",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a7",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a8",
    "menu_item_id": "f0000000-0000-0000-0000-000000000016",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000a9",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000aa",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ab",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ac",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ad",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ae",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000af",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b0",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b1",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-000000000017",
    "inventory_name": "Cream cheese / crust cheese (CREAM_CHEESE)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b2",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b3",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b4",
    "menu_item_id": "f0000000-0000-0000-0000-000000000017",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b5",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b6",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b7",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b8",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-000000000009",
    "inventory_name": "Ready-made chicken kabab (KABAB)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000b9",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ba",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000bb",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-000000000022",
    "inventory_name": "Jalapenos (JALAPENO)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000bc",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000bd",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000be",
    "menu_item_id": "f0000000-0000-0000-0000-000000000018",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000bf",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c0",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c1",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c2",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-000000000009",
    "inventory_name": "Ready-made chicken kabab (KABAB)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c3",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c4",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c5",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c6",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c7",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c8",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000c9",
    "menu_item_id": "f0000000-0000-0000-0000-000000000019",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ca",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001a",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000cb",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001a",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000cc",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001a",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 200.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000cd",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001a",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ce",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001a",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000cf",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001a",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d0",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d1",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d2",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d3",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d4",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d5",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d6",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d7",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000022",
    "inventory_name": "Jalapenos (JALAPENO)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d8",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000d9",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000da",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000db",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001b",
    "inventory_id": "e0000000-0000-0000-0000-000000000032",
    "inventory_name": "Peri peri sauce (PERI_PERI_SAUCE)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000dc",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000dd",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000de",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000df",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 40.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e0",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 40.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e1",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 40.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e2",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e3",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e4",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e5",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001c",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e6",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e7",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e8",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000e9",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 60.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ea",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-000000000017",
    "inventory_name": "Cream cheese / crust cheese (CREAM_CHEESE)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000eb",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ec",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ed",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001d",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ee",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ef",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f0",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f1",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f2",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f3",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f4",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-000000000022",
    "inventory_name": "Jalapenos (JALAPENO)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f5",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-000000000017",
    "inventory_name": "Cream cheese / crust cheese (CREAM_CHEESE)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f6",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f7",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f8",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001e",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000f9",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-00000000000e",
    "inventory_name": "Tortilla wrap (TORTILLA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000fa",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 120.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000fb",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000fc",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000fd",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000fe",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000000ff",
    "menu_item_id": "f0000000-0000-0000-0000-00000000001f",
    "inventory_id": "e0000000-0000-0000-0000-00000000004e",
    "inventory_name": "Tortilla wrap packaging (PACK_WRAP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000100",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-00000000000f",
    "inventory_name": "Sandwich bread (BREAD)",
    "unit": "slices",
    "quantity_required": 3.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000101",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000102",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000103",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-000000000016",
    "inventory_name": "Cheese slice (CHEESE_SLICE)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000104",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000105",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000106",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-00000000004d",
    "inventory_name": "Sandwich box/wrapper (PACK_SANDWICH)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000107",
    "menu_item_id": "f0000000-0000-0000-0000-000000000020",
    "inventory_id": "e0000000-0000-0000-0000-00000000001b",
    "inventory_name": "Egg (EGG)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000108",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-00000000000f",
    "inventory_name": "Sandwich bread (BREAD)",
    "unit": "slices",
    "quantity_required": 3.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000109",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000010a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000010b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000010c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000010d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-00000000004d",
    "inventory_name": "Sandwich box/wrapper (PACK_SANDWICH)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000010e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000021",
    "inventory_id": "e0000000-0000-0000-0000-00000000001a",
    "inventory_name": "Butter (BUTTER)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000010f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-00000000002b",
    "inventory_name": "Dry pasta (DRY_PASTA)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000110",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 80.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000111",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-000000000042",
    "inventory_name": "Cooking oil (COOKING_OIL)",
    "unit": "ml",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000112",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000113",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-000000000018",
    "inventory_name": "Cooking cream (CREAM)",
    "unit": "ml",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000114",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000115",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000116",
    "menu_item_id": "f0000000-0000-0000-0000-000000000022",
    "inventory_id": "e0000000-0000-0000-0000-00000000004c",
    "inventory_name": "Pasta container (PACK_PASTA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000117",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-00000000002b",
    "inventory_name": "Dry pasta (DRY_PASTA)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000118",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000119",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-000000000042",
    "inventory_name": "Cooking oil (COOKING_OIL)",
    "unit": "ml",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000011a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000011b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-000000000018",
    "inventory_name": "Cooking cream (CREAM)",
    "unit": "ml",
    "quantity_required": 80.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000011c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-00000000001a",
    "inventory_name": "Butter (BUTTER)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000011d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-000000000015",
    "inventory_name": "Cheddar cheese (CHEDDAR)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000011e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000023",
    "inventory_id": "e0000000-0000-0000-0000-00000000004c",
    "inventory_name": "Pasta container (PACK_PASTA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000011f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-00000000002b",
    "inventory_name": "Dry pasta (DRY_PASTA)",
    "unit": "g",
    "quantity_required": 100.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000120",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 80.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000121",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-000000000042",
    "inventory_name": "Cooking oil (COOKING_OIL)",
    "unit": "ml",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000122",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000123",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-000000000027",
    "inventory_name": "Flour / maida (MAIDA)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000124",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-000000000029",
    "inventory_name": "Breadcrumbs (BREADCRUMB)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000125",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000126",
    "menu_item_id": "f0000000-0000-0000-0000-000000000024",
    "inventory_id": "e0000000-0000-0000-0000-00000000004c",
    "inventory_name": "Pasta container (PACK_PASTA)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000127",
    "menu_item_id": "f0000000-0000-0000-0000-000000000025",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000128",
    "menu_item_id": "f0000000-0000-0000-0000-000000000025",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000129",
    "menu_item_id": "f0000000-0000-0000-0000-000000000025",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000012a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000025",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000012b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000026",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000012c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000026",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000012d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000026",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000012e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000026",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000012f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000027",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000130",
    "menu_item_id": "f0000000-0000-0000-0000-000000000027",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000131",
    "menu_item_id": "f0000000-0000-0000-0000-000000000027",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000132",
    "menu_item_id": "f0000000-0000-0000-0000-000000000027",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000133",
    "menu_item_id": "f0000000-0000-0000-0000-000000000028",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000134",
    "menu_item_id": "f0000000-0000-0000-0000-000000000028",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000135",
    "menu_item_id": "f0000000-0000-0000-0000-000000000028",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000136",
    "menu_item_id": "f0000000-0000-0000-0000-000000000028",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000137",
    "menu_item_id": "f0000000-0000-0000-0000-000000000028",
    "inventory_id": "e0000000-0000-0000-0000-000000000040",
    "inventory_name": "Fries masala (FRIES_MASALA)",
    "unit": "g",
    "quantity_required": 5.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000138",
    "menu_item_id": "f0000000-0000-0000-0000-000000000029",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000139",
    "menu_item_id": "f0000000-0000-0000-0000-000000000029",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000013a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000029",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000013b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000029",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000013c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000029",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000013d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000029",
    "inventory_id": "e0000000-0000-0000-0000-00000000002e",
    "inventory_name": "Ketchup (KETCHUP)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000013e",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 250.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000013f",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000140",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000141",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000142",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000143",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000144",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000145",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-00000000002e",
    "inventory_name": "Ketchup (KETCHUP)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000146",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002a",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000147",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002b",
    "inventory_id": "e0000000-0000-0000-0000-000000000030",
    "inventory_name": "Sriracha sauce (SRIRACHA)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000148",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002b",
    "inventory_id": "e0000000-0000-0000-0000-00000000004f",
    "inventory_name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000149",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002c",
    "inventory_id": "e0000000-0000-0000-0000-00000000002f",
    "inventory_name": "Garlic mayo (GARLIC_MAYO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000014a",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002c",
    "inventory_id": "e0000000-0000-0000-0000-00000000004f",
    "inventory_name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000014b",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002d",
    "inventory_id": "e0000000-0000-0000-0000-000000000031",
    "inventory_name": "Honey mustard sauce (HONEY_MUSTARD)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000014c",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002d",
    "inventory_id": "e0000000-0000-0000-0000-00000000004f",
    "inventory_name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000014d",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002e",
    "inventory_id": "e0000000-0000-0000-0000-000000000032",
    "inventory_name": "Peri peri sauce (PERI_PERI_SAUCE)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000014e",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002e",
    "inventory_id": "e0000000-0000-0000-0000-00000000004f",
    "inventory_name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000014f",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002f",
    "inventory_id": "e0000000-0000-0000-0000-000000000033",
    "inventory_name": "Dynamite sauce (DYNAMITE)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000150",
    "menu_item_id": "f0000000-0000-0000-0000-00000000002f",
    "inventory_id": "e0000000-0000-0000-0000-00000000004f",
    "inventory_name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000151",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000152",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000002",
    "inventory_name": "Chicken fillet raw (CHK_FILLET)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000153",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000154",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 7.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000155",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 8.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000156",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000157",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000027",
    "inventory_name": "Flour / maida (MAIDA)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000158",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000159",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 4.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000015a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000015b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000015c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000030",
    "inventory_id": "e0000000-0000-0000-0000-000000000043",
    "inventory_name": "Regular drink can/cup (REG_DRINK)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000015d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000015e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000006",
    "inventory_name": "Ready-made chicken patty (CHK_PATTY)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000015f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000160",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 12.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000161",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 13.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000162",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000163",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-00000000002e",
    "inventory_name": "Ketchup (KETCHUP)",
    "unit": "g",
    "quantity_required": 10.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000164",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000025",
    "inventory_name": "Frozen fries (POTATO_FRIES)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000165",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000166",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000167",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-00000000004b",
    "inventory_name": "Fries box (PACK_FRIES)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000168",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000043",
    "inventory_name": "Regular drink can/cup (REG_DRINK)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000169",
    "menu_item_id": "f0000000-0000-0000-0000-000000000031",
    "inventory_id": "e0000000-0000-0000-0000-000000000008",
    "inventory_name": "Chicken nuggets (NUGGET)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000016a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000032",
    "inventory_id": "e0000000-0000-0000-0000-000000000007",
    "inventory_name": "Chicken wings (WINGS)",
    "unit": "pcs",
    "quantity_required": 6.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000016b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000032",
    "inventory_id": "e0000000-0000-0000-0000-000000000043",
    "inventory_name": "Regular drink can/cup (REG_DRINK)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000016c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000032",
    "inventory_id": "e0000000-0000-0000-0000-00000000004f",
    "inventory_name": "Sauce cup + lid (SAUCE_CUP)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000016d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000032",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000016e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 350.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000016f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 98.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000170",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 210.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000171",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 140.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000172",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 42.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000173",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 42.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000174",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 35.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000175",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 14.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000176",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 1.4
  },
  {
    "id": "b0000000-0000-0000-0000-000000000177",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 1.4
  },
  {
    "id": "b0000000-0000-0000-0000-000000000178",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 1.4
  },
  {
    "id": "b0000000-0000-0000-0000-000000000179",
    "menu_item_id": "f0000000-0000-0000-0000-000000000033",
    "inventory_id": "e0000000-0000-0000-0000-000000000044",
    "inventory_name": "Drink bottle 500 ml (DRINK_500)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000017a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 500.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000017b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 140.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000017c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 300.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000017d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 200.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000017e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 60.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000017f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 60.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000180",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 50.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000181",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000182",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000183",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000184",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000185",
    "menu_item_id": "f0000000-0000-0000-0000-000000000034",
    "inventory_id": "e0000000-0000-0000-0000-000000000045",
    "inventory_name": "Drink bottle 1 litre (DRINK_1L)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000186",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000000a",
    "inventory_name": "Burger bun (BUN)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000187",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000002",
    "inventory_name": "Chicken fillet raw (CHK_FILLET)",
    "unit": "g",
    "quantity_required": 150.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000188",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000002d",
    "inventory_name": "Mayonnaise (MAYO)",
    "unit": "g",
    "quantity_required": 20.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000189",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000020",
    "inventory_name": "Lettuce (LETTUCE)",
    "unit": "g",
    "quantity_required": 7.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000018a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 25.5
  },
  {
    "id": "b0000000-0000-0000-0000-00000000018b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000046",
    "inventory_name": "Burger box/wrapper (PACK_BURGER)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000018c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000027",
    "inventory_name": "Flour / maida (MAIDA)",
    "unit": "g",
    "quantity_required": 25.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000018d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000041",
    "inventory_name": "Frying oil usage (FRY_OIL)",
    "unit": "ml",
    "quantity_required": 15.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000018e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000037",
    "inventory_name": "Salt (SALT)",
    "unit": "g",
    "quantity_required": 2.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000018f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 175.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000190",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 49.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000191",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 105.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000192",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 70.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000193",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 21.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000194",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 21.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000195",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 7.0
  },
  {
    "id": "b0000000-0000-0000-0000-000000000196",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 0.7
  },
  {
    "id": "b0000000-0000-0000-0000-000000000197",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 0.7
  },
  {
    "id": "b0000000-0000-0000-0000-000000000198",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 0.7
  },
  {
    "id": "b0000000-0000-0000-0000-000000000199",
    "menu_item_id": "f0000000-0000-0000-0000-000000000035",
    "inventory_id": "e0000000-0000-0000-0000-000000000044",
    "inventory_name": "Drink bottle 500 ml (DRINK_500)",
    "unit": "pcs",
    "quantity_required": 1.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000019a",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-000000000010",
    "inventory_name": "Pizza dough (PIZZA_DOUGH)",
    "unit": "g",
    "quantity_required": 750.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000019b",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-00000000002c",
    "inventory_name": "Pizza sauce (PIZZA_SAUCE)",
    "unit": "g",
    "quantity_required": 210.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000019c",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-000000000014",
    "inventory_name": "Mozzarella cheese (MOZZARELLA)",
    "unit": "g",
    "quantity_required": 450.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000019d",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-000000000001",
    "inventory_name": "Chicken boneless raw (CHK_RAW)",
    "unit": "g",
    "quantity_required": 300.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000019e",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-00000000001d",
    "inventory_name": "Tomato (TOMATO)",
    "unit": "g",
    "quantity_required": 90.0
  },
  {
    "id": "b0000000-0000-0000-0000-00000000019f",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-00000000001e",
    "inventory_name": "Capsicum (CAPSICUM)",
    "unit": "g",
    "quantity_required": 90.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000001a0",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-00000000001c",
    "inventory_name": "Onion (ONION)",
    "unit": "g",
    "quantity_required": 75.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000001a1",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-000000000023",
    "inventory_name": "Black olives (OLIVES)",
    "unit": "g",
    "quantity_required": 30.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000001a2",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-00000000003e",
    "inventory_name": "Oregano (OREGANO)",
    "unit": "g",
    "quantity_required": 3.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000001a3",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-00000000003f",
    "inventory_name": "Chilli flakes (CHILLI_FLAKES)",
    "unit": "g",
    "quantity_required": 3.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000001a4",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-000000000049",
    "inventory_name": "Medium pizza box (PACK_PIZZA_M)",
    "unit": "pcs",
    "quantity_required": 3.0
  },
  {
    "id": "b0000000-0000-0000-0000-0000000001a5",
    "menu_item_id": "f0000000-0000-0000-0000-000000000036",
    "inventory_id": "e0000000-0000-0000-0000-000000000045",
    "inventory_name": "Drink bottle 1 litre (DRINK_1L)",
    "unit": "pcs",
    "quantity_required": 1.0
  }
];

// Data Fetchers & Manipulators

export async function getPOSTables(): Promise<POSTable[]> {
  try {
    const { data, error } = await supabase.from("tables").select("*").order("table_number");
    if (!error && data && data.length > 0) {
      const valid = (data as POSTable[]).filter(t => t.table_number >= 1 && t.table_number <= 6);
      if (valid.length >= 6) return valid;
      return (data as POSTable[]).slice(0, 6);
    }
  } catch (e) {}
  return mockTables;
}

export async function updatePOSOrderTable(orderId: string, tableNumber: number): Promise<boolean> {
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.table_number = tableNumber;
    target.table_id = `t${tableNumber}`;
  }
  try {
    const { data: tableData } = await supabase.from("tables").select("id").eq("table_number", tableNumber).maybeSingle();
    if (tableData) {
      await supabase.from("orders").update({ table_id: tableData.id }).eq("id", orderId);
    }
  } catch (e) {}
  return true;
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
  let deletedIds: string[] = [];
  if (typeof window !== "undefined") {
    try {
      deletedIds = JSON.parse(localStorage.getItem("pos_deleted_menu_item_ids") || "[]");
    } catch (e) {}
  }

  try {
    const { data, error } = await supabase.from("menu_items").select("*, categories(name)").order("name");
    if (!error && data && data.length > 0) {
      return data
        .filter((item: any) => !deletedIds.includes(item.id))
        .map((item: any) => ({
          ...item,
          category_name: item.categories?.name || "General",
        }));
    }
  } catch (e) {}

  return mockMenuItems.filter(m => !deletedIds.includes(m.id));
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
  // 1. Remove from in-memory mock data
  mockMenuItems = mockMenuItems.filter(m => m.id !== id);
  mockIngredients = mockIngredients.filter(i => i.menu_item_id !== id);

  // 2. Persist deleted IDs in localStorage so mock/cached items do not reappear on refresh
  if (typeof window !== "undefined") {
    try {
      const deletedIds = JSON.parse(localStorage.getItem("pos_deleted_menu_item_ids") || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("pos_deleted_menu_item_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {}
  }

  // 3. Remove dependent ingredient relations from Supabase
  try {
    await supabase.from("menu_item_ingredients").delete().eq("menu_item_id", id);
  } catch (e) {}

  // 4. Delete the item from Supabase
  try {
    await supabase.from("menu_items").delete().eq("id", id);
  } catch (e) {}

  return true;
}


export async function startOrderKitchenTimer(orderId: string): Promise<string> {
  const now = new Date().toISOString();
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    if (!target.kitchen_started_at) target.kitchen_started_at = now;
  }
  if (typeof window !== "undefined") {
    try {
      const timers = JSON.parse(localStorage.getItem("pos_order_timers") || "{}");
      if (!timers[orderId]) timers[orderId] = {};
      if (!timers[orderId].kitchen_started_at) {
        timers[orderId].kitchen_started_at = now;
        localStorage.setItem("pos_order_timers", JSON.stringify(timers));
      }
    } catch (e) {}
  }
  return now;
}

export async function stopOrderKitchenTimer(orderId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.served_at = now;
    target.status = "served";
  }
  if (typeof window !== "undefined") {
    try {
      const timers = JSON.parse(localStorage.getItem("pos_order_timers") || "{}");
      if (!timers[orderId]) timers[orderId] = {};
      timers[orderId].served_at = now;
      localStorage.setItem("pos_order_timers", JSON.stringify(timers));
    } catch (e) {}
  }
  await updateOrderStatus(orderId, "served");
  return true;
}

export function getOrderTimers(orderId: string): {
  kitchen_started_at?: string | null;
  served_at?: string | null;
  ride_started_at?: string | null;
  delivered_at?: string | null;
  return_started_at?: string | null;
  handover_completed_at?: string | null;
} {
  if (typeof window !== "undefined") {
    try {
      const timers = JSON.parse(localStorage.getItem("pos_order_timers") || "{}");
      return timers[orderId] || {};
    } catch (e) {}
  }
  return {};
}

export async function setOrderTimer(orderId: string, field: "kitchen_started_at" | "served_at" | "ride_started_at" | "delivered_at" | "return_started_at" | "handover_completed_at"): Promise<string> {
  const now = new Date().toISOString();
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    (target as any)[field] = now;
  }
  if (typeof window !== "undefined") {
    try {
      const timers = JSON.parse(localStorage.getItem("pos_order_timers") || "{}");
      if (!timers[orderId]) timers[orderId] = {};
      timers[orderId][field] = now;
      localStorage.setItem("pos_order_timers", JSON.stringify(timers));
    } catch (e) {}
  }
  return now;
}

export async function getPOSOrders(waiterId?: string): Promise<POSOrder[]> {
  try {
    let query = supabase
      .from("orders")
      .select("*, tables(table_number), users!orders_waiter_id_fkey(name), order_items(*, menu_items(name, description))")
      .order("created_at", { ascending: false });

    if (waiterId) {
      query = query.eq("waiter_id", waiterId);
    }

    const { data, error } = await query;

    let localAssignments: Record<string, any> = {};
    let allStoredTimers: Record<string, any> = {};
    if (typeof window !== "undefined") {
      try {
        localAssignments = JSON.parse(localStorage.getItem("pos_rider_assignments") || "{}");
        allStoredTimers = JSON.parse(localStorage.getItem("pos_order_timers") || "{}");
      } catch (e) {}
    }

    if (!error && data) {
      const totalCount = data.length;
      return data.map((order: any, idx: number) => {
        const local = localAssignments[order.id];
        const localTimers = allStoredTimers[order.id] || {};
        const assignedRiderId = local?.assigned_rider_id || (order.waiter_id ? order.waiter_id : null);
        const assignedRiderName = local?.assigned_rider_name || (order.users?.name ? order.users?.name : null);
        const deliveryStatus = local?.delivery_status || (order.status === "completed" ? "delivered" : order.status === "served" ? "picked_up" : assignedRiderId ? "assigned" : "unassigned");

        return {
          ...order,
          order_number: totalCount - idx,
          table_number: order.tables?.table_number,
          waiter_name: order.users?.name || (order.order_type === "delivery" ? "Website Online" : "Staff"),
          assigned_rider_id: assignedRiderId,
          assigned_rider_name: assignedRiderName,
          delivery_status: deliveryStatus,
          items: order.order_items?.map((item: any) => {
            const rawName = item.menu_items?.name || item.notes || "Item";
            let itemName = rawName;
            const sizeNotesMatch = item.notes && (item.notes.startsWith("Size: ") || ["Small", "Medium", "Large"].includes(item.notes.trim()));
            if (sizeNotesMatch) {
              const sz = item.notes.startsWith("Size: ") ? item.notes.replace("Size: ", "").trim() : item.notes.trim();
              if (!itemName.includes(`(${sz})`)) {
                itemName = `${itemName} (${sz})`;
              }
            }
            const desc = item.menu_items?.description || null;
            const categoryName = item.menu_items?.category_name || item.menu_items?.category?.name || "";
            const isDealOrCombo =
              itemName.toLowerCase().includes("deal") ||
              itemName.toLowerCase().includes("combo") ||
              categoryName.toLowerCase().includes("deal") ||
              categoryName.toLowerCase().includes("combo");

            let dealContents: string | null = null;
            if (isDealOrCombo) {
              dealContents = desc;
              if (item.notes && item.notes.trim() !== itemName.trim() && !item.notes.toLowerCase().startsWith("deal ") && !item.notes.startsWith("Size: ")) {
                dealContents = item.notes + (desc ? " | " + desc : "");
              }
            } else {
              // Not a deal/combo: only keep custom customer note if specifically provided, otherwise null
              if (item.notes && item.notes.trim() !== itemName.trim() && !item.notes.toLowerCase().startsWith("deal ") && !item.notes.startsWith("Size: ")) {
                dealContents = item.notes;
              }
            }

            return {
              ...item,
              menu_item_name: itemName,
              notes: dealContents || null,
            };
          }),
          kitchen_started_at: localTimers.kitchen_started_at || order.kitchen_started_at || null,
          served_at: localTimers.served_at || order.served_at || null,
          ride_started_at: localTimers.ride_started_at || order.ride_started_at || null,
          delivered_at: localTimers.delivered_at || order.delivered_at || null,
          return_started_at: localTimers.return_started_at || order.return_started_at || null,
          handover_completed_at: localTimers.handover_completed_at || order.handover_completed_at || null,
        };
      });
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
  items: { menu_item_id: string; menu_item_name: string; quantity: number; price: number; notes?: string | null }[];
}): Promise<POSOrder> {
  const orderType = order.order_type || "dine_in";
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = 0;
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
      notes: item.notes || null,
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
        notes: item.notes || null,
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

      const total = Math.max(0, subtotal - discountVal);

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
  const tax = 0;
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

export const CANCELLATION_PIN = "5566";

export async function requestOrderCancellation(orderId: string, reason: string): Promise<boolean> {
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.cancellation_requested = true;
    target.cancellation_reason = reason;
  }
  try {
    await supabase.from("orders").update({
      notes: target?.notes ? target.notes + " [Cancellation Requested: " + reason + "]" : "[Cancellation Requested: " + reason + "]"
    }).eq("id", orderId);
  } catch (e) {}
  addNotificationToMock("order_rejected", "Order #" + orderId + " cancellation requested: " + reason);
  return true;
}

export async function approveOrderCancellation(orderId: string): Promise<boolean> {
  return await updateOrderStatus(orderId, "cancelled", "Cancelled with Admin Approval");
}

export async function assignOrderRider(
  orderId: string,
  riderId: string,
  riderName: string
): Promise<boolean> {
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.assigned_rider_id = riderId;
    target.assigned_rider_name = riderName;
    target.delivery_status = "assigned";
    target.status = "accepted";
  }

  if (typeof window !== "undefined") {
    try {
      const assignments = JSON.parse(localStorage.getItem("pos_rider_assignments") || "{}");
      assignments[orderId] = {
        assigned_rider_id: riderId,
        assigned_rider_name: riderName,
        delivery_status: "assigned",
      };
      localStorage.setItem("pos_rider_assignments", JSON.stringify(assignments));
    } catch (e) {}
  }

  try {
    await supabase
      .from("orders")
      .update({ waiter_id: riderId, status: "accepted" })
      .eq("id", orderId);
  } catch (e) {}

  return true;
}

export async function updateOrderDeliveryStatus(
  orderId: string,
  deliveryStatus: "unassigned" | "assigned" | "picked_up" | "handover_pending" | "delivered" | "failed"
): Promise<boolean> {
  const target = mockOrders.find(o => o.id === orderId);
  if (target) {
    target.delivery_status = deliveryStatus;
    if (deliveryStatus === "delivered") {
      target.status = "completed";
      target.completed_at = new Date().toISOString();
    } else if (deliveryStatus === "picked_up" || deliveryStatus === "handover_pending") {
      target.status = "served";
    }
  }

  if (typeof window !== "undefined") {
    try {
      const assignments = JSON.parse(localStorage.getItem("pos_rider_assignments") || "{}");
      if (assignments[orderId]) {
        assignments[orderId].delivery_status = deliveryStatus;
      } else {
        assignments[orderId] = { delivery_status: deliveryStatus };
      }
      localStorage.setItem("pos_rider_assignments", JSON.stringify(assignments));
    } catch (e) {}
  }

  try {
    const payload: any = {};
    if (deliveryStatus === "delivered") {
      payload.status = "completed";
      payload.completed_at = new Date().toISOString();
      payload.payment_method = "cash";
    } else if (deliveryStatus === "picked_up" || deliveryStatus === "handover_pending") {
      payload.status = "served";
    } else if (deliveryStatus === "failed") {
      payload.status = "cancelled";
      payload.rejection_reason = "Delivery Failed";
    }
    if (Object.keys(payload).length > 0) {
      await supabase.from("orders").update(payload).eq("id", orderId);
    }
  } catch (e) {}

  return true;
}

/** Confirm cash receipt from rider at cashier desk and officially close order */
export async function confirmRiderCashHandover(orderId: string): Promise<boolean> {
  return await updateOrderDeliveryStatus(orderId, "delivered");
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

const LOCAL_USERS_KEY = "swiftbite_registered_users";

function getStoredLocalUsers(): POSUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredLocalUser(user: POSUser) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredLocalUsers();
    const idx = existing.findIndex(u => u.email === user.email || u.id === user.id);
    if (idx >= 0) existing[idx] = user;
    else existing.unshift(user);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(existing));
  } catch (e) {}
}

export async function getPOSUsers(): Promise<POSUser[]> {
  const localUsers = getStoredLocalUsers();

  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      const dbUsers = data as POSUser[];
      // Merge DB users with any locally registered users
      const merged = [...dbUsers];
      for (const lu of localUsers) {
        if (!merged.some(u => u.email === lu.email)) {
          merged.unshift(lu);
        }
      }
      return merged;
    }
  } catch (e) {}

  // Fallback to mockUsers + localUsers
  const merged = [...mockUsers];
  for (const lu of localUsers) {
    if (!merged.some(u => u.email === lu.email)) {
      merged.unshift(lu);
    }
  }
  return merged;
}

export async function addPOSUser(user: { name: string; email: string; role: "admin" | "waiter" | "kitchen" | "cashier" | "rider"; status?: "pending" | "approved" | "rejected"; password?: string }): Promise<POSUser> {
  const isPending = user.role !== "admin";
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
    // If the DB constraint permits the role (admin/waiter/kitchen), it succeeds.
    // If it's a cashier or rider, it will attempt insert; if check constraint fails, it safely falls through to local/mock storage.
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: user.name,
        email: user.email,
        password: user.password || "password123",
        role: user.role,
        active: isActive,
        status: userStatus
      })
      .select()
      .single();

    if (!error && data) {
      insertedUser = data as POSUser;
    }
  } catch (e) {}

  // Always persist to localStorage so Admin sees it across browser sessions
  saveStoredLocalUser(insertedUser);

  const existingIdx = mockUsers.findIndex(u => u.email === user.email);
  if (existingIdx >= 0) mockUsers[existingIdx] = insertedUser;
  else mockUsers.unshift(insertedUser);

  return insertedUser;
}

export async function updatePOSUserStatus(userId: string, newStatus: "approved" | "rejected"): Promise<boolean> {
  const isActive = newStatus === "approved";
  const target = mockUsers.find(u => u.id === userId);
  if (target) {
    target.status = newStatus;
    target.active = isActive;
  }

  // Update in localStorage
  if (typeof window !== "undefined") {
    try {
      const localUsers = getStoredLocalUsers();
      const lIdx = localUsers.findIndex(u => u.id === userId);
      if (lIdx >= 0) {
        localUsers[lIdx].status = newStatus;
        localUsers[lIdx].active = isActive;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      }
    } catch (e) {}
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

