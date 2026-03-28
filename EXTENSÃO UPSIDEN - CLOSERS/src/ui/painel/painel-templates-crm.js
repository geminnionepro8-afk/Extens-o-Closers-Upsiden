/**
 * @file painel-templates-crm.js
 * @description Renderiza as secoes Templates e CRM/Funil do Painel.
 *              Templates: lista de textos rapidos com CRUD + modal de edicao.
 *              CRM: quadro Kanban com colunas Prospeccao, Negociacao, Fechado + modal de novo lead.
 * @module Modulo 06: UI - Painel (Templates + CRM)
 * @date 21/03/2026
 */

// === TEMPLATES ===
// CSS Centralizado Red Sun para Kanban (Compartilhado entre Modos)
const KANBAN_CORE_STYLE = `
  <style id="kanban-premium-styles">
     .ws-board-redsun { 
        display: flex; gap: 32px; padding: 24px; 
        overflow-x: auto; min-height: calc(100vh - 120px); width: 100%; 
        background: var(--bg-primary); font-family: 'Outfit', sans-serif; 
        box-sizing: border-box;
     }
     .ws-board-redsun::-webkit-scrollbar { height: 6px; }
     .ws-board-redsun::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
     
     .ws-col-rs { width: 320px; min-width: 320px; display: flex; flex-direction: column; max-height: 100%; }
     .ws-col-header-rs { padding-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
     
     .col-header-top { display: flex; justify-content: space-between; align-items: center; }
     .col-title-wrap { display: flex; align-items: center; gap: 10px; }
     .col-indicator { width: 3px; height: 18px; border-radius: 4px; background: var(--col-color, var(--accent)); }
     .ws-col-title-rs { font-size: 18px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
     
     .col-header-meta { display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 12px; font-weight: 500; }
     
     .col-actions-rs { display: flex; gap: 8px; }
     .col-btn-rs { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
     .col-btn-rs:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--text-muted); }

     .ws-cards-container-rs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; padding: 4px; min-height: 100px; }
     .ws-cards-container-rs::-webkit-scrollbar { width: 4px; }
     .ws-cards-container-rs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
     
     /* ── Premium RedSun Card — Reference-Accurate ── */
     .ws-card-premium { 
        background: var(--bg-secondary); 
        border-radius: 14px; 
        overflow: hidden; 
        cursor: grab; 
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
        position: relative; 
        box-shadow: 0 4px 18px rgba(0,0,0,0.25); 
        display: flex; 
        flex-direction: column; 
        border: 1px solid rgba(255,255,255,0.07); 
     }
     .ws-card-premium:hover { 
        transform: translateY(-4px); 
        box-shadow: 0 14px 32px rgba(0,0,0,0.45); 
        border-color: rgba(255,255,255,0.14); 
     }
     
     /* Priority banner: full-width, flush to top, rounded top corners matching card */
     .card-priority-banner { 
        width: 100%;
        padding: 7px 16px; 
        font-size: 10px; 
        font-weight: 600;
        text-align: center; 
        text-transform: uppercase; 
        letter-spacing: 1.5px; 
        color: rgba(0,0,0,0.80); 
        background: var(--urgency-color, #555);
        flex-shrink: 0;
     }
     
     /* Inner dashed box: reference-accurate — tight top margin, proper padding */
     .card-inner-box { 
        margin: 10px 10px 0; 
        padding: 14px 14px 10px;
        border: 1px dashed rgba(255,255,255,0.09); 
        border-radius: 10px; 
        display: flex; 
        flex-direction: column; 
        gap: 10px; 
        background: rgba(255,255,255,0.015);
     }
     
     /* Title: NOT bold per reference — weight 500 (medium) */
     .card-title-premium { 
        font-size: 16px; 
        font-weight: 500; 
        color: var(--text-primary); 
        margin: 0; 
        letter-spacing: -0.1px;
        line-height: 1.35;
     }
     
     .card-desc-premium { 
        font-size: 13px; 
        color: var(--text-muted); 
        line-height: 1.5; 
        display: -webkit-box; 
        -webkit-line-clamp: 2; 
        -webkit-box-orient: vertical; 
        overflow: hidden; 
        margin: 0;
     }
     
     .card-mid-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-top: 4px; 
     }
     
     .card-avatars-rs { display: flex; align-items: center; }
     .card-avatar-item { 
       width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--bg-secondary); 
       background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; 
       font-size: 11px; font-weight: 700; margin-left: -8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); overflow: hidden;
     }
     .card-avatar-item:first-child { margin-left: 0; }
     .card-avatar-item img { width: 100%; height: 100%; object-fit: cover; }
     
     /* Status badge: pill shape like reference */
     .card-status-badge-rs { 
       padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; 
       background: var(--status-bg, rgba(255,255,255,0.06)); 
       color: var(--status-color, var(--text-secondary));
       border: 1px solid rgba(255,255,255,0.08);
       white-space: nowrap;
     }
     
     /* Footer: reference has subtle separator + icon meta + date */
     .card-footer-premium { 
        padding: 10px 14px 12px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        color: var(--text-muted); 
        font-size: 11.5px; 
        font-weight: 500;
        border-top: 1px solid rgba(255,255,255,0.05);
        margin-top: 2px;
     }
     .card-date-premium { font-size: 11px; color: var(--text-muted); opacity: 0.55; }
     .card-actions-rs { display: flex; align-items: center; gap: 6px; }
     
     .card-meta-rs { display: flex; align-items: center; gap: 12px; }
     .meta-rs-item { display: flex; align-items: center; gap: 5px; opacity: 0.65; cursor: pointer; transition: opacity 0.15s; }
     .meta-rs-item:hover { opacity: 1; }
     .meta-rs-item svg { width: 13px; height: 13px; }

     .ws-cards-container-rs.drag-over { background: var(--accent-dim); border-radius: 12px; outline: 2px dashed var(--accent-glow); }
  </style>
`;

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
      await UpsidenDB.from('templates').update({ titulo, conteudo }).eq('id', id);
      const idx = painelData.templates.findIndex(t=>t.id===id);
      if (idx>=0) painelData.templates[idx] = {...painelData.templates[idx], titulo, conteudo};
    } else {
      const res = await UpsidenDB.from('templates').insert({ titulo, conteudo, criado_por: userData.userId }).select();
      if (res?.length) painelData.templates.unshift(res[0]);
    }
    document.querySelector('.modal-overlay')?.remove();
    renderSection('templates'); toast('Template salvo!', 'success');
  } catch(e) { toast('Erro ao salvar template', 'error'); }
}

// === CRM DYNAMICS (Colunas e Tags) ===
let dynamicStages = [];
let dynamicTags = {};

