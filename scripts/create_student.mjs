/**
 * Creates a test student account
 * Run: node scripts/create_student.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pnjfytbeoqjcedilpbcg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const STUDENT = {
  full_name: 'Test Student',
  email:     'student@pickngo.com',
  password:  'student123456',
  phone:     '9876500000',
};

(async () => {
  console.log('🎓 Creating student account...\n');

  // Check if already exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  let authUser = users.find(u => u.email === STUDENT.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email:          STUDENT.email,
      password:       STUDENT.password,
      email_confirm:  true,
      user_metadata:  { full_name: STUDENT.full_name, role: 'student' },
    });
    if (error) { console.error('❌ Auth creation failed:', error.message); process.exit(1); }
    authUser = data.user;
    console.log('  ✅ Auth user created');
  } else {
    console.log('  ℹ️  Auth user already exists');
  }

  // Upsert profile
  const { error } = await supabase.from('profiles').upsert({
    id:        authUser.id,
    role:      'student',
    full_name: STUDENT.full_name,
    email:     STUDENT.email,
    phone:     STUDENT.phone,
  });
  if (error) { console.error('❌ Profile failed:', error.message); process.exit(1); }
  console.log('  ✅ Student profile created\n');

  // Print all accounts summary
  const { data: profiles } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .order('role');

  console.log('✅ All accounts in database:\n');
  console.log('┌─────────────┬──────────────────────────────┬───────────────────────────────┬────────────────┐');
  console.log('│ Role        │ Name                         │ Email                         │ Password       │');
  console.log('├─────────────┼──────────────────────────────┼───────────────────────────────┼────────────────┤');
  profiles.forEach(p => {
    const pw = p.role === 'admin' ? 'admin123456' : p.role === 'student' ? 'student123456' : 'vendor123456';
    console.log(`│ ${p.role.padEnd(11)} │ ${p.full_name.padEnd(28)} │ ${p.email.padEnd(29)} │ ${pw.padEnd(14)} │`);
  });
  console.log('└─────────────┴──────────────────────────────┴───────────────────────────────┴────────────────┘');
  console.log('\n👉 Open http://localhost:3000 and test all logins!');
})();
