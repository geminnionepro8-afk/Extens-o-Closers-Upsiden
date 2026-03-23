const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // Purge legacy schema
    await client.query(`DROP TABLE IF EXISTS public.config_automacao CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS public.gatilhos CASCADE;`);
    
    // Create config_automacao
    await client.query(`
      CREATE TABLE public.config_automacao (
        closer_id UUID PRIMARY KEY,
        saudacao_ativa BOOLEAN DEFAULT false,
        saudacao_mensagem TEXT,
        apenas_privado BOOLEAN DEFAULT true,
        apenas_grupo BOOLEAN DEFAULT false,
        followup_steps TEXT,
        usar_horario BOOLEAN DEFAULT false,
        hora_inicio TEXT,
        hora_fim TEXT,
        msg_fora_horario TEXT,
        simular_digitacao BOOLEAN DEFAULT true,
        simular_gravacao BOOLEAN DEFAULT true,
        delay_min INTEGER DEFAULT 2,
        delay_max INTEGER DEFAULT 5,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Table config_automacao forcefully recreated.');

    await client.query(`ALTER TABLE public.config_automacao ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      CREATE POLICY "Enable all access for own automation config" 
      ON public.config_automacao 
      FOR ALL USING (auth.uid() = closer_id);
    `);

    // Create gatilhos
    await client.query(`
      CREATE TABLE public.gatilhos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        criado_por UUID,
        palavra TEXT,
        resposta TEXT,
        condicao TEXT,
        ativo BOOLEAN DEFAULT true,
        simular_digitacao BOOLEAN DEFAULT true,
        apenas_privado BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Table gatilhos forcefully recreated.');

    await client.query(`ALTER TABLE public.gatilhos ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      CREATE POLICY "Enable all access for own triggers" 
      ON public.gatilhos 
      FOR ALL USING (auth.uid() = criado_por);
    `);
    
    console.log('Finished migrating automation schemas clean.');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run();
