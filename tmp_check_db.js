const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mhxpbrnjiywrizajfftf:ZfZUhVVro5DVdDdH@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    for (const row of res.rows) {
      console.log(row.table_name);
    }
    await client.end();
  } catch (err) {
    console.error('ERRO:', err.message);
    await client.end().catch(function(){});
  }
}

run();
