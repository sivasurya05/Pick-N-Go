-- SEED DATA FOR PICK N' GO CAMPUS FOOD APP (EMAIL AUTH VERSION)
-- Run this in your Supabase SQL Editor AFTER creating users via Auth

-- 1. Insert Categories
INSERT INTO categories (id, name, slug) VALUES
('cat_1', 'Main Course', 'main-course'),
('cat_2', 'Snacks & Starters', 'snacks'),
('cat_3', 'Beverages', 'beverages'),
('cat_4', 'Desserts', 'desserts')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- IMPORTANT: Vendor profiles must be created via the Admin Panel (email auth).
-- The Admin Panel will create both the auth.users entry AND the profiles entry.
-- 
-- STEPS TO SET UP:
-- 1. Create an admin user first (see admin_setup.sql below)
-- 2. Log into the app as admin
-- 3. Use the "Register Vendor" tab to create vendor accounts
-- 4. Vendors can then log in and add their own menu items
-- =============================================================================

-- To manually seed vendors for testing, first create them in Supabase Auth,
-- then insert profiles with matching UUIDs:
--
-- INSERT INTO profiles (id, full_name, email, phone, role) VALUES
-- ('<supabase-auth-uid-1>', 'Butty XO', 'buttyxo@campus.com', '+919876543210', 'vendor'),
-- ('<supabase-auth-uid-2>', 'MC Donalds', 'mcdonalds@campus.com', '+919876543211', 'vendor'),
-- ('<supabase-auth-uid-3>', 'Lava Cakes', 'lavacakes@campus.com', '+919876543212', 'vendor')
-- ON CONFLICT (id) DO NOTHING;

-- After vendors exist, insert menu items:
-- INSERT INTO menu_items (vendor_id, category_id, name, price, description, image_url, is_available, rating) VALUES
-- ('<vendor-uid>', 'cat_1', 'Chicken Rice', 100, 'Fragrant rice...', '/photos/butty - chicken rice.jpg', true, 4.8),
-- etc.
