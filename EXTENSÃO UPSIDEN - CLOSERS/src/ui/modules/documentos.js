/* =========================================
   Upsiden — Biblioteca de Documentos (Red Sun)
   ========================================= */

let documentos = [];
let buscaAtual = '';
let filtroCategoria = 'todos';
let userId = null;
let isAdmin = false;

function syncTheme() {
  try {
    const parentTheme = window.parent.document.documentElement.getAttribute('data-theme') || 
                        (window.parent.document.body.classList.contains('theme-light') ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', parentTheme);
  } catch (e) { console.warn('Theme sync failed', e); }
}

function formatarTamanho(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
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
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('documentos').select('*').order('created_at', false).execute();
  documentos = data || [];
}

function renderizar() {
  const root = window.$upsRoot || document;
  const lista = root.getElementById('doc-lista');
  const vazio = root.getElementById('doc-vazio');
  const count = root.getElementById('doc-count');

  const busca = (root.getElementById('doc-busca')?.value || '').toLowerCase();
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
                <span class="row-title" title="${doc.nome}">${doc.nome}</span>
                ${doc.compartilhado ? '<span class="status-tag">TIME</span>' : ''}
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

        <div class="row-actions">
           <button class="btn-send-main action-btn-main" data-id="${doc.id}">
             <svg viewBox="0 0 24 24" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
             Enviar
           </button>
           <button class="btn-icon-dim btn-delete" data-del="${doc.id}">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

document.addEventListener('DOMContentLoaded', async () => {
  const root = window.$upsRoot || document;
  syncTheme();

  if (!(await verificarAuth())) {
    root.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:var(--text-muted);text-align:center;">Faça login para acessar os documentos.</p>';
    return;
  }

  try {
    await carregarDocs();
  } catch (e) {
    console.error('Erro ao carregar documentos:', e);
  } finally {
    renderizar();
  }


  // Upload
  root.getElementById('doc-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const storagePath = `${userId}/${Date.now()}_${file.name}`;
        await UpsidenStorage.upload('documentos', storagePath, file, file.type);
        const result = await UpsidenDB.from('documentos').insert({
          nome: file.name, tipo: file.type, tamanho: file.size,
          storage_path: storagePath, criado_por: userId, compartilhado: isAdmin
        }).execute();
        if (result && result.length) documentos.unshift(result[0]);
      } catch (err) { console.error('Upload failed:', err); alert(`Erro ao fazer upload de ${file.name}`); }
    }
    renderizar();
    e.target.value = '';
  });

  // Search
  root.getElementById('doc-busca').addEventListener('input', (e) => { buscaAtual = e.target.value; renderizar(); });

  // List click delegation
  root.getElementById('doc-lista').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-id]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      e.stopPropagation();
      const doc = documentos.find(d => d.id === btnDel.dataset.del);
      if (doc) {
        await UpsidenStorage.remove('documentos', [doc.storage_path]).catch(() => {});
        await UpsidenDB.from('documentos').eq('id', doc.id).delete().execute();
        documentos = documentos.filter(d => d.id !== doc.id);
        renderizar();
      }
      return;
    }
    if (btnSend && !btnSend.closest('[data-del]')) {
      const doc = documentos.find(d => d.id === btnSend.dataset.id);
      if (doc) {
        try {
          btnSend.textContent = '...';
          const blob = await UpsidenStorage.download('documentos', doc.storage_path);
          const reader = new FileReader();
          reader.onload = () => {
            window.parent.postMessage({
              type: 'upsiden_send_file',
              data: { nome: doc.nome, tipo: doc.tipo, base64: reader.result }
            }, '*');
            UpsidenMetrics.registrar('documento', doc.id);
            btnSend.textContent = 'Enviar';
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          alert('Erro ao enviar documento');
          btnSend.textContent = 'Enviar';
        }
      }
    }
  });
});
