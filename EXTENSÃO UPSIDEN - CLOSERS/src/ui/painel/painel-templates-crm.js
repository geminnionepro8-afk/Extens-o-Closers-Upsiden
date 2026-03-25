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
   if (window.crmSyncModeActive) {
       await renderSyncLabelsCRM(c);
   } else {
       await renderCustomCRM(c);
   }
}

// === CRM PERSONALIZADO (ANTIGO) ===
async function renderCustomCRM(c) {
  await loadCRMDynamics();
  
  document.getElementById('header-actions').innerHTML = `
    <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:bold; cursor:pointer;" title="Sincronizar Funil com Etiquetas do WhatsApp conectado">
       <input type="checkbox" id="kb-sync-toggle" style="cursor:pointer;" ${window.crmSyncModeActive ? 'checked' : ''}> Sincronizar Etiquetas WPP
    </label>
    <button class="btn btn-secondary" data-click="showCRMManagerModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Board</button>
    <button class="btn btn-secondary" data-click="navigate('contatos')" style="color: var(--accent); border-color: rgba(255, 98, 0, 0.3);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Importar</button>
    <button class="btn btn-primary" data-click="showNewLeadModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Lead</button>
  `;

  document.getElementById('kb-sync-toggle')?.addEventListener('change', (e) => toggleCRMSyncMode(e.target.checked));

  let html = '<div class="kanban-board">';
  dynamicStages.forEach(stage => {
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
      if (lead.tag) {
        // Multi-tags compatibility or solid single-tag 
        // Lead.tag might be string or array
        let tagsArray = Array.isArray(lead.tag) ? lead.tag : [lead.tag];
        
        tagHtml = `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px;">`;
        tagsArray.forEach(tgKey => {
           if (dynamicTags[tgKey]) {
             const t = dynamicTags[tgKey];
             tagHtml += `<span style="font-size:9px;padding:2px 6px;border-radius:12px;background:${t.bg};color:${t.cor};font-weight:700;">${t.emoji} ${tgKey}</span>`;
           }
        });
        tagHtml += `</div>`;
      }
      
      html += `<div class="kanban-card" draggable="true" data-lead-id="${lead.id}" data-click="editLeadModal('${lead.id}')" style="border-left: 3px solid ${stage.color};">
        <div style="display:flex;flex-direction:column;align-items:flex-start;">
          <div class="card-name" style="font-size:14px;font-weight:bold;">${lead.nome}</div>
          ${tagHtml}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
          <span>${lead.telefone || ''}</span>
          <span style="color:var(--success);font-weight:bold;">${fmtMoeda(lead.valor)}</span>
        </div>
        ${lead.notas ? `<div style="font-size:10px;color:#667781;margin-top:4px;border-top:1px solid #222e35;padding-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📝 ${lead.notas}</div>` : ''}
      </div>`;
    });
    if (stageLeads.length === 0) html += `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Nenhum lead</div>`;
    html += `</div></div>`;
  });
  html += '</div>';
  c.innerHTML = html;
  
  // Attach Native Drag & Drop Listeners
  setTimeout(assignKanbanDragDrop, 100);
}

// === CRM SINCRONIZADO (ETIQUETAS DO WPP) ===
async function renderSyncLabelsCRM(c) {
   document.getElementById('header-actions').innerHTML = `
     <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:bold; cursor:pointer; color:var(--accent);">
       <input type="checkbox" id="kb-sync-toggle-wpp" checked style="cursor:pointer;"> 🔄 Etiquetas WPP
     </label>
   `;
   
   document.getElementById('kb-sync-toggle-wpp')?.addEventListener('change', (e) => toggleCRMSyncMode(e.target.checked));

   c.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted); width:100%;"><div class="loading-spinner"></div><br><br>Sincronizando com o celular conectado...<br>Pode levar alguns segundos se houver muitos contatos nas etiquetas.</div>';
   
   chrome.runtime.sendMessage({ tipo: 'get_wpp_labels' }, (res) => {
      if (!res || !res.sucesso) {
         const motivo = res ? (res.erro || 'Erro interno desconhecido.') : 'Sem Resposta (Timeout) do WhatsApp. F5 na aba do Zap!';
         c.innerHTML = `<div style="padding:40px; text-align:center; color:var(--danger);">
            <h4>Falha ao sincronizar Etiquetas</h4>
            <p style="margin-top:10px; font-family:monospace; background:rgba(0,0,0,0.5); padding:10px; border-radius:8px;">LOG: ${motivo}</p>
         </div>`;
         return;
      }
      
      const labels = res.labels || [];
      if (labels.length === 0) {
         c.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">Você não tem nenhuma Etiqueta criada no seu WhatsApp Business ainda.</div>';
         return;
      }
      
      let html = '<div class="kanban-board">';
      labels.forEach(lbl => {
         const corHex = lbl.hexColor || '#8696a0';
         html += `<div class="kanban-column">
           <div class="kanban-column-header">
             <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:${corHex}"></span>${lbl.name}</span>
             <span style="display:flex;flex-direction:column;align-items:flex-end;"><span class="count">${lbl.items.length}</span></span>
           </div>
           <div class="kanban-cards wpp-sync-cards" data-label-id="${lbl.id}">`;
         lbl.items.forEach(contato => {
            const foneTratado = contato.id.replace('@c.us', '').replace('@g.us', '');
            const nomeEscapado = (contato.nome || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
            const fotoUrlEscapada = contato.foto ? contato.foto.replace(/'/g, "\\'") : '';
            
            const avatarHtml = contato.foto ? 
               `<img src="${contato.foto}" style="width:24px;height:24px;border-radius:50%;margin-right:8px;object-fit:cover;">` : 
               `<div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);color:var(--text);display:flex;align-items:center;justify-content:center;font-size:10px;margin-right:8px;font-weight:bold;">${(contato.nome||'C').charAt(0).toUpperCase()}</div>`;
               
            html += `<div class="kanban-card wpp-sync-card" draggable="true" data-click="showWppContactModal('${contato.id}', '${nomeEscapado}', '${fotoUrlEscapada}')" data-contact-id="${contato.id}" data-old-label-id="${lbl.id}" style="border-left: 3px solid ${corHex}; cursor: grab;">
              <div style="display:flex;align-items:center;margin-bottom:6px;">
                ${avatarHtml}
                <div class="card-name" style="font-size:14px;font-weight:bold;line-height:1.2;">${contato.nome}</div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);">
                <span>${foneTratado}</span>
                <span title="Integração Nativa">🟢</span>
              </div>
            </div>`;
         });
         
         if (lbl.items.length === 0) html += `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Vazio</div>`;
         
         html += `</div></div>`;
      });
      html += '</div>';
      c.innerHTML = html;
      
      setTimeout(assignSyncKanbanDragDrop, 100);
   });
}

