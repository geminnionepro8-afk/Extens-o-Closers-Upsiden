/**
 * @file painel-agendamentos.js
 * @description Módulo responsável pela UI de Agendamentos e Calendário Visual.
 */

window.renderAgendamentos = async function() {
  const main = document.getElementById('main-content');
  document.getElementById('page-title').textContent = 'Calendário de Envios';
  document.getElementById('breadcrumb-section').textContent = 'Agendamentos';
  
  // HTML Master
  main.innerHTML = `
    <style>
      .upx-input {
        width: 100%;
        box-sizing: border-box;
        background: var(--bg-input, #1a1a24);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
        color: var(--text-primary, #fff);
        padding: 12px 14px;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s ease;
        outline: none;
      }
      .upx-input:focus {
        border-color: var(--accent, #ff4d00);
        box-shadow: 0 0 0 3px rgba(255, 77, 0, 0.15);
      }
      .upx-input::placeholder {
        color: var(--text-muted, rgba(255, 255, 255, 0.4));
      }
      .upx-input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        opacity: 0.6;
        transition: 0.2s;
      }
      .upx-input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
      }
      .form-lbl {
        display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary, #CBD5E1); font-size: 13px; letter-spacing: 0.3px; text-transform: uppercase;
      }
    </style>
    <div class="modulo-container" style="display:flex; gap:24px; min-height: 80vh; flex-wrap:wrap;">
      
      <!-- Coluna Esquerda: Novo Agendamento (Form) -->
      <div class="panel-card" style="flex: 1; min-width: 320px; max-width: 400px; height:fit-content; border-color: rgba(255,77,0, 0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
        <h2 style="margin-top:0; border-bottom:1px solid var(--border); padding-bottom:14px; font-weight:800; font-size:20px; display:flex; align-items:center; gap:8px;">
           <span style="color:var(--accent);">✧</span> Programar Disparo
        </h2>
        
        <div style="margin-top:20px; display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
           <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:14px; color:var(--text);"><input type="radio" name="agend-alvo" value="contato" checked> Contato Individual</label>
           <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:14px; color:var(--text);"><input type="radio" name="agend-alvo" value="grupo"> Grupo do WhatsApp</label>
           <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:14px; color:var(--accent); font-weight:600;"><input type="radio" name="agend-alvo" value="status"> Status do WhatsApp</label>
        </div>

        <div id="wrapper-contato">
          <div style="margin-top:8px;">
            <label class="form-lbl">🎯 Contato ou WhatsApp ID</label>
            <input type="text" id="agend-numero" placeholder="Ex: 5511999999999" class="upx-input">
          </div>
          <div style="margin-top:16px;">
            <label class="form-lbl">👤 Nome do Contato (Visor)</label>
            <input type="text" id="agend-nome" placeholder="Ex: João Silva" class="upx-input">
          </div>
        </div>

        <div id="wrapper-grupo" style="display:none; margin-top:8px;">
          <label class="form-lbl">👥 Selecione o Grupo</label>
          <select id="agend-grupo-select" class="upx-input">
            <option value="">Carregando grupos...</option>
          </select>
        </div>

        <div id="wrapper-status" style="display:none; margin-top:8px;">
          <label class="form-lbl">👁️ Privacidade do Status</label>
          <select id="agend-status-privacy" class="upx-input">
            <option value="contacts">Todos os Contatos (Padrão)</option>
            <option value="contactBlacklist">Meus contatos, exceto...</option>
            <option value="contactWhitelist">Compartilhar apenas com...</option>
          </select>
          <div id="wrapper-status-list" style="display:none; margin-top:12px;">
            <label class="form-lbl">📝 Lista de Contatos (Ex: 55119.., 55118..)</label>
            <input type="text" id="agend-status-list" placeholder="Números separados por vírgula" class="upx-input">
          </div>
        </div>

        <div style="margin-top:16px;">
          <label class="form-lbl">🕒 Data e Hora Exata</label>
          <input type="datetime-local" id="agend-data" class="upx-input">
        </div>

        <div style="margin-top:16px;">
          <label class="form-lbl">🔄 Recorrência Acumulada</label>
          <select id="agend-recorrencia" class="upx-input">
            <option value="nenhuma">Apenas 1 disparo único</option>
            <option value="diaria">Repetir Todos os Dias</option>
            <option value="semanal">Repetir Toda Semana</option>
            <option value="mensal">Repetir Todo Mês</option>
          </select>
        </div>

        <div style="margin-top:16px;">
          <label class="form-lbl">📦 Qual tipo de Carga?</label>
          <select id="agend-tipo" class="upx-input">
            <option value="texto">Texto Escrito / Script</option>
            <option value="audio">Áudio Gravado na Hora</option>
            <option value="documento">Arquivo / Imagem / Documento</option>
          </select>
        </div>

        <div id="agend-conteudo-wrapper" style="margin-top:16px;">
          <textarea id="agend-texto" rows="4" placeholder="Escreva sua mensagem humanizada aqui..." class="upx-input" style="resize:vertical;"></textarea>
          
          <div id="agend-bg-wrapper" style="display:none; margin-top:10px; align-items:center; gap:12px;">
            <label class="form-lbl" style="margin:0;">🎨 Cor de Fundo do Status:</label>
            <input type="color" id="agend-status-bg" value="#ff4d00" style="cursor:pointer; background:none; border:none; width:36px; height:36px; padding:0; border-radius:6px;">
          </div>

          <div id="agend-media-wrapper" style="display:none; margin-top:10px;">
            <label class="btn btn-secondary" style="width:100%; display:block; text-align:center; cursor:pointer; padding: 12px; border: 1px dashed var(--accent);">
              📁 Selecionar Arquivo Destino
              <input type="file" id="agend-file" style="display:none;">
            </label>
            <div id="agend-file-name" style="margin-top:10px; font-size:12px; color:var(--text-muted); text-align:center;">Nenhum arquivo anexado ainda.</div>
          </div>
        </div>

        <button id="btn-salvar-agendamento" class="btn btn-primary" style="width:100%; margin-top:28px; padding:14px; font-size:16px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow: 0 4px 15px rgba(255, 77, 0, 0.4);">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Agendar Envio Imediatamente
        </button>
      </div>

      <!-- Coluna Direita: Próximos Disparos & Calendário -->
      <div style="flex: 2; display:flex; flex-direction:column; gap:24px; min-width: 380px;">
        
        <!-- Bloco do Calendário Interativo -->
        <div class="panel-card" style="padding:24px; overflow:hidden;">
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <select id="filtro-visao-cal" class="upx-input" style="max-width:260px; padding:6px 10px; font-size:13px;" onchange="refreshAgendamentosList()">
                 <option value="todos">Visão Geral (Tudo)</option>
                 <option value="contatos">Apenas Contatos Privados</option>
                 <option value="grupos">Apenas Grupos WhatsApp</option>
              </select>
           </div>
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <h2 style="margin:0;">Minha Visão do Calendário</h2>
              <div style="display:flex; gap:10px;">
                 <button class="btn btn-secondary" style="padding:4px 12px; font-size:16px;" data-click="mudarMes(-1)">←</button>
                 <span id="cal-mes-atual" style="font-weight:bold; font-size:16px; align-self:center; min-width:120px; text-align:center;">Novembro 2026</span>
                 <button class="btn btn-secondary" style="padding:4px 12px; font-size:16px;" data-click="mudarMes(1)">→</button>
              </div>
           </div>
           
           <div class="cal-grid" id="cal-grid" style="display:grid; grid-template-columns: repeat(7, 1fr); gap:12px;">
               <!-- Injetados dinamicamente no refresh -->
           </div>
        </div>

        <!-- Lista Fila de Fogo -->
        <div class="panel-card" style="flex:1; overflow-y:auto; max-height: 480px;">
          <h3 style="margin-top:0;">Próximos Disparos da Fila Ativa</h3>
          <div id="lista-agendamentos" style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
             <p style="color:var(--text-muted);">Carregando agendamentos...</p>
          </div>
        </div>

      </div>

    </div>
  `;

  // --- Lógicas Visuais Formulário ---
  const radiosAlvo = document.querySelectorAll('input[name="agend-alvo"]');
  const wrapperContato = document.getElementById('wrapper-contato');
  const wrapperGrupo = document.getElementById('wrapper-grupo');
  const wrapperStatus = document.getElementById('wrapper-status');
  const grupoSelect = document.getElementById('agend-grupo-select');
  const bgWrapper = document.getElementById('agend-bg-wrapper');
  
  radiosAlvo.forEach(radio => {
    radio.addEventListener('change', (e) => {
       wrapperContato.style.display = 'none';
       wrapperGrupo.style.display = 'none';
       if (wrapperStatus) wrapperStatus.style.display = 'none';
       if (bgWrapper) bgWrapper.style.display = 'none';

       if (e.target.value === 'grupo') {
          wrapperGrupo.style.display = 'block';
          if (grupoSelect.options.length <= 1) {
             grupoSelect.innerHTML = '<option value="">Buscando grupos ativos no WhatsApp...</option>';
             chrome.runtime.sendMessage({ tipo: 'get_groups' }, (res) => {
                const alvoSelect = document.getElementById('agend-grupo-select');
                if (!alvoSelect) return;

                if (res && res.sucesso && res.grupos) {
                   alvoSelect.innerHTML = '<option value="">-- Selecione o Grupo --</option>';
                   res.grupos.forEach(g => {
                      const opt = document.createElement('option');
                      opt.value = g.id;
                      opt.textContent = g.nome;
                      alvoSelect.appendChild(opt);
                   });
                } else {
                   alvoSelect.innerHTML = '<option value="">Nenhum grupo encontrado ou WPP fechado.</option>';
                }
             });
          }
       } else if (e.target.value === 'status') {
          if (wrapperStatus) wrapperStatus.style.display = 'block';
          if (document.getElementById('agend-tipo').value === 'texto' && bgWrapper) bgWrapper.style.display = 'flex';
       } else {
          wrapperContato.style.display = 'block';
       }
    });
  });

  const privacySelect = document.getElementById('agend-status-privacy');
  const statusListWrapper = document.getElementById('wrapper-status-list');
  if (privacySelect) {
     privacySelect.addEventListener('change', (e) => {
        if (e.target.value === 'contacts') statusListWrapper.style.display = 'none';
        else statusListWrapper.style.display = 'block';
     });
  }

  const tipoSelect = document.getElementById('agend-tipo');
  const txtArea = document.getElementById('agend-texto');
  const midiaWrap = document.getElementById('agend-media-wrapper');
  const fileInp = document.getElementById('agend-file');
  const fileLbl = document.getElementById('agend-file-name');
  
  let base64File = null;
  let mimeFile = null;

  tipoSelect.addEventListener('change', (e) => {
    const v = e.target.value;
    const isStatus = document.querySelector('input[name="agend-alvo"]:checked').value === 'status';

    if (v === 'texto') {
       txtArea.style.display = 'block';
       midiaWrap.style.display = 'none';
       fileInp.value = ''; base64File = null;
       if (isStatus && bgWrapper) bgWrapper.style.display = 'flex';
    } else {
       txtArea.style.display = 'none';
       midiaWrap.style.display = 'block';
       fileInp.value = ''; base64File = null;
       fileLbl.textContent = 'Nenhum arquivo processado.';
       if (bgWrapper) bgWrapper.style.display = 'none';
    }
  });

  fileInp.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileLbl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (reData) => {
      mimeFile = file.type;
      base64File = reData.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
  });

  // --- Função Enviar pro Background (Chrome Alarms) ---
  document.getElementById('btn-salvar-agendamento').addEventListener('click', () => {
     const alvoAtivo = document.querySelector('input[name="agend-alvo"]:checked').value;
     let numParsed = '';
     let nomeNomeParsed = '';

     if (alvoAtivo === 'contato') {
        const num = document.getElementById('agend-numero').value.trim();
        numParsed = num.replace(/\D/g, '');
        if (!numParsed) return typeof toast === 'function' && toast('Número inválido!', 'error');
        if (!numParsed.includes('@')) numParsed += '@c.us';
        nomeNomeParsed = document.getElementById('agend-nome').value.trim() || numParsed.split('@')[0];
     } else if (alvoAtivo === 'grupo') {
        const selG = document.getElementById('agend-grupo-select');
        if (!selG.value) return typeof toast === 'function' && toast('Selecione um grupo!', 'error');
        numParsed = selG.value;
        nomeNomeParsed = selG.options[selG.selectedIndex].text;
     } else if (alvoAtivo === 'status') {
        const pType = document.getElementById('agend-status-privacy').value;
        const rawList = document.getElementById('agend-status-list').value;
        if (pType !== 'contacts' && !rawList.trim()) return typeof toast === 'function' && toast('Insira os contatos para a Privacidade!', 'error');
        const pList = rawList.split(',').map(n => n.replace(/\D/g, '')).filter(n => n).join(',');
        const bgColor = document.getElementById('agend-status-bg').value;
        
        numParsed = `status@broadcast|${pType}|${pList}|${bgColor}`;
        nomeNomeParsed = 'Status do WhatsApp (Story)';
     }

     const dt = document.getElementById('agend-data').value;
     if (!dt) return typeof toast === 'function' && toast('Selecione Data e Hora', 'error');
     const whenMs = new Date(dt).getTime();
     if (whenMs <= Date.now()) return typeof toast === 'function' && toast('A data deve ser para o futuro, não passado!', 'error');

     const tp = tipoSelect.value;
     if (tp === 'texto' && !txtArea.value.trim()) return typeof toast === 'function' && toast('Escreva a mensagem antes!', 'error');
     if (tp !== 'texto' && !base64File) return typeof toast === 'function' && toast('Anexe o arquivo de áudio ou mídia!', 'error');

     // Constrói Pacote Robusto Desenhado no Planner
     const payload = {
        id: Date.now().toString() + Math.floor(Math.random() * 1000),
        chatId: numParsed,
        nomeContato: nomeNomeParsed,
        when: whenMs,
        tipo: tp,
        conteudo: txtArea.value.trim(),
        base64: base64File,
        mime: mimeFile,
        nomeArq: fileInp.files?.[0]?.name || 'documento',
        recorrencia: document.getElementById('agend-recorrencia').value
     };

     // 1) OBRIGA SALVAR NA NUVEM PRIMEIRO (Source of Truth)
     const btn = document.getElementById('btn-salvar-agendamento');
     btn.textContent = "Sincronizando com a Nuvem...";
     btn.disabled = true;

     UpsidenDB.from('agendamentos').insert({
        id: payload.id,
        chat_id: payload.chatId,
        nome_contato: payload.nomeContato,
        when_ms: payload.when,
        tipo: payload.tipo,
        conteudo: payload.conteudo,
        base64: payload.base64,
        mime: payload.mime,
        nome_arq: payload.nomeArq,
        recorrencia: payload.recorrencia
     }).select().execute().then(() => {
         // 2) Repassa pacote ao Motor Assíncrono para garantir o Wake Lock
         chrome.runtime.sendMessage({ action: 'SET_AGENDAMENTO', payload }, (res) => {
           btn.disabled = false;
           btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Agendar Envio Imediatamente';
           if (res && res.sucesso) {
             typeof toast === 'function' && toast('Disparo Blindado com a data certa!', 'success');
             document.getElementById('agend-texto').value = '';
             document.getElementById('agend-data').value = '';
             if (tp !== 'texto') fileLbl.textContent = "Nenhum arquivo.";
             refreshAgendamentosList();
           } else {
             typeof toast === 'function' && toast('Falha ao acionar a engenharia de precisão (background)', 'error');
           }
         });
     }).catch(err => {
         btn.disabled = false;
         btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Agendar Envio Imediatamente';
         typeof toast === 'function' && toast('Erro no Supabase: ' + err.message, 'error');
     });

  });

  refreshAgendamentosList();
};

