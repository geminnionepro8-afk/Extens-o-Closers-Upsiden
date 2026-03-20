/* ==========================================================
   Upsiden — Supabase REST Client (Lightweight, no SDK needed)
   Auth + Database (PostgREST) + Storage
   ========================================================== */

const SUPABASE_URL = 'https://imxwpacwtphekrbgwbph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteHdwYWN3dHBoZWtyYmd3YnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDg3NzAsImV4cCI6MjA4OTU4NDc3MH0.4UEhD5nbt-WaEjyJ0pdWx1rgdIFZLnin0lOHaMFAhQE';

// ===================== AUTH =====================
class UpsidenAuth {
  static SESSION_KEY = 'upsiden_session';

  static async getSession() {
    return new Promise(r => chrome.storage.local.get(this.SESSION_KEY, d => r(d[this.SESSION_KEY] || null)));
  }

  static async saveSession(session) {
    return new Promise(r => chrome.storage.local.set({ [this.SESSION_KEY]: session }, r));
  }

  static async clearSession() {
    return new Promise(r => chrome.storage.local.remove(this.SESSION_KEY, r));
  }

  static async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Falha no login');
    await this.saveSession(data);
    return data;
  }

  static async signUp(email, password, nome = '') {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password, data: { nome: nome || email.split('@')[0] } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Falha no cadastro');
    if (data.access_token) await this.saveSession(data);
    return data;
  }

  static async signOut() {
    const s = await this.getSession();
    if (s?.access_token) {
      fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${s.access_token}`, 'apikey': SUPABASE_ANON_KEY }
      }).catch(() => {});
    }
    await this.clearSession();
  }

  static async refreshToken() {
    const s = await this.getSession();
    if (!s?.refresh_token) return null;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!res.ok) { await this.clearSession(); return null; }
    const data = await res.json();
    await this.saveSession(data);
    return data;
  }

  static async getValidToken() {
    let s = await this.getSession();
    if (!s?.access_token) return null;
    try {
      const payload = JSON.parse(atob(s.access_token.split('.')[1]));
      if (payload.exp * 1000 < Date.now() - 60000) {
        s = await this.refreshToken();
      }
    } catch { s = await this.refreshToken(); }
    return s?.access_token || null;
  }

  static async getUserId() {
    const s = await this.getSession();
    return s?.user?.id || null;
  }

  static async getProfile() {
    const token = await this.getValidToken();
    if (!token) return null;
    const uid = (await this.getSession())?.user?.id;
    if (!uid) return null;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    if (!res.ok) return null;
    return await res.json();
  }

  static async isAdmin() {
    const p = await this.getProfile();
    return p?.role === 'admin';
  }
}

// ===================== DATABASE (PostgREST) =====================
class UpsidenDB {
  static from(table) { return new QueryBuilder(table); }
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._params = [];
    this._select = '*';
    this._method = 'GET';
    this._body = null;
    this._headers = {};
    this._isSingle = false;
  }

  select(cols = '*') { this._select = cols; return this; }

  eq(col, val) { this._params.push(`${col}=eq.${val}`); return this; }
  neq(col, val) { this._params.push(`${col}=neq.${val}`); return this; }
  gt(col, val) { this._params.push(`${col}=gt.${val}`); return this; }
  gte(col, val) { this._params.push(`${col}=gte.${val}`); return this; }
  lt(col, val) { this._params.push(`${col}=lt.${val}`); return this; }
  lte(col, val) { this._params.push(`${col}=lte.${val}`); return this; }
  like(col, val) { this._params.push(`${col}=like.${val}`); return this; }
  ilike(col, val) { this._params.push(`${col}=ilike.${val}`); return this; }
  is(col, val) { this._params.push(`${col}=is.${val}`); return this; }
  in(col, vals) { this._params.push(`${col}=in.(${vals.join(',')})`); return this; }
  or(expr) { this._params.push(`or=(${expr})`); return this; }

  order(col, asc = true) { this._params.push(`order=${col}.${asc ? 'asc' : 'desc'}`); return this; }
  limit(n) { this._params.push(`limit=${n}`); return this; }
  single() { this._isSingle = true; this._headers['Accept'] = 'application/vnd.pgrst.object+json'; return this; }

  insert(data) {
    this._method = 'POST';
    this._body = data;
    this._headers['Prefer'] = 'return=representation';
    return this;
  }

  upsert(data) {
    this._method = 'POST';
    this._body = data;
    this._headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
    return this;
  }

  update(data) {
    this._method = 'PATCH';
    this._body = data;
    this._headers['Prefer'] = 'return=representation';
    return this;
  }

  delete() { this._method = 'DELETE'; return this; }

  async execute() {
    const token = await UpsidenAuth.getValidToken();
    const qs = this._params.length ? this._params.join('&') : '';
    const selectParam = this._method === 'GET' ? `select=${this._select}` : '';
    const parts = [selectParam, qs].filter(Boolean).join('&');
    const url = `${SUPABASE_URL}/rest/v1/${this.table}${parts ? '?' + parts : ''}`;

    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...this._headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method: this._method, headers };
    if (this._body) opts.body = JSON.stringify(this._body);

    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.details || 'Erro no banco de dados');
    }
    if (this._method === 'DELETE' && !this._headers['Prefer']) return { success: true };
    return await res.json();
  }
}

// ===================== STORAGE =====================
class UpsidenStorage {
  static async upload(bucket, path, file, contentType) {
    const token = await UpsidenAuth.getValidToken();
    if (!token) throw new Error('Não autenticado');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    };
    if (contentType) headers['Content-Type'] = contentType;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers,
      body: file
    });

    if (!res.ok) {
      // Try upsert if file already exists
      if (res.status === 409) {
        const res2 = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: 'PUT',
          headers,
          body: file
        });
        if (!res2.ok) throw new Error('Falha no upload (upsert)');
        return await res2.json();
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Falha no upload');
    }
    return await res.json();
  }

  static async download(bucket, path) {
    const token = await UpsidenAuth.getValidToken();
    if (!token) throw new Error('Não autenticado');
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error('Falha no download');
    return await res.blob();
  }

  static async remove(bucket, paths) {
    const token = await UpsidenAuth.getValidToken();
    if (!token) throw new Error('Não autenticado');
    const arr = Array.isArray(paths) ? paths : [paths];
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefixes: arr })
    });
    if (!res.ok) throw new Error('Falha ao deletar arquivo');
    return true;
  }

  static signedUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/authenticated/${bucket}/${path}`;
  }
}

// ===================== METRICS =====================
class UpsidenMetrics {
  static async registrar(tipo, recursoId = null, chatId = null) {
    try {
      const uid = await UpsidenAuth.getUserId();
      if (!uid) return;
      await UpsidenDB.from('metricas_envio').insert({
        closer_id: uid,
        tipo,
        recurso_id: recursoId,
        chat_id: chatId
      }).execute();
    } catch (e) {
      console.warn('[Metrics] Falha ao registrar métrica:', e.message);
    }
  }
}

// ===================== AUTH GUARD =====================
async function verificarAuth() {
  const token = await UpsidenAuth.getValidToken();
  return !!token;
}
