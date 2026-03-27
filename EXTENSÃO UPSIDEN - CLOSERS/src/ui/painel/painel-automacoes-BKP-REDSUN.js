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
    { id: 'saudacao', label: '<svg style="vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Saudação' },
    { id: 'gatilhos', label: '<svg style="vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Gatilhos' },
    { id: 'horario',  label: '<svg style="vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Horário de F.' },
    { id: 'regras',   label: '<svg style="vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Regras' }
  ];
  let html = `<div class="sub-tabs" style="display:flex;gap:12px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px;overflow-x:auto;">`;
  tabs.forEach(t => {
    html += `<button class="btn-ghost ${window.autoSubTab === t.id ? 'active' : ''}" data-click="switchTab('${t.id}')" style="padding:8px 16px;border-radius:20px;color:var(--text);background:${window.autoSubTab === t.id ? 'var(--input-bg)' : 'transparent'};white-space:nowrap;">${t.label}</button>`;
  });
  html += `</div>
    <style>
      .saud-hero { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
      .saud-hero-content { flex: 1; min-width: 0; }
      .saud-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0; display:flex; align-items:center; gap:8px; letter-spacing: -0.5px; }
      .saud-subtitle { font-size: 13px; font-weight: 500; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.5; }
      .saud-active-msg { background: var(--bg-input); padding: 16px; border-radius: 12px; border: 1px dashed var(--border); font-size: 13px; color: var(--text-primary); max-height: 120px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 20px; line-height: 1.6; }
      .saud-badges { display:flex; gap:8px; margin-bottom: 16px; }
      .s-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: var(--bg-secondary); color: var(--text-secondary); }
      
      .tpl-container { display:flex; gap: 32px; min-height: 400px; }
      .tpl-sidebar { width: 220px; display:flex; flex-direction: column; gap: 8px; }
      .tpl-folder { padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; display:flex; align-items:center; gap:8px; transition: 0.2s; border: 1px solid transparent; }
      .tpl-folder:hover { background: var(--bg-secondary); }
      .tpl-folder.active { background: var(--surface); color: var(--accent); border-color: var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.05); pointer-events:none; }
      
      .tpl-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; align-content: start; }
      .tpl-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: 0.2s; position: relative; display: flex; flex-direction: column; height: 160px; }
      .tpl-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(255, 77, 0, 0.1); }
      .tpl-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 12px; }
      .tpl-card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
      .tpl-card-desc { font-size: 12px; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; line-height: 1.5; }
      .tpl-card-footer { border-top: 1px solid var(--bg-secondary); padding-top: 12px; margin-top: auto; display:flex; justify-content:space-between; align-items:center; font-size: 11px; color: var(--text-muted); font-weight:600; }
      .tpl-apply-btn { opacity: 0; background: var(--accent); color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; transition: 0.2s; }
      .tpl-card:hover .tpl-apply-btn { opacity: 1; }
      
      .mdl-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:9999; display:none; justify-content:center; align-items:center; opacity:0; transition:0.3s; }
      .mdl-box { width: 95%; max-width: 650px; height: 85vh; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; display:flex; flex-direction: column; transform: scale(0.95); transition:0.3s; box-shadow: 0 24px 48px rgba(0,0,0,0.4); }
      .mdl-overlay.open { display:flex; opacity:1; }
      .mdl-overlay.open .mdl-box { transform: scale(1); }
      .m-header { padding: 20px 24px; border-bottom: 1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center; }
      .m-title { font-size: 16px; font-weight: 800; color: var(--text-primary); margin:0; }
      .m-close { background:transparent; border:none; color:var(--text-secondary); cursor:pointer; padding:6px; border-radius: 6px; transition: 0.2s; }
      .m-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
      .m-body { padding: 24px; overflow-y:auto; flex:1; }
      .m-footer { padding: 16px 24px; border-top: 1px solid var(--border-light); display:flex; justify-content:flex-end; gap:12px; background:var(--bg-secondary); border-radius: 0 0 16px 16px; }
      
      /* Timeline Redesign for Modal */
      .tl-node { background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: 10px; padding: 16px; margin-bottom: 12px; position:relative; }
      .tl-node::before { content: ''; position:absolute; left: -20px; top: 24px; width: 12px; height: 2px; background: var(--border-light); }
      .followups-wrap { border-left: 2px solid var(--border-light); margin-left: 8px; padding-left: 20px; padding-bottom: 10px;}
    </style>`;

  if (window.autoSubTab === 'saudacao') {
    html += `
    <div class="auto-section animate-in">
       
       <div class="saud-hero">
           <div class="saud-hero-content">
               <div class="saud-badges">
                  <span class="s-badge" id="s-badge-status" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">● Status Pendente</span>
                  <span class="s-badge" id="s-badge-publico">Público Oculto</span>
                  <span class="s-badge" id="s-badge-passos">Passos Ocultos</span>
               </div>
               <h3 class="saud-title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Mensagem de Saudação Ativa</h3>
               <p class="saud-subtitle">A "Saudação Global" é a primeira resposta enviada instantaneamente quando um lead interage com seu WhatsApp pela primeira vez.</p>
               <div class="saud-active-msg" id="saud-active-preview">Carregando script de saudação do banco de dados...</div>
               <div style="display:flex; gap:16px; align-items:center;">
                  <button class="btn btn-primary" onclick="window.openEditorSaudacao()" style="padding: 10px 24px; border-radius: 8px; font-weight:700;">Configurar Funil de Saudação</button>
                  <label class="toggle-switch" title="Ligar/Desligar"><input type="checkbox" id="auto-saudacao-ativo" onchange="window.saveStatusSaudacaoLocal()"><span class="toggle-slider"></span></label>
               </div>
           </div>
           <div style="width: 120px; height: 120px; background: rgba(255, 77, 0, 0.05); border-radius: 50%; display:flex; align-items:center; justify-content:center; color: var(--accent); font-size: 50px; border: 1px dashed rgba(255, 77, 0, 0.3);">
              🪐
           </div>
       </div>

       <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-top: 16px; border-top: 1px solid var(--border);">
          <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> 
            Meus Templates
          </h3>
          <div style="display:flex; gap:8px;">
             <button class="btn-ghost" onclick="window.importarTemplateModal()" style="font-size:12px; font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Importar</button>
             <button class="btn-ghost" onclick="window.exportarTemplatesLocal()" style="font-size:12px; font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Exportar Dados</button>
          </div>
       </div>

       <div class="tpl-container">
          <div class="tpl-sidebar" id="tpl-folder-list">
             <div class="tpl-folder active" onclick="window.filtrarTemplates('todas')">📁 Toda Biblioteca</div>
             <div class="tpl-folder" onclick="window.filtrarTemplates('Vendas')">🔥 Vendas & Lançamentos</div>
             <div class="tpl-folder" onclick="window.filtrarTemplates('Suporte')">🎧 Máquina de Suporte</div>
             <div class="tpl-folder" onclick="window.filtrarTemplates('Prospeccao')">🎯 Prospecção Fria</div>
          </div>
          <div class="tpl-grid" id="tpl-grid-list">
             <div style="grid-column: 1 / -1; color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px; border: 1px dashed var(--border); border-radius: 12px;">Carregando templates armazenados... se você não tem nenhum, salve sua Saudação atual como Template!</div>
          </div>
       </div>

       <!-- Modal de Edição (Wizard Saudação 2.0) -->
       <div class="mdl-overlay" id="mdl-edicao-saudacao">
          <div class="mdl-box">
             <div class="m-header">
                <div>
                  <h4 class="m-title">Construtor de Saudação Global</h4>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Defina a jornada de comunicação inicial com o cliente.</div>
                </div>
                <button class="m-close" onclick="window.closeEditorSaudacao()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
             </div>
             <div class="m-body">
                <div style="display:flex; gap:16px; margin-bottom:24px; background:var(--bg-secondary); padding:12px 16px; border-radius:10px; border:1px solid var(--border-light);">
                   <label style="font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px; cursor:pointer;">
                     <input type="checkbox" id="auto-privado" style="accent-color:var(--accent);"> Abranger Contatos Naturais
                   </label>
                   <label style="font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px; cursor:pointer;">
                     <input type="checkbox" id="auto-grupo" style="accent-color:var(--accent);"> Abranger Grupos do WPP
                   </label>
                </div>
                
                <h5 style="font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">Gatilho Imediato (Trigger Zero)</h5>
                <textarea class="form-textarea" id="auto-saudacao" rows="4" placeholder="Sua primeira mensagem de boas-vindas. Dica: use {nome} para criar personalização..." style="margin-bottom:8px; font-size:14px; background:var(--bg-input);"></textarea>
                <div style="text-align:right; font-size:11px; color:var(--text-muted); margin-bottom:28px;">Disparo: <strong style="color:var(--accent)">Instantâneo (+ Delay Oculto)</strong></div>
                
                <h5 style="font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Funil de Atraso (Follow-ups Sucessivos)</h5>
                <p style="color:var(--text-muted);font-size:12px;margin-bottom:16px;line-height:1.5;">Adicione blocos abaixo. Eles serão disparados na ordem, acumulando o tempo total de atraso. Pode ser Áudio Gravado na Hora (PTT), Mídias ou Textos.</p>
                <div class="followups-wrap" id="followups-list"></div>
                
                <button class="btn btn-secondary" onclick="window.addFollowupRow('followups-list')" style="margin-left:8px; margin-top:8px; background:transparent; border:1px dashed var(--accent); color:var(--accent); font-weight:700; padding:12px 16px; font-size:13px;">+ Criar Bloco Sucessivo</button>
             </div>
             <div class="m-footer">
                <button class="btn-ghost" onclick="window.salvarComoTemplateModal()" style="color:var(--text-primary); border:1px solid var(--border); padding: 10px 16px; font-size:13px; font-weight:600; border-radius:8px;">📁 Gravar como Novo Template</button>
                <div style="flex:1;"></div>
                <button class="btn-ghost" onclick="window.closeEditorSaudacao()" style="padding: 10px 16px; font-size:13px; font-weight:600; border-radius:8px; color:var(--text-secondary);">Descartar</button>
                <button class="btn btn-primary" onclick="window.salvarSaudacao()" style="padding: 10px 24px; font-size:13px; font-weight:700; border-radius:8px; box-shadow: 0 4px 14px rgba(255,100,0,0.3);">Aplicar Alterações</button>
             </div>
          </div>
       </div>

    </div>`;
  } else if (window.autoSubTab === 'gatilhos') {
    html += `
    <style>
      .gat-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
      .gat-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; display:flex; align-items:center; gap:8px; letter-spacing: -0.5px; }
      .gat-search-bar { display:flex; gap: 12px; margin-bottom: 24px; }
      .gat-search-input { flex:1; background: var(--bg-card); border: 1px solid var(--border); padding: 12px 16px; border-radius: 12px; font-size: 14px; color: var(--text-primary); outline: none; transition: 0.2s; }
      .gat-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255, 77, 0, 0.1); }
      
      .gat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
      
      /* Micro Gatilho Card */
      .g-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; position:relative; display:flex; flex-direction:column; transition:0.2s; cursor:pointer; min-height:140px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
      .g-card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 8px 24px rgba(255, 77, 0, 0.1); }
      .g-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
      .g-keyword-pill { background: rgba(255, 77, 0, 0.1); color: var(--accent); padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 13px; max-width: 180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border: 1px solid rgba(255, 77, 0, 0.2); }
      .g-switch { position:absolute; top:20px; right:20px; z-index:2; }
      
      .g-stats { display:flex; gap:12px; font-size:12px; color:var(--text-secondary); margin-top:auto; font-weight:600; padding-top:12px; border-top:1px dashed var(--bg-secondary); }
      .g-stat-item { display:flex; align-items:center; gap:4px; }
      
      /* Custom Add Card */
      .g-card-add { background: transparent; border: 1px dashed var(--border); border-radius: 14px; display:flex; flex-direction:column; align-items:center; justify-content:center; color: var(--text-secondary); cursor:pointer; transition:0.2s; min-height:140px; }
      .g-card-add:hover { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--text-secondary); }
    </style>
    <div class="auto-section animate-in">
      <div class="gat-header">
         <div>
            <h3 class="gat-title"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Inteligência de Gatilhos</h3>
            <div style="font-size:13px; color:var(--text-secondary); font-weight:500; margin-top:6px;">Automação cirúrgica baseada em palavras-chave que clientes enviam.</div>
         </div>
         <button class="btn btn-primary" onclick="window.openEditorGatilho(null)" style="padding: 10px 20px; font-size:13px; font-weight:700; border-radius:8px;">+ Novo Gatilho</button>
      </div>

      <div class="gat-search-bar">
         <input type="text" class="gat-search-input" id="gat-search" placeholder="Pesquisar por palavra-chave ou regra..." oninput="window.renderGatilhos(this.value)">
         <select class="gat-search-input" id="gat-filter" onchange="window.renderGatilhos(document.getElementById('gat-search').value)" style="flex:0 0 160px; font-weight:600;">
            <option value="todos">Status: Todos</option>
            <option value="ativos">Apenas Ativos</option>
            <option value="pausados">Pausados</option>
         </select>
      </div>

      <div class="gat-grid" id="gatilhos-grid">
         <!-- Cards inseridos via JS -->
         <div class="g-card-add" onclick="window.openEditorGatilho(null)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style="font-size:13px; font-weight:700; margin-top:8px;">Criar Inteligência</span>
         </div>
      </div>
      
      <!-- Gatilhos Modal Overhaul -->
      <div class="mdl-overlay" id="mdl-edicao-gatilho">
          <div class="mdl-box">
             <div class="m-header">
                <div>
                  <h4 class="m-title" id="mdl-g-title">Configurar Gatilho de Resposta</h4>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Regra de gatilho para ativar automações direcionadas.</div>
                </div>
                <button class="m-close" onclick="window.closeEditorGatilho()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
             </div>
             <div class="m-body">
                <input type="hidden" id="g-cur-id" value="">
                
                <div style="display:flex; gap:16px; margin-bottom:20px;">
                   <div style="flex:2;">
                      <label style="display:block; font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Condição do Cliente (Regex/Texto)</label>
                      <input type="text" id="g-palavra" class="form-input" placeholder="Ex: preço, valor, quanto custa" style="width:100%; border-radius:8px; background:var(--bg-input); padding:12px; font-weight:600;">
                   </div>
                   <div style="flex:1;">
                      <label style="display:block; font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase;">Regra de Match</label>
                      <select id="g-condicao" class="form-input" style="width:100%; border-radius:8px; background:var(--bg-input); padding:12px; font-weight:600;">
                         <option value="exata">Mensagem Exata</option>
                         <option value="contem">Contém a palavra</option>
                         <option value="comeca">Começa com</option>
                      </select>
                   </div>
                </div>
                
                <div style="display:flex; gap:16px; margin-bottom:24px; background:rgba(255,255,255,0.02); padding:12px 16px; border-radius:10px; border:1px solid var(--border-light);">
                   <label style="font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px; cursor:pointer;">
                     <input type="checkbox" id="g-privado" checked style="accent-color:var(--accent);"> Disparar em Contatos Privados
                   </label>
                   <label style="font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px; cursor:pointer; margin-left:12px;">
                     <input type="checkbox" id="g-grupo" style="accent-color:var(--accent);"> Disparar em Grupos
                   </label>
                </div>
                
                <h5 style="font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase; border-top:1px dashed var(--border-light); padding-top:20px;">Blocos de Ação (Atraso Acumulativo)</h5>
                <p style="color:var(--text-muted);font-size:12px;margin-bottom:16px;">Os blocos abaixo serão disparados na mesma ordem quando o gatilho for ativado pelo cliente.</p>
                <div class="followups-wrap" id="g-followups-list"></div>
                
                <button class="btn btn-secondary" onclick="window.addFollowupRow('g-followups-list')" style="margin-left:8px; margin-top:8px; background:transparent; border:1px dashed var(--accent); color:var(--accent); font-weight:700; padding:12px 16px; font-size:13px;">+ Criar Bloco de Disparo</button>
             </div>
             <div class="m-footer">
                <button class="btn-ghost" onclick="window.excluirGatilhoModal()" id="g-btn-del" style="color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding: 10px 16px; font-size:13px; font-weight:600; border-radius:8px; display:none;">🗑️ Excluir Gatilho</button>
                <div style="flex:1;"></div>
                <button class="btn-ghost" onclick="window.closeEditorGatilho()" style="padding: 10px 16px; font-size:13px; font-weight:600; border-radius:8px; color:var(--text-secondary);">Ignorar</button>
                <button class="btn btn-primary" onclick="window.salvarGatilhoModal()" style="padding: 10px 24px; font-size:13px; font-weight:700; border-radius:8px; box-shadow: 0 4px 14px rgba(255,100,0,0.3);">Salvar Gatilho Na Base</button>
             </div>
          </div>
       </div>
    </div>`;
  } else if (window.autoSubTab === 'horario') {
    html += `<div class="auto-section animate-in">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3>
          <svg style="vertical-align:middle;margin-right:6px;" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Horário de Funcionamento Avançado
        </h3>
        <div style="display:flex; gap:8px;">
           <select class="form-input" style="height:32px; font-size:12px; padding:0 8px; width:130px;">
             <option>Fuso: GMT-03:00</option>
           </select>
           <button class="btn btn-secondary" style="height:32px; font-size:12px; padding:0 12px;">Modelos...</button>
        </div>
      </div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">Configure múltiplos intervalos para cada dia da semana. Use exceções para bloquear feriados.</p>
      
      <div class="weekly-schedule-container" id="weekly-schedule-container">
         <!-- Injetado via JS -->
      </div>

      <div class="form-group" style="margin-top:20px;">
        <label class="form-label">Mensagem FORA do Expediente</label>
        <textarea class="form-textarea" id="msg-fechado" rows="3" placeholder="No momento nossa equipe não está..."></textarea>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <label class="toggle-switch"><input type="checkbox" id="horario-ativo"><span class="toggle-slider"></span></label>
        <span style="font-size:13px;color:var(--text-secondary);">Habilitar filtro de horário na automação</span>
      </div>
      <button class="btn btn-primary" data-click="salvarHorario()">Salvar Horário e Regras</button>
    </div>`;
  } else if (window.autoSubTab === 'regras') {
    html += `
    <style>
       .rule-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 16px; margin-bottom: 32px; }
       .r-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 24px; display:flex; flex-direction:column; gap: 16px; transition: 0.2s; position:relative; overflow:hidden; }
       .r-card:hover { border-color: var(--accent); box-shadow: 0 4px 20px rgba(255, 77, 0, 0.08); }
       .r-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
       .r-icon-box { width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); display:flex; align-items:center; justify-content:center; color: var(--text-primary); margin-bottom: 8px; }
       .r-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0; }
       .r-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
       .r-card-body { padding-top: 16px; border-top: 1px dashed var(--border-light); margin-top:auto; }
    </style>
    <div class="auto-section animate-in">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom: 1px solid var(--border); padding-bottom:16px;">
         <div>
            <h3 style="margin:0; font-size:18px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
               Regras Globais de Inteligência
            </h3>
            <p style="color:var(--text-secondary);font-size:13px; font-weight:500; margin:6px 0 0 0;">Configure limites anti-banimento natural (Simulação de Humano) que afetam todas as Automações.</p>
         </div>
      </div>
      
      <div class="rule-grid">
         <!-- Regra Digitando -->
         <div class="r-card">
            <div class="r-card-header">
               <div class="r-icon-box"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6V8h12v2z"/></svg></div>
               <label class="toggle-switch" title="Ligar Controle"><input type="checkbox" id="regra-digitando" checked><span class="toggle-slider"></span></label>
            </div>
            <div>
               <h4 class="r-title">Simulador de Digitação Humana</h4>
               <p class="r-desc">Antes do robô disparar uma resposta de texto configurada nos outros painéis, ele exibirá o status <b>"Digitando..."</b> no aparelho do cliente pelo tempo estipulado abaixo.</p>
            </div>
            <div class="r-card-body">
               <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; font-weight:700;">Margem Dinâmica de Espera</div>
               <div style="display:flex; align-items:center; gap:8px;">
                  <input type="number" class="form-input" id="regra-min" value="2" min="1" style="width:70px; text-align:center;">
                  <span style="font-size:13px; color:var(--text-secondary);">até</span>
                  <input type="number" class="form-input" id="regra-max" value="5" min="1" style="width:70px; text-align:center;">
                  <span style="font-size:13px; color:var(--text-secondary);">segundos.</span>
               </div>
            </div>
         </div>
         
         <!-- Regra Gravando -->
         <div class="r-card">
            <div class="r-card-header">
               <div class="r-icon-box"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg></div>
               <label class="toggle-switch" title="Ligar Controle"><input type="checkbox" id="regra-gravando" checked><span class="toggle-slider"></span></label>
            </div>
            <div>
               <h4 class="r-title">Simulador de Gravação de Áudio</h4>
               <p class="r-desc">Ao invés de despachar um arquivo PTT instantaneamente como encaminhado, o bot exibirá <b>"Gravando áudio..."</b> proporcional ao tamanho do áudio disparado.</p>
            </div>
            <div class="r-card-body" style="border:none;">
               <div style="padding: 10px; border-radius:8px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); font-size:12px; color:#10b981; font-weight:600; text-align:center;">
                  ✅ Essencial para converter leads Frios.
               </div>
            </div>
         </div>
      </div>
      
      <div style="text-align:right;">
         <button class="btn btn-primary" data-click="salvarRegrasGlobais()" style="padding: 12px 32px; font-weight:700; border-radius:8px; font-size:14px; box-shadow: 0 4px 14px rgba(255,100,0,0.3);">Aplicar Regras Globais</button>
      </div>
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
  row.className = 'followup-row timeline-node';
  // RedSun drag and drop logic can be added here
  
  // Icon based on type
  let iconHtml = '💬';
  if (tipo === 'audio') iconHtml = '🎵';
  else if (['imagem', 'midia', 'video', 'documento'].includes(tipo)) iconHtml = '🖼️';

  row.innerHTML = `
    <!-- The vertical line connecting nodes -->
    <div class="tl-line"></div>
    <div class="tl-marker" title="Arraste para reordenar (Em breve)"><div class="tl-icon">${iconHtml}</div></div>
    
    <div class="tl-content">
      <div class="tl-header">
         <select class="form-input fup-tipo" style="width:140px; height:28px; font-size:12px; padding:0 8px; background:transparent; border-color:var(--border-light);">
            <option value="texto">Texto</option>
            <option value="audio">Áudio Gravado</option>
            <option value="documento">Mídia / Doc</option>
         </select>
         <div class="tl-actions">
            <button class="btn-icon btn-remove-tl" title="Remover Passo">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
         </div>
      </div>
      
      <div class="tl-body">
         <div class="editor-toolbar" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-light); padding-bottom:8px; margin-bottom:8px;">
            <div style="display:flex; gap:4px;">
               <button class="tb-btn" title="Negrito"><b>B</b></button>
               <button class="tb-btn" title="Itálico"><i>I</i></button>
               <button class="tb-btn" title="Inserir Variável {nome}">{x}</button>
               <button class="tb-btn" title="Emojis">😀</button>
            </div>
            <button class="btn-ghost" style="color:var(--accent); font-size:11px; padding:4px 8px; border:1px solid rgba(255,77,0,0.2); border-radius:4px; transition:0.2s;" title="Gerar Variação com IA (Em breve)" onclick="typeof toast==='function'?toast('Módulo IA Cópia Mágica em desenvolvimento', 'info'):''">✨ IA Cópia Mágica</button>
         </div>
         <textarea class="form-textarea fup-conteudo" rows="3" placeholder="Digite a mensagem incrível aqui. Use {nome} para chamar pelo nome...">${conteudo}</textarea>
         <div class="char-count" style="font-size:10px; color:var(--text-muted); text-align:right; margin-top:4px;">${conteudo.length} caracteres</div>
         
         <div class="tl-media-selector" style="display:none; margin-top:12px;">
            <select class="form-input fup-midia-url" style="width:100%"><option value="">-- Selecione do Seu Cofre --</option></select>
            <select class="form-input fup-send-as" style="width:100%; margin-top:8px; display:none;"></select>
            <input type="hidden" class="fup-url" value="${url}">
            <input type="hidden" class="fup-mime" value="${mime}">
            <input type="hidden" class="fup-nome" value="${nome}">
            <input type="hidden" class="fup-base64" value="${base64}">
         </div>
      </div>
      
      <div class="tl-footer">
         <div class="tl-delay">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style="font-size:12px; color:var(--text-muted);">Espera (s):</span>
            <input type="range" class="form-range fup-delay-range" min="0" max="60" value="${delay_segundos}">
            <input type="number" class="form-input fup-delay" value="${delay_segundos}" min="0" style="width:60px; height:24px; font-size:12px; padding:0 4px; text-align:center;">
         </div>
         <div class="tl-delay" title="Tempo simulando digitando/gravando">
            <span style="font-size:12px; color:var(--text-muted);">Simulação (s):</span>
            <input type="number" class="form-input fup-duracao" value="${duracaoSimulacao}" min="0" style="width:50px; height:24px; font-size:12px; padding:0 4px; text-align:center;">
         </div>
         <div class="tl-conditions">
            <button class="btn-ghost tl-btn-cond"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Condição</button>
         </div>
      </div>
    </div>
  `;

  list.appendChild(row);

  // Bind Element Logic
  const selTipo = row.querySelector('.fup-tipo');
  selTipo.value = ['audio', 'imagem', 'video', 'documento', 'midia'].includes(tipo) ? (tipo==='midia'?'documento':tipo) : 'texto';
  
  const selMidia = row.querySelector('.fup-midia-url');
  const selSendAs = row.querySelector('.fup-send-as');
  const mediaContainer = row.querySelector('.tl-media-selector');
  const hiddenUrl = row.querySelector('.fup-url');
  const hiddenMime = row.querySelector('.fup-mime');
  const hiddenNome = row.querySelector('.fup-nome');
  
  const rngDelay = row.querySelector('.fup-delay-range');
  const inpDelay = row.querySelector('.fup-delay');
  
  // Sync Delay Slider with Number Input
  rngDelay.addEventListener('input', e => inpDelay.value = e.target.value);
  inpDelay.addEventListener('input', e => rngDelay.value = e.target.value);

  row.querySelector('.btn-remove-tl').addEventListener('click', () => {
    row.style.opacity = '0';
    row.style.transform = 'translateY(-10px)';
    setTimeout(() => row.remove(), 200); // smooth remove
  });

  // Media Population Logic
  const populatarMidias = (tipoAtivo) => {
     selMidia.innerHTML = '<option value="">-- Selecione do Seu Cofre --</option>';
     selSendAs.innerHTML = '';
     selSendAs.style.display = 'none';
     
     if (tipoAtivo === 'texto') {
        mediaContainer.style.display = 'none';
        return;
     }
     mediaContainer.style.display = 'block';

     const baseUrl = 'https://imxwpacwtphekrbgwbph.supabase.co/storage/v1/object/public/';
     
     if (tipoAtivo === 'audio') {
        selSendAs.innerHTML = '<option value="ptt">🎙️ Áudio Gravado na Hora (Voz PTT)</option><option value="audio_play">▶️ Música (Player no WhatsApp)</option><option value="document">📄 Enviar como Documento</option>';
        selSendAs.style.display = 'block';
        if (stepObj?.sendAs) selSendAs.value = stepObj.sendAs;

        (window.painelData?.audios || []).forEach(a => {
           const op = document.createElement('option');
           op.value = baseUrl + 'audios/' + a.storage_path;
           op.dataset.nome = a.nome; op.dataset.mime = a.tipo_mime || 'audio/ogg';
           op.textContent = `🎙️ ${a.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     } else if (tipoAtivo === 'documento') {
        selSendAs.innerHTML = '<option value="nativo">🖼️ Visual Nativo (Foto/Vídeo)</option><option value="document">📄 Enviar como Documento</option>';
        selSendAs.style.display = 'block';
        if (stepObj?.sendAs) selSendAs.value = stepObj.sendAs;

        (window.painelData?.midias || []).filter(m => m.tipo && (m.tipo.includes('image') || m.tipo.includes('video'))).forEach(m => {
           const op = document.createElement('option');
           op.value = baseUrl + 'midias/' + m.storage_path;
           op.dataset.nome = m.nome; op.dataset.mime = m.tipo;
           op.textContent = `🖼️ ${m.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
        (window.painelData?.documentos || []).forEach(d => {
           const op = document.createElement('option');
           op.value = baseUrl + 'documentos/' + d.storage_path;
           op.dataset.nome = d.nome; op.dataset.mime = d.tipo;
           op.textContent = `📄 ${d.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     }
  };
  
  selTipo.addEventListener('change', (e) => {
    const val = e.target.value;
    const icon = row.querySelector('.tl-icon');
    if (val === 'audio') icon.textContent = '🎵';
    else if (val === 'documento') icon.textContent = '🖼️';
    else icon.textContent = '💬';

    populatarMidias(val);
  });

  selMidia.addEventListener('change', (e) => {
     hiddenUrl.value = e.target.value;
     if (e.target.options[e.target.selectedIndex]) {
        hiddenMime.value = e.target.options[e.target.selectedIndex].dataset.mime || '';
        hiddenNome.value = e.target.options[e.target.selectedIndex].dataset.nome || '';
     }
  });

  populatarMidias(selTipo.value);
  
  // Toolbar Buttons Logic (Mock insert for now)
  const tbBtns = row.querySelectorAll('.tb-btn');
  const txtArea = row.querySelector('.fup-conteudo');
  const charCount = row.querySelector('.char-count');
  
  tbBtns[0].onclick = () => { txtArea.value += ' *negrito* '; txtArea.focus(); txtArea.dispatchEvent(new Event('input')); };
  tbBtns[1].onclick = () => { txtArea.value += ' _itálico_ '; txtArea.focus(); txtArea.dispatchEvent(new Event('input')); };
  tbBtns[2].onclick = () => { txtArea.value += ' {nome} '; txtArea.focus(); txtArea.dispatchEvent(new Event('input')); };
  tbBtns[3].onclick = () => { txtArea.value += ' 😀 '; txtArea.focus(); txtArea.dispatchEvent(new Event('input')); };

  txtArea.addEventListener('input', (e) => {
     if(charCount) charCount.innerText = e.target.value.length + ' caracteres / ' + e.target.value.split(/\\s+/).filter(x=>x).length + ' palavras';
     document.dispatchEvent(new CustomEvent('upsComposerUpdate', { detail: { containerId } }));
  });

  // Condition Builder Mock
  row.querySelector('.tl-btn-cond').onclick = () => {
    typeof toast === 'function' ? toast('Construtor Visual de Condições aberto (Interface Placeholder)', 'info') : alert('Builder Aberto');
  };
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
    typeof toast==='function' && toast('Saudação Global Ativada com ' + followups.length + ' blocos no funil!', 'success');
    if (typeof window.updateSaudacaoHeroUI === 'function') {
       window.updateSaudacaoHeroUI(msg, ativo, p, g, followups.length);
    }
    if (typeof window.closeEditorSaudacao === 'function') window.closeEditorSaudacao();
  });
};

