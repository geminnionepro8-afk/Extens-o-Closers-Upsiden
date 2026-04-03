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
  switch(mode) { 
    if (this.MODES.includes(mode)) { 
      this.current = mode; 
      this.apply(); 
      renderizar(); 
    } 
  },
  showPreview(m) {
    const root = window.$upsRoot || document;
    let modal = root.querySelector('#media-preview-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'media-preview-modal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.92); backdrop-filter:blur(30px); z-index:99999; display:none; align-items:center; justify-content:center; padding:40px; cursor:default;';
      modal.innerHTML = `
        <div class="preview-content" style="position:relative; width:100%; max-width:1100px; display:flex; flex-direction:column; align-items:center; gap:24px; animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          <div id="preview-media-container" style="box-shadow: 0 40px 100px rgba(0,0,0,0.8); border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background: #000; width: fit-content; max-width: 100%;"></div>
          
          <div class="preview-info-panel" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 24px; border-radius: 20px; min-width: 320px; display: flex; flex-direction: column; gap: 20px; backdrop-filter: blur(10px);">
            <div style="text-align: center;">
              <h3 id="preview-title" style="margin:0; font-size:20px; font-weight:700; color: #fff;"></h3>
              <p id="preview-meta" style="margin:6px 0 0; color:rgba(255,255,255,0.4); font-size:13px; font-weight:500;"></p>
            </div>
            
            <div class="preview-actions" style="display: flex; gap: 12px; justify-content: center;">
              <button class="btn-preview-action btn-send-now" style="background: var(--accent-gradient); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                <span>Enviar Agora</span>
              </button>
              <button class="btn-preview-action btn-access-cfg" style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 12px 18px; border-radius: 12px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6z"/></svg>
                <span>Acesso</span>
              </button>
              <button class="btn-preview-action btn-delete-now" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
          
          <button id="close-preview" style="position:fixed; top:30px; right:30px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; width:48px; height:48px; border-radius:50%; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s; backdrop-filter: blur(10px);">✕</button>
        </div>
        <style>
          @keyframes zoomIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
          .btn-preview-action:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
          .btn-preview-action:active { transform: translateY(0); }
          .btn-delete-now:hover { background: #ef4444 !important; color: #fff !important; }
        </style>
      `;
      
      modal.querySelector('#close-preview').onclick = () => { modal.style.display = 'none'; };
      modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
      document.body.appendChild(modal);
    }

    const container = modal.querySelector('#preview-media-container');
    const isVideo = isTipoVideo(m.tipo);
    const thumbUrl = CACHE.thumbs[m.id] || m._url || '';

    container.innerHTML = isVideo 
      ? `<video src="${thumbUrl}" controls autoplay style="max-width:90vw; max-height:65vh; display:block; border-radius: 12px;"></video>`
      : `<img src="${thumbUrl}" style="max-width:90vw; max-height:65vh; display:block; object-fit:contain; border-radius: 12px;">`;
    
    modal.querySelector('#preview-title').textContent = m.nome;
    modal.querySelector('#preview-meta').textContent = `${formatarTamanho(m.tamanho)} · ${m.tipo?.split('/')[1]?.toUpperCase()} Media · ${fmtDate(m.created_at)}`;
    
    // Assign actions
    modal.querySelector('.btn-send-now').onclick = () => { ENVIAR_MIDIA(m.id); modal.style.display = 'none'; };
    modal.querySelector('.btn-access-cfg').onclick = () => { CONFIGURAR_ACESSO(m.id); };
    modal.querySelector('.btn-delete-now').onclick = () => { if(confirm('Excluir permanentemente?')) { EXCLUIR_MIDIA(m.id); modal.style.display = 'none'; } };

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
  const tableHeader = root.querySelector('.mod-table-header'); // Header fixo do HTML

  const busca = (root.querySelector('#media-busca')?.value || '').toLowerCase();
  let filtradas = midias.filter(m => m.nome.toLowerCase().includes(busca));

  if (filtroTipo === 'imagem') filtradas = filtradas.filter(m => isTipoImagem(m.tipo));
  else if (filtroTipo === 'video') filtradas = filtradas.filter(m => isTipoVideo(m.tipo));
  else if (filtroTipo === 'equipe') filtradas = filtradas.filter(m => m.compartilhado);

  grid.innerHTML = '';
  if (filtradas.length === 0) {
    grid.style.display = 'none'; vazio.style.display = 'flex';
    if (tableHeader) tableHeader.style.display = 'none';
  } else {
    vazio.style.display = 'none';
    const mode = ViewSvc.current;
    
    if (mode === 'grid' || mode === 'big-grid') {
      // GRID MODES (PRESERVED)
      if (tableHeader) tableHeader.style.display = 'none';
      grid.style.display = 'grid';
      grid.className = `mod-list view-mode-${mode} module-grid-view`;

      filtradas.forEach((m, i) => {
        const isVideo = isTipoVideo(m.tipo);
        const item = document.createElement('div');
        item.className = 'grid-thumb-item card-enter';
        item.dataset.id = m.id;
        item.style.animationDelay = `${i * 15}ms`;
        item.innerHTML = `
          <div class="thumb-wrapper" id="thumb-${m.id}">
             ${isVideo ? '🎬' : '🖼️'}
          </div>
          <div class="thumb-overlay-info">
             <span>${m.nome}</span>
          </div>
        `;
        grid.appendChild(item);
      });
    } else if (mode === 'list') {
      // REAL TABLE MODE
      if (tableHeader) tableHeader.style.display = 'none'; // Usar header interno da tabela
      grid.style.display = 'block';
      grid.className = 'mod-list view-mode-list module-table-view';
      
      let tableHtml = `
        <table class="media-data-table">
          <thead>
            <tr>
              <th width="60">Preview</th>
              <th>Nome da Mídia</th>
              <th width="120">Tamanho</th>
              <th width="120">Tipo</th>
              <th width="150">Data de Upload</th>
              <th width="140">Ações</th>
            </tr>
          </thead>
          <tbody>
      `;

      filtradas.forEach((m, i) => {
        const isVideo = isTipoVideo(m.tipo);
        const ext = getExtensao(m.nome);
        tableHtml += `
          <tr class="card-enter" style="animation-delay: ${i * 20}ms">
            <td>
              <div class="table-thumb" id="thumb-${m.id}">${isVideo ? '🎬' : '🖼️'}</div>
            </td>
            <td>
              <div class="table-name-cell">
                <span class="m-name">${m.nome}</span>
                ${m.compartilhado ? '<span class="m-tag">TIME</span>' : ''}
              </div>
            </td>
            <td class="txt-muted">${formatarTamanho(m.tamanho)}</td>
            <td class="txt-muted">${ext}</td>
            <td class="txt-muted">${fmtDate(m.created_at)}</td>
            <td>
              <div class="table-actions">
                <button class="btn-t-action" title="Acesso" onclick="CONFIGURAR_ACESSO('${m.id}')">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                </button>
                <button class="btn-t-action btn-t-danger" title="Excluir" onclick="EXCLUIR_MIDIA('${m.id}')">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
                <button class="btn-t-primary" onclick="ENVIAR_MIDIA('${m.id}')">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tableHtml += `</tbody></table>`;
      grid.innerHTML = tableHtml;

    } else {
      // REAL LIST MODE (Details)
      if (tableHeader) tableHeader.style.display = 'none';
      grid.style.display = 'flex';
      grid.className = 'mod-list view-mode-details module-list-view';

      filtradas.forEach((m, i) => {
        const isVideo = isTipoVideo(m.tipo);
        const item = document.createElement('div');
        item.className = 'media-list-item card-enter';
        item.style.animationDelay = `${i * 25}ms`;
        item.innerHTML = `
          <div class="list-item-left" id="thumb-${m.id}">
            ${isVideo ? '🎬' : '🖼️'}
          </div>
          <div class="list-item-body">
            <div class="item-title-row">
              <span class="item-name">${m.nome}</span>
              ${m.compartilhado ? '<span class="item-badge">TIME</span>' : ''}
              ${m.acesso_individual?.length ? '<span class="item-badge private">PRIVADO</span>' : ''}
            </div>
            <div class="item-meta-row">
              <span>${getExtensao(m.nome)} Media</span>
              <span class="sep">·</span>
              <span>${formatarTamanho(m.tamanho)}</span>
              <span class="sep">·</span>
              <span>${fmtDate(m.created_at)}</span>
            </div>
          </div>
          <div class="list-item-actions">
            <button class="btn-list" onclick="CONFIGURAR_ACESSO('${m.id}')" title="Acesso">⚙️</button>
            <button class="btn-list btn-l-danger" onclick="EXCLUIR_MIDIA('${m.id}')" title="Excluir">🗑️</button>
            <button class="btn-l-primary" onclick="ENVIAR_MIDIA('${m.id}')">Enviar Agora</button>
          </div>
        `;
        grid.appendChild(item);
      });
    }

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

  // Action Helpers
  window.ENVIAR_MIDIA = async (id) => {
    const m = midias.find(x => x.id === id);
    if (!m) return;
    try {
      const blob = await UpsidenStorage.download('midias', m.storage_path);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        chrome.runtime.sendMessage({
          tipo: 'enviar_midia_biblioteca',
          dados: { base64, tipo: m.tipo, nome: m.nome }
        }, (res) => {
          if (res?.sucesso) {
            window.parent.toast('Mídia enviada com sucesso!', 'success');
            UpsidenMetrics.registrar('midia', id);
          }
        });
      };
      reader.readAsDataURL(blob);
    } catch(e) { console.error('Send error', e); }
  };

  window.CONFIGURAR_ACESSO = (id) => {
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
  };

  window.EXCLUIR_MIDIA = async (id) => {
    const m = midias.find(x => x.id === id);
    if (m) {
      await UpsidenStorage.remove('midias', [m.storage_path]).catch(() => {});
      await UpsidenDB.from('midias').eq('id', id).delete().execute();
      midias = midias.filter(x => x.id !== id);
      renderizar();
      window.parent.toast('Mídia removida.', 'info');
    }
  };

  // Grid click delegation
  const gridCont = root.querySelector('#media-grid');
  if (gridCont) {
    gridCont.addEventListener('click', async (e) => {
      const btnAction = e.target.closest('[data-action]');
      const mediaThumb = e.target.closest('.grid-thumb-item, .table-thumb, .list-item-left');
      
      if (mediaThumb) {
        let id = mediaThumb.dataset.id;
        if (!id && mediaThumb.id) id = mediaThumb.id.replace('thumb-', '');
        
        const m = midias.find(x => x.id === id);
        if (m) ViewSvc.showPreview(m);
        return;
      }

      if (btnAction) {
        const action = btnAction.dataset.action;
        const row = btnAction.closest('.mod-row');
        const thumbEl = row.querySelector('[id^="thumb-"]');
        if (!thumbEl) return;
        const id = thumbEl.id.replace('thumb-', '');

        if (action === 'delete') window.EXCLUIR_MIDIA(id);
        if (action === 'access') window.CONFIGURAR_ACESSO(id);
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
