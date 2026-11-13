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
  is_new?: boolean;
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
  is_addition?: boolean;
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
  cost_per_unit?: number;
  updated_at: string;
  status?: "in_stock" | "low" | "critical";
}

export interface POSInventoryTransaction {
  id: string;
  inventory_id: string;
  inventory_name?: string;
  type: "add" | "remove" | "adjust";
  quantity: number;
  cost_per_unit?: number;
  reason?: string | null;
  created_at: string;
}

export interface POSProfitLossMetrics {
  period: "today" | "month";
  revenue: number;
  productionCost: number; // COGS
  grossProfit: number;
  grossProfitMargin: number; // percentage
  unsoldLoss: number;
  netProfit: number;
  netProfitMargin: number;
  soldItemsCount: number;
  addedStockValue: number;
  wasteItemsCount: number;
  itemizedBreakdown: {
    menu_item_name: string;
    quantity_sold: number;
    revenue: number;
    production_cost: number;
    profit: number;
  }[];
  lossBreakdown: {
    inventory_name: string;
    unit: string;
    added_quantity: number;
    consumed_quantity: number;
    unsold_quantity: number;
    unit_cost: number;
    loss_amount: number;
  }[];
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
  const rawName = (item.name || "").toLowerCase();
  // Exclude burgers (e.g. "Pizza Burger") so they are treated as standard items with no size selection
  if (rawName.includes("burger")) return false;

  const cat = (item.category_name || "").toLowerCase();
  const name = rawName.replace(/[^a-z0-9]/g, "");
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
    "image": "/pizza/Cheese Crust Malai.jpg",
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
    "image": "/pizza/Cheese Lover.jpg",
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
    "image": "/burgers/chickenburger.jpg",
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
    "image": "/burgers/chickengrillburger.jpg",
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
    "image": "/paratharoll/Chicken Paratha Roll.jpg",
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
    "image": "/burgers/chickenpattyburger.jpeg",
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
    "image": "/shawarma/Chicken-Shawarma.jpg",
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
    "image": "/pizza/Chicken Tikka Delight.jpg",
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
    "image": "/pasta/Creamy Pasta.jpg",
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
    "image": "/pasta/Crispy Crunch Pasta.webp",
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
    "image": "/combo deals/deal1.jpg",
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
    "image": "/combo deals/deal2.jpg",
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
    "image": "/combo deals/deal3.png",
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
    "image": "/combo deals/deal4.png",
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
    "image": "/combo deals/deal5.png",
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
    "image": "/combo deals/deal6.png",
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
    "image": "/combo deals/deal7.png",
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
    "image": "/sauce and adds on/Dynamite Sauce.jpg",
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
    "image": "/pizza/Garden Fresh.jpg",
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
    "image": "/sauce and adds on/Garlic Mayo.jpg",
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
    "image": "/sandwich/grill Sandwich.jpg",
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
    "image": "/fries/Half Fries.webp",
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
    "image": "/sauce and adds on/Honey Mustard.jpg",
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
    "image": "/pizza/Kabab Blast.jpg",
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
    "image": "/paratharoll/Kabab Paratha Roll.jpg",
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
    "image": "/shawarma/kababshawarma.jpg",
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
    "image": "/fries/large fries.jpg",
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
    "image": "/fries/loaded fries.jpg",
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
    "image": "/paratharoll/Malai + Tikka Paratha Roll.jpg",
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
    "image": "/shawarma/Malai + Tikka Shawarma.jpg",
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
    "image": "/paratharoll/Malai Booti Paratha Roll.jpg",
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
    "image": "/shawarma/Malai Booti Shawarma.jpg",
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
    "image": "/fries/Masala Fries.jpg",
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
    "image": "/fries/mayo fries.jpg",
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
    "image": "/pizza/Mexican Fire Fajita.jpg",
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
    "image": "/pasta/Oven Bake Pasta.jpg",
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
    "image": "/pizza/peri peri.jpg",
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
    "image": "/sauce and adds on/Peri Peri Sauce.jpg",
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
    "image": "/burgers/Philly Burger.jpg",
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
    "image": "/burgers/pizzaburger.jpg",
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
    "image": "/fries/plain fries.jpg",
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
    "image": "/pizza/Royal Crown Crust.jpg",
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
    "image": "/pizza/Royal Malai Booti.jpg",
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
    "image": "/pizza/Smoky Kabab Crust.jpg",
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
    "image": "/wraps/Special Tortilla Wrap.jpg",
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
    "image": "/sauce and adds on/Sriracha Sauce.jpg",
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
    "image": "/sandwich/Swift Club Sandwich.jpg",
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
    "image": "/pizza/Swift Special.jpg",
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
    "image": "/burgers/swiftmighty.jpg",
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
    "image": "/burgers/Tandoori Burger.png",
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
    "image": "/burgers/zingerburger.jpg",
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
    "image": "/paratharoll/Zinger Paratha Roll.jpg",
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
    "image": "/shawarma/Zinger Shawarma.jpg",
    "available": true,
    "featured": true
  }
];

