/**
 * Upsiden Audio Module V5.0 (Clean Slate)
 * Highly Structured EchoTune-inspired Architecture
 */

// 1. MODULE STATE (Shared via Parent Cache)
const CACHE = (function() {
  try {
    if (!window.parent.__UPS_CACHE__) window.parent.__UPS_CACHE__ = { audios: [], pastas: [], docs: [], midias: [], thumbs: {} };
    return window.parent.__UPS_CACHE__;
  } catch(e) { return { audios: [], pastas: [], docs: [], midias: [], thumbs: {} }; }
})();

const ESTADO = {
  audios: CACHE.audios || [],
  pastas: CACHE.pastas || [],
  categoria: 'all',
  busca: '',
  reproduzindo: null,
  audioObj: null,
  userId: null,
  isAdmin: false,
  tema: 'dark'
};

// 1.1 THEME SYNC (Reactive)
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
    if (typeof ESTADO !== 'undefined') ESTADO.tema = theme;
  };
  apply();
  try {
    const observer = new MutationObserver(apply);
    observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    window.addEventListener('unload', () => observer.disconnect());
  } catch (e) {}
}

// 2. DATA SERVICES (SUPABASE)
const DataSvc = {
  async carregar() {
    const profile = await UpsidenAuth.getProfile();
    if (!profile) return;
    
    ESTADO.userId = profile.id;
    ESTADO.isAdmin = (profile.role === 'admin');
    const teamAdminId = ESTADO.isAdmin ? profile.id : profile.admin_id;

    // Render cache if available
    if (ESTADO.audios.length > 0) Renderer.render();

    try {
      let query = UpsidenDB.from('audios').select('*').eq('admin_id', teamAdminId);
      if (!ESTADO.isAdmin) {
        query = query.or(`criado_por.eq.${ESTADO.userId},compartilhado.eq.true`);
      }

      const [audios, pastas] = await Promise.all([
        query.order('created_at', false).execute().catch(()=>[]),
        UpsidenDB.from('pastas_audio').select('*').order('nome').execute().catch(()=>[])
      ]);

      ESTADO.audios = audios || [];
      ESTADO.pastas = pastas || [];
      
      // Update persistent cache
      CACHE.audios = [...ESTADO.audios];
      CACHE.pastas = [...ESTADO.pastas];
    } catch(e) { console.error('Load error', e); }
    return true;
  },

  async remover(id) {
    const audio = ESTADO.audios.find(a => a.id === id);
    if (audio?.storage_path) await UpsidenStorage.remove('audios', [audio.storage_path]).catch(()=>{});
    await UpsidenDB.from('audios').eq('id', id).delete().execute();
    ESTADO.audios = ESTADO.audios.filter(a => a.id !== id);
  }
};

