const { Client } = require('pg');
const c = new Client('postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres');

async function check() {
  try {
    await c.connect();
    
    // 1. Check Profiles columns
    console.log("--- COLUNAS DE PROFILES ---");
    const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
    cols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    // 2. See how many users are in Profiles
    console.log("\n--- REGISTROS EM PROFILES ---");
    const profs = await c.query("SELECT id, email, nome, avatar_url FROM profiles LIMIT 5");
    console.log(profs.rows);

    // 3. See how many users are in Auth
    console.log("\n--- USUÁRIOS NO AUTH ---");
    const auths = await c.query("SELECT id, email FROM auth.users LIMIT 5");
    console.log(auths.rows);

  } catch (err) {
    console.error("ERRO:", err);
  } finally {
    await c.end();
  }
}
check();
