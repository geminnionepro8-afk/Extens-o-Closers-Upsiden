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
  const profile = await UpsidenAuth.getProfile();
  if (!profile) return;
  
  userId = profile.id;
  isAdmin = (profile.role === 'admin');
  const teamAdminId = isAdmin ? profile.id : profile.admin_id;

  try {
    let query = UpsidenDB.from('templates').select('*').eq('admin_id', teamAdminId);
    if (!isAdmin) {
      query = query.or(`criado_por.eq.${userId},compartilhado.eq.true`);
    }
    const data = await query.order('created_at', false).execute();
    templates = data || [];
  } catch(e) { console.error('Load error', e); }
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

      card.innerHTML = `
        <div class="mod-card-icon">${CAT_EMOJI[catLabel] || '💬'}</div>
        <div class="mod-card-info">
          <div class="template-header">
            <span class="template-name">${tmpl.nome}</span>
            ${tmpl.compartilhado ? '<span class="tpl-tag">TIME</span>' : ''}
            ${tmpl.acesso_individual && tmpl.acesso_individual.length > 0 ? '<span class="tpl-tag" style="background:var(--accent);color:white;">PRIVADO+</span>' : ''}
          </div>
          <div class="mod-card-meta" title="${tmpl.texto}">${preview}</div>
        </div>
        <div class="mod-card-actions" style="display: flex; align-items: center; gap: 8px; margin-top: 16px;">
          <button class="btn-send" data-send="${tmpl.id}" title="Enviar para o chat" style="flex: 1; padding: 10px 16px; border-radius: 12px; font-weight: 700; background: var(--accent); color: white; border: none; cursor: pointer;">Enviar</button>
          
          <button class="btn-dim" data-edit="${tmpl.id}" title="Editar" style="padding: 10px; border-radius: 12px; flex: 0 0 38px; display: flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          
          <button class="btn-dim" data-action="access" data-id="${tmpl.id}" title="Configurar Acesso" style="padding: 10px; border-radius: 12px; flex: 0 0 38px; display: flex; align-items: center; justify-content: center;">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          </button>
          
          <button class="btn-dim" data-action="delete" data-id="${tmpl.id}" title="Remover" style="padding: 10px; border-radius: 12px; flex: 0 0 38px; display: flex; align-items: center; justify-content: center;">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
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
        const profile = await UpsidenAuth.getProfile();
        const teamAdminId = profile.role === 'admin' ? profile.id : profile.admin_id;

        const result = await UpsidenDB.from('templates').insert({
          nome, texto, categoria, criado_por: userId, admin_id: teamAdminId, compartilhado: isAdmin
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
    const actionBtn = e.target.closest('[data-action]');

    if (actionBtn) {
      const id = actionBtn.dataset.id;
      const action = actionBtn.dataset.action;
      
      if (action === 'delete') {
        if (!confirm('Excluir este template?')) return;
        await UpsidenDB.from('templates').eq('id', id).delete().execute();
        templates = templates.filter(t => t.id !== id);
        renderizar();
      }
      if (action === 'access') {
        const tmpl = templates.find(t => t.id === id);
        if(!tmpl) return;

        if (tmpl.criado_por !== userId && !isAdmin) {
          if (window.parent.toast) window.parent.toast('Apenas o autor pode configurar o acesso.', 'error');
          return;
        }

        if (window.parent.abrirModalAcesso) {
          window.parent.abrirModalAcesso('templates', tmpl, (novosDados) => {
            Object.assign(tmpl, novosDados);
            renderizar();
          });
        }
      }
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
