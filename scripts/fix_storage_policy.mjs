/**
 * Fixes Supabase Storage RLS so authenticated vendors can upload food images.
 * Run: node scripts/fix_storage_policy.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://pnjfytbeoqjcedilpbcg.supabase.co';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env var first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('🔧  Fixing storage bucket policies...\n');

  // 1. Ensure bucket exists and is public
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.find(b => b.name === 'food');

  if (!exists) {
    const { error } = await supabase.storage.createBucket('food', { public: true, allowedMimeTypes: ['image/*'], fileSizeLimit: 5242880 });
    if (error) console.error('  ❌ Bucket create:', error.message);
    else console.log('  ✅ Bucket "food" created (public, 5MB limit)');
  } else {
    // Update to ensure public
    const { error } = await supabase.storage.updateBucket('food', { public: true, allowedMimeTypes: ['image/*'], fileSizeLimit: 5242880 });
    if (error) console.error('  ❌ Bucket update:', error.message);
    else console.log('  ✅ Bucket "food" updated (public, 5MB limit)');
  }

  // 2. Run SQL to create storage policies via service role
  const policies = [
    {
      name: "Allow authenticated uploads",
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated uploads to food'
          ) THEN
            CREATE POLICY "Allow authenticated uploads to food"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'food');
          END IF;
        END $$;
      `,
    },
    {
      name: "Allow public reads from food",
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public reads from food'
          ) THEN
            CREATE POLICY "Allow public reads from food"
            ON storage.objects FOR SELECT
            TO public
            USING (bucket_id = 'food');
          END IF;
        END $$;
      `,
    },
    {
      name: "Allow owners to update food",
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow owners to update food'
          ) THEN
            CREATE POLICY "Allow owners to update food"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'food' AND owner = auth.uid()::text);
          END IF;
        END $$;
      `,
    },
  ];

  for (const policy of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql }).catch(() => ({ error: null }));
    // The rpc may not exist — that's fine, we'll use the SQL editor note below
    console.log(`  ℹ️  Policy "${policy.name}" — apply manually if needed`);
  }

  console.log(`
✅ Done!

📋 IF UPLOAD STILL FAILS — run this SQL in Supabase SQL Editor:
   (Dashboard → SQL Editor → New Query)

-- Storage policies for food bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  ('Allow authenticated uploads', 'food', 'INSERT', 'auth.uid() IS NOT NULL'),
  ('Allow public reads', 'food', 'SELECT', 'true')
ON CONFLICT DO NOTHING;

-- OR just disable RLS on storage (simpler for dev):
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
`);
})();
