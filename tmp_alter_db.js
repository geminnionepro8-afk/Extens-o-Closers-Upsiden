const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- config_automacao: adicionar colunas novas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='simular_digitacao') THEN
    ALTER TABLE config_automacao ADD COLUMN simular_digitacao BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='simular_gravacao') THEN
    ALTER TABLE config_automacao ADD COLUMN simular_gravacao BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='delay_min') THEN
    ALTER TABLE config_automacao ADD COLUMN delay_min INTEGER DEFAULT 2;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='delay_max') THEN
    ALTER TABLE config_automacao ADD COLUMN delay_max INTEGER DEFAULT 5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='msg_fora_horario') THEN
    ALTER TABLE config_automacao ADD COLUMN msg_fora_horario TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='dias_semana') THEN
    ALTER TABLE config_automacao ADD COLUMN dias_semana TEXT[] DEFAULT ARRAY['seg','ter','qua','qui','sex'];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='apenas_privado') THEN
    ALTER TABLE config_automacao ADD COLUMN apenas_privado BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config_automacao' AND column_name='apenas_grupo') THEN
    ALTER TABLE config_automacao ADD COLUMN apenas_grupo BOOLEAN DEFAULT false;
  END IF;
END $$;

-- gatilhos: adicionar colunas novas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gatilhos' AND column_name='delay_min') THEN
    ALTER TABLE gatilhos ADD COLUMN delay_min INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gatilhos' AND column_name='delay_max') THEN
    ALTER TABLE gatilhos ADD COLUMN delay_max INTEGER DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gatilhos' AND column_name='simular_digitacao') THEN
    ALTER TABLE gatilhos ADD COLUMN simular_digitacao BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gatilhos' AND column_name='apenas_privado') THEN
    ALTER TABLE gatilhos ADD COLUMN apenas_privado BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gatilhos' AND column_name='apenas_grupo') THEN
    ALTER TABLE gatilhos ADD COLUMN apenas_grupo BOOLEAN DEFAULT false;
  END IF;
END $$;
`;

async function run() {
  try {
    await client.connect();
    console.log('Adicionando colunas que faltavam...');
    await client.query(SQL);
    console.log('Colunas inseridas com sucesso mantendo os dados intactos!');
    await client.end();
  } catch (err) {
    console.error('ERRO:', err.message);
    await client.end();
  }
}

run();
