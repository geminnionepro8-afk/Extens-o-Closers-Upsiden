/**
 * @file painel-automacoes.js
 * @description Renderiza a seo Automaes do Painel Upsiden.
 *              Sub-abas: Saudao, Gatilhos, Horrio de Funcionamento, Regras do Rob.
 *              Cada sub-aba tem formulrios para configurar o engine de automao.
 * @module Mdulo 06: UI  Painel (Automaes)
 * @date 21/03/2026
 */

// """ STATE & TAB """""""""""""""""""""""""""""""""""""""""""""
if (typeof window.autoSubTab === 'undefined') window.autoSubTab = 'saudacao';
if (typeof window.campSubTab === 'undefined') window.campSubTab = 'nova';
let currentLista = null;
let campanhaHistorico = [];

// """ CAMPANHAS EM MASSA """"""""""""""""""""""""""""""""""""""
window.renderCampanhas = function(c) {
  const tabs = [
    { id: 'nova', label: 'Megafone Nova Campanha' },
    { id: 'historico', label: 'Relógio Histórico' },
    { id: 'listas', label: 'Listas de Contatos' },
    { id: 'config', label: 'Engrenagem Configurações' }
  ];
  let html = `<div class="sub-tabs" style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px;">`;
  tabs.forEach(t => {
    html += `<button class="btn-ghost ${window.campSubTab === t.id ? 'active' : ''}" data-click="switchCampTab('${t.id}')" style="padding:8px 16px;border-radius:20px;color:var(--text);background:${window.campSubTab === t.id ? 'var(--input-bg)' : 'transparent'}">${t.label.replace('Megafone','x').replace('Relógio','⏳').replace('Engrenagem','a"️')}</button>`;
  });
  html += `</div>`;
  
  if (window.campSubTab === 'nova') {
    html += `<div class="auto-section animate-in">
      <h3>xa Disparar Nova Campanha</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure os detalhes e dispare para centenas de contatos. Use placeholders como {nome}.</p>
      
      <div class="form-group">
        <label class="form-label">Nome da Campanha</label>
        <input class="form-input" id="camp-nome" placeholder="Ex: Black Friday Clientes Antigos">
      </div>
      
      <div class="form-group">
        <label class="form-label">Selecione a Lista de Transmissão</label>
        <select class="form-input" id="camp-lista">
          <option value="">-- Carregando listas... --</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Mensagem (Texto)</label>
        <textarea class="form-textarea" id="camp-texto" rows="4" placeholder="Olá {nome}. Tudo bem?"></textarea>
      </div>

      <button class="btn btn-primary" data-click="iniciarCampanha()">Iniciar Envio</button>
    </div>`;
  } else if (window.campSubTab === 'historico') {
    html += `<div class="auto-section animate-in" id="camp-historico-container">
      <p style="text-align:center;color:var(--text-muted);padding:20px;">Carregando histórico...</p>
    </div>`;
  } else if (window.campSubTab === 'listas') {
    html += `<div class="auto-section animate-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3>x Listas de Transmissão</h3>
        <button class="btn btn-primary" data-click="showNovaListaModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Nova Lista</button>
      </div>
      <div id="listas-container"><p style="text-align:center;color:var(--text-muted);padding:20px;">Carregando listas...</p></div>
    </div>`;
  } else if (window.campSubTab === 'config') {
    html += `<div class="auto-section animate-in">
      <h3>a"️ Configurações de Anti-Ban e Delay</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Defina o intervalo em segundos entre cada disparo para simular comportamento humano e evitar banimentos do WhatsApp.</p>
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        <div class="form-group" style="flex:1;"><label class="form-label">Delay Mínimo (segundos)</label><input class="form-input" type="number" id="anti-min" value="4"></div>
        <div class="form-group" style="flex:1;"><label class="form-label">Delay Máximo (segundos)</label><input class="form-input" type="number" id="anti-max" value="10"></div>
      </div>
      <button class="btn btn-primary" data-click="salvarConfigAntiBan()">Salvar Configurações</button>
    </div>`;
  }
  c.innerHTML = html;

  if (window.campSubTab === 'listas') setTimeout(loadListasTransmissao, 50);
  if (window.campSubTab === 'historico') setTimeout(loadCampanhaHistorico, 50);
  if (window.campSubTab === 'nova') setTimeout(loadListasSelect, 50);
  if (window.campSubTab === 'config') setTimeout(loadAntiBan, 50);
};

