const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mhxpbrnjiywrizajfftf:ZfZUhVVro5DVdDdH@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- ═══════════════════════════════════════════
-- TABELAS BASE (Arquivos, Templates, CRM)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_original TEXT,
  tipo_mime TEXT,
  duracao DECIMAL,
  tamanho BIGINT,
  storage_path TEXT,
  criado_por UUID REFERENCES auth.users(id),
  compartilhado BOOLEAN DEFAULT false,
  favorito BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  tamanho BIGINT,
  storage_path TEXT,
  criado_por UUID REFERENCES auth.users(id),
  compartilhado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS midias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  tamanho BIGINT,
  storage_path TEXT,
  criado_por UUID REFERENCES auth.users(id),
  compartilhado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT,
  criado_por UUID REFERENCES auth.users(id),
  compartilhado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  telefone TEXT,
  estagio TEXT DEFAULT 'prospeccao',
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════
-- TABELAS DE AUTOMAÇÃO (Saudação e Gatilhos)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS config_automacao (
  closer_id UUID PRIMARY KEY REFERENCES auth.users(id),
  saudacao_ativa BOOLEAN DEFAULT false,
  saudacao_mensagem TEXT,
  usar_horario BOOLEAN DEFAULT false,
  hora_inicio TEXT DEFAULT '09:00',
  hora_fim TEXT DEFAULT '18:00',
  -- Novas da Fase 1
  simular_digitacao BOOLEAN DEFAULT true,
  simular_gravacao BOOLEAN DEFAULT true,
  delay_min INTEGER DEFAULT 2,
  delay_max INTEGER DEFAULT 5,
  msg_fora_horario TEXT DEFAULT '',
  dias_semana TEXT[] DEFAULT ARRAY['seg','ter','qua','qui','sex'],
  apenas_privado BOOLEAN DEFAULT false,
  apenas_grupo BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gatilhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra TEXT NOT NULL,
  resposta TEXT NOT NULL,
  condicao TEXT DEFAULT 'exata',
  ativo BOOLEAN DEFAULT true,
  criado_por UUID REFERENCES auth.users(id),
  compartilhado BOOLEAN DEFAULT false,
  -- Novas da Fase 1
  delay_min INTEGER DEFAULT 1,
  delay_max INTEGER DEFAULT 3,
  simular_digitacao BOOLEAN DEFAULT true,
  apenas_privado BOOLEAN DEFAULT false,
  apenas_grupo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════
-- TABELAS FASE 1: Campanhas e Follow-up
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS listas_transmissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lista_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id UUID REFERENCES listas_transmissao(id) ON DELETE CASCADE,
  nome TEXT DEFAULT '',
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  lista_id UUID REFERENCES listas_transmissao(id) ON DELETE SET NULL,
  tipo TEXT DEFAULT 'texto',
  conteudo TEXT DEFAULT '',
  recurso_id UUID,
  status TEXT DEFAULT 'rascunho',
  delay_min INTEGER DEFAULT 3,
  delay_max INTEGER DEFAULT 8,
  total_contatos INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  falhas INTEGER DEFAULT 0,
  criado_por UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campanha_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  contato_nome TEXT DEFAULT '',
  contato_telefone TEXT DEFAULT '',
  status TEXT DEFAULT 'pendente',
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS em todas
ALTER TABLE audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_automacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatilhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listas_transmissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanha_log ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS Permissivas (neste caso, a nível de dev)
DO $$ 
DECLARE
  tables text[] := ARRAY['audios','documentos','midias','templates','leads','config_automacao','gatilhos','listas_transmissao','lista_contatos','campanhas','campanha_log'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_all_access') THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true);', t || '_all_access', t);
    END IF;
  END LOOP;
END $$;
`;

async function run() {
  try {
    console.log('Conectando ao Supabase...');
    await client.connect();
    console.log('Executando criação de tabelas...');
    await client.query(SQL);
    console.log('');
    console.log('✅ SUCESSO! Todas as 11 tabelas da Upsiden foram criadas e configuradas com sucesso.');
    
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('\\nTabelas Atuais:');
    res.rows.forEach(r => {
      const isUpsiden = ['audios','documentos','midias','templates','leads','config_automacao','gatilhos','listas_transmissao','lista_contatos','campanhas','campanha_log'].includes(r.table_name);
      console.log(`  ${isUpsiden ? '✅' : '-'} ${r.table_name}`);
    });

    await client.end();
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    await client.end().catch(() => {});
  }
}

run();
