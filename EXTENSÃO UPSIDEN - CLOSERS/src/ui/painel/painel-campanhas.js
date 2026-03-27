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
if (typeof window.campSubTab === 'undefined') window.campSubTab = 'dashboard';

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

// Listener Global de Preview Dinâmico do Compositor
document.addEventListener('upsComposerUpdate', (e) => {
   const { containerId } = e.detail;
   if (containerId !== 'camp-steps-list') return; // Only process campaigns list
   
   const previewContainer = document.getElementById('phone-chat-preview');
   if(!previewContainer) return;
   
   const list = document.getElementById('camp-steps-list');
   if(!list) return;
   
   const textareas = list.querySelectorAll('.fup-conteudo');
   if (textareas.length === 0) {
      previewContainer.innerHTML = '<p style="text-align:center; font-size:11px; color:rgba(255,255,255,0.4); margin-top:50%;">Escreva ao lado para visualizar...</p>';
      return;
   }
   
   let html = '';
   textareas.forEach(ta => {
      const text = ta.value.trim().replace(/\\n/g, '<br>').replace(/\\*([^*]+)\\*/g, '<b>$1</b>').replace(/_([^_]+)_/g, '<i>$1</i>');
      if(text) {
         html += `<div class="msg-bubble out">${text}</div>`;
      }
   });
   previewContainer.innerHTML = html;
   previewContainer.scrollTop = previewContainer.scrollHeight;
});

// """ CAMPANHAS EM MASSA """"""""""""""""""""""""""""""""""""""
// ── WIZARD STATE ───────────────────────────────────────────────
if (typeof window.campWiz === 'undefined') {
  window.campWiz = { step: 1, template: null, nome: '', lista: '' };
}

