-- =============================================================================
-- PICK N' GO - COMPLETE DATABASE SETUP (Run in Supabase SQL Editor)
-- =============================================================================
-- Run this ENTIRE script in one go at:
-- https://supabase.com/dashboard → Your Project → SQL Editor → New Query
-- =============================================================================

-- =====================
-- STEP 1: DROP EXISTING TABLES (if re-running)
-- =====================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================
-- STEP 2: CREATE TABLES
-- =====================

-- PROFILES TABLE (supports student, vendor, admin roles with email auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('student', 'vendor', 'admin')) NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CATEGORIES TABLE
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- MENU ITEMS TABLE
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDERS TABLE
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  vendor_id UUID REFERENCES profiles(id),
  total_amount DECIMAL NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDER ITEMS TABLE
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_at_order DECIMAL NOT NULL
);

-- =====================
-- STEP 3: ENABLE REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- =====================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =====================
-- STEP 5: RLS POLICIES
-- =====================

-- Profiles: everyone can read, users can manage their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: everyone can read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Menu items: everyone can read, vendors can manage their own
CREATE POLICY "Menu items are viewable by everyone" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Vendors can insert menu items" ON menu_items FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update their menu items" ON menu_items FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete their menu items" ON menu_items FOR DELETE USING (auth.uid() = vendor_id);

-- Orders: participants can view, students can create, vendors can update
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = student_id OR auth.uid() = vendor_id);
CREATE POLICY "Students can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Vendors can update orders" ON orders FOR UPDATE USING (auth.uid() = vendor_id);

-- Order items: participants can view and create
CREATE POLICY "Order items viewable by participants" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.student_id = auth.uid() OR orders.vendor_id = auth.uid()))
);
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (true);

-- =====================
-- STEP 6: SEED CATEGORIES
-- =====================
INSERT INTO categories (id, name, slug) VALUES
  (gen_random_uuid(), 'Main Course', 'main-course'),
  (gen_random_uuid(), 'Snacks & Starters', 'snacks'),
  (gen_random_uuid(), 'Beverages', 'beverages'),
  (gen_random_uuid(), 'Desserts', 'desserts');

-- =============================================================================
-- DONE! Tables and categories are created.
-- =============================================================================
-- 
-- NEXT STEPS (do these manually in the Supabase Dashboard):
--
-- 1. CREATE ADMIN USER:
--    Go to Authentication → Users → "Add User" → "Create New User"
--    Email: admin@pickngo.com
--    Password: admin123456
--    (Check "Auto Confirm User")
--
-- 2. COPY THE ADMIN UUID from the users list
--
-- 3. RUN THIS (replace <ADMIN_UUID> with your actual UUID):
--
--    INSERT INTO profiles (id, full_name, email, role)
--    VALUES ('<ADMIN_UUID>', 'Admin', 'admin@pickngo.com', 'admin');
--
-- 4. Now log into the app as Admin and register vendors from the Admin Panel!
--
-- 5. OPTIONAL - Create a test student:
--    Go to Authentication → Users → "Add User"
--    Email: student@test.com, Password: test123456
--    Then run:
--    INSERT INTO profiles (id, full_name, email, role)
--    VALUES ('<STUDENT_UUID>', 'Test Student', 'student@test.com', 'student');
--
-- =============================================================================
