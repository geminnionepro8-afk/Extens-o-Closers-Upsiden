/**
 * @file crm.js
 * @description Logic engine for the standalone WaSpeed Clone CRM (Red Visage / Kanban Edition).
 */

const P = '[CRM Clone]';
let currentMode = 'abas'; // 'abas' (estÃ¡gios/pipelines) ou 'etiquetas' (tags)
let dbLeads = [];
let dbMembros = [];

// Urgency Levels (configurable priority)
const URGENCY_LEVELS = {
  normal:      { label: 'Normal',      color: '#8A8A98', bg: 'rgba(138,138,152,0.15)', border: 'rgba(138,138,152,0.3)' },
  importante:  { label: 'Importante',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  urgente:     { label: 'Urgente',     color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  critico:     { label: 'CrÃ­tico',     color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  vip:         { label: 'VIP',         color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' }
};

// Funil Modes
let dynamicStages = [
  { id: 'prospeccao', label: 'ProspecÃ§Ã£o', color: '#FFD666' },
  { id: 'negociacao', label: 'NegociaÃ§Ã£o', color: '#66B2FF' },
  { id: 'fechado', label: 'Fechado', color: '#66FFB2' }
];

let dynamicTags = {
  quente:  { bg: '#FFB4B4', label: 'ðŸ”¥ Quente' },
  morno:   { bg: '#FFE5B4', label: 'â˜€ï¸ Morno' },
  frio:    { bg: '#B4D7FF', label: 'â„ï¸ Frio' },
  vip:     { bg: '#E5B4FF', label: 'â­ VIP' },
  urgente: { bg: '#FFB4D7', label: 'ðŸš¨ Urgente' }
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log(P, 'Iniciando CRM Redesenhado...');
  
  // Theme config
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const themeText = document.getElementById('theme-text');
  chrome.storage.local.get(['ups_theme'], (res) => {
    if(res.ups_theme === 'light') {
       document.documentElement.setAttribute('data-theme', 'light');
       if(themeText) themeText.textContent = 'Modo escuro';
    } else {
       if(themeText) themeText.textContent = 'Modo claro';
       document.documentElement.setAttribute('data-theme', 'dark');
    }
  });

  if(toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      let current = document.documentElement.getAttribute('data-theme');
      let nextTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      if(themeText) themeText.textContent = nextTheme === 'light' ? 'Modo escuro' : 'Modo claro';
      chrome.storage.local.set({ ups_theme: nextTheme });
    });
  }

  // Load User Profile
  try {
    const profile = await window.UpsidenAuth.getProfile();
    const nome = profile?.nome || profile?.email?.split('@')[0] || 'UsuÃ¡rio';
    document.getElementById('ws-user-name').textContent = nome;
    document.getElementById('ws-user-avatar').textContent = nome[0].toUpperCase();
  } catch(e) {}

  // Shortcuts (Ctrl + E)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.code === 'KeyE' || e.code === 'Space')) {
      e.preventDefault();
      currentMode = currentMode === 'abas' ? 'etiquetas' : 'abas';
      renderKanban();
    }
  });

  // Modal Closers
  document.getElementById('modal-fechar')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Action: Add Column Button
  document.getElementById('btn-add-col')?.addEventListener('click', () => {
    abrirModalCriarColuna();
  });

  // Load DB Data
  await loadData();
});

async function loadData() {
  try {
    const profile = await window.UpsidenAuth.getProfile();
    const isAdmin = profile?.role === 'admin';
    const teamAdminId = isAdmin ? profile.id : profile.admin_id;
    const userId = profile.id;

    let query = UpsidenDB.from('leads').select('*').eq('admin_id', teamAdminId);
    
    // Se for closer, sÃ³ vÃª o que criou OU o que o admin compartilhou
    if (!isAdmin) {
      query = query.or(`criado_por.eq.${userId},compartilhado.eq.true`);
    }

    const leads = await query.order('created_at', false).execute();
    dbLeads = leads || [];
  } catch(e) {
    console.error(P, 'Erro ao carregar leads particionados', e);
  }
  
  chrome.storage.local.get(['ups_crm_colunas', 'ups_crm_tags'], (res) => {
      if (res.ups_crm_colunas && res.ups_crm_colunas.length > 0) dynamicStages = res.ups_crm_colunas;
      if (res.ups_crm_tags && Object.keys(res.ups_crm_tags).length > 0) dynamicTags = res.ups_crm_tags;
      renderKanban();
  });
}

