/**
 * PICK N' GO — Full Seed Script
 * Uploads photos → creates storage bucket → seeds categories → creates vendors → seeds menu items
 *
 * HOW TO RUN (from project root):
 *   node scripts/seed.mjs
 *
 * REQUIREMENTS:
 *   - Run `npm install` first (uses @supabase/supabase-js already installed)
 *   - You must have already run complete_setup.sql in Supabase SQL Editor
 *   - The SUPABASE_SERVICE_ROLE_KEY must be added to .env.local (see instructions below)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pnjfytbeoqjcedilpbcg.supabase.co';

// ⚠️  Use the SERVICE ROLE key (not anon) so we can bypass RLS for seeding.
// Get it from: Supabase Dashboard → Settings → API → service_role (secret)
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error(`
❌  SUPABASE_SERVICE_ROLE_KEY is missing!

  1. Go to: https://supabase.com/dashboard/project/pnjfytbeoqjcedilpbcg/settings/api
  2. Copy the "service_role" key (under "Project API keys")
  3. Run the script like this:
       $env:SUPABASE_SERVICE_ROLE_KEY="your_key_here"; node scripts/seed.mjs
  `);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, '..', 'photos');
const BUCKET = 'food';

// ─── PHOTO → STORAGE URL MAP ────────────────────────────────────────────────
const photos = [
  'butty - chicken biriyani.jpg',
  'butty - chicken rice.jpg',
  'butty - roll.jpg',
  'lava_cake-brownie.jpg',
  'lava_cake-jamun.jpg',
  'mc - cold coffee.jpg',
  'mc - fries.jpg',
  'mc burger.jpg',
];

// ─── STEP 1: Create bucket if needed ────────────────────────────────────────
async function ensureBucket() {
  console.log('\n📦 Ensuring storage bucket "food" exists...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.find(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Bucket creation failed: ${error.message}`);
    console.log('  ✅ Bucket created');
  } else {
    console.log('  ✅ Bucket already exists');
  }
}

// ─── STEP 2: Upload photos ───────────────────────────────────────────────────
async function uploadPhotos() {
  console.log('\n🖼️  Uploading photos...');
  const urlMap = {};

  for (const filename of photos) {
    const filePath = path.join(PHOTOS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  Not found, skipping: ${filename}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `menu/${filename}`;

    // Remove existing file first (idempotent re-runs)
    await supabase.storage.from(BUCKET).remove([storagePath]);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ Failed to upload ${filename}: ${error.message}`);
    } else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      urlMap[filename] = data.publicUrl;
      console.log(`  ✅ ${filename}`);
    }
  }

  return urlMap;
}

// ─── STEP 3: Seed categories ─────────────────────────────────────────────────
async function seedCategories() {
  console.log('\n🗂️  Seeding categories...');

  // Delete existing categories first for a clean seed
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('categories')
    .insert([
      { name: 'Main Course',      slug: 'main-course' },
      { name: 'Snacks & Starters', slug: 'snacks'      },
      { name: 'Beverages',         slug: 'beverages'   },
      { name: 'Desserts',          slug: 'desserts'    },
    ])
    .select();

  if (error) throw new Error(`Categories failed: ${error.message}`);
  console.log(`  ✅ Inserted ${data.length} categories`);
  return data; // returns [{id, name, slug}, ...]
}

// ─── STEP 4: Create vendor auth users + profiles ─────────────────────────────
async function createVendor(email, password, name, phone) {
  // Try to fetch existing auth user first
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw new Error(`List users failed: ${listErr.message}`);

  let authUser = users.find(u => u.email === email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'vendor' },
    });
    if (error) throw new Error(`Auth user creation failed for ${email}: ${error.message}`);
    authUser = data.user;
    console.log(`  ✅ Auth user created: ${email}`);
  } else {
    console.log(`  ℹ️  Auth user already exists: ${email}`);
  }

  // Upsert profile
  const { error: profErr } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.id,
      role: 'vendor',
      full_name: name,
      email,
      phone,
    });
  if (profErr) throw new Error(`Profile upsert failed for ${email}: ${profErr.message}`);

  return authUser.id;
}

async function seedVendors() {
  console.log('\n🏪 Creating vendor accounts...');
  const vendor1Id = await createVendor('buttyxo@pickngo.com',    'vendor123456', 'Butty XO',    '+919876543210');
  const vendor2Id = await createVendor('mcdonalds@pickngo.com',  'vendor123456', 'MC Donalds',  '+919876543211');
  const vendor3Id = await createVendor('lavacakes@pickngo.com',  'vendor123456', 'Lava Cakes',  '+919876543212');
  return { vendor1Id, vendor2Id, vendor3Id };
}

// ─── STEP 5: Seed menu items ─────────────────────────────────────────────────
async function seedMenuItems(cats, vendors, urlMap) {
  console.log('\n🍔 Seeding menu items...');

  const catBySlug = {};
  cats.forEach(c => { catBySlug[c.slug] = c.id; });

  const getUrl = (filename) => urlMap[filename] || '/food.png';

  // Clear existing menu items
  await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const items = [
    // ── Butty XO ──────────────────────────────────────────────────────────────
    {
      vendor_id:    vendors.vendor1Id,
      category_id:  catBySlug['main-course'],
      name:         'Chicken Rice',
      description:  'Fragrant rice served with tender, seasoned chicken for a simple and satisfying meal.',
      price:        100,
      image_url:    getUrl('butty - chicken rice.jpg'),
      is_available: true,
      rating:       4.8,
    },
    {
      vendor_id:    vendors.vendor1Id,
      category_id:  catBySlug['main-course'],
      name:         'Chicken Dum Biryani',
      description:  'Aromatic basmati rice layered with spiced chicken, slow-cooked to rich, flavorful perfection.',
      price:        120,
      image_url:    getUrl('butty - chicken biriyani.jpg'),
      is_available: true,
      rating:       4.9,
    },
    {
      vendor_id:    vendors.vendor1Id,
      category_id:  catBySlug['snacks'],
      name:         'Chicken Roll',
      description:  'Juicy chicken wrapped in a soft flatbread with fresh veggies and tangy sauces.',
      price:        70,
      image_url:    getUrl('butty - roll.jpg'),
      is_available: true,
      rating:       4.5,
    },
    // ── MC Donalds ────────────────────────────────────────────────────────────
    {
      vendor_id:    vendors.vendor2Id,
      category_id:  catBySlug['beverages'],
      name:         'Cold Coffee',
      description:  'Thick signature cold coffee with chocolate drizzle – perfect for a hot day.',
      price:        90,
      image_url:    getUrl('mc - cold coffee.jpg'),
      is_available: true,
      rating:       4.7,
    },
    {
      vendor_id:    vendors.vendor2Id,
      category_id:  catBySlug['snacks'],
      name:         'Crispy Fries',
      description:  'Golden potato fries, lightly salted and perfect as a crunchy side or snack.',
      price:        110,
      image_url:    getUrl('mc - fries.jpg'),
      is_available: true,
      rating:       4.4,
    },
    {
      vendor_id:    vendors.vendor2Id,
      category_id:  catBySlug['snacks'],
      name:         'MC Burger',
      description:  'Spicy vegetable patty with extra cheese and our secret sauce.',
      price:        130,
      image_url:    getUrl('mc burger.jpg'),
      is_available: true,
      rating:       4.6,
    },
    // ── Lava Cakes ────────────────────────────────────────────────────────────
    {
      vendor_id:    vendors.vendor3Id,
      category_id:  catBySlug['desserts'],
      name:         'Sizzling Brownie',
      description:  'Hot chocolate brownie served with a scoop of vanilla ice cream.',
      price:        150,
      image_url:    getUrl('lava_cake-brownie.jpg'),
      is_available: true,
      rating:       4.9,
    },
    {
      vendor_id:    vendors.vendor3Id,
      category_id:  catBySlug['desserts'],
      name:         'Gulab Jamun (2 pcs)',
      description:  'Traditional sweet dumplings soaked in rose sugar syrup.',
      price:        60,
      image_url:    getUrl('lava_cake-jamun.jpg'),
      is_available: true,
      rating:       4.7,
    },
  ];

  const { data, error } = await supabase.from('menu_items').insert(items).select();
  if (error) throw new Error(`Menu items failed: ${error.message}`);
  console.log(`  ✅ Inserted ${data.length} menu items`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Pick N\' Go — Seed Script Starting...');
  console.log(`   Project: ${SUPABASE_URL}\n`);

  try {
    await ensureBucket();
    const urlMap  = await uploadPhotos();
    const cats    = await seedCategories();
    const vendors = await seedVendors();
    await seedMenuItems(cats, vendors, urlMap);

    console.log(`
✅ Seeding complete!

📋 VENDOR LOGIN CREDENTIALS:
   Butty XO   → buttyxo@pickngo.com    / vendor123456
   MC Donalds → mcdonalds@pickngo.com  / vendor123456
   Lava Cakes → lavacakes@pickngo.com  / vendor123456

📋 NEXT STEP — Create Admin:
   1. Go to Supabase → Authentication → Users → Add User
   2. Email: admin@pickngo.com  Password: admin123456
   3. Copy the UUID and run:
      INSERT INTO profiles (id, full_name, email, role)
      VALUES ('<UUID>', 'Admin', 'admin@pickngo.com', 'admin');
`);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
