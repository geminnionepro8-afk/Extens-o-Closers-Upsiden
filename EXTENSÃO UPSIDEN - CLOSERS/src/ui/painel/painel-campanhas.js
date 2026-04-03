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

// --- GLOBAL LISTENERS (Safe initialization) ---
if (!window.campListenersInitialized) {
  window.campListenersInitialized = true;

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

  document.addEventListener('upsComposerUpdate', (e) => {
     const { containerId } = e.detail;
     if (containerId !== 'camp-steps-list') return; 
     
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
        const text = ta.value.trim().replace(/\n/g, '<br>').replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/_([^_]+)_/g, '<i>$1</i>');
        if(text) {
           html += `<div class="msg-bubble out" style="max-width:85%; background:#005c4b; color:#e9edef; padding:8px 12px; border-radius:8px; margin-bottom:4px; font-size:13px; align-self:flex-end; box-shadow:0 1px 0.5px rgba(0,0,0,0.13); line-height:1.5;">${text}</div>`;
        }
     });
     previewContainer.innerHTML = `<div style="display:flex; flex-direction:column; padding:10px;">${html}</div>`;
     previewContainer.scrollTop = previewContainer.scrollHeight;
  });
}
if (typeof window.campWiz === 'undefined') {
  window.campWiz = { step: 1, template: null, nome: '', lista: '' };
}

