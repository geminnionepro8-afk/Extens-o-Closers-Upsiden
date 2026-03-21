/**
 * @file painel-templates-crm.js
 * @description Renderiza as seções Templates e CRM/Funil do Painel.
 *              Templates: lista de textos rápidos com CRUD + modal de edição.
 *              CRM: quadro Kanban com colunas Prospecção, Negociação, Fechado + modal de novo lead.
 * @module Módulo 06: UI — Painel (Templates + CRM)
 * @date 21/03/2026
 */

// ═══ TEMPLATES ═══════════════════════════════════════════════
function renderTemplates(c) {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" data-click="showNewTemplateModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Template</button>`;
  if (painelData.templates.length === 0) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><h3>Nenhum template</h3><p>Crie templates de texto para agilizar suas conversas.</p></div>`;
  } else {
    let html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    painelData.templates.forEach(t => {
      html += `<div class="auto-section animate-in" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div style="flex:1;"><h3 style="margin-bottom:8px;">${t.titulo || t.nome || 'Sem título'}</h3><p style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.5;">${t.conteudo || t.texto || ''}</p></div>
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

// ═══ TEMPLATE MODAL ══════════════════════════════════════════
function showNewTemplateModal() { showTemplateModal(null); }
function editTemplate(id) { const t = painelData.templates.find(x=>x.id===id); if (t) showTemplateModal(t); }

function showTemplateModal(template) {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${template ? 'Editar' : 'Novo'} Template</h3><button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
  <div class="modal-body"><div class="form-group"><label class="form-label">Título</label><input class="form-input" id="tpl-titulo" value="${template?.titulo||template?.nome||''}"></div><div class="form-group"><label class="form-label">Conteúdo</label><textarea class="form-textarea" id="tpl-conteudo" rows="5">${template?.conteudo||template?.texto||''}</textarea></div></div>
  <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="salvarTemplate('${template?.id||''}')">Salvar</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function salvarTemplate(id) {
  const titulo = document.getElementById('tpl-titulo').value.trim();
  const conteudo = document.getElementById('tpl-conteudo').value.trim();
  if (!titulo || !conteudo) { toast('Preencha título e conteúdo', 'error'); return; }
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

// ═══ CRM ═════════════════════════════════════════════════════
function renderCRM(c) {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" data-click="showNewLeadModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Lead</button>`;
  const stages = [
    { id: 'prospeccao', label: 'Prospecção', color: 'var(--warning)' },
    { id: 'negociacao', label: 'Negociação', color: 'var(--accent)' },
    { id: 'fechado', label: 'Fechado', color: 'var(--success)' }
  ];
  let html = '<div class="kanban-board">';
  stages.forEach(stage => {
    const stageLeads = painelData.leads.filter(l => l.estagio === stage.id);
    html += `<div class="kanban-column">
      <div class="kanban-column-header"><span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:${stage.color}"></span>${stage.label}</span><span class="count">${stageLeads.length}</span></div>
      <div class="kanban-cards" data-stage="${stage.id}">`;
    stageLeads.forEach(lead => {
      html += `<div class="kanban-card" draggable="true" data-lead-id="${lead.id}"><div class="card-name">${lead.nome}</div><div class="card-phone">${lead.telefone || ''}</div></div>`;
    });
    if (stageLeads.length === 0) html += `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Nenhum lead</div>`;
    html += `</div></div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// ═══ LEAD MODAL ══════════════════════════════════════════════
function showNewLeadModal() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>Novo Lead</h3><button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
  <div class="modal-body"><div class="form-group"><label class="form-label">Nome</label><input class="form-input" id="lead-nome" placeholder="Nome do lead"></div><div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="lead-tel" placeholder="Ex: 5531999999999"></div></div>
  <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Cancelar</button><button class="btn btn-primary" data-click="salvarLead()">Salvar</button></div></div>`;
  document.body.appendChild(overlay);
}

async function salvarLead() {
  const nome = document.getElementById('lead-nome').value.trim();
  const telefone = document.getElementById('lead-tel').value.trim();
  if (!nome) { toast('Informe o nome do lead', 'error'); return; }
  try {
    const res = await UpsidenDB.from('leads').insert({ nome, telefone, estagio: 'prospeccao', criado_por: userData.userId }).execute();
    if (res?.length) painelData.leads.unshift(res[0]);
    document.querySelector('.modal-overlay')?.remove();
    renderSection('crm'); toast('Lead criado!', 'success');
  } catch(e) { toast('Erro ao criar lead', 'error'); }
}
