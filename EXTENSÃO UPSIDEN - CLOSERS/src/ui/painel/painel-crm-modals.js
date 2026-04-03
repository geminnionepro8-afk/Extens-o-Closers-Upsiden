/**
 * @file painel-crm-modals.js
 * @scope Modais de Lead, Agenda CRM, Configuracao do Funil, Historico
 * @depends painel-crm-core.js (dynamicStages, dynamicTags, URGENCY_LEVELS_CRM, loadCRMDynamics)
 * @depends painel-helpers.js (renderSection, toast, closeModal, painelData, UpsidenDB, userData)
 * @extracted-from painel-templates-crm.js (Etapa 2 refatoracao)
 */
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

  // Tag Selector Render (Chips)
  const tagChipsHtml = Object.entries(dynamicTags).map(([k,v]) => {
      const active = selectedTags.includes(k) ? 'active' : '';
      return `<div class="rs-tag-chip ${active}" data-tag="${k}" style="border-color:${v.bg}80;" onclick="toggleTagChip(this, '${k}')">
                <span>${v.emoji}</span> ${k}
              </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="modal rs-modal-premium" style="width:100%; max-width:580px; border-radius:24px; background:var(--bg-secondary); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); overflow:hidden; animation: rsModalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
      
      <!-- Premium Header -->
      <div class="modal-header rs-modal-header" style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.01);">
         <div style="display:flex; align-items:center; gap:16px;">
            <div style="position:relative; cursor:pointer; width:54px; height:54px;" id="foto-avatar-wrap" title="Alterar Foto">
               ${avatarEl}
               <div style="position:absolute; bottom:0; right:0; background:var(--accent); border:2px solid var(--bg-secondary); border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  <svg viewBox="0 0 24 24" fill="#fff" width="10" height="10"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
               </div>
               <input type="file" id="crm-foto-upload" accept="image/*" style="display:none">
            </div>
            <div>
               <h3 style="margin:0; font-size:18px; font-weight:700; color:var(--text-primary);">${lead ? '📋 Ficha do Lead' : 'Novo Lead'}</h3>
               <div style="font-size:12px; color:var(--text-muted); font-weight:500;">Gestão Detalhada de Contato</div>
            </div>
         </div>
         <div style="display:flex; align-items:center; gap:12px;">
            ${historyLink}
            <button class="rs-close-btn" data-click="closeModal()" title="Fechar">
               <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
         </div>
      </div>

      <!-- Modal Body -->
      <div class="modal-body rs-modal-body" style="padding: 32px; max-height:65vh; overflow-y:auto;">
         
         <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:20px; margin-bottom:24px;">
            <div class="form-group-rs">
               <label class="rs-label">Nome Completo</label>
               <input class="rs-input" id="lead-nome" placeholder="Nome do prospect..." value="${lead?.nome||''}">
            </div>
            <div class="form-group-rs">
               <label class="rs-label">Telefone WhatsApp</label>
               <div style="position:relative;">
                  <input class="rs-input" id="lead-tel" placeholder="55119..." value="${lead?.telefone||''}" style="padding-left:36px;">
                  <svg style="position:absolute; left:12px; top:12px; color:var(--text-muted);" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.048c0 2.123.54 4.197 1.566 6.065L0 24l6.094-1.6a11.776 11.776 0 005.952 1.621h.005c6.637 0 12.046-5.414 12.049-12.05a11.829 11.829 0 00-3.53-8.513z"/></svg>
               </div>
            </div>
         </div>

         <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
            <div class="form-group-rs">
               <label class="rs-label">Valor Estimado</label>
               <div style="position:relative;">
                  <span style="position:absolute; left:14px; top:12px; color:var(--success); font-weight:700;">R$</span>
                  <input type="number" class="rs-input" id="lead-valor" value="${lead?.valor||0.00}" step="0.01" style="padding-left:42px; color:var(--success); font-weight:700;">
               </div>
            </div>
            <div class="form-group-rs">
               <label class="rs-label">Classificação de Urgência</label>
               <select class="rs-input" id="lead-urgencia" style="cursor:pointer;">
                  ${urgOptions}
               </select>
            </div>
         </div>

         <div class="form-group-rs" style="margin-bottom:24px;">
            <label class="rs-label">Multi-Tags (Categorias)</label>
            <div class="rs-tags-container" id="rs-tags-grid">
               ${tagChipsHtml}
            </div>
            <select id="lead-tag" multiple style="display:none;">
               ${Object.keys(dynamicTags).map(k => `<option value="${k}" ${selectedTags.includes(k)?'selected':''}>${k}</option>`).join('')}
            </select>
         </div>

         <div class="form-group-rs" style="margin-bottom:24px;">
            <label class="rs-label">Anotações Estratégicas</label>
            <textarea class="rs-textarea" id="lead-notas" rows="4" placeholder="Algum detalhe importante da negociação...">${lead?.notas||''}</textarea>
         </div>
         
         <!-- Lembrete / Alarme -->
         <div class="rs-alarm-box" style="padding:20px; background:rgba(255,98,0,0.04); border:1px solid rgba(255,98,0,0.1); border-radius:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; color:var(--accent); font-size:13px; font-weight:700;">
               <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
               RELEMBRAR ESTE CONTATO
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:16px;">
               <input type="datetime-local" class="rs-input" id="lead-lembrete" value="${lembreteVal}" style="background:var(--bg-secondary); border-color:rgba(255,255,255,0.05);">
               <input class="rs-input" id="lead-lembrete-txt" placeholder="Motivo do alarme..." value="${lead?.lembrete_texto||''}" style="background:var(--bg-secondary); border-color:rgba(255,255,255,0.05);">
            </div>
         </div>
      </div>

      <div class="modal-footer rs-modal-footer" style="padding: 24px 32px; border-top:1px solid rgba(255,255,255,0.03); display:flex; justify-content:flex-end; gap:12px; background:rgba(255,255,255,0.01);">
         <button class="rs-btn-cancel" data-click="closeModal()">Cancelar</button>
         <button class="rs-btn-save-lead" data-click="salvarLeadCompleto('${leadId}')">Salvar Informações</button>
      </div>
    </div>

    <!-- Modal Styles -->
    <style id="rs-modal-styles-dynamic">
       .rs-modal-premium { font-family: 'Outfit', sans-serif; }
       .rs-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 8px; }
       .rs-input, .rs-textarea { 
          width: 100%; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.08); 
          color: #fff; border-radius: 12px; padding: 12px 14px; font-size: 14px; 
          transition: all 0.2s; box-sizing: border-box; outline: none;
       }
       .rs-input:focus, .rs-textarea:focus { border-color: var(--accent); background: #222; box-shadow: 0 0 0 3px rgba(255,75,0,0.1); }
       
       .rs-tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
       .rs-tag-chip { 
          padding: 6px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; 
          font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-muted); 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(255,255,255,0.02);
       }
       .rs-tag-chip:hover { border-color: rgba(255,255,255,0.3); color: #fff; transform: translateY(-1px); }
       .rs-tag-chip.active { background: rgba(255,75,0,0.1); border-color: var(--accent) !important; color: var(--accent); box-shadow: 0 4px 12px rgba(255,75,0,0.1); }
       
       .rs-close-btn { 
          width: 36px; height: 36px; border-radius: 50%; border: none; 
          background: rgba(255,255,255,0.05); color: var(--text-muted); 
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; 
       }
       .rs-close-btn:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; transform: rotate(90deg); }
       
       .rs-btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
       .rs-btn-cancel:hover { background: rgba(255,255,255,0.05); color: #fff; }
       
       .rs-btn-save-lead { background: var(--accent-gradient); border: none; color: white; padding: 12px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255,75,0,0.2); }
       .rs-btn-save-lead:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,75,0,0.4); }
       
       @keyframes rsModalSlideIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    </style>
  `;

  // Initialize Toggle Logic
  window.toggleTagChip = function(el, tag) {
      el.classList.toggle('active');
      const select = document.getElementById('lead-tag');
      const option = Array.from(select.options).find(o => o.value === tag);
      if (option) option.selected = el.classList.contains('active');
  };

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

// === EXPORTS ===
window.showNewLeadModal = showNewLeadModal;
window.editLeadModal = editLeadModal;
window.showLeadEditModal = showLeadEditModal;
window.salvarLeadCompleto = salvarLeadCompleto;
window.salvarLead = salvarLeadCompleto; // backward compat alias
