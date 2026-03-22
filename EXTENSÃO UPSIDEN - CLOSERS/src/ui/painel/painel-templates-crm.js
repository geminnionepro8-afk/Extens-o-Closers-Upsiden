/**
 * @file painel-templates-crm.js
 * @description Renderiza as secoes Templates e CRM/Funil do Painel.
 *              Templates: lista de textos rapidos com CRUD + modal de edicao.
 *              CRM: quadro Kanban com colunas Prospeccao, Negociacao, Fechado + modal de novo lead.
 * @module Modulo 06: UI - Painel (Templates + CRM)
 * @date 21/03/2026
 */

// === TEMPLATES ===
function renderTemplates(c) {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" data-click="showNewTemplateModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Template</button>`;
  if (painelData.templates.length === 0) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><h3>Nenhum template</h3><p>Crie templates de texto para agilizar suas conversas.</p></div>`;
  } else {
    let html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    painelData.templates.forEach(t => {
      html += `<div class="auto-section animate-in" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div style="flex:1;"><h3 style="margin-bottom:8px;">${t.titulo || t.nome || 'Sem titulo'}</h3><p style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.5;">${t.conteudo || t.texto || ''}</p></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn-icon" title="Editar" data-click="editTemplate('${t.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="btn-icon" title="Excluir" data-click="deleteItem('templates','${t.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </div>
      </div>`;
    });
    html += '</div>';
    c.innerHTML = html;
  }
}

// === TEMPLATE MODAL ===
function showNewTemplateModal() { showTemplateModal(null); }
function editTemplate(id) { const t = painelData.templates.find(x=>x.id===id); if (t) showTemplateModal(t); }

