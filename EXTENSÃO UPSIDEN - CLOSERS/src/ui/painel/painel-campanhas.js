/**
 * @file painel-campanhas.js
 * @description Renderiza a seção Campanhas (envio em massa) do Painel Upsiden.
 *              Sub-abas: Nova Campanha, Histórico, Listas de Contatos, Configurações Anti-Ban.
 *              Permite importar CSVs de contatos e disparar campanhas de texto.
 * @module Módulo 06: UI — Painel (Campanhas)
 * @date 21/03/2026
 */
// """ STATE & TAB """""""""""""""""""""""""""""""""""""""""""""
if (typeof window.autoSubTab === 'undefined') window.autoSubTab = 'saudacao';
if (typeof window.campSubTab === 'undefined') window.campSubTab = 'nova';

// Listener Global de Progresso da Campanha para o Painel
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.tipo === 'bulk_progresso' || msg.tipo === 'bulk_concluido') {
     const { id, enviados, falhas, status } = msg.dados;
     if (!id) return;
     try {
       await UpsidenDB.from('campanhas').update({
         enviados, falhas, status, updated_at: new Date().toISOString()
       }).eq('id', id).execute();
       if (window.campSubTab === 'historico') window.loadCampanhaHistorico();
     } catch(e) {}
  }
});

