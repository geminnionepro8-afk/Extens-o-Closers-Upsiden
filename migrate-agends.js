const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // Create Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.agendamentos (
        id TEXT PRIMARY KEY,
        chat_id TEXT,
        nome_contato TEXT,
        when_ms BIGINT,
        tipo TEXT,
        conteudo TEXT,
        base64 TEXT,
        mime TEXT,
        nome_arq TEXT,
        recorrencia TEXT,
        user_id UUID DEFAULT auth.uid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Table agendamentos created or already exists.');

    // Enable RLS
    await client.query(`ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;`);
    console.log('RLS enabled.');

    // Drop policy if exists to avoid errors on run
    await client.query(`DROP POLICY IF EXISTS "Enable ALL for users based on user_id" ON public.agendamentos;`);
    
    // Create Policy
    await client.query(`
      CREATE POLICY "Enable ALL for users based on user_id" 
      ON public.agendamentos 
      FOR ALL USING (auth.uid() = user_id);
    `);
    console.log('Policy attached.');
    
  } catch(e) {
    console.error('Error in migration:', e);
  } finally {
    await client.end();
  }
}

run();
