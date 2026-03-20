const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // Check users
    const users = await client.query('SELECT id, email FROM auth.users');
    console.log('--- Usuários (auth.users) ---');
    console.log('Total:', users.rows.length);
    users.rows.forEach(u => console.log(' -', u.email));
    
    // Check tables in public
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('\\n--- Tabelas no Schema Public ---');
    console.log(tables.rows.map(r => r.table_name).join(', '));
    
    // Check config_automacao columns
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'config_automacao'");
    if (cols.rows.length > 0) {
      console.log('\\n--- Colunas em config_automacao ---');
      console.log(cols.rows.map(r => r.column_name).join(', '));
    } else {
      console.log('\\n--- Tabela config_automacao NÃO encontrada ---');
    }

    // Check gatilhos columns
    const gatCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gatilhos'");
    if (gatCols.rows.length > 0) {
      console.log('\\n--- Colunas em gatilhos ---');
      console.log(gatCols.rows.map(r => r.column_name).join(', '));
    }

    await client.end();
  } catch (err) {
    console.error('ERRO:', err.message);
    await client.end().catch(()=>{} );
  }
}

run();
