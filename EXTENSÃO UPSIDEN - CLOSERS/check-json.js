const { Client } = require('pg');
const fs = require('fs');
const c = new Client('postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres');

async function check() {
  try {
    await c.connect();
    const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
    const profs = await c.query("SELECT id, email, nome, avatar_url FROM profiles LIMIT 5");
    const auths = await c.query("SELECT id, email FROM auth.users LIMIT 5");

    fs.writeFileSync('db_out.json', JSON.stringify({
      cols: cols.rows,
      profs: profs.rows,
      auths: auths.rows
    }, null, 2));

  } catch (err) {
    console.error("ERRO:", err);
  } finally {
    await c.end();
  }
}
check();
