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
    const { data } = await supabaseClient.auth.getSession();
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