// """ CAMPANHAS EM MASSA """"""""""""""""""""""""""""""""""""""
window.renderCampanhas = function(c) {
  const tabs = [
    { id: 'nova', label: '📢 Nova Campanha' },
    { id: 'historico', label: '⏳ Histórico' },
    { id: 'listas', label: '📋 Listas de Contatos' },
    { id: 'config', label: '⚙️ Configurações' }
  ];
  let html = `<div class="sub-tabs" style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px;">`;
  tabs.forEach(t => {
    html += `<button class="btn-ghost ${window.campSubTab === t.id ? 'active' : ''}" data-click="switchCampTab('${t.id}')" style="padding:8px 16px;border-radius:20px;color:var(--text);background:${window.campSubTab === t.id ? 'var(--input-bg)' : 'transparent'}">${t.label}</button>`;
  });
  html += `</div>`;
  
  if (window.campSubTab === 'nova') {
    html += `<div class="auto-section animate-in">
      <h3>📢 Disparar Nova Campanha</h3>
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

      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Adicione mensagens, imagens ou áudios para compor a mensagem da Campanha. Use os delays para separar envios longos.</p>
      
      <div id="camp-steps-list"></div>
      <button class="btn btn-secondary" data-click="addFollowupRow('camp-steps-list')" style="margin-top:12px; margin-bottom:20px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Adicionar Passo na Campanha
      </button>

      <button class="btn btn-primary" data-click="iniciarCampanha()">Iniciar Disparos em Massa</button>
    </div>`;
  } else if (window.campSubTab === 'historico') {
    html += `<div class="auto-section animate-in" id="camp-historico-container">
      <p style="text-align:center;color:var(--text-muted);padding:20px;">Carregando histórico...</p>
    </div>`;
  } else if (window.campSubTab === 'listas') {
    html += `<div class="auto-section animate-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3>📋 Listas de Transmissão</h3>
        <button class="btn btn-primary" data-click="showNovaListaModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Nova Lista</button>
      </div>
      <div id="listas-container"><p style="text-align:center;color:var(--text-muted);padding:20px;">Carregando listas...</p></div>
    </div>`;
  } else if (window.campSubTab === 'config') {
    html += `<div class="auto-section animate-in">
      <h3>⚙️ Configurações de Anti-Ban e Delay</h3>
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
  if (window.campSubTab === 'config') setTimeout(loadAntiBan, 50);
  if (window.campSubTab === 'nova') {
     setTimeout(loadListasSelect, 50);
     setTimeout(() => window.addFollowupRow('camp-steps-list'), 150);
  }
};

window.iniciarCampanha = async function() {
  const nome = document.getElementById('camp-nome').value.trim();
  const id_lista = document.getElementById('camp-lista').value;
  
  const fupRows = document.querySelectorAll('#camp-steps-list .followup-row');
  const followups = [];
  fupRows.forEach(row => {
    const tp = row.querySelector('.fup-tipo').value;
    const ct = row.querySelector('.fup-conteudo').value.trim();
    const dl = Number(row.querySelector('.fup-delay').value) || 0;
    const dur = Number(row.querySelector('.fup-duracao').value) || 2;
    const url = row.querySelector('.fup-url').value;
    const mime = row.querySelector('.fup-mime').value;
    const fNome = row.querySelector('.fup-nome').value;
    const sendAs = row.querySelector('.fup-send-as')?.value || '';

    if (ct || url) {
      followups.push({ tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur, url: url, mime: mime, nome: fNome, sendAs: sendAs });
    }
  });

  if(!nome || !id_lista) { toast('Preencha o nome e selecione a lista', 'error'); return; }
  if(followups.length === 0) { toast('Adicione pelo menos uma mídia ou texto!', 'error'); return; }
  
  if(!confirm('Iniciar disparos em massa? O navegador deve permanecer CUIDADOSAMENTE com a aba do WhatsApp aberta.')) return;
  // Registra no banco as intenções de envio e chama injetor_pagina
  try {
    const antiban = await new Promise(r => chrome.storage.local.get(['ups_antiban_min', 'ups_antiban_max'], r));
    const min = parseInt(antiban.ups_antiban_min || 4);
    const max = parseInt(antiban.ups_antiban_max || 10);
    const resLista = await UpsidenDB.from('listas_contatos').select('contatos').eq('id', id_lista);
    const lista = resLista.data && resLista.data.length ? resLista.data[0] : {contatos:[]};
    if(!lista || !lista.contatos || !lista.contatos.length) { toast('A lista está vazia!', 'error'); return; }

    const campData = { nome, tipo: 'multimidia_sequence', total_contatos: lista.contatos.length, criado_por: userData.userId, config_delay_min: min, config_delay_max: max };
    const res = await UpsidenDB.from('campanhas').insert(campData).select();
    if(res && res.data && res.data.length) {
      toast('Campanha Em Massa Engatilhada!', 'success');
      chrome.runtime.sendMessage({ tipo: 'bulk_send_start', contatos: lista.contatos, stepsParams: followups, campanha_id: res.data[0].id, max, min });
      window.switchCampTab('historico');
    }
  } catch(e) { toast('Erro ao criar campanha: ' + e.message, 'error'); }
};

// Anti-Ban functions are defined in painel-automacoes.js (SSOT: single source)
// salvarConfigAntiBan and loadAntiBan use chrome.storage.local
// No redefinition needed here — they are globals via window.*

// Histórico
window.loadCampanhaHistorico = async function() {
  const c = document.getElementById('camp-historico-container');
  if(!c) return;
  try {
    const resConfig = await UpsidenDB.from('campanhas').select('*').eq('criado_por', userData.userId).order('created_at', {ascending: false});
    const historico = resConfig.data || [];
    if(!historico.length) { c.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;">Nenhuma campanha enviada ainda.</p>'; return; }
    
    let html = '';
    historico.forEach(h => {
      const p = h.total_contatos ? Math.round(((h.enviados || 0) / h.total_contatos) * 100) : 0;
      
      let controls = '';
      if (h.status === 'andamento') {
         controls = `<button class="btn-ghost" style="color:var(--accent);font-size:11px;padding:4px 8px;" onclick="chrome.runtime.sendMessage({tipo:'bulk_pausar'}); UpsidenDB.from('campanhas').update({status:'pausado'}).eq('id', '${h.id}').execute(); setTimeout(loadCampanhaHistorico, 300)">⏸️ Pausar</button>
                     <button class="btn-ghost" style="color:var(--danger);font-size:11px;padding:4px 8px;" onclick="chrome.runtime.sendMessage({tipo:'bulk_cancelar'})">⏹️ Cancelar</button>`;
      } else if (h.status === 'pausado') {
         controls = `<button class="btn-ghost" style="color:var(--success);font-size:11px;padding:4px 8px;" onclick="chrome.runtime.sendMessage({tipo:'bulk_continuar'}); UpsidenDB.from('campanhas').update({status:'andamento'}).eq('id', '${h.id}').execute(); setTimeout(loadCampanhaHistorico, 300)">▶️ Continuar</button>
                     <button class="btn-ghost" style="color:var(--danger);font-size:11px;padding:4px 8px;" onclick="chrome.runtime.sendMessage({tipo:'bulk_cancelar'})">⏹️ Cancelar</button>`;
      }

      html += `<div class="auto-section animate-in" style="margin-bottom:12px;padding:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <h4 style="margin:0;">${h.nome}</h4>
          <span style="font-size:12px;color:var(--text-muted);">${h.status || 'concluida'}</span>
        </div>
        <div style="background:var(--border);height:6px;border-radius:4px;overflow:hidden;margin-bottom:8px;">
          <div style="width:${p}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--success));transition:width .3s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);">
          <span>📢 ${h.tipo} ⬢ ${h.total_contatos} contatos</span>
          <span>✅ ${h.enviados || 0} ⬢ ❌ ${h.falhas || 0}</span>
        </div>
        ${controls ? `<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">${controls}</div>` : ''}
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
    const res = await UpsidenDB.from('listas_contatos').select('*').eq('criado_por', userData.userId).order('created_at', {ascending: false});
    const listas = res.data || [];
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
    const res = await UpsidenDB.from('listas_contatos').select('*').eq('criado_por', userData.userId);
    const listas = res.data || [];
    s.innerHTML = '<option value="">-- Selecione a Lista --</option>' + listas.map(l => `<option value="${l.id}">${l.nome} (${l.contatos ? l.contatos.length : 0} contatos)</option>`).join('');
  } catch(e) { s.innerHTML = '<option value="">Erro</option>'; }
};
window.deleteLista = async function(id) {
  if(!confirm('Deletar lista?')) return;
  try { await UpsidenDB.from('listas_contatos').delete().eq('id', id); window.loadListasTransmissao(); typeof toast === 'function' && toast('Lista excluída!', 'success'); } catch(e){}
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