let mockOrders: POSOrder[] = [];
let mockNotifications: POSNotification[] = [];

let mockInventory: POSInventoryItem[] = [];

let mockUsers: POSUser[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Admin Manager", email: "admin@swiftbite", role: "admin", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000002", name: "Ali Hassan", email: "ali@swiftbite", role: "waiter", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000003", name: "Afaq Ahmed", email: "afaq@swiftbite", role: "waiter", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000004", name: "Chef Rehan", email: "rehan@swiftbite", role: "kitchen", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000005", name: "Sara Cashier", email: "cashier@swiftbite", role: "cashier", active: true, status: "approved", created_at: new Date().toISOString() },
  { id: "10000000-0000-0000-0000-000000000006", name: "Zubair Rider", email: "rider@swiftbite", role: "rider", active: true, status: "approved", created_at: new Date().toISOString() },
];

let mockIngredients: POSMenuItemIngredient[] = [];

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
  const validCategoryId =
    item.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.category_id)
      ? item.category_id
      : null;

  let newItem: POSMenuItem = {
    id: `m_${Date.now()}`,
    category_id: item.category_id || null,
    category_name: cat?.name || "General",
    name: item.name,
    description: item.description || null,
    price: item.price,
    image: item.image || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    available: true,
    featured: false,
  };

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        category_id: validCategoryId,
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

  // Remove from deleted list if a previously deleted item or same ID was stored
  if (typeof window !== "undefined") {
    try {
      const deletedIds = JSON.parse(localStorage.getItem("pos_deleted_menu_item_ids") || "[]");
      const filtered = deletedIds.filter((d: string) => d !== newItem.id);
      localStorage.setItem("pos_deleted_menu_item_ids", JSON.stringify(filtered));
    } catch (e) {}
  }

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

// Kitchen Dispatched Item Tracking
// Tracks which items have already been printed / dispatched to the kitchen per order
const KITCHEN_DISPATCHED_STORAGE_KEY = "pos_kitchen_dispatched_items";

export function getDispatchedKitchenItems(orderId: string): Record<string, number> {
  if (typeof window !== "undefined") {
    try {
      const all = JSON.parse(localStorage.getItem(KITCHEN_DISPATCHED_STORAGE_KEY) || "{}");
      return all[orderId] || {};
    } catch (e) {}
  }
  return {};
}

