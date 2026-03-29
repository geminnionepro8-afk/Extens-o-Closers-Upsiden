/* =========================================
   Upsiden — Biblioteca de Mídias (Red Sun)
   ========================================= */

// 1. MODULE STATE (Shared via Parent Cache)
const CACHE = (function() {
  try {
    if (!window.parent.__UPS_CACHE__) window.parent.__UPS_CACHE__ = { audios: [], pastas: [], docs: [], midias: [], thumbs: {} };
    return window.parent.__UPS_CACHE__;
  } catch(e) { return { audios: [], pastas: [], docs: [], midias: [], thumbs: {} }; }
})();

let midias = CACHE.midias || [];
let buscaAtual = '';
let filtroTipo = 'todos';
let userId = null;
let isAdmin = false;

const ViewSvc = {
  MODES: ['list', 'details', 'grid', 'big-grid'],
  current: 'details',
  init() {
    this.current = localStorage.getItem('upsiden_view_midias') || 'details';
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
    localStorage.setItem('upsiden_view_midias', this.current);
  },
  switch(mode) { if (this.MODES.includes(mode)) { this.current = mode; this.apply(); } },
  showPreview(m) {
    const root = window.$upsRoot || document;
    let modal = root.querySelector('#media-preview-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'media-preview-modal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(20px); z-index:99999; display:none; align-items:center; justify-content:center; padding:40px; cursor:zoom-out;';
      modal.innerHTML = `
        <div class="preview-content" style="position:relative; max-width:100%; max-height:100%; display:flex; flex-direction:column; align-items:center; gap:20px; animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          <div id="preview-media-container" style="box-shadow: 0 20px 60px rgba(0,0,0,0.5); border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background: #000;"></div>
          <div class="preview-info" style="color:white; text-align:center;">
            <h3 id="preview-title" style="margin:0; font-size:18px; font-weight:700;"></h3>
            <p id="preview-meta" style="margin:5px 0 0; color:rgba(255,255,255,0.5); font-size:14px; font-weight:500;"></p>
          </div>
          <button style="position:fixed; top:30px; right:30px; background:rgba(255,255,255,0.1); border:none; color:white; width:44px; height:44px; border-radius:50%; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
        </div>
        <style>
          @keyframes zoomIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        </style>
      `;
      modal.onclick = (e) => { modal.style.display = 'none'; };
      document.body.appendChild(modal);
    }

    const container = modal.querySelector('#preview-media-container');
    const isVideo = isTipoVideo(m.tipo);
    const thumbUrl = CACHE.thumbs[m.id] || m._url || '';

    container.innerHTML = isVideo 
      ? `<video src="${thumbUrl}" controls autoplay style="max-width:90vw; max-height:80vh; display:block;"></video>`
      : `<img src="${thumbUrl}" style="max-width:90vw; max-height:80vh; display:block; object-fit:contain;">`;
    
    modal.querySelector('#preview-title').textContent = m.nome;
    modal.querySelector('#preview-meta').textContent = `${formatarTamanho(m.tamanho)} · ${m.tipo?.split('/')[1]?.toUpperCase()} Media`;
    
    modal.style.display = 'flex';
  },
  setupZoom() {
    if (window._upsZoomMidias) return;
    window._upsZoomMidias = true;
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

function formatarTamanho(b) {
  if (!b) return '—';
  return b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}

function isTipoVideo(t) { return t?.includes('video'); }
function isTipoImagem(t) { return t?.includes('image'); }
function getExtensao(n) { return n?.split('.').pop().toUpperCase(); }

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch(e) { return '—'; }
}

async function carregar() {
  const profile = await UpsidenAuth.getProfile();
  if (!profile) return;
  
  userId = profile.id;
  isAdmin = (profile.role === 'admin');
  const teamAdminId = isAdmin ? profile.id : profile.admin_id;

  // Render cache instantly
  if (midias.length > 0) renderizar();

  try {
    let query = UpsidenDB.from('midias').select('*').eq('admin_id', teamAdminId);
    if (!isAdmin) {
      query = query.or(`criado_por.eq.${userId},compartilhado.eq.true`);
    }

    const data = await query.order('created_at', false).execute();
    midias = data || [];
    CACHE.midias = [...midias];
  } catch(e) {}
}

function renderizar() {
  const root = window.$upsRoot || document;
  const grid = root.querySelector('#media-grid');
  const vazio = root.querySelector('#media-vazio');
  const count = root.querySelector('#media-count');

  const busca = (root.querySelector('#media-busca')?.value || '').toLowerCase();
  let filtradas = midias.filter(m => m.nome.toLowerCase().includes(busca));

  if (filtroTipo === 'imagem') filtradas = filtradas.filter(m => isTipoImagem(m.tipo));
  else if (filtroTipo === 'video') filtradas = filtradas.filter(m => isTipoVideo(m.tipo));
  else if (filtroTipo === 'equipe') filtradas = filtradas.filter(m => m.compartilhado);

  grid.innerHTML = '';
  if (filtradas.length === 0) {
    grid.style.display = 'none'; vazio.style.display = 'flex';
  } else {
    grid.style.display = 'flex'; vazio.style.display = 'none';
    grid.className = 'module-structured-list';

    filtradas.forEach((m, i) => {
      const row = document.createElement('div');
      row.className = 'mod-row card-enter';
      row.style.animationDelay = `${i * 30}ms`;
      
      const isVideo = isTipoVideo(m.tipo);
      const isImg = isTipoImagem(m.tipo);
      const ext = getExtensao(m.nome) || (isVideo ? 'MP4' : 'IMG');
      
      row.innerHTML = `
        <div class="row-main">
          <div class="row-avatar media-avatar ${isVideo ? 'video-bg' : 'img-bg'}" id="thumb-${m.id}">
            ${isVideo ? '🎬' : '🖼️'}
          </div>
          <div class="row-details">
            <div class="media-body">
              <div class="media-title">
                ${m.nome}
                ${m.compartilhado ? '<span class="media-tag">TIME</span>' : ''}
                ${m.acesso_individual && m.acesso_individual.length > 0 ? '<span class="media-tag" style="background:var(--accent);color:white;">PRIVADO+</span>' : ''}
              </div>
            </div>
            <div class="row-sub">
              <span>${ext} Media</span>
              <span class="dot">·</span>
              <span>HD Original</span>
            </div>
          </div>
        </div>

        <div class="row-stats">
          <div class="stat-group">
            <span class="stat-val">${formatarTamanho(m.tamanho)}</span>
            <span class="stat-lab">Tamanho</span>
          </div>
        </div>

        <div class="row-meta">
          <span class="date-badge">${fmtDate(m.created_at)}</span>
        </div>

        <div class="row-actions" style="display: flex; align-items: center; gap: 8px;">
           <button class="btn-action-sec" data-action="access" title="Configurar Acesso" style="padding: 10px; border-radius: 12px; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer; transition: 0.2s;">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
             <span>Acesso</span>
           </button>
           <button class="btn-action-danger" data-action="delete" title="Remover" style="padding: 10px; border-radius: 12px; flex: 0 0 44px; display: flex; align-items: center; justify-content: center; background: rgba(241, 71, 71, 0.1); border: 1px solid rgba(241, 71, 71, 0.2); color: #f14747; cursor: pointer; transition: 0.2s;">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
           </button>
        </div>
      `;
      grid.appendChild(row);
    });

    if(count) count.textContent = `${filtradas.length} mídia${filtradas.length !== 1 ? 's' : ''}`;

    // Load thumbnails for images
    filtradas.filter(m => isTipoImagem(m.tipo)).forEach(m => loadThumbnail(m.id, m.storage_path));
  }
}

async function loadThumbnail(id, path) {
  const root = window.$upsRoot || document;
  const el = root.querySelector(`#thumb-${id}`);
  if (!el) return;

  // Use Cached URL if available
  if (CACHE.thumbs[id]) {
    el.innerHTML = `<img src="${CACHE.thumbs[id]}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    return;
  }

  try {
    const blob = await UpsidenStorage.download('midias', path);
    const url = URL.createObjectURL(blob);
    CACHE.thumbs[id] = url; // Persistence in memory
    el.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
  } catch (e) {
    console.error('Thumb load failed', e);
  }
}

async function boot() {
  const root = window.$upsRoot || document;
  syncTheme();
  ViewSvc.init();

  // Tabs / View Switcher
  if (!root._upsClickMidias) {
    root._upsClickMidias = true;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.lib-tab-btn, .btn-view-mode');
      if (!btn) return;
      if (btn.classList.contains('lib-tab-btn')) {
        const tabTarget = btn.dataset.libTab;
        if (tabTarget && tabTarget !== 'midias') window.parent.switchBibliotecaTab(tabTarget);
      } else if (btn.classList.contains('btn-view-mode')) {
        const viewTarget = btn.dataset.view;
        if (viewTarget) ViewSvc.switch(viewTarget);
      }
    });
  }

  // Search
  const buscaInput = root.querySelector('#media-busca');
  if (buscaInput) {
    buscaInput.addEventListener('input', (e) => {
      buscaAtual = e.target.value;
      renderizar();
    });
  }

  // Upload
  const upload = root.querySelector('#media-upload');
  if (upload) {
    upload.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        if (file.size > 25 * 1024 * 1024) continue;
        try {
          const storagePath = `${userId}/${Date.now()}_${file.name}`;
          await UpsidenStorage.upload('midias', storagePath, file, file.type);
          const profile = await UpsidenAuth.getProfile();
          const teamAdminId = profile.role === 'admin' ? profile.id : profile.admin_id;

          const data = await UpsidenDB.from('midias').insert({
            nome: file.name, tipo: file.type, tamanho: file.size,
            storage_path: storagePath, criado_por: userId, admin_id: teamAdminId, compartilhado: isAdmin
          }).select().execute();
          if (data && data.length) midias.unshift(data[0]);
        } catch (err) { console.error('Upload failed:', err); }
      }
      renderizar();
      atualizarBadges();
      e.target.value = '';
    });
  }

  // Grid click delegation (Send / Delete / Access / Preview)
  const gridCont = root.querySelector('#media-grid');
  if (gridCont) {
    gridCont.addEventListener('click', async (e) => {
      const btnAction = e.target.closest('[data-action]');
      const mediaThumb = e.target.closest('.media-avatar');
      
      if (mediaThumb) {
        const id = mediaThumb.id.replace('thumb-', '');
        const m = midias.find(x => x.id === id);
        if (m) ViewSvc.showPreview(m);
        return;
      }

      if (btnAction) {
        const action = btnAction.dataset.action;
        const row = btnAction.closest('.mod-row');
        // Find ID from the row's thumbnail ID
        const thumbEl = row.querySelector('[id^="thumb-"]');
        if (!thumbEl) return;
        const id = thumbEl.id.replace('thumb-', '');

        if (action === 'delete') {
          if (!confirm('Excluir esta mídia permanentemente?')) return;
          const m = midias.find(x => x.id === id);
          if (m) {
            await UpsidenStorage.remove('midias', [m.storage_path]).catch(() => {});
            await UpsidenDB.from('midias').eq('id', id).delete().execute();
            midias = midias.filter(x => x.id !== id);
            renderizar();
          }
        }
        if (action === 'access') {
          const midia = midias.find(m => m.id === id);
          if(!midia) return;
          if(midia.criado_por !== userId && !isAdmin) {
             window.parent.toast('Apenas o autor pode configurar o acesso.', 'error');
             return;
          }
          if (window.parent.abrirModalAcesso) {
            window.parent.abrirModalAcesso('midias', midia, (novosDados) => {
              Object.assign(midia, novosDados);
              renderizar();
            });
          }
        }
        return;
      }
    });
  }

  if (!(await verificarAuth())) {
    const app = root.querySelector('.mod-app');
    if (app) app.innerHTML = '<p style="padding:20px;color:var(--text-muted);text-align:center;">Faça login para acessar as mídias.</p>';
    return;
  }

  try {
    await carregar();
    atualizarBadges();
  } catch (e) {
    console.error('Erro ao carregar mídias:', e);
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
        UpsidenDB.from('audios').select('*', { count: 'exact' }).execute().catch(()=>[]),
        UpsidenDB.from('documentos').select('*', { count: 'exact' }).execute().catch(()=>[]),
        UpsidenDB.from('midias').select('*', { count: 'exact' }).execute().catch(()=>[])
      ]);
      if(ba) ba.textContent = a?.length || 0;
      if(bd) bd.textContent = d?.length || 0;
      if(bm) bm.textContent = m?.length || 0;
      
      // Keep cache in sync with fresh counts
      CACHE.audios_count = a?.length;
      CACHE.docs_count = d?.length;
      CACHE.midias_count = m?.length;
    } catch(e) {}
  }
}

// Global hook for panel navigation
window.upsInit_midias = boot;

// Auto-boot if loaded directly
if (window.$upsRoot) boot(); else document.addEventListener('DOMContentLoaded', boot);