/* ═════ GATILHOS SYSTEM (Red Sun Grid + Modal) ═════ */
window.cachedGatilhos = [];

window.renderGatilhosParams = function() {
   const val = document.getElementById('gat-search')?.value || '';
   window.renderGatilhos(val);
};

window.renderGatilhos = function(searchQuery = '') {
   const grid = document.getElementById('gatilhos-grid');
   if(!grid) return;
   
   const addCardHTML = `<div class="g-card-add" onclick="window.openEditorGatilho(null)"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span style="font-size:13px; font-weight:700; margin-top:8px;">Criar Inteligência</span></div>`;
   
   const filter = document.getElementById('gat-filter')?.value || 'todos';
   let list = window.cachedGatilhos;
   
   if (filter === 'ativos') list = list.filter(g => g.ativo !== false);
   if (filter === 'pausados') list = list.filter(g => g.ativo === false);
   if (searchQuery) list = list.filter(g => g.palavra.toLowerCase().includes(searchQuery.toLowerCase()));
   
   grid.innerHTML = '';
   list.forEach((g) => {
      const isAtivo = g.ativo !== false;
      const fCount = g.followupSteps ? g.followupSteps.length : 0;
      const card = document.createElement('div');
      card.className = 'g-card';
      card.onclick = (e) => {
         if (e.target.tagName.toLowerCase() === 'input' || e.target.classList.contains('toggle-slider')) return;
         window.openEditorGatilho(g.id);
      };
      card.innerHTML = `
         <div class="g-card-top">
            <div class="g-keyword-pill" title="${g.palavra}">${g.condicao === 'exata' ? '=' : (g.condicao === 'comeca' ? '^' : '*')} ${g.palavra}</div>
            <label class="toggle-switch g-switch" onclick="event.stopPropagation()"><input type="checkbox" onchange="window.toggleGatilhoStatus('${g.id}', this.checked)" ${isAtivo ? 'checked' : ''}><span class="toggle-slider"></span></label>
         </div>
         <div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; line-height:1.4; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${fCount === 0 ? '"' + (g.resposta || 'Ação Sem Resposta Imediata') + '"' : 'Funil de ' + (fCount + (g.resposta ? 1 : 0)) + ' passos.'}
         </div>
         <div class="g-stats">
            <div class="g-stat-item"><span style="color:${isAtivo ? 'var(--accent)' : 'var(--text-muted)'}">●</span> ${isAtivo ? 'Ativo' : 'Pausado'}</div>
            <div class="g-stat-item" style="margin-left:auto;">${g.apenasPrivado !== false ? '👤' : ''}${g.apenasGrupo ? '👥' : ''}</div>
         </div>
      `;
      grid.appendChild(card);
   });
   grid.insertAdjacentHTML('beforeend', addCardHTML);
};