function showTemplateModal(template) {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  const tplId = template?.id || '';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${template ? 'Editar' : 'Novo'} Template</h3><button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
  <div class="modal-body"><div class="form-group"><label class="form-label">Titulo</label><input class="form-input" id="tpl-titulo" value="${template?.titulo||template?.nome||''}"></div><div class="form-group"><label class="form-label">Conteudo</label><textarea class="form-textarea" id="tpl-conteudo" rows="5">${template?.conteudo||template?.texto||''}</textarea></div></div>
  <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Cancelar</button><button class="btn btn-primary" data-click="salvarTemplate('${tplId}')">Salvar</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function salvarTemplate(id) {
  const titulo = document.getElementById('tpl-titulo').value.trim();
  const conteudo = document.getElementById('tpl-conteudo').value.trim();
  if (!titulo || !conteudo) { toast('Preencha titulo e conteudo', 'error'); return; }
  try {
    if (id) {
      await UpsidenDB.from('templates').eq('id', id).update({ titulo, conteudo }).execute();
      const idx = painelData.templates.findIndex(t=>t.id===id);
      if (idx>=0) painelData.templates[idx] = {...painelData.templates[idx], titulo, conteudo};
    } else {
      const res = await UpsidenDB.from('templates').insert({ titulo, conteudo, criado_por: userData.userId }).execute();
      if (res?.length) painelData.templates.unshift(res[0]);
    }
    document.querySelector('.modal-overlay')?.remove();
    renderSection('templates'); toast('Template salvo!', 'success');
  } catch(e) { toast('Erro ao salvar template', 'error'); }
}

// === CRM ===
const CRM_TAGS = {
  quente:  { bg: '#FFB4B4', cor: '#8B1A1A', emoji: '🔥' },
  morno:   { bg: '#FFE5B4', cor: '#8B6914', emoji: '☀️' },
  frio:    { bg: '#B4D7FF', cor: '#1A4B8B', emoji: '❄️' },
  vip:     { bg: '#E5B4FF', cor: '#5A1A8B', emoji: '⭐' },
  urgente: { bg: '#FFB4D7', cor: '#8B1A4B', emoji: '🚨' }
};
function fmtMoeda(v) { return (parseFloat(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

function renderCRM(c) {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" data-click="showNewLeadModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Lead</button>`;
  const stages = [
    { id: 'prospeccao', label: 'Prospeccao', color: '#FFD666' },
    { id: 'negociacao', label: 'Negociacao', color: '#66B2FF' },
    { id: 'fechado', label: 'Fechado', color: '#66FFB2' }
  ];
  let html = '<div class="kanban-board">';
  stages.forEach(stage => {
    const stageLeads = painelData.leads.filter(l => (l.estagio||l.etapa) === stage.id);
    const somaValor = stageLeads.reduce((a,l) => a + (parseFloat(l.valor)||0), 0);
    html += `<div class="kanban-column">
      <div class="kanban-column-header">
        <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:${stage.color}"></span>${stage.label}</span>
        <span style="display:flex;flex-direction:column;align-items:flex-end;"><span class="count">${stageLeads.length}</span><span style="font-size:10px;color:#00a884;font-weight:700;">${fmtMoeda(somaValor)}</span></span>
      </div>
      <div class="kanban-cards" data-stage="${stage.id}">`;
    stageLeads.forEach(lead => {
      let tagHtml = '';
      if (lead.tag && CRM_TAGS[lead.tag]) {
        const t = CRM_TAGS[lead.tag];
        tagHtml = `<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:${t.bg};color:${t.cor};font-weight:600;">${t.emoji} ${lead.tag}</span>`;
      }
      html += `<div class="kanban-card" draggable="true" data-lead-id="${lead.id}" data-click="editLeadModal('${lead.id}')" style="backdrop-filter:blur(10px);background:rgba(32,44,51,0.85);border-radius:10px;transition:all 0.3s;cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div class="card-name">${lead.nome}</div>${tagHtml}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
          <span>${lead.telefone || ''}</span>
          <span style="color:#00a884;font-weight:700;">${fmtMoeda(lead.valor)}</span>
        </div>
        ${lead.notas ? `<div style="font-size:10px;color:#667781;margin-top:4px;border-top:1px solid #222e35;padding-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📝 ${lead.notas}</div>` : ''}
      </div>`;
    });
    if (stageLeads.length === 0) html += `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Nenhum lead</div>`;
    html += `</div></div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// === LEAD MODAL (Expanded) ===
function showNewLeadModal() { showLeadEditModal(null); }
function editLeadModal(id) { const l = painelData.leads.find(x=>x.id===id); if(l) showLeadEditModal(l); }

function showLeadEditModal(lead) {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.style.cssText = 'backdrop-filter:blur(6px);';
  const tagOptions = Object.entries(CRM_TAGS).map(([k,v]) => `<option value="${k}" ${lead?.tag===k?'selected':''}>${v.emoji} ${k}</option>`).join('');
  const lembreteVal = lead?.lembrete_data ? new Date(lead.lembrete_data).toISOString().slice(0,16) : '';
  const leadId = lead?.id || '';
  overlay.innerHTML = `<div class="modal" style="max-width:480px;border-radius:16px;backdrop-filter:blur(20px);background:rgba(17,27,33,0.95);">
    <div class="modal-header"><h3>${lead ? '📋 '+lead.nome : 'Novo Lead'}</h3><button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
    <div class="modal-body">
      <div style="display:flex;gap:10px;"><div class="form-group" style="flex:1;"><label class="form-label">Nome</label><input class="form-input" id="lead-nome" value="${lead?.nome||''}"></div><div class="form-group" style="flex:1;"><label class="form-label">Telefone</label><input class="form-input" id="lead-tel" value="${lead?.telefone||''}"></div></div>
      <div style="display:flex;gap:10px;"><div class="form-group" style="flex:1;"><label class="form-label">Valor (R$)</label><input type="number" class="form-input" id="lead-valor" value="${lead?.valor||0}" min="0" step="0.01"></div><div class="form-group" style="flex:1;"><label class="form-label">Tag</label><select class="form-input" id="lead-tag"><option value="">Sem tag</option>${tagOptions}</select></div></div>
      <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="lead-notas" rows="2">${lead?.notas||''}</textarea></div>
      <div style="display:flex;gap:10px;"><div class="form-group" style="flex:1;"><label class="form-label">Lembrete</label><input type="datetime-local" class="form-input" id="lead-lembrete" value="${lembreteVal}"></div><div class="form-group" style="flex:1;"><label class="form-label">Texto</label><input class="form-input" id="lead-lembrete-txt" value="${lead?.lembrete_texto||''}"></div></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Cancelar</button><button class="btn btn-primary" data-click="salvarLeadCompleto('${leadId}')">Salvar</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

async function salvarLeadCompleto(id) {
  const nome = document.getElementById('lead-nome').value.trim();
  const telefone = document.getElementById('lead-tel').value.trim();
  const valor = parseFloat(document.getElementById('lead-valor').value) || 0;
  const tag = document.getElementById('lead-tag').value;
  const tagCor = CRM_TAGS[tag]?.bg || '#8696a0';
  const notas = document.getElementById('lead-notas').value.trim();
  const lembreteInput = document.getElementById('lead-lembrete').value;
  const lembreteData = lembreteInput ? new Date(lembreteInput).toISOString() : null;
  const lembreteTexto = document.getElementById('lead-lembrete-txt').value.trim();
  if (!nome) { toast('Informe o nome do lead', 'error'); return; }
  try {
    if (id) {
      const upd = { nome, telefone, valor, tag, tag_cor: tagCor, notas, lembrete_data: lembreteData, lembrete_texto: lembreteTexto, updated_at: new Date().toISOString() };
      await UpsidenDB.from('leads').eq('id', id).update(upd).execute();
      const idx = painelData.leads.findIndex(l=>l.id===id);
      if (idx>=0) painelData.leads[idx] = {...painelData.leads[idx], ...upd};
      try { await UpsidenDB.from('historico_interacoes').insert({ lead_id: id, tipo: 'edicao', descricao: 'Lead atualizado', criado_por: userData.userId, metadados: { campos_alterados: ['nome','telefone','valor','tag','notas','lembrete'], valor_novo: valor, tag_nova: tag } }).execute(); } catch(e){}
    } else {
      const res = await UpsidenDB.from('leads').insert({ nome, telefone, valor, tag, tag_cor: tagCor, notas, lembrete_data: lembreteData, lembrete_texto: lembreteTexto, estagio: 'prospeccao', criado_por: userData.userId }).execute();
      if (res?.length) { painelData.leads.unshift(res[0]); try { await UpsidenDB.from('historico_interacoes').insert({ lead_id: res[0].id, tipo: 'criacao', descricao: `Lead "${nome}" criado`, criado_por: userData.userId, metadados: { valor_inicial: valor, tag_inicial: tag, telefone } }).execute(); } catch(e){} }
    }
    if (lembreteData) { try { chrome.runtime.sendMessage({ action: 'SET_REMINDER', payload: { leadId: id||'new', nome, data: lembreteData, texto: lembreteTexto } }); } catch(e){} }
    document.querySelector('.modal-overlay')?.remove();
    renderSection('crm'); toast('Lead salvo!', 'success');
  } catch(e) { toast('Erro ao salvar lead', 'error'); }
}

// === EXPORT ALL FUNCTIONS TO WINDOW (required for data-click delegation) ===
window.renderTemplates = renderTemplates;
window.showNewTemplateModal = showNewTemplateModal;
window.editTemplate = editTemplate;
window.salvarTemplate = salvarTemplate;
window.renderCRM = renderCRM;
window.showNewLeadModal = showNewLeadModal;
window.editLeadModal = editLeadModal;
window.showLeadEditModal = showLeadEditModal;
window.salvarLeadCompleto = salvarLeadCompleto;
window.salvarLead = salvarLeadCompleto; // backward compat alias
