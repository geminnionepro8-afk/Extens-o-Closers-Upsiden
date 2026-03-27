window.renderAgendamentos = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  
  document.getElementById('page-title').textContent = 'Calendário de Envios';
  document.getElementById('breadcrumb-section').textContent = 'Agendamentos / Planner Visual';

  main.innerHTML = `
    <style>
      .cal-app { display: flex; gap: 24px; height: calc(100vh - 120px); font-family: 'Inter', system-ui, sans-serif; }
      .cal-main { flex: 1; min-width: 0; background: var(--surface); border-radius: 12px; border: 1px solid var(--border); padding: 24px; display: flex; flex-direction: column; }
      .cal-side { width: 380px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
      
      .fc {
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: var(--bg-secondary);
        --fc-neutral-text-color: var(--text-secondary);
        --fc-border-color: var(--border);
        --fc-button-text-color: var(--text-primary);
        --fc-button-bg-color: var(--bg-secondary);
        --fc-button-border-color: var(--border);
        --fc-button-hover-bg-color: var(--bg-input);
        --fc-button-hover-border-color: var(--accent);
        --fc-button-active-bg-color: var(--accent);
        --fc-button-active-border-color: var(--accent);
        --fc-event-bg-color: var(--accent);
        --fc-event-border-color: var(--accent);
        --fc-event-text-color: #ffffff;
        --fc-today-bg-color: rgba(255, 77, 0, 0.05);
        color: var(--text-primary);
      }
      .fc .fc-toolbar-title { font-size: 1.25em; font-weight: 700; color: var(--text-primary); }
      .fc .fc-button-primary { text-transform: capitalize; font-weight: 500; border-radius: 6px; box-shadow: none !important; padding: 6px 12px; font-size:13px; }
      .fc-theme-standard td, .fc-theme-standard th { border-color: var(--border); }
      .fc .fc-daygrid-day-number { padding: 4px 8px; font-weight: 500; font-size: 13px; color: var(--text-primary); text-decoration: none !important; }
      .fc .fc-col-header-cell-cushion { padding: 8px 0; font-weight: 600; font-size:13px; color: var(--text-secondary); text-decoration: none !important; }
      .fc-event { border-radius: 4px; padding: 2px 4px; font-size: 11px; font-weight: 600; border: none !important; cursor: pointer; transition: transform 0.2s; }
      .fc-event:hover { transform: scale(1.02); filter: brightness(1.2); }
      
      .side-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
      .side-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); display:flex; gap:8px; align-items:center; }
      .side-close { cursor: pointer; color: var(--text-secondary); padding: 4px; border-radius: 50%; font-weight: bold; width: 24px; height: 24px; display:flex; align-items:center; justify-content:center; transition:0.2s; }
      .side-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
      .side-content { padding: 20px; flex: 1; overflow-y: auto; }
      
      .upx-pill-group { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 20px; gap: 16px; }
      .upx-pill { display:flex; align-items:center; gap:6px; padding: 0 4px 12px 4px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; margin-bottom:-1px; }
      .upx-pill svg { stroke-width: 2.2; opacity:0.8; }
      .upx-pill.active { color: var(--text-primary); border-bottom-color: var(--accent); }
      .upx-pill.active svg { color: var(--accent); opacity:1; }
      
      .u-input-group { margin-bottom: 16px; }
      .u-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
      .u-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-input); font-size: 13px; font-weight: 500; color: var(--text-primary); transition: all 0.2s; outline: none; }
      .u-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(255, 77, 0, 0.1); }
      .u-input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; filter: invert(0.8); transition: 0.2s; padding:2px; }
      .u-input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      textarea.u-input { resize: vertical; min-height: 80px; }
      
      .w-step { display: none; }
      .w-step.active { display: block; animation: fadeInRight 0.2s ease; }
      @keyframes fadeInRight { from { opacity: 0; transform: translateX(5px); } to { opacity: 1; transform: translateX(0); } }
      
      .btn-primary { background: var(--accent); color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
      .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .btn-danger { background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 10px; width: 100%; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap:6px;}
      .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
      .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); padding: 10px; width: 100%; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: 0.2s;}
      .btn-outline:hover { background: var(--bg-secondary); color: var(--text-primary); }
      
      .det-hero { text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
      .det-avatar { width: 56px; height: 56px; background: var(--bg-secondary); color: var(--text-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 1px solid var(--border); }
      .det-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; }
      .det-sub { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin: 0; }
      .det-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--bg-secondary); }
      .det-lbl { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
      .det-val { color: var(--text-primary); font-size: 13px; font-weight: 600; }
      
      .cal-filters { display: flex; gap: 20px; margin-top: 20px; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
      .cal-filter-item { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; user-select: none; }
      .cal-filter-dot { width: 12px; height: 12px; border-radius: 3px; }
      
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }
    </style>
    <div class="cal-app">
       <div class="cal-main">
          <div id="upx-calendar" style="flex:1; min-height: 0;"></div>
          <div class="cal-filters" id="cal-filters-wrap"></div>
       </div>
       <div class="cal-side" id="cal-sidebar"></div>
    </div>
  `;

  if (!window.FullCalendar) {
    const sc = document.createElement('script');
    sc.src = chrome.runtime.getURL('src/libs/fullcalendar.min.js');
    sc.onload = () => window.initCalendarSystem();
    document.head.appendChild(sc);
  } else {
    window.initCalendarSystem();
  }
};

