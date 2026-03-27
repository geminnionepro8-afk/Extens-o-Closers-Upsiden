/* =========================================
   Upsiden — Templates de Texto (Red Sun)
   ========================================= */

let templates = [];
let buscaAtual = '';
let categoriaAtual = '';
let editandoId = null;
let userId = null;
let isAdmin = false;

const CATEGORIAS_TEMPLATE = ['geral', 'boas-vindas', 'propostas', 'quebra-objecao', 'follow-up', 'fechamento'];

const CAT_EMOJI = {
  'geral': '💬',
  'boas-vindas': '👋',
  'propostas': '💰',
  'quebra-objecao': '🛡️',
  'follow-up': '🔄',
  'fechamento': '🎯'
};

function renderizarPreview(texto) {
  if (!texto) return '<span style="opacity:0.5">Preview aparece aqui...</span>';
  return texto.replace(/\{\{(\w+)\}\}/g, '<span style="color:var(--accent);font-weight:600;">[$1]</span>');
}

async function carregar() {
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('templates').select('*').order('created_at', false).execute();
  templates = data || [];
}

function renderizarChipsCategoria() {
  const root = window.$upsRoot || document;
  const container = root.getElementById('chips-categoria');
  if (!container) return;
  container.innerHTML = '';

  const mkChip = (label, value, active) => {
    const chip = document.createElement('button');
    chip.className = `cat-chip${active ? ' active' : ''}`;
    chip.dataset.cat = value;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      categoriaAtual = value === 'todos' ? '' : value;
      renderizarChipsCategoria();
      renderizar();
    });
    return chip;
  };

  container.appendChild(mkChip('Todos', 'todos', !categoriaAtual));
  CATEGORIAS_TEMPLATE.forEach(cat => {
    const emoji = CAT_EMOJI[cat] || '📌';
    container.appendChild(mkChip(`${emoji} ${cat}`, cat, categoriaAtual === cat));
  });
}

