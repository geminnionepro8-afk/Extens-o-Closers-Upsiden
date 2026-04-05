/**
 * @file painel-automacoes.js
 * @description Nova interface de Automações — Estilo Manychat.
 *              Suporte a Flow Builder (Visual), Gatilhos (Básico), Saudação e Configurações.
 */

window.renderAutomacoes = function(c) {
  if (typeof window.autoSelectedFolder === 'undefined') window.autoSelectedFolder = 'todos';
  if (typeof window.autoSubTab === 'undefined') window.autoSubTab = 'gatilhos';
  if (typeof window.autoViewMode === 'undefined') window.autoViewMode = 'grid';
  
  const tabs = [
    { id: 'flow_builder', label: 'Flow Builder', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' },
    { id: 'gatilhos', label: 'Automação Básica', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
    { id: 'saudacao', label: 'Saudação', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    { id: 'config', label: 'Configurações', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }
  ];

  let html = `
    <div class="rs-crm-header-wrap" style="margin-bottom: 24px;">
       <div class="rs-controls-row" style="justify-content: flex-start; gap: 20px;">
          <div class="selector-group animate-in">
             ${tabs.map(t => `
               <button class="selector-item ${window.autoSubTab === t.id ? 'active' : ''}" 
                       data-click="switchTab('${t.id}')">
                 ${t.icon}
                 ${t.label}
               </button>
             `).join('')}
          </div>
       </div>
    </div>
    <div id="automacoes-content-root" class="animate-in"></div>
  `;
  
  c.innerHTML = html;
  const root = document.getElementById('automacoes-content-root');

  if (window.autoSubTab === 'flow_builder') {
    renderFlowDashboard(root);
  } else if (window.autoSubTab === 'saudacao') {
    renderSaudacaoTab(root);
  } else if (window.autoSubTab === 'gatilhos') {
    renderGatilhosTab(root);
  } else if (window.autoSubTab === 'config') {
    renderConfigTab(root);
  }
};

// --- 1. FLOW BUILDER DASHBOARD ---
window.renderFlowDashboard = async function(container) {
  const flows = await (window.FlowService?.getFlows() || []);
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  
  container.innerHTML = `
    <div class="flow-dashboard-container animate-in">
      <!-- SIDEBAR FILTERS -->
      <aside class="flow-sidebar-left">
        <div class="flow-sidebar-section">
          <div class="flow-sidebar-label">Visão Geral</div>
          <div class="flow-nav-item ${window.autoSelectedFolder === 'todos' ? 'active' : ''}" data-click="filterFlowsByFolder('todos')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Todos os Fluxos
          </div>
          <div class="flow-nav-item ${window.autoSelectedFolder === 'publicados' ? 'active' : ''}" data-click="filterFlowsByFolder('publicados')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Publicados
          </div>
          <div class="flow-nav-item ${window.autoSelectedFolder === 'rascunhos' ? 'active' : ''}" data-click="filterFlowsByFolder('rascunhos')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Rascunhos
          </div>
        </div>

        <div class="flow-sidebar-section">
          <div class="flow-sidebar-label">Minhas Pastas</div>
          ${folders.map(f => `
            <div class="flow-nav-item ${window.autoSelectedFolder === f ? 'active' : ''}" data-click="filterFlowsByFolder('${f}')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"/></svg>
              ${f}
            </div>
          `).join('')}
          <button class="rs-btn-dark" style="margin-top:8px; border-style:dashed; opacity:0.6;" data-click="addAutoFolder()">+ Nova Pasta</button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flow-main-content">
        <div class="flow-dash-header">
          <div class="flow-search-bar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="flow-search-input" placeholder="Pesquisar fluxos..." id="flow-search">
          </div>
          
          <div style="display:flex; gap:12px;">
            <div class="view-toggle-wrap">
               <button class="view-btn ${window.autoViewMode === 'grid' ? 'active' : ''}" data-click="switchAutoView('grid')">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
               </button>
               <button class="view-btn ${window.autoViewMode === 'list' ? 'active' : ''}" data-click="switchAutoView('list')">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
               </button>
            </div>
            <button class="rs-btn-premium" style="height:42px; padding:0 24px;" data-click="createNewFlow()">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><path d="M12 5v14M5 12h14"/></svg> Novo Fluxo
            </button>
          </div>
        </div>

        <div id="flow-items-container" class="${window.autoViewMode === 'grid' ? 'flow-grid' : 'flow-list'}">
          <!-- Injetado via renderFlowCards -->
        </div>
      </main>
    </div>
  `;

  renderFlowCards(flows);

  // Listeners
  document.getElementById('flow-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = flows.filter(f => f.name.toLowerCase().includes(term));
    renderFlowCards(filtered);
  });
};

// Removido o renderFlowFoldersInDashboard individual pois agora está na sidebar

window.renderFlowCards = function(flows) {
  const container = document.getElementById('flow-items-container');
  if (!container) return;

  // Filtragem extra se estiver na sidebar
  let finalFlows = flows;
  if (window.autoSelectedFolder === 'publicados') finalFlows = flows.filter(f => f.is_active);
  else if (window.autoSelectedFolder === 'rascunhos') finalFlows = flows.filter(f => !f.is_active);
  else if (window.autoSelectedFolder !== 'todos') finalFlows = flows.filter(f => f.folder === window.autoSelectedFolder || (!f.folder && window.autoSelectedFolder === 'Geral'));

  if (finalFlows.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; padding: 60px; text-align:center; color:var(--text-muted);">Nenhum fluxo encontrado nesta categoria.</div>`;
    return;
  }

  container.innerHTML = finalFlows.map(f => {
    const date = new Date(f.updated_at || Date.now()).toLocaleDateString();
    const statusClass = f.is_active ? 'flow-status-active' : 'flow-status-inactive';
    const statusText = f.is_active ? 'Ativo' : 'Rascunho';
    
    return `
      <div class="flow-card animate-in" data-click="openFlowEditor('${f.id}')">
        <div class="flow-card-preview">
           ${renderMiniGraph(f)}
           <div class="flow-status-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="flow-card-body">
           <div class="flow-card-title">${f.name || 'Sem título'}</div>
           <div class="flow-card-meta">
              <div class="meta-item">
                 <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                 <strong>${f.run_count || 0}</strong> rodadas
              </div>
              <div class="meta-item">
                 <strong>${date}</strong>
              </div>
           </div>
        </div>
      </div>
    `;
  }).join('');
};

function renderMiniGraph(flow) {
  if (!flow.nodes || flow.nodes.length === 0) {
    return `<div class="mini-graph-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.05" width="40"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>`;
  }
  
  // Pegar os primeiros 4 nós para a prévia
  const miniNodes = flow.nodes.slice(0, 4);
  const nodeIcons = {
    message: `<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>`,
    audio: `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>`,
    image: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`,
    pause: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`
  };

  return `
    <div class="mini-graph-container">
      ${miniNodes.map((n, idx) => {
        const x = (idx % 2) * 50 + 20;
        const y = Math.floor(idx / 2) * 50 + 25;
        const icon = nodeIcons[n.type] || nodeIcons.message;
        
        return `
          <div class="mini-node" style="left: ${x}%; top: ${y}%;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              ${icon}
            </svg>
          </div>
        `;
      }).join('')}
      <!-- Linhas decorativas de conexão -->
      <div class="mini-edge" style="width: 40%; left: 30%; top: 40%; transform: rotate(15deg);"></div>
      <div class="mini-edge" style="width: 40%; left: 30%; top: 60%; transform: rotate(-15deg); opacity: 0.1;"></div>
    </div>
  `;
}

window.switchAutoView = function(mode) {
  window.autoViewMode = mode;
  const container = document.getElementById('flow-items-container');
  if (container) {
    container.className = mode === 'grid' ? 'flow-grid' : 'flow-list';
  }
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-click').includes(`'${mode}'`));
  });
};

