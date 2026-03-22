/* =========================================
   Upsiden — Templates de Texto (Supabase)
   ========================================= */

let templates = [];
let buscaAtual = '';
let categoriaAtual = '';
let editandoId = null;
let userId = null;
let isAdmin = false;

const CATEGORIAS_TEMPLATE = ['geral', 'boas-vindas', 'propostas', 'quebra-objecao', 'follow-up', 'fechamento'];

function renderizarPreview(texto) {
  return texto.replace(/\{\{(\w+)\}\}/g, '<span style="color:#00a884;font-weight:600;">[$1]</span>');
}

async function carregar() {
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('templates').select('*').order('created_at', false).execute();
  templates = data || [];
}

function renderizar() {
  const lista = document.getElementById('tmpl-lista');
  const vazio = document.getElementById('tmpl-vazio');
  const count = document.getElementById('tmpl-count');

  // Renderizar chips de categoria
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
    filtrados.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'mod-card';
      const preview = tmpl.texto.length > 60 ? tmpl.texto.slice(0, 60) + '...' : tmpl.texto;
      const catLabel = tmpl.categoria || 'geral';
      const catBadge = `<span style="font-size:8px;background:rgba(0,168,132,0.2);color:#00a884;padding:1px 5px;border-radius:8px;margin-left:4px;">${catLabel}</span>`;
      const compartilhadoBadge = tmpl.compartilhado ? ' <span style="font-size:8px;background:#FF6200;color:white;padding:1px 3px;border-radius:2px;">TIME</span>' : '';
      card.innerHTML = `
        <div class="mod-card-icon">💬</div>
        <div class="mod-card-info">
          <div class="mod-card-title">${tmpl.nome}${catBadge}${compartilhadoBadge}</div>
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
  // Categoria
  let catSelect = document.getElementById('tmpl-categoria');
  if (!catSelect) {
    const grupo = document.createElement('div');
    grupo.className = 'mod-form-group';
    grupo.style.cssText = 'margin-bottom:10px;';
    grupo.innerHTML = '<label style="font-size:11px;color:#8696a0;margin-bottom:4px;display:block;">Categoria</label><select id="tmpl-categoria" class="mod-input" style="width:100%;padding:6px;background:#202c33;border:1px solid #374045;color:#e9edef;border-radius:6px;">' + CATEGORIAS_TEMPLATE.map(c => `<option value="${c}">${c}</option>`).join('') + '</select>';
    const nomeInput = document.getElementById('tmpl-nome');
    nomeInput.parentElement.after(grupo);
    catSelect = document.getElementById('tmpl-categoria');
  }
  catSelect.value = tmpl?.categoria || 'geral';
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
  if (!(await verificarAuth())) {
    document.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar os templates.</p>';
    return;
  }

  await carregar();
  renderizar();

  document.getElementById('tmpl-novo').addEventListener('click', () => abrirModal());
  document.getElementById('tmpl-texto').addEventListener('input', atualizarPreview);
  document.getElementById('tmpl-cancelar').addEventListener('click', fecharModal);

  document.getElementById('tmpl-salvar').addEventListener('click', async () => {
    const nome = document.getElementById('tmpl-nome').value.trim();
    const texto = document.getElementById('tmpl-texto').value.trim();
    const categoria = document.getElementById('tmpl-categoria')?.value || 'geral';
    if (!nome || !texto) return;

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
    renderizar();
    fecharModal();
  });

  document.getElementById('tmpl-busca').addEventListener('input', (e) => { buscaAtual = e.target.value; renderizar(); });

  document.getElementById('tmpl-lista').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-send]');
    const btnEdit = e.target.closest('[data-edit]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      await UpsidenDB.from('templates').eq('id', btnDel.dataset.del).delete().execute();
      templates = templates.filter(t => t.id !== btnDel.dataset.del);
      renderizar();
    }
    if (btnEdit) {
      const tmpl = templates.find(t => t.id === btnEdit.dataset.edit);
      if (tmpl) abrirModal(tmpl);
    }
    if (btnSend) {
      const tmpl = templates.find(t => t.id === btnSend.dataset.send);
      if (tmpl) {
        // Template Engine: processa variáveis em tempo real
        const textoProcessado = typeof TemplateEngine !== 'undefined'
          ? TemplateEngine.process(tmpl.texto, {})
          : tmpl.texto;
        window.parent.postMessage({ type: 'upsiden_send_text', data: { texto: textoProcessado } }, '*');
        UpsidenMetrics.registrar('template', tmpl.id);
      }
    }
  });
});

// ═══ CHIPS DE CATEGORIA (iOS-style) ══════════════
function renderizarChipsCategoria() {
  let container = document.getElementById('chips-categoria');
  if (!container) {
    container = document.createElement('div');
    container.id = 'chips-categoria';
    container.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;padding:0 12px;';
    const lista = document.getElementById('tmpl-lista');
    if (lista) lista.parentElement.insertBefore(container, lista);
  }
  container.innerHTML = '';

  const mkChip = (label, active, onClick) => {
    const chip = document.createElement('button');
    chip.textContent = label;
    chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;border:1px solid ${active ? '#00a884' : '#374045'};background:${active ? 'rgba(0,168,132,0.2)' : 'transparent'};color:${active ? '#00a884' : '#8696a0'};cursor:pointer;transition:all 0.3s;`;
    chip.addEventListener('click', onClick);
    return chip;
  };

  container.appendChild(mkChip('Todos', !categoriaAtual, () => { categoriaAtual = ''; renderizar(); }));
  CATEGORIAS_TEMPLATE.forEach(cat => {
    container.appendChild(mkChip(cat, categoriaAtual === cat, () => { categoriaAtual = cat; renderizar(); }));
  });
}