export function markKitchenItemsDispatched(
  orderId: string,
  items: { menu_item_id: string; menu_item_name?: string; quantity: number; notes?: string | null }[]
): void {
  if (typeof window !== "undefined") {
    try {
      const all = JSON.parse(localStorage.getItem(KITCHEN_DISPATCHED_STORAGE_KEY) || "{}");
      const orderDispatched = all[orderId] || {};

      items.forEach((item) => {
        const key = `${item.menu_item_id}_${item.menu_item_name || ""}_${item.notes || ""}`;
        orderDispatched[key] = (orderDispatched[key] || 0) + item.quantity;
      });

      all[orderId] = orderDispatched;
      localStorage.setItem(KITCHEN_DISPATCHED_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }
}

export function getKitchenPendingItems(order: { id: string; items?: POSOrderItem[] }): POSOrderItem[] {
  if (!order || !order.items || order.items.length === 0) return [];
  const dispatched = getDispatchedKitchenItems(order.id);
  const hasAnyDispatched = Object.keys(dispatched).length > 0;

  // If no items have ever been dispatched/printed for this order yet, all items are pending
  if (!hasAnyDispatched) {
    return order.items;
  }

  const pending: POSOrderItem[] = [];
  order.items.forEach((item) => {
    const key = `${item.menu_item_id}_${item.menu_item_name || ""}_${item.notes || ""}`;
    const alreadySent = dispatched[key] || 0;
    const remainingQty = item.quantity - alreadySent;

    if (remainingQty > 0) {
      pending.push({
        ...item,
        quantity: remainingQty,
        is_new: true,
      });
    }
  });

  return pending;
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

        const effectiveSubtotal = order.subtotal || 0;
        const discountVal = order.discount_type === "percentage"
          ? Math.round(effectiveSubtotal * ((order.discount_amount || 0) / 100))
          : (order.discount_amount || 0);
        const effectiveTotal = Math.max(0, effectiveSubtotal - discountVal);

        return {
          ...order,
          tax: 0,
          total: effectiveTotal,
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
      // Guarantee zero sales tax in bills & database
      await supabase.from("orders").update({ tax: 0, total: subtotal }).eq("id", data.id);
      newOrder.id = data.id;
    }
  } catch (e) {}

  mockOrders = [newOrder, ...mockOrders];
  // Automatically mark the initial items as dispatched to the kitchen
  markKitchenItemsDispatched(newOrder.id, newOrder.items || []);

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

    target.tax = 0;
    target.total = Math.max(0, target.subtotal - discountVal);
  }

  try {
    const { data: orderData } = await supabase.from("orders").select("subtotal, tax").eq("id", orderId).single();
    if (orderData) {
      const subtotal = orderData.subtotal || 0;
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
          tax: 0,
          total,
        })
        .eq("id", orderId);
    }
  } catch (e) {}

  return true;
}

export async function updatePOSOrderItems(
  orderId: string,
  newItems: { menu_item_id: string; menu_item_name: string; quantity: number; price: number; notes?: string | null }[],
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
      id: `oi_${orderId}_${idx}_${Date.now()}`,
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes || null,
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
      notes: item.notes || null,
    }));
    await supabase.from("order_items").insert(insertedItems);
    await supabase.from("orders").update({ subtotal, tax, total, notes: notes || null }).eq("id", orderId);
  } catch (e) {}

  return true;
}

export async function addItemsToPOSOrder(
  orderId: string,
  additionalItems: { menu_item_id: string; menu_item_name: string; quantity: number; price: number; notes?: string | null }[],
  additionalNotes?: string
): Promise<boolean> {
  if (!additionalItems || additionalItems.length === 0) return true;

  const target = mockOrders.find(o => o.id === orderId);
  const existingItems = target?.items || [];

  // Merge items or append
  const combinedItemsMap = new Map<string, { menu_item_id: string; menu_item_name: string; quantity: number; price: number; notes?: string | null }>();
  
  existingItems.forEach(i => {
    const key = `${i.menu_item_id}_${i.menu_item_name}_${i.notes || ""}`;
    combinedItemsMap.set(key, {
      menu_item_id: i.menu_item_id,
      menu_item_name: i.menu_item_name || "Item",
      quantity: i.quantity,
      price: i.price,
      notes: i.notes || null,
    });
  });

  additionalItems.forEach(i => {
    const key = `${i.menu_item_id}_${i.menu_item_name}_${i.notes || ""}`;
    const existing = combinedItemsMap.get(key);
    if (existing) {
      existing.quantity += i.quantity;
    } else {
      combinedItemsMap.set(key, {
        menu_item_id: i.menu_item_id,
        menu_item_name: i.menu_item_name,
        quantity: i.quantity,
        price: i.price,
        notes: i.notes || null,
      });
    }
  });

  const mergedItems = Array.from(combinedItemsMap.values());
  const updatedNotes = additionalNotes
    ? target?.notes ? `${target.notes} | ${additionalNotes}` : additionalNotes
    : target?.notes || undefined;

  const result = await updatePOSOrderItems(orderId, mergedItems, updatedNotes);

  // If order was in preparing or accepted state, keep it active so kitchen sees the addition
  if (result) {
    if (target && (target.status === "ready" || target.status === "served")) {
      target.status = "preparing";
      try {
        await supabase.from("orders").update({ status: "preparing" }).eq("id", orderId);
      } catch (e) {}
    }
  }

  return result;
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
    if (!error && data) {
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
  }

  try {
    const { data } = await supabase.from("inventory").select("quantity").eq("id", id).single();
    if (data) {
      const newQty = Math.max(0, Number(data.quantity) + deltaQuantity);
      await supabase.from("inventory").update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("id", id);
      return true;
    }
    if (item) {
      await supabase.from("inventory").update({ quantity: item.quantity, updated_at: item.updated_at }).eq("id", id);
      return true;
    }
  } catch (e) {}

  return !!item;
}