window.renderCampanhas = function(c) {
  const tabs = [
    { id: 'dashboard', label: '📊 Dash' },
    { id: 'nova', label: '🚀 Novo Disparo' },
    { id: 'historico', label: '⏳ Histórico' },
    { id: 'listas', label: '📋 Listas' },
    { id: 'config', label: '⚙️ Anti-Ban' }
  ];
  let html = `<div class="sub-tabs camp-nav-tabs">`;
  tabs.forEach(t => {
    html += `<button class="btn-ghost camp-tab-btn ${window.campSubTab === t.id ? 'active' : ''}" data-click="switchCampTab('${t.id}')">${t.label}</button>`;
  });
  html += `</div>`;
  
  if (window.campSubTab === 'dashboard') {
    html += `<div class="auto-section animate-in camp-dashboard-container" id="camp-dash-container">
      <div style="display:flex; justify-content:center; padding: 40px;"><div class="spinner"></div></div>
    </div>`;
  } else if (window.campSubTab === 'nova') {
    const s = window.campWiz.step;
    html += `
    <div class="wizard-container animate-in">
      <div class="wizard-header">
        <div>
          <h2 style="font-size:22px; font-weight:800; margin-bottom:4px;">Disparar Nova Campanha</h2>
          <p style="color:var(--text-muted); font-size:13.5px;">Assistente guiado passo-a-passo.</p>
        </div>
      </div>
      
      <div class="wizard-steps">
        <div class="w-step ${s >= 1 ? 'active' : ''} ${s > 1 ? 'completed' : ''}">
          <div class="w-step-line"></div>
          <div class="w-step-circle">${s > 1 ? '✓' : '1'}</div>
          <div class="w-step-label">Modelo</div>
        </div>
        <div class="w-step ${s >= 2 ? 'active' : ''} ${s > 2 ? 'completed' : ''}">
          <div class="w-step-line"></div>
          <div class="w-step-circle">${s > 2 ? '✓' : '2'}</div>
          <div class="w-step-label">Destino</div>
        </div>
        <div class="w-step ${s >= 3 ? 'active' : ''} ${s > 3 ? 'completed' : ''}">
          <div class="w-step-line"></div>
          <div class="w-step-circle">${s > 3 ? '✓' : '3'}</div>
          <div class="w-step-label">Conteúdo</div>
        </div>
        <div class="w-step ${s >= 4 ? 'active' : ''} ${s > 4 ? 'completed' : ''}">
          <div class="w-step-line" style="display:none;"></div>
          <div class="w-step-circle">${s > 4 ? '✓' : '4'}</div>
          <div class="w-step-label">Revisão</div>
        </div>
      </div>

      <div class="wizard-body">
        <!-- PASSO 1 -->
        <div id="wiz-step-1" style="display: ${s === 1 ? 'block' : 'none'};">
          <h3 style="margin-bottom:20px;">Escolha um Modelo de Campanha</h3>
          <div class="template-grid">
            <div class="template-card ${window.campWiz.template === 'blank' ? 'selected' : ''}" data-click="selectCampTemplate('blank')">
              <div class="tc-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></div>
              <div class="tc-title">Campanha em Branco</div>
              <div class="tc-desc">Comece do zero e construa seu próprio funil de mensagens.</div>
            </div>
            <div class="template-card ${window.campWiz.template === 'promo' ? 'selected' : ''}" data-click="selectCampTemplate('promo')">
              <div class="tc-badge">Alta Conversão</div>
              <div class="tc-icon">⚡</div>
              <div class="tc-title">Promoção Relâmpago</div>
              <div class="tc-desc">Ideal para avisos de desconto em massa, com escassez.</div>
            </div>
            <div class="template-card ${window.campWiz.template === 'welcome' ? 'selected' : ''}" data-click="selectCampTemplate('welcome')">
              <div class="tc-badge">Retenção</div>
              <div class="tc-icon">👋</div>
              <div class="tc-title">Boas-Vindas Clientes</div>
              <div class="tc-desc">Sequência básica de saudação para listas de novos leads.</div>
            </div>
            <div class="template-card ${window.campWiz.template === 'recover' ? 'selected' : ''}" data-click="selectCampTemplate('recover')">
              <div class="tc-icon">♻️</div>
              <div class="tc-title">Recuperação / Reengajamento</div>
              <div class="tc-desc">Desperte listas frias com abordagens focadas em sondagem.</div>
            </div>
          </div>
        </div>

        <!-- PASSO 2 -->
        <div id="wiz-step-2" style="display: ${s === 2 ? 'block' : 'none'}; max-width: 600px; margin: 0 auto;">
          <h3 style="margin-bottom:24px; text-align:center;">Para quem vamos enviar?</h3>
          <div class="form-group" style="margin-bottom:24px;">
            <label class="form-label" style="font-size:14px; margin-bottom:8px;">Nome Interno da Campanha</label>
            <input class="form-input" style="padding:14px;" id="camp-nome" placeholder="Ex: Black Friday 2026 - Lote 1" value="${window.campWiz.nome}">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:14px; margin-bottom:8px;">Selecione o Segmento/Lista</label>
            <select class="form-input" style="padding:14px; cursor:pointer;" id="camp-lista">
              <option value="">-- Carregando listas... --</option>
            </select>
            <p style="font-size:12px; color:var(--text-muted); margin-top:8px;">Apenas números válidos e com formato DDI serão processados.</p>
          </div>
        </div>

        <!-- PASSO 3 -->
        <div id="wiz-step-3" style="display: ${s === 3 ? 'flex' : 'none'}; gap:32px;">
          <div style="flex:2;">
            <h3 style="margin-bottom:8px;">Conteúdo e Sequência</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:24px;">Adicione mensagens de texto, imagens ou áudios gravados. Defina delays entre eles.</p>
            <div id="camp-steps-list"></div>
            <button class="btn btn-secondary" data-click="addFollowupRow('camp-steps-list')" style="margin-top:12px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Adicionar Passo na Campanha
            </button>
          </div>
          
          <div style="flex:1; display:flex; justify-content:center; position:sticky; top:20px; align-self:flex-start;">
            <div class="phone-preview">
              <div class="phone-notch"></div>
              <div class="phone-header">Preview (Cliente)</div>
              <div class="phone-chat" id="phone-chat-preview">
                <!-- Preview bubbles injetados via JS -->
                <p style="text-align:center; font-size:11px; color:rgba(255,255,255,0.4); margin-top:50%;">Escreva ao lado para visualizar...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- PASSO 4 -->
        <div id="wiz-step-4" style="display: ${s === 4 ? 'block' : 'none'}; text-align:center; padding: 40px 20px;">
          <div style="width:80px;height:80px;border-radius:50%;background:rgba(0,168,132,0.1);color:#00a884;display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 20px;">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2>Tudo Pronto para o Envio!</h2>
          <p style="color:var(--text-muted); font-size:14px; max-width:500px; margin:16px auto 32px;">
            Sua campanha está configurada. Após clicar em iniciar, o WhatsApp web deve permanecer aberto nesta aba para que a extensão faça os disparos usando as configurações do Anti-Ban.
          </p>
          
          <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; max-width:400px; margin:0 auto 32px; text-align:left;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
               <span style="color:var(--text-muted);">Campanha:</span><span id="rev-nome" style="font-weight:600;">-</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-light); padding-bottom:8px;">
               <span style="color:var(--text-muted);">Destino:</span><span id="rev-lista" style="font-weight:600;">-</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
               <span style="color:var(--text-muted);">Itens na Fila:</span><span id="rev-passos" style="font-weight:600;">-</span>
            </div>
          </div>
          
          <div style="margin:20px auto 32px; max-width:400px; display:flex; gap:16px; text-align:left;">
             <label class="radio-card" style="flex:1; border:1px solid var(--accent); padding:16px; border-radius:8px; cursor:pointer; background:var(--bg-input); box-shadow:0 0 10px rgba(255,77,0,0.1);">
                <input type="radio" name="send_time" value="now" checked style="accent-color:var(--accent); margin-right:8px; vertical-align:middle;">
                <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px; display:inline-block;">🚀 Começar Agora</div>
                <div style="font-size:12px; color:var(--text-secondary); margin-top:8px; line-height:1.4;">Inicia o processamento no WhatsApp Web imediatamente.</div>
             </label>
             <label class="radio-card" style="flex:1; border:1px solid var(--border-light); padding:16px; border-radius:8px; cursor:pointer; background:rgba(255,255,255,0.01);" onclick="typeof toast==='function'?toast('Módulo de Agendamento será ativado em breve','info'):''">
                <input type="radio" name="send_time" value="schedule" style="margin-right:8px; vertical-align:middle;" disabled>
                <div style="font-weight:700; color:var(--text-muted); margin-bottom:4px; display:inline-block;">📅 Agendar Data</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:8px; line-height:1.4;">Deixe planejado para um dia e horário específico.</div>
             </label>
          </div>
        </div>

      </div>

      <div class="wizard-footer">
        <button class="btn btn-secondary ${s === 1 ? 'hidden' : ''}" onclick="window.wizPrevStep()" style="visibility: ${s === 1 ? 'hidden' : 'visible'};">
           <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><polyline points="15 18 9 12 15 6"></polyline></svg> Voltar
        </button>
        <div>
          ${s < 4 ? `<button class="btn btn-primary" onclick="window.wizNextStep()">Continuar <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:6px;"><polyline points="9 18 15 12 9 6" transform="rotate(180 12 12)"></polyline></svg></button>` : ''}
          ${s === 4 ? `<button class="btn btn-primary primary-qa" onclick="window.iniciarCampanhaWiz()" style="padding:10px 32px; font-size:15px;">🚀 Iniciar Disparos Agora</button>` : ''}
        </div>
      </div>
    </div>`;
  } else if (window.campSubTab === 'historico') {
    html += `<div class="auto-section animate-in">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
         <div>
            <h3 style="margin-bottom:4px; font-size:18px;">Histórico de Campanhas</h3>
            <p style="color:var(--text-muted); font-size:13px;">Gerencie, pause e veja métricas das suas automações em massa.</p>
         </div>
      </div>
      <div class="adv-table-wrapper">
         <table class="adv-table">
            <thead>
               <tr>
                  <th>Campanha</th>
                  <th>Status</th>
                  <th>Público</th>
                  <th>Progresso (Enviados/Falhas)</th>
                  <th>Data</th>
               </tr>
            </thead>
            <tbody id="camp-historico-tbody">
               <tr><td colspan="5" style="text-align:center; padding:40px;"><div class="spinner"></div></td></tr>
            </tbody>
         </table>
      </div>
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
    html += `<div class="auto-section animate-in" style="max-width:700px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
         <div style="width:40px;height:40px;background:rgba(255,149,0,0.1);color:#ff9500;border-radius:10px;display:flex;align-items:center;justify-content:center;">
           <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
         </div>
         <div>
            <h3 style="margin-bottom:4px; font-size:18px;">Modo Anti-Ban (Escudo de Proteção)</h3>
            <p style="color:var(--text-muted); font-size:13px;">Regule os intervalos de disparo para simular o uso humano e proteger seu nível de confiabilidade.</p>
         </div>
      </div>
      
      <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:24px; margin-bottom:24px;">
         <h4 style="margin-bottom:16px; font-size:14px;">Intervalo Randômico entre Mensagens</h4>
         <div style="display:flex; gap:24px;">
            <div class="form-group" style="flex:1;">
               <label class="form-label">Delay Mínimo (seg)</label>
               <input class="form-input" type="number" id="anti-min" value="4" style="font-size:18px; font-weight:700; background:var(--bg-card);" min="1">
            </div>
            <div class="form-group" style="flex:1;">
               <label class="form-label">Delay Máximo (seg)</label>
               <input class="form-input" type="number" id="anti-max" value="10" style="font-size:18px; font-weight:700; background:var(--bg-card);" min="1">
            </div>
         </div>
         
         <div style="margin-top:16px; display:flex; gap:8px; align-items:flex-start; background:rgba(0,168,132,0.1); border:1px solid #00a884; border-radius:8px; padding:12px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#00a884" style="flex-shrink:0;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <div>
               <strong style="color:#00a884; font-size:13px; display:block;">Recomendação Segura (Verde)</strong>
               <span style="color:var(--text-muted); font-size:12px;">Manter o mínimo em 4s e o máximo em acima de 10s garante uma margem de segurança excelente para envios grandes.</span>
            </div>
         </div>
      </div>

      <button class="btn btn-primary" data-click="salvarConfigAntiBan()" style="width:100%; justify-content:center; padding:14px; font-size:15px;">Salvar Escudo Anti-Ban</button>
    </div>`;
  }
  c.innerHTML = html;

  if (window.campSubTab === 'dashboard') setTimeout(loadCampanhaDashboard, 50);
  if (window.campSubTab === 'listas') setTimeout(loadListasTransmissao, 50);
  if (window.campSubTab === 'historico') setTimeout(loadCampanhaHistorico, 50);
  if (window.campSubTab === 'config') setTimeout(loadAntiBan, 50);
  if (window.campSubTab === 'nova') {
     setTimeout(loadListasSelect, 50);
     setTimeout(() => { if(window.campWiz.step === 3 && document.getElementById('camp-steps-list').children.length === 0) window.addFollowupRow('camp-steps-list'); setInterval(updatePhonePreview, 1000); }, 150);
  }
};

