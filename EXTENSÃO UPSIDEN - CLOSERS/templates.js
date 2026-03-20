/* =========================================
   Upsiden — Templates de Texto Engine
   ========================================= */

const STORAGE_KEY = 'upsiden_text_templates';
let templates = [];
let buscaAtual = '';
let editandoId = null;

async function carregar() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, r => { templates = r[STORAGE_KEY] || []; resolve(); });
  });
}

async function salvar() {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: templates }, resolve);
  });
}

function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function renderizarPreview(texto) {
  return texto.replace(/\{\{(\w+)\}\}/g, '<span style="color:#00a884;font-weight:600;">[$1]</span>');
}

function renderizar() {
  const lista = document.getElementById('tmpl-lista');
  const vazio = document.getElementById('tmpl-vazio');
  const count = document.getElementById('tmpl-count');

  const filtrados = templates.filter(t =>
    t.nome.toLowerCase().includes(buscaAtual.toLowerCase()) ||
    t.texto.toLowerCase().includes(buscaAtual.toLowerCase())
  );

  lista.innerHTML = '';
  if (filtrados.length === 0) {
    lista.style.display = 'none';
    vazio.style.display = 'flex';
  } else {
    lista.style.display = 'flex';
    vazio.style.display = 'none';

    filtrados.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'mod-card';
      const preview = tmpl.texto.length > 60 ? tmpl.texto.slice(0, 60) + '...' : tmpl.texto;
      card.innerHTML = `
        <div class="mod-card-icon">💬</div>
        <div class="mod-card-info">
          <div class="mod-card-title">${tmpl.nome}</div>
          <div class="mod-card-meta">${preview}</div>
        </div>
        <div class="mod-card-actions">
          <button class="btn-send" data-send="${tmpl.id}" title="Enviar">Enviar</button>
          <button class="btn-secondary" data-edit="${tmpl.id}" title="Editar" style="padding:4px 8px;font-size:12px;">✏️</button>
          <button class="btn-danger" data-del="${tmpl.id}" title="Excluir">✕</button>
        </div>
      `;
      lista.appendChild(card);
    });
  }

  count.textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;
}

function abrirModal(tmpl = null) {
  editandoId = tmpl ? tmpl.id : null;
  document.getElementById('tmpl-modal-titulo').textContent = tmpl ? 'Editar Template' : 'Novo Template';
  document.getElementById('tmpl-nome').value = tmpl ? tmpl.nome : '';
  document.getElementById('tmpl-texto').value = tmpl ? tmpl.texto : '';
  atualizarPreview();
  document.getElementById('tmpl-modal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('tmpl-modal').style.display = 'none';
  editandoId = null;
}

function atualizarPreview() {
  const texto = document.getElementById('tmpl-texto').value;
  document.getElementById('tmpl-preview').innerHTML = renderizarPreview(texto) || '<span style="opacity:0.5">Preview aparece aqui...</span>';
}

document.addEventListener('DOMContentLoaded', async () => {
  await carregar();
  renderizar();

  document.getElementById('tmpl-novo').addEventListener('click', () => abrirModal());

  document.getElementById('tmpl-texto').addEventListener('input', atualizarPreview);

  document.getElementById('tmpl-cancelar').addEventListener('click', fecharModal);

  document.getElementById('tmpl-salvar').addEventListener('click', async () => {
    const nome = document.getElementById('tmpl-nome').value.trim();
    const texto = document.getElementById('tmpl-texto').value.trim();
    if (!nome || !texto) return;

    if (editandoId) {
      const tmpl = templates.find(t => t.id === editandoId);
      if (tmpl) { tmpl.nome = nome; tmpl.texto = texto; }
    } else {
      templates.push({ id: gerarId(), nome, texto, criadoEm: Date.now() });
    }

    await salvar();
    renderizar();
    fecharModal();
  });

  document.getElementById('tmpl-busca').addEventListener('input', (e) => {
    buscaAtual = e.target.value;
    renderizar();
  });

  document.getElementById('tmpl-lista').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-send]');
    const btnEdit = e.target.closest('[data-edit]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      templates = templates.filter(t => t.id !== btnDel.dataset.del);
      await salvar();
      renderizar();
    }

    if (btnEdit) {
      const tmpl = templates.find(t => t.id === btnEdit.dataset.edit);
      if (tmpl) abrirModal(tmpl);
    }

    if (btnSend) {
      const tmpl = templates.find(t => t.id === btnSend.dataset.send);
      if (tmpl) {
        window.parent.postMessage({
          type: 'upsiden_send_text',
          data: { texto: tmpl.texto }
        }, '*');
      }
    }
  });
});