export async function addPOSInventoryItem(item: {
  name: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
  cost_per_unit?: number;
}): Promise<POSInventoryItem> {
  let newItem: POSInventoryItem = {
    id: `inv_${Date.now()}`,
    name: item.name,
    unit: item.unit || "kg",
    quantity: item.quantity >= 0 ? item.quantity : 0,
    minimum_quantity: item.minimum_quantity >= 0 ? item.minimum_quantity : 0,
    cost_per_unit: item.cost_per_unit !== undefined && item.cost_per_unit >= 0 ? item.cost_per_unit : undefined,
    updated_at: new Date().toISOString(),
    status: item.quantity <= item.minimum_quantity ? "critical" : item.quantity <= item.minimum_quantity * 2 ? "low" : "in_stock",
  };

  try {
    const insertPayload: Record<string, any> = {
      name: item.name,
      unit: item.unit || "kg",
      quantity: item.quantity,
      minimum_quantity: item.minimum_quantity,
    };
    if (item.cost_per_unit !== undefined && item.cost_per_unit >= 0) {
      insertPayload.cost_per_unit = item.cost_per_unit;
    }

    const { data, error } = await supabase
      .from("inventory")
      .insert(insertPayload)
      .select()
      .single();

    if (!error && data) {
      newItem = {
        ...data,
        cost_per_unit: data.cost_per_unit ?? item.cost_per_unit,
        status: data.quantity <= data.minimum_quantity ? "critical" : data.quantity <= data.minimum_quantity * 2 ? "low" : "in_stock",
      };
    }
  } catch (e) {}

  mockInventory.push(newItem);

  // If item was created with starting quantity > 0, log an inventory transaction
  if (newItem.quantity > 0) {
    const now = new Date().toISOString();
    const unitCost = item.cost_per_unit || getInventoryCostPerUnit(newItem);
    const newTx: POSInventoryTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      inventory_id: newItem.id,
      inventory_name: newItem.name,
      type: "add",
      quantity: newItem.quantity,
      cost_per_unit: unitCost,
      reason: "Initial Stock",
      created_at: now,
    };
    const currentLocalTxs = getStoredLocalTransactions();
    currentLocalTxs.unshift(newTx);
    mockInventoryTransactions.unshift(newTx);
    saveStoredLocalTransactions(currentLocalTxs);

    try {
      const txPayload: Record<string, any> = {
        inventory_id: newItem.id,
        type: "add",
        quantity: newItem.quantity,
        reason: "Initial Stock",
      };
      if (unitCost !== undefined && unitCost > 0) {
        txPayload.cost_per_unit = unitCost;
      }
      await supabase.from("inventory_transactions").insert(txPayload);
    } catch (e) {}
  }

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

// =========================================================================
// INVENTORY TRANSACTIONS & PROFIT/LOSS ENGINE
// =========================================================================

const LOCAL_TX_KEY = "swiftbite_inventory_transactions";

// Sample baseline inventory addition transactions for realistic P&L tracking
let mockInventoryTransactions: POSInventoryTransaction[] = [];

function getStoredLocalTransactions(): POSInventoryTransaction[] {
  if (typeof window === "undefined") return mockInventoryTransactions;
  try {
    const raw = localStorage.getItem(LOCAL_TX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}
  return mockInventoryTransactions;
}

function saveStoredLocalTransactions(txs: POSInventoryTransaction[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(txs));
  } catch (e) {}
}