function renderizar() {
  const root = window.$upsRoot || document;
  const lista = root.getElementById('tmpl-lista');
  const vazio = root.getElementById('tmpl-vazio');
  const count = root.getElementById('tmpl-count');

  renderizarChipsCategoria();

  const filtrados = templates.filter(t => {
    const matchBusca = t.nome.toLowerCase().includes(buscaAtual.toLowerCase()) ||
      t.texto.toLowerCase().includes(buscaAtual.toLowerCase());
    const matchCat = !categoriaAtual || (t.categoria || 'geral') === categoriaAtual;
    return matchBusca && matchCat;
  });

  lista.innerHTML = '';
  if (filtrados.length === 0) {
    lista.style.display = 'none'; vazio.style.display = 'flex';
  } else {
    lista.style.display = 'flex'; vazio.style.display = 'none';
    filtrados.forEach((tmpl, i) => {
      const card = document.createElement('div');
      card.className = 'mod-card card-enter';
      card.style.animationDelay = `${i * 0.04}s`;
      const preview = tmpl.texto.length > 55 ? tmpl.texto.slice(0, 55) + '...' : tmpl.texto;
      const catLabel = tmpl.categoria || 'geral';
      const catBadge = `<span class="badge-cat">${CAT_EMOJI[catLabel] || '📌'} ${catLabel}</span>`;
      const teamBadge = tmpl.compartilhado ? '<span class="badge-team">TIME</span>' : '';

      card.innerHTML = `
        <div class="mod-card-icon">${CAT_EMOJI[catLabel] || '💬'}</div>
        <div class="mod-card-info">
          <div class="mod-card-title">${tmpl.nome} ${catBadge} ${teamBadge}</div>
          <div class="mod-card-meta" title="${tmpl.texto}">${preview}</div>
        </div>
        <div class="mod-card-actions">
          <button class="btn-send" data-send="${tmpl.id}" title="Enviar para o chat">Enviar</button>
          <button class="btn-icon" data-edit="${tmpl.id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="btn-icon btn-delete" data-del="${tmpl.id}" title="Excluir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;
      lista.appendChild(card);
    });
  }

  count.textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;
}

function abrirModal(tmpl = null) {
  const root = window.$upsRoot || document;
  editandoId = tmpl ? tmpl.id : null;
  root.getElementById('tmpl-modal-titulo').textContent = tmpl ? 'Editar Template' : 'Novo Template';
  root.getElementById('tmpl-nome').value = tmpl ? tmpl.nome : '';
  root.getElementById('tmpl-texto').value = tmpl ? tmpl.texto : '';
  root.getElementById('tmpl-categoria').value = tmpl?.categoria || 'geral';
  atualizarPreview();
  root.getElementById('tmpl-modal').style.display = 'flex';
}

function fecharModal() {
  const root = window.$upsRoot || document;
  root.getElementById('tmpl-modal').style.display = 'none';
  editandoId = null;
}

function atualizarPreview() {
  const root = window.$upsRoot || document;
  const texto = root.getElementById('tmpl-texto').value;
  root.getElementById('tmpl-preview').innerHTML = renderizarPreview(texto);
}

document.addEventListener('DOMContentLoaded', async () => {
  const root = window.$upsRoot || document;

  if (!(await verificarAuth())) {
    root.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:var(--text-muted);text-align:center;">Faça login para acessar os templates.</p>';
    return;
  }

  await carregar();
  renderizar();

  root.getElementById('tmpl-novo').addEventListener('click', () => abrirModal());
  root.getElementById('tmpl-texto').addEventListener('input', atualizarPreview);
  root.getElementById('tmpl-cancelar').addEventListener('click', fecharModal);
  root.getElementById('tmpl-fechar-modal').addEventListener('click', fecharModal);

  root.getElementById('tmpl-salvar').addEventListener('click', async () => {
    const nome = root.getElementById('tmpl-nome').value.trim();
    const texto = root.getElementById('tmpl-texto').value.trim();
    const categoria = root.getElementById('tmpl-categoria').value || 'geral';
    if (!nome || !texto) return;

    const btn = root.getElementById('tmpl-salvar');
    btn.textContent = 'Salvando...'; btn.disabled = true;

    try {
      if (editandoId) {
        await UpsidenDB.from('templates').eq('id', editandoId).update({ nome, texto, categoria }).execute();
        const t = templates.find(x => x.id === editandoId);
        if (t) { t.nome = nome; t.texto = texto; t.categoria = categoria; }
      } else {
        const result = await UpsidenDB.from('templates').insert({
          nome, texto, categoria, criado_por: userId, compartilhado: isAdmin
        }).execute();
        if (result && result.length) templates.unshift(result[0]);
      }
    } catch(e) { console.error('Erro ao salvar template:', e); }

    btn.textContent = 'Salvar Template'; btn.disabled = false;
    renderizar();
    fecharModal();
  });

  root.getElementById('tmpl-busca').addEventListener('input', (e) => { buscaAtual = e.target.value; renderizar(); });

  root.getElementById('tmpl-lista').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-send]');
    const btnEdit = e.target.closest('[data-edit]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      e.stopPropagation();
      await UpsidenDB.from('templates').eq('id', btnDel.dataset.del).delete().execute();
      templates = templates.filter(t => t.id !== btnDel.dataset.del);
      renderizar();
      return;
    }
    if (btnEdit) {
      const tmpl = templates.find(t => t.id === btnEdit.dataset.edit);
      if (tmpl) abrirModal(tmpl);
      return;
    }
    if (btnSend) {
      const tmpl = templates.find(t => t.id === btnSend.dataset.send);
      if (tmpl) {
        const textoProcessado = typeof TemplateEngine !== 'undefined'
          ? TemplateEngine.process(tmpl.texto, {})
          : tmpl.texto;
        window.parent.postMessage({ type: 'upsiden_send_text', data: { texto: textoProcessado } }, '*');
        UpsidenMetrics.registrar('template', tmpl.id);
      }
    }
  });
});