// -- Controles do Relógio/Mês
let calMonthOffset = 0;
window.mudarMes = function(offset) {
  calMonthOffset += parseInt(offset, 10) || 0;
  if(typeof refreshAgendamentosList === 'function') refreshAgendamentosList();
}

/**
 * Puxa todos da database interna e renderiza as duas visões:
 * 1) A Lista Timeline (O que vai disparar hoje/próximos da fila)
 * 2) O Calendário Interativo em Malha 
 */
async function refreshAgendamentosList() {
  // CLOUD SYNC: Atualiza do Supabase inteligentemente
  try {
     const resCloud = await UpsidenDB.from('agendamentos').select('*').execute();
     if (resCloud && resCloud.length >= 0) {
        const currentRes = await new Promise(r => chrome.storage.local.get('ups_agendamentos', r));
        const currentAgends = currentRes.ups_agendamentos || {};
        
        let shouldSave = false;
        resCloud.forEach(r => {
           // Verifica se o alarme do BD não existe no array de V8 atual para não destruir as chaves (pointers de alarmName)
           const existingKey = Object.keys(currentAgends).find(k => currentAgends[k].id === r.id);
           if (!existingKey) {
              const alarmName = `agend_${r.id}_sync`;
              currentAgends[alarmName] = {
                 id: r.id, chatId: r.chat_id, nomeContato: r.nome_contato,
                 when: parseInt(r.when_ms), tipo: r.tipo, conteudo: r.conteudo,
                 base64: r.base64, mime: r.mime, nomeArq: r.nome_arq, recorrencia: r.recorrencia
              };
              shouldSave = true;
              if (parseInt(r.when_ms) > Date.now()) chrome.alarms.create(alarmName, { when: parseInt(r.when_ms) });
           }
        });
        if (shouldSave) await new Promise(resolve => chrome.storage.local.set({ ups_agendamentos: currentAgends }, resolve));
     }
  } catch (err) {
     console.warn('Sincronização Cloud Agendamentos abortada, usando local.', err);
  }

  // RENDERIZAÇÃO
  chrome.storage.local.get('ups_agendamentos', (res) => {
    const agends = res.ups_agendamentos || {};
    let items = Object.values(agends).sort((a,b) => a.when - b.when);

    // Dynamic Options Extraction for Groups
    const gruposUnicos = new Map();
    items.forEach(i => {
       if (i.chatId && i.chatId.includes('@g.us')) gruposUnicos.set(i.chatId, i.nomeContato);
    });

    const fSelect = document.getElementById('filtro-visao-cal');
    if (fSelect) {
       const curVal = fSelect.value;
       let opts = `
         <option value="todos">Visão Geral (Tudo)</option>
         <option value="contatos">Apenas Contatos Privados</option>
         <option value="grupos">Todos os Grupos Agendados</option>
         <option value="status">Apenas Status (Stories)</option>
       `;
       for (const [idG, nomG] of gruposUnicos.entries()) {
          opts += `<option value="${idG}">Ver: ${nomG}</option>`;
       }
       fSelect.innerHTML = opts;
       if ([...fSelect.options].some(o => o.value === curVal)) fSelect.value = curVal;
    }

    const filtroVal = fSelect?.value || 'todos';
    
    if (filtroVal === 'contatos') {
       items = items.filter(i => i.chatId && !i.chatId.includes('@g.us') && !i.chatId.startsWith('status@'));
    } else if (filtroVal === 'grupos') {
       items = items.filter(i => i.chatId && i.chatId.includes('@g.us'));
    } else if (filtroVal === 'status') {
       items = items.filter(i => i.chatId && i.chatId.startsWith('status@'));
    } else if (filtroVal !== 'todos') {
       items = items.filter(i => i.chatId === filtroVal);
    }
    
    // --- 1. A Lista Timeline Exata ---
    const listCont = document.getElementById('lista-agendamentos');
    if (items.length === 0) {
      listCont.innerHTML = '<div style="background:var(--surface); padding:20px; border-radius:8px; text-align:center; color:var(--text-muted); font-size:14px;">Sem movimentações registradas na fila do motor.</div>';
    } else {
      listCont.innerHTML = items.map(ai => {
        const d = new Date(ai.when);
        const icon = ai.tipo === 'texto' ? '📝' : ai.tipo === 'audio' ? '🎤' : '🖼️';
        const repet = ai.recorrencia === 'nenhuma' ? 'Apenas uma vez' : 'Regerado automáticamente';
        return `
          <div style="background:var(--surface); padding:16px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border: 1px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition:transform 0.2s;">
            <div style="display:flex; flex-direction:column; gap:6px;">
              <span style="font-weight:700; color:var(--text-primary); font-size:16px;">${icon} Para: ${ai.nomeContato}</span>
              <span style="font-size:13px; color:var(--text-muted);">
                 <b>${d.toLocaleDateString()}</b> pontualmente às <b>${d.toLocaleTimeString().slice(0,5)}</b> | <span style="color:var(--accent-glow)">${repet}</span>
              </span>
            </div>
            <button class="btn btn-danger" style="padding:8px 14px; font-size:12px;" data-click="deletarAgendamento('${ai.id}')">Excluir Alarme</button>
          </div>
        `;
      }).join('');
    }

    // --- 2. Geração da Malha Calendário ---
    const dateHoje = new Date();
    const cursorDt = new Date(dateHoje.getFullYear(), dateHoje.getMonth() + calMonthOffset, 1);
    
    document.getElementById('cal-mes-atual').textContent = cursorDt.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase());
    
    const year = cursorDt.getFullYear();
    const month = cursorDt.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    let calHTML = '';
    // Paddings (dias em branco antes do inicio do mes)
    for(let i=0; i < firstDayIndex; i++) {
       calHTML += `<div style="padding:10px; background:transparent;"></div>`;
    }
    
    // Engine dos Dias Populares
    const hjString = new Date().toDateString();
    for(let d=1; d <= daysInMonth; d++) {
       const loopDate = new Date(year, month, d);
       const isToday = loopDate.toDateString() === hjString;
       
       const dayEvents = items.filter(ai => new Date(ai.when).toDateString() === loopDate.toDateString());
       
       let eventDots = '';
       if (dayEvents.length > 0) {
         eventDots = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:8px; justify-content:center;">` +
           dayEvents.slice(0,3).map(e => `<div style="width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow: 0 0 4px var(--accent);" title="${e.nomeContato}"></div>`).join('') +
           (dayEvents.length > 3 ? `<div style="font-size:10px; line-height:8px; color:var(--text-primary); font-weight:bold;">+</div>` : '') +
           `</div>`;
       }
       
       calHTML += `
         <div style="
            background:var(--surface); 
            border: 1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}; 
            border-radius:6px; 
            min-height:75px; 
            padding:8px 4px; 
            display:flex; flex-direction:column; align-items:center;
            transition: all 0.2s ease-in-out;
         ">
           <span style="font-size:14px; font-weight:${isToday? '800':'500'}; color:${isToday? 'var(--accent)' : 'var(--text-muted)'};">${d}</span>
           ${eventDots}
         </div>
       `;
    }
    
    // Cabeçarios
    const headers = `
       <div style="text-align:center; font-weight:800; color:#ef5350; font-size:13px; padding-bottom:12px;">DOM</div>
       <div style="text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; padding-bottom:12px;">SEG</div>
       <div style="text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; padding-bottom:12px;">TER</div>
       <div style="text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; padding-bottom:12px;">QUA</div>
       <div style="text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; padding-bottom:12px;">QUI</div>
       <div style="text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; padding-bottom:12px;">SEX</div>
       <div style="text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; padding-bottom:12px;">SÁB</div>
    `;
    
    document.getElementById('cal-grid').innerHTML = headers + calHTML;
  });
}

// Remoção Definitiva via Background Alarms e DB
window.deletarAgendamento = function(id) {
   chrome.storage.local.get('ups_agendamentos', (res) => {
     const agends = res.ups_agendamentos || {};
     // Localiza a Chave baseada no Objeto UUID interno
     let keyName = Object.keys(agends).find(k => agends[k].id === id);
     if (keyName) {
       // Deleção Cloud (Sync Opcional Assíncrono)
       UpsidenDB.from('agendamentos').delete().eq('id', id).execute().catch(e=>console.log(e));
       
       // Deleção Local imediata pro Alarme V8 morrer
       chrome.alarms.clear(keyName); // Retira da memória suspensa de Wake/Background
       delete agends[keyName];      // Limpa HD local
       chrome.storage.local.set({ ups_agendamentos: agends }, () => {
         typeof toast === 'function' && toast('Gatilho cancelado e deletado com sucesso!', 'info');
         refreshAgendamentosList();
       });
     }
   });
}