let upxCalendarInst = null;

// Helper SVG Icons avoiding raw Strings to save space and look pro
const iconUser = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
const iconGroup = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const iconGlobe = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
const iconClock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const iconFile = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
const iconClose = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

window.initCalendarSystem = function() {
   window.renderFilters();
   window.bootFullCalendar();
   window.syncAndLoadEvents();
   window.openSidebarWizard();
};

window.renderFilters = function() {
   const wrap = document.getElementById('cal-filters-wrap');
   wrap.innerHTML = `
      <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-right: 8px;">Exibir:</span>
      <label class="cal-filter-item"><input type="checkbox" checked value="texto" onchange="window.filterCalEvents()"><div class="cal-filter-dot" style="background:#ff4d00"></div> Textos</label>
      <label class="cal-filter-item"><input type="checkbox" checked value="audio" onchange="window.filterCalEvents()"><div class="cal-filter-dot" style="background:#3b82f6"></div> Áudios</label>
      <label class="cal-filter-item"><input type="checkbox" checked value="documento" onchange="window.filterCalEvents()"><div class="cal-filter-dot" style="background:#8b5cf6"></div> Mídia</label>
   `;
};

window.bootFullCalendar = function() {
   const calEl = document.getElementById('upx-calendar');
   upxCalendarInst = new FullCalendar.Calendar(calEl, {
      initialView: 'dayGridMonth',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
      buttonText: { today: 'Hoje', month: 'Mês', week: 'Semana' },
      locale: 'pt-br',
      editable: true,
      selectable: true,
      dayMaxEvents: true,
      events: [],
      dateClick: function(info) { window.openSidebarWizard(info.date); },
      eventClick: function(info) { window.openSidebarDetails(info.event); },
      eventDrop: function(info) { window.rescheduleEventDrop(info.event); }
   });
   upxCalendarInst.render();
};

window.syncAndLoadEvents = async function() {
   try {
     const resCloud = await UpsidenDB.from('agendamentos').select('*').execute();
     if (resCloud && resCloud.length >= 0) {
        const currentRes = await new Promise(r => chrome.storage.local.get('ups_agendamentos', r));
        const currentAgends = currentRes.ups_agendamentos || {};
        let shouldSave = false;
        resCloud.forEach(r => {
           const existingKey = Object.keys(currentAgends).find(k => currentAgends[k].id === r.id);
           if (!existingKey) {
              const alarmName = 'agend_'+r.id+'_sync';
              currentAgends[alarmName] = {
                 id: r.id, chatId: r.chat_id, nomeContato: r.nome_contato,
                 when: parseInt(r.when_ms), tipo: r.tipo, conteudo: r.conteudo,
                 base64: r.base64, mime: r.mime, nomeArq: r.nome_arq, recorrencia: r.recorrencia
              };
              shouldSave = true;
              if (parseInt(r.when_ms) > Date.now()) chrome.alarms.create(alarmName, { when: parseInt(r.when_ms) });
           }
        });
        if (shouldSave) await new Promise(r => chrome.storage.local.set({ ups_agendamentos: currentAgends }, r));
     }
   } catch(e) { console.warn('Sync cloud passivo ok'); }
   window.filterCalEvents();
};