window.openEditorGatilho = function(id) {
   const modal = document.getElementById('mdl-edicao-gatilho');
   const title = document.getElementById('mdl-g-title');
   const btnDel = document.getElementById('g-btn-del');
   const fupList = document.getElementById('g-followups-list');
   if(!fupList) return;
   
   fupList.innerHTML = ''; 
   
   if (!id) {
      title.textContent = "Criar Nova Inteligência (Gatilho)";
      document.getElementById('g-cur-id').value = '';
      document.getElementById('g-palavra').value = '';
      document.getElementById('g-condicao').value = 'exata';
      document.getElementById('g-privado').checked = true;
      document.getElementById('g-grupo').checked = false;
      document.getElementById('g-followups-list').innerHTML = '<div style="font-size:12px; color:var(--text-muted); font-style:italic;">Nenhum atraso definido.</div>';
      btnDel.style.display = 'none';
   } else {
      title.textContent = "Editar Inteligência de Automação";
      const g = window.cachedGatilhos.find(x => x.id === id);
      if(!g) return;
      document.getElementById('g-cur-id').value = g.id;
      document.getElementById('g-palavra').value = g.palavra;
      document.getElementById('g-condicao').value = g.condicao || 'exata';
      document.getElementById('g-privado').checked = g.apenasPrivado !== false;
      document.getElementById('g-grupo').checked = g.apenasGrupo || false;
      btnDel.style.display = 'block';
      
      if(g.followupSteps && Array.isArray(g.followupSteps) && g.followupSteps.length > 0) {
         g.followupSteps.forEach(p => window.addFollowupRow('g-followups-list', p));
      } else if (g.resposta) {
         window.addFollowupRow('g-followups-list', {tipo: 'texto', conteudo: g.resposta, delay_segundos: 0, duracaoSimulacao: 2});
      }
   }
   
   modal.classList.add('open');
};

