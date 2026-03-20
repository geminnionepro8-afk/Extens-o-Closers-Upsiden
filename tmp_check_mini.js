const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    const users = await client.query('SELECT count(*) FROM auth.users');
    console.log('Qtd Usuarios:', users.rows[0].count);
    
    // Check config_automacao columns
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'config_automacao'");
    const clist = cols.rows.map(r => r.column_name);
    console.log('Cols config:', clist.includes('simular_digitacao') ? 'Ok (tem columns novas)' : 'FALTAM COLUNAS NOVAS!', clist.join(', '));
    
    const gatCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gatilhos'");
    const gclist = gatCols.rows.map(r => r.column_name);
    console.log('Cols gatilhos:', gclist.includes('simular_digitacao') ? 'Ok' : 'FALTAM!', gclist.join(', '));

    await client.end();
  } catch (err) {
    console.error('ERRO:', err.message);
    await client.end().catch(()=>{} );
  }
}

run();