// ── Funções de Controle do Wizard ─────────────────────────────────────────
window.selectCampTemplate = function(id) {
  window.campWiz.template = id;
  // Pré-preencher dependendo do template
  const list = document.getElementById('camp-steps-list');
  if (list && list.children.length === 0) {
    if (id !== 'blank') window.addFollowupRow('camp-steps-list'); // Adiciona um campo de exemplo
  }
  window.renderCampanhas(document.getElementById('main-content'));
};

window.wizNextStep = function() {
  if (window.campWiz.step === 1 && !window.campWiz.template) return toast('Selecione um modelo.', 'warning');
  if (window.campWiz.step === 2) {
    const nome = document.getElementById('camp-nome')?.value.trim();
    const lista = document.getElementById('camp-lista')?.value;
    if(!nome || !lista) return toast('Preencha nome e lista.', 'error');
    window.campWiz.nome = nome;
    window.campWiz.lista = lista;
  }
  if (window.campWiz.step === 3) {
     const fRows = document.querySelectorAll('#camp-steps-list .followup-row');
     let hasVal = false;
     fRows.forEach(row => { if(row.querySelector('.fup-conteudo').value.trim() || row.querySelector('.fup-url').value) hasVal = true; });
     if (!hasVal) return toast('Adicione conteúdo na campanha!', 'error');
  }

  window.campWiz.step++;
  
  // Update view variables for Step 4
  if (window.campWiz.step === 4) {
     setTimeout(() => {
        document.getElementById('rev-nome').textContent = window.campWiz.nome;
        const sel = document.getElementById('camp-lista');
        document.getElementById('rev-lista').textContent = sel ? sel.options[sel.selectedIndex]?.text : '-';
        document.getElementById('rev-passos').textContent = document.querySelectorAll('#camp-steps-list .followup-row').length + ' envio(s)';
     }, 50);
  }

  window.renderCampanhas(document.getElementById('main-content'));
};