// 3. UI RENDERER (ECHOTUNE STYLE)
const Renderer = {
  getRoot() { return window.$upsRoot || document; },

  render() {
    const root = this.getRoot();
    const container = root.querySelector('#audio-list-container');
    const empty = root.querySelector('#audio-empty');
    if (!container) return;

    const filtrados = this.getFiltrados();
    container.innerHTML = '';

    if (filtrados.length === 0) {
      container.style.display = 'none';
      if (empty) empty.style.display = 'flex';
    } else {
      container.style.display = 'flex';
      if (empty) empty.style.display = 'none';

      filtrados.forEach((audio, i) => {
        const row = this.criarLinha(audio, i);
        container.appendChild(row);
      });
    }

    this.atualizarStatus();
  },

  getFiltrados() {
    let list = [...ESTADO.audios];
    if (ESTADO.busca) {
      const b = ESTADO.busca.toLowerCase();
      list = list.filter(a => a.nome.toLowerCase().includes(b));
    }
    return list;
  },

  criarLinha(audio, index) {
    const row = document.createElement('div');
    row.className = 'audio-row card-enter';
    row.style.animationDelay = `${index * 30}ms`;
    row.dataset.id = audio.id;

    const isPlaying = ESTADO.reproduzindo === audio.id;
    const playIcon = isPlaying 
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' 
      : '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

    const iniciais = audio.nome.substring(0, 2).toUpperCase();
    const duracao = this.fmtTempo(audio.duracao);
    
    // Fake metrics for UI structure (Real stats would come from metrics svc)
    const envios = 0; 
    const plays = 0;

    row.innerHTML = `
      <div class="row-main">
        <div class="row-avatar">${iniciais}</div>
        <div class="row-details">
          <div class="row-name-line">
             <span class="row-name">${audio.nome}</span>
             ${audio.compartilhado ? '<span class="audio-tag">TIME</span>' : ''}
             ${audio.acesso_individual && audio.acesso_individual.length > 0 ? '<span class="audio-tag" style="background:var(--accent);color:white;">PRIVADO+</span>' : ''}
          </div>
          <div class="row-sub">
            <span>Original Voice</span>
            <span class="dot">·</span>
            <span>PT-BR</span>
          </div>
        </div>
      </div>

      <div class="row-stats">
        <div class="stat-pill">
          <span class="stat-v">${envios}</span>
          <span class="stat-l">Sent</span>
        </div>
        <div class="stat-pill">
          <span class="stat-v">${plays}</span>
          <span class="stat-l">Plays</span>
        </div>
      </div>

      <div class="row-meta">
        <span class="dur-badge">${duracao}</span>
      </div>

      <div class="row-actions" style="display: flex; align-items: center; gap: 8px;">
        <button class="btn-play-row ${isPlaying ? 'active' : ''}" data-action="preview" title="Ouvir" style="padding: 10px; border-radius: 12px; flex: 0 0 38px;">
          ${playIcon}
        </button>
        <button class="btn-dim" data-action="access" title="Configurar Acesso" style="padding: 10px; border-radius: 12px; flex: 0 0 38px;">
           <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </button>
        <button class="btn-dim" data-action="delete" title="Remover" style="padding: 10px; border-radius: 12px; flex: 0 0 38px;">
           <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
        <button class="btn-send-row" data-action="send" style="flex: 1; padding: 10px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; background: var(--accent); color: white; border: none; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          <span>Enviar</span>
        </button>
      </div>
    `;
    return row;
  },

  fmtTempo(s) {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, '0')}`;
  },

  atualizarStatus() {
    const root = this.getRoot();
    const count = root.querySelector('#audio-count-total');
    if (count) count.textContent = `${this.getFiltrados().length}/${ESTADO.audios.length} áudios`;
  }
};

// 4. ACTION CONTROLLER
const Actions = {
  async togglePreview(id) {
    if (ESTADO.reproduzindo === id) {
      this.stopPreview();
    } else {
      this.stopPreview();
      const audio = ESTADO.audios.find(a => a.id === id);
      if (!audio) return;

      try {
        const blob = await UpsidenStorage.download('audios', audio.storage_path);
        const url = URL.createObjectURL(blob);
        ESTADO.audioObj = new Audio(url);
        ESTADO.audioObj.play();
        ESTADO.reproduzindo = id;
        ESTADO.audioObj.onended = () => this.stopPreview();
        Renderer.render();
      } catch(e) { console.error('Preview error', e); }
    }
  },

  async enviar(id) {
    const audio = ESTADO.audios.find(a => a.id === id);
    if (!audio) return;

    try {
      const blob = await UpsidenStorage.download('audios', audio.storage_path);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        chrome.runtime.sendMessage({
          tipo: 'enviar_audio_biblioteca',
          dados: { base64, duracao: audio.duracao, nome: audio.nome }
        }, (res) => {
          if (res?.sucesso) UpsidenMetrics.registrar('audio', id);
        });
      };
      reader.readAsDataURL(blob);
    } catch(e) { console.error('Send error', e); }
  },

  async gerenciarAcesso(id) {
    const audio = ESTADO.audios.find(a => a.id === id);
    if(!audio) return;
    
    // Apenas dono ou admin pode gerenciar
    if(audio.criado_por !== ESTADO.userId && !ESTADO.isAdmin) {
      window.parent.toast('Apenas o proprietário pode alterar o acesso.', 'error');
      return;
    }

    if (window.parent.abrirModalAcesso) {
      window.parent.abrirModalAcesso('audios', audio, (novosDados) => {
        Object.assign(audio, novosDados);
        Renderer.render();
      });
    }
  },

  stopPreview() {
    if (ESTADO.audioObj) {
      ESTADO.audioObj.pause();
      ESTADO.audioObj = null;
    }
    ESTADO.reproduzindo = null;
    Renderer.render();
  },

  async excluir(id) {
    if (!confirm('Excluir este áudio permanentemente?')) return;
    await DataSvc.remover(id);
    Renderer.render();
  }
};

// 5. VIEW CONTROLLER (Explorer Style)
const ViewSvc = {
  MODES: ['list', 'details', 'grid', 'big-grid'],
  current: 'details',

  init() {
    this.current = localStorage.getItem('upsiden_view_audios') || 'details';
    this.apply();
    this.setupZoom();
  },

  apply() {
    const root = Renderer.getRoot();
    const app = root.querySelector('.mod-app');
    if (!app) return;

    this.MODES.forEach(m => app.classList.remove(`view-mode-${m}`));
    app.classList.add(`view-mode-${this.current}`);

    root.querySelectorAll('.btn-view-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.current);
    });
    localStorage.setItem('upsiden_view_audios', this.current);
  },

  switch(mode) {
    if (!this.MODES.includes(mode)) return;
    this.current = mode;
    this.apply();
  },

  setupZoom() {
    if (window._upsZoomActive) return;
    window._upsZoomActive = true;
    let accum = 0;
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        accum += e.deltaY;
        const threshold = 60;
        if (Math.abs(accum) >= threshold) {
          const idx = this.MODES.indexOf(this.current);
          if (accum > 0 && idx > 0) {
            this.switch(this.MODES[idx - 1]);
          } else if (accum < 0 && idx < this.MODES.length - 1) {
            this.switch(this.MODES[idx + 1]);
          }
          accum = 0;
        }
      }
    }, { passive: false });
  }
};

// 6. BOOT & EVENTS
async function boot() {
  const root = Renderer.getRoot();
  
  // 0. Sincronizar Tema & Vista
  syncTheme();
  ViewSvc.init();

  // 2. Teclado
  root.addEventListener('input', (e) => {
    if (e.target.id === 'audio-search') {
      ESTADO.busca = e.target.value;
      Renderer.render();
    }
  });

  // 3. Clique Delegado
  if (!root._upsClickActive) {
    root._upsClickActive = true;
    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('button, label, .lib-tab-btn, .btn-view-mode');
      if (!btn) return;

      // Tabs Switcher
      const tabTarget = btn.dataset.tab;
      if (tabTarget) {
        if (tabTarget === 'audios') return;
        window.parent.switchBibliotecaTab(tabTarget);
        return;
      }

      // View Switching
      const viewTarget = btn.dataset.view;
      if (viewTarget) {
        ViewSvc.switch(viewTarget);
        return;
      }

      const row = btn.closest('.audio-row');
      const id = row?.dataset.id;
      const action = btn.dataset.action;

      if (action === 'preview') Actions.togglePreview(id);
      if (action === 'send') Actions.enviar(id);
      if (action === 'delete') Actions.excluir(id);
      if (action === 'access') Actions.gerenciarAcesso(id);
    });
  }
  
  // 1. Carregar Dados
  await DataSvc.carregar();
  Renderer.render();
  atualizarBadges();

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

  // 4. Importar
  const upload = root.querySelector('#audio-upload');
  if (upload) {
    upload.addEventListener('change', async (e) => {
      const profile = await UpsidenAuth.getProfile();
      const teamAdminId = profile.role === 'admin' ? profile.id : profile.admin_id;

      for (const file of files) {
         try {
           const path = `${ESTADO.userId}/${Date.now()}_${file.name}`;
           await UpsidenStorage.upload('audios', path, file, file.type);
           const data = await UpsidenDB.from('audios').insert({
             nome: file.name.split('.')[0], 
             storage_path: path, 
             duracao: 0, 
             criado_por: ESTADO.userId,
             admin_id: teamAdminId,
             compartilhado: ESTADO.isAdmin
           }).select().execute();
           if (data && data.length) ESTADO.audios.unshift(data[0]);
         } catch(err) { console.error('Upload failed', err); }
      }
      Renderer.render();
      atualizarBadges();
      e.target.value = '';
    });
  }
}

// Global hook for panel navigation
window.upsInit_audios = boot;

// Auto-boot if loaded directly
if (window.$upsRoot) boot(); else document.addEventListener('DOMContentLoaded', boot);