window.filterFlowsByFolder = function(f) {
  window.autoSelectedFolder = f;
  const root = document.getElementById('automacoes-content-root');
  if (root) renderFlowDashboard(root);
};

window.createNewFlow = async function() {
  const name = prompt("Nome do novo fluxo:");
  if (!name) return;
  
  try {
    const newFlow = {
      name: name,
      admin_id: window.userData?.teamAdminId || null,
      criado_por: window.userData?.userId || null,
      is_active: false,
      folder: (window.autoSelectedFolder && window.autoSelectedFolder !== 'todos' && window.autoSelectedFolder !== 'publicados' && window.autoSelectedFolder !== 'rascunhos') ? window.autoSelectedFolder : 'Geral',
      nodes: [],
      edges: []
    };
    
    // Simulação de salvamento ou uso do FlowService se disponível
    const res = await (window.FlowService?.saveFlow(newFlow) || Promise.resolve({ id: 'new-' + Date.now(), ...newFlow }));
    
    if (res && res.id) {
      toast("Fluxo criado com sucesso!", "success");
      window.openFlowEditor(res.id);
    }
  } catch (e) {
    console.error("Erro ao criar fluxo:", e);
    toast("Erro ao criar fluxo", "error");
  }
};

window.openFlowEditor = function(id) {
  window.activeFlowId = id; // Global flag for Flow Builder
  const mainContent = document.getElementById('main-content');
  if (mainContent && typeof window.renderFlow === 'function') {
    window.renderFlow(mainContent);
  } else {
    console.warn("Modulo Flow não carregado ou main-content ausente.");
  }
};