export function getInventoryCostPerUnit(item: POSInventoryItem | undefined): number {
  if (!item) return 20;
  if (typeof item.cost_per_unit === "number" && item.cost_per_unit > 0) {
    return item.cost_per_unit;
  }
  const n = (item.name || "").toLowerCase();
  const u = (item.unit || "").toLowerCase();

  // Pieces (pcs)
  if (u === "pcs" || u === "pc") {
    if (n.includes("bun")) return 25;
    if (n.includes("patty") || n.includes("kabab")) return 85;
    if (n.includes("wings")) return 40;
    if (n.includes("nugget")) return 22;
    if (n.includes("box") || n.includes("wrapper") || n.includes("pack")) return 8;
    if (n.includes("dough") || n.includes("wrap")) return 50;
    if (n.includes("drink") || n.includes("cola") || n.includes("beverage")) return 65;
    if (n.includes("brownie") || n.includes("dessert")) return 110;
    return 30;
  }

  // Grams (g)
  if (u === "g") {
    if (n.includes("beef")) return 0.90; // Rs. 900/kg
    if (n.includes("chicken")) return 0.75; // Rs. 750/kg
    if (n.includes("cheese")) return 1.30; // Rs. 1,300/kg
    if (n.includes("mayo") || n.includes("ketchup") || n.includes("sauce")) return 0.35;
    if (n.includes("fries") || n.includes("potato")) return 0.35;
    if (n.includes("lettuce") || n.includes("onion") || n.includes("veg") || n.includes("tomato") || n.includes("jalapeno")) return 0.20;
    return 0.50;
  }

  // Kilograms (kg)
  if (u === "kg") {
    if (n.includes("beef")) return 900;
    if (n.includes("chicken")) return 750;
    if (n.includes("cheese")) return 1300;
    if (n.includes("fries")) return 350;
    if (n.includes("sauce") || n.includes("mayo")) return 350;
    return 450;
  }

  // Liquid (ml / liters)
  if (u === "ml") return 0.45;
  if (u === "l" || u === "litre" || u === "liter") return 450;

  return 25;
}

/** Compute recipe-based production cost for a single menu item */
export function getMenuItemProductionCost(
  menuItemId: string,
  priceFallback: number = 400,
  notesOrSize?: string
): number {
  const ingredients = mockIngredients.filter((i) => i.menu_item_id === menuItemId);
  if (ingredients.length > 0) {
    let totalCost = 0;
    for (const ing of ingredients) {
      const inv = mockInventory.find((i) => i.id === ing.inventory_id);
      const unitCost = getInventoryCostPerUnit(inv);
      totalCost += (ing.quantity_required || 0) * unitCost;
    }
    // Scale if pizza sizes are present
    const noteLow = (notesOrSize || "").toLowerCase();
    if (noteLow.includes("large")) {
      totalCost *= 2.2;
    } else if (noteLow.includes("medium")) {
      totalCost *= 1.6;
    }
    return Math.round(totalCost);
  }

  // Industry standard fallback: 38% - 40% production cost of selling price
  return Math.round((priceFallback || 400) * 0.40);
}

/** Update unit cost of an inventory item */
export async function updatePOSInventoryItemCost(id: string, costPerUnit: number): Promise<boolean> {
  const item = mockInventory.find((i) => i.id === id);
  if (item) {
    item.cost_per_unit = costPerUnit;
    item.updated_at = new Date().toISOString();
  }
  try {
    const { error } = await supabase
      .from("inventory")
      .update({ cost_per_unit: costPerUnit, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) return true;
  } catch (e) {}
  return !!item;
}

/** Fetch all inventory transactions */
export async function getPOSInventoryTransactions(): Promise<POSInventoryTransaction[]> {
  try {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("*, inventory(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        inventory_id: d.inventory_id,
        inventory_name: d.inventory?.name,
        type: d.type,
        quantity: Number(d.quantity) || 0,
        cost_per_unit: Number(d.cost_per_unit) || 0,
        reason: d.reason,
        created_at: d.created_at,
      }));
    }
  } catch (e) {}

  return getStoredLocalTransactions();
}