window.closeEditorGatilho = function() {
   document.getElementById('mdl-edicao-gatilho').classList.remove('open');
};

window.salvarGatilhoModal = function() {
   const idVal = document.getElementById('g-cur-id').value;
   const id = idVal || 'g_' + Date.now() + Math.random().toString(36).substr(2, 5);
   const palavra = document.getElementById('g-palavra').value.trim();
   const condicao = document.getElementById('g-condicao').value;
   const p = document.getElementById('g-privado').checked;
   const g = document.getElementById('g-grupo').checked;
   
   if (!palavra) return typeof toast==='function' ? toast('A Palavra-chave é obrigatória!', 'warning') : alert('Palavra requerida');
   
   const fupRows = document.querySelectorAll('#g-followups-list .followup-row');
   const followups = [];
   fupRows.forEach(row => {
     const tp = row.querySelector('.fup-tipo').value;
     const ct = row.querySelector('.fup-conteudo').value.trim();
     const dl = Number(row.querySelector('.fup-delay').value) || 0;
     const dur = Number(row.querySelector('.fup-duracao').value) || 2;
     const url = row.querySelector('.fup-url').value;
     const mime = row.querySelector('.fup-mime').value;
     const nomeA = row.querySelector('.fup-nome').value;
     if (ct || url) followups.push({ tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur, url: url, mime: mime, nome: nomeA });
   });
   
   const novoGato = {
      id, palavra, condicao, apenasPrivado: p, apenasGrupo: g, ativo: true,
      followupSteps: followups, resposta: followups.length > 0 && followups[0].tipo === 'texto' ? followups[0].conteudo : ''
   };
   
   const idx = window.cachedGatilhos.findIndex(x => x.id === id);
   if (idx >= 0) window.cachedGatilhos[idx] = novoGato;
   else window.cachedGatilhos.push(novoGato);
   
   window.salvarTodosGatilhosStore(true);
   window.closeEditorGatilho();
};