function renderKanban() {
  const board = document.getElementById('ws-board');
  if(!board) return;
  board.innerHTML = '';
  
  let colunasConfig = [];
  
  if (currentMode === 'abas') {
    colunasConfig = dynamicStages.map(s => ({
       id: s.id,
       titulo: s.label,
       color: s.color || '#FFF',
       leads: dbLeads.filter(l => (l.estagio || l.etapa) === s.id)
    }));
  } else {
    // Mode Tags
    Object.keys(dynamicTags).forEach(k => {
       const tg = dynamicTags[k];
       colunasConfig.push({
         id: k,
         titulo: tg.label || k,
         color: tg.bg || tg.color || '#FFF',
         leads: dbLeads.filter(l => {
           if(Array.isArray(l.tag)) return l.tag.includes(k);
           return l.tag === k;
         })
       });
    });
    colunasConfig.push({
       id: 'sem_tag',
       titulo: 'Sem Etiqueta',
       color: '#444',
       leads: dbLeads.filter(l => !l.tag || (Array.isArray(l.tag) && l.tag.length === 0))
    });
  }

  // Render HTML Columns
  let html = '';
  colunasConfig.forEach(c => {
    let cardsHtml = '';
    
    c.leads.forEach(lead => {
       let avatarChar = lead.nome ? lead.nome[0].toUpperCase() : '?';
       let preview = lead.notas || lead.last_message || 'Sem anotaÃ§Ãµes no CRM. Clique aqui para registrar interaÃ§Ãµes e detalhes negociais.';
       
       let dateStr = "Hoje";
       if(lead.created_at) {
           let d = new Date(lead.created_at);
           dateStr = d.toLocaleDateString('pt-BR');
       }

       // Tags HTML
       let tagsHtml = '';
       if (lead.tag) {
          let tArr = Array.isArray(lead.tag) ? lead.tag : [lead.tag];
          tArr.forEach(t => {
             let tagLabel = dynamicTags[t]?.label || t;
             tagsHtml += `<span class="ws-card-tag">${tagLabel}</span>`;
          });
       }
       
       // Urgency Level (configurable)
       let urg = URGENCY_LEVELS[lead.urgencia] || URGENCY_LEVELS.normal;
       let urgStyle = `background:${urg.bg};color:${urg.color};border:1px solid ${urg.border};`;

       // Avatar: photo or letter
       let avatarHtml;
       if (lead.foto_url) {
         avatarHtml = `<img class="ws-card-avatar-sm" src="${lead.foto_url}" alt="${lead.nome || ''}" style="object-fit:cover;">`;
       } else {
         avatarHtml = `<div class="ws-card-avatar-sm" style="background: ${c.color};">${avatarChar}</div>`;
       }

       let actionsHtml = `
         <div class="ws-card-actions-hover">
            <button class="ws-btn-quick-action" title="AnotaÃ§Ã£o" onclick="abrirNota('${lead.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </button>
            <button class="ws-btn-quick-action wpp" title="Quick Chat" onclick="abrirWpp('${lead.telefone}')">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </button>
            <button class="ws-btn-quick-action" title="OrÃ§amento RÃ¡pido" onclick="abrirCotacao('${lead.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </button>
         </div>
       `;

       cardsHtml += `
         <div class="ws-card" data-id="${lead.id}">
           <div class="ws-card-header">
             <div class="ws-card-project-badge" style="--col-color: ${c.color};">${lead.nome || 'Lead Sem Nome'}</div>
             <div class="ws-card-options" onclick="abrirModalDetalhes('${lead.id}')">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
             </div>
           </div>
           
           <div class="ws-card-status-row">
             <span class="ws-status-pill" style="${urgStyle}">${urg.label}</span>
             <span class="ws-priority">${lead.telefone || 'Sem Num.'}</span>
           </div>

           <div class="ws-card-desc">
             ${preview}
           </div>

           ${tagsHtml ? `<div class="ws-card-tags">${tagsHtml}</div>` : ''}

           <div class="ws-card-footer">
             <div class="ws-card-date">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
               ${dateStr}
             </div>
             <div class="ws-card-avatars" onclick="abrirModalDetalhes('${lead.id}')" style="cursor:pointer" title="Ver InformaÃ§Ãµes Completas">
               ${avatarHtml}
             </div>
           </div>
           
           ${actionsHtml}
         </div>
       `;
    });
    
    html += `
       <div class="ws-col">
         <div class="ws-col-header" style="--col-color: ${c.color};">
           <div class="ws-col-title-container">
             <div class="ws-col-title">${c.titulo}</div>
             <div class="ws-col-badge">${c.leads.length}</div>
           </div>
           <div class="ws-card-options" style="cursor:pointer" onclick="opcoesColuna('${c.id}')">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
           </div>
         </div>
         <div class="ws-cards-container" data-col="${c.id}">
           ${cardsHtml || '<div style="text-align:center;color:var(--border-strong);font-size:12px;margin-top:20px;padding:20px 0;">Solte cards aqui</div>'}
         </div>
       </div>
    `;
  });
  
  html += `
       <div class="ws-col">
          <button class="ws-nav-item" style="justify-content:center; margin-top: 10px; border: 1px dashed var(--border-strong);" onclick="abrirModalCriarColuna()">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             Adicionar Coluna
          </button>
       </div>
  `;
  
  board.innerHTML = html;
  initDragAndDrop();
}

