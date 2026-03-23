const SUPABASE_URL = 'https://imxwpacwtphekrbgwbph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteHdwYWN3dHBoZWtyYmd3YnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDg3NzAsImV4cCI6MjA4OTU4NDc3MH0.4UEhD5nbt-WaEjyJ0pdWx1rgdIFZLnin0lOHaMFAhQE';

const globalObject = typeof window !== 'undefined' ? window : self;

// Se a página rodar dentro da extensão (chrome-extension://), usamos o Padrão Nativo Síncrono (0 bugs de loop)
const isExtensionPage = typeof window !== 'undefined' && window.location && window.location.protocol === 'chrome-extension:';

// Para o WhatsApp Web (Content Script), lemos assincronamente (Seguro, pois não há redirect no WPP)
const contentScriptStorage = {
  getItem: (key) => new Promise(resolve => {
    chrome.storage.local.get([key], res => {
      resolve(typeof res[key] === 'object' ? JSON.stringify(res[key]) : (res[key] || null));
    });
  }),
  setItem: (key, value) => new Promise(resolve => {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    chrome.storage.local.set({ [key]: valStr }, resolve);
  }),
  removeItem: (key) => new Promise(resolve => {
    chrome.storage.local.remove([key], resolve);
  })
};

if (globalObject.supabase) {
  const authOpts = isExtensionPage 
    ? {} // Default = window.localStorage síncrono (Perfeito para o Painel/Login)
    : { storage: contentScriptStorage }; // Lendo os dados compartilhados
    
  globalObject.supabaseClient = globalObject.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: authOpts
  });
  
  if (isExtensionPage) {
    // Escuta logins na Extensão e copia o token para o Content Script usar
    globalObject.supabaseClient.auth.onAuthStateChange((event, session) => {
      const storageKey = 'sb-' + SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token';
      if (session) {
        chrome.storage.local.set({ [storageKey]: JSON.stringify(session) });
      } else {
        chrome.storage.local.remove([storageKey]);
      }
    });
  }
  
  console.log('[Supabase] Cliente inicializado. Modo:', isExtensionPage ? 'Extensão' : 'Content Script');
} else {
  console.error('[Supabase] Biblioteca não encontrada.');
}
