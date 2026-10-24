-- ============================================
-- GRILLVI POS - COMPLETE SETUP & RESET SCHEMA
-- Supabase PostgreSQL Database Setup Script
-- Includes Recipe Mapping, Payment Methods, Order Types, 
-- Discounts, Table Reservations, and Inventory Triggers
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------
-- 1. DROP EXISTING OBJECTS (CASCADE RESET)
-- --------------------------------------------
-- Triggers will be dropped automatically when their parent tables are dropped with CASCADE.

DROP FUNCTION IF EXISTS update_order_total() CASCADE;
DROP FUNCTION IF EXISTS set_completed_at() CASCADE;
DROP FUNCTION IF EXISTS set_table_occupied_on_order() CASCADE;
DROP FUNCTION IF EXISTS deduct_inventory_on_order_completion() CASCADE;

DROP VIEW IF EXISTS active_orders_view CASCADE;
DROP VIEW IF EXISTS inventory_summary CASCADE;

DROP TABLE IF EXISTS menu_item_ingredients CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS table_status_enum CASCADE;
DROP TYPE IF EXISTS inventory_type_enum CASCADE;
DROP TYPE IF EXISTS order_type_enum CASCADE;
DROP TYPE IF EXISTS payment_method_enum CASCADE;

-- --------------------------------------------
-- 2. ENUM TYPES
-- --------------------------------------------
CREATE TYPE order_status_enum AS ENUM (
  'draft',
  'pending', 
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'rejected',
  'cancelled'
);

CREATE TYPE table_status_enum AS ENUM (
  'available',
  'occupied', 
  'reserved'
);

CREATE TYPE inventory_type_enum AS ENUM (
  'add',
  'remove',
  'adjust'
);

CREATE TYPE order_type_enum AS ENUM (
  'dine_in',
  'takeaway',
  'delivery'
);

CREATE TYPE payment_method_enum AS ENUM (
  'cash',
  'card',
  'qr_online',
  'split'
);

-- --------------------------------------------
-- 3. CREATE TABLES
-- --------------------------------------------

-- Users Table (Includes Pending/Approved/Rejected registration status)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT 'password123',
  role VARCHAR(20) NOT NULL DEFAULT 'waiter' CHECK (role IN ('admin', 'waiter', 'kitchen')),
  active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tables Management (Includes Table Reservations)
CREATE TABLE tables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 4 NOT NULL,
  status table_status_enum DEFAULT 'available' NOT NULL,
  reserved_by VARCHAR(100),
  reserved_phone VARCHAR(30),
  reserved_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories (Menu Categories)
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders Table (Includes Order Types, Payments, Discounts, Customer Details)
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status order_status_enum DEFAULT 'pending' NOT NULL,
  order_type order_type_enum DEFAULT 'dine_in' NOT NULL,
  payment_method payment_method_enum,
  subtotal INTEGER DEFAULT 0 CHECK (subtotal >= 0),
  tax INTEGER DEFAULT 0 CHECK (tax >= 0),
  discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
  discount_type VARCHAR(20) DEFAULT 'none' CHECK (discount_type IN ('percentage', 'flat', 'none')),
  total INTEGER DEFAULT 0 CHECK (total >= 0),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(30),
  delivery_address TEXT,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Table
CREATE TABLE inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  quantity DECIMAL(10, 2) DEFAULT 0 CHECK (quantity >= 0),
  minimum_quantity DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recipe Mapping: Menu Item Ingredients (Automated Inventory Deduction)
CREATE TABLE menu_item_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10, 2) NOT NULL CHECK (quantity_required > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(menu_item_id, inventory_id)
);