/**
 * Initializes SortableJS over all columns explicitly.
 */
function initDragAndDrop() {
   if(typeof Sortable === 'undefined') {
       console.warn(P, 'SortableJS nÃ£o encontrado. O Drag and Drop nativo visual nÃ£o funcionarÃ¡ suavemente.');
       return;
   }
   
   const containers = document.querySelectorAll('.ws-cards-container');
   containers.forEach(container => {
      new Sortable(container, {
         group: 'kanban',
         animation: 250,
         easing: "cubic-bezier(0.2, 0, 0, 1)",
         ghostClass: 'sortable-ghost',
         dragClass: 'sortable-drag',
         delay: 0,
         delayOnTouchOnly: true,
         onEnd: async function (evt) {
            const itemEl = evt.item;
            const toCol = evt.to.getAttribute('data-col');
            const leadId = itemEl.getAttribute('data-id');
            if(evt.from === evt.to) return; // same col
            
            const lead = dbLeads.find(l => l.id === leadId);
            if(!lead) return;

            if (currentMode === 'abas') {
               lead.etapa = toCol;
               lead.estagio = toCol;
               chrome.storage.local.set({ ups_crm_last_moved: Date.now() });
               try {
                 await UpsidenDB.from('leads').update({ etapa: toCol }).eq('id', leadId);
               } catch(e) { console.error('Error saving', e); }
            } else {
               let tagArr = Array.isArray(lead.tag) ? lead.tag : (lead.tag ? [lead.tag] : []);
               const oldCol = evt.from.getAttribute('data-col');
               
               if (oldCol !== 'sem_tag') tagArr = tagArr.filter(t => t !== oldCol);
               if (toCol !== 'sem_tag' && !tagArr.includes(toCol)) tagArr.push(toCol);
               
               lead.tag = tagArr;
               try {
                 await UpsidenDB.from('leads').update({ tag: tagArr }).eq('id', leadId);
               } catch(e) { console.error('Error saving tag', e); }
            }
            
            renderKanban();
         }
      });
   });
}