window.iniciarCampanha = async function() {
  const nome = document.getElementById('camp-nome').value.trim();
  const id_lista = document.getElementById('camp-lista').value;
  const texto = document.getElementById('camp-texto').value.trim();
  if(!nome || !id_lista || !texto) { toast('Preencha nome, lista e texto', 'error'); return; }
  
  if(!confirm('Iniciar disparos em massa? O navegador deve permanecer com o WhatsApp aberto.')) return;
  // Registra no banco as intenções de envio e chama injetor_pagina
  try {
    const min = parseInt(localStorage.getItem('ups_antiban_min') || 4);
    const max = parseInt(localStorage.getItem('ups_antiban_max') || 10);
    const lista = (await UpsidenDB.from('listas_contatos').select('contatos').eq('id', id_lista).execute())[0];
    if(!lista || !lista.contatos || !lista.contatos.length) { toast('A lista está vazia!', 'error'); return; }

    const campData = { nome, tipo: 'texto', total_contatos: lista.contatos.length, criado_por: userData.userId, config_delay_min: min, config_delay_max: max };
    const res = await UpsidenDB.from('campanhas').insert(campData).execute();
    if(res && res.length) {
      toast('Campanha inicializada!', 'success');
      chrome.runtime.sendMessage({ tipo: 'bulk_start', contatos: lista.contatos, texto, campanha_id: res[0].id, max, min });
      window.switchCampTab('historico');
    }
  } catch(e) { toast('Erro ao criar campanha', 'error'); console.error(e); }
};

window.salvarConfigAntiBan = function() {
  localStorage.setItem('ups_antiban_min', document.getElementById('anti-min').value);
  localStorage.setItem('ups_antiban_max', document.getElementById('anti-max').value);
  toast('Configuração salva!', 'success');
};
window.loadAntiBan = function() {
  const min = document.getElementById('anti-min'); const max = document.getElementById('anti-max');
  if(min) min.value = localStorage.getItem('ups_antiban_min') || 4;
  if(max) max.value = localStorage.getItem('ups_antiban_max') || 10;
};