function assignSyncKanbanDragDrop() {
  const cards = document.querySelectorAll('.wpp-sync-card');
  const cols = document.querySelectorAll('.kanban-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
         contactId: card.dataset.contactId,
         oldLabelId: card.dataset.oldLabelId
      }));
      setTimeout(() => card.style.opacity = '0.5', 0);
    });
    card.addEventListener('dragend', () => card.style.opacity = '1');
  });

  cols.forEach(col => {
    const cardsContainer = col.querySelector('.wpp-sync-cards');
    if (!cardsContainer) return;

    col.addEventListener('dragover', e => {
      e.preventDefault();
      cardsContainer.style.background = 'rgba(255,100,0,0.05)';
    });
    col.addEventListener('dragleave', () => cardsContainer.style.background = 'transparent');
    col.addEventListener('drop', e => {
      e.preventDefault();
      cardsContainer.style.background = 'transparent';
      
      const payloadStr = e.dataTransfer.getData('text/plain');
      if (!payloadStr) return;
      
      try {
         const payload = JSON.parse(payloadStr);
         const contactId = payload.contactId;
         const oldLabelId = payload.oldLabelId;
         const newLabelId = cardsContainer.dataset.labelId;
         
         if (contactId && newLabelId && oldLabelId !== newLabelId) {
            typeof toast === 'function' && toast(`Mapeado ID: ${contactId.substring(0,25)}... Transferindo!`, 'info');
            
            chrome.runtime.sendMessage({ 
                tipo: 'wpp_update_label', 
                dados: { contactId, oldLabelId, newLabelId } 
            }, res => {
                const toast = document.querySelector('.toast-root') ? window.addToast || window.toast : console.log;
                if (res && res.sucesso) {
                    typeof toast === 'function' && toast('Sincronização na Meta Concluída!', 'success');
                    
                    // Modifica os IDs localmente para o frontend acompanhar a mudança
                    card.dataset.oldLabelId = newLabelId;
                } else {
                    alert("🚨 CRASH FATAL NO WA-JS DETECTADO 🚨\n\nPor favor, tire um PRINT desta tela ou copie o texto abaixo e mande pro Arquiteto:\n\n" + (res.erro || 'Erro Desconhecido'));
                    
                    // Reverte o card pro local de origem em caso de erro extremo na API
                    const origemContainer = document.querySelector(`.kanban-cards[data-label-id="${oldLabelId}"]`);
                    if (origemContainer) origemContainer.appendChild(card);
                }
            });
         }
      } catch(err) { console.error('Erro no parser do drag:', err); }
    });
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
  const cols = document.querySelectorAll('.kanban-column');

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
      const newStage = cardsContainer.dataset.stage;
      if (leadId && newStage) {
        // Encontra lead
        const idx = painelData.leads.findIndex(l => l.id === leadId);
        if (idx >= 0 && (painelData.leads[idx].estagio || painelData.leads[idx].etapa) !== newStage) {
           painelData.leads[idx].etapa = newStage;
           painelData.leads[idx].estagio = newStage; // fallback dual param
           renderSection('crm'); // Re-desenha com nova posicao
           
           // Atualiza banco em background silencioso
           try { 
              await UpsidenDB.from('leads').update({ etapa: newStage, updated_at: new Date().toISOString() }).eq('id', leadId); 
              await UpsidenDB.from('historico_interacoes').insert({ lead_id: leadId, tipo: 'edicao', descricao: `Movido no Funil para ${newStage.toUpperCase()}`, criado_por: userData?.userId||undefined });
           } catch(err) { console.warn('Falha db drop:', err); }
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

  // Interação Histórico (Mock UI for now, logic below)
  const historyLink = leadId ? `<button data-click="showLeadHistory('${leadId}')" class="btn btn-secondary" style="font-size:12px; padding:4px 8px; margin-left:auto;">📜 Ver Histórico de Interações</button>` : '';

  overlay.innerHTML = `<div class="modal" style="width:100%; max-width:540px; border-radius:16px; backdrop-filter:blur(20px); background:var(--bg-secondary); border: 1px solid var(--border);">
    <div class="modal-header" style="display:flex; align-items:center;">
       <h3>${lead ? '📋 Informações do Negócio' : 'Novo Lead'}</h3>
       ${historyLink}
       <button class="btn-ghost" data-click="closeModal()" style="margin-left:8px;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    </div>
    <div class="modal-body" style="max-height:60vh; overflow-y:auto;">
      <div style="display:flex;gap:10px;"><div class="form-group" style="flex:1;"><label class="form-label">Qual o Nome?</label><input class="form-input" id="lead-nome" placeholder="Ex: Maria" value="${lead?.nome||''}"></div><div class="form-group" style="flex:1;"><label class="form-label">Telefone Exact (WPP)</label><input class="form-input" id="lead-tel" placeholder="55119..." value="${lead?.telefone||''}"></div></div>
      
      <div style="display:flex;gap:10px; margin-top:6px;">
         <div class="form-group" style="flex:1;">
            <label class="form-label" style="color:var(--success);">Valor do Deal (R$)</label>
            <input type="number" class="form-input" id="lead-valor" value="${lead?.valor||0.00}" min="0" step="0.01" style="border-color:var(--success-dim); font-weight:bold; color:var(--success);">
         </div>
         <div class="form-group" style="flex:1;">
            <label class="form-label">Multi-Tags Form (Aperte CTRL)</label>
            <select class="form-input" id="lead-tag" multiple style="height:64px; font-size:12px; background:var(--bg-card); color:var(--text-primary);">
               ${tagOptions}
            </select>
         </div>
      </div>

      <div class="form-group" style="margin-top:6px;"><label class="form-label">Anotações Fixadas</label><textarea class="form-textarea" id="lead-notas" rows="3" placeholder="Contexto da negociação...">${lead?.notas||''}</textarea></div>
      
      <div style="padding:12px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border); margin-top:12px;">
         <div style="display:flex;gap:10px;">
           <div class="form-group" style="flex:1; margin:0;"><label class="form-label" style="color:var(--accent);">🔔 Agendar Alarme de Ligação</label><input type="datetime-local" class="form-input" id="lead-lembrete" value="${lembreteVal}"></div>
           <div class="form-group" style="flex:1; margin:0;"><label class="form-label">Motivo (Despertador)</label><input class="form-input" id="lead-lembrete-txt" placeholder="Ex: Ligar pra fechar doc" value="${lead?.lembrete_texto||''}"></div>
         </div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Sair</button><button class="btn btn-primary" data-click="salvarLeadCompleto('${leadId}')">Salvar Ficha do Lead</button></div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

async function salvarLeadCompleto(id) {
  const nome = document.getElementById('lead-nome').value.trim();
  const telefone = document.getElementById('lead-tel').value.trim();
  const valor = parseFloat(document.getElementById('lead-valor').value) || 0;
  
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
      const res = await UpsidenDB.from('leads').insert({ nome, telefone, valor, tag: tagsElegidas, tag_cor: tagCor, notas, lembrete_data: lembreteData, lembrete_texto: lembreteTexto, etapa: estagioDefault }).select();
      if (res?.length) { 
         res[0].tag = tagsElegidas;
         painelData.leads.unshift(res[0]); 
         try { await UpsidenDB.from('historico_interacoes').insert({ lead_id: res[0].id, tipo: 'criacao', descricao: `Novo Lead Inserido Manualmente 🤝`, criado_por: userData?.userId||undefined, metadados: { valor_inicial: valor, tags_iniciais: tagsElegidas, telefone } }); } catch(e){} 
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
