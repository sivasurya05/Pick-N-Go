-- ADMIN SETUP FOR PICK N' GO
-- =============================================================================
-- Run this AFTER creating an admin user via Supabase Auth Dashboard
-- 
-- STEPS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create New User"
-- 3. Enter email: admin@pickngo.com, password: admin123456
-- 4. Copy the UUID generated for this user
-- 5. Replace <ADMIN_UUID> below with the copied UUID
-- 6. Run this SQL in the SQL Editor
-- =============================================================================

INSERT INTO profiles (id, full_name, email, role) VALUES
('<ADMIN_UUID>', 'Admin', 'admin@pickngo.com', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Example with a real UUID (replace with your actual UUID):
-- INSERT INTO profiles (id, full_name, email, role) VALUES
-- ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Admin', 'admin@pickngo.com', 'admin')
-- ON CONFLICT (id) DO NOTHING;