// --- 2. SAUDAÇÃO TAB ---
window.renderSaudacaoTab = function(root) {
  root.innerHTML = `
    <div class="rs-card rs-card-accent animate-in" style="width:100%; padding:32px;">
      <h3 style="margin-bottom:4px; font-size:18px; font-weight:800;">Resposta Automática (Saudação)</h3>
      <p style="color:var(--text-muted); font-size:12px; margin-bottom:20px;">Configure uma mensagem automática de boas-vindas para novos contatos de forma profissional.</p>
      
      <div class="form-group" style="margin-bottom:16px;"><label class="form-label" style="margin-bottom:6px;">Mensagem de Saudação Global</label><textarea class="form-textarea" id="auto-saudacao" rows="3" placeholder="Ex: Olá! Obrigado por entrar em contato com a Upsiden." style="padding:12px; font-size:13px;"></textarea></div>
      
      <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin-top:12px; padding:12px 16px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; align-items:center; gap:10px;">
          <label class="toggle-switch" style="scale:0.8; margin:0;"><input type="checkbox" id="auto-saudacao-ativo"><span class="toggle-slider"></span></label>
          <span style="font-size:12px; font-weight:700; color:#fff;">Ativar saudação</span>
        </div>
        <div style="height:20px; width:1px; background:rgba(255,255,255,0.1); margin:0 4px;"></div>
        <div style="display:flex; align-items:center; gap:16px;">
           <label style="font-size:12px; font-weight:600; color:var(--text-muted); display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="auto-privado" checked style="accent-color:var(--accent);"> Privado</label>
           <label style="font-size:12px; font-weight:600; color:var(--text-muted); display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="auto-grupo" style="accent-color:var(--accent);"> Grupos</label>
        </div>
      </div>
      
      <div style="margin-top:24px; padding-top:20px; border-top:1px dashed rgba(255,255,255,0.05);">
        <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:4px;">Funil de Follow-ups</h4>
        <p style="color:var(--text-muted); font-size:11px; margin-bottom:16px;">Adicione mensagens, áudios ou documentos sequenciais.</p>
        
        <div id="followups-list"></div>
        
        <button class="rs-btn-dark" data-click="addFollowupRow('followups-list')" style="margin-top:12px; margin-bottom:20px; padding:10px 16px; font-size:12px;">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M12 5v14M5 12h14"/></svg> Adicionar Passo de Fluxo
        </button>
      </div>

      <button class="rs-btn-plus" data-click="salvarSaudacao()" style="width:100%; padding:12px;">Salvar Saudação</button>
    </div>
  `;
  // Carregar dados após render
  setTimeout(() => window.loadAutomationConfig('saudacao'), 50);
};

