/**
 * @file auth.service.js
 * @description Wrapper de Autenticação utilizando o Supabase SDK oficial v2.
 * @module Módulo 07: Serviços (Autenticação)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

class UpsidenAuth {
  static async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  }
  static async signUp(email, password, nome) {
    const { data, error } = await supabaseClient.auth.signUp({
      email, password, options: { data: { nome } }
    });
    if (error) throw new Error(error.message);
    return data;
  }
  static async signOut() { await supabaseClient.auth.signOut(); }
  static async getSession() {
    let { data, error } = await supabaseClient.auth.getSession();
    if (!data.session) {
      const storageKey = 'sb-imxwpacwtphekrbgwbph-auth-token';
      const fallback = await new Promise(r => chrome.storage.local.get([storageKey], res => r(res[storageKey])));
      if (fallback) {
        console.warn('[UpsidenAuth] Corrida assíncrona. Restaurando sessão manualmente...', fallback);
        try {
          const parsed = typeof fallback === 'string' ? JSON.parse(fallback) : fallback;
          if (parsed && parsed.access_token) {
            const { data: retry } = await supabaseClient.auth.setSession({ 
              access_token: parsed.access_token, 
              refresh_token: parsed.refresh_token 
            });
            return retry.session;
          }
        } catch(e) { console.error('[UpsidenAuth] Erro no fallback', e); }
      }
    }
    return data.session;
  }
  static async getValidToken() {
    const session = await this.getSession();
    return session ? session.access_token : null;
  }
  static async getUserId() {
    const session = await this.getSession();
    return session && session.user ? session.user.id : null;
  }
  static async getProfile() {
    const { data } = await supabaseClient.from('profiles').select('*').single();
    return data;
  }
  static async isAdmin() {
    const p = await this.getProfile();
    return p && p.role === 'admin';
  }
}

async function verificarAuth() {
  const token = await UpsidenAuth.getValidToken();
  return !!token;
}
