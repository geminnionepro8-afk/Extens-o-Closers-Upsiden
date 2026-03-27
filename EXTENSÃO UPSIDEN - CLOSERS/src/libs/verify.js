const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.imxwpacwtphekrbgwbph:C6J7ydUE2u8OILFi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres' });
client.connect().then(() => client.query('SELECT * FROM config_automacao')).then(r => {console.log('Automacao rows:', r.rows); client.end();}).catch(console.error);