window.renderCampanhas = function(c) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'nova', label: 'Novo Disparo' },
    { id: 'historico', label: 'Histórico' },
    { id: 'listas', label: 'Listas' },
    { id: 'config', label: 'Anti-Ban' }
  ];

  let html = `
    <!-- Switcher Profissional (Estilo Red Sun Premium) -->
    <div style="margin-bottom: 32px; display:flex; justify-content:center;">
       <div class="selector-group animate-in">
          ${tabs.map(t => {
            const icons = {
              dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
              nova: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
              historico: '<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
              listas: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
              config: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
            };
            return `
              <button class="selector-item ${window.campSubTab === t.id ? 'active' : ''}" 
                      data-click="switchCampTab('${t.id}')">
                ${icons[t.id] || ''}
                ${t.label}
              </button>
            `;
          }).join('')}
       </div>
    </div>
  `;
  
  if (window.campSubTab === 'dashboard') {
    html += `<div class="animate-in" id="camp-dash-container" style="padding:0; background:transparent; border:none;">
      <div style="display:flex; justify-content:center; padding: 100px;"><div class="spinner"></div></div>
    </div>`;
  } else if (window.campSubTab === 'nova') {
    const s = window.campWiz.step;
    html += `
    <div class="rs-card rs-card-accent animate-in" style="padding:32px;">
      <div class="rs-wizard-steps">
        <div class="rs-wizard-line-bg"></div>
        <div class="rs-wizard-line-fill" style="width:${(s-1)*33.3}%;"></div>

        <div class="rs-w-step ${s >= 1 ? 'active' : ''}">
          <div class="rs-w-circle">${s > 1 ? '✓' : '1'}</div>
          <span class="rs-w-label">Modelo</span>
        </div>
        <div class="rs-w-step ${s >= 2 ? 'active' : ''}">
          <div class="rs-w-circle">${s > 2 ? '✓' : '2'}</div>
          <span class="rs-w-label">Público</span>
        </div>
        <div class="rs-w-step ${s >= 3 ? 'active' : ''}">
          <div class="rs-w-circle">${s > 3 ? '✓' : '3'}</div>
          <span class="rs-w-label">Criação</span>
        </div>
        <div class="rs-w-step ${s >= 4 ? 'active' : ''}">
          <div class="rs-w-circle">${s > 4 ? '✓' : '4'}</div>
          <span class="rs-w-label">Lançar</span>
        </div>
      </div>

      <div class="wizard-body">
        <div id="wiz-step-1" style="display: ${s === 1 ? 'block' : 'none'};">
          <h3 style="margin-bottom:32px; font-size:18px; font-weight:800; text-align:center; color:#fff;">Escolha um Modelo Estratégico</h3>
          <div class="rs-template-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px;">
            
            <div class="rs-template-card ${window.campWiz.template === 'blank' ? 'selected' : ''}" data-click="selectCampTemplate('blank')" 
                 style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:20px 16px; text-align:center; cursor:pointer; transition:all 0.3s;">
              <div class="template-icon-rs" style="width:48px; height:48px; background:rgba(255,255,255,0.03); border-radius:12px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
              </div>
              <h4 style="margin:0 0 4px 0; font-weight:800; color:#fff; font-size:14px;">Campanha em Branco</h4>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.4; margin:0;">Comece do zero e construa seu próprio funil.</p>
            </div>

            <div class="rs-template-card ${window.campWiz.template === 'promo' ? 'selected' : ''}" data-click="selectCampTemplate('promo')"
                 style="background:rgba(255,152,0,0.03); border:1px solid rgba(255,152,0,0.1); border-radius:16px; padding:20px 16px; text-align:center; cursor:pointer; transition:all 0.3s;">
              <div class="template-icon-rs" style="width:48px; height:48px; background:rgba(255,152,0,0.1); border-radius:12px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; color:#ff9800;">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>
              </div>
              <h4 style="margin:0 0 4px 0; font-weight:800; color:#fff; font-size:14px;">Promoção Relâmpago</h4>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.4; margin:0;">Avisos de desconto em massa c/ urgência.</p>
            </div>

            <div class="rs-template-card ${window.campWiz.template === 'welcome' ? 'selected' : ''}" data-click="selectCampTemplate('welcome')"
                 style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:20px 16px; text-align:center; cursor:pointer; transition:all 0.3s;">
              <div class="template-icon-rs" style="width:48px; height:48px; background:rgba(255,255,255,0.03); border-radius:12px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h4 style="margin:0 0 4px 0; font-weight:800; color:#fff; font-size:14px;">Boas-Vindas Clientes</h4>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.4; margin:0;">Sequência humanizada para novos leads.</p>
            </div>

          </div>
        </div>

        <div id="wiz-step-2" style="display: ${s === 2 ? 'block' : 'none'}; max-width: 500px; margin: 0 auto;">
          <h3 style="margin-bottom:16px; text-align:center; font-size:16px; font-weight:700;">Defina o Alvo do Disparo</h3>
          <div class="rs-card" style="background:var(--bg-secondary); padding:20px;">
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label" style="margin-bottom:4px;">Nome de Identificação da Campanha</label>
              <input class="form-input" style="width:100%; padding:10px;" id="camp-nome" placeholder="Ex: Lead Reaquecimento - Março" value="${window.campWiz.nome}">
            </div>
            <div class="form-group">
              <label class="form-label">Selecione a Lista de Contatos</label>
              <select class="form-input" style="width:100%; cursor:pointer;" id="camp-lista">
                <option value="">-- Carregando suas listas... --</option>
              </select>
            </div>
          </div>
        </div>

        <div id="wiz-step-3" style="display: ${s === 3 ? 'flex' : 'none'}; gap:40px; align-items:flex-start;">
          <div style="flex:1;">
            <h3 style="margin-bottom:8px; font-size:18px; font-weight:700;">Arquitete sua Sequência</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:24px;">Misture textos, áudios e imagens para criar um fluxo impossível de ignorar.</p>
            <div id="camp-steps-list"></div>
            <button class="btn btn-secondary" data-click="addFollowupRow('camp-steps-list')" style="margin-top:16px; width:100%; justify-content:center; border:1px dashed var(--border); background:transparent; font-weight:700;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right:8px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Adicionar Novo Bloco de Mensagem
            </button>
          </div>
          <div style="width:300px; position:sticky; top:20px;">
            <div class="rs-phone-mockup">
               <div id="phone-chat-preview" class="rs-phone-screen">
                  <!-- Live Preview -->
               </div>
            </div>
          </div>
        </div>

        <div id="wiz-step-4" style="display: ${s === 4 ? 'block' : 'none'}; text-align:center;">
          <div style="width:64px;height:64px;border-radius:20px;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 24px; box-shadow:0 10px 30px var(--accent-glow);">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style="font-size:20px; font-weight:900; margin-bottom:12px;">Protocolo de Disparo Pronto</h2>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; max-width:600px; margin:40px auto; text-align:left;">
             <label class="rs-card" style="margin:0; cursor:pointer; border:2px solid var(--accent); background:var(--bg-input); padding:24px; position:relative;">
                <input type="radio" name="send_time" value="now" checked style="position:absolute; top:20px; right:20px; accent-color:var(--accent); scale:1.5;">
                <div style="font-weight:800; color:var(--text-primary); margin-bottom:4px; font-size:16px;">Disparar Agora</div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">Inicia o processamento no WhatsApp imediatamente.</div>
             </label>
             <label class="rs-card" style="margin:0; opacity:0.5; cursor:not-allowed; border:1px solid var(--border); background:transparent; padding:24px; position:relative;">
                <div style="font-weight:800; color:var(--text-muted); margin-bottom:4px; font-size:16px;">Agendar Envio</div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">Funcionalidade disponível em breve.</div>
             </label>
          </div>
        </div>
      </div>

      <div class="wizard-footer" style="display:flex; justify-content:space-between; margin-top:32px; padding-top:24px; border-top:1px solid var(--border);">
        <button class="rs-btn rs-btn-ghost ${s === 1 ? 'hidden' : ''}" onclick="window.wizPrevStep()" style="visibility: ${s === 1 ? 'hidden' : 'visible'};">Voltar</button>
        <div>
          ${s < 4 ? `<button class="rs-btn rs-btn-primary" onclick="window.wizNextStep()" style="padding:10px 24px;">Próximo Passo</button>` : ''}
          ${s === 4 ? `<button class="rs-btn rs-btn-primary" onclick="window.iniciarCampanhaWiz()" style="padding:10px 32px; font-weight:900;">INICIAR CAMPANHA</button>` : ''}
        </div>
      </div>
    </div>`;
  } else if (window.campSubTab === 'historico') {
    html += `
    <div class="rs-card rs-card-accent animate-in">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
         <h3 style="font-size:20px; font-weight:800;">Histórico Estratégico</h3>
      </div>
      <div class="rs-table-wrapper">
         <table class="rs-table">
            <thead>
               <tr>
                  <th>Campanha</th>
                  <th>Status</th>
                  <th>Público</th>
                  <th>Desempenho</th>
                  <th>Data</th>
               </tr>
            </thead>
            <tbody id="camp-historico-tbody">
               <tr><td colspan="5" style="text-align:center; padding:100px;"><div class="spinner"></div></td></tr>
            </tbody>
         </table>
      </div>
    </div>`;
  } else if (window.campSubTab === 'listas') {
    html += `
    <div class="rs-card rs-card-accent animate-in" style="padding:32px; border-left-width:4px;">
       <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
          <div>
             <h3 style="font-size:22px; font-weight:800; color:#fff; margin:0;">Segmentação de Listas</h3>
             <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">Organize seus contatos para disparos cirúrgicos.</p>
          </div>
          <button class="rs-btn-save-lead" data-click="showNovaListaModal()">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><path d="M12 5v14M5 12h14"/></svg>
             Nova Lista de Leads
          </button>
       </div>
       
       <div id="listas-container">
          <div style="text-align:center; padding:100px 0;">
             <div class="spinner"></div>
          </div>
       </div>
    </div>`;
  } else if (window.campSubTab === 'config') {
    html += `
    <div class="rs-card rs-card-accent animate-in" style="max-width:700px; margin: 0 auto; padding:40px; border-left-width:4px;">
       <div style="text-align:center; margin-bottom:40px;">
          <div style="width:70px; height:70px; background:var(--accent-dim); color:var(--accent); border-radius:24px; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 15px 30px var(--accent-glow);">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 style="font-size:24px; font-weight:900; color:#fff; margin:0;">Protocolo Anti-Ban</h3>
          <p style="font-size:14px; color:var(--text-muted); margin-top:8px;">Ajuste a velocidade dos disparos para simular o comportamento humano.</p>
       </div>
       
       <div class="rs-card" style="background:rgba(255,255,255,0.02); margin-bottom:32px; padding:32px; border:1px solid rgba(255,255,255,0.05); border-radius:20px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
             <div class="form-group-rs">
                <label class="rs-label">Delay Mínimo <span style="color:var(--text-muted); font-weight:400;">(segundos)</span></label>
                <input class="rs-input" type="number" id="anti-min" value="4" style="font-weight:800; font-size:18px; text-align:center;" min="1">
             </div>
             <div class="form-group-rs">
                <label class="rs-label">Delay Máximo <span style="color:var(--text-muted); font-weight:400;">(segundos)</span></label>
                <input class="rs-input" type="number" id="anti-max" value="10" style="font-weight:800; font-size:18px; text-align:center;" min="1">
             </div>
          </div>
          
          <div style="margin-top:32px; display:flex; gap:16px; align-items:flex-start; background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.1); border-radius:16px; padding:20px;">
             <div style="color:var(--success); flex-shrink:0;">
               <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
             </div>
             <div>
                <strong style="color:var(--success); font-size:13px; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Blindagem Upsiden Ativada</strong>
                <p style="font-size:12px; color:var(--text-muted); line-height:1.6; margin:0;">Utilizamos tecnologia de delay randômico entre cada mensagem. Recomendamos manter o intervalo entre 4s e 12s para disparos acima de 500 contatos.</p>
             </div>
          </div>
       </div>

       <button class="rs-btn-save-lead" data-click="salvarConfigAntiBan()" style="width:100%; justify-content:center; padding:16px; font-size:15px;">
          GARANTIR PROTEÇÃO DO NÚMERO
       </button>
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
    let query = UpsidenDB.from('campanhas').select('*').eq('admin_id', userData.teamAdminId);
    if (userData.role !== 'admin') {
      query = query.eq('criado_por', userData.userId);
    }
    const res = await query.order('created_at', {ascending: false}).execute();
    const campanhas = res || [];
    
    const enviosTotal = campanhas.reduce((acc, c) => acc + (c.enviados || 0), 0);
    const falhasTotal = campanhas.reduce((acc, c) => acc + (c.falhas || 0), 0);
    const ativas = campanhas.filter(c => c.status === 'andamento').length;
    const taxaSucesso = (enviosTotal + falhasTotal) > 0 ? Math.round((enviosTotal / (enviosTotal + falhasTotal)) * 100) : 0;

    let html = `
      <div class="dash-welcome animate-in" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
           <div>
              <p class="text-muted" style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0;">Centro de Comando</p>
              <h1 style="font-size:18px; font-weight:900; letter-spacing:-0.5px; margin:2px 0 0 0;">Gestão de Campanhas</h1>
           </div>
           
           <div class="conn-badge">
              <div style="text-align:right;">
                <div class="conn-label">Motor WPP</div>
                <div class="conn-status" style="display:flex; align-items:center; gap:8px;">
                   <div class="dot-pulse"></div> Ativo
                </div>
              </div>
           </div>
        </div>
      </div>

      <div class="stat-grid animate-in" style="animation-delay:0.1s; margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background-color:var(--accent); color:#fff;">
              <svg viewBox="0 0 24 24" fill="none" class="dash-icon" style="width:18px;height:18px;stroke:currentColor;stroke-width:2;"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
            </div>
          </div>
          <div class="stat-value">${enviosTotal.toLocaleString()}</div>
          <div class="stat-label">Total Entregues</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background-color:var(--accent); color:#fff;">
              <svg viewBox="0 0 24 24" fill="none" class="dash-icon" style="width:18px;height:18px;stroke:currentColor;stroke-width:2;"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          <div class="stat-value">${taxaSucesso}%</div>
          <div class="stat-label">Taxa de Sucesso</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background-color:var(--accent); color:#fff;">
              <svg viewBox="0 0 24 24" fill="none" class="dash-icon" style="width:18px;height:18px;stroke:currentColor;stroke-width:2;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <div class="stat-value">${ativas}</div>
          <div class="stat-label">Em Operação</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <div class="stat-icon" style="background-color:var(--accent); color:#fff;">
              <svg viewBox="0 0 24 24" fill="none" class="dash-icon" style="width:18px;height:18px;stroke:currentColor;stroke-width:2;"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
          </div>
          <div class="stat-value" style="font-size:24px;">PREMIUM</div>
          <div class="stat-label">Modo Ativo</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 300px; gap:20px;" class="animate-in" style="animation-delay:0.2s;">
        <div class="rs-card rs-card-accent" style="padding:20px;">
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:900;">Atividade Recente</h3>
              <button class="rs-tab-btn" data-click="switchCampTab('historico')" style="font-size:11px; color:var(--accent); background:transparent;">Histórico Completo</button>
           </div>
           
           <div class="camp-recent-list">
              ${campanhas.slice(0, 5).map(c => `
                 <div class="rs-card-premium" style="margin-bottom:8px; padding:12px 16px; height:auto; display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="window.displayCampanhaDetails('${c.id}')">
                    <div class="premium-icon-wrap" style="width:34px; height:34px; background:var(--bg-tertiary); color:var(--accent);">
                       <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div style="flex:1;">
                       <div style="font-weight:800; font-size:13px;">${c.nome}</div>
                       <div style="font-size:10px; color:var(--text-muted);">${new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style="text-align:right;">
                       <span class="status-badge ${c.status || 'concluida'}" style="margin-bottom:2px; padding:1px 6px; font-size:8px;">
                          ${c.status === 'andamento' ? 'ATIVO' : (c.status === 'pausado' ? 'PAUSA' : 'OK')}
                       </span>
                       <div style="font-size:12px; font-weight:900;">
                          <span style="color:var(--success)">${c.enviados || 0}</span>
                       </div>
                    </div>
                 </div>
              `).join('')}
              
              ${campanhas.length === 0 ? `
                 <div style="text-align:center; padding:40px 20px;">
                    <h3 style="margin-bottom:8px; font-size:14px;">Sem Campanhas</h3>
                    <button class="rs-btn rs-btn-primary" style="padding:8px 24px; font-size:12px;" data-click="switchCampTab('nova')">Iniciar Inédita</button>
                 </div>
              ` : ''}
           </div>
        </div>

        <div class="actions-col">
           <div class="action-card-premium featured" data-click="switchCampTab('nova')">
              <div class="action-icon">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <div>
                 <div class="action-title">Nova Campanha</div>
                 <div class="action-desc">Lançar disparos</div>
              </div>
           </div>

           <div class="action-card-premium" data-click="switchCampTab('listas')">
              <div class="action-icon">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 4-4H5a4 4 0 0 0-4 4v2"/></svg>
              </div>
              <div>
                 <div class="action-title">Listas</div>
                 <div class="action-desc">Contatos</div>
              </div>
           </div>

           <div class="action-card-premium" data-click="switchCampTab('config')">
              <div class="action-icon">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                 <div class="action-title">Security</div>
                 <div class="action-desc">Anti-ban</div>
              </div>
           </div>

           <div class="rs-card" style="margin-top:20px; background:rgba(255,165,0,0.03); padding:16px; border-radius:12px; border:1px solid rgba(255,165,0,0.1);">
              <div style="font-size:9px; font-weight:900; color:var(--accent); text-transform:uppercase; margin-bottom:8px; letter-spacing:1px;">Dica Premium</div>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.5; margin:0;">
                O uso de áudios gravados na hora (PTT) aumenta em até 40% a conversão.
              </p>
           </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  } catch(e) { 
    console.error("Erro dashboard:", e);
    container.innerHTML = `<div class="rs-card" style="padding:48px; text-align:center;">
      <div style="font-size:40px; margin-bottom:20px;">⚠️</div>
      <h3 style="color:var(--danger); margin-bottom:8px;">Interface de Métricas Indisponível</h3>
      <p class="text-muted" style="font-size:14px;">${e.message}</p>
    </div>`; 
  }
};


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

    const campData = { 
      nome, 
      tipo: 'multimidia_sequence', 
      total_contatos: lista.contatos.length, 
      criado_por: userData.userId, 
      admin_id: userData.teamAdminId,
      config_delay_min: min, 
      config_delay_max: max, 
      status: 'andamento' 
    };
    const res = await UpsidenDB.from('campanhas').insert(campData).select().execute();
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