window.excluirGatilhoModal = function() {
   const id = document.getElementById('g-cur-id').value;
   if(!id) return;
   if(!confirm('Deseja realmente apagar esta automação permanentemente?')) return;
   window.cachedGatilhos = window.cachedGatilhos.filter(x => x.id !== id);
   window.salvarTodosGatilhosStore(false);
   window.closeEditorGatilho();
};

window.toggleGatilhoStatus = function(id, status) {
   const gto = window.cachedGatilhos.find(x => x.id === id);
   if(gto) {
      gto.ativo = status;
      window.salvarTodosGatilhosStore(false);
   }
};

window.salvarTodosGatilhosStore = async function(showToast = true) {
   chrome.storage.local.set({ ups_config_triggers: window.cachedGatilhos }, () => {
      if(showToast && typeof toast==='function') toast('Inteligência salva na Base de Conhecimento!', 'success');
      if (document.getElementById('gatilhos-grid')) {
         window.renderGatilhos(document.getElementById('gat-search')?.value || '');
      }
   });
   
   try {
      if(userData && userData.userId) {
         await UpsidenDB.from('config_automacao').upsert({
            closer_id: userData.userId,
            gatilhos: JSON.stringify(window.cachedGatilhos),
            updated_at: new Date().toISOString()
         }).execute();
      }
   } catch(e) {}
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
        if (typeof window.updateSaudacaoHeroUI === 'function') {
           window.updateSaudacaoHeroUI(res.ups_config_saudacao.mensagem, res.ups_config_saudacao.ativo, res.ups_config_saudacao.apenasPrivado, res.ups_config_saudacao.apenasGrupo, (res.ups_config_saudacao.followupSteps || []).length);
        }
      }
      if(window.autoSubTab === 'gatilhos') {
        window.cachedGatilhos = res.ups_config_triggers || [];
        // Compatibilidade com legacy (atribuir IDs p/ os sem ID)
        window.cachedGatilhos.forEach((g, idx) => { if(!g.id) g.id = 'g_legacy_' + idx; });
        window.renderGatilhos();
      }
      if (window.autoSubTab === 'horario') {
        const configH = res.ups_config_horario || {};
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = configH.msg || '';
        if(document.getElementById('horario-ativo')) document.getElementById('horario-ativo').checked = configH.ativo || false;
        
        if (window.initWeeklyCalendar) {
           window.initWeeklyCalendar(configH.matriz || null);
        }
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
      if(typeof window.carregarTemplatesSaudacao === 'function') window.carregarTemplatesSaudacao();
      
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        const eMsg = document.getElementById('auto-saudacao');
        const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = data.saudacao_mensagem || '';
        if(eAtivo) eAtivo.checked = data.saudacao_ativa || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = data.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = data.apenas_grupo || false;
        
        let stepsLoadedCount = 0;
        const list = document.getElementById('followups-list');
        if (list) list.innerHTML = '';
        if (data.followup_steps) {
           try {
             const passos = JSON.parse(data.followup_steps);
             if (Array.isArray(passos)) {
                passos.forEach(p => window.addFollowupRow('followups-list', p));
                stepsLoadedCount = passos.length;
             }
           } catch(e) {}
        }
        if (typeof window.updateSaudacaoHeroUI === 'function') {
           window.updateSaudacaoHeroUI(data.saudacao_mensagem, data.saudacao_ativa, data.apenas_privado, data.apenas_grupo, stepsLoadedCount);
        }
      } else {
        fallbackLocal();
      }
    }
    if (window.autoSubTab === 'gatilhos') {
       chrome.storage.local.get(['ups_config_triggers'], res => {
          if (res.ups_config_triggers && res.ups_config_triggers.length > 0) {
             window.cachedGatilhos = res.ups_config_triggers;
             window.cachedGatilhos.forEach((g, i) => { if(!g.id) g.id = 'g_l_' + i; });
             window.renderGatilhos();
          } else {
             fallbackLocal();
          }
       });
    }
    if (window.autoSubTab === 'horario') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = data.msg_fora_horario || '';
        if(document.getElementById('horario-ativo')) document.getElementById('horario-ativo').checked = data.usar_horario || false;
      }
      fallbackLocal(); // Always merge with local for the complex matrix matrix
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
  const msg = document.getElementById('msg-fechado')?.value?.trim() || '';
  const ativo = document.getElementById('horario-ativo')?.checked || false;
  const matrix = window.currentWeeklyMatrix || [];

  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      usar_horario: ativo,
      msg_fora_horario: msg,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_horario: { matriz: matrix, msg, ativo } }, () => toast('Horário de atendimento avançado salvo!', 'success'));
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

