/* =========================================
   Upsiden — Biblioteca de Mídias Engine
   ========================================= */

const STORAGE_KEY = 'upsiden_medias';
let midias = [];
let buscaAtual = '';

async function carregar() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, r => { midias = r[STORAGE_KEY] || []; resolve(); });
  });
}

async function salvar() {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: midias }, resolve);
  });
}

function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function formatarTamanho(b) { return b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderizar() {
  const grid = document.getElementById('media-grid');
  const vazio = document.getElementById('media-vazio');
  const count = document.getElementById('media-count');

  const filtradas = midias.filter(m => m.nome.toLowerCase().includes(buscaAtual.toLowerCase()));

  grid.innerHTML = '';
  if (filtradas.length === 0) {
    grid.style.display = 'none';
    vazio.style.display = 'flex';
  } else {
    grid.style.display = 'grid';
    vazio.style.display = 'none';

    filtradas.forEach(m => {
      const thumb = document.createElement('div');
      thumb.className = 'media-thumb';

      const isVideo = m.tipo.startsWith('video');
      const preview = isVideo
        ? `<video src="${m.base64}" muted></video>`
        : `<img src="${m.base64}" alt="${m.nome}">`;

      thumb.innerHTML = `
        ${preview}
        <div class="media-thumb-bar">
          <span class="media-thumb-name">${m.nome}</span>
          <button class="btn-send" data-id="${m.id}" style="font-size:9px;padding:2px 5px;">▶</button>
          <button class="btn-danger" data-del="${m.id}" style="font-size:9px;padding:2px 4px;">✕</button>
        </div>
      `;
      grid.appendChild(thumb);
    });
  }

  count.textContent = `${midias.length} mídia${midias.length !== 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregar();
  renderizar();

  document.getElementById('media-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      // Limitar tamanho a ~5MB para storage
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} excede 5MB. Por favor use arquivos menores.`);
        continue;
      }
      const base64 = await fileToBase64(file);
      midias.push({
        id: gerarId(),
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        base64: base64,
        criadoEm: Date.now()
      });
    }
    await salvar();
    renderizar();
    e.target.value = '';
  });

  document.getElementById('media-busca').addEventListener('input', (e) => {
    buscaAtual = e.target.value;
    renderizar();
  });

  document.getElementById('media-grid').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-id]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      midias = midias.filter(m => m.id !== btnDel.dataset.del);
      await salvar();
      renderizar();
    }
    if (btnSend) {
      const m = midias.find(x => x.id === btnSend.dataset.id);
      if (m) {
        window.parent.postMessage({
          type: 'upsiden_send_file',
          data: { nome: m.nome, tipo: m.tipo, base64: m.base64 }
        }, '*');
      }
    }
  });
});