-- Inventory Transactions Table
CREATE TABLE inventory_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  type inventory_type_enum NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL DEFAULT 'info' CHECK (type IN ('new_order', 'order_ready', 'order_rejected', 'low_stock', 'info')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------
-- 4. VIEWS
-- --------------------------------------------

-- View for Active (In-Progress) Orders
CREATE VIEW active_orders_view AS
SELECT 
  o.id,
  o.table_id,
  t.table_number,
  o.waiter_id,
  u.name AS waiter_name,
  o.status,
  o.order_type,
  o.payment_method,
  o.subtotal,
  o.tax,
  o.discount_amount,
  o.total,
  o.customer_name,
  o.notes,
  o.rejection_reason,
  o.created_at,
  COUNT(oi.id) AS item_count
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
LEFT JOIN users u ON o.waiter_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status NOT IN ('completed', 'cancelled', 'rejected')
GROUP BY o.id, t.table_number, u.name;

-- View for Inventory Status
CREATE VIEW inventory_summary AS
SELECT 
  i.id,
  i.name,
  i.unit,
  i.quantity,
  i.minimum_quantity,
  i.updated_at,
  CASE 
    WHEN i.quantity <= 0 THEN 'critical'
    WHEN i.quantity <= i.minimum_quantity THEN 'low'
    ELSE 'in_stock'
  END AS status
FROM inventory i;

-- --------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
-- --------------------------------------------
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_menu_item_ingredients_item ON menu_item_ingredients(menu_item_id);

-- --------------------------------------------
-- 6. PERMISSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public write users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access tables" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access menu_item_ingredients" ON menu_item_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access inventory_transactions" ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------
-- 7. AUTOMATIC TRIGGERS & FUNCTIONS
-- --------------------------------------------

-- Trigger 1: Auto update order subtotal, 18% tax, discounts, and total in database when items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
  target_order_id UUID;
  calc_subtotal INTEGER;
  calc_tax INTEGER;
  calc_discount INTEGER;
  current_discount_amount INTEGER;
  current_discount_type VARCHAR;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_order_id := OLD.order_id;
  ELSE
    target_order_id := NEW.order_id;
  END IF;

  SELECT discount_amount, discount_type INTO current_discount_amount, current_discount_type FROM orders WHERE id = target_order_id;
  
  calc_subtotal := COALESCE((SELECT SUM(price * quantity) FROM order_items WHERE order_id = target_order_id), 0);
  calc_tax := 0; -- No sales tax
  
  IF (current_discount_type = 'percentage') THEN
    calc_discount := ROUND(calc_subtotal * (COALESCE(current_discount_amount, 0)::NUMERIC / 100.0));
  ELSE
    calc_discount := COALESCE(current_discount_amount, 0);
  END IF;

  UPDATE orders SET 
    subtotal = calc_subtotal,
    tax = 0,
    total = GREATEST(0, calc_subtotal - calc_discount)
  WHERE id = target_order_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- Trigger 2: Auto set table status to 'occupied' when a dine-in order is placed
CREATE OR REPLACE FUNCTION set_table_occupied_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_id IS NOT NULL AND NEW.order_type = 'dine_in' THEN
    UPDATE tables SET status = 'occupied' WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_table_occupied_trigger
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_table_occupied_on_order();

-- Trigger 3: Auto set completed_at timestamp, free table, and trigger automated inventory deduction
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
DECLARE
  item_rec RECORD;
  recipe_rec RECORD;
  deduct_qty DECIMAL;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    NEW.completed_at := now();

    -- Free up table if dine-in order
    IF NEW.table_id IS NOT NULL THEN
      UPDATE tables SET status = 'available', reserved_by = NULL, reserved_phone = NULL, reserved_time = NULL WHERE id = NEW.table_id;
    END IF;

    -- Automated Recipe Inventory Deduction
    FOR item_rec IN SELECT menu_item_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
      FOR recipe_rec IN SELECT inventory_id, quantity_required FROM menu_item_ingredients WHERE menu_item_id = item_rec.menu_item_id LOOP
        deduct_qty := recipe_rec.quantity_required * item_rec.quantity;
        
        -- Subtract stock from inventory
        UPDATE inventory 
        SET quantity = GREATEST(0, quantity - deduct_qty),
            updated_at = now()
        WHERE id = recipe_rec.inventory_id;

        -- Record inventory transaction
        INSERT INTO inventory_transactions (inventory_id, type, quantity, reason)
        VALUES (recipe_rec.inventory_id, 'remove', deduct_qty, 'Order #' || NEW.id || ' completed');
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completed_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- --------------------------------------------
-- 8. INITIAL PRODUCTION SEED DATA
-- --------------------------------------------
-- Insert 12 Floor Tables
INSERT INTO tables (table_number, capacity, status) VALUES
  (1, 2, 'available'),
  (2, 4, 'available'),
  (3, 4, 'available'),
  (4, 6, 'available'),
  (5, 2, 'available'),
  (6, 4, 'available'),
  (7, 4, 'available'),
  (8, 8, 'available'),
  (9, 4, 'available'),
  (10, 6, 'available'),
  (11, 2, 'available'),
  (12, 4, 'available');

-- Insert SwiftBite Menu Categories
INSERT INTO categories (id, name, active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Burgers', true),
  ('c0000000-0000-0000-0000-000000000002', 'Pizza', true),
  ('c0000000-0000-0000-0000-000000000003', 'Wraps', true),
  ('c0000000-0000-0000-0000-000000000004', 'Fried Chicken', true),
  ('c0000000-0000-0000-0000-000000000005', 'Pasta', true),
  ('c0000000-0000-0000-0000-000000000006', 'Rice', true),
  ('c0000000-0000-0000-0000-000000000007', 'Appetizers', true),
  ('c0000000-0000-0000-0000-000000000008', 'Drinks', true),
  ('c0000000-0000-0000-0000-000000000009', 'Desserts', true),
  ('c0000000-0000-0000-0000-000000000010', 'Deals', true);

-- Insert Core Menu Items
INSERT INTO menu_items (id, category_id, name, description, price, available, featured) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Classic Smash Burger', 'Double beef patty with cheese and house sauce', 450, true, true),
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Spicy Crispy Chicken', 'Crispy fried chicken breast with spicy mayo', 400, true, true),
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Pepperoni Pizza', '12-inch classic pepperoni and mozzarella', 1200, true, true),
  ('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Margherita Pizza', '12-inch pizza with fresh tomatoes and basil', 1000, true, false),
  ('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'Grilled Chicken Wrap', 'Tortilla wrap with grilled chicken and veggies', 350, true, false),
  ('f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', '3pc Fried Chicken', 'Crispy golden fried chicken pieces', 600, true, true),
  ('f0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 'Fettuccine Alfredo', 'Creamy alfredo pasta with grilled chicken', 750, true, false),
  ('f0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000006', 'Spicy Rice Bowl', 'Mexican style rice with grilled chicken chunks', 550, true, false),
  ('f0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000007', 'Loaded Fries', 'French fries topped with cheese and jalapeños', 350, true, true),
  ('f0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000008', 'Cola 500ml', 'Chilled soft drink', 150, true, false),
  ('f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000009', 'Chocolate Brownie', 'Warm chocolate brownie with syrup', 250, true, false),
  ('f0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000010', 'Family Deal 1', '2 Burgers, 1 Pizza, 4 Drinks', 2500, true, true);

-- Insert Base Inventory Stock
INSERT INTO inventory (id, name, unit, quantity, minimum_quantity) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Chicken', 'kg', 20.0, 5.0),
  ('e0000000-0000-0000-0000-000000000002', 'Beef', 'kg', 15.0, 3.0),
  ('e0000000-0000-0000-0000-000000000003', 'Pizza Dough', 'pcs', 50.0, 10.0),
  ('e0000000-0000-0000-0000-000000000004', 'Cheese', 'kg', 10.0, 2.0),
  ('e0000000-0000-0000-0000-000000000005', 'Burger Buns', 'pcs', 100.0, 20.0),
  ('e0000000-0000-0000-0000-000000000006', 'Fries', 'kg', 30.0, 5.0),
  ('e0000000-0000-0000-0000-000000000007', 'Soft Drinks', 'pcs', 100.0, 24.0);

-- Insert Recipe Ingredients Mapping
INSERT INTO menu_item_ingredients (menu_item_id, inventory_id, quantity_required) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 0.20), -- Smash Burger = 0.20kg Beef
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 1.0),  -- Smash Burger = 1 Bun
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 0.15), -- Crispy Chicken Burger = 0.15kg Chicken
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000005', 1.0),  -- Crispy Chicken Burger = 1 Bun
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 1.0),  -- Pepperoni Pizza = 1 Dough
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', 0.20), -- Pepperoni Pizza = 0.20kg Cheese
  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000006', 0.25), -- Loaded Fries = 0.25kg Fries
  ('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000007', 1.0);  -- Cola = 1 Soft Drink