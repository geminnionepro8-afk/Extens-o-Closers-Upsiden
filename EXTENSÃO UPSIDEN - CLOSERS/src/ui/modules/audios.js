/**
 * Upsiden Audio Module V5.0 (Clean Slate)
 * Highly Structured EchoTune-inspired Architecture
 */

// 1. MODULE STATE
const ESTADO = {
  audios: [],
  pastas: [],
  categoria: 'all',
  busca: '',
  reproduzindo: null, // ID do áudio em preview
  audioObj: null,      // Elemento Audio nativo
  userId: null,
  isAdmin: false,
  tema: 'dark'
};

// 1.1 THEME SYNC
function syncTheme() {
  try {
    const parentTheme = window.parent.document.documentElement.getAttribute('data-theme') || 
                        (window.parent.document.body.classList.contains('theme-light') ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', parentTheme);
    ESTADO.tema = parentTheme;
  } catch (e) { console.warn('Theme sync failed', e); }
}

// 2. DATA SERVICES (SUPABASE)
const DataSvc = {
  async carregar() {
    ESTADO.userId = await UpsidenAuth.getUserId();
    ESTADO.isAdmin = await UpsidenAuth.isAdmin();

    const [audios, pastas] = await Promise.all([
      UpsidenDB.from('audios').select('*').order('created_at', false).execute().catch(()=>[]),
      UpsidenDB.from('pastas_audio').select('*').order('nome').execute().catch(()=>[])
    ]);

    ESTADO.audios = audios || [];
    ESTADO.pastas = pastas || [];
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
    const container = root.getElementById('audio-list-container');
    const empty = root.getElementById('audio-empty');
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

      <div class="row-actions">
        <button class="btn-play-row ${isPlaying ? 'active' : ''}" data-action="preview" title="Ouvir">
          ${playIcon}
        </button>
        <button class="btn-send-row" data-action="send">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          Enviar
        </button>
        <button class="btn-dim" data-action="delete" title="Excluir">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
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
    const count = root.getElementById('audio-count-total');
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

  stopPreview() {
    if (ESTADO.audioObj) {
      ESTADO.audioObj.pause();
      ESTADO.audioObj = null;
    }
    ESTADO.reproduzindo = null;
    Renderer.render();
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

  async excluir(id) {
    if (!confirm('Excluir este áudio permanentemente?')) return;
    await DataSvc.remover(id);
    Renderer.render();
  }
};

// 5. BOOT & EVENTS
async function boot() {
  const root = Renderer.getRoot();
  
  // 0. Sincronizar Tema
  syncTheme();
  
  // 1. Carregar Dados
  await DataSvc.carregar();
  Renderer.render();

  // 2. Teclado
  root.addEventListener('input', (e) => {
    if (e.target.id === 'audio-search') {
      ESTADO.busca = e.target.value;
      Renderer.render();
    }
  });

  // 3. Clique Delegado
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('button, label');
    if (!btn) return;

    const row = btn.closest('.audio-row');
    const id = row?.dataset.id;
    const action = btn.dataset.action;

    if (id && action === 'preview') Actions.togglePreview(id);
    if (id && action === 'send') Actions.enviar(id);
    if (id && action === 'delete') Actions.excluir(id);
  });

  // 4. Importar
  const upload = root.getElementById('audio-upload');
  if (upload) {
    upload.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
         // Minimalist upload logic for V5
         try {
           const path = `${ESTADO.userId}/${Date.now()}_${file.name}`;
           await UpsidenStorage.upload('audios', path, file, file.type);
           const audioData = await UpsidenDB.from('audios').insert({
             nome: file.name.split('.')[0], 
             storage_path: path, 
             duracao: 0, // Placeholder
             criado_por: ESTADO.userId
           }).execute();
           if (audioData) ESTADO.audios.unshift(audioData[0]);
         } catch(err) { console.error('Upload failed', err); }
      }
      Renderer.render();
      e.target.value = '';
    });
  }
}

// Global hook for panel navigation
window.upsInit_audios = boot;

// Auto-boot if loaded directly
if (window.$upsRoot) boot(); else document.addEventListener('DOMContentLoaded', boot);
