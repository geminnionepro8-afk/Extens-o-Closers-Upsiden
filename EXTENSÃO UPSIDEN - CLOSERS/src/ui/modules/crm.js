/* =========================================
   Upsiden — CRM Kanban Elite (Supabase)
   Lote 04: #20 a #27
   ========================================= */

const TAG_CORES = {
  quente:  { bg: '#FFB4B4', cor: '#8B1A1A', emoji: '🔥' },
  morno:   { bg: '#FFE5B4', cor: '#8B6914', emoji: '☀️' },
  frio:    { bg: '#B4D7FF', cor: '#1A4B8B', emoji: '❄️' },
  vip:     { bg: '#E5B4FF', cor: '#5A1A8B', emoji: '⭐' },
  urgente: { bg: '#FFB4D7', cor: '#8B1A4B', emoji: '🚨' }
};

let leads = [];
let userId = null;
let editandoLeadId = null;

// ═══ CARREGAMENTO ════════════════════════════════
async function carregarLeads() {
  userId = await UpsidenAuth.getUserId();
  const data = await UpsidenDB.from('leads').select('*').order('created_at', false).execute();
  leads = data || [];
}

// ═══ FORMATADOR DE MOEDA ═════════════════════════
function formatarMoeda(valor) {
  const num = parseFloat(valor) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ═══ RENDERIZAÇÃO DO KANBAN ══════════════════════
function renderizarKanban() {
  const etapas = ['prospeccao', 'negociacao', 'fechado'];
  const filtroTag = document.getElementById('filtro-tag').value;

  etapas.forEach(etapa => {
    const container = document.getElementById(`coluna-${etapa}`);
    container.innerHTML = '';

    const leadsEtapa = leads.filter(l => {
      if (l.etapa !== etapa) return false;
      if (filtroTag && l.tag !== filtroTag) return false;
      return true;
    });

    // Calculador Dinâmico (#26)
    const somaValor = leadsEtapa.reduce((acc, l) => acc + (parseFloat(l.valor) || 0), 0);
    document.getElementById(`badge-${etapa}`).textContent = leadsEtapa.length;
    document.getElementById(`valor-${etapa}`).textContent = formatarMoeda(somaValor);

    if (leadsEtapa.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#4a5568;font-size:11px;">Nenhum lead</div>';
      return;
    }

    leadsEtapa.forEach(lead => {
      const card = document.createElement('div');
      card.className = 'crm-card';
      card.draggable = true;
      card.dataset.leadId = lead.id;

      // Tag pill
      let tagHTML = '';
      if (lead.tag && TAG_CORES[lead.tag]) {
        const t = TAG_CORES[lead.tag];
        tagHTML = `<span class="tag-pill tag-${lead.tag}">${t.emoji} ${lead.tag}</span>`;
      }

      // Lembrete indicator
      let lembreteHTML = '';
      if (lead.lembrete_data) {
        lembreteHTML = '<span class="lembrete-dot" title="Lembrete ativo"></span>';
      }

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div class="crm-card-title">${lead.nome || 'Sem nome'}${lembreteHTML}</div>
          ${tagHTML}
        </div>
        <div class="crm-card-meta">
          <span>${lead.telefone || 'S/ Telefone'}</span>
          <span class="crm-card-valor">${formatarMoeda(lead.valor)}</span>
        </div>
        ${lead.notas ? `<div class="crm-card-notas">📝 ${lead.notas}</div>` : ''}
      `;

      // Drag events
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', lead.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));

      // Click to expand
      card.addEventListener('click', () => abrirModalLead(lead));

      container.appendChild(card);
    });
  });
}

// ═══ DRAG & DROP ═════════════════════════════════
function configurarDragAndDrop() {
  document.querySelectorAll('.kanban-cards').forEach(coluna => {
    coluna.addEventListener('dragover', e => {
      e.preventDefault();
      coluna.closest('.kanban-column').classList.add('drag-over');
    });
    coluna.addEventListener('dragleave', () => {
      coluna.closest('.kanban-column').classList.remove('drag-over');
    });
    coluna.addEventListener('drop', async e => {
      e.preventDefault();
      coluna.closest('.kanban-column').classList.remove('drag-over');
      const leadId = e.dataTransfer.getData('text/plain');
      const novaEtapa = coluna.closest('.kanban-column').dataset.etapa;
      const lead = leads.find(l => l.id === leadId);

      if (lead && lead.etapa !== novaEtapa) {
        const etapaAnterior = lead.etapa;
        lead.etapa = novaEtapa;

        // Atualiza no Supabase
        await UpsidenDB.from('leads').eq('id', leadId).update({
          etapa: novaEtapa, updated_at: new Date().toISOString()
        }).execute();

        // Log de Histórico (#25) — com metadata para análise de conversão
        await registrarHistorico(leadId, 'movimento',
          `Lead movido de "${etapaAnterior}" para "${novaEtapa}"`,
          { etapa_anterior: etapaAnterior, etapa_nova: novaEtapa });

        renderizarKanban();
      }
    });
  });
}

// ═══ MODAL DE LEAD (Card Expandido) ══════════════
function abrirModalLead(lead = null) {
  editandoLeadId = lead ? lead.id : null;
  const modal = document.getElementById('modal-lead');

  document.getElementById('modal-titulo').textContent = lead ? `📋 ${lead.nome}` : 'Novo Lead';
  document.getElementById('lead-nome').value = lead?.nome || '';
  document.getElementById('lead-tel').value = lead?.telefone || '';
  document.getElementById('lead-valor').value = lead?.valor || 0;
  document.getElementById('lead-tag').value = lead?.tag || '';
  document.getElementById('lead-notas').value = lead?.notas || '';
  document.getElementById('lead-lembrete-texto').value = lead?.lembrete_texto || '';

  if (lead?.lembrete_data) {
    const d = new Date(lead.lembrete_data);
    document.getElementById('lead-lembrete').value = d.toISOString().slice(0, 16);
  } else {
    document.getElementById('lead-lembrete').value = '';
  }

  // Carregar histórico
  const histContainer = document.getElementById('historico-container');
  if (lead) {
    histContainer.style.display = 'block';
    carregarHistorico(lead.id);
  } else {
    histContainer.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modal-lead').style.display = 'none';
  editandoLeadId = null;
}

// ═══ SALVAR LEAD ═════════════════════════════════
async function salvarLead() {
  const nome = document.getElementById('lead-nome').value.trim();
  const telefone = document.getElementById('lead-tel').value.trim();
  const valor = parseFloat(document.getElementById('lead-valor').value) || 0;
  const tag = document.getElementById('lead-tag').value;
  const tagCor = TAG_CORES[tag]?.bg || '#8696a0';
  const notas = document.getElementById('lead-notas').value.trim();
  const lembreteInput = document.getElementById('lead-lembrete').value;
  const lembreteData = lembreteInput ? new Date(lembreteInput).toISOString() : null;
  const lembreteTexto = document.getElementById('lead-lembrete-texto').value.trim();

  if (!nome) return;

  if (editandoLeadId) {
    // Atualizar
    const updateData = {
      nome, telefone, valor, tag, tag_cor: tagCor, notas,
      lembrete_data: lembreteData, lembrete_texto: lembreteTexto,
      updated_at: new Date().toISOString()
    };
    await UpsidenDB.from('leads').eq('id', editandoLeadId).update(updateData).execute();

    const idx = leads.findIndex(l => l.id === editandoLeadId);
    if (idx >= 0) leads[idx] = { ...leads[idx], ...updateData };

    await registrarHistorico(editandoLeadId, 'edicao', `Lead atualizado`, {
      campos_alterados: ['nome', 'telefone', 'valor', 'tag', 'notas', 'lembrete'],
      valor_novo: valor, tag_nova: tag
    });
  } else {
    // Inserir
    const result = await UpsidenDB.from('leads').insert({
      nome, telefone, valor, tag, tag_cor: tagCor, notas,
      lembrete_data: lembreteData, lembrete_texto: lembreteTexto,
      etapa: 'prospeccao', responsavel_id: userId
    }).execute();
    if (result?.length) {
      leads.push(result[0]);
      await registrarHistorico(result[0].id, 'criacao', `Lead "${nome}" criado`, {
        valor_inicial: valor, tag_inicial: tag, telefone
      });
    }
  }

  // Disparar lembrete via Service Worker (#24)
  if (lembreteData) {
    try {
      chrome.runtime.sendMessage({
        action: 'SET_REMINDER',
        payload: { leadId: editandoLeadId || 'new', nome, data: lembreteData, texto: lembreteTexto }
      });
    } catch (e) { /* SW pode não estar disponível */ }
  }

  fecharModal();
  renderizarKanban();
}

// ═══ HISTÓRICO DE INTERAÇÕES (#25) — com metadata ═══
async function registrarHistorico(leadId, tipo, descricao, metadados = null) {
  try {
    const payload = { lead_id: leadId, tipo, descricao, criado_por: userId };
    if (metadados) payload.metadados = metadados;
    await UpsidenDB.from('historico_interacoes').insert(payload).execute();
  } catch (e) { /* silent */ }
}

async function carregarHistorico(leadId) {
  const lista = document.getElementById('historico-lista');
  lista.innerHTML = '<div style="text-align:center;color:#4a5568;font-size:10px;padding:8px;">Carregando...</div>';

  try {
    const data = await UpsidenDB.from('historico_interacoes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', false)
      .execute();

    if (!data || data.length === 0) {
      lista.innerHTML = '<div style="text-align:center;color:#4a5568;font-size:10px;padding:8px;">Nenhuma interação registrada</div>';
      return;
    }

    lista.innerHTML = '';
    data.forEach(item => {
      const el = document.createElement('div');
      el.className = 'historico-item';
      const dataStr = new Date(item.created_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const metaStr = item.metadados ? ` <span style="color:#00a884;font-size:9px;">[${Object.keys(item.metadados).join(', ')}]</span>` : '';
      el.innerHTML = `<span>${item.descricao || item.tipo}${metaStr}</span><span class="hist-data">${dataStr}</span>`;
      lista.appendChild(el);
    });
  } catch (e) {
    lista.innerHTML = '<div style="color:#f15c6d;font-size:10px;padding:8px;">Erro ao carregar histórico</div>';
  }
}

// ═══ INICIALIZAÇÃO ═══════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.querySelector('.crm-app').innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar o CRM.</p>';
    return;
  }

  await carregarLeads();
  renderizarKanban();
  configurarDragAndDrop();

  // Botão: Novo Lead
  document.getElementById('btn-add-lead').addEventListener('click', () => abrirModalLead());

  // Modal: Salvar e Cancelar
  document.getElementById('modal-salvar').addEventListener('click', salvarLead);
  document.getElementById('modal-cancelar').addEventListener('click', fecharModal);
  document.getElementById('modal-fechar').addEventListener('click', fecharModal);

  // Filtro por Tag
  document.getElementById('filtro-tag').addEventListener('change', renderizarKanban);

  // Fechar modal ao clicar fora
  document.getElementById('modal-lead').addEventListener('click', e => {
    if (e.target.id === 'modal-lead') fecharModal();
  });
});
