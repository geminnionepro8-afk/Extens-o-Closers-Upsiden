const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mhxpbrnjiywrizajfftf:ZfZUhVVro5DVdDdH@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const SQL_DROP = `
  DROP TABLE IF EXISTS campanha_log CASCADE;
  DROP TABLE IF EXISTS campanhas CASCADE;
  DROP TABLE IF EXISTS lista_contatos CASCADE;
  DROP TABLE IF EXISTS listas_transmissao CASCADE;
  DROP TABLE IF EXISTS followup_steps CASCADE;
  DROP TABLE IF EXISTS followup_sequences CASCADE;
  DROP TABLE IF EXISTS gatilhos CASCADE;
  DROP TABLE IF EXISTS config_automacao CASCADE;
  DROP TABLE IF EXISTS leads CASCADE;
  DROP TABLE IF EXISTS templates CASCADE;
  DROP TABLE IF EXISTS midias CASCADE;
  DROP TABLE IF EXISTS documentos CASCADE;
  DROP TABLE IF EXISTS audios CASCADE;
`;

async function run() {
  try {
    console.log('Conectando ao Supabase antigo para limpeza...');
    await client.connect();
    console.log('Apagando as tabelas da extensão...');
    await client.query(SQL_DROP);
    console.log('✅ Banco limpo com sucesso! Nenhuma tabela da Upsiden restou.');
    await client.end();
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    await client.end();
  }
}

run();