// ==== MODAL CONTROL ====
function openModal(title, bodyHtml, footerHtml) {
  const modal = document.getElementById('modal-global');
  if(!modal) return;
  document.getElementById('modal-titulo').innerHTML = title;
  document.getElementById('modal-corpo').innerHTML = bodyHtml;
  document.getElementById('modal-rodape').innerHTML = footerHtml;
  
  modal.style.display = 'flex';
  setTimeout(() => { modal.classList.add('active'); }, 10);
}

function closeModal() {
  const modal = document.getElementById('modal-global');
  if(modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 250);
  }
}

// ACTION: MODAL DETALHES "Mini-CRM"
window.abrirModalDetalhes = function(id) {
  const l = dbLeads.find(x => x.id === id);
  if(!l) return;

  let avatarEl = l.foto_url
    ? `<img src="${l.foto_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">`
    : `<div class="ws-card-avatar-sm" style="width:44px;height:44px;font-size:18px;">${l.nome?l.nome[0].toUpperCase():'?'}</div>`;

  const titleHtml = `
     <div style="display:flex;align-items:center;gap:14px;">
       <div style="position:relative;cursor:pointer;" onclick="document.getElementById('foto-upload-input').click()" title="Clique para alterar foto">
         ${avatarEl}
         <div style="position:absolute;bottom:-2px;right:-2px;background:var(--accent);border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;">
           <svg viewBox="0 0 24 24" fill="#fff" width="10" height="10"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
         </div>
       </div>
       <div style="display:flex;flex-direction:column;gap:2px;">
         <span style="font-size:17px;font-weight:600;">${l.nome || 'Lead s/ Nome'}</span>
         <span style="font-size:12px;color:var(--text-muted);font-weight:400;">${l.telefone || ''}</span>
       </div>
     </div>
     <input type="file" id="foto-upload-input" accept="image/*" style="display:none" onchange="uploadFotoLead('${id}', this)">
  `;
  
  const urgOptions = Object.keys(URGENCY_LEVELS).map(k => {
    const u = URGENCY_LEVELS[k];
    const sel = (l.urgencia || 'normal') === k ? 'selected' : '';
    return `<option value="${k}" ${sel}>${u.label}</option>`;
  }).join('');
  
  const body = `
      <div class="modal-tabs">
         <div class="modal-tab active" data-tab="dados">Dados do Contato</div>
         <div class="modal-tab" data-tab="lembretes">Lembretes & Agenda</div>
         <div class="modal-tab" data-tab="tags">Tags & Automações</div>
         <div class="modal-tab" data-tab="historico">Histórico</div>
      </div>
      <div id="modal-tab-content">
         <div class="tab-pane active" id="tab-dados" style="padding-top: 20px;">
             <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="det-nome" value="${l.nome || ''}">
             </div>
             <div style="display:flex;gap:12px;">
               <div class="form-group" style="flex:1;">
                  <label>Estágio no Pipeline</label>
                  <select id="det-estagio">
                     ${dynamicStages.map(s => `<option value="${s.id}" ${s.id === l.etapa || s.id === l.estagio ? 'selected' : ''}>${s.label}</option>`).join('')}
                  </select>
               </div>
               <div class="form-group" style="flex:1;">
                  <label>Prioridade / Urgência</label>
                  <select id="det-urgencia" style="border-color:${(URGENCY_LEVELS[l.urgencia] || URGENCY_LEVELS.normal).color};">
                     ${urgOptions}
                  </select>
               </div>
             </div>
             <div class="form-group">
                <label>Valor do Negócio (R$)</label>
                <input type="number" id="det-valor" value="${l.valor || 0}">
             </div>
         </div>
      </div>
  `;
  
  openModal(titleHtml, body, <button class='btn-secondary' onclick='closeModal()'>Cancelar</button><button class='btn-primary' onclick='salvarDetalhes(${id})'>Salvar Alterações</button>);

  // LÃ³gica de Troca de Tabs
  const tabs = document.querySelectorAll('.modal-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const target = t.dataset.tab;
      renderLeadTabContent(id, target);
    });
  });
}

