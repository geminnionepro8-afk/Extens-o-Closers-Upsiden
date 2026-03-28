/**
 * @file painel-automacoes.js
 * @description Renderiza a seção Automações do Painel Upsiden.
 *              Sub-abas: Saudação, Gatilhos, Horário de Funcionamento, Regras do Robô.
 *              Cada sub-aba tem formulários para configurar o engine de automação.
 * @module Módulo 06: UI — Painel (Automações)
 * @date 21/03/2026
 */

// ═══ STATE ═══════════════════════════════════════════════════
if (typeof window.autoSubTab === 'undefined') window.autoSubTab = 'saudacao';

window.renderAutomacoes = function(c) {
  const tabs = [
    { id: 'saudacao', label: '💬 Saudação' },
    { id: 'gatilhos', label: '⚡ Gatilhos' },
    { id: 'horario', label: '🕐 Horário de F.' },
    { id: 'regras', label: '⚙️ Regras do Robô' }
  ];

  let html = `<div class="rs-tabs-switcher">`;
  tabs.forEach(t => {
    html += `<button class="rs-tab-btn ${window.autoSubTab === t.id ? 'active' : ''}" data-click="switchTab('${t.id}')">${t.label}</button>`;
  });
  html += `</div>`;

  if (window.autoSubTab === 'saudacao') {
    html += `<div class="rs-card rs-card-accent animate-in">
      <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">💬 Resposta Automática (Saudação)</h3>
      <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px; font-weight:500;">Configure uma mensagem automática de boas-vindas para novos contatos de forma profissional.</p>
      
      <div class="form-group"><label class="form-label">Mensagem de Saudação Global</label><textarea class="form-textarea" id="auto-saudacao" rows="4" placeholder="Ex: Olá! Obrigado por entrar em contato com a Upsiden."></textarea></div>
      
      <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:center; margin-top:16px; padding:16px; background:var(--bg-secondary); border-radius:var(--radius-sm); border:1px solid var(--border);">
        <div style="display:flex; align-items:center; gap:12px;">
          <label class="toggle-switch"><input type="checkbox" id="auto-saudacao-ativo"><span class="toggle-slider"></span></label>
          <span style="font-size:13px; font-weight:600;">Ativar saudação</span>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
           <label style="font-size:13px; color:var(--text-secondary); display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="auto-privado" checked style="accent-color:var(--accent);"> Aceitar Privado</label>
           <label style="font-size:13px; color:var(--text-secondary); display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="auto-grupo" style="accent-color:var(--accent);"> Aceitar Grupos</label>
        </div>
      </div>
      
      <div style="margin-top:32px; padding-top:24px; border-top:1px dashed var(--border);">
        <h4 style="font-size:15px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">🚀 Funil de Follow-ups (Mensagens Sequenciais)</h4>
        <p style="color:var(--text-muted); font-size:12px; margin-bottom:20px;">Dê um ar humano salvando áudios ou mídias para dispararem segundos após a saudação.</p>
        
        <div id="followups-list"></div>
        
        <button class="btn btn-secondary" data-click="addFollowupRow('followups-list')" style="margin-top:12px; margin-bottom:24px; background:transparent; border:1px dashed var(--accent); color:var(--accent); font-weight:700;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Adicionar Novo Passo de Fluxo
        </button>
      </div>

      <button class="btn btn-primary" data-click="salvarSaudacao()" style="display:flex; width:100%; justify-content:center; padding:14px; font-size:14px; font-weight:800; border-radius:var(--radius-sm); margin-top:10px;">Salvar Estrutura de Saudação</button>
    </div>`;
  } else if (window.autoSubTab === 'gatilhos') {
    html += `<div class="rs-card rs-card-accent animate-in">
      <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">⚡ Inteligência de Gatilhos</h3>
      <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px; font-weight:500;">Defina palavras-chave que disparam respostas ou áudios automáticos com perfeição.</p>
      
      <div id="triggers-list" style="display:flex; flex-direction:column; gap:16px;"></div>
      
      <div style="display:flex; gap:12px; margin-top:24px; padding-top:20px; border-top:1px solid var(--border);">
        <button class="btn btn-secondary" data-click="addTriggerRow()" style="flex:1; justify-content:center; font-weight:700;"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right:6px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Gatilho</button>
        <button class="btn btn-primary" data-click="salvarGatilhos()" style="flex:1; justify-content:center; font-weight:700; box-shadow: 0 4px 15px var(--accent-glow);">Salvar Todas as Regras</button>
      </div>
    </div>`;
  } else if (window.autoSubTab === 'horario') {
    html += `<div class="rs-card rs-card-accent animate-in">
      <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">🕐 Filtro de Expediente</h3>
      <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px; font-weight:500;">Evite que seus automações rodem fora do horário comercial, ou envie mensagens de fechado.</p>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; background:var(--bg-secondary); padding:20px; border-radius:var(--radius-sm); border:1px solid var(--border);">
        <div class="form-group" style="margin:0;"><label class="form-label">Início das Operações</label><input type="time" class="form-input" id="hora-ini" value="08:00" style="width:100%;"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Término das Operações</label><input type="time" class="form-input" id="hora-fim" value="18:00" style="width:100%;"></div>
      </div>
      
      <div class="form-group" style="margin-top:24px;">
        <label class="form-label">Mensagem para Mensagens Fora de Horário (Opcional)</label>
        <textarea class="form-textarea" id="msg-fechado" rows="4" placeholder="Ex: Olá! No momento não estamos em horário comercial..."></textarea>
      </div>
      
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px; margin-top:8px; padding:16px; background:var(--bg-secondary); border-radius:var(--radius-sm); border:1px solid var(--border);">
        <label class="toggle-switch"><input type="checkbox" id="horario-ativo"><span class="toggle-slider"></span></label>
        <span style="font-size:13px; font-weight:600;">Habilitar bloqueio de horário</span>
      </div>
      
      <button class="btn btn-primary" data-click="salvarHorario()" style="display:flex; width:100%; justify-content:center; padding:14px; font-size:14px; font-weight:800;">Salvar Disposições de Horário</button>
    </div>`;
  } else if (window.autoSubTab === 'regras') {
    html += `<div class="rs-card rs-card-accent animate-in">
      <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">⚙️ Configurações Anti-Banimento</h3>
      <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px; font-weight:500;">Simule comportamentos humanos para proteger sua conta durante disparos automáticos.</p>
      
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
         <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:var(--bg-secondary); border-radius:var(--radius-sm); border:1px solid var(--border);">
            <div style="display:flex; flex-direction:column; gap:4px;">
               <span style="font-size:14px; font-weight:700;">Simular "Digitando..."</span>
               <span style="font-size:12px; color:var(--text-muted);">Exibe status de digitação antes de enviar texto.</span>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="regra-digitando" checked><span class="toggle-slider"></span></label>
         </div>
         
         <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:var(--bg-secondary); border-radius:var(--radius-sm); border:1px solid var(--border);">
            <div style="display:flex; flex-direction:column; gap:4px;">
               <span style="font-size:14px; font-weight:700;">Simular "Gravando Áudio..."</span>
               <span style="font-size:12px; color:var(--text-muted);">Exibe status de gravação antes de enviar áudio.</span>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="regra-gravando" checked><span class="toggle-slider"></span></label>
         </div>
      </div>

      <div style="background:var(--bg-card-hover); padding:24px; border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:24px;">
         <label class="form-label" style="margin-bottom:16px; color:var(--accent);">Intervalos Randômicos de Segurança</label>
         <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
           <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:10px;">Atraso Mínimo (seg)</label><input type="number" class="form-input" id="regra-min" value="2" min="0" style="width:100%;"></div>
           <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:10px;">Atraso Máximo (seg)</label><input type="number" class="form-input" id="regra-max" value="5" min="0" style="width:100%;"></div>
         </div>
      </div>

      <button class="btn btn-primary" data-click="salvarRegrasGlobais()" style="display:flex; width:100%; justify-content:center; padding:14px; font-size:14px; font-weight:800;">Aplicar Regras de Segurança</button>
    </div>`;
  }

  c.innerHTML = html;
  setTimeout(loadAutomationConfig, 50);
};

