const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to DB.");

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.flows (
        id text PRIMARY KEY,
        user_id uuid,
        name text NOT NULL,
        nodes_json jsonb DEFAULT '[]',
        edges_json jsonb DEFAULT '[]',
        is_active boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
      
      ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Enable all access for flows" ON public.flows;
      CREATE POLICY "Enable all access for flows" ON public.flows FOR ALL USING (true);
    `);
    console.log("Table 'flows' created and RLS configured successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
}

run();