/** Add a batch of inventory items from Excel, CSV, or Quick Text Ingestion */
export async function addDailyInventoryBatch(
  entries: {
    inventory_id?: string;
    name: string;
    quantity: number;
    unit?: string;
    cost_per_unit?: number;
  }[],
  sourceNote: string = "Daily Stock Entry"
): Promise<{ addedCount: number; totalValue: number }> {
  let addedCount = 0;
  let totalValue = 0;
  const currentLocalTxs = getStoredLocalTransactions();
  const now = new Date().toISOString();

  for (const entry of entries) {
    if (!entry.name || entry.quantity <= 0) continue;

    // Try matching existing inventory item by ID or normalized name
    let invItem = entry.inventory_id
      ? mockInventory.find((i) => i.id === entry.inventory_id)
      : undefined;

    if (!invItem) {
      const cleanNorm = entry.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      invItem = mockInventory.find((i) => {
        const itemNorm = i.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return itemNorm.includes(cleanNorm) || cleanNorm.includes(itemNorm);
      });
    }

    const unitCost = entry.cost_per_unit !== undefined && entry.cost_per_unit > 0
      ? entry.cost_per_unit
      : getInventoryCostPerUnit(invItem);

    if (invItem) {
      invItem.quantity += entry.quantity;
      if (entry.cost_per_unit !== undefined && entry.cost_per_unit > 0) {
        invItem.cost_per_unit = entry.cost_per_unit;
      }
      invItem.updated_at = now;
      invItem.status =
        invItem.quantity <= invItem.minimum_quantity
          ? "critical"
          : invItem.quantity <= invItem.minimum_quantity * 2
          ? "low"
          : "in_stock";

      try {
        await supabase
          .from("inventory")
          .update({
            quantity: invItem.quantity,
            cost_per_unit: invItem.cost_per_unit,
            updated_at: now,
          })
          .eq("id", invItem.id);
      } catch (e) {}
    } else {
      // Create new inventory item
      const newItem: POSInventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: entry.name,
        unit: entry.unit || "pcs",
        quantity: entry.quantity,
        minimum_quantity: Math.max(5, Math.round(entry.quantity * 0.2)),
        cost_per_unit: unitCost,
        updated_at: now,
        status: "in_stock",
      };
      mockInventory.push(newItem);
      invItem = newItem;

      try {
        const { data: createdDbItem } = await supabase
          .from("inventory")
          .insert({
            name: newItem.name,
            unit: newItem.unit,
            quantity: newItem.quantity,
            minimum_quantity: newItem.minimum_quantity,
            cost_per_unit: newItem.cost_per_unit,
          })
          .select()
          .single();

        if (createdDbItem && createdDbItem.id) {
          invItem.id = createdDbItem.id;
          newItem.id = createdDbItem.id;
        }
      } catch (e) {}
    }

    // Log addition transaction
    const newTx: POSInventoryTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      inventory_id: invItem.id,
      inventory_name: invItem.name,
      type: "add",
      quantity: entry.quantity,
      cost_per_unit: unitCost,
      reason: sourceNote,
      created_at: now,
    };
    currentLocalTxs.unshift(newTx);
    mockInventoryTransactions.unshift(newTx);

    try {
      const txPayload: Record<string, any> = {
        inventory_id: invItem.id,
        type: newTx.type,
        quantity: newTx.quantity,
        reason: newTx.reason,
      };
      if (unitCost !== undefined && unitCost > 0) {
        txPayload.cost_per_unit = unitCost;
      }
      await supabase.from("inventory_transactions").insert(txPayload);
    } catch (e) {}

    addedCount++;
    totalValue += entry.quantity * unitCost;
  }

  saveStoredLocalTransactions(currentLocalTxs);
  return { addedCount, totalValue: Math.round(totalValue) };
}

