/**
 * @file painel-crm-kanban.js
 * @scope Renderizacao Kanban (Internal + Sync WPP) + Drag and Drop
 * @depends painel-crm-core.js (KANBAN_CORE_STYLE, dynamicStages, dynamicTags, URGENCY_LEVELS_CRM, loadCRMDynamics)
 * @depends painel-helpers.js (renderSection, toast, painelData, UpsidenDB, userData)
 * @extracted-from painel-templates-crm.js (Etapa 2 refatoracao)
 */
async function renderCustomCRM(c) {
  await loadCRMDynamics();
  
  // Load urgency from local storage
  const urgMap = await new Promise(resolve => {
    chrome.storage.local.get(['ups_crm_urgencias'], (res) => resolve(res.ups_crm_urgencias || {}));
  });
  // Merge into in-memory leads
  painelData.leads.forEach(l => { if(urgMap[l.id]) l.urgencia = urgMap[l.id]; });

  const modoAtual = window.crmSyncModeActive ? 'Etiquetas WPP' : 'Abas do Funil';
  
  document.getElementById('header-actions').innerHTML = '';

  document.getElementById('page-controls-bar').innerHTML = `
    <div class="rs-crm-header-wrap">
      <!-- Main Controls -->
      <div class="rs-controls-row">
        <div style="display:flex; gap:12px; align-items:center;">
          <!-- View Switcher -->
          <div class="rs-btn-group">
            <button class="rs-btn-premium active">
              <svg viewBox="0 0 24 24" fill="var(--accent)"><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm7 0h5v-6h-5v6zm0-13v6h5V5h-5z"/></svg> 
              Ver Funil
            </button>
          </div>

          <!-- Mode Toggle -->
          <div class="rs-btn-group" title="Trocar para Etiquetas WPP">
            <button class="rs-btn-premium" data-click="toggleCRMViewMode()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Modo: ${modoAtual}
            </button>
          </div>

          <!-- Icons Actions -->
          <div style="display:flex; gap:8px;">
             <button class="rs-btn-icon-group" title="Filtros"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></button>
          </div>
        </div>

        <div style="display:flex; gap:12px; align-items:center;">
           <div class="rs-btn-group">
              <button class="rs-btn-premium" data-click="navigate('contatos')" title="Gerenciar Pipelines">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Importar / Exportar
              </button>
           </div>
           
           <button class="rs-btn-plus" data-click="showNewLeadModal()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
              Novo Lead
           </button>
        </div>
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
      
      let dateStr = lead.lembrete_data ? new Date(lead.lembrete_data).toLocaleDateString('pt-BR') : 'Hoje';

      // Avatar: photo or letter
      let photoAvatar = lead.foto_url 
        ? `<div class="card-avatar-item"><img src="${lead.foto_url}" alt=""></div>`
        : `<div class="card-avatar-item">${avatarChar}</div>`;

      html += `
        <div class="kanban-card ws-card-premium" draggable="true" data-lead-id="${lead.id}">
           <!-- Priority Banner -->
           <div class="card-priority-banner" style="--urgency-color: ${urg.color};">
              ${urg.label}
           </div>
           
           <div class="card-inner-box">
             <h3 class="card-title-premium" data-click="editLeadModal('${lead.id}')">${lead.nome || 'Lead s/ Nome'}</h3>
             
             <p class="card-desc-premium" data-click="editLeadModal('${lead.id}')">
               ${lead.notas || 'Sem anotações no CRM.'}
             </p>
             
             <div class="card-mid-row">
               <div class="card-avatars-rs">
                 ${photoAvatar}
               </div>
               
               <div class="card-status-badge-rs" style="--status-color: ${col.color}; --status-bg: ${col.color}15;">
                 ${col.titulo}
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
    const modoAtual = window.crmSyncModeActive ? 'Etiquetas WPP' : 'Abas do Funil';
    document.getElementById('header-actions').innerHTML = '';

    document.getElementById('page-controls-bar').innerHTML = `
      <div class="rs-crm-header-wrap">
        <!-- Controls Row Sync -->
        <div class="rs-controls-row">
          <div style="display:flex; gap:12px; align-items:center;">
             <div class="rs-btn-group">
                <button class="rs-btn-premium active">
                   <svg viewBox="0 0 24 24" fill="var(--accent)"><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm7 0h5v-6h-5v6zm0-13v6h5V5h-5z"/></svg>
                   Etiquetas Sincronizadas
                </button>
             </div>
             
             <div class="rs-btn-group">
                <button class="rs-btn-premium" data-click="toggleCRMViewMode()">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                   Modo: ${modoAtual}
                </button>
             </div>

             <span style="font-size:12px; color:var(--success); font-weight:bold; display:flex; align-items:center; gap:6px; margin-left:10px;">
               <span style="display:inline-block; width:6px; height:6px; background:var(--success); border-radius:50%; box-shadow:0 0 8px var(--success);"></span> 
               Online
             </span>
          </div>

          <div style="display:flex; gap:12px; align-items:center;">
             <div class="rs-btn-group">
                <button class="rs-btn-premium" data-click="navigate('contatos')">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                   Extrair e Exportar
                </button>
             </div>
          </div>
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
                         </div>
                         
                         <div class="card-status-badge-rs" style="--status-color: ${corHex}; --status-bg: ${corHex}15;">
                           ${lbl.name}
                         </div>
                       </div>

                       <div class="card-footer-premium">
                         <div class="card-meta-rs">
                           <div class="meta-rs-item">
                             <span style="color:var(--success); font-size:14px; line-height:1;">●</span> Online
                           </div>
                         </div>
                         <div class="card-actions-rs">
                             <button title="Abrir Chat" class="col-btn-rs" style="border:none;background:transparent;width:auto;height:auto;padding:0;" data-click="openWppChatSync('${foneTratado}')">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                             </button>
                         </div>
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

// === EXPORTS ===
window.renderSyncLabelsCRM = renderSyncLabelsCRM;
window.assignSyncKanbanDragDrop = assignSyncKanbanDragDrop;
window.updateSyncBadges = updateSyncBadges;
window.assignKanbanDragDrop = assignKanbanDragDrop;
