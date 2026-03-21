const SUPABASE_URL = 'https://imxwpacwtphekrbgwbph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteHdwYWN3dHBoZWtyYmd3YnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDg3NzAsImV4cCI6MjA4OTU4NDc3MH0.4UEhD5nbt-WaEjyJ0pdWx1rgdIFZLnin0lOHaMFAhQE';

const globalObject = typeof window !== 'undefined' ? window : self;

if (globalObject.supabase) {
  globalObject.supabaseClient = globalObject.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[Supabase] Cliente inicializado com sucesso.');
} else {
  console.error('[Supabase] Biblioteca não encontrada. Inclua supabase.min.js antes de incluir supabase_config.js.');
}