window.filterCalEvents = function() {
   chrome.storage.local.get('ups_agendamentos', (res) => {
      const agends = res.ups_agendamentos || {};
      const chkTexto = document.querySelector('input[value="texto"]')?.checked ?? true;
      const chkAudio = document.querySelector('input[value="audio"]')?.checked ?? true;
      const chkMovel = document.querySelector('input[value="documento"]')?.checked ?? true;

      const fAllowed = [];
      if(chkTexto) fAllowed.push('texto');
      if(chkAudio) fAllowed.push('audio');
      if(chkMovel) fAllowed.push('documento');

      const fcEventsArr = [];
      Object.values(agends).forEach(item => {
         if(!fAllowed.includes(item.tipo)) return;
         let bgC = '#ff4d00';
         if(item.tipo === 'audio') bgC = '#3b82f6';
         else if(item.tipo === 'documento') bgC = '#8b5cf6';
         fcEventsArr.push({
            id: item.id, title: item.nomeContato, start: new Date(item.when),
            backgroundColor: bgC, extendedProps: item
         });
      });

      if(upxCalendarInst) {
         upxCalendarInst.removeAllEvents();
         upxCalendarInst.addEventSource(fcEventsArr);
      }
   });
};

window.resetSidebar = function() { window.openSidebarWizard(); };