window.loadCampanhaHistorico = async function() {
  const tbody = document.getElementById('camp-historico-tbody');
  if(!tbody) return;
  try {
    let query = UpsidenDB.from('campanhas').select('*').eq('admin_id', userData.teamAdminId);
    if (userData.role !== 'admin') {
      query = query.eq('criado_por', userData.userId);
    }
    const res = await query.order('created_at', {ascending: false}).execute();
    const campanhas = res || [];

    if(campanhas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:60px; color:var(--text-muted);">Nenhuma campanha registrada no histórico.</td></tr>`;
      return;
    }

      tbody.innerHTML = campanhas.map(c => {
        const p = c.total_contatos ? Math.round(((c.enviados || 0) / c.total_contatos) * 100) : 0;
        return `
          <tr onclick="window.displayCampanhaDetails('${c.id}')" style="cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.02); transition:all 0.2s;">
             <td style="padding:16px 24px;">
                <div style="font-weight:800; color:#fff; font-size:15px;">${c.nome}</div>
                <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-top:4px;">PROT: #${c.id.slice(0,8)}</div>
             </td>
             <td>
                <span class="status-badge ${c.status || 'concluida'}" style="padding:4px 12px; font-weight:800; border-radius:8px;">
                   ${c.status === 'andamento' ? 'EM PROCESSAMENTO' : (c.status === 'pausado' ? 'PAUSADA' : 'FINALIZADA')}
                </span>
             </td>
             <td style="font-weight:700; color:var(--text-secondary);">${c.total_contatos || 0} Contatos</td>
             <td>
                <div style="display:flex; align-items:center; gap:16px; min-width:180px;">
                   <div style="flex:1; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
                      <div style="width:${p}%; height:100%; background:var(--accent-gradient); box-shadow:0 0 10px var(--accent-glow); transition:width 0.8s ease;"></div>
                   </div>
                   <span style="font-size:13px; font-weight:900; color:#fff; width:35px; text-align:right;">${p}%</span>
                </div>
                <div style="font-size:11px; margin-top:6px; font-weight:700; display:flex; gap:10px;">
                   <span style="color:var(--success);">● ${c.enviados || 0} Enviados</span>
                   ${c.falhas > 0 ? `<span style="color:var(--danger);">● ${c.falhas} Erros</span>` : ''}
                </div>
             </td>
             <td style="font-size:12px; color:var(--text-muted); font-weight:600;">
                ${new Date(c.created_at).toLocaleDateString()}
             </td>
          </tr>
        `;
      }).join('');
  } catch(e) { tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Erro: ${e.message}</td></tr>`; }
};

window.openCampanhaDrawer = function(id, rawHLog) {
  const h = JSON.parse(decodeURIComponent(rawHLog));
  let overlay = document.getElementById('camp-drawer-overlay');
  
  if (!overlay) {
     overlay = document.createElement('div');
     overlay.id = 'camp-drawer-overlay';
     overlay.className = 'rs-drawer-overlay';
     document.body.appendChild(overlay);
     
     const drawer = document.createElement('div');
     drawer.id = 'camp-side-drawer';
     drawer.className = 'rs-side-drawer';
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
    let query = UpsidenDB.from('campanhas').select('*').eq('admin_id', userData.teamAdminId);
    if (userData.role !== 'admin') {
      query = query.eq('criado_por', userData.userId);
    }
    const resConfig = await query.order('created_at', {ascending: false}).execute();
    const historico = resConfig || [];
    if(!historico.length) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:80px;"><div style="font-size:32px;margin-bottom:16px;">📂</div>Nenhuma campanha enviada ainda.</td></tr>'; return; }
    
    let html = '';
    historico.forEach(h => {
      const p = h.total_contatos ? Math.round(((h.enviados || 0) / h.total_contatos) * 100) : 0;
      let statusLabel = 'Concluída';
      let statusClass = 'concluida';
      
      if(h.status === 'andamento') { statusLabel = 'Rodando'; statusClass = 'andamento'; }
      if(h.status === 'pausado') { statusLabel = 'Pausada'; statusClass = 'pausado'; }
      if(h.status === 'erro') { statusLabel = 'Erro'; statusClass = 'erro'; }

      const paramEncoded = encodeURIComponent(JSON.stringify(h));

      html += `<tr onclick="window.openCampanhaDrawer('${h.id}', '${paramEncoded}')" style="cursor:pointer;">
         <td style="padding-left:24px;">
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">${h.nome}</div>
            <div style="font-size:11px; color:var(--text-muted); font-family:monospace;">${h.id.split('-')[0]}...</div>
         </td>
         <td>
            <span class="rs-badge ${statusClass}" style="text-transform:uppercase; font-size:10px; letter-spacing:0.5px; font-weight:800; padding:4px 10px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border);">${statusLabel}</span>
         </td>
         <td style="font-weight:600; color:var(--text-secondary);">
            ${h.total_contatos} <small style="opacity:0.6; font-weight:400;">LEADS</small>
         </td>
         <td>
            <div style="display:flex; align-items:center; gap:12px;">
               <div style="flex:1; background:var(--bg-input); height:8px; border-radius:10px; overflow:hidden; border:1px solid var(--border);">
                  <div style="width:${p}%; height:100%; background:linear-gradient(90deg, var(--accent), var(--accent-glow)); box-shadow:0 0 10px var(--accent-glow); transition:width 0.5s ease;"></div>
               </div>
               <div style="font-size:13px; font-weight:800; color:var(--text-primary); min-width:40px; text-align:right;">${p}%</div>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:6px; display:flex; gap:12px; font-weight:600;">
              <span style="color:var(--success);">✓ ${h.enviados || 0}</span>
              <span style="color:var(--danger);">✕ ${h.falhas || 0}</span>
            </div>
         </td>
         <td style="padding-right:24px; font-size:12px; color:var(--text-muted); font-weight:500;">
            ${new Date(h.created_at).toLocaleDateString('pt-BR')}
         </td>
      </tr>`;
    });
    tb.innerHTML = html;
  } catch(e) { tb.innerHTML = '<tr><td colspan="5" style="color:var(--danger); text-align:center; padding:20px;">Erro ao carregar histórico</td></tr>'; }
};

// Listas de Contatos
window.loadListasTransmissao = async function() {
  const tb = document.getElementById('listas-container');
  if(!tb) return;
  try {
    let query = UpsidenDB.from('listas_contatos').select('*').eq('admin_id', userData.teamAdminId);
    if (userData.role !== 'admin') {
      query = query.eq('criado_por', userData.userId);
    }
    const res = await query.order('created_at', {ascending: false}).execute();
    const listas = res || [];
    
    if(!listas.length) { 
      tb.innerHTML = `<div class="empty-state" style="padding:80px 20px;">
        <div style="font-size:48px; margin-bottom:20px; opacity:0.5;">📋</div>
        <h3 style="margin-bottom:8px;">Suas Listas de Ouro</h3>
        <p style="color:var(--text-muted); max-width:400px; margin:0 auto 24px;">Importe seus contatos do Excel ou CSV para iniciar disparos de alta conversão.</p>
        <button class="btn btn-primary" onclick="window.showNovaListaModal()">Criar Minha Primeira Lista</button>
      </div>`; 
      return; 
    }
    
    let html = `<div class="data-table-wrapper" style="margin:24px -24px -24px -24px; border-top:1px solid var(--border);">
      <table class="data-table">
        <thead>
          <tr>
            <th style="padding-left:24px;">Nome da Lista</th>
            <th>Tamanho</th>
            <th>Criação</th>
            <th style="padding-right:24px; text-align:right;">Ações</th>
          </tr>
        </thead>
        <tbody>`;

    listas.forEach(l => {
      const qtd = l.contatos ? l.contatos.length : 0;
      html += `<tr>
         <td style="padding-left:24px;">
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px; display:flex; align-items:center; gap:10px;">
               <div style="width:32px; height:32px; border-radius:8px; background:var(--bg-input); color:var(--text-muted); display:flex; align-items:center; justify-content:center;">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> 
               </div>
               ${l.nome}
            </div>
         </td>
         <td>
            <span style="font-weight:700; color:var(--accent);">${qtd} <small style="font-weight:400; opacity:0.7;">LEADS</small></span>
         </td>
         <td style="font-size:12px; color:var(--text-muted); font-weight:500;">
            ${new Date(l.created_at).toLocaleDateString()}
         </td>
         <td style="text-align:right; padding-right:24px;">
            <button class="btn-ghost" style="color:var(--danger); padding:8px; border-radius:8px;" data-click="deleteLista('${l.id}')" title="Excluir Lista">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
         </td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    tb.innerHTML = html;
  } catch(e) { tb.innerHTML = '<div style="color:var(--danger); text-align:center; padding:40px;">Erro ao carregar listas</div>'; }
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
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay animate-in';
  overlay.innerHTML = `<div class="modal rs-card" style="max-width:600px; width:90%; padding:0; border:1px solid var(--border); overflow:hidden;">
    <div class="modal-header" style="background:var(--bg-secondary); padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
      <h3 style="display:flex;align-items:center;gap:12px; font-size:18px; font-weight:800; margin:0;">
        <div style="width:36px; height:36px; border-radius:10px; background:var(--accent-dim); color:var(--accent); display:flex; align-items:center; justify-content:center;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </div>
        Nova Lista de Contatos
      </h3>
      <button class="btn-ghost" onclick="window.closeModal()" style="color:var(--text-muted);"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    </div>
    <div class="modal-body" style="padding:32px;">
      
      <div class="form-group" style="margin-bottom:24px;">
         <label class="form-label" style="font-weight:700; color:var(--text-primary); margin-bottom:8px; display:block;">Nome Identificador</label>
         <input class="form-input" id="lista-nome" style="width:100%;" placeholder="Ex: Clientes VIP - Lote 01">
      </div>
      
      <div style="background:var(--bg-input); border:1px solid var(--border); border-radius:16px; padding:24px;">
         <label class="form-label" style="display:flex; justify-content:space-between; margin-bottom:12px; font-weight:700;">
            <span>Importação Rápida (Dados Brutos)</span>
         </label>
         <textarea class="form-textarea" id="lista-csv" rows="8" style="font-family:'JetBrains Mono', monospace; font-size:12px; padding:16px; background:var(--bg-card); border-radius:12px;" placeholder="Nome, Telefone
João, 5511999999999"></textarea>
         <div style="display:flex; align-items:flex-start; gap:10px; margin-top:16px; padding:12px; background:var(--accent-dim); border-radius:10px; border:1px solid var(--accent-glow);">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--accent)" style="flex-shrink:0;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span style="font-size:11.5px; color:var(--text-primary); font-weight:500;">Dica: Você pode copiar colunas inteiras do Excel e colar aqui. Nossa IA formata os números.</span>
         </div>
      </div>
      
    </div>
    <div class="modal-footer" style="padding:20px 32px; background:var(--bg-secondary); border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:12px;">
      <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
      <button class="btn btn-primary" style="padding:12px 32px; font-weight:800;" data-click="salvarNovaLista()">Processar e Salvar</button>
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