window.addFollowupRow = function(containerId, stepObj = {}) {
  const list = document.getElementById(containerId);
  if(!list) return;

  const {
     tipo = 'texto', conteudo = '', base64 = '', url = '', mime = '',
     nome = '', delay_segundos = 3, duracaoSimulacao = 2, sendAs = ''
  } = stepObj;

  const row = document.createElement('div');
  row.className = 'rs-action-row followup-row animate-in';
  
  // Icon based on type
  let icon = '💬';
  if (tipo === 'audio') icon = '🎵';
  else if (['imagem', 'midia', 'video', 'documento'].includes(tipo)) icon = '🖼️';

  row.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
       <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:32px; height:32px; border-radius:8px; background:var(--accent-dim); color:var(--accent); display:flex; align-items:center; justify-content:center; font-size:16px;">${icon}</div>
          <select class="form-input fup-tipo" style="width:130px; height:32px; padding:2px 8px; font-weight:700;">
             <option value="texto">Texto</option>
             <option value="audio">Áudio</option>
             <option value="imagem">Imagem</option>
             <option value="documento">Documento</option>
          </select>
       </div>
       <div style="display:flex; align-items:center; gap:8px;">
          <div style="display:flex; align-items:center; gap:6px; background:var(--bg-input); padding:4px 10px; border-radius:6px; border:1px solid var(--border);">
            <span style="font-size:11px; color:var(--text-muted); font-weight:700;">ESPERA:</span>
            <input type="number" class="fup-delay" value="${delay_segundos}" min="0" style="width:40px; background:transparent; border:none; color:var(--text-primary); font-weight:700; outline:none; font-size:12px;">
            <span style="font-size:11px; color:var(--text-muted);">s</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; background:var(--bg-input); padding:4px 10px; border-radius:6px; border:1px solid var(--border);">
            <span style="font-size:11px; color:var(--text-muted); font-weight:700;">HUMANO:</span>
            <input type="number" class="fup-duracao" value="${duracaoSimulacao}" min="0" style="width:40px; background:transparent; border:none; color:var(--text-primary); font-weight:700; outline:none; font-size:12px;">
            <span style="font-size:11px; color:var(--text-muted);">s</span>
          </div>
          <button class="btn-icon btn-remove" style="color:var(--danger); margin-left:8px;"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
       </div>
    </div>
    
    <div style="display:flex; flex-direction:column; gap:10px;">
       <textarea class="form-textarea fup-conteudo" rows="2" placeholder="Digite sua mensagem de follow-up aqui..." style="width:100%; min-height:60px;">${conteudo}</textarea>
       
       <div class="media-fields" style="display: ${tipo === 'texto' ? 'none' : 'flex'}; flex-direction:column; gap:8px;">
          <div class="form-group" style="margin:0;">
             <label class="form-label" style="font-size:10px;">Selecionar da Biblioteca</label>
             <select class="form-input fup-midia-url" style="width:100%"><option value="">-- Selecione do Seu Cofre --</option></select>
          </div>
          <div class="form-group fup-send-as-container" style="margin:0; display:none;">
             <label class="form-label" style="font-size:10px;">Modo de Envio</label>
             <select class="form-input fup-send-as" style="width:100%"></select>
          </div>
       </div>
    </div>

    <input type="hidden" class="fup-url" value="${url}">
    <input type="hidden" class="fup-mime" value="${mime}">
    <input type="hidden" class="fup-nome" value="${nome}">
    <input type="hidden" class="fup-base64" value="${base64}">
  `;

  list.appendChild(row);

  const selTipo = row.querySelector('.fup-tipo');
  const selMidia = row.querySelector('.fup-midia-url');
  const selSendAs = row.querySelector('.fup-send-as');
  const sendAsContainer = row.querySelector('.fup-send-as-container');
  const mediaFields = row.querySelector('.media-fields');
  const hiddenUrl = row.querySelector('.fup-url');
  const hiddenMime = row.querySelector('.fup-mime');
  const hiddenNome = row.querySelector('.fup-nome');

  selTipo.value = ['audio', 'imagem', 'video', 'documento', 'midia'].includes(tipo) ? (tipo==='midia'?'documento':tipo) : 'texto';

  row.querySelector('.btn-remove').onclick = () => row.remove();

  const populatarMidias = (tipoAtivo) => {
     selMidia.innerHTML = `<option value="">-- Selecione do Seu Cofre --</option>`;
     selSendAs.innerHTML = '';
     sendAsContainer.style.display = 'none';
     
     if (tipoAtivo === 'texto') {
        mediaFields.style.display = 'none';
        return;
     }
     mediaFields.style.display = 'flex';
     const baseUrl = 'https://imxwpacwtphekrbgwbph.supabase.co/storage/v1/object/public/';
     
     if (tipoAtivo === 'audio') {
        selSendAs.innerHTML = '<option value="ptt">🎙️ Áudio Gravado na Hora (Voz PTT)</option><option value="audio_play">▶️ Música (Player no WhatsApp)</option><option value="document">📄 Enviar como Documento</option>';
        sendAsContainer.style.display = 'block';
        if (sendAs) selSendAs.value = sendAs;

        (painelData?.audios || []).forEach(a => {
           const op = document.createElement('option');
           op.value = baseUrl + 'audios/' + a.storage_path;
           op.dataset.nome = a.nome; op.dataset.mime = a.tipo_mime || 'audio/ogg';
           op.textContent = `🎙️ ${a.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     } else {
        selSendAs.innerHTML = '<option value="nativo">🖼️ Visual Nativo (Foto/Vídeo/Doc)</option><option value="document">📄 Forçar Envio como Arquivo</option>';
        sendAsContainer.style.display = 'block';
        if (sendAs) selSendAs.value = sendAs;

        (painelData?.midias || []).filter(m => m.tipo && (m.tipo.includes('image') || m.tipo.includes('video'))).forEach(m => {
           const op = document.createElement('option');
           op.value = baseUrl + 'midias/' + m.storage_path;
           op.dataset.nome = m.nome; op.dataset.mime = m.tipo;
           op.textContent = `🖼️ ${m.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
        (painelData?.documentos || []).forEach(d => {
           const op = document.createElement('option');
           op.value = baseUrl + 'documentos/' + d.storage_path;
           op.dataset.nome = d.nome; op.dataset.mime = d.tipo;
           op.textContent = `📄 ${d.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     }
  };

  selTipo.onchange = (e) => populatarMidias(e.target.value);
  selMidia.onchange = (e) => {
     hiddenUrl.value = e.target.value;
     if (e.target.options[e.target.selectedIndex]) {
        hiddenMime.value = e.target.options[e.target.selectedIndex].dataset.mime || '';
        hiddenNome.value = e.target.options[e.target.selectedIndex].dataset.nome || '';
     }
  };

  populatarMidias(selTipo.value);
};

window.salvarSaudacao = async function() {
  const msg = document.getElementById('auto-saudacao').value.trim();
  const ativo = document.getElementById('auto-saudacao-ativo').checked;
  const p = document.getElementById('auto-privado')?.checked || false;
  const g = document.getElementById('auto-grupo')?.checked || false;
  
  // Coletar followups
  const fupRows = document.querySelectorAll('#followups-list .followup-row');
  const followups = [];
  fupRows.forEach(row => {
    const tp = row.querySelector('.fup-tipo').value;
    const ct = row.querySelector('.fup-conteudo').value.trim();
    const dl = Number(row.querySelector('.fup-delay').value) || 0;
    const dur = Number(row.querySelector('.fup-duracao').value) || 2;
    const url = row.querySelector('.fup-url').value;
    const mime = row.querySelector('.fup-mime').value;
    const nome = row.querySelector('.fup-nome').value;
    const sendAs = row.querySelector('.fup-send-as')?.value || '';

    if (ct || url) {
      followups.push({ 
         tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur,
         url: url, mime: mime, nome: nome, sendAs: sendAs
      });
    }
  });
  
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      saudacao_ativa: ativo,
      saudacao_mensagem: msg,
      apenas_privado: p,
      apenas_grupo: g,
      followup_steps: JSON.stringify(followups),
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  
  const storageData = { 
    saudacao_ativa: ativo, 
    saudacao_mensagem: msg, 
    apenas_privado: p, 
    apenas_grupo: g, 
    followup_steps: followups 
  };
  chrome.storage.local.set({ ups_config_saudacao: storageData }, () => {
    toast('Saudação salva com ' + followups.length + ' passo(s) programado(s)!', 'success');
  });
};

window.salvarGatilhos = async function() {
  const rows = document.querySelectorAll('.trigger-wrapper');
  const triggers = [];
  rows.forEach(row => {
    const p = row.querySelector('.trigger-palavra')?.value?.trim();
    if (!p) return;
    
    const stepsListParams = [];
    const stepRows = row.querySelectorAll('.followup-row');
    stepRows.forEach(sr => {
        const tp = sr.querySelector('.fup-tipo').value;
        const ct = sr.querySelector('.fup-conteudo').value.trim();
        const dl = Number(sr.querySelector('.fup-delay').value) || 0;
        const dur = Number(sr.querySelector('.fup-duracao').value) || 2;
        const url = sr.querySelector('.fup-url').value;
        const mime = sr.querySelector('.fup-mime').value;
        const nome = sr.querySelector('.fup-nome').value;
        const sendAs = sr.querySelector('.fup-send-as')?.value || '';
        if (ct || url) {
           stepsListParams.push({ 
              tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur, 
              url: url, mime: mime, nome: nome, sendAs: sendAs 
           });
        }
    });
    
    triggers.push({ 
        palavra: p, 
        resposta: JSON.stringify(stepsListParams), 
        condicao: 'exata', 
        ativo: true,
        apenas_privado: true
    });
  });
  
  try {
    await UpsidenDB.from('gatilhos').delete().eq('criado_por', userData.userId);
    for (const t of triggers) {
      await UpsidenDB.from('gatilhos').insert({
        palavra: t.palavra, resposta: t.resposta, condicao: t.condicao,
        ativo: true, criado_por: userData.userId, simular_digitacao: true,
        apenas_privado: true
      }).execute();
    }
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_triggers: triggers }, () => toast(`${triggers.length} gatilho(s) salvo(s) com sequência multidimensional!`, 'success'));
};

window.addTriggerRow = function(palavra='', respostaObj={}) {
  const list = document.getElementById('triggers-list');
  if(!list) return;
  const uid = 'gatilho-fluxo-' + Date.now() + Math.random().toString(36).substring(2,6);

  const wrapper = document.createElement('div');
  wrapper.className = 'rs-action-row trigger-wrapper animate-in';
  wrapper.style.borderLeft = '4px solid var(--accent)';
  wrapper.style.padding = '20px';

  wrapper.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:12px;">
       <div style="flex:1; position:relative;">
          <label style="font-size:10px; font-weight:800; color:var(--text-muted); position:absolute; top:-8px; left:12px; background:var(--bg-secondary); padding:0 6px; z-index:2;">PALAVRA(S) CHAVE</label>
          <input type="text" class="form-input trigger-palavra" placeholder="Ex: preco, valor, comprar" value="${palavra}" style="width:100%; font-weight:700; border-radius:8px;">
       </div>
       <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-add-step" style="height:42px; font-weight:700; gap:8px;">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> 
             Add Resposta
          </button>
          <button class="btn-icon btn-remove-trigger" style="color:var(--danger); background:var(--bg-input); width:42px; height:42px; border-radius:8px; border:1px solid var(--border);">
             <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
       </div>
    </div>
    
    <div id="${uid}" class="trigger-steps-container" style="padding-left:16px; border-left:2px dashed var(--border); margin-left:8px; display:flex; flex-direction:column; gap:12px;">
       <!-- Followup Rows nested here -->
    </div>
  `;

  list.appendChild(wrapper);

  wrapper.querySelector('.btn-add-step').onclick = () => window.addFollowupRow(uid);
  wrapper.querySelector('.btn-remove-trigger').onclick = () => wrapper.remove();
  if (respostaObj) {
     let steps = [];
     if (typeof respostaObj === 'string') {
        try {
           const parsed = JSON.parse(respostaObj);
           if (Array.isArray(parsed)) steps = parsed;
           else steps = [{ tipo: 'texto', conteudo: respostaObj, delay_segundos: 0, duracaoSimulacao: 2 }];
        } catch(e) {
           steps = [{ tipo: 'texto', conteudo: respostaObj, delay_segundos: 0, duracaoSimulacao: 2 }];
        }
     } else if (Array.isArray(respostaObj)) {
        steps = respostaObj;
     }

     steps.forEach(p => window.addFollowupRow(uid, p));
  } else {
     // Gatilho vazio, auto criamos primeira acao de texto
     window.addFollowupRow(uid);
  }
};

window.loadAutomationConfig = async function() {
  const fallbackLocal = () => {
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_horario', 'ups_config_regras'], res => {
      if(window.autoSubTab === 'saudacao' && res.ups_config_saudacao) {
        const s = res.ups_config_saudacao;
        const eMsg = document.getElementById('auto-saudacao'); const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = s.saudacao_mensagem || s.mensagem || '';
        if(eAtivo) eAtivo.checked = s.saudacao_ativa || s.ativo || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = s.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = s.apenas_grupo || false;
        // Restore followups
        const list = document.getElementById('followups-list');
        if (list) list.innerHTML = '';
        const steps = s.followup_steps || s.followupSteps;
        if (steps && Array.isArray(steps)) {
           steps.forEach(p => window.addFollowupRow('followups-list', p));
        }
      }
      if(window.autoSubTab === 'gatilhos') {
        const triggers = res.ups_config_triggers || [];
        if(!triggers.length) window.addTriggerRow();
        else triggers.forEach(t => window.addTriggerRow(t.palavra, t.resposta));
      }
      if (window.autoSubTab === 'horario' && res.ups_config_horario) {
        if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = res.ups_config_horario.ini || '08:00';
        if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = res.ups_config_horario.fim || '18:00';
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = res.ups_config_horario.msg || '';
        if(document.getElementById('horario-ativo')) document.getElementById('horario-ativo').checked = res.ups_config_horario.ativo || false;
      }
      if (window.autoSubTab === 'regras' && res.ups_config_regras) {
        if(document.getElementById('regra-digitando')) document.getElementById('regra-digitando').checked = res.ups_config_regras.simular !== false;
        if(document.getElementById('regra-gravando')) document.getElementById('regra-gravando').checked = res.ups_config_regras.simularGravacao !== false;
        if(document.getElementById('regra-min')) document.getElementById('regra-min').value = res.ups_config_regras.delayMin || 2;
        if(document.getElementById('regra-max')) document.getElementById('regra-max').value = res.ups_config_regras.delayMax || 5;
      }
    });
  };

  try {
    if (window.autoSubTab === 'saudacao') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        const eMsg = document.getElementById('auto-saudacao');
        const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = data.saudacao_mensagem || '';
        if(eAtivo) eAtivo.checked = data.saudacao_ativa || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = data.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = data.apenas_grupo || false;
        
        // Restore followups
        const list = document.getElementById('followups-list');
        if (list) list.innerHTML = '';
        if (data.followup_steps) {
           try {
             const passos = JSON.parse(data.followup_steps);
             if (Array.isArray(passos)) {
                passos.forEach(p => window.addFollowupRow('followups-list', p));
             }
           } catch(e) {}
        }
      } else {
        fallbackLocal();
      }
    }
    if (window.autoSubTab === 'gatilhos') {
      const resGatilhos = await UpsidenDB.from('gatilhos').select('*').eq('criado_por', userData.userId).order('created_at', { ascending: false });
      const gatilhos = resGatilhos.data || resGatilhos || [];
      if (!gatilhos.length) fallbackLocal();
      else gatilhos.forEach(t => window.addTriggerRow(t.palavra, t.resposta));
    }
    if (window.autoSubTab === 'horario') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = data.hora_inicio || '08:00';
        if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = data.hora_fim || '18:00';
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = data.msg_fora_horario || '';
        if(document.getElementById('horario-ativo')) document.getElementById('horario-ativo').checked = data.usar_horario || false;
      } else { fallbackLocal(); }
    }
    if (window.autoSubTab === 'regras') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('regra-digitando')) document.getElementById('regra-digitando').checked = data.simular_digitacao !== false;
        if(document.getElementById('regra-gravando')) document.getElementById('regra-gravando').checked = data.simular_gravacao !== false;
        if(document.getElementById('regra-min')) document.getElementById('regra-min').value = data.delay_min || 2;
        if(document.getElementById('regra-max')) document.getElementById('regra-max').value = data.delay_max || 5;
      } else { fallbackLocal(); }
    }
  } catch(e) {
    fallbackLocal();
  }
};

window.salvarHorario = async function() {
  const ini = document.getElementById('hora-ini')?.value || '08:00';
  const fim = document.getElementById('hora-fim')?.value || '18:00';
  const msg = document.getElementById('msg-fechado')?.value?.trim() || '';
  const ativo = document.getElementById('horario-ativo')?.checked || false;
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      usar_horario: ativo,
      hora_inicio: ini,
      hora_fim: fim,
      msg_fora_horario: msg,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_horario: { ini, fim, msg, ativo } }, () => toast('Horário de atendimento salvo!', 'success'));
};

window.salvarRegrasGlobais = async function() {
  const simula = document.getElementById('regra-digitando')?.checked || false;
  const simulaGrav = document.getElementById('regra-gravando')?.checked || false;
  const delayMin = Number(document.getElementById('regra-min')?.value) || 2;
  const delayMax = Number(document.getElementById('regra-max')?.value) || 5;
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      simular_digitacao: simula,
      simular_gravacao: simulaGrav,
      delay_min: delayMin,
      delay_max: delayMax,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_regras: { simular: simula, simularGravacao: simulaGrav, delayMin, delayMax } }, () => toast('Regras de humanização globais salvas!', 'success'));
};

// Anti-Ban functions (SSOT: single source for salvarConfigAntiBan/loadAntiBan)
window.salvarConfigAntiBan = function() {
  chrome.storage.local.set({
    ups_antiban_min: document.getElementById('anti-min').value,
    ups_antiban_max: document.getElementById('anti-max').value
  }, () => toast('Configuração salva!', 'success'));
};
window.loadAntiBan = function() {
  chrome.storage.local.get(['ups_antiban_min', 'ups_antiban_max'], (res) => {
    const min = document.getElementById('anti-min'); const max = document.getElementById('anti-max');
    if(min) min.value = res.ups_antiban_min || 4;
    if(max) max.value = res.ups_antiban_max || 10;
  });
};