window.openSidebarWizard = function(preDate) {
   const sideEl = document.getElementById('cal-sidebar');
   
   let dateStr = '';
   if(preDate) {
      const copy = new Date(preDate);
      if(copy.getHours() === 0 && copy.getMinutes() === 0) copy.setHours(9, 0, 0);
      copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
      dateStr = copy.toISOString().slice(0, 16);
   }

   sideEl.innerHTML = `
      <div class="side-header">
         <h2>Novo Agendamento</h2>
      </div>
      <div class="side-content">
         <div class="upx-pill-group" id="wiz-tabs">
            <div class="upx-pill active" data-val="contato">${iconUser} Contato</div>
            <div class="upx-pill" data-val="grupo">${iconGroup} Grupo</div>
            <div class="upx-pill" data-val="status">${iconGlobe} Status</div>
         </div>
         
         <div id="w-contato" class="w-step active">
            <div class="u-input-group"><label class="u-label">Número do Contato (DDI + DDD + Num)</label><input type="text" id="w-num" class="u-input" placeholder="Ex: 5511999999999"></div>
            <div class="u-input-group"><label class="u-label">Nome de Identificação (Opcional)</label><input type="text" id="w-nome" class="u-input" placeholder="Para organização visual"></div>
         </div>
         <div id="w-grupo" class="w-step">
            <div class="u-input-group"><label class="u-label">Selecione o Grupo</label><select id="w-grupo-sel" class="u-input"><option value="">Buscando grupos...</option></select></div>
         </div>
         <div id="w-status" class="w-step">
            <div class="u-input-group"><label class="u-label">Privacidade</label><select id="w-stat-priv" class="u-input"><option value="contacts">Todos os Contatos</option><option value="contactBlacklist">Todos exceto...</option><option value="contactWhitelist">Apenas compatilhar com...</option></select></div>
            <div class="u-input-group" id="w-stat-list-wrap" style="display:none;"><label class="u-label">Lista de Telefones Base</label><input type="text" id="w-stat-list" class="u-input" placeholder="5511.., 5512.."></div>
         </div>
         
         <div class="u-input-group"><label class="u-label">Data e Hora de Envio</label><input type="datetime-local" id="w-data" class="u-input" value="${dateStr}"></div>
         
         <div style="display:flex; gap:12px;">
            <div class="u-input-group" style="flex:1;"><label class="u-label">Recorrência</label><select id="w-rec" class="u-input"><option value="nenhuma">Não</option><option value="diaria">Diária</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option></select></div>
            <div class="u-input-group" style="flex:1;"><label class="u-label">Formato</label><select id="w-tipo" class="u-input"><option value="texto">Texto</option><option value="audio">Áudio</option><option value="documento">Mídia/Arquivo</option></select></div>
         </div>
         
         <div class="u-input-group" id="w-conteudo-wrap">
            <label class="u-label">Conteúdo da Mensagem</label>
            <textarea id="w-texto" class="u-input" placeholder="Escreva o script ou copy..."></textarea>
            
            <div id="w-midia-wrap" style="display:none; margin-top:8px;">
               <label class="u-input" style="text-align:center; border: 1px dashed var(--border); display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; color:var(--text-secondary); transition:0.2s;">
                  ${iconFile} <span style="font-size:12px; font-weight:600;">Procurar Arquivo de Mídia</span>
                  <input type="file" id="w-file" style="display:none;">
               </label>
               <div id="w-file-name" style="text-align:center; font-size:11px; font-weight:500; color:var(--text-secondary); margin-top:6px;">Nenhum arquivo anexado.</div>
            </div>
            
            <div id="w-bg-wrap" style="display:none; margin-top:12px; align-items:center; gap:10px; padding:10px; border-radius:8px; border:1px solid var(--border);">
               <label class="u-label" style="margin:0;">Cor de Fundo:</label>
               <input type="color" id="w-color" value="#ff4d00" style="width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;">
            </div>
         </div>
         
         <button id="w-btn-submit" class="btn-primary" style="margin-top:10px;">Confirmar Agendamento</button>
      </div>
   `;

   let activeAlvo = 'contato';
   document.querySelectorAll('.upx-pill').forEach(p => {
      p.addEventListener('click', () => {
         document.querySelectorAll('.upx-pill').forEach(x => x.classList.remove('active'));
         p.classList.add('active');
         activeAlvo = p.dataset.val;
         document.querySelectorAll('.w-step').forEach(s => s.classList.remove('active'));
         document.getElementById('w-' + activeAlvo).classList.add('active');

         if (activeAlvo === 'grupo') {
            const grpSel = document.getElementById('w-grupo-sel');
            if (grpSel.options.length <= 1) {
               chrome.runtime.sendMessage({ tipo: 'get_groups' }, (res) => {
                  if(res && res.sucesso && res.grupos) {
                     grpSel.innerHTML = '<option value="">Selecione o alvo...</option>';
                     res.grupos.forEach(g => {
                        const opt = document.createElement('option');
                        opt.value = g.id; opt.textContent = g.nome;
                        grpSel.appendChild(opt);
                     });
                  }
               });
            }
         }
      });
   });

   document.getElementById('w-stat-priv').addEventListener('change', (e) => {
      document.getElementById('w-stat-list-wrap').style.display = e.target.value === 'contacts' ? 'none' : 'block';
   });

   let baseFile64 = null, mimeFileW = null;
   document.getElementById('w-tipo').addEventListener('change', (e) => {
      const v = e.target.value;
      const isStatus = activeAlvo === 'status';
      const ta = document.getElementById('w-texto'), mw = document.getElementById('w-midia-wrap');
      const cw = document.getElementById('w-bg-wrap'), fi = document.getElementById('w-file');
      if (v === 'texto') {
         ta.style.display = 'block'; mw.style.display = 'none';
         fi.value = ''; baseFile64 = null;
         if(isStatus) cw.style.display = 'flex';
      } else {
         ta.style.display = 'none'; mw.style.display = 'block';
         fi.value = ''; baseFile64 = null; cw.style.display = 'none';
      }
   });

   document.getElementById('w-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(!file) return;
      document.getElementById('w-file-name').textContent = file.name;
      const rd = new FileReader();
      rd.onload = (d) => { mimeFileW = file.type; baseFile64 = d.target.result.split(',')[1]; };
      rd.readAsDataURL(file);
   });

   document.getElementById('w-btn-submit').addEventListener('click', () => {
      let fId = '', fNome = '';
      if(activeAlvo === 'contato') {
         const n = document.getElementById('w-num').value.trim().replace(/\D/g, '');
         if(!n) return typeof toast==='function' && toast('Preencha o telefone.','error');
         fId = n.includes('@') ? n : n + '@c.us';
         fNome = document.getElementById('w-nome').value.trim() || fId.split('@')[0];
      } else if(activeAlvo === 'grupo') {
         const s = document.getElementById('w-grupo-sel');
         if(!s.value) return typeof toast==='function' && toast('Selecione um grupo.','error');
         fId = s.value; fNome = s.options[s.selectedIndex].text;
      } else {
         const pType = document.getElementById('w-stat-priv').value;
         const list = document.getElementById('w-stat-list').value;
         if(pType!=='contacts' && !list.trim()) return typeof toast==='function' && toast('Preencha os números!','error');
         const cList = list.split(',').map(x=>x.replace(/\D/g,'')).filter(x=>x).join(',');
         const bgC = document.getElementById('w-color').value;
         fId = `status@broadcast|${pType}|${cList}|${bgC}`;
         fNome = 'Status de WhatsApp';
      }

      const dtStr = document.getElementById('w-data').value;
      if(!dtStr) return typeof toast==='function' && toast('Data ausente!','error');
      const wMs = new Date(dtStr).getTime();
      if(wMs <= Date.now()) return typeof toast==='function' && toast('Horário deve ser futuro.','error');

      const tsel = document.getElementById('w-tipo').value;
      const txtV = document.getElementById('w-texto').value.trim();
      if(tsel==='texto' && !txtV) return typeof toast==='function' && toast('Escreva uma mensagem.','error');
      if(tsel!=='texto' && !baseFile64) return typeof toast==='function' && toast('Nenhum arquivo anexado.','error');

      const pay = {
         id: Date.now().toString() + Math.floor(Math.random()*100),
         chatId: fId, nomeContato: fNome, when: wMs, tipo: tsel,
         conteudo: txtV, base64: baseFile64, mime: mimeFileW,
         nomeArq: document.getElementById('w-file').files?.[0]?.name || 'arquivo',
         recorrencia: document.getElementById('w-rec').value
      };

      const btn = document.getElementById('w-btn-submit');
      btn.textContent = 'Trabalhando...'; btn.disabled = true;

      UpsidenDB.from('agendamentos').insert({
         id: pay.id, chat_id: pay.chatId, nome_contato: pay.nomeContato, when_ms: pay.when,
         tipo: pay.tipo, conteudo: pay.conteudo, base64: pay.base64, mime: pay.mime,
         nome_arq: pay.nomeArq, recorrencia: pay.recorrencia
      }).select().execute().then(() => {
         chrome.runtime.sendMessage({ action:'SET_AGENDAMENTO', payload: pay }, (rr) => {
            btn.innerHTML = 'Confirmar Agendamento'; btn.disabled=false;
            if(rr && rr.sucesso) {
               typeof toast==='function' && toast('Criado com sucesso!','success');
               document.getElementById('w-texto').value = '';
               if(tsel !== 'texto') document.getElementById('w-file-name').textContent = 'Nenhuma mídia importada.';
               window.syncAndLoadEvents();
            } else { typeof toast==='function' && toast('Falha interna.','error'); }
         });
      }).catch(er => {
         btn.disabled=false; btn.innerHTML='Confirmar Agendamento';
         typeof toast==='function' && toast('Falha DB: '+er.message, 'error');
      });
   });
};

