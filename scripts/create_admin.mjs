/**
 * Creates the admin user account and profile
 * Run: node scripts/create_admin.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pnjfytbeoqjcedilpbcg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('🔐 Creating admin account...\n');

  // Check if admin already exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  let adminUser = users.find(u => u.email === 'admin@pickngo.com');

  if (!adminUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@pickngo.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: { full_name: 'Admin', role: 'admin' },
    });
    if (error) { console.error('❌ Auth creation failed:', error.message); process.exit(1); }
    adminUser = data.user;
    console.log('  ✅ Admin auth user created');
  } else {
    console.log('  ℹ️  Admin auth user already exists');
  }

  // Upsert profile
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: adminUser.id,
    role: 'admin',
    full_name: 'Admin',
    email: 'admin@pickngo.com',
  });

  if (profErr) { console.error('❌ Profile upsert failed:', profErr.message); process.exit(1); }

  console.log('  ✅ Admin profile created\n');
  console.log('✅ Admin account ready!');
  console.log('   Email:    admin@pickngo.com');
  console.log('   Password: admin123456');
  console.log('   Role:     admin\n');
  console.log('👉 Open http://localhost:3000, click "Admin Login" and sign in!');
})();
