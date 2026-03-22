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
      <button class="btn btn-primary" data-click="salvarSaudacao()">Salvar Saudação</button>
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
      <div class="form-group" style="margin-top:12px;max-width:300px;">
        <label class="form-label">Tempo do "Digitando..." / "Gravando..."</label>
        <select class="form-input" id="regra-timer">
          <option value="dinamico">Inteligente (calcula tempo pelo tam. da msg)</option>
          <option value="2">Constante (2 segundos rápido)</option>
          <option value="5">Seguro (5 segundos natural)</option>
        </select>
      </div>
      <button class="btn btn-primary" data-click="salvarRegrasGlobais()">Salvar Regras</button>
    </div>`;
  }

  c.innerHTML = html;
  setTimeout(loadAutomationConfig, 50);
};

// ═══ Sub-funções de Automação ════════════════════════════════
window.salvarSaudacao = async function() {
  const msg = document.getElementById('auto-saudacao').value.trim();
  const ativo = document.getElementById('auto-saudacao-ativo').checked;
  const p = document.getElementById('auto-privado')?.checked || false;
  const g = document.getElementById('auto-grupo')?.checked || false;
  
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      saudacao_ativa: ativo,
      saudacao_mensagem: msg,
      apenas_privado: p,
      apenas_grupo: g,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  
  chrome.storage.local.set({ ups_config_saudacao: { mensagem: msg, ativo, apenasPrivado: p, apenasGrupo: g } }, () => toast('Saudação salva!', 'success'));
};

window.salvarGatilhos = async function() {
  const rows = document.querySelectorAll('#triggers-list > div');
  const triggers = [];
  rows.forEach(row => {
    const p = row.querySelector('.trigger-palavra')?.value?.trim();
    const r = row.querySelector('.trigger-resposta')?.value?.trim();
    if(p && r) triggers.push({ palavra: p, resposta: r });
  });
  try {
    await UpsidenDB.from('gatilhos').eq('criado_por', userData.userId).delete().execute();
    for (const t of triggers) {
      await UpsidenDB.from('gatilhos').insert({
        palavra: t.palavra, resposta: t.resposta, condicao: 'exata',
        ativo: true, criado_por: userData.userId, simular_digitacao: true,
        apenas_privado: true
      }).execute();
    }
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_triggers: triggers }, () => toast(`${triggers.length} gatilho(s) salvo(s)!`, 'success'));
};

window.addTriggerRow = function(palavra='', resposta='') {
  const list = document.getElementById('triggers-list');
  if(!list) return;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-icon';
  btnRemove.title = 'Remover';
  btnRemove.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  btnRemove.addEventListener('click', () => row.remove());
  row.innerHTML = `<input class="form-input trigger-palavra" placeholder="Palavras-chave (ex: preço, valor)" value="${palavra}" style="flex:1;"><input class="form-input trigger-resposta" placeholder="Resposta / ID do Áudio..." value="${resposta}" style="flex:2;">`;
  row.appendChild(btnRemove);
  list.appendChild(row);
};

window.loadAutomationConfig = async function() {
  try {
    if (window.autoSubTab === 'saudacao') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId).execute();
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        const eMsg = document.getElementById('auto-saudacao');
        const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = data.saudacao_mensagem || '';
        if(eAtivo) eAtivo.checked = data.saudacao_ativa || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = data.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = data.apenas_grupo || false;
      }
    }
    if (window.autoSubTab === 'gatilhos') {
      const gatilhos = await UpsidenDB.from('gatilhos').select('*').eq('criado_por', userData.userId).order('created_at', false).execute() || [];
      if (!gatilhos.length) window.addTriggerRow();
      else gatilhos.forEach(t => window.addTriggerRow(t.palavra, t.resposta));
    }
    if (window.autoSubTab === 'horario') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId).execute();
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = data.hora_inicio || '08:00';
        if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = data.hora_fim || '18:00';
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = data.msg_fora_horario || '';
        if(document.getElementById('horario-ativo')) document.getElementById('horario-ativo').checked = data.usar_horario || false;
      }
    }
    if (window.autoSubTab === 'regras') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId).execute();
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('regra-digitando')) document.getElementById('regra-digitando').checked = data.simular_digitacao !== false;
        if(document.getElementById('regra-gravando')) document.getElementById('regra-gravando').checked = data.simular_gravacao !== false;
        const timerEl = document.getElementById('regra-timer');
        if (timerEl) {
          const dmin = data.delay_min || 2;
          timerEl.value = dmin <= 2 ? '2' : dmin >= 5 ? '5' : 'dinamico';
        }
      }
    }
  } catch(e) {
    // Fallback: carregar do local
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_horario', 'ups_config_regras'], res => {
      if(window.autoSubTab === 'saudacao' && res.ups_config_saudacao) {
        const eMsg = document.getElementById('auto-saudacao'); const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = res.ups_config_saudacao.mensagem || '';
        if(eAtivo) eAtivo.checked = res.ups_config_saudacao.ativo || false;
      }
      if(window.autoSubTab === 'gatilhos') {
        const triggers = res.ups_config_triggers || [];
        if(!triggers.length) window.addTriggerRow();
        else triggers.forEach(t => window.addTriggerRow(t.palavra, t.resposta));
      }
    });
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
  const timer = document.getElementById('regra-timer')?.value || 'dinamico';
  const delayMin = timer === '2' ? 1 : timer === '5' ? 4 : 2;
  const delayMax = timer === '2' ? 3 : timer === '5' ? 6 : 5;
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
  chrome.storage.local.set({ ups_config_regras: { simular: simula, simularGravacao: simulaGrav, timer } }, () => toast('Regras de humanização salvas!', 'success'));
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
