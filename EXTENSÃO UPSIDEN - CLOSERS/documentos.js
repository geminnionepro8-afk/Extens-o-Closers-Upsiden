/* =========================================
   Upsiden — Biblioteca de Documentos Engine
   ========================================= */

const STORAGE_KEY = 'upsiden_documents';
let documentos = [];
let buscaAtual = '';

// ── Storage ──
async function carregarDocs() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, r => {
      documentos = r[STORAGE_KEY] || [];
      resolve();
    });
  });
}

async function salvarDocs() {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: documentos }, resolve);
  });
}

// ── Utilitários ──
function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function iconeDoTipo(tipo) {
  if (tipo.includes('pdf')) return '📕';
  if (tipo.includes('word') || tipo.includes('doc')) return '📘';
  if (tipo.includes('sheet') || tipo.includes('excel') || tipo.includes('csv')) return '📗';
  if (tipo.includes('presentation') || tipo.includes('powerpoint')) return '📙';
  return '📄';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Renderizar ──
function renderizar() {
  const lista = document.getElementById('doc-lista');
  const vazio = document.getElementById('doc-vazio');
  const count = document.getElementById('doc-count');

  const filtrados = documentos.filter(d =>
    d.nome.toLowerCase().includes(buscaAtual.toLowerCase())
  );

  lista.innerHTML = '';
  if (filtrados.length === 0) {
    lista.style.display = 'none';
    vazio.style.display = 'flex';
  } else {
    lista.style.display = 'flex';
    vazio.style.display = 'none';

    filtrados.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'mod-card';
      card.innerHTML = `
        <div class="mod-card-icon">${iconeDoTipo(doc.tipo)}</div>
        <div class="mod-card-info">
          <div class="mod-card-title">${doc.nome}</div>
          <div class="mod-card-meta">${formatarTamanho(doc.tamanho)}</div>
        </div>
        <div class="mod-card-actions">
          <button class="btn-send" data-id="${doc.id}" title="Enviar para o chat">Enviar</button>
          <button class="btn-danger" data-del="${doc.id}" title="Excluir">✕</button>
        </div>
      `;
      lista.appendChild(card);
    });
  }

  count.textContent = `${documentos.length} documento${documentos.length !== 1 ? 's' : ''}`;
}

// ── Eventos ──
document.addEventListener('DOMContentLoaded', async () => {
  await carregarDocs();
  renderizar();

  // Upload
  document.getElementById('doc-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const base64 = await fileToBase64(file);
      documentos.push({
        id: gerarId(),
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        base64: base64,
        criadoEm: Date.now()
      });
    }
    await salvarDocs();
    renderizar();
    e.target.value = '';
  });

  // Busca
  document.getElementById('doc-busca').addEventListener('input', (e) => {
    buscaAtual = e.target.value;
    renderizar();
  });

  // Cliques (enviar/excluir)
  document.getElementById('doc-lista').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-id]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      documentos = documentos.filter(d => d.id !== btnDel.dataset.del);
      await salvarDocs();
      renderizar();
    }

    if (btnSend) {
      const doc = documentos.find(d => d.id === btnSend.dataset.id);
      if (doc) {
        window.parent.postMessage({
          type: 'upsiden_send_file',
          data: { nome: doc.nome, tipo: doc.tipo, base64: doc.base64 }
        }, '*');
      }
    }
  });
});