window.renderLeadTabContent = async function(id, tab) {
  const container = document.getElementById('modal-tab-content');
  const l = dbLeads.find(x => x.id === id);
  if(!container || !l) return;

  if (tab === 'dados') {
     // Re-render data tab if needed, or already there
     container.innerHTML = `
        <div class="tab-pane active" id="tab-dados" style="padding-top: 20px;">
           <div class="form-group">
              <label>Nome Completo</label>
              <input type="text" id="det-nome" value="${l.nome || ''}">
           </div>
           <div class="form-group">
              <label>Valor do Negócio (R$)</label>
              <input type="number" id="det-valor" value="${l.valor || 0}">
           </div>
        </div>
     `;
  } else if (tab === 'lembretes') {
     container.innerHTML = `<div style="text-align:center; padding:40px;"><div class="spinner"></div></div>`;
     try {
        const res = await UpsidenDB.from('crm_reminders').select('*').eq('lead_id', id).order('reminder_at', {ascending:true}).execute();
        const lembretes = res || [];
        
        let listHtml = lembretes.length === 0 ? '<p style="text-align:center; color:var(--text-muted); font-size:12px; padding:20px;">Nenhum lembrete para este lead.</p>' : '';
        lembretes.forEach(rm => {
           const d = new Date(rm.reminder_at).toLocaleString();
           listHtml += `
              <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                 <div>
                    <div style="font-weight:700; font-size:13px;">${rm.title}</div>
                    <div style="font-size:11px; color:var(--accent);">${d}</div>
                 </div>
                 <button class="ws-btn-quick-action" onclick="deletarLembrete('${rm.id}', '${id}')">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                 </button>
              </div>
           `;
        });

        container.innerHTML = `
           <div class="tab-pane active" id="tab-lembretes" style="padding-top: 20px;">
              <h4 style="font-size:14px; font-weight:800; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--accent)" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Agendar Novo Lembrete
              </h4>
              <div class="rs-card" style="background:var(--bg-secondary); margin-bottom:24px;">
                <div class="form-group">
                   <label>TÃ­tulo do Lembrete</label>
                   <input type="text" id="lem-titulo" placeholder="Ex: Retornar proposta, Enviar contrato...">
                </div>
                <div class="form-group">
                   <label>Data e Hora</label>
                   <input type="datetime-local" id="lem-at">
                </div>
                <button class="btn-primary" style="width:100%;" onclick="salvarLembrete('${id}')">Criar Lembrete</button>
              </div>
              <h4 style="font-size:13px; font-weight:800; margin-bottom:12px; color:var(--text-muted);">PrÃ³ximas Atividades</h4>
              <div id="lembretes-lista-small">${listHtml}</div>
           </div>
        `;
     } catch(e) {
        container.innerHTML = `<div style="color:var(--danger); text-align:center; padding:20px;">Falha ao carregar lembretes (Supabase Table 'crm_reminders' nÃ£o encontrada).</div>`;
     }
  } else {
     container.innerHTML = `<div style="text-align:center; padding:60px; color:var(--text-muted); opacity:0.5;">SeÃ§Ã£o em desenvolvimento...</div>`;
  }
}

