/* =========================================
   Upsiden — Biblioteca de Documentos (Red Sun)
   ========================================= */

// 1. MODULE STATE (Shared via Parent Cache)
const CACHE = (function() {
  try {
    if (!window.parent.__UPS_CACHE__) window.parent.__UPS_CACHE__ = { audios: [], pastas: [], docs: [], midias: [], thumbs: {} };
    return window.parent.__UPS_CACHE__;
  } catch(e) { return { audios: [], pastas: [], docs: [], midias: [], thumbs: {} }; }
})();

let documentos = CACHE.docs || [];
let buscaAtual = '';
let filtroCategoria = 'todos';
let userId = null;
let isAdmin = false;

const ViewSvc = {
  MODES: ['list', 'details', 'grid', 'big-grid'],
  current: 'details',
  init() {
    this.current = localStorage.getItem('upsiden_view_documentos') || 'details';
    this.apply();
    this.setupZoom();
  },
  apply() {
    const root = window.$upsRoot || document;
    const app = root.querySelector('.mod-app'); if (!app) return;
    this.MODES.forEach(m => app.classList.remove(`view-mode-${m}`));
    app.classList.add(`view-mode-${this.current}`);
    root.querySelectorAll('.btn-view-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.current);
    });
    localStorage.setItem('upsiden_view_documentos', this.current);
  },
  switch(mode) { if (this.MODES.includes(mode)) { this.current = mode; this.apply(); } },
  setupZoom() {
    if (window._upsZoomDocs) return;
    window._upsZoomDocs = true;
    let accum = 0;
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        accum += e.deltaY;
        const threshold = 60;
        if (Math.abs(accum) >= threshold) {
          const idx = this.MODES.indexOf(this.current);
          if (accum > 0 && idx > 0) this.switch(this.MODES[idx - 1]);
          else if (accum < 0 && idx < this.MODES.length - 1) this.switch(this.MODES[idx + 1]);
          accum = 0;
        }
      }
    }, { passive: false });
  }
};

function syncTheme() {
  const getTheme = () => {
    try {
      return window.parent.document.documentElement.getAttribute('data-theme') || 
             (window.parent.document.body.classList.contains('theme-light') ? 'light' : 'dark');
    } catch (e) { return 'dark'; }
  };
  const apply = () => {
    const theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);
  };
  apply();
  try {
    const observer = new MutationObserver(apply);
    observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    window.addEventListener('unload', () => observer.disconnect());
  } catch (e) {}
}

function formatarTamanho(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch(e) { return '—'; }
}

function iconeDoTipo(tipo) {
  if (!tipo) return '📄';
  if (tipo.includes('pdf')) return '📕';
  if (tipo.includes('word') || tipo.includes('doc')) return '📘';
  if (tipo.includes('sheet') || tipo.includes('excel') || tipo.includes('csv')) return '📗';
  if (tipo.includes('presentation') || tipo.includes('powerpoint')) return '📙';
  if (tipo.includes('text')) return '📝';
  return '📄';
}

function getExtLabel(nome) {
  if (!nome) return 'FILE';
  const ext = nome.split('.').pop().toUpperCase();
  return ext.length <= 5 ? ext : 'FILE';
}

async function carregarDocs() {
  const profile = await UpsidenAuth.getProfile();
  if (!profile) return;
  
  userId = profile.id;
  isAdmin = (profile.role === 'admin');
  const teamAdminId = isAdmin ? profile.id : profile.admin_id;

  // Render cache instantly
  if (documentos.length > 0) renderizar();

  try {
    let query = UpsidenDB.from('documentos').select('*').eq('admin_id', teamAdminId);
    if (!isAdmin) {
      query = query.or(`criado_por.eq.${userId},compartilhado.eq.true`);
    }

    const data = await query.order('created_at', false).execute();
    documentos = data || [];
    CACHE.docs = [...documentos];
  } catch(e) {}
}