window.wizPrevStep = function() {
  if (window.campWiz.step > 1) {
    if (window.campWiz.step === 2) {
       window.campWiz.nome = document.getElementById('camp-nome')?.value.trim();
       window.campWiz.lista = document.getElementById('camp-lista')?.value;
    }
    window.campWiz.step--;
    window.renderCampanhas(document.getElementById('main-content'));
  }
};

window.updatePhonePreview = function() {
  const container = document.getElementById('phone-chat-preview');
  const rows = document.querySelectorAll('#camp-steps-list .followup-row');
  if(!container || rows.length === 0) return;
  
  let html = '';
  let count = 0;
  rows.forEach(row => {
     let txt = row.querySelector('.fup-conteudo').value.trim();
     let url = row.querySelector('.fup-url').value;
     let tipo = row.querySelector('.fup-tipo').value;
     
     if (txt || url) {
       count++;
       let displayTxt = txt.replace(/\n/g, '<br>');
       if(tipo === 'audio') displayTxt = '🎤 [Áudio OGG] ' + (displayTxt ? '<br>'+displayTxt : '');
       if(tipo === 'image' || tipo === 'document') displayTxt = '📎 [Mídia/Doc] ' + (displayTxt ? '<br>'+displayTxt : '');
       
       if(!displayTxt && url) displayTxt = '📎 [Mídia da Galeria]';
       
       html += `<div class="chat-bubble animate-in">${displayTxt}</div>`;
     }
  });

  if (count === 0) {
    html = `<p style="text-align:center; font-size:11px; color:rgba(255,255,255,0.4); margin-top:50%;">O preview aparecerá aqui...</p>`;
  }
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
};