window.openSidebarDetails = function(eventObj) {
   const sideEl = document.getElementById('cal-sidebar');
   
   const props = eventObj.extendedProps;
   if(!props) return;

   const formatLabel = props.tipo === 'texto' ? 'Texto' : (props.tipo === 'audio' ? 'Áudio' : 'Mídia');
   const isGrp = props.chatId && props.chatId.includes('@g.us');
   const isSts = props.chatId && props.chatId.startsWith('status@');
   const ava = isGrp ? iconGroup : (isSts ? iconGlobe : iconUser);

   let recText = props.recorrencia === 'nenhuma' ? 'Apenas 1 disparo' : `Loop (${props.recorrencia})`;

   sideEl.innerHTML = `
      <div class="side-header">
         <h2>Resumo do Envio</h2>
         <div class="side-close" title="Voltar" onclick="window.resetSidebar()">${iconClose}</div>
      </div>
      <div class="side-content">
         <div class="det-hero">
            <div class="det-avatar">${ava}</div>
            <h3 class="det-title">${props.nomeContato || props.chatId}</h3>
            <p class="det-sub">${isGrp ? 'Grupo de WhatsApp' : (isSts ? 'Postagem de Status' : 'Contato Individual')}</p>
         </div>
         <div class="det-row"><div class="det-lbl">${iconClock} Data Alvo</div><div class="det-val">${eventObj.start.toLocaleDateString('pt-BR')} às ${eventObj.start.toLocaleTimeString('pt-BR').slice(0,5)}</div></div>
         <div class="det-row"><div class="det-lbl">${iconFile} Formato</div><div class="det-val">${formatLabel}</div></div>
         <div class="det-row"><div class="det-lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg> Padrão</div><div class="det-val" style="color:var(--accent)">${recText}</div></div>
         
         <div style="margin-top:20px; padding:16px; background:var(--bg-secondary); border-radius:10px; border:1px solid var(--border);">
            <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Conteúdo:</div>
            <div style="font-size:13px; color:var(--text-primary); white-space:pre-wrap; max-height:160px; overflow-y:auto; line-height:1.4;">${props.conteudo || '*Mídia Anexada Oculta*'}</div>
         </div>
         <div style="margin-top:30px; display:flex; flex-direction:column; gap:10px;">
            <button class="btn-danger" onclick="window.deletarAgendamentoUI('${eventObj.id}')">Excluir Permanente</button>
            <button class="btn-outline" onclick="window.resetSidebar()">Fechar e Voltar</button>
         </div>
      </div>
   `;
};