window.salvarLembrete = async function(leadId) {
   const title = document.getElementById('lem-titulo').value;
   const at = document.getElementById('lem-at').value;
   if(!title || !at) return alert("Preencha tÃ­tulo e data.");

   try {
      const profile = await window.UpsidenAuth.getProfile();
      const admin_id = profile.role === 'admin' ? profile.id : profile.admin_id;

      await UpsidenDB.from('crm_reminders').insert({
         lead_id: leadId,
         user_id: profile.id,
         admin_id: admin_id,
         title: title,
         reminder_at: new Date(at).toISOString(),
         status: 'pending'
      }).execute();
      
      toast('Lembrete salvo com sucesso!', 'success');
      renderLeadTabContent(leadId, 'lembretes');
      // Trigger update global notification
      if(window.checkNotifications) window.checkNotifications();
   } catch(e) {
      alert("Erro ao salvar lembrete: Supabase table 'crm_reminders' pode estar faltando.");
   }
}

window.deletarLembrete = async function(id, leadId) {
   try {
      await UpsidenDB.from('crm_reminders').delete().eq('id', id).execute();
      renderLeadTabContent(leadId, 'lembretes');
   } catch(e) { alert("Erro ao deletar."); }
}

// ACTION: ANOTAÃ‡Ã•ES / LOGS DE INTERAÃ‡ÃƒO RÃPIDOS
window.abrirNota = function(id) {
  const l = dbLeads.find(x => x.id === id);
  if(!l) return;
  const oldNotes = l.notas || '';
  
  openModal('ðŸ“‹ Contexto & AnotaÃ§Ã£o Interna', 
    `<div class="form-group"><p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Os dados anotados ficam disponÃ­veis para todos da equipe e ajudam no histÃ³rico do CRM.</p>
     <textarea id="wa-nota-textarea" rows="6" placeholder="Ex: O cliente pediu para retornar o contato amanhÃ£ Ã  tarde..." style="height:140px;resize:none;">${oldNotes}</textarea></div>`,
    `<button class="btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn-primary" onclick="salvarNota('${id}')">Salvar Nota</button>`
  );
}

window.salvarNota = async function(id) {
  const newNotas = document.getElementById('wa-nota-textarea').value;
  try {
     await UpsidenDB.from('leads').update({ notas: newNotas }).eq('id', id);
     const idx = dbLeads.findIndex(x => x.id === id);
     if(idx >= 0) dbLeads[idx].notas = newNotas;
     renderKanban();
     closeModal();
  } catch(e) {
     alert('Erro ao salvar nota.');
  }
}

// ACTION: ABRIR WPP
window.abrirWpp = function(tel) {
  if(!tel) { alert("Sem nÃºmero de WhatsApp salvo."); return; }
  let clear = tel.replace(/\D/g, '');
  window.open(`https://web.whatsapp.com/send?phone=${clear}`, '_blank');
}

// ACTION: ORÃ‡AMENTO / MOVER ETAPA RAPIDA
window.abrirCotacao = function(id) {
  const l = dbLeads.find(x => x.id === id);
  const baseValue = l?.valor || 0;
  
  openModal('ðŸ’¸ Fechamento / Venda Direta', 
    `<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Registre uma venda concluÃ­da rapidamente e envie o link de fechamento pelo WhatsApp.</p>
     <div class="form-group"><label>Valor ConcluÃ­do (R$)</label>
     <input type="number" id="orc-val" value="${baseValue}"></div>
     <div class="form-group"><label>Novo Status</label>
     <select id="orc-stage">
       ${dynamicStages.map(s => `<option value="${s.id}" ${s.id === 'fechado' ? 'selected' : ''}>${s.label}</option>`).join('')}
     </select></div>
    `,
    `<button class="btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn-primary bg-success-dim" style="border:none;color:#FFF;background:#34C759;" onclick="finalizarOrcamento('${id}')">Registrar Venda!</button>`
  );
}

window.finalizarOrcamento = async function(id) {
  const val = parseFloat(document.getElementById('orc-val').value || 0);
  const stage = document.getElementById('orc-stage').value;
  try {
    await UpsidenDB.from('leads').update({ valor: val, etapa: stage }).eq('id', id);
    const idx = dbLeads.findIndex(x => x.id === id);
    if(idx >= 0) {
       dbLeads[idx].valor = val;
       dbLeads[idx].etapa = stage;
       dbLeads[idx].estagio = stage;
    }
    renderKanban();
    closeModal();
  } catch(e) {
    alert("Erro ao salvar no banco em nuvem.");
  }
}