// ── Dashboard de Campanhas (Novo) ──────────────────────────────────────────
window.loadCampanhaDashboard = async function() {
  const container = document.getElementById('camp-dash-container');
  if(!container) return;
  try {
    const res = await UpsidenDB.from('campanhas').select('*').eq('criado_por', userData.userId).order('created_at', {ascending: false});
    const campanhas = res.data || [];
    
    // Métricas
    const enviosTotal = campanhas.reduce((acc, c) => acc + (c.enviados || 0), 0);
    const falhasTotal = campanhas.reduce((acc, c) => acc + (c.falhas || 0), 0);
    const ativas = campanhas.filter(c => c.status === 'andamento').length;
    const taxaSucesso = (enviosTotal + falhasTotal) > 0 ? Math.round((enviosTotal / (enviosTotal + falhasTotal)) * 100) : 0;

    let html = `
      <div class="dash-welcome animate-in">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
           <div style="width: 40px; height: 40px; background: var(--accent-dim); color: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🚀</div>
           <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0;">Campanhas de Envio</h2>
        </div>
        <p style="color: var(--text-muted); font-size: 14.5px; margin-left: 52px;">Gerencie seus disparos em massa com performance e segurança.</p>
      </div>

      <div class="stat-grid animate-in" style="animation-delay: 0.1s;">
        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background: var(--accent-dim); color: var(--accent); border-radius: 10px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </div>
            <div class="rc-badge orange">TOTAL</div>
          </div>
          <div class="stat-value">${enviosTotal.toLocaleString()}</div>
          <div class="stat-label">Mensagens Entregues</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background: var(--success-dim); color: var(--success); border-radius: 10px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="rc-badge green">${taxaSucesso}%</div>
          </div>
          <div class="stat-value">${taxaSucesso}%</div>
          <div class="stat-label">Taxa de Sucesso</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background: rgba(161,161,170,0.1); color: var(--text-muted); border-radius: 10px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="rc-badge yellow">ATIVAS</div>
          </div>
          <div class="stat-value">${ativas}</div>
          <div class="stat-label">Em Andamento</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background: var(--warning-dim); color: var(--warning); border-radius: 10px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div class="stat-value" style="font-size: 20px; color: var(--text-muted); opacity: 0.6;">EM BREVE</div>
          <div class="stat-label">Engajamento</div>
        </div>
      </div>

      <div class="camp-dashboard-layout animate-in" style="animation-delay: 0.2s;">
        <div class="camp-dash-section main-content-col">
          <div class="section-header">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Histórico Recente</h3>
            <button class="see-all" onclick="window.switchCampTab('historico')">Ver tudo</button>
          </div>
          <div class="camp-recent-list">
            ${campanhas.slice(0, 5).map(c => `
              <div class="camp-recent-item" onclick="window.displayCampanhaDetails('${c.id}')">
                <div class="cri-icon ${c.status === 'andamento' ? 'active' : ''}">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="cri-info">
                  <div class="cri-title">${c.nome}</div>
                  <div class="cri-meta">
                    <span class="status-badge ${c.status || 'concluida'}" style="padding: 2px 8px; font-size: 10px; margin-right: 8px;">
                      ${c.status === 'andamento' ? 'Rodando' : (c.status === 'pausado' ? 'Pausado' : 'Finalizada')}
                    </span>
                    • ${new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div class="cri-stats">
                  <span class="cri-success">${(c.enviados || 0).toLocaleString()} <small>OK</small></span>
                  <span class="cri-fail">${(c.falhas || 0).toLocaleString()} <small>Erro</small></span>
                </div>
              </div>
            `).join('')}
            ${campanhas.length === 0 ? `
              <div class="empty-state" style="padding: 40px 0;">
                <div class="empty-icon">📊</div>
                <h3>Sem campanhas ainda</h3>
                <p>Crie sua primeira campanha para ver as métricas aqui.</p>
                <button class="btn btn-primary" style="margin-top: 16px;" onclick="window.switchCampTab('nova')">Começar Agora</button>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="camp-dash-section sidebar-col">
          <h3 style="font-size: 16px; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">Ações Rápidas</h3>
          <div class="quick-actions-col">
            <button class="qa-btn primary-qa" onclick="window.switchCampTab('nova')">
               <div class="qa-icon-wrap" style="background: rgba(255,255,255,0.2); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                 <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
               </div>
               <div style="flex: 1;">
                 <div style="font-size: 14px; font-weight: 700;">Nova Campanha</div>
                 <div style="font-size: 11px; opacity: 0.8; font-weight: 400;">Disparo em massa</div>
               </div>
            </button>
            <button class="qa-btn" onclick="window.switchCampTab('listas')">
               <div class="qa-icon-wrap" style="background: var(--accent-dim); color: var(--accent); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
               </div>
               <div style="flex: 1;">
                 <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">Importar Listas</div>
                 <div style="font-size: 11px; color: var(--text-muted); font-weight: 400;">Excl/CSV Sync</div>
               </div>
            </button>
            <button class="qa-btn" onclick="window.switchCampTab('config')">
               <div class="qa-icon-wrap" style="background: var(--bg-input); color: var(--text-secondary); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               </div>
               <div style="flex: 1;">
                 <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">Configurações Anti-Ban</div>
                 <div style="font-size: 11px; color: var(--text-muted); font-weight: 400;">Delay e Segurança</div>
               </div>
            </button>
          </div>
          
          <div style="margin-top: 32px; padding: 20px; border-radius: 16px; background: linear-gradient(to bottom right, var(--bg-input), transparent); border: 1px solid var(--border-light);">
            <div style="font-size: 12px; font-weight: 700; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Dica Upsiden</div>
            <p style="font-size: 12px; line-height: 1.5; color: var(--text-secondary); margin: 0;">Use intervalos de delay aleatórios acima de 15 segundos para aumentar a vida útil dos seus números.</p>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  } catch(e) {
    console.error("Erro dashboard:", e);
    container.innerHTML = `<div style="padding:40px; text-align:center; color:var(--danger)">
      <div style="font-size:32px; margin-bottom:16px;">⚠️</div>
      <h3 style="margin-bottom:8px;">Erro ao carregar dashboard</h3>
      <p style="font-size:14px; opacity:0.7;">${e.message}</p>
    </div>`;
  }
}


window.iniciarCampanhaWiz = async function() {
  const nome = window.campWiz.nome;
  const id_lista = window.campWiz.lista;
  
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

  if(!nome || !id_lista) { toast('Faltam nome e lista no Wizard', 'error'); return; }
  if(followups.length === 0) { toast('Adicione pelo menos uma mídia ou texto!', 'error'); return; }
  
  toast('Verificando listas e preparando disparos...', 'info');
  
  // Registra no banco as intenções de envio e chama injetor_pagina
  try {
    const antiban = await new Promise(r => chrome.storage.local.get(['ups_antiban_min', 'ups_antiban_max'], r));
    const min = parseInt(antiban.ups_antiban_min || 4);
    const max = parseInt(antiban.ups_antiban_max || 10);
    const resLista = await UpsidenDB.from('listas_contatos').select('contatos').eq('id', id_lista);
    const lista = resLista.data && resLista.data.length ? resLista.data[0] : {contatos:[]};
    if(!lista || !lista.contatos || !lista.contatos.length) { toast('A lista está vazia!', 'error'); return; }

    const campData = { nome, tipo: 'multimidia_sequence', total_contatos: lista.contatos.length, criado_por: userData.userId, config_delay_min: min, config_delay_max: max, status: 'andamento' };
    const res = await UpsidenDB.from('campanhas').insert(campData).select();
    if(res && res.data && res.data.length) {
      toast('Campanha Em Massa Engatilhada! ✅', 'success');
      chrome.runtime.sendMessage({ tipo: 'bulk_send_start', contatos: lista.contatos, stepsParams: followups, campanha_id: res.data[0].id, max, min });
      
      // Reseta state
      window.campWiz = { step: 1, template: null, nome: '', lista: '' };
      window.campSubTab = 'historico';
      window.renderCampanhas(document.getElementById('main-content'));
    }
  } catch(e) { toast('Erro ao criar campanha: ' + e.message, 'error'); }
};

window.iniciarCampanha = window.iniciarCampanhaWiz; // backward compatibility

// Anti-Ban functions are defined in painel-automacoes.js (SSOT: single source)
// salvarConfigAntiBan and loadAntiBan use chrome.storage.local
// No redefinition needed here — they are globals via window.*

window.openCampanhaDrawer = function(id, rawHLog) {
  const h = JSON.parse(decodeURIComponent(rawHLog));
  let overlay = document.getElementById('camp-drawer-overlay');
  
  if (!overlay) {
     overlay = document.createElement('div');
     overlay.id = 'camp-drawer-overlay';
     overlay.className = 'side-drawer-overlay';
     document.body.appendChild(overlay);
     
     const drawer = document.createElement('div');
     drawer.id = 'camp-side-drawer';
     drawer.className = 'side-drawer';
     document.body.appendChild(drawer);
     
     overlay.onclick = () => window.closeCampanhaDrawer();
  }
  
  const drawer = document.getElementById('camp-side-drawer');
  
  const p = h.total_contatos ? Math.round(((h.enviados || 0) / h.total_contatos) * 100) : 0;
  
  let controls = '';
  if (h.status === 'andamento') {
     controls = `<button class="btn btn-secondary" onclick="chrome.runtime.sendMessage({tipo:'bulk_pausar'}); UpsidenDB.from('campanhas').update({status:'pausado'}).eq('id', '${h.id}').execute(); window.closeCampanhaDrawer(); setTimeout(loadCampanhaHistorico, 300)">⏸️ Pausar</button>
                 <button class="btn btn-secondary" style="color:var(--danger); border-color:var(--danger-dim);" onclick="chrome.runtime.sendMessage({tipo:'bulk_cancelar'}); window.closeCampanhaDrawer(); setTimeout(loadCampanhaHistorico, 300)">⏹️ Cancelar</button>`;
  } else if (h.status === 'pausado') {
     controls = `<button class="btn btn-primary" onclick="chrome.runtime.sendMessage({tipo:'bulk_continuar'}); UpsidenDB.from('campanhas').update({status:'andamento'}).eq('id', '${h.id}').execute(); window.closeCampanhaDrawer(); setTimeout(loadCampanhaHistorico, 300)">▶️ Retomar Disparos</button>
                 <button class="btn btn-secondary" style="color:var(--danger); border-color:var(--danger-dim);" onclick="chrome.runtime.sendMessage({tipo:'bulk_cancelar'}); window.closeCampanhaDrawer(); setTimeout(loadCampanhaHistorico, 300)">⏹️ Cancelar</button>`;
  }
  
  let relatorioBtn = `<button class="btn btn-secondary" onclick="toast('Exportação do Histórico em desenvolvimento.', 'info')" style="width:100%; justify-content:center; margin-top:24px;">📥 Baixar Relatório (CSV)</button>`;

  drawer.innerHTML = `
     <div class="drawer-header">
        <div class="drawer-title">${h.nome}</div>
        <button class="drawer-close" onclick="window.closeCampanhaDrawer()">✕</button>
     </div>
     <div class="drawer-body">
        <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
           <span class="status-badge ${h.status || 'concluida'}">${h.status === 'andamento' ? 'Rodando' : (h.status || 'Concluída').toUpperCase()}</span>
           <span style="font-size:12px; color:var(--text-muted);">${new Date(h.created_at).toLocaleString()}</span>
        </div>
        
        <div style="background:var(--border);height:8px;border-radius:4px;overflow:hidden;margin-bottom:12px;">
          <div style="width:${p}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--success));transition:width .3s;"></div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px;">
           <div class="stat-card" style="padding:12px;"><div class="stat-value" style="font-size:20px;">${h.enviados || 0}</div><div class="stat-label">Sucessos</div></div>
           <div class="stat-card" style="padding:12px;"><div class="stat-value" style="font-size:20px; color:var(--danger);">${h.falhas || 0}</div><div class="stat-label">Falhas</div></div>
           <div class="stat-card" style="padding:12px;"><div class="stat-value" style="font-size:20px;">${h.total_contatos}</div><div class="stat-label">Público Total</div></div>
           <div class="stat-card" style="padding:12px;"><div class="stat-value" style="font-size:20px;">${p}%</div><div class="stat-label">Progresso</div></div>
        </div>
        
        ${controls ? `<div style="display:flex; gap:8px; margin-bottom:24px;">${controls}</div>` : ''}
        
        <h4 style="margin-bottom:8px; font-size:14px;">Linha do Tempo da Ação</h4>
        <div class="drawer-timeline">
           <div class="tl-item">
             <div class="tl-dot"></div>
             <div class="tl-content">
               <div class="tl-title">Campanha Criada</div>
               <div class="tl-meta">${new Date(h.created_at).toLocaleString()}</div>
             </div>
           </div>
           ${h.status === 'andamento' ? `
           <div class="tl-item">
             <div class="tl-dot" style="border-color:var(--success); background:var(--success);"></div>
             <div class="tl-content">
               <div class="tl-title" style="color:var(--success);">Em Progresso</div>
               <div class="tl-meta">Disparando no momento. Não feche o WhatsApp.</div>
             </div>
           </div>` : ''}
           ${h.status === 'concluida' || !h.status ? `
           <div class="tl-item">
             <div class="tl-dot" style="border-color:var(--success); background:var(--success);"></div>
             <div class="tl-content">
               <div class="tl-title" style="color:var(--success);">Campanha Finalizada</div>
               <div class="tl-meta">Todos os contatos foram processados.</div>
             </div>
           </div>` : ''}
           ${h.status === 'pausado' ? `
           <div class="tl-item">
             <div class="tl-dot" style="border-color:var(--warning); background:var(--warning);"></div>
             <div class="tl-content">
               <div class="tl-title" style="color:var(--warning);">Campanha Pausada</div>
               <div class="tl-meta">Aguardando retomada manual do usuário.</div>
             </div>
           </div>` : ''}
        </div>
        
        ${relatorioBtn}
     </div>
  `;
  
  overlay.classList.add('open');
  // trigger reflow para animação css
  void drawer.offsetWidth;
  drawer.classList.add('open');
};

window.closeCampanhaDrawer = function() {
   const d = document.getElementById('camp-side-drawer');
   const o = document.getElementById('camp-drawer-overlay');
   if(d) d.classList.remove('open');
   if(o) o.classList.remove('open');
};

// Histórico
window.loadCampanhaHistorico = async function() {
  const tb = document.getElementById('camp-historico-tbody');
  if(!tb) return;
  try {
    const resConfig = await UpsidenDB.from('campanhas').select('*').eq('criado_por', userData.userId).order('created_at', {ascending: false});
    const historico = resConfig.data || [];
    if(!historico.length) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">Nenhuma campanha enviada ainda.</td></tr>'; return; }
    
    let html = '';
    historico.forEach(h => {
      const p = h.total_contatos ? Math.round(((h.enviados || 0) / h.total_contatos) * 100) : 0;
      const statusLabel = h.status === 'andamento' ? 'Rodando' : (h.status || 'Concluída');
      const statusClass = h.status || 'concluida';
      
      const paramEncoded = encodeURIComponent(JSON.stringify(h));

      html += `<tr onclick="window.openCampanhaDrawer('${h.id}', '${paramEncoded}')">
         <td>
            <div style="font-weight:600; color:var(--text-primary); margin-bottom:2px;">${h.nome}</div>
            <div style="font-size:11px; color:var(--text-muted);">ID: ${h.id.split('-')[0]}...</div>
         </td>
         <td>
            <span class="status-badge ${statusClass}">${statusLabel.toUpperCase()}</span>
         </td>
         <td>
            <strong>${h.total_contatos}</strong> contatos
         </td>
         <td>
            <div style="display:flex; align-items:center; gap:8px;">
               <div style="flex:1; background:var(--border);height:6px;border-radius:4px;overflow:hidden;">
                  <div style="width:${p}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--success)); transition:width .3s;"></div>
               </div>
               <div style="font-size:12px; font-weight:600;">${p}%</div>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">✅ ${h.enviados || 0}  |  ❌ ${h.falhas || 0}</div>
         </td>
         <td style="font-size:12px; color:var(--text-muted);">
            ${new Date(h.created_at).toLocaleDateString()}
         </td>
      </tr>`;
    });
    tb.innerHTML = html;
  } catch(e) { tb.innerHTML = '<tr><td colspan="5" style="color:var(--danger); text-align:center; padding:20px;">Erro ao carregar histórico</td></tr>'; }
};

// Listas de Contatos
window.loadListasTransmissao = async function() {
  const tb = document.getElementById('listas-tbody');
  if(!tb) return;
  try {
    const res = await UpsidenDB.from('listas_contatos').select('*').eq('criado_por', userData.userId).order('created_at', {ascending: false});
    const listas = res.data || [];
    if(!listas.length) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:40px;">Você ainda não criou nenhuma lista de contatos.</td></tr>'; return; }
    
    let html = '';
    listas.forEach(l => {
      const qtd = l.contatos ? l.contatos.length : 0;
      let badgeColor = qtd > 500 ? 'var(--warning)' : (qtd > 100 ? 'var(--accent)' : 'var(--text-secondary)');
      let badgeBg = qtd > 500 ? 'var(--warning-dim)' : (qtd > 100 ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)');

      html += `<tr>
         <td>
            <div style="font-weight:600; color:var(--text-primary); margin-bottom:4px; display:flex; align-items:center; gap:8px;">
               <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="color:var(--text-muted);"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> 
               ${l.nome}
            </div>
            <div style="font-size:11px; color:var(--text-muted);">Uso: Envios em Massa & Automações</div>
         </td>
         <td>
            <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; border:1px solid ${badgeColor};">
               ${qtd} Leads
            </span>
         </td>
         <td style="font-size:12px; color:var(--text-muted);">
            ${new Date(l.created_at).toLocaleDateString()}
         </td>
         <td style="text-align:right;">
            <button class="btn-ghost" style="color:var(--danger); padding:6px; border-radius:6px;" data-click="deleteLista('${l.id}')" title="Excluir Lista">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
         </td>
      </tr>`;
    });
    tb.innerHTML = html;
  } catch(e) { tb.innerHTML = '<tr><td colspan="4" style="color:var(--danger);text-align:center;">Erro ao carrregar listas</td></tr>'; }
};

window.loadListasSelect = async function() {
  const s = document.getElementById('camp-lista');
  if(!s) return;
  try {
    const res = await UpsidenDB.from('listas_contatos').select('*').eq('criado_por', userData.userId);
    const listas = res.data || [];
    s.innerHTML = '<option value="">-- Selecione o Segmento/Lista --</option>' + listas.map(l => `<option value="${l.id}">${l.nome} (${l.contatos ? l.contatos.length : 0} leads)</option>`).join('');
  } catch(e) { s.innerHTML = '<option value="">Erro</option>'; }
};

window.deleteLista = async function(id) {
  if(!confirm('Atenção: Essa lista será permanentemente excluída. Deseja prosseguir?')) return;
  try { await UpsidenDB.from('listas_contatos').delete().eq('id', id); window.loadListasTransmissao(); typeof toast === 'function' && toast('Lista excluída!', 'success'); } catch(e){}
};

window.showNovaListaModal = function() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="max-width:600px; width:90%;">
    <div class="modal-header">
      <h3 style="display:flex;align-items:center;gap:8px;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Nova Lista / Importar Dados</h3>
      <button class="btn-ghost" data-click="closeModal()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    </div>
    <div class="modal-body" style="padding:24px;">
      
      <div class="form-group" style="margin-bottom:20px;">
         <label class="form-label">Nome da Lista / Segmento</label>
         <input class="form-input" id="lista-nome" style="padding:14px; font-size:15px;" placeholder="Ex: Clientes Dezembro - Promoção VIP">
      </div>
      
      <div style="background:var(--bg-secondary); border:1px dashed var(--border); border-radius:12px; padding:20px;">
         <label class="form-label" style="display:flex; justify-content:space-between; margin-bottom:12px;">
            <span>Cole os dados (Excel, Planilhas, TXT)</span>
            <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">Separado por vírgula ou tabulação</span>
         </label>
         <textarea class="form-textarea" id="lista-csv" rows="8" style="font-family:monospace; font-size:12px; padding:16px; background:var(--bg-card); resize:vertical;" placeholder="Nome, Telefone (com DDI)
João Silva, 5511999999999
Maria Oliveira, 5521999999998
5531999999997"></textarea>
         <div style="display:flex; align-items:center; gap:8px; margin-top:12px; font-size:11.5px; color:var(--text-muted);">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--accent)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            A inteligência da extensão limpará e formatará os números automaticamente.
         </div>
      </div>
      
    </div>
    <div class="modal-footer" style="padding:16px 24px;">
      <button class="btn btn-secondary" data-click="closeModal()">Cancelar</button>
      <button class="btn btn-primary" style="padding:10px 24px;" data-click="salvarNovaLista()">Processar e Salvar Lista</button>
    </div>
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