window.initWeeklyCalendar = function(existingData = null) {
  const container = document.getElementById('weekly-schedule-container');
  if (!container) return;
  
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  let matrix = existingData || dias.map(d => ({
    dia: d,
    ativo: d !== 'Dom' && d !== 'Sab',
    intervalos: (d !== 'Dom' && d !== 'Sab') ? [{ inicio: '08:00', fim: '18:00' }] : []
  }));

  const render = () => {
    container.innerHTML = '';
    matrix.forEach((diaData, idx) => {
      const row = document.createElement('div');
      row.className = 'ws-day-row';
      row.style.cssText = 'display:flex; align-items:flex-start; gap:16px; padding:12px; border:1px solid var(--border-light); background:var(--bg-card); margin-bottom:8px; border-radius:8px; transition:var(--transition);';
      if(diaData.ativo) row.style.borderColor = 'rgba(255, 77, 0, 0.3)';
      
      const control = document.createElement('div');
      control.style.cssText = 'width:80px; display:flex; flex-direction:column; gap:8px;';
      
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'toggle-switch';
      toggleLabel.innerHTML = `<input type="checkbox" ${diaData.ativo ? 'checked' : ''}><span class="toggle-slider"></span>`;
      toggleLabel.querySelector('input').onchange = (e) => {
         diaData.ativo = e.target.checked;
         render();
      };
      
      const title = document.createElement('div');
      title.style.cssText = `font-weight:600; font-size:14px; color:${diaData.ativo ? 'var(--text-primary)' : 'var(--text-muted)'}`;
      title.innerText = diaData.dia;
      
      control.append(toggleLabel, title);
      
      const intContainer = document.createElement('div');
      intContainer.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:8px;';
      
      if (diaData.ativo) {
         diaData.intervalos.forEach((int, intIdx) => {
           const intRow = document.createElement('div');
           intRow.style.cssText = 'display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:6px; border:1px solid var(--border-light);';
           
           intRow.innerHTML = `
             <input type="time" class="form-input ws-time-ini" value="${int.inicio}" style="width:110px; text-align:center;">
             <span style="color:var(--text-muted); font-size:12px;">até</span>
             <input type="time" class="form-input ws-time-fim" value="${int.fim}" style="width:110px; text-align:center;">
             <button class="btn-icon ws-remove-int" title="Remover Intervalo" style="margin-left:auto;"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
           `;
           
           intRow.querySelector('.ws-time-ini').onchange = (e) => int.inicio = e.target.value;
           intRow.querySelector('.ws-time-fim').onchange = (e) => int.fim = e.target.value;
           intRow.querySelector('.ws-remove-int').onclick = () => {
              diaData.intervalos.splice(intIdx, 1);
              render();
           };
           
           intContainer.appendChild(intRow);
         });
         
         const btnAdd = document.createElement('button');
         btnAdd.className = 'btn-ghost';
         btnAdd.style.cssText = 'align-self:flex-start; font-size:12px; padding:6px 10px;';
         btnAdd.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:6px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Adicionar Horário';
         btnAdd.onclick = () => {
           diaData.intervalos.push({ inicio: '12:00', fim: '13:00' });
           render();
         };
         intContainer.appendChild(btnAdd);
      } else {
         const closedObj = document.createElement('div');
         closedObj.style.cssText = 'color:var(--text-muted); font-size:13px; font-style:italic; padding:12px 0; display:flex; align-items:center; gap:8px;';
         closedObj.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Fechado neste dia';
         intContainer.appendChild(closedObj);
      }
      
      row.append(control, intContainer);
      container.appendChild(row);
    });
  };
  
  render();
  window.currentWeeklyMatrix = matrix;
};
window.loadAntiBan = function() {
  chrome.storage.local.get(['ups_antiban_min', 'ups_antiban_max'], (res) => {
    const min = document.getElementById('anti-min'); const max = document.getElementById('anti-max');
    if(min) min.value = res.ups_antiban_min || 4;
    if(max) max.value = res.ups_antiban_max || 10;
  });
};