function renderizar() {
  const root = window.$upsRoot || document;
  const lista = root.querySelector('#doc-lista');
  const vazio = root.querySelector('#doc-vazio');
  const count = root.querySelector('#doc-count');

  const busca = (root.querySelector('#doc-busca')?.value || '').toLowerCase();
  let filtrados = documentos.filter(d => d.nome.toLowerCase().includes(busca));
  if (filtroCategoria === 'equipe') filtrados = filtrados.filter(d => d.compartilhado);

  lista.innerHTML = '';
  if (filtrados.length === 0) {
    lista.style.display = 'none'; vazio.style.display = 'flex';
  } else {
    lista.style.display = 'flex'; vazio.style.display = 'none';
    lista.className = 'module-structured-list';
    
      filtrados.forEach((doc, i) => {
        const row = document.createElement('div');
        row.className = 'mod-row card-enter';
        row.style.animationDelay = `${i * 30}ms`;
        
        const ext = getExtLabel(doc.nome);
        const colorClass = getDocColor(ext);
        
        row.innerHTML = `
          <div class="row-main">
            <div class="doc-miniature ${colorClass}">
              <span class="mini-ext">${ext}</span>
              <div class="mini-line"></div>
              <div class="mini-line"></div>
            </div>
            <div class="row-details">
              <div class="row-name-line">
                <div class="doc-body">
                  <div class="doc-title">
                    ${doc.nome}
                    ${doc.compartilhado ? '<span class="doc-tag">TIME</span>' : ''}
                    ${doc.acesso_individual && doc.acesso_individual.length > 0 ? '<span class="doc-tag" style="background:var(--accent);color:white;">PRIVADO+</span>' : ''}
                  </div>
                </div>
              </div>
              <div class="row-sub">
                <span>${ext} Document</span>
                <span class="dot">·</span>
                <span>Português</span>
              </div>
            </div>
          </div>

        <div class="row-stats">
          <div class="stat-group">
            <span class="stat-val">${formatarTamanho(doc.tamanho)}</span>
            <span class="stat-lab">Tamanho</span>
          </div>
        </div>

        <div class="row-meta">
          <span class="date-badge">${fmtDate(doc.created_at)}</span>
        </div>

        <div class="row-actions" style="display: flex; align-items: center; gap: 8px;">
           <button class="btn-dim" data-action="access" title="Configurar Acesso" style="padding: 10px; border-radius: 12px; flex: 0 0 38px;">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
           </button>
           <button class="btn-dim" data-action="delete" title="Remover" style="padding: 10px; border-radius: 12px; flex: 0 0 38px;">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
           </button>
           <button class="btn-send-main action-btn-main" data-id="${doc.id}" style="flex: 1; padding: 10px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; background: var(--accent); color: white; border: none; cursor: pointer;">
             <svg viewBox="0 0 24 24" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
             <span>Enviar</span>
           </button>
        </div>
      `;
      lista.appendChild(row);
    });
  }

  if(count) count.textContent = `${filtrados.length} documento${filtrados.length !== 1 ? 's' : ''}`;
}

function getDocColor(ext) {
  const e = ext.toLowerCase();
  if (e === 'pdf') return 'mini-red';
  if (['doc', 'docx'].includes(e)) return 'mini-blue';
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'mini-green';
  if (['ppt', 'pptx'].includes(e)) return 'mini-orange';
  return 'mini-gray';
}

const Actions = {
  async enviar(id) {
    const doc = documentos.find(d => d.id === id);
    if (!doc) return;
    try {
      const blob = await UpsidenStorage.download('documentos', doc.storage_path);
      const reader = new FileReader();
      reader.onload = () => {
        window.parent.postMessage({
          type: 'upsiden_send_file',
          data: { nome: doc.nome, tipo: doc.tipo, base64: reader.result }
        }, '*');
        UpsidenMetrics.registrar('documento', doc.id);
      };
      reader.readAsDataURL(blob);
    } catch (err) { console.error('Send error', err); }
  },

  async excluir(id) {
    if (!confirm('Excluir este documento permanentemente?')) return;
    try {
      const doc = documentos.find(d => d.id === id);
      if (doc) {
        await UpsidenStorage.remove('documentos', [doc.storage_path]).catch(() => {});
        await UpsidenDB.from('documentos').eq('id', id).delete().execute();
        documentos = documentos.filter(d => d.id !== id);
        renderizar();
        if (window.parent.toast) window.parent.toast('Documento removido', 'success');
      }
    } catch(e) { console.error('Delete error', e); }
  },

  async gerenciarAcesso(id) {
    const doc = documentos.find(d => d.id === id);
    if (!doc) return;
    if (doc.criado_por !== userId && !isAdmin) {
      if (window.parent.toast) window.parent.toast('Apenas o autor pode configurar o acesso.', 'error');
      return;
    }
    if (window.parent.abrirModalAcesso) {
      window.parent.abrirModalAcesso('documentos', doc, (novosDados) => {
        Object.assign(doc, novosDados);
        renderizar();
      });
    }
  }
};

