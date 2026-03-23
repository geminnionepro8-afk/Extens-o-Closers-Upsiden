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

// ═══ AUTOMAÇÕES ══════════════════════════════════════════════
window.renderAutomacoes = function(c) {
  const tabs = [
    { id: 'saudacao', label: '💬 Saudação' },
    { id: 'gatilhos', label: '⚡ Gatilhos' },
    { id: 'horario', label: '🕐 Horário de F.' },
    { id: 'regras', label: '⚙️ Regras do Robô' }
  ];
  let html = `<div class="sub-tabs" style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px;overflow-x:auto;">`;
  tabs.forEach(t => {
    html += `<button class="btn-ghost ${window.autoSubTab === t.id ? 'active' : ''}" data-click="switchTab('${t.id}')" style="padding:8px 16px;border-radius:20px;color:var(--text);background:${window.autoSubTab === t.id ? 'var(--input-bg)' : 'transparent'};white-space:nowrap;">${t.label}</button>`;
  });
  html += `</div>`;

  if (window.autoSubTab === 'saudacao') {
    html += `<div class="auto-section animate-in">
      <h3>💬 Resposta Automática (Saudação)</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure uma mensagem automática de boas-vindas para novos contatos.</p>
      <div class="form-group"><label class="form-label">Mensagem de Saudação</label><textarea class="form-textarea" id="auto-saudacao" rows="3" placeholder="Ex: Olá! Obrigado por entrar em contato. Em breve retornaremos."></textarea></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <label class="toggle-switch"><input type="checkbox" id="auto-saudacao-ativo"><span class="toggle-slider"></span></label>
        <span style="font-size:13px;color:var(--text-secondary);">Ativar saudação automática</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
         <label style="font-size:13px;color:var(--text-secondary);"><input type="checkbox" id="auto-privado" checked> Aceitar Privado</label>
         <label style="font-size:13px;color:var(--text-secondary);"><input type="checkbox" id="auto-grupo"> Aceitar Grupos</label>
      </div>
      
      <h4 style="margin-top:24px; padding-top:16px; border-top:1px dashed var(--border);">🚀 Programar Mensagens Sequenciais (Follow-ups)</h4>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Adicione mensagens ou áudios para serem enviados automaticamente um tempo depois da saudação explodir.</p>
      
      <div id="followups-list"></div>
      <button class="btn btn-secondary" data-click="addFollowupRow('followups-list')" style="margin-top:12px; margin-bottom:20px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Passo
      </button>

      <button class="btn btn-primary" data-click="salvarSaudacao()" style="display:block; width:100%;">Salvar Fluxo de Saudação</button>
    </div>`;
  } else if (window.autoSubTab === 'gatilhos') {
    html += `<div class="auto-section animate-in">
      <h3>⚡ Gatilhos Inteligentes</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Defina palavras-chave que disparam respostas ou envio de áudios gravados de forma automática.</p>
      <div id="triggers-list"></div>
      <button class="btn btn-secondary" data-click="addTriggerRow()" style="margin-top:12px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Gatilho</button>
      <button class="btn btn-primary" data-click="salvarGatilhos()" style="margin-top:12px;margin-left:8px;">Salvar Gatilhos</button>
    </div>`;
  } else if (window.autoSubTab === 'horario') {
    html += `<div class="auto-section animate-in">
      <h3>🕐 Horário de Funcionamento</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure horários de atividade. Fora desses horários, os robôs ficam inativos ou mandam a mensagem personalizada de fechado.</p>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="form-group"><label class="form-label">Horário Abertura</label><input type="time" class="form-input" id="hora-ini" value="08:00"></div>
        <div class="form-group"><label class="form-label">Horário Fechamento</label><input type="time" class="form-input" id="hora-fim" value="18:00"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Mensagem FORA do Expediente</label>
        <textarea class="form-textarea" id="msg-fechado" rows="3" placeholder="No momento nossa equipe não está..."></textarea>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <label class="toggle-switch"><input type="checkbox" id="horario-ativo"><span class="toggle-slider"></span></label>
        <span style="font-size:13px;color:var(--text-secondary);">Habilitar filtro de horário na automação</span>
      </div>
      <button class="btn btn-primary" data-click="salvarHorario()">Salvar Horário e Regras</button>
    </div>`;
  } else if (window.autoSubTab === 'regras') {
    html += `<div class="auto-section animate-in">
      <h3>⚙️ Regras Globais do Robô</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure limites anti-banimento natural (Simulação de Humano).</p>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
         <label class="toggle-switch"><input type="checkbox" id="regra-digitando" checked><span class="toggle-slider"></span></label>
         <span style="font-size:13px;color:var(--text-secondary);">Simular "digitando..." antes do robô disparar</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
         <label class="toggle-switch"><input type="checkbox" id="regra-gravando" checked><span class="toggle-slider"></span></label>
         <span style="font-size:13px;color:var(--text-secondary);">Simular "gravando áudio..." antes de enviar áudio</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;max-width:400px;margin-bottom:16px;">
        <div class="form-group">
           <label class="form-label">Delay Mínimo (seg)</label>
           <input type="number" class="form-input" id="regra-min" value="2" min="0">
        </div>
        <div class="form-group">
           <label class="form-label">Delay Máximo (seg)</label>
           <input type="number" class="form-input" id="regra-max" value="5" min="0">
        </div>
      </div>
      <button class="btn btn-primary" data-click="salvarRegrasGlobais()">Salvar Regras</button>
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
     nome = '', delay_segundos = 3, duracaoSimulacao = 2
  } = stepObj;

  const row = document.createElement('div');
  row.className = 'followup-row';
  row.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-bottom:12px; align-items:stretch; background:var(--bg-lighter, #f5f5f5); padding:10px; border-radius:8px; border-left:3px solid var(--primary);';
  
  // Row superior: Tipo e Delays
  const topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex; gap:8px; align-items:center;';

  const selTipo = document.createElement('select');
  selTipo.className = 'form-input fup-tipo';
  selTipo.style.width = '120px';
  selTipo.innerHTML = `<option value="texto">Texto</option><option value="audio">Áudio</option><option value="imagem">Imagem</option><option value="documento">Documento</option>`;
  selTipo.value = ['audio', 'imagem', 'video', 'documento', 'midia'].includes(tipo) ? (tipo==='midia'?'documento':tipo) : 'texto';

  const lblWait = document.createElement('span'); lblWait.textContent = 'Espera:'; lblWait.style.fontSize='11px'; lblWait.style.color='var(--text-secondary)';
  const inpDelay = document.createElement('input');
  inpDelay.type = 'number'; inpDelay.className = 'form-input fup-delay'; 
  inpDelay.value = delay_segundos; inpDelay.style.width = '60px'; inpDelay.min = '0';
  
  const lblDur = document.createElement('span'); lblDur.textContent = 'Simula(s):'; lblDur.style.fontSize='11px'; lblDur.style.color='var(--text-secondary)';
  const inpDuracao = document.createElement('input');
  inpDuracao.type = 'number'; inpDuracao.className = 'form-input fup-duracao'; 
  inpDuracao.value = duracaoSimulacao; inpDuracao.style.width = '60px'; inpDuracao.min = '0';

  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-icon'; btnRemove.title = 'Remover Passo'; btnRemove.style.marginLeft = 'auto';
  btnRemove.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  btnRemove.addEventListener('click', () => row.remove());

  topRow.append(selTipo, lblWait, inpDelay, lblDur, inpDuracao, btnRemove);

  // Row inferior: Conteudo Principal (Texto ou Midia Dropdown)
  const botRow = document.createElement('div');
  botRow.style.cssText = 'display:flex; gap:8px; align-items:flex-start; margin-top:4px;';

  const inpConteudo = document.createElement('textarea');
  inpConteudo.className = 'form-textarea fup-conteudo';
  inpConteudo.rows = 2;
  inpConteudo.placeholder = 'Texto da Mensagem (ou legenda se for imagem/doc)...';
  inpConteudo.value = conteudo;
  inpConteudo.style.flex = '1';

  // Componente de Selecao de Midia
  const selMidia = document.createElement('select');
  selMidia.className = 'form-input fup-midia-url';
  selMidia.style.flex = '1';
  selMidia.style.display = selTipo.value === 'texto' ? 'none' : 'block';
  
  const selSendAs = document.createElement('select');
  selSendAs.className = 'form-input fup-send-as';
  selSendAs.style.flex = '1';
  selSendAs.style.display = 'none';

  // Populador de Midia Dinamica
  const populatarMidias = (tipoAtivo) => {
     selMidia.innerHTML = `<option value="">-- Selecione do Seu Cofre --</option>`;
     selSendAs.innerHTML = '';
     selSendAs.style.display = 'none';
     const baseUrl = 'https://imxwpacwtphekrbgwbph.supabase.co/storage/v1/object/public/';
     
     if (tipoAtivo === 'audio') {
        selSendAs.innerHTML = '<option value="ptt">🎙️ Áudio Gravado na Hora (Voz PTT)</option><option value="audio_play">▶️ Música (Player no WhatsApp)</option><option value="document">📄 Enviar como Documento</option>';
        selSendAs.style.display = 'block';
        if (stepObj?.sendAs) selSendAs.value = stepObj.sendAs;

        (painelData?.audios || []).forEach(a => {
           const op = document.createElement('option');
           op.value = baseUrl + 'audios/' + a.storage_path;
           op.dataset.nome = a.nome;
           op.dataset.mime = a.tipo_mime || 'audio/ogg';
           op.textContent = `🎙️ ${a.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     } else if (tipoAtivo === 'midia' || tipoAtivo === 'imagem' || tipoAtivo === 'video' || tipoAtivo === 'documento') {
        selSendAs.innerHTML = '<option value="nativo">🖼️ Visual Nativo (Foto/Vídeo)</option><option value="document">📄 Enviar como Documento</option>';
        selSendAs.style.display = 'block';
        if (stepObj?.sendAs) selSendAs.value = stepObj.sendAs;

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
  
  populatarMidias(selTipo.value);

  // Hidden Inputs for legacy generic files
  const hiddenUrl = document.createElement('input'); hiddenUrl.type = 'hidden'; hiddenUrl.className = 'fup-url'; hiddenUrl.value = url;
  const hiddenMime = document.createElement('input'); hiddenMime.type = 'hidden'; hiddenMime.className = 'fup-mime'; hiddenMime.value = mime;
  const hiddenNome = document.createElement('input'); hiddenNome.type = 'hidden'; hiddenNome.className = 'fup-nome'; hiddenNome.value = nome;
  const hiddenBase64 = document.createElement('input'); hiddenBase64.type = 'hidden'; hiddenBase64.className = 'fup-base64'; hiddenBase64.value = base64;

  selMidia.addEventListener('change', (e) => {
     hiddenUrl.value = e.target.value;
     if (e.target.options[e.target.selectedIndex]) {
        hiddenMime.value = e.target.options[e.target.selectedIndex].dataset.mime || '';
        hiddenNome.value = e.target.options[e.target.selectedIndex].dataset.nome || '';
     }
  });

  selTipo.addEventListener('change', (e) => {
    const val = e.target.value;
    selMidia.style.display = val === 'texto' ? 'none' : 'block';
    populatarMidias(val);
  });

  botRow.append(inpConteudo, selMidia, selSendAs, hiddenUrl, hiddenMime, hiddenNome, hiddenBase64);
  row.append(topRow, botRow);
  list.appendChild(row);
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
  
  chrome.storage.local.set({ ups_config_saudacao: { mensagem: msg, ativo, apenasPrivado: p, apenasGrupo: g, followupSteps: followups } }, () => {
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
        if (ct || url) {
           stepsListParams.push({ tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur, url: url, mime: mime, nome: nome });
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
  wrapper.className = 'trigger-wrapper';
  wrapper.style.cssText = 'background:var(--input-bg); padding:12px; border-radius:8px; margin-bottom:16px; border:1px solid var(--border);';
  
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:12px;';
  
  const inpPalavra = document.createElement('input');
  inpPalavra.className = 'form-input trigger-palavra';
  inpPalavra.placeholder = 'Palavras-chave (ex: preço, comprar)';
  inpPalavra.value = palavra;
  inpPalavra.style.flex = '1';

  const btnAddStep = document.createElement('button');
  btnAddStep.className = 'btn btn-secondary';
  btnAddStep.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> + Ação de Resposta';
  btnAddStep.addEventListener('click', () => window.addFollowupRow(uid));

  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-icon'; btnRemove.title = 'Apagar Gatilho inteiro';
  btnRemove.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  btnRemove.addEventListener('click', () => wrapper.remove());

  headerRow.append(inpPalavra, btnAddStep, btnRemove);

  const stepsContainer = document.createElement('div');
  stepsContainer.id = uid;
  stepsContainer.className = 'trigger-steps-container';
  stepsContainer.style.cssText = 'padding-left:12px; border-left:2px solid var(--border);';

  wrapper.append(headerRow, stepsContainer);
  list.appendChild(wrapper);

  // Restore legacy flat strings by migrating them to Step Objects
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
        const eMsg = document.getElementById('auto-saudacao'); const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = res.ups_config_saudacao.mensagem || '';
        if(eAtivo) eAtivo.checked = res.ups_config_saudacao.ativo || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = res.ups_config_saudacao.apenasPrivado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = res.ups_config_saudacao.apenasGrupo || false;
        // Restore followups
        const list = document.getElementById('followups-list');
        if (list) list.innerHTML = '';
        if (res.ups_config_saudacao.followupSteps && Array.isArray(res.ups_config_saudacao.followupSteps)) {
           res.ups_config_saudacao.followupSteps.forEach(p => window.addFollowupRow('followups-list', p));
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