/* ═════ MODAL & SAUDACAO HERO LOGIC ═════ */
window.openEditorSaudacao = () => document.getElementById('mdl-edicao-saudacao')?.classList.add('open');
window.closeEditorSaudacao = () => document.getElementById('mdl-edicao-saudacao')?.classList.remove('open');

window.saveStatusSaudacaoLocal = async function() {
   const ativo = document.getElementById('auto-saudacao-ativo').checked;
   try {
     await UpsidenDB.from('config_automacao').upsert({ closer_id: userData.userId, saudacao_ativa: ativo, updated_at: new Date().toISOString() }).execute();
   } catch(e) {}
   chrome.storage.local.get('ups_config_saudacao', res => {
      let cfg = res.ups_config_saudacao || {};
      cfg.ativo = ativo;
      chrome.storage.local.set({ ups_config_saudacao: cfg });
      window.updateSaudacaoHeroUI(cfg.mensagem, ativo, cfg.apenasPrivado, cfg.apenasGrupo, (cfg.followupSteps||[]).length);
      typeof toast==='function' && toast(ativo ? 'Automação Global Ativada' : 'Automação Suspensa', 'info');
   });
};

window.updateSaudacaoHeroUI = function(msg, ativo, priv, grp, stepsCount) {
   const elStatus = document.getElementById('s-badge-status');
   const elPub = document.getElementById('s-badge-publico');
   const elPassos = document.getElementById('s-badge-passos');
   const elMsg = document.getElementById('saud-active-preview');
   const elTog = document.getElementById('auto-saudacao-ativo');
   if(!elStatus) return;
   
   if(ativo) {
      elStatus.style.background = 'rgba(16, 185, 129, 0.1)'; elStatus.style.color = '#10b981'; elStatus.textContent = '● Saudação Ativa';
   } else {
      elStatus.style.background = 'rgba(239, 68, 68, 0.1)'; elStatus.style.color = '#ef4444'; elStatus.textContent = '○ Pausada';
   }
   elTog.checked = ativo;
   
   if(priv && grp) elPub.textContent = 'Público: Todos';
   else if(priv) elPub.textContent = 'Público: Privados apenas';
   else if(grp) elPub.textContent = 'Público: Grupos apenas';
   else elPub.textContent = 'Sem Público Alvo';
   
   elPassos.textContent = stepsCount > 0 ? `+${stepsCount} Blocos Dependentes` : 'Disparo Simples (Sem Funil)';
   elMsg.textContent = msg || 'Nenhuma resposa inicial configurada...';
};