// --- 3. GATILHOS TAB (Automação Básica) ---
window.renderGatilhosTab = function(root) {
  root.innerHTML = `
    <div class="timeline-main-grid animate-in" style="padding: 16px; height: calc(100vh - 250px); box-sizing: border-box;">
       <aside class="auto-sidebar-rs" style="height: 100%; overflow-y: auto;">
          <div style="font-size:10px; font-weight:900; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; padding:0 12px;">Pastas da Inteligência</div>
          <button class="rs-folder-btn ${window.autoSelectedFolder === 'todos' ? 'active' : ''}" data-click="switchAutoFolder('todos')">
             <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"/></svg> Todos os Gatilhos <span class="folder-count" id="count-all">0</span>
          </button>
          <div id="auto-folders-list" style="display:flex; flex-direction:column; gap:6px;">
             <!-- Dinâmico -->
          </div>
          <div class="sidebar-divider" style="height:1px; background:rgba(255,255,255,0.05); margin:12px 0;"></div>
          <button class="rs-btn-premium" style="width:100%; padding:10px; font-size:12px; background:rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.15); color:var(--text-muted); box-shadow:none; text-align:center; justify-content:center;" data-click="addAutoFolder()">+ Criar Nova Pasta</button>
       </aside>

       <div class="auto-content-rs" style="height: 100%; overflow-y: auto; padding-right: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; position: sticky; top: 0; background: var(--bg-primary); z-index: 100; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
             <div>
                <h3 style="font-size:18px; font-weight:800; color:#fff; margin:0;" id="folder-title">Todos os Gatilhos</h3>
                <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Gatilhos clássicos baseados em palavras-chave.</p>
             </div>
              <div style="display:flex; gap:12px;">
                <button class="rs-btn-premium" style="background:rgba(255,255,255,0.03); color:white; border:1px solid rgba(255,255,255,0.08); box-shadow:none; padding:10px 20px;" data-click="addTriggerRow()">
                   <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><path d="M12 5v14M5 12h14"/></svg> Novo Gatilho
                </button>
                <button class="rs-btn-plus" data-click="salvarGatilhos()" style="padding:10px 24px;">Salvar Cloud</button>
             </div>
          </div>
          
          <div id="triggers-list" style="display:flex; flex-direction:column; gap:40px;">
             <!-- Dinâmico -->
          </div>
       </div>

       <aside class="mobile-preview-container">
          <h4 style="font-size: 13px; font-weight:900; color:var(--text-muted); margin:0 0 16px 0; text-align:center; text-transform:uppercase; letter-spacing:1px; width:100%;">Preview Simulador</h4>
          <div class="iphone-mockup" id="iphone-live-preview">
             <div class="iphone-notch"></div>
             <div class="wpp-header">
                <div class="wpp-avatar">LC</div>
                <div>
                   <div class="wpp-title">Lead</div>
                   <div class="wpp-subtitle">online</div>
                </div>
             </div>
             <div class="wpp-chat-body" id="preview-messages-container"></div>
             <div class="wpp-footer">
                <div class="wpp-input">Mensagem</div>
                <div style="width:32px; height:32px; background:#00a884; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                   <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"></path></svg>
                </div>
             </div>
          </div>
       </aside>
    </div>
  `;
  setTimeout(() => {
    window.renderFoldersSidebar();
    window.loadAutomationConfig('gatilhos');
  }, 50);
};