// Histórico
window.loadCampanhaHistorico = async function() {
  const c = document.getElementById('camp-historico-container');
  if(!c) return;
  try {
    const historico = await UpsidenDB.from('campanhas').select('*').eq('criado_por', userData.userId).order('created_at', false).execute() || [];
    if(!historico.length) { c.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;">Nenhuma campanha enviada ainda.</p>'; return; }
    
    let html = '';
    historico.forEach(h => {
      const p = h.total_contatos ? Math.round(((h.enviados || 0) / h.total_contatos) * 100) : 0;
      html += `<div class="auto-section animate-in" style="margin-bottom:12px;padding:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <h4 style="margin:0;">${h.nome}</h4>
          <span style="font-size:12px;color:var(--text-muted);">${h.status || 'concluida'}</span>
        </div>
        <div style="background:var(--border);height:6px;border-radius:4px;overflow:hidden;margin-bottom:8px;">
          <div style="width:${p}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--success));transition:width .3s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);">
          <span>x ${h.tipo} ⬢ ${h.total_contatos} contatos</span>
          <span>S& ${h.enviados || 0} ⬢ R ${h.falhas || 0}</span>
        </div>
      </div>`;
    });
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<p style="color:var(--danger)">Erro no histórico</p>'; }
};

// Listas de Contatos
window.loadListasTransmissao = async function() {
  const c = document.getElementById('listas-container');
  if(!c) return;
  try {
    const listas = await UpsidenDB.from('listas_contatos').select('*').eq('criado_por', userData.userId).order('created_at', false).execute() || [];
    if(!listas.length) { c.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Sem listas salvas.</p>'; return; }
    let html = '';
    listas.forEach(l => {
      html += `<div class="auto-section animate-in" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <div><h4>${l.nome}</h4><p style="font-size:12px;color:var(--text-muted);">${l.contatos ? l.contatos.length : 0} contatos</p></div>
        <div style="display:flex;gap:6px;">
          <button class="btn-icon" data-click="deleteLista('${l.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </div>
      </div>`;
    });
    c.innerHTML = html;
  } catch(e) { c.innerHTML = ''; }
};
window.loadListasSelect = async function() {
  const s = document.getElementById('camp-lista');
  if(!s) return;
  try {
    const listas = await UpsidenDB.from('listas_contatos').select('*').eq('criado_por', userData.userId).execute() || [];
    s.innerHTML = '<option value="">-- Selecione a Lista --</option>' + listas.map(l => `<option value="${l.id}">${l.nome} (${l.contatos ? l.contatos.length : 0} contatos)</option>`).join('');
  } catch(e) { s.innerHTML = '<option value="">Erro</option>'; }
};
window.deleteLista = async function(id) {
  if(!confirm('Deletar lista?')) return;
  try { await UpsidenDB.from('listas_contatos').eq('id', id).delete().execute(); window.loadListasTransmissao(); toast('Lista excluída!', 'success'); } catch(e){}
};

window.showNovaListaModal = function() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="max-width:500px;">
    <div class="modal-header"><h3>Importar CSV (Nova Lista)</h3><button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Nome da Lista</label><input class="form-input" id="lista-nome" placeholder="Ex: Clientes Dezembro"></div>
      <div class="form-group"><label class="form-label">Cole os telefones e nomes</label><textarea class="form-textarea" id="lista-csv" rows="6" placeholder="Nome, Telefone
Joao, 5511999999999
Maria, 5521999999998"></textarea></div>
      <p style="font-size:11px;color:var(--text-muted);">Formato aceito: colar conteúdo tipo CSV (.txt, Excel 2 colunas separadas por vírgula ou tab).</p>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" data-click="closeModal()">Cancelar</button><button class="btn btn-primary" data-click="salvarNovaLista()">Salvar Lista</button></div>
  </div>`;
  document.body.appendChild(overlay);
};
window.salvarNovaLista = async function() {
  const nome = document.getElementById('lista-nome').value.trim();
  const raw = document.getElementById('lista-csv').value.trim();
  if(!nome) return toast('Insira o nome da lista', 'error');
  if(!raw) return toast('Insira os contatos', 'error');
  
  const linhas = raw.split('\n');
  const contatos = [];
  linhas.forEach(linha => {
    let p = linha.split(','); if(p.length < 2) p = linha.split('\t');
    if(p.length >= 2) {
      let pn = p[0].trim(); let t = p[1].trim().replace(/\D/g, '');
      if(!pn && !t) { t = p[0].trim().replace(/\D/g, ''); pn = 'Contato Sem Nome'; } // se formato invertido ou algo assim
      if(t && t.length >= 10) contatos.push({ nome: pn, telefone: t });
    } else {
      let t = linha.replace(/\D/g, ''); if(t.length>=10) contatos.push({ nome: 'Desconhecido', telefone: t });
    }
  });

  if(!contatos.length) { toast('Nenhum telefone válido encontrado. Verifique a formatação.', 'error'); return; }
  
  try {
    await UpsidenDB.from('listas_contatos').insert({ nome, contatos, criado_por: userData.userId }).execute();
    window.closeModal(); toast('Lista salva com ' + contatos.length + ' contatos!', 'success');
    window.loadListasTransmissao();
  } catch(e) { toast('Erro ao salvar no banco', 'error'); }
};

// """ AUTOMA!"ES """"""""""""""""""""""""""""""""""""""""""""""
window.renderAutomacoes = function(c) {
  const tabs = [
    { id: 'saudacao', label: 'x Saudação' },
    { id: 'gatilhos', label: 'a Gatilhos' },
    { id: 'horario', label: 'x" Horário de F.' },
    { id: 'regras', label: 'a"️ Regras do Robô' }
  ];
  let html = `<div class="sub-tabs" style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px;overflow-x:auto;">`;
  tabs.forEach(t => {
    html += `<button class="btn-ghost ${window.autoSubTab === t.id ? 'active' : ''}" data-click="switchTab('${t.id}')" style="padding:8px 16px;border-radius:20px;color:var(--text);background:${window.autoSubTab === t.id ? 'var(--input-bg)' : 'transparent'};white-space:nowrap;">${t.label}</button>`;
  });
  html += `</div>`;

  if (window.autoSubTab === 'saudacao') {
    html += `<div class="auto-section animate-in">
      <h3>x Resposta Automática (Saudação)</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure uma mensagem automática de boas-vindas para novos contatos.</p>
      <div class="form-group"><label class="form-label">Mensagem de Saudação</label><textarea class="form-textarea" id="auto-saudacao" rows="3" placeholder="Ex: Olá! Obrigado por entrar em contato. Em breve retornaremos."></textarea></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <label class="toggle-switch"><input type="checkbox" id="auto-saudacao-ativo"><span class="toggle-slider"></span></label>
        <span style="font-size:13px;color:var(--text-secondary);">Ativar saudação automática</span>
      </div>
      <button class="btn btn-primary" data-click="salvarSaudacao()">Salvar Saudação</button>
    </div>`;
  } else if (window.autoSubTab === 'gatilhos') {
    html += `<div class="auto-section animate-in">
      <h3>a Gatilhos Inteligentes</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Defina palavras-chave que disparam respostas ou envio de áudios gravados de forma automática.</p>
      <div id="triggers-list"></div>
      <button class="btn btn-secondary" data-click="addTriggerRow()" style="margin-top:12px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Gatilho</button>
      <button class="btn btn-primary" data-click="salvarGatilhos()" style="margin-top:12px;margin-left:8px;">Salvar Gatilhos</button>
    </div>`;
  } else if (window.autoSubTab === 'horario') {
    html += `<div class="auto-section animate-in">
      <h3>x" Horário de Funcionamento</h3>
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
      <h3>a"️ Regras Globais do Robô</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure limites anti-banimento natural (Simulação de Humano).</p>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
         <label class="toggle-switch"><input type="checkbox" id="regra-digitando" checked><span class="toggle-slider"></span></label>
         <span style="font-size:13px;color:var(--text-secondary);">Simular "digitando..." ou "gravando áudio..." antes do robô disparar</span>
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

// Sub-funções de Automação
window.salvarSaudacao = async function() {
  const msg = document.getElementById('auto-saudacao').value.trim();
  const ativo = document.getElementById('auto-saudacao-ativo').checked;
  // Salvar no Supabase
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      saudacao_ativa: ativo,
      saudacao_mensagem: msg,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { console.error('[Painel] Erro Supabase saudacao:', e); }
  // Sync local para o engine
  chrome.storage.local.set({ ups_config_saudacao: { mensagem: msg, ativo } }, () => toast('Saudação salva!', 'success'));
};

window.salvarGatilhos = async function() {
  const rows = document.querySelectorAll('#triggers-list > div');
  const triggers = [];
  rows.forEach(row => {
    const p = row.querySelector('.trigger-palavra')?.value?.trim();
    const r = row.querySelector('.trigger-resposta')?.value?.trim();
    if(p && r) triggers.push({ palavra: p, resposta: r });
  });
  // Salvar no Supabase: deletar antigos e inserir novos
  try {
    await UpsidenDB.from('gatilhos').eq('criado_por', userData.userId).delete().execute();
    for (const t of triggers) {
      await UpsidenDB.from('gatilhos').insert({
        palavra: t.palavra, resposta: t.resposta, condicao: 'contem',
        ativo: true, criado_por: userData.userId, simular_digitacao: true
      }).execute();
    }
  } catch(e) { console.error('[Painel] Erro Supabase gatilhos:', e); }
  // Sync local
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
  // Carregar do Supabase
  try {
    if (window.autoSubTab === 'saudacao') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId).execute();
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        const eMsg = document.getElementById('auto-saudacao');
        const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = data.saudacao_mensagem || '';
        if(eAtivo) eAtivo.checked = data.saudacao_ativa || false;
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
        // timer select
        const timerEl = document.getElementById('regra-timer');
        if (timerEl) {
          const dmin = data.delay_min || 2;
          timerEl.value = dmin <= 2 ? '2' : dmin >= 5 ? '5' : 'dinamico';
        }
      }
    }
  } catch(e) {
    console.error('[Painel] Erro ao carregar config do Supabase:', e);
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
  } catch(e) { console.error('[Painel] Erro Supabase horário:', e); }
  chrome.storage.local.set({ ups_config_horario: { ini, fim, msg, ativo } }, () => toast('Horário de atendimento salvo!', 'success'));
};

window.salvarRegrasGlobais = async function() {
  const simula = document.getElementById('regra-digitando')?.checked || false;
  const timer = document.getElementById('regra-timer')?.value || 'dinamico';
  const delayMin = timer === '2' ? 1 : timer === '5' ? 4 : 2;
  const delayMax = timer === '2' ? 3 : timer === '5' ? 6 : 5;
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      simular_digitacao: simula,
      simular_gravacao: simula,
      delay_min: delayMin,
      delay_max: delayMax,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { console.error('[Painel] Erro Supabase regras:', e); }
  chrome.storage.local.set({ ups_config_regras: { simular: simula, timer } }, () => toast('Regras de humanização salvas!', 'success'));
};