// ACTION: ADD COLUMN
window.abrirModalCriarColuna = function() {
  openModal('âž• Nova Coluna (Pipeline)', 
    `<div class="form-group"><label>Nome do Novo Estágio</label>
     <input type="text" id="novo-estagio-nome" placeholder="Ex: QualificaÃ§Ã£o, ReuniÃ£o Agendada..."></div>
     <div class="form-group"><label>Cor da Coluna (Accent)</label>
     <input type="color" id="novo-estagio-cor" value="#A5B4FC" style="height:44px;padding:4px;"></div>`,
    `<button class="btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn-primary" onclick="salvarNovaColuna()">Salvar Coluna</button>`
  );
}

window.salvarNovaColuna = function() {
  const nome = document.getElementById('novo-estagio-nome').value;
  const cor = document.getElementById('novo-estagio-cor').value;
  if(!nome) return;
  const idValue = nome.toLowerCase().replace(/\\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  if(currentMode === 'abas') {
      dynamicStages.push({ id: idValue, label: nome, color: cor });
      chrome.storage.local.set({ ups_crm_colunas: dynamicStages });
  } else {
      dynamicTags[idValue] = { bg: cor, label: nome };
      chrome.storage.local.set({ ups_crm_tags: dynamicTags });
  }
  renderKanban();
  closeModal();
}

window.opcoesColuna = function(colId) {
   // Futuramente abrirÃ¡ dropdown menu p/ apagar, renomear.
   console.log('Opcoes para', colId);
   openModal('âš™ï¸ OpÃ§Ãµes da Coluna', `<p>OpÃ§Ãµes avanÃ§adas para a coluna <b>${colId}</b> em desenvolvimento.</p>`, `<button class="btn-secondary" onclick="closeModal()">Fechar</button>`);
}

// ACTION: SAVE LEAD DETAILS FROM MODAL
window.salvarDetalhes = async function(id) {
  const nome = document.getElementById('det-nome')?.value;
  const estagio = document.getElementById('det-estagio')?.value;
  const urgencia = document.getElementById('det-urgencia')?.value;
  const valor = parseFloat(document.getElementById('det-valor')?.value || 0);

  try {
    await UpsidenDB.from('leads').update({
      nome, etapa: estagio, urgencia, valor
    }).eq('id', id);
    
    const idx = dbLeads.findIndex(x => x.id === id);
    if (idx >= 0) {
      dbLeads[idx].nome = nome;
      dbLeads[idx].etapa = estagio;
      dbLeads[idx].estagio = estagio;
      dbLeads[idx].urgencia = urgencia;
      dbLeads[idx].valor = valor;
    }
    renderKanban();
    closeModal();
  } catch(e) {
    console.error('Erro ao salvar detalhes:', e);
    alert('Erro ao salvar alteraÃ§Ãµes.');
  }
}

// ACTION: UPLOAD LEAD PHOTO
window.uploadFotoLead = async function(id, inputEl) {
  const file = inputEl.files?.[0];
  if (!file) return;
  
  // Convert to base64 data URL for simplicity (stored in DB)
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    try {
      await UpsidenDB.from('leads').update({ foto_url: dataUrl }).eq('id', id);
      const idx = dbLeads.findIndex(x => x.id === id);
      if (idx >= 0) dbLeads[idx].foto_url = dataUrl;
      renderKanban();
      // Re-open modal with updated photo
      closeModal();
      setTimeout(() => abrirModalDetalhes(id), 300);
    } catch(err) {
      console.error('Erro ao salvar foto:', err);
      alert('Erro ao fazer upload da foto.');
    }
  };
  reader.readAsDataURL(file);
}