async function boot() {
  const root = window.$upsRoot || document;
  syncTheme();
  ViewSvc.init();

  // Tabs / View Switcher
  if (!root._upsClickDocs) {
    root._upsClickDocs = true;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.lib-tab-btn, .btn-view-mode, [data-action]');
      if (!btn) return;
      if (btn.classList.contains('lib-tab-btn')) {
        const tabTarget = btn.dataset.tab;
        if (tabTarget && tabTarget !== 'documentos') window.parent.switchBibliotecaTab(tabTarget);
      } else if (btn.classList.contains('btn-view-mode')) {
        const viewTarget = btn.dataset.view;
        if (viewTarget) ViewSvc.switch(viewTarget);
      } else if (btn.dataset.action) {
        const id = btn.closest('.mod-row').querySelector('[data-id]').dataset.id;
        const action = btn.dataset.action;
        if (action === 'send') Actions.enviar(id);
        if (action === 'delete') Actions.excluir(id);
        if (action === 'access') Actions.gerenciarAcesso(id);
      }
    });
  }

  // Search
  const buscaInput = root.querySelector('#doc-busca');
  if (buscaInput) buscaInput.addEventListener('input', (e) => { buscaAtual = e.target.value; renderizar(); });

  // Upload
  const upload = root.querySelector('#doc-upload');
  if (upload) {
    upload.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        try {
          const storagePath = `${userId}/${Date.now()}_${file.name}`;
          await UpsidenStorage.upload('documentos', storagePath, file, file.type);
          const profile = await UpsidenAuth.getProfile();
          const teamAdminId = profile.role === 'admin' ? profile.id : profile.admin_id;

          const data = await UpsidenDB.from('documentos').insert({
            nome: file.name, tipo: file.type, tamanho: file.size,
            storage_path: storagePath, criado_por: userId, admin_id: teamAdminId, compartilhado: isAdmin
          }).select().execute();
          if (data && data.length) documentos.unshift(data[0]);
        } catch (err) { console.error('Upload failed:', err); }
      }
      renderizar();
      atualizarBadges();
      e.target.value = '';
    });
  }

  // List click delegation
  const listaCont = root.querySelector('#doc-lista');
  if (listaCont) {
    listaCont.addEventListener('click', async (e) => {
      const btnAction = e.target.closest('[data-action]');
      const btnSend = e.target.closest('.action-btn-main');
      
      if (btnAction) {
        const action = btnAction.dataset.action;
        const id = btnAction.closest('.mod-row').querySelector('[data-id]').dataset.id;
        if (action === 'delete') Actions.excluir(id);
        if (action === 'access') Actions.gerenciarAcesso(id);
        return;
      }

      if (btnSend) {
        Actions.enviar(btnSend.dataset.id);
      }
    });
  }

  if (!(await verificarAuth())) {
    const app = root.querySelector('.mod-app');
    if (app) app.innerHTML = '<p style="padding:20px;color:var(--text-muted);text-align:center;">Faça login para acessar os documentos.</p>';
    return;
  }

  try {
    await carregarDocs();
    atualizarBadges();
  } catch (e) {
    console.error('Erro ao carregar documentos:', e);
  } finally {
    renderizar();
  }

  async function atualizarBadges() {
    // Instant cache update
    const ba = root.querySelector('#badge-audios'); if(ba) ba.textContent = CACHE.audios.length || 0;
    const bd = root.querySelector('#badge-documentos'); if(bd) bd.textContent = CACHE.docs.length || 0;
    const bm = root.querySelector('#badge-midias'); if(bm) bm.textContent = CACHE.midias.length || 0;

    try {
      const [a, d, m] = await Promise.all([
        UpsidenDB.from('audios').select('id', { count: 'exact' }).execute().catch(()=>[]),
        UpsidenDB.from('documentos').select('id', { count: 'exact' }).execute().catch(()=>[]),
        UpsidenDB.from('midias').select('id', { count: 'exact' }).execute().catch(()=>[])
      ]);
      if(ba) ba.textContent = a?.length || 0;
      if(bd) bd.textContent = d?.length || 0;
      if(bm) bm.textContent = m?.length || 0;
    } catch(e) {}
  }
}

// Global hook for panel navigation
window.upsInit_documentos = boot;

// Auto-boot if loaded directly
if (window.$upsRoot) boot(); else document.addEventListener('DOMContentLoaded', boot);
