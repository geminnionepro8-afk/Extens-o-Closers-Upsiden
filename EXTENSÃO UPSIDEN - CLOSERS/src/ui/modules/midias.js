/* =========================================
   Upsiden — Biblioteca de Mídias (Red Sun)
   ========================================= */

let midias = [];
let buscaAtual = '';
let filtroTipo = 'todos';
let userId = null;
let isAdmin = false;

function syncTheme() {
  try {
    const parentTheme = window.parent.document.documentElement.getAttribute('data-theme') || 
                        (window.parent.document.body.classList.contains('theme-light') ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', parentTheme);
  } catch (e) { console.warn('Theme sync failed', e); }
}

function formatarTamanho(b) {
  if (!b) return '—';
  return b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}

function getExtensao(nome) {
  if (!nome) return '';
  return nome.split('.').pop().toUpperCase();
}

function isTipoImagem(tipo) { return tipo && tipo.startsWith('image'); }
function isTipoVideo(tipo) { return tipo && tipo.startsWith('video'); }

async function carregar() {
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('midias').select('*').order('created_at', false).execute();
  midias = data || [];
}

function renderizar() {
  const root = window.$upsRoot || document;
  const grid = root.getElementById('media-grid');
  const vazio = root.getElementById('media-vazio');
  const count = root.getElementById('media-count');

  const busca = (root.getElementById('media-busca')?.value || '').toLowerCase();
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
            <div class="row-name-line">
              <span class="row-title" title="${m.nome}">${m.nome}</span>
              ${m.compartilhado ? '<span class="status-tag">TIME</span>' : ''}
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
          <span class="date-badge">${new Date(m.created_at).toLocaleDateString()}</span>
        </div>

        <div class="row-actions">
           <button class="btn-send-main action-btn-main" data-id="${m.id}">
             <svg viewBox="0 0 24 24" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
             Enviar
           </button>
           <button class="btn-icon-dim btn-delete" data-del="${m.id}">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
  const el = root.getElementById(`thumb-${id}`);
  if (!el) return;

  try {
    const blob = await UpsidenStorage.download('midias', path);
    const url = URL.createObjectURL(blob);
    el.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
  } catch (e) {
    console.error('Thumb load failed', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = window.$upsRoot || document;
  syncTheme();

  if (!(await verificarAuth())) {
    root.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:var(--text-muted);text-align:center;">Faça login para acessar as mídias.</p>';
    return;
  }

  try {
    await carregar();
  } catch (e) {
    console.error('Erro ao carregar mídias:', e);
  } finally {
    renderizar();
  }


  // Search
  root.getElementById('media-busca').addEventListener('input', (e) => {
    buscaAtual = e.target.value;
    renderizar();
  });

  // Upload
  root.getElementById('media-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) { alert(`${file.name} excede 25MB.`); continue; }
      try {
        const storagePath = `${userId}/${Date.now()}_${file.name}`;
        await UpsidenStorage.upload('midias', storagePath, file, file.type);
        const result = await UpsidenDB.from('midias').insert({
          nome: file.name, tipo: file.type, tamanho: file.size,
          storage_path: storagePath, criado_por: userId, compartilhado: isAdmin
        }).execute();
        if (result && result.length) midias.unshift(result[0]);
      } catch (err) { console.error('Upload failed:', err); alert(`Erro ao fazer upload de ${file.name}`); }
    }
    renderizar();
    e.target.value = '';
  });

  // Grid click delegation (Send / Delete)
  root.getElementById('media-grid').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-id]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      e.stopPropagation();
      const m = midias.find(x => x.id === btnDel.dataset.del);
      if (m) {
        await UpsidenStorage.remove('midias', [m.storage_path]).catch(() => {});
        await UpsidenDB.from('midias').eq('id', m.id).delete().execute();
        midias = midias.filter(x => x.id !== m.id);
        renderizar();
      }
      return;
    }
    if (btnSend && !btnSend.closest('[data-del]')) {
      const m = midias.find(x => x.id === btnSend.dataset.id);
      if (m) {
        try {
          btnSend.textContent = '...';
          const blob = await UpsidenStorage.download('midias', m.storage_path);
          const reader = new FileReader();
          reader.onload = () => {
            window.parent.postMessage({
              type: 'upsiden_send_file',
              data: { nome: m.nome, tipo: m.tipo, base64: reader.result }
            }, '*');
            UpsidenMetrics.registrar('midia', m.id);
            btnSend.innerHTML = '▶ Enviar';
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          alert('Erro ao enviar mídia');
          btnSend.innerHTML = '▶ Enviar';
        }
      }
    }
  });
});