window.deletarAgendamentoUI = function(id) {
   chrome.storage.local.get('ups_agendamentos', (res) => {
     const agends = res.ups_agendamentos || {};
     let keyName = Object.keys(agends).find(k => agends[k].id === id);
     if (keyName) {
       UpsidenDB.from('agendamentos').delete().eq('id', id).execute().catch(e=>console.log(e));
       chrome.alarms.clear(keyName);
       delete agends[keyName];
       chrome.storage.local.set({ ups_agendamentos: agends }, () => {
         typeof toast === 'function' && toast('Removido!', 'info');
         window.resetSidebar();
         window.filterCalEvents();
       });
     }
   });
};

window.rescheduleEventDrop = function(eventObj) {
   const newStart = eventObj.start.getTime();
   const item = eventObj.extendedProps;
   if(newStart <= Date.now()) {
      typeof toast === 'function' && toast('Data no passado proibida.', 'error');
      eventObj.revert();
      return;
   }
   
   chrome.storage.local.get('ups_agendamentos', (res) => {
      const agends = res.ups_agendamentos || {};
      let keyName = Object.keys(agends).find(k => agends[k].id === item.id);
      if (keyName) {
         agends[keyName].when = newStart;
         chrome.alarms.clear(keyName);
         chrome.alarms.create(keyName, { when: newStart });
         chrome.storage.local.set({ ups_agendamentos: agends }, () => {
            UpsidenDB.from('agendamentos').update({ when_ms: newStart }).eq('id', item.id).execute().catch(e=>console.log(e));
            typeof toast === 'function' && toast('Reagendado via Drop!', 'success');
            window.filterCalEvents();
         });
      }
   });
};