/** Calculate comprehensive Profit & Loss Metrics for either "today" or a specific month/year */
export async function getPOSProfitAndLossMetrics(
  period: "today" | "month" = "month",
  targetMonth?: number,
  targetYear?: number
): Promise<POSProfitLossMetrics> {
  const [allOrders, allTxs, allInventory] = await Promise.all([
    getPOSOrders(),
    getPOSInventoryTransactions(),
    getPOSInventory(),
  ]);

  const now = new Date();
  const currentYear = targetYear !== undefined ? targetYear : now.getFullYear();
  const currentMonth = targetMonth !== undefined ? targetMonth : now.getMonth();
  const todayStr = now.toISOString().split("T")[0];

  // 1. Filter valid fulfilled/served orders for period
  const eligibleOrders = allOrders.filter((o) => {
    if (o.status !== "completed" && o.status !== "served") return false;
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    if (isNaN(d.getTime())) return false;

    if (period === "today") {
      return o.created_at.startsWith(todayStr);
    }
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Calculate gross revenue & production cost from sold items
  let totalRevenue = 0;
  let totalProductionCost = 0;
  let soldItemsCount = 0;
  const itemizedMap = new Map<
    string,
    { name: string; quantity: number; revenue: number; cost: number }
  >();
  const consumedInventoryMap = new Map<string, number>();

  for (const order of eligibleOrders) {
    totalRevenue += order.total || 0;
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const lineRev = price * qty;
        soldItemsCount += qty;

        const unitCost = getMenuItemProductionCost(item.menu_item_id, price, item.notes || "");
        const lineCost = unitCost * qty;
        totalProductionCost += lineCost;

        // Track itemized profit
        const itemKey = item.menu_item_name || item.menu_item_id;
        const existing = itemizedMap.get(itemKey) || {
          name: itemKey,
          quantity: 0,
          revenue: 0,
          cost: 0,
        };
        existing.quantity += qty;
        existing.revenue += lineRev;
        existing.cost += lineCost;
        itemizedMap.set(itemKey, existing);

        // Track consumed recipe ingredients
        const ings = mockIngredients.filter((i) => i.menu_item_id === item.menu_item_id);
        for (const ing of ings) {
          const cQty = (ing.quantity_required || 0) * qty;
          const curr = consumedInventoryMap.get(ing.inventory_id) || 0;
          consumedInventoryMap.set(ing.inventory_id, curr + cQty);
        }
      }
    }
  }

  // If order items were empty or minimal, apply standard production cost ratio
  if (totalProductionCost === 0 && totalRevenue > 0) {
    totalProductionCost = Math.round(totalRevenue * 0.40);
  }

  const grossProfit = Math.max(0, totalRevenue - totalProductionCost);
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 2. Filter added inventory transactions for period
  const eligibleAddTxs = allTxs.filter((tx) => {
    if (tx.type !== "add" || !tx.created_at) return false;
    const d = new Date(tx.created_at);
    if (isNaN(d.getTime())) return false;

    if (period === "today") {
      return tx.created_at.startsWith(todayStr);
    }
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Calculate added stock vs consumed stock for loss
  const addedInventoryMap = new Map<
    string,
    { id: string; name: string; quantity: number; cost_per_unit: number; unit: string }
  >();

  let addedStockValue = 0;
  for (const tx of eligibleAddTxs) {
    const inv = allInventory.find((i) => i.id === tx.inventory_id);
    const unitCost = tx.cost_per_unit || getInventoryCostPerUnit(inv);
    addedStockValue += tx.quantity * unitCost;

    const existing = addedInventoryMap.get(tx.inventory_id) || {
      id: tx.inventory_id,
      name: tx.inventory_name || inv?.name || "Ingredient",
      quantity: 0,
      cost_per_unit: unitCost,
      unit: inv?.unit || "pcs",
    };
    existing.quantity += tx.quantity;
    addedInventoryMap.set(tx.inventory_id, existing);
  }

  let totalUnsoldLoss = 0;
  let wasteItemsCount = 0;
  const lossBreakdown: POSProfitLossMetrics["lossBreakdown"] = [];

  // Formula: For ingredients added in this cycle, (Added - Consumed) * Cost = Loss
  addedInventoryMap.forEach((val, invId) => {
    const consumed = consumedInventoryMap.get(invId) || 0;
    const unsold = Math.max(0, val.quantity - consumed);
    if (unsold > 0) {
      const lossAmt = Math.round(unsold * val.cost_per_unit);
      totalUnsoldLoss += lossAmt;
      wasteItemsCount++;
      lossBreakdown.push({
        inventory_name: val.name,
        unit: val.unit,
        added_quantity: val.quantity,
        consumed_quantity: consumed,
        unsold_quantity: unsold,
        unit_cost: val.cost_per_unit,
        loss_amount: lossAmt,
      });
    }
  });

  // Net Realized Profit = Gross Profit - Unsold Loss
  const netProfit = grossProfit - totalUnsoldLoss;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const itemizedBreakdown = Array.from(itemizedMap.values()).map((v) => ({
    menu_item_name: v.name,
    quantity_sold: v.quantity,
    revenue: v.revenue,
    production_cost: v.cost,
    profit: v.revenue - v.cost,
  }));

  return {
    period,
    revenue: totalRevenue,
    productionCost: totalProductionCost,
    grossProfit,
    grossProfitMargin: Math.round(grossProfitMargin * 10) / 10,
    unsoldLoss: totalUnsoldLoss,
    netProfit,
    netProfitMargin: Math.round(netProfitMargin * 10) / 10,
    soldItemsCount,
    addedStockValue: Math.round(addedStockValue),
    wasteItemsCount,
    itemizedBreakdown,
    lossBreakdown,
  };
}