/* ═════ TEMPLATES SYSTEM ═════ */
let cachedTemplates = [];

window.carregarTemplatesSaudacao = function() {
   chrome.storage.local.get('ups_templates_saudacao', res => {
      cachedTemplates = res.ups_templates_saudacao || [];
      window.renderTemplatesGrid(cachedTemplates);
   });
};

window.renderTemplatesGrid = function(list) {
   const grid = document.getElementById('tpl-grid-list');
   if(!grid) return;
   grid.innerHTML = '';
   if(list.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px; border: 1px dashed var(--border); border-radius: 12px; margin-top:16px;">Nenhum template encontrado nesta pasta. Aperte "Salvar como Novo Template" no Editor!</div>';
      return;
   }
   
   list.forEach(t => {
      const card = document.createElement('div');
      card.className = 'tpl-card';
      const fCount = t.data && t.data.followupSteps ? t.data.followupSteps.length : 0;
      card.innerHTML = `
         <div class="tpl-card-top">
            <div class="tpl-card-title">${t.nome}</div>
            <div style="width:24px; height:24px; border-radius:6px; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; color:var(--text-secondary); font-size:12px;">📁</div>
         </div>
         <div class="tpl-card-desc">"${t.data?.mensagem || 'Sem prévia de texto...'}"</div>
         <div class="tpl-card-footer">
            <span>Passos: 1 + ${fCount}</span>
            <button class="tpl-apply-btn" onclick="window.aplicarTemplate('${t.id}')">Aplicar Script</button>
            <button class="btn-ghost" title="Apagar Template" onclick="window.apagarTemplate('${t.id}')" style="padding:4px; color:#ef4444;"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
         </div>
      `;
      grid.appendChild(card);
   });
};

window.filtrarTemplates = function(pasta) {
   document.querySelectorAll('.tpl-folder').forEach(el => {
      const txt = el.textContent || '';
      if (pasta === 'todas' && txt.includes('Toda Biblioteca')) el.classList.add('active');
      else if (pasta !== 'todas' && (txt.includes(pasta) || (pasta === 'Prospeccao' && txt.includes('Prospec')))) el.classList.add('active');
      else el.classList.remove('active');
   });
   if(pasta === 'todas') window.renderTemplatesGrid(cachedTemplates);
   else window.renderTemplatesGrid(cachedTemplates.filter(x => x.pasta === pasta));
};

window.salvarComoTemplateModal = function() {
   const nome = prompt('Dê um nome impactante para este Template (Ex: Boas Vindas BF):');
   if(!nome) return;
   const pastaInput = prompt('Em qual Pasta deseja guardar?\n(Vendas, Suporte, Prospeccao, ou digite uma nova)', 'Vendas');
   const pasta = pastaInput || 'Geral';
   
   // Capture current Modal State
   const msg = document.getElementById('auto-saudacao').value.trim();
   const p = document.getElementById('auto-privado').checked;
   const g = document.getElementById('auto-grupo').checked;
   
   const fupRows = document.querySelectorAll('#followups-list .followup-row');
   const followups = [];
   fupRows.forEach(row => {
     const tp = row.querySelector('.fup-tipo').value;
     const ct = row.querySelector('.fup-conteudo').value.trim();
     const dl = Number(row.querySelector('.fup-delay').value) || 0;
     const dur = Number(row.querySelector('.fup-duracao').value) || 2;
     const url = row.querySelector('.fup-url').value;
     const mime = row.querySelector('.fup-mime').value;
     const nomeA = row.querySelector('.fup-nome').value;
     if (ct || url) followups.push({ tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur, url: url, mime: mime, nome: nomeA });
   });
   
   const tpl = {
      id: 'tpl_'+Date.now(),
      nome,
      pasta,
      timestamp: Date.now(),
      data: { mensagem: msg, apenasPrivado: p, apenasGrupo: g, followupSteps: followups }
   };
   
   cachedTemplates.push(tpl);
   chrome.storage.local.set({ ups_templates_saudacao: cachedTemplates }, () => {
      typeof toast==='function' && toast('Template materializado em ' + pasta + '!', 'success');
      window.renderTemplatesGrid(cachedTemplates);
   });
};

window.aplicarTemplate = function(id) {
   const tpl = cachedTemplates.find(x => x.id === id);
   if(!tpl) return;
   const d = tpl.data;
   document.getElementById('auto-saudacao').value = d.mensagem || '';
   document.getElementById('auto-privado').checked = d.apenasPrivado !== false;
   document.getElementById('auto-grupo').checked = d.apenasGrupo || false;
   
   const list = document.getElementById('followups-list');
   list.innerHTML = '';
   if(d.followupSteps) d.followupSteps.forEach(p => window.addFollowupRow('followups-list', p));
   
   typeof toast==='function' && toast('Template injetado no Editor! Revise e clique em "Aplicar Alterações".', 'info');
   window.openEditorSaudacao();
};

window.apagarTemplate = function(id) {
   if(!confirm('Quer exterminar este Template permanentemente?')) return;
   cachedTemplates = cachedTemplates.filter(x => x.id !== id);
   chrome.storage.local.set({ ups_templates_saudacao: cachedTemplates }, () => {
      typeof toast==='function' && toast('Template Aniquilado.', 'info');
      window.renderTemplatesGrid(cachedTemplates);
   });
};

window.exportarTemplatesLocal = function() {
   if(cachedTemplates.length === 0) return typeof toast==='function' && toast('A biblioteca está vazia!', 'error');
   const blob = new Blob([JSON.stringify(cachedTemplates, null, 2)], {type: 'application/json'});
   const a = document.createElement('a');
   a.href = URL.createObjectURL(blob);
   a.download = 'Upsiden_Templates_Saudacao.json';
   a.click();
};

window.importarTemplateModal = function() {
   const input = document.createElement('input');
   input.type = 'file';
   input.accept = 'application/json';
   input.onchange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
         try {
            const arr = JSON.parse(evt.target.result);
            if(Array.isArray(arr)) {
               cachedTemplates = cachedTemplates.concat(arr);
               chrome.storage.local.set({ ups_templates_saudacao: cachedTemplates }, () => {
                  typeof toast==='function' && toast(arr.length + ' Templates Injetados!', 'success');
                  window.renderTemplatesGrid(cachedTemplates);
               });
            }
         } catch(err) { typeof toast==='function' && toast('JSON Corrompido.', 'error'); }
      };
      reader.readAsText(file);
   };
   input.click();
};