// Urgency Levels (configurable priority)
const URGENCY_LEVELS_CRM = {
  normal:      { label: 'Normal',      color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' }, // Green
  importante:  { label: 'Importante',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' }, // Blue
  urgente:     { label: 'Urgente',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' }, // Orange
  critico:     { label: 'Cr\u00edtico',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' }, // Red
  vip:         { label: 'VIP',         color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' }  // Purple
};

async function loadCRMDynamics() {
  return new Promise(resolve => {
    chrome.storage.local.get(['ups_crm_colunas', 'ups_crm_tags'], (res) => {
      // 1. Colunas (Fases do Funil)
      if (res.ups_crm_colunas && res.ups_crm_colunas.length > 0) {
        dynamicStages = res.ups_crm_colunas;
      } else {
        dynamicStages = [
          { id: 'prospeccao', label: 'Prospecção', color: '#FFD666' },
          { id: 'negociacao', label: 'Negociação', color: '#66B2FF' },
          { id: 'fechado', label: 'Fechado', color: '#66FFB2' }
        ];
      }
      
      // 2. Multi-Tags Coloridas (Labels)
      if (res.ups_crm_tags && Object.keys(res.ups_crm_tags).length > 0) {
        dynamicTags = res.ups_crm_tags;
      } else {
        dynamicTags = {
          quente:  { bg: '#FFB4B4', cor: '#8B1A1A', emoji: '🔥' },
          morno:   { bg: '#FFE5B4', cor: '#8B6914', emoji: '☀️' },
          frio:    { bg: '#B4D7FF', cor: '#1A4B8B', emoji: '❄️' },
          vip:     { bg: '#E5B4FF', cor: '#5A1A8B', emoji: '⭐' },
          urgente: { bg: '#FFB4D7', cor: '#8B1A4B', emoji: '🚨' }
        };
      }
      resolve();
    });
  });
}

function fmtMoeda(v) { return (parseFloat(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

window.crmSyncModeActive = false;

window.toggleCRMSyncMode = function(checked) {
   window.crmSyncModeActive = checked;
   if (typeof renderSection === 'function') renderSection('crm');
};

async function renderCRM(c) {
   if (window.currentCRMTab === 'agenda') {
       await renderAgendaCRM(c);
       return;
   }

   if (window.crmSyncModeActive) {
       await renderSyncLabelsCRM(c);
   } else {
       await renderCustomCRM(c);
   }
}

// === CRM PERSONALIZADO (NOVA INTEGRAÇÃO WASPEED) ===
window.currentCRMViewMode = window.currentCRMViewMode || 'abas'; // 'abas' ou 'etiquetas'

// Funções globais para o sistema data-click do Painel (CSP compliant)
window.currentCRMTab = 'kanban'; // 'kanban', 'agenda'

window.setCRMTab = function(tab) {
  window.currentCRMTab = tab;
  renderSection('crm');
};

window.toggleCRMViewMode = function() {
  // Funil Kanban vs Etiquetas Sync
  window.crmSyncModeActive = !window.crmSyncModeActive;
  window.currentCRMTab = 'kanban'; 
  renderSection('crm');
};

window.activateSyncMode = function() {
  window.crmSyncModeActive = true;
  renderSection('crm');
};

window.openWppDirect = function(phone) {
  if (!phone) { typeof toast === 'function' && toast('Sem número de WhatsApp salvo.', 'error'); return; }
  window.open('https://web.whatsapp.com/send?phone=' + phone, '_blank');
};

async function renderCustomCRM(c) {
  await loadCRMDynamics();
  
  // Load urgency from local storage
  const urgMap = await new Promise(resolve => {
    chrome.storage.local.get(['ups_crm_urgencias'], (res) => resolve(res.ups_crm_urgencias || {}));
  });
  // Merge into in-memory leads
  painelData.leads.forEach(l => { if(urgMap[l.id]) l.urgencia = urgMap[l.id]; });

  const modoAtual = window.crmSyncModeActive ? 'Etiquetas WPP' : 'Abas do Funil';
  
  // Limpar header actions e carregar no controls-bar
  document.getElementById('header-actions').innerHTML = '';
  document.getElementById('page-controls-bar').innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; width:100%;">
      <div class="rs-tabs-switcher" style="margin-bottom:0; padding:2px;">
         <button class="rs-tab-btn ${window.currentCRMTab === 'kanban' ? 'active' : ''}" data-click="setCRMTab('kanban')">📋 Kanban</button>
         <button class="rs-tab-btn ${window.currentCRMTab === 'agenda' ? 'active' : ''}" data-click="setCRMTab('agenda')">🔔 Agenda</button>
      </div>
      
      <div class="separator-v" style="width:1px; height:20px; background:var(--border); margin:0 8px;"></div>

      <button class="btn btn-secondary" data-click="toggleCRMViewMode()" title="Alternar Base">
         <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
         Modo: ${modoAtual}
      </button>

      <button class="btn btn-primary" data-click="showNewLeadModal()">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Lead
      </button>

      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
         <button class="btn-icon" data-click="setCRMTab('agenda')" id="btn-bell-reminders-crm" title="Central de Lembretes" style="position:relative;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span id="notif-badge-crm" class="notif-badge" style="display:none; position:absolute; top:-5px; right:-5px;">0</span>
         </button>
      </div>
    </div>
  `;

  // Esconder o sino original do header quando estiver no CRM
  const headerBell = document.getElementById('btn-bell-reminders');
  if (headerBell) headerBell.parentElement.style.display = 'none';
  
  // Re-checar notificações para atualizar o novo badge
  if (typeof window.checkNotifications === 'function') window.checkNotifications();

  let colunasParaRenderizar = [];
  if (window.currentCRMViewMode === 'abas') {
     colunasParaRenderizar = dynamicStages.map(s => ({ id: s.id, titulo: s.label, color: s.color || '#FFF', field: 'etapa', leads: painelData.leads.filter(l => (l.estagio || l.etapa) === s.id) }));
  } else {
     Object.keys(dynamicTags).forEach(k => {
         const tg = dynamicTags[k];
         colunasParaRenderizar.push({ id: k, titulo: tg.emoji ? (tg.emoji + ' ' + k) : k, color: tg.bg || '#FFF', field: 'tag', leads: painelData.leads.filter(l => Array.isArray(l.tag) ? l.tag.includes(k) : l.tag === k) });
     });
     colunasParaRenderizar.push({ id: 'sem_tag', titulo: 'Sem Etiqueta', color: '#888', field: 'tag', leads: painelData.leads.filter(l => !l.tag || (Array.isArray(l.tag) && l.tag.length === 0)) });
  }

  let html = KANBAN_CORE_STYLE + '<div class="ws-board-redsun">';
  colunasParaRenderizar.forEach(col => {
    html += `<div class="ws-col ws-col-rs">
      <div class="ws-col-header-rs" style="--col-color: ${col.color};">
        <div class="col-header-top">
          <div class="col-title-wrap">
            <div class="col-indicator"></div>
            <div class="ws-col-title-rs">${col.titulo}</div>
          </div>
          <div class="col-actions-rs">
            <button class="col-btn-rs" data-click="showNewLeadModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></button>
            <button class="col-btn-rs" data-click="showCRMManagerModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          </div>
        </div>
        <div class="col-header-meta">
          <span>${col.leads.length} Contatos</span>
          <span>Atualizado hoje</span>
        </div>
      </div>
      <div class="kanban-cards ws-cards-container-rs" data-stage="${col.id}" data-field="${col.field}">`;
    
    col.leads.forEach(lead => {
      let tagHtml = '';
      if (lead.tag) {
        let tagsArray = Array.isArray(lead.tag) ? lead.tag : [lead.tag];
        tagHtml = `<div class="card-tags-rs">`;
        tagsArray.forEach(tgKey => {
           if (dynamicTags[tgKey]) {
             const t = dynamicTags[tgKey];
             tagHtml += `<span class="card-tag-rs">${t.emoji} ${tgKey}</span>`;
           }
        });
        tagHtml += `</div>`;
      }
      
      let avatarChar = lead.nome ? lead.nome[0].toUpperCase() : '?';
      let clearPhone = (lead.telefone || '').replace(/\D/g, '');
      
      // Configurable urgency
      let urg = URGENCY_LEVELS_CRM[lead.urgencia] || URGENCY_LEVELS_CRM.normal;
      let urgPillClass = urg.pillClass ? ` ${urg.pillClass}` : '';
      let urgPillStyle = urg.pillClass ? '' : `background:${urg.bg};color:${urg.color};border:1px solid ${urg.border};`;
      
      let dateStr = lead.lembrete_data ? new Date(lead.lembrete_data).toLocaleDateString('pt-BR') : 'Hoje';

      // Avatar: photo or letter
      let photoAvatar = lead.foto_url 
        ? `<div class="card-avatar-item"><img src="${lead.foto_url}" alt=""></div>`
        : `<div class="card-avatar-item">${avatarChar}</div>`;

      html += `
        <div class="kanban-card ws-card-premium" draggable="true" data-lead-id="${lead.id}">
           <!-- Priority Banner -->
           <div class="card-priority-banner" style="--urgency-color: ${urg.color};">
             ${urg.label} PRIORIDADE
           </div>
           
           <div class="card-inner-box">
             <h3 class="card-title-premium" data-click="editLeadModal('${lead.id}')">${lead.nome || 'Lead s/ Nome'}</h3>
             
             <p class="card-desc-premium" data-click="editLeadModal('${lead.id}')">
               ${lead.notas || 'Sem anotações no CRM.'}
             </p>
             
             <div class="card-mid-row">
               <div class="card-avatars-rs">
                 ${photoAvatar}
                 <div class="card-avatar-item" style="background:var(--bg-tertiary);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg></div>
               </div>
               
               <div class="card-status-badge-rs" style="--status-color: ${col.color}; --status-bg: ${col.color}15;">
                 ${col.titulo}
               </div>
             </div>
           </div>
           
           <div class="card-footer-premium">
              <div class="card-meta-rs">
                <div class="meta-rs-item" title="Ver Notas" data-click="editLeadModal('${lead.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>1</span>
                </div>
                <div class="meta-rs-item" style="cursor:pointer;" data-click="openWppDirect('${clearPhone}')" title="WhatsApp Business">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </div>
              </div>
              <div class="card-date-premium">
                ${dateStr}
              </div>
           </div>
        </div>
      `;
    });
    
    if (col.leads.length === 0) html += `<div style="padding:40px 20px;text-align:center;color:var(--text-muted);font-size:13px; opacity:0.3; font-style:italic;">Quadro Vazio</div>`;
    html += `</div></div>`;
  });
  html += '</div>';
  c.innerHTML = html;
  
  setTimeout(assignKanbanDragDrop, 150);
}

// === CRM SINCRONIZADO (ETIQUETAS DO WPP) ===
async function renderSyncLabelsCRM(c) {
    // 1. Unified Header (Consistent with Manual CRM)
    const modoAtual = 'Etiquetas WPP';
    document.getElementById('header-actions').innerHTML = '';
    document.getElementById('page-controls-bar').innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; width:100%;">
       <button class="btn btn-secondary" data-click="toggleCRMViewMode()" title="Voltar para Funil Interno">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          Modo: Etiquetas WPP
       </button>
       <button class="btn btn-secondary" data-click="navigate('contatos')" title="Extração & Importação">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Extração & Importação
       </button>
       <div class="separator-v" style="width:1px; height:20px; background:var(--border); margin:0 8px;"></div>
       <span style="font-size:12px; color:var(--success); font-weight:bold; display:flex; align-items:center; gap:6px;">
         <span style="display:inline-block; width:6px; height:6px; background:var(--success); border-radius:50%; box-shadow:0 0 8px var(--success);"></span> 
         Conexão Live: Ativa
       </span>

       <div style="margin-left:auto; display:flex; align-items:center;">
          <button class="btn-icon" data-click="setCRMTab('agenda')" id="btn-bell-reminders-crm" title="Central de Lembretes" style="position:relative;">
             <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
             <span id="notif-badge-crm" class="notif-badge" style="display:none; position:absolute; top:-5px; right:-5px;">0</span>
          </button>
       </div>
     </div>
   `;

   // Esconder o sino original do header
   const headerBellSync = document.getElementById('btn-bell-reminders');
   if (headerBellSync) headerBellSync.parentElement.style.display = 'none';

   c.innerHTML = `<div class="empty-state"><div class="loading-spinner"></div><h3>Sincronizando Etiquetas...</h3><p>Isso pode levar alguns segundos dependendo do volume de contatos.</p></div>`;
   
   chrome.runtime.sendMessage({ tipo: 'get_wpp_labels' }, (res) => {
      if (!res || !res.sucesso) {
         c.innerHTML = `<div class="empty-state"><h3>Erro na Sincronização</h3><p>${res?.erro || 'Verifique se o WhatsApp Web está aberto.'}</p></div>`;
         return;
       }
       
       const labels = res.dados || [];

       if (labels.length === 0) {
         c.innerHTML = `
           <div class="empty-state">
             <div class="empty-icon">🏷️</div>
             <h3>Nenhuma Etiqueta Encontrada</h3>
             <p>Você ainda não criou etiquetas no seu WhatsApp Web ou o Zap não está conectado.</p>
             <button class="btn btn-primary" style="margin-top:20px;" data-click="toggleCRMViewMode()">Voltar para Funil Interno</button>
           </div>`;
         return;
       }

       let html = KANBAN_CORE_STYLE + '<div class="ws-board-redsun">';
         labels.forEach(lbl => {
           // Ignorar labels sem nome
           if (!lbl.name) return;

           const corHex = lbl.hexColor || '#8696a0';
           let cardsHtml = '';
           
           if (lbl.items && lbl.items.length > 0) {
             lbl.items.forEach(contato => {
                const foneTratado = contato.id.replace('@c.us', '').replace('@g.us', '').replace('@lid', '');
                const nomeEscapado = (contato.nome || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
                const fotoUrlEscapada = contato.foto ? contato.foto.replace(/'/g, "\\'") : '';
                
                const photoAvatar = contato.foto ? 
                   `<div class="card-avatar-item"><img src="${contato.foto}" alt=""></div>` : 
                   `<div class="card-avatar-item" style="background:${corHex};">${(contato.nome || 'C').charAt(0).toUpperCase()}</div>`;
                    
                cardsHtml += `
                  <div class="kanban-card ws-card-premium wpp-sync-card" draggable="true" 
                       data-contact-id="${contato.id}" data-old-label-id="${lbl.id}">
                     
                     <div class="card-priority-banner" style="--urgency-color: var(--success); background:var(--success);">
                       SINCRONIZADO
                     </div>

                     <div class="card-inner-box">
                       <h3 class="card-title-premium" data-click="showWppContactModal('${contato.id}', '${nomeEscapado}', '${fotoUrlEscapada}')">${contato.nome || 'Contato Zap'}</h3>
                       
                       <p class="card-desc-premium">
                         Contato vinculado via Etiquetas. Use o arraste lateral para trocar de etiqueta instantaneamente.
                       </p>
                       
                       <div class="card-mid-row">
                         <div class="card-avatars-rs">
                           ${photoAvatar}
                           <div class="card-avatar-item" style="background:var(--bg-tertiary);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                         </div>
                         
                         <div class="card-status-badge-rs" style="--status-color: ${corHex}; --status-bg: ${corHex}15;">
                           ${lbl.name}
                         </div>
                       </div>
                     </div>

                     <div class="card-footer-premium">
                       <div class="card-meta-rs">
                         <div class="meta-rs-item">
                           <span style="color:var(--success); font-size:14px; line-height:1;">●</span> Online
                         </div>
                       </div>
                       <div class="card-actions-rs">
                           <button title="Abrir Chat" class="col-btn-rs" style="width:24px; height:24px; border-radius:6px;" data-click="openWppChatSync('${foneTratado}')">
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                           </button>
                       </div>
                     </div>
                  </div>`;
             });
           }

           html += `
             <div class="ws-col ws-col-rs sync-column" data-label-id="${lbl.id}">
               <div class="ws-col-header-rs" style="--col-color: ${corHex};">
                 <div class="col-header-top">
                   <div class="col-title-wrap">
                     <div class="col-indicator" style="background:${corHex};"></div>
                     <div class="ws-col-title-rs">${lbl.name}</div>
                   </div>
                   <div class="col-actions-rs">
                     <button class="col-btn-rs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
                   </div>
                 </div>
                 <div class="col-header-meta">
                   <span>${lbl.items?.length || 0} Contatos Live</span>
                   <span>WhatsApp Web Sync</span>
                 </div>
               </div>
               <div class="ws-cards-container-rs wpp-sync-cards" data-label-id="${lbl.id}">
                 ${cardsHtml || '<div style="padding:40px 20px;text-align:center;color:var(--text-muted);font-size:13px; opacity:0.3; font-style:italic;">Nenhum contato nesta etiqueta</div>'}
               </div>
             </div>`;
        });
       html += '</div>';
       c.innerHTML = html;
       
       setTimeout(assignSyncKanbanDragDrop, 150);
    });
}


function assignSyncKanbanDragDrop() {
  const cards = document.querySelectorAll('.wpp-sync-card');
  const cols = document.querySelectorAll('.sync-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
         contactId: card.dataset.contactId,
         oldLabelId: card.dataset.oldLabelId
      }));
      setTimeout(() => card.style.opacity = '0.4', 0);
    });
    card.addEventListener('dragend', () => card.style.opacity = '1');
  });

  cols.forEach(col => {
    const cardsContainer = col.querySelector('.wpp-sync-cards');
    if (!cardsContainer) return;

    col.addEventListener('dragover', e => {
      e.preventDefault();
      cardsContainer.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => cardsContainer.classList.remove('drag-over'));
    col.addEventListener('drop', e => {
      e.preventDefault();
      cardsContainer.classList.remove('drag-over');
      
      const payloadStr = e.dataTransfer.getData('text/plain');
      if (!payloadStr) return;
      
      try {
         const payload = JSON.parse(payloadStr);
         const contactId = payload.contactId;
         const oldLabelId = payload.oldLabelId;
         const newLabelId = cardsContainer.dataset.labelId;
         
         if (contactId && newLabelId && oldLabelId !== newLabelId) {
            // UI FEEL: Mover card imediatamente (Otimismo)
            const cardElement = document.querySelector(`.wpp-sync-card[data-contact-id="${contactId}"]`);
            if (cardElement) {
                cardsContainer.appendChild(cardElement);
                // Atualizar contadores visuais
                updateSyncBadges();
            }

            typeof toast === 'function' && toast(`Sincronizando...`, 'info');
            
            chrome.runtime.sendMessage({ 
                tipo: 'wpp_update_label', 
                dados: { contactId, oldLabelId, newLabelId } 
            }, res => {
                if (res && res.sucesso) {
                    typeof toast === 'function' && toast('WhatsApp Atualizado!', 'success');
                    if (cardElement) cardElement.dataset.oldLabelId = newLabelId;
                } else {
                    // Reversão em caso de erro
                    alert("🚨 ERRO DE SINCRONIZAÇÃO 🚨\n\n" + (res.erro || 'Erro Desconhecido'));
                    const origemContainer = document.querySelector(`.wpp-sync-cards[data-label-id="${oldLabelId}"]`);
                    if (origemContainer && cardElement) {
                        origemContainer.appendChild(cardElement);
                        updateSyncBadges();
                    }
                }
            });
         }
      } catch(err) { console.error('Erro no parser do drag:', err); }
    });
  });
}

function updateSyncBadges() {
    document.querySelectorAll('.sync-column').forEach(col => {
        const badge = col.querySelector('.ws-col-badge-rs');
        const container = col.querySelector('.wpp-sync-cards');
        if (badge && container) {
            const count = container.querySelectorAll('.wpp-sync-card').length;
            badge.textContent = count;
        }
    });
}

// Modal Rápido do Modo Sync com Suporte a Foto Reais
window.showWppContactModal = function(contactId, nome, fotoUrl) {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.style.cssText = 'backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;';
  
  const fone = contactId.replace('@c.us','').replace('@g.us','').replace('@lid','');
  
  const hgFoto = fotoUrl && fotoUrl.startsWith('http') ?
      `<img src="${fotoUrl}" style="width:80px;height:80px;border-radius:50%;margin:0 auto 16px;object-fit:cover;border:2px solid var(--accent);box-shadow:0 8px 16px rgba(255,98,0,0.2);">` :
      `<div style="width:80px;height:80px;border-radius:50%;background:rgba(255, 98, 0, 0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin:0 auto 16px;box-shadow:0 8px 16px rgba(255,98,0,0.2);">${(nome||'C').charAt(0).toUpperCase()}</div>`;

  overlay.innerHTML = `<div class="modal" style="width:100%; max-width:400px; border-radius:16px; backdrop-filter:blur(20px); background:var(--bg-secondary); border: 1px solid var(--border);">
    <div class="modal-header">
       <h3>👤 Perfil Live do Zap</h3>
       <button class="btn-ghost" data-click="closeModal()"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    </div>
    <div class="modal-body" style="text-align:center;">
       ${hgFoto}
       <h2 style="margin-bottom:8px;font-size:22px;color:var(--text-primary);">${nome}</h2>
       <p style="color:var(--text-muted);font-size:15px;margin-bottom:24px;font-family:monospace;">📱 ${fone}</p>
       
       <button class="btn btn-primary" style="width:100%; justify-content:center;font-weight:bold;padding:12px;" data-click="openWppChatSync('${fone}')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right:8px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Abrir Conversa no Web
       </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

window.openWppChatSync = function(fone) {
   typeof toast === 'function' && toast('Trazendo conversa...', 'info');
   chrome.runtime.sendMessage({ tipo: 'open_chat_unsaved', dados: { telefone: fone } });
   document.querySelector('.modal-overlay')?.remove();
}

function assignKanbanDragDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const cols = document.querySelectorAll('.ws-col');

  cards.forEach(card => {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', card.dataset.leadId);
      setTimeout(() => card.style.opacity = '0.5', 0);
    });
    card.addEventListener('dragend', () => card.style.opacity = '1');
  });

  cols.forEach(col => {
    const cardsContainer = col.querySelector('.kanban-cards');
    if (!cardsContainer) return;

    col.addEventListener('dragover', e => {
      e.preventDefault();
      cardsContainer.style.background = 'rgba(255,255,255,0.05)';
    });
    col.addEventListener('dragleave', () => cardsContainer.style.background = 'transparent');
    col.addEventListener('drop', async e => {
      e.preventDefault();
      cardsContainer.style.background = 'transparent';
      const leadId = e.dataTransfer.getData('text/plain');
      const newStageId = cardsContainer.dataset.stage;
      const field = cardsContainer.dataset.field; // 'etapa' ou 'tag'
      if (leadId && newStageId) {
        // Encontra lead
        const idx = painelData.leads.findIndex(l => l.id === leadId);
        if (idx >= 0) {
           const lead = painelData.leads[idx];
           let changed = false;
           if (field === 'etapa' && lead.etapa !== newStageId) {
              lead.etapa = newStageId; lead.estagio = newStageId;
              changed = true;
           } else if (field === 'tag') {
              let tgs = Array.isArray(lead.tag) ? lead.tag : (lead.tag ? [lead.tag] : []);
              if (!tgs.includes(newStageId)) {
                 if (newStageId === 'sem_tag') tgs = []; else tgs = [newStageId]; // overwriting for D&D simplicity
                 lead.tag = tgs; changed = true;
              }
           }
           
           if (changed) {
               renderSection('crm'); // Re-desenha com nova posicao
               
               // Atualiza banco em background silencioso
               try { 
                  let payload = {};
                  if (field === 'etapa') payload = { etapa: newStageId, updated_at: new Date().toISOString() };
                  if (field === 'tag') payload = { tag: newStageId === 'sem_tag' ? [] : [newStageId], updated_at: new Date().toISOString() };
                  
                  await UpsidenDB.from('leads').update(payload).eq('id', leadId); 
                  await UpsidenDB.from('historico_interacoes').insert({ lead_id: leadId, tipo: 'movimento', descricao: `Movido via Drag&Drop para [${newStageId.toUpperCase()}]`, criado_por: userData?.userId||undefined });
               } catch(err) { console.warn('Falha db drop:', err); }
           }
        }
      }
    });
  });
}

// === LEAD MODAL (Expanded) ===
function showNewLeadModal() { showLeadEditModal(null); }
function editLeadModal(id) { const l = painelData.leads.find(x=>x.id===id); if(l) showLeadEditModal(l); }

function showLeadEditModal(lead) {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.style.cssText = 'backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;';
  
  // Array format compatibility
  let selectedTags = lead && lead.tag ? (Array.isArray(lead.tag) ? lead.tag : [lead.tag]) : [];
  
  const tagOptions = Object.entries(dynamicTags).map(([k,v]) => `<option value="${k}" ${selectedTags.includes(k)?'selected':''}>${v.emoji} ${k}</option>`).join('');
  const lembreteVal = lead?.lembrete_data ? new Date(lead.lembrete_data).toISOString().slice(0,16) : '';
  const leadId = lead?.id || '';

  // Urgency selector options
  const urgOptions = Object.keys(URGENCY_LEVELS_CRM).map(k => {
    const u = URGENCY_LEVELS_CRM[k];
    const sel = (lead?.urgencia || 'normal') === k ? 'selected' : '';
    return `<option value="${k}" ${sel}>${u.label}</option>`;
  }).join('');

  // Photo avatar
  let avatarEl = lead?.foto_url
    ? `<img src="${lead.foto_url}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">`
    : `<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,98,0,0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;">${(lead?.nome||'L').charAt(0).toUpperCase()}</div>`;

  // Interacao Historico
  const historyLink = leadId ? `<button data-click="showLeadHistory('${leadId}')" class="btn btn-secondary" style="font-size:12px; padding:4px 8px; margin-left:auto;">\ud83d\udcdc Ver Hist\u00f3rico</button>` : '';

  overlay.innerHTML = `<div class="modal" style="width:100%; max-width:540px; border-radius:16px; backdrop-filter:blur(20px); background:var(--bg-secondary); border: 1px solid var(--border);">
    <div class="modal-header" style="display:flex; align-items:center;">
       <div style="display:flex;align-items:center;gap:12px;">
         <div style="position:relative;cursor:pointer;" id="foto-avatar-wrap" title="Clique para alterar foto">
           ${avatarEl}
           <div style="position:absolute;bottom:-2px;right:-2px;background:var(--accent);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">
             <svg viewBox="0 0 24 24" fill="#fff" width="8" height="8"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
           </div>
           <input type="file" id="crm-foto-upload" accept="image/*" style="display:none">
         </div>
         <h3>${lead ? '\ud83d\udccb Ficha do Lead' : 'Novo Lead'}</h3>
       </div>
       ${historyLink}
       <button class="btn-ghost" data-click="closeModal()" style="margin-left:8px;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    </div>
    <div class="modal-body" style="max-height:60vh; overflow-y:auto;">
      <div style="display:flex;gap:10px;"><div class="form-group" style="flex:1;"><label class="form-label">Qual o Nome?</label><input class="form-input" id="lead-nome" placeholder="Ex: Maria" value="${lead?.nome||''}"></div><div class="form-group" style="flex:1;"><label class="form-label">Telefone (WPP)</label><input class="form-input" id="lead-tel" placeholder="55119..." value="${lead?.telefone||''}"></div></div>
      
      <div style="display:flex;gap:10px; margin-top:6px;">
         <div class="form-group" style="flex:1;">
            <label class="form-label" style="color:var(--success);">Valor do Deal (R$)</label>
            <input type="number" class="form-input" id="lead-valor" value="${lead?.valor||0.00}" min="0" step="0.01" style="border-color:var(--success-dim); font-weight:bold; color:var(--success);">
         </div>
         <div class="form-group" style="flex:1;">
            <label class="form-label">Prioridade / Urg\u00eancia</label>
            <select class="form-input" id="lead-urgencia">
               ${urgOptions}
            </select>
         </div>
      </div>

      <div style="display:flex;gap:10px; margin-top:6px;">
         <div class="form-group" style="flex:1;">
            <label class="form-label">Multi-Tags (Aperte CTRL)</label>
            <select class="form-input" id="lead-tag" multiple style="height:64px; font-size:12px; background:var(--bg-card); color:var(--text-primary);">
               ${tagOptions}
            </select>
         </div>
      </div>

      <div class="form-group" style="margin-top:6px;"><label class="form-label">Anota\u00e7\u00f5es Fixadas</label><textarea class="form-textarea" id="lead-notas" rows="3" placeholder="Contexto da negocia\u00e7\u00e3o...">${lead?.notas||''}</textarea></div>
      
      <div style="padding:12px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border); margin-top:12px;">
         <div style="display:flex;gap:10px;">
           <div class="form-group" style="flex:1; margin:0;"><label class="form-label" style="color:var(--accent);">\ud83d\udd14 Alarme</label><input type="datetime-local" class="form-input" id="lead-lembrete" value="${lembreteVal}"></div>
           <div class="form-group" style="flex:1; margin:0;"><label class="form-label">Motivo</label><input class="form-input" id="lead-lembrete-txt" placeholder="Ex: Ligar pra fechar doc" value="${lead?.lembrete_texto||''}"></div>
         </div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Sair</button><button class="btn btn-primary" data-click="salvarLeadCompleto('${leadId}')">Salvar Ficha do Lead</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  
  // Photo upload handler
  setTimeout(() => {
    const fotoWrap = document.getElementById('foto-avatar-wrap');
    const fotoInput = document.getElementById('crm-foto-upload');
    if (fotoWrap && fotoInput) {
      fotoWrap.addEventListener('click', () => fotoInput.click());
      fotoInput.addEventListener('change', async () => {
        const file = fotoInput.files?.[0];
        if (!file || !leadId) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            await UpsidenDB.from('leads').update({ foto_url: ev.target.result }).eq('id', leadId);
            const idx = painelData.leads.findIndex(x => x.id === leadId);
            if (idx >= 0) painelData.leads[idx].foto_url = ev.target.result;
            overlay.remove();
            renderSection('crm');
            typeof toast === 'function' && toast('Foto atualizada!', 'success');
            setTimeout(() => editLeadModal(leadId), 300);
          } catch(err) { typeof toast === 'function' && toast('Erro ao salvar foto', 'error'); }
        };
        reader.readAsDataURL(file);
      });
    }
  }, 100);
}

async function salvarLeadCompleto(id) {
  const nome = document.getElementById('lead-nome').value.trim();
  const telefone = document.getElementById('lead-tel').value.trim();
  const valor = parseFloat(document.getElementById('lead-valor').value) || 0;
  const urgencia = document.getElementById('lead-urgencia')?.value || 'normal';
  
  // Extract multiple selected tags
  const tagSelect = document.getElementById('lead-tag');
  const tagsElegidas = Array.from(tagSelect.selectedOptions).map(opt => opt.value).filter(val => val !== '');
  
  // Tag Cor (Using the first one arbitrarily for fallback legacy color needs)
  const tagCor = tagsElegidas.length > 0 && dynamicTags[tagsElegidas[0]] ? dynamicTags[tagsElegidas[0]].bg : '#8696a0';
  const notas = document.getElementById('lead-notas').value.trim();
  const lembreteInput = document.getElementById('lead-lembrete').value;
  const lembreteData = lembreteInput ? new Date(lembreteInput).toISOString() : null;
  const lembreteTexto = document.getElementById('lead-lembrete-txt').value.trim();

  if (!nome) { typeof toast === 'function' && toast('Informe o nome primário do lead', 'error'); return; }
  try {
    // Persistent urgency storage (Local because Supabase column is missing)
    if (id) {
       chrome.storage.local.get(['ups_crm_urgencias'], (res) => {
         const map = res.ups_crm_urgencias || {};
         map[id] = urgencia;
         chrome.storage.local.set({ ups_crm_urgencias: map });
       });
    }

    if (id) {
      const upd = { nome, telefone, valor, tag: tagsElegidas, tag_cor: tagCor, notas, lembrete_data: lembreteData, lembrete_texto: lembreteTexto, updated_at: new Date().toISOString() };
      await UpsidenDB.from('leads').update(upd).eq('id', id);
      const idx = painelData.leads.findIndex(l=>l.id===id);
      if (idx>=0) {
         painelData.leads[idx] = {...painelData.leads[idx], ...upd};
         painelData.leads[idx].tag = tagsElegidas;
      }
      try { await UpsidenDB.from('historico_interacoes').insert({ lead_id: id, tipo: 'edicao', descricao: 'Anotações de CRM Atualizadas Diretamente no Painel', criado_por: userData?.userId||undefined, metadados: { campos_alterados: ['nome','telefone','valor','tag','notas','lembrete'], valor_novo: valor, tag_nova: tagsElegidas } }); } catch(e){}
    } else {
      // Default to first stage available if dynamic
      const estagioDefault = dynamicStages.length > 0 ? dynamicStages[0].id : 'prospeccao';
      const tAdminId = userData.isAdmin ? userData.userId : (userData.teamAdminId || null);
      const res = await UpsidenDB.from('leads').insert({ 
        nome, telefone, valor, tag: tagsElegidas, tag_cor: tagCor, 
        notas, lembrete_data: lembreteData, lembrete_texto: lembreteTexto, 
        etapa: estagioDefault,
        admin_id: tAdminId,
        criado_por: userData?.userId
      }).select();
      if (res?.length) { 
         const newId = res[0].id;
         res[0].tag = tagsElegidas;
         res[0].urgencia = urgencia; // Attach locally
         
         // Save urgency to local storage map
         chrome.storage.local.get(['ups_crm_urgencias'], (db) => {
           const map = db.ups_crm_urgencias || {};
           map[newId] = urgencia;
           chrome.storage.local.set({ ups_crm_urgencias: map });
         });

         painelData.leads.unshift(res[0]); 
         try { await UpsidenDB.from('historico_interacoes').insert({ lead_id: newId, tipo: 'criacao', descricao: `Novo Lead Inserido Manualmente 🤝`, criado_por: userData?.userId||undefined, metadados: { valor_inicial: valor, tags_iniciais: tagsElegidas, telefone, urgencia_inicial: urgencia } }); } catch(e){} 
      }
    }
    if (lembreteData) { 
        typeof toast === 'function' && toast('Sino de Alarme ativado com precisão Background', 'info');
        try { chrome.runtime.sendMessage({ action: 'SET_REMINDER', payload: { leadId: id||'new', nome, data: lembreteData, texto: lembreteTexto } }); } catch(e){} 
    }
    document.querySelector('.modal-overlay')?.remove();
    renderSection('crm'); typeof toast === 'function' && toast('Lead salvo!', 'success');
  } catch(e) { 
    console.error('Falha monstruosa no salvar lead:', e); 
    const msg = e.message || String(e);
    typeof toast === 'function' && toast('Erro SQL: '+msg.substring(0,25), 'error'); 
    alert("ERRO SUPABASE DETECTADO:\n\n" + msg + "\n\n(Tire um print da tela para me enviar!)");
  }
}

// === CRM AGENDA VIEW (NEW) ===
async function renderAgendaCRM(c) {
    document.getElementById('header-actions').innerHTML = '';
    document.getElementById('page-controls-bar').innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; width:100%;">
        <div class="rs-tabs-switcher" style="margin-bottom:0; padding:2px;">
           <button class="rs-tab-btn" data-click="setCRMTab('kanban')">📋 Kanban</button>
           <button class="rs-tab-btn active" data-click="setCRMTab('agenda')">🔔 Agenda</button>
        </div>
        <button class="btn btn-secondary" data-click="navigate('crm')">↻ Atualizar</button>
        
        <div style="margin-left:auto; display:flex; align-items:center;">
           <button class="btn-icon" data-click="setCRMTab('agenda')" id="btn-bell-reminders-crm" title="Central de Lembretes" style="position:relative;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span id="notif-badge-crm" class="notif-badge" style="display:none; position:absolute; top:-5px; right:-5px;">0</span>
           </button>
        </div>
      </div>
    `;

    // Esconder o sino original do header
    const headerBell = document.getElementById('btn-bell-reminders');
    if (headerBell) headerBell.parentElement.style.display = 'none';

    if (typeof window.checkNotifications === 'function') window.checkNotifications();

    c.innerHTML = `<div class="empty-state"><div class="loading-spinner"></div><h3>Lendo sua Agenda...</h3></div>`;

    try {
        const teamAdminId = userData.isAdmin ? userData.userId : userData.teamAdminId;
        console.log('[Agenda] Buscando lembretes para AdminID:', teamAdminId);

        const { data: reminders, error } = await UpsidenDB
            .from('crm_reminders')
            .select('*, leads(nome, telefone, foto_url)')
            .eq('admin_id', teamAdminId)
            .eq('status', 'pending')
            .order('reminder_at', { ascending: true });

        if (error) throw error;

        if (!reminders || reminders.length === 0) {
            c.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><h3>Tudo em dia!</h3><p>Você não tem lembretes pendentes para hoje.</p></div>`;
            return;
        }

        let html = `
          <div class="agenda-container animate-in" style="padding:20px; max-width:900px; margin:0 auto;">
            <div class="section-header" style="margin-bottom:24px;">
               <h2>📅 Próximos Compromissos</h2>
               <p style="font-size:13px; color:var(--text-muted);">${reminders.length} lembretes pendentes</p>
            </div>
            <div class="agenda-list" style="display:flex; flex-direction:column; gap:12px;">
        `;

        reminders.forEach(rem => {
            const date = new Date(rem.reminder_at).toLocaleString('pt-BR');
            const lead = rem.leads || { nome: 'Lead Desconhecido' };
            const priorityColor = rem.priority === 'high' ? 'var(--accent)' : 'var(--text-muted)';
            
            html += `
              <div class="rs-card" style="margin-bottom:0; display:flex; align-items:center; gap:20px; border-left:4px solid ${priorityColor};">
                <div style="width:140px; flex-shrink:0;">
                   <div style="font-size:11px; color:var(--accent); font-weight:800; text-transform:uppercase;">${date.split(' ')[0]}</div>
                   <div style="font-size:18px; font-weight:800; color:var(--text-primary);">${date.split(' ')[1]}</div>
                </div>
                
                <div style="flex:1;">
                   <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${rem.title}</div>
                   <div style="font-size:13px; color:var(--text-secondary);">${rem.description || ''}</div>
                </div>

                <div style="display:flex; align-items:center; gap:12px; padding:0 20px; border-left:1px solid var(--border); border-right:1px solid var(--border);">
                   <div class="avatar-sm-rs round" style="width:36px; height:36px;">
                      ${lead.foto_url ? `<img src="${lead.foto_url}" class="round" style="width:100%; height:100%; object-fit:cover;">` : lead.nome[0].toUpperCase()}
                   </div>
                   <div style="font-size:13px; font-weight:600;">${lead.nome}</div>
                </div>

                <div style="display:flex; gap:8px;">
                   <button class="btn-icon" title="Ver Lead" data-click="editLeadModal('${rem.lead_id}')">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                   </button>
                   <button class="btn-icon" title="Concluído" data-click="markReminderCompleted('${rem.id}')">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   </button>
                </div>
              </div>
            `;
        });

        html += `</div></div>`;
        c.innerHTML = html;

    } catch (e) {
        c.innerHTML = `<div class="empty-state"><h3>Erro na Agenda</h3><p>${e.message}</p></div>`;
    }
}

window.markReminderCompleted = async function(id) {
    try {
        await UpsidenDB.from('crm_reminders').update({ status: 'completed' }).eq('id', id);
        toast('Lembrete concluído!', 'success');
        renderSection('crm');
    } catch(e) {
        toast('Falha ao atualizar', 'error');
    }
};

// === CRM CONFIGURATION MANAGER ===
window.showCRMManagerModal = function() {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.style.cssText = 'backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;';
  
  let colsHtml = dynamicStages.map((s, idx) => `
    <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">
       <input class="form-input" style="width:40px;height:40px;padding:0;" type="color" id="cfg-col-cor-${idx}" value="${s.color}">
       <input class="form-input" style="flex:1;" type="text" id="cfg-col-lbl-${idx}" value="${s.label}">
       <input class="form-input" style="width:100px;" type="text" id="cfg-col-id-${idx}" value="${s.id}" placeholder="ID curto">
    </div>
  `).join('');

  overlay.innerHTML = `<div class="modal" style="width:100%; max-width:540px; border-radius:16px; backdrop-filter:blur(20px); background:var(--bg-secondary); border: 1px solid var(--border);">
    <div class="modal-header"><h3>⚙️ Configuração do Funil Upsiden</h3><button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
    <div class="modal-body" style="max-height:60vh; overflow-y:auto;">
       <h4 style="margin-bottom:10px; color:var(--text-secondary);">1. Editar Fases do Funil (Colunas)</h4>
       <div id="cfg-col-container">${colsHtml}</div>
       <button class="btn btn-secondary" style="width:100%; margin-top:8px;" data-click="addColField()">+ Nova Coluna</button>
       
       <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
       <h4 style="color:var(--text-muted); font-size:12px;">2. Para editar as Tags Visuais e Cores, em breve na seção Master.<br>As colunas salvas atualizarão o Kanban instantaneamente.</h4>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Sair</button><button class="btn btn-primary" data-click="saveCRMManager()">Salvar Novo Funil</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

window.addColField = function() {
  const container = document.getElementById('cfg-col-container');
  const idx = container.children.length;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;align-items:center;';
  div.innerHTML = `
     <input class="form-input" style="width:40px;height:40px;padding:0;" type="color" id="cfg-col-cor-${idx}" value="#FF4D00">
     <input class="form-input" style="flex:1;" type="text" id="cfg-col-lbl-${idx}" placeholder="Nova Coluna">
     <input class="form-input" style="width:100px;" type="text" id="cfg-col-id-${idx}" placeholder="id_curto">
  `;
  container.appendChild(div);
}

window.saveCRMManager = function() {
  const container = document.getElementById('cfg-col-container');
  let newStages = [];
  for(let i=0; i<container.children.length; i++) {
     const cor = document.getElementById(`cfg-col-cor-${i}`).value;
     const lbl = document.getElementById(`cfg-col-lbl-${i}`).value.trim();
     let cid = document.getElementById(`cfg-col-id-${i}`).value.trim();
     if(lbl) {
       if(!cid) cid = lbl.toLowerCase().replace(/[^a-z0-9]/g, '');
       newStages.push({ id: cid, label: lbl, color: cor });
     }
  }
  if(newStages.length === 0) { typeof toast === 'function' && toast('É necessário ter ao menos 1 fase no funil.', 'error'); return; }
  
  chrome.storage.local.set({ ups_crm_colunas: newStages }, () => {
     typeof toast === 'function' && toast('Funil atualizado com RedSun Engine!', 'success');
     document.querySelector('.modal-overlay')?.remove();
     renderSection('crm');
  });
}

window.closeHistoryModal = function() {
  document.getElementById('history-mini-modal')?.remove();
};

// === HISTORY MODAL ===
window.showLeadHistory = async function(leadId) {
  const existing = document.getElementById('history-mini-modal'); if(existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'history-mini-modal';
  div.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:500px; max-height:80vh; background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; z-index:10000; display:flex; flex-direction:column; box-shadow:0 12px 40px rgba(0,0,0,0.8);';
  div.innerHTML = `<div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
    <h3 style="margin:0;">📜 Histórico Passivo WPP</h3>
    <button data-click="closeHistoryModal()" style="background:none; border:none; color:var(--text-primary); cursor:pointer;">✖</button>
  </div><div id="h-body" style="padding:16px; overflow-y:auto; flex:1; font-size:13px; color:var(--text-secondary);"><div style="text-align:center;">Buscando logs de disparo no Servidor...</div></div>`;
  document.body.appendChild(div);

  try {
     const { data, error } = await UpsidenDB.from('historico_interacoes').select('*').eq('lead_id', leadId).order('criado_em', { ascending: false });
     const hub = document.getElementById('h-body');
     if (!hub) return;
     if (error || !data || data.length === 0) { hub.innerHTML = '<div style="text-align:center;">Nenhuma interação registrada ainda para este prospect.</div>'; return; }
     
     hub.innerHTML = data.map(log => `
       <div style="margin-bottom:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border-left: 2px solid var(--accent);">
          <div style="font-size:11px; color:#667781; margin-bottom:4px;">${new Date(log.criado_em).toLocaleString('pt-BR')}</div>
          <div style="color:var(--text-primary); font-weight:600; margin-bottom:4px;">${log.tipo.toUpperCase()}</div>
          <div>${log.descricao}</div>
       </div>
     `).join('');
  } catch(e) {
     const hub = document.getElementById('h-body');
     if(hub) hub.innerHTML = '<div style="color:var(--danger); text-align:center;">Falha ao buscar auditoria do funil.</div>';
  }
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

window.renderSyncLabelsCRM = renderSyncLabelsCRM;
window.assignSyncKanbanDragDrop = assignSyncKanbanDragDrop;
window.updateSyncBadges = updateSyncBadges;
window.showWppContactModal = showWppContactModal;
window.openWppChatSync = openWppChatSync;
window.assignKanbanDragDrop = assignKanbanDragDrop; // For custom CRM