// --- 4. CONFIGURAÇÕES TAB (Horário + Anti-Ban) ---
window.renderConfigTab = function(root) {
  root.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
      <!-- HORARIO -->
      <div class="rs-card rs-card-accent animate-in" style="padding:32px;">
        <div style="text-align:center; margin-bottom:24px;">
           <div style="width:48px; height:48px; background:var(--accent-dim); color:var(--accent); border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
           </div>
           <h3 style="font-size:18px; font-weight:800; color:#fff; margin:0;">Filtro de Expediente</h3>
           <p style="color:var(--text-muted); font-size:12px; margin-top:6px;">Controle quando seu robô deve responder.</p>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; background:rgba(255,255,255,0.02); padding:16px; border-radius:16px; border:1px solid rgba(255,255,255,0.05);">
          <div class="form-group-rs" style="margin:0;"><label class="rs-label">Início</label><input type="time" class="rs-input" id="hora-ini" value="08:00" style="text-align:center; font-size:16px; font-weight:800; padding:10px;"></div>
          <div class="form-group-rs" style="margin:0;"><label class="rs-label">Término</label><input type="time" class="rs-input" id="hora-fim" value="18:00" style="text-align:center; font-size:16px; font-weight:800; padding:10px;"></div>
        </div>
        
        <div class="form-group-rs" style="margin-bottom:24px;">
          <label class="rs-label">Mensagem de "Fechado"</label>
          <textarea class="rs-input" id="msg-fechado" rows="3" placeholder="Ex: Olá! No momento estamos fora do horário de atendimento..." style="min-height:80px; padding:12px; font-size:13px;"></textarea>
        </div>
        
        <button class="rs-btn-plus" data-click="salvarHorario()" style="width:100%; padding:12px;">Salvar Expediente</button>
      </div>

      <!-- REGRAS HUMANIZAÇÃO -->
      <div class="rs-card rs-card-accent animate-in" style="padding:32px;">
         <div style="text-align:center; margin-bottom:24px;">
           <div style="width:48px; height:48px; background:var(--accent-dim); color:var(--accent); border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           </div>
           <h3 style="font-size:18px; font-weight:800; color:#fff; margin:0;">Regras de Humanização</h3>
           <p style="color:var(--text-muted); font-size:12px; margin-top:6px;">Pausas randômicas para evitar banimentos.</p>
        </div>

        <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:16px; border:1px solid rgba(255,255,255,0.05); margin-bottom:20px;">
           <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
             <div class="form-group" style="margin:0;"><label class="form-label" style="margin-bottom:6px;">Atraso Mínimo (seg)</label><input type="number" class="rs-input" id="regra-min" value="2" style="width:100%; padding:10px;"></div>
             <div class="form-group" style="margin:0;"><label class="form-label" style="margin-bottom:6px;">Atraso Máximo (seg)</label><input type="number" class="rs-input" id="regra-max" value="5" style="width:100%; padding:10px;"></div>
           </div>
        </div>
        <button class="rs-btn-plus" data-click="salvarRegrasGlobais()" style="width:100%; padding:12px;">Aplicar Regras</button>
      </div>
    </div>
  `;
  setTimeout(() => window.loadAutomationConfig('config'), 50);
};

// --- FUNÇÕES DE APOIO E CRUD (Mantidas as originais com pequenos ajustes) ---

function forcarReloadEngine() {
  try {
    chrome.runtime.sendMessage({ tipo: 'reload_automation_config' });
  } catch(e) {
    console.warn('[Painel] Falha ao enviar reload para background:', e);
  }
}

window.loadAutomationConfig = async function(context = 'all') {
  const fallbackLocal = () => {
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_horario', 'ups_config_regras'], res => {
      if((context === 'all' || context === 'saudacao') && res.ups_config_saudacao) {
        const s = res.ups_config_saudacao;
        const eMsg = document.getElementById('auto-saudacao'); const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = s.saudacao_mensagem || s.mensagem || '';
        if(eAtivo) eAtivo.checked = s.saudacao_ativa || s.ativo || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = s.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = s.apenas_grupo || false;
        const list = document.getElementById('followups-list');
        if (list) {
           list.innerHTML = '';
           const steps = s.followup_steps || s.followupSteps;
           if (steps && Array.isArray(steps)) steps.forEach(p => window.addFollowupRow('followups-list', p));
        }
      }
      if((context === 'all' || context === 'gatilhos')) {
        const triggers = res.ups_config_triggers || [];
        const list = document.getElementById('triggers-list');
        if (list) {
          list.innerHTML = '';
          if(!triggers.length) window.addTriggerRow();
          else triggers.forEach(t => window.addTriggerRow(t.palavra, t.resposta, t.pasta || 'Geral', t.condicao || 'exata'));
        }
      }
      if ((context === 'all' || context === 'config') && res.ups_config_horario) {
        if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = res.ups_config_horario.ini || '08:00';
        if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = res.ups_config_horario.fim || '18:00';
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = res.ups_config_horario.msg || '';
      }
      if ((context === 'all' || context === 'config') && res.ups_config_regras) {
        if(document.getElementById('regra-min')) document.getElementById('regra-min').value = res.ups_config_regras.delayMin || 2;
        if(document.getElementById('regra-max')) document.getElementById('regra-max').value = res.ups_config_regras.delayMax || 5;
      }
    });
  };

  try {
    const userId = (await chrome.storage.local.get('userData'))?.userData?.userId;
    if (!userId) return fallbackLocal();

    if (context === 'all' || context === 'saudacao' || context === 'config') {
      const { data } = await window.UpsidenDB.from('config_automacao').select('*').eq('closer_id', userId).maybeSingle();
      if (data) {
        if (context === 'saudacao' || context === 'all') {
           const eMsg = document.getElementById('auto-saudacao');
           const eAtivo = document.getElementById('auto-saudacao-ativo');
           if(eMsg) eMsg.value = data.saudacao_mensagem || '';
           if(eAtivo) eAtivo.checked = data.saudacao_ativa || false;
           if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = data.apenas_privado !== false;
           if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = data.apenas_grupo || false;
           const list = document.getElementById('followups-list');
           if (list && data.followup_steps) {
              list.innerHTML = '';
              const passos = typeof data.followup_steps === 'string' ? JSON.parse(data.followup_steps) : data.followup_steps;
              if (Array.isArray(passos)) passos.forEach(p => window.addFollowupRow('followups-list', p));
           }
        }
        if (context === 'config' || context === 'all') {
           if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = data.hora_inicio || '08:00';
           if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = data.hora_fim || '18:00';
           if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = data.msg_fora_horario || '';
           if(document.getElementById('regra-min')) document.getElementById('regra-min').value = data.delay_min || 2;
           if(document.getElementById('regra-max')) document.getElementById('regra-max').value = data.delay_max || 5;
        }
      }
    }
    if (context === 'all' || context === 'gatilhos') {
       const { data: gatilhos } = await window.UpsidenDB.from('gatilhos').select('*').eq('criado_por', userId).order('created_at', { ascending: false });
       const list = document.getElementById('triggers-list');
       if (list) {
          list.innerHTML = '';
          if (!gatilhos || !gatilhos.length) fallbackLocal();
          else {
             const groups = {};
             gatilhos.forEach(t => {
                const key = t.resposta + '|' + (t.pasta || 'Geral');
                if (!groups[key]) groups[key] = { resposta: t.resposta, pasta: t.pasta || 'Geral', rules: [] };
                groups[key].rules.push({ palavra: t.palavra, condicao: t.condicao || 'exata' });
             });
             Object.values(groups).forEach(g => window.addTriggerRow(g.rules, g.resposta, g.pasta));
          }
       }
    }
  } catch(e) {
    console.error('[Painel-Automações] Erro ao carregar config:', e);
    fallbackLocal();
  }
};

// ═══ REUTILIZAÇÃO DE FUNÇÕES DE UI ORIGINAIS ══════════════════
// Nota: addFollowupRow, addTriggerRow, salvarSaudacao, salvarGatilhos, salvarHorario,
// salvarRegrasGlobais, renderLivePreview, switchAutoFolder, addAutoFolder permanecem.
// Elas operam no DOM dinâmico criado pelos renders de aba.

window.addFollowupRow = function(containerId, stepObj = {}) {
  const list = document.getElementById(containerId);
  if(!list) return;

  const {
     tipo = 'texto', conteudo = '', base64 = '', url = '', mime = '',
     nome = '', delay_segundos = 3, duracaoSimulacao = 2, sendAs = ''
  } = stepObj;

  const row = document.createElement('div');
  row.className = 'timeline-node-wrapper followup-row animate-in';

  let typeSvg = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>';
  let cardClass = 'card-text';
  let typeLabel = 'Texto';

  if (tipo === 'audio') { cardClass = 'card-audio'; typeLabel = 'Áudio'; typeSvg = '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>'; }
  else if (tipo === 'imagem' || tipo === 'video') { cardClass = 'card-image'; typeLabel = 'Mídia'; typeSvg = '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>'; }

  row.innerHTML = `
    <div class="timeline-delay-node">
       <div class="delay-badge">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Pausa de <input type="number" class="fup-delay" value="${delay_segundos}" min="0"> seg
       </div>
    </div>
    <div class="timeline-action-card ${cardClass}" style="margin: 0 auto;">
       <div class="card-icon-pane"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${typeSvg}</svg></div>
       <div class="card-content-pane">
          <div class="card-header-actions">
             <span class="card-type-label">${typeLabel}</span>
             <select class="rs-input fup-tipo" style="height:24px; padding:0 8px; font-size:10px; font-weight:700; width:100px;">
                <option value="texto" ${tipo==='texto'?'selected':''}>Texto</option>
                <option value="audio" ${tipo==='audio'?'selected':''}>Áudio</option>
                <option value="imagem" ${tipo==='imagem'?'selected':''}>Mídia</option>
                <option value="documento" ${tipo==='documento'?'selected':''}>Doc</option>
             </select>
             <button class="btn-remove" style="margin-left:auto; background:transparent; border:none; color:var(--danger); cursor:pointer;"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <textarea class="rs-input fup-conteudo" rows="2" style="width:100%; margin-top:8px;">${conteudo}</textarea>
          <div class="media-fields" style="display: ${tipo === 'texto' ? 'none' : 'flex'}; margin-top:8px;">
             <select class="fup-midia-url rs-input" style="flex:1;"><option value="">-- Carregando Mídias --</option></select>
             <input type="hidden" class="fup-url" value="${url}">
             <input type="hidden" class="fup-mime" value="${mime}">
             <input type="hidden" class="fup-nome" value="${nome}">
          </div>
       </div>
    </div>
    <input type="hidden" class="fup-duracao" value="${duracaoSimulacao}">
  `;

  list.appendChild(row);

  // Setup media selectors logic (simplified for this task)
  const selMidia = row.querySelector('.fup-midia-url');
  const baseUrl = 'https://imxwpacwtphekrbgwbph.supabase.co/storage/v1/object/public/';
  const allM = [...(window.painelData?.audios||[]), ...(window.painelData?.midias||[]), ...(window.painelData?.documentos||[])];
  selMidia.innerHTML = '<option value="">-- Selecione Mídia --</option>' + allM.map(m => `<option value="${baseUrl}${m.storage_path}" ${url.includes(m.storage_path)?'selected':''}>${m.nome}</option>`).join('');
  
  selMidia.onchange = (e) => { row.querySelector('.fup-url').value = e.target.value; };
  row.querySelector('.btn-remove').onclick = () => { row.remove(); if(window.renderLivePreview) window.renderLivePreview(); };
};

window.addTriggerRow = function(palavraInput='', respostaObj={}, pasta='Geral') {
  const list = document.getElementById('triggers-list');
  if(!list) return;
  const uid = 'gat-' + Date.now();
  const wrapper = document.createElement('div');
  wrapper.className = 'rs-trigger-card trigger-wrapper animate-in';
  wrapper.id = 'wrapper-' + uid;
  wrapper.dataset.pasta = pasta;

  wrapper.innerHTML = `
    <div class="trigger-header-rs">
       <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:16px; font-weight:800; color:#fff;">Fluxo de Gatilho</h3>
          <button class="btn-remove-trigger" style="background:rgba(255,0,0,0.1); border:none; color:var(--danger); padding:8px; border-radius:8px; cursor:pointer;"><svg viewBox="0 0 24 24" width="14" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
       </div>
       <div class="rules-container" style="margin-top:12px; display:flex; flex-direction:column; gap:8px;"></div>
       <button class="rs-btn-dark btn-add-rule" style="margin-top:8px; font-size:11px; padding:6px 12px;">+ Adicionar Palavra</button>
       <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center;">
          <select class="trigger-pasta rs-input" style="height:30px; font-size:11px;"></select>
          <button class="rs-btn-premium btn-add-step" style="height:32px; font-size:11px;">+ Adicionar Resposta</button>
       </div>
    </div>
    <div id="${uid}" class="timeline-canvas-area" style="min-height:50px;">
       <div class="timeline-line"></div>
    </div>
  `;

  list.appendChild(wrapper);
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  wrapper.querySelector('.trigger-pasta').innerHTML = folders.map(f => `<option value="${f}" ${f===pasta?'selected':''}>${f}</option>`).join('');
  
  const addRule = (val='', cond='exata') => {
    const div = document.createElement('div');
    div.style = "display:flex; gap:8px;";
    div.innerHTML = `<input type="text" class="trigger-palavra rs-input" style="flex:1;" value="${val}" placeholder="Palavra..."><select class="trigger-condicao rs-input" style="width:100px;"><option value="exata" ${cond==='exata'?'selected':''}>Igual</option><option value="contem" ${cond==='contem'?'selected':''}>Contém</option></select>`;
    wrapper.querySelector('.rules-container').appendChild(div);
  };

  if(Array.isArray(palavraInput)) palavraInput.forEach(r => addRule(r.palavra, r.condicao));
  else addRule(palavraInput);

  wrapper.querySelector('.btn-add-rule').onclick = () => addRule();
  wrapper.querySelector('.btn-add-step').onclick = () => window.addFollowupRow(uid);
  wrapper.querySelector('.btn-remove-trigger').onclick = () => { wrapper.remove(); if(window.renderLivePreview) window.renderLivePreview(); };

  // Load steps
  if(respostaObj) {
    let steps = [];
    try { steps = typeof respostaObj === 'string' ? JSON.parse(respostaObj) : (Array.isArray(respostaObj)?respostaObj:[]); } catch(e){}
    steps.forEach(s => window.addFollowupRow(uid, s));
  }
};

window.salvarSaudacao = async function() {
  const msg = document.getElementById('auto-saudacao').value;
  const ativo = document.getElementById('auto-saudacao-ativo').checked;
  const p = document.getElementById('auto-privado').checked;
  const g = document.getElementById('auto-grupo').checked;
  const steps = [];
  document.querySelectorAll('#followups-list .followup-row').forEach(row => {
    steps.push({ 
       tipo: row.querySelector('.fup-tipo').value, 
       conteudo: row.querySelector('.fup-conteudo').value,
       delay_segundos: Number(row.querySelector('.fup-delay').value),
       url: row.querySelector('.fup-url').value,
       mime: row.querySelector('.fup-mime').value,
       nome: row.querySelector('.fup-nome').value
    });
  });

  const userId = (await chrome.storage.local.get('userData'))?.userData?.userId;
  await window.UpsidenDB.from('config_automacao').upsert({
    closer_id: userId, saudacao_ativa: ativo, saudacao_mensagem: msg, apenas_privado: p, apenas_grupo: g, followup_steps: JSON.stringify(steps)
  }).execute();

  chrome.storage.local.set({ ups_config_saudacao: { ativo, mensagem: msg, apenas_privado: p, apenas_grupo: g, followup_steps: steps } }, () => {
    forcarReloadEngine();
    toast("Saudação salva!", "success");
  });
};

window.salvarGatilhos = async function() {
  const exportData = [];
  document.querySelectorAll('.trigger-wrapper').forEach(card => {
    const steps = [];
    card.querySelectorAll('.followup-row').forEach(sr => {
      steps.push({ 
        tipo: sr.querySelector('.fup-tipo').value, 
        conteudo: sr.querySelector('.fup-conteudo').value, 
        delay_segundos: Number(sr.querySelector('.fup-delay').value),
        url: sr.querySelector('.fup-url').value, mime: sr.querySelector('.fup-mime').value, nome: sr.querySelector('.fup-nome').value
      });
    });
    const resp = JSON.stringify(steps);
    const pasta = card.querySelector('.trigger-pasta').value;
    card.querySelectorAll('.trigger-palavra').forEach((inp, idx) => {
      if(!inp.value.trim()) return;
      exportData.push({ palavra: inp.value.trim(), resposta: resp, condicao: card.querySelectorAll('.trigger-condicao')[idx].value, pasta });
    });
  });

  const userId = (await chrome.storage.local.get('userData'))?.userData?.userId;
  await window.UpsidenDB.from('gatilhos').delete().eq('criado_por', userId);
  for(const t of exportData) {
    await window.UpsidenDB.from('gatilhos').insert({ ...t, criado_por: userId, ativo: true }).execute();
  }
  chrome.storage.local.set({ ups_config_triggers: exportData }, () => {
    forcarReloadEngine();
    toast(`${exportData.length} gatilhos salvos!`, 'success');
  });
};

window.salvarHorario = async function() {
  const ini = document.getElementById('hora-ini').value;
  const fim = document.getElementById('hora-fim').value;
  const msg = document.getElementById('msg-fechado').value;
  const userId = (await chrome.storage.local.get('userData'))?.userData?.userId;
  await window.UpsidenDB.from('config_automacao').upsert({ closer_id: userId, hora_inicio: ini, hora_fim: fim, msg_fora_horario: msg }).execute();
  chrome.storage.local.set({ ups_config_horario: { ini, fim, msg } }, () => { forcarReloadEngine(); toast("Horário salvo!", "success"); });
};

window.salvarRegrasGlobais = async function() {
  const min = Number(document.getElementById('regra-min').value);
  const max = Number(document.getElementById('regra-max').value);
  const userId = (await chrome.storage.local.get('userData'))?.userData?.userId;
  await window.UpsidenDB.from('config_automacao').upsert({ closer_id: userId, delay_min: min, delay_max: max }).execute();
  chrome.storage.local.set({ ups_config_regras: { delayMin: min, delayMax: max } }, () => { forcarReloadEngine(); toast("Regras salvas!", "success"); });
};

// ... Restante das funções de UI mantidas ...
window.renderLivePreview = function() {
  const container = document.getElementById('preview-messages-container');
  if (!container) return;
  const sumTimeBox = document.getElementById('preview-time-estimado');
  const sumStepsBox = document.getElementById('preview-total-passos');

  const card = document.querySelector('.trigger-wrapper');
  if(!card) return container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Crie um gatilho para simular</div>';

  const trigger = card.querySelector('.trigger-palavra')?.value || 'Olá';
  let html = `<div style="font-size:11px; text-align:center; margin:10px 0; color:#8696a0;">Hoje</div><div class="wpp-bubble in">${trigger}<div class="wpp-bubble-time">Agora</div></div>`;
  
  let tTime = 0;
  const rows = card.querySelectorAll('.followup-row');
  rows.forEach(r => {
    const ct = r.querySelector('.fup-conteudo').value || '...';
    html += `<div class="wpp-bubble out animate-in">${ct}<div class="wpp-bubble-time">Logo após</div></div>`;
    tTime += Number(r.querySelector('.fup-delay').value);
  });
  container.innerHTML = html;
  if(sumTimeBox) sumTimeBox.textContent = tTime + 's';
  if(sumStepsBox) sumStepsBox.textContent = rows.length;
  container.scrollTop = container.scrollHeight;
};

window.switchAutoFolder = function(f) { window.autoSelectedFolder = f; window.renderGatilhosTab(document.getElementById('automacoes-content-root')); };
window.renderFoldersSidebar = function() {
  const container = document.getElementById('auto-folders-list');
  if (!container) return;
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  container.innerHTML = folders.map(f => `<button class="rs-folder-btn ${window.autoSelectedFolder===f?'active':''}" data-click="switchAutoFolder('${f}')"><svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"/></svg>${f}</button>`).join('');
};
window.addAutoFolder = function() {
  const n = prompt("Nova pasta:"); if(!n) return;
  const f = JSON.parse(localStorage.getItem('ups_auto_folders') || '[]'); f.push(n);
  localStorage.setItem('ups_auto_folders', JSON.stringify(f)); window.renderFoldersSidebar();
};
