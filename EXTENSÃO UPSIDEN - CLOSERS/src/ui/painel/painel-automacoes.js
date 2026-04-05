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

  let html = window.autoSubTab === 'flow_builder'
    ? `<div id="automacoes-content-root" class="auto-page-content animate-in"></div>`
    : `
      <div class="auto-page-shell animate-in">
        <aside class="auto-page-nav">
          ${tabs.map(t => `
            <button class="auto-page-nav-item ${window.autoSubTab === t.id ? 'active' : ''}" 
                    data-click="switchTab('${t.id}')">
              ${t.icon}
              ${t.label}
            </button>
          `).join('')}
        </aside>
        <div id="automacoes-content-root" class="auto-page-content animate-in"></div>
      </div>
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
  const tabs = [
    { id: 'flow_builder', label: 'Flow Builder', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' },
    { id: 'gatilhos', label: 'Automação Básica', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
    { id: 'saudacao', label: 'Saudação', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    { id: 'config', label: 'Configurações', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }
  ];
  const flows = await (window.FlowService?.getFlows() || []);
  window.__autoDashboardFlows = flows;
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  const totalFlows = flows.length;
  const activeFlows = flows.filter(f => f.is_active).length;
  const draftFlows = flows.filter(f => !f.is_active).length;
  
  container.innerHTML = `
    <div class="flow-dashboard-container animate-in">
      <aside class="flow-sidebar-left">
        <div class="flow-sidebar-section">
          ${tabs.map(t => `
            <button class="flow-mode-nav-item ${window.autoSubTab === t.id ? 'active' : ''}" data-click="switchTab('${t.id}')">
              ${t.icon}
              ${t.label}
            </button>
          `).join('')}
        </div>
        <div class="flow-sidebar-divider"></div>

        <div class="flow-sidebar-section">
          <div class="flow-sidebar-label">Filtros</div>
          <div class="flow-nav-item ${window.autoSelectedFolder === 'todos' ? 'active' : ''}" data-click="filterFlowsByFolder('todos')">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Todos
            <span class="flow-nav-count">${totalFlows}</span>
          </div>
          <div class="flow-nav-item ${window.autoSelectedFolder === 'publicados' ? 'active' : ''}" data-click="filterFlowsByFolder('publicados')">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Publicados
            <span class="flow-nav-count">${activeFlows}</span>
          </div>
          <div class="flow-nav-item ${window.autoSelectedFolder === 'rascunhos' ? 'active' : ''}" data-click="filterFlowsByFolder('rascunhos')">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Rascunhos
            <span class="flow-nav-count">${draftFlows}</span>
          </div>
        </div>

        <div class="flow-sidebar-section">
          <div class="flow-sidebar-label">Minhas Pastas</div>
          ${folders.map(f => `
            <div class="flow-nav-item ${window.autoSelectedFolder === f ? 'active' : ''}" data-click="filterFlowsByFolder('${f}')">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"/></svg>
              ${f}
              <span class="flow-nav-count">${flows.filter(flow => (flow.folder || 'Geral') === f).length}</span>
            </div>
          `).join('')}
          <button class="flow-add-folder-btn" data-click="addAutoFolder()">+ Nova Pasta</button>
        </div>
      </aside>

      <main class="flow-main-content">
        <div class="flow-main-topbar">
          <div class="flow-main-topbar-left">
            <div class="flow-search-bar flow-search-bar-compact">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" class="flow-search-input" placeholder="Pesquisar..." id="flow-search">
            </div>
          </div>
          <button class="rs-btn-premium flow-new-btn" data-click="createNewFlow()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><path d="M12 5v14M5 12h14"/></svg> Novo Fluxo
          </button>
        </div>

        <div id="flow-items-container" class="flow-items-stage ${window.autoViewMode === 'grid' ? 'flow-grid' : 'flow-list'}"></div>
      </main>
    </div>
  `;

  renderFlowCards(flows);

  // Listeners
  document.getElementById('flow-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = flows.filter(f => (f.name || '').toLowerCase().includes(term));
    renderFlowCards(filtered);
    window.runFlowDashboardVisualQaTests?.();
  });
  window.runFlowDashboardVisualQaTests?.();
};

// Removido o renderFlowFoldersInDashboard individual pois agora está na sidebar

window.renderFlowCards = function(flows) {
  const container = document.getElementById('flow-items-container');
  if (!container) return;
  window.__flowPreviewRenderEpoch = (window.__flowPreviewRenderEpoch || 0) + 1;
  const isListMode = window.autoViewMode === 'list';

  let finalFlows = flows;
  if (window.autoSelectedFolder === 'publicados') finalFlows = flows.filter(f => f.is_active);
  else if (window.autoSelectedFolder === 'rascunhos') finalFlows = flows.filter(f => !f.is_active);
  else if (window.autoSelectedFolder !== 'todos') finalFlows = flows.filter(f => f.folder === window.autoSelectedFolder || (!f.folder && window.autoSelectedFolder === 'Geral'));

  if (finalFlows.length === 0) {
    container.innerHTML = `<div class="flow-empty-state">Nenhum fluxo encontrado nesta categoria.</div>`;
    return;
  }

  const flowRows = finalFlows.map(f => {
    const graph = normalizeFlowGraph(f);
    const date = new Date(f.updated_at || Date.now()).toLocaleDateString();
    const statusClass = f.is_active ? 'flow-status-active' : 'flow-status-inactive';
    const statusText = f.is_active ? 'Ativo' : 'Rascunho';
    const folderLabel = f.folder || 'Geral';

    if (isListMode) {
      return `
        <div class="flow-card flow-row-card animate-in" data-click="openFlowEditor('${f.id}')" data-flow-id="${f.id}">
          <div class="flow-row-main">
            <span class="flow-row-dot ${statusClass}"></span>
            <div class="flow-row-title-wrap">
              <div class="flow-card-title">${f.name || 'Sem título'}</div>
              <div class="flow-row-subtitle">${graph.nodes.length} nós • ${graph.edges.length} conexões • ${folderLabel}</div>
            </div>
          </div>
          <div class="flow-row-metric">${f.run_count || 0}</div>
          <div class="flow-row-metric">
            <span class="flow-status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="flow-row-metric">${date}</div>
        </div>
      `;
    }

    return `
      <div class="flow-card animate-in" data-click="openFlowEditor('${f.id}')" data-flow-id="${f.id}">
        <div class="flow-card-preview">
          ${renderMiniGraph(f.id, graph, !!f.is_active)}
          <div class="flow-status-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="flow-card-body">
          <div class="flow-card-title">${f.name || 'Sem título'}</div>
          <div class="flow-card-subtitle">${graph.nodes.length} nós • ${graph.edges.length} conexões</div>
          <div class="flow-card-meta">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <strong>${f.run_count || 0}</strong> rodadas
            </div>
            <div class="meta-item">
              <strong>${folderLabel}</strong>
            </div>
            <div class="meta-item">
              <strong>${date}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = isListMode
    ? `
      <div class="flow-list-head">
        <div>Nome</div>
        <div>Rodadas</div>
        <div>Status</div>
        <div>Modificado</div>
      </div>
      ${flowRows}
    `
    : flowRows;
  window.initFlowPreviewRenderers?.(finalFlows);
  window.runFlowDashboardVisualQaTests?.();
};

function normalizeFlowGraph(flow) {
  const sourceNodes = Array.isArray(flow.nodes_json) ? flow.nodes_json : (Array.isArray(flow.nodes) ? flow.nodes : []);
  const sourceEdges = Array.isArray(flow.edges_json) ? flow.edges_json : (Array.isArray(flow.edges) ? flow.edges : []);
  const nodes = sourceNodes.map((node, index) => {
    const px = Number.isFinite(node?.x) ? node.x : (Number.isFinite(node?.position?.x) ? node.position.x : null);
    const py = Number.isFinite(node?.y) ? node.y : (Number.isFinite(node?.position?.y) ? node.position.y : null);
    return {
      id: String(node?.id || `auto_${index}`),
      type: node?.type || 'message',
      label: String(node?.data?.name || node?.name || node?.type || 'Nó'),
      data: node?.data || {},
      x: px,
      y: py
    };
  });
  const nodeIdSet = new Set(nodes.map(n => n.id));
  const edges = sourceEdges
    .map(edge => ({ source: String(edge?.source || ''), target: String(edge?.target || '') }))
    .map(edge => ({
      ...edge,
      sourceHandle: String(edge?.sourceHandle || edge?.source_handle || edge?.handle || ''),
      targetHandle: String(edge?.targetHandle || edge?.target_handle || ''),
      label: String(edge?.label || '')
    }))
    .filter(edge => edge.source && edge.target && nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target));
  return { nodes, edges };
}

function renderMiniGraph(flowId, graph, isActive) {
  if (!graph.nodes || graph.nodes.length === 0) {
    return `<div class="mini-graph-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.05" width="40"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>`;
  }

  return `
    <div class="mini-graph-container flow-preview" data-flow-id="${flowId}" data-real-nodes="${graph.nodes.length}" data-real-edges="${graph.edges.length}" data-flow-active="${isActive ? '1' : '0'}">
      <div class="flow-preview-controls">
        <button class="preview-ctrl-btn" data-preview-action="zoom-out" title="Zoom out">−</button>
        <button class="preview-ctrl-btn" data-preview-action="reset" title="Reset">100%</button>
        <button class="preview-ctrl-btn" data-preview-action="zoom-in" title="Zoom in">+</button>
        <button class="preview-ctrl-btn" data-preview-action="toggle-align" title="Auto-alinhar">A</button>
      </div>
      <svg class="mini-edges-svg" preserveAspectRatio="none"><g class="mini-edges-group"></g></svg>
      <div class="mini-nodes-layer"></div>
      <div class="flow-preview-legend">
        <span class="legend-chip">${graph.nodes.length} nós</span>
        <span class="legend-chip">${graph.edges.length} conexões</span>
      </div>
    </div>
  `;
}

function getPreviewNodeIcon(type) {
  const nodeIcons = {
    message: `<path d="M4 5.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-5 4V5.5z"/><line x1="8" y1="8.5" x2="16" y2="8.5"/><line x1="8" y1="12" x2="13.5" y2="12"/>`,
    audio: `<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0"/><line x1="12" y1="18" x2="12" y2="21"/>`,
    image: `<rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="M6.5 16.5l4-4 3 3 2.5-2.5 2 3"/>`,
    document: `<path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M14 3.5V8h4.5"/><line x1="9" y1="12" x2="15.5" y2="12"/>`,
    pause: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="7.5" x2="12" y2="12"/><line x1="12" y1="12" x2="15.2" y2="13.8"/>`,
    condition: `<circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="M10 9.5l4 4"/><path d="M12 4h7v7"/>`,
    loop: `<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>`
  };
  return nodeIcons[type] || nodeIcons.message;
}

function getNodeIssueLevel(node) {
  if (!node || !node.data) return 'warning';
  if (node.type === 'message' && !(node.data.content || node.data.text || '').trim()) return 'warning';
  if (node.type === 'pause' && !Number.isFinite(Number(node.data.delay || node.data.seconds || 0))) return 'warning';
  if (node.type === 'condition' && !(node.data.value || '').toString().trim()) return 'warning';
  if (node.type === 'loop' && !Number.isFinite(Number(node.data.iterations || node.data.maxIterations || 0))) return 'warning';
  return 'ok';
}

function getEdgeKind(edge) {
  const key = `${edge?.sourceHandle || ''}|${edge?.label || ''}`.toLowerCase();
  if (key.includes('false') || key.includes('não')) return 'false';
  if (key.includes('true') || key.includes('sim')) return 'true';
  if (key.includes('loop') || key.includes('repeat')) return 'loop';
  return 'default';
}

function buildAutoLayout(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const indegree = {};
  const byId = {};
  nodes.forEach(n => {
    indegree[n.id] = 0;
    byId[n.id] = n;
  });
  edges.forEach(e => {
    if (e.target in indegree) indegree[e.target] += 1;
  });
  const queue = nodes.filter(n => indegree[n.id] === 0).map(n => n.id);
  const layerById = {};
  queue.forEach(id => { layerById[id] = 0; });
  while (queue.length) {
    const curr = queue.shift();
    const currLayer = layerById[curr] || 0;
    edges.filter(e => e.source === curr).forEach(e => {
      layerById[e.target] = Math.max(layerById[e.target] || 0, currLayer + 1);
      indegree[e.target] -= 1;
      if (indegree[e.target] === 0) queue.push(e.target);
    });
  }
  let maxLayer = Object.values(layerById).length ? Math.max(...Object.values(layerById)) : 0;
  nodes.forEach(n => {
    if (!(n.id in layerById)) {
      maxLayer += 1;
      layerById[n.id] = maxLayer;
    }
  });
  const groups = {};
  nodes.forEach(n => {
    const layer = layerById[n.id] || 0;
    if (!groups[layer]) groups[layer] = [];
    groups[layer].push(n.id);
  });
  const layout = {};
  Object.keys(groups).sort((a, b) => Number(a) - Number(b)).forEach(layerKey => {
    const ids = groups[layerKey];
    ids.forEach((id, idx) => {
      layout[id] = {
        x: Number(layerKey) * 260,
        y: idx * 130
      };
    });
  });
  return layout;
}

function computePreviewViewport(nodes, width, height, state) {
  const xs = nodes.map(n => n.px);
  const ys = nodes.map(n => n.py);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const padding = 30;
  const fit = Math.min((width - padding) / boxW, (height - padding) / boxH);
  return { minX, maxX, minY, maxY, fit: Number.isFinite(fit) ? Math.max(0.1, fit) : 1 };
}

function drawSingleFlowPreview(container, flow) {
  if (!container || !flow) return;
  window.__flowPreviewState = window.__flowPreviewState || {};
  const flowId = String(flow.id);
  if (!window.__flowPreviewState[flowId]) {
    window.__flowPreviewState[flowId] = { zoom: 1, panX: 0, panY: 0, autoAlign: true, drag: null, fingerprint: '', epoch: 0 };
  }
  const state = window.__flowPreviewState[flowId];
  const normalized = normalizeFlowGraph(flow);
  const fingerprint = `${normalized.nodes.length}:${normalized.edges.length}:${normalized.nodes.map(n => n.id).join('|')}:${normalized.edges.map(e => `${e.source}>${e.target}`).join('|')}`;
  const currentEpoch = Number(window.__flowPreviewRenderEpoch || 0);
  if (state.fingerprint !== fingerprint || state.epoch !== currentEpoch) {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    state.autoAlign = true;
    state.fingerprint = fingerprint;
    state.epoch = currentEpoch;
  }
  const autoLayout = buildAutoLayout(normalized);
  const withCoords = normalized.nodes.filter(n => Number.isFinite(n.x) && Number.isFinite(n.y)).length;
  const hasReliableCoords = normalized.nodes.length > 0 && (withCoords / normalized.nodes.length) >= 0.8;
  const useRawCoords = hasReliableCoords && !state.autoAlign;
  const nodes = normalized.nodes.map((node, idx) => {
    const hasCoords = Number.isFinite(node.x) && Number.isFinite(node.y);
    const fallback = autoLayout[node.id] || { x: idx * 180, y: idx * 90 };
    return {
      ...node,
      px: useRawCoords && hasCoords ? node.x : fallback.x,
      py: useRawCoords && hasCoords ? node.y : fallback.y
    };
  });
  const edges = normalized.edges || [];
  const width = Math.max(140, container.clientWidth || 280);
  const height = Math.max(80, container.clientHeight || 140);
  const viewport = computePreviewViewport(nodes, width, height, state);
  const scale = viewport.fit * Math.max(0.5, Math.min(2.5, state.zoom || 1));
  const centerX = (viewport.minX + viewport.maxX) * 0.5;
  const centerY = (viewport.minY + viewport.maxY) * 0.5;
  const nodeById = {};
  const screenNodes = nodes.map(node => {
    const sx = (node.px - centerX) * scale + width / 2 + (state.panX || 0);
    const sy = (node.py - centerY) * scale + height / 2 + (state.panY || 0);
    const sn = { ...node, sx, sy };
    nodeById[node.id] = sn;
    return sn;
  });
  const nodesLayer = container.querySelector('.mini-nodes-layer');
  const edgesGroup = container.querySelector('.mini-edges-group');
  if (!nodesLayer || !edgesGroup) return;
  edgesGroup.innerHTML = edges.map(edge => {
    const from = nodeById[edge.source];
    const to = nodeById[edge.target];
    if (!from || !to) return '';
    const dx = to.sx - from.sx;
    const c1x = from.sx + Math.max(16, Math.min(42, Math.abs(dx) * 0.4)) * (dx >= 0 ? 1 : -1);
    const c2x = to.sx - Math.max(16, Math.min(42, Math.abs(dx) * 0.4)) * (dx >= 0 ? 1 : -1);
    const kind = getEdgeKind(edge);
    return `<path class="mini-edge-path edge-kind-${kind}" d="M ${from.sx} ${from.sy} C ${c1x} ${from.sy}, ${c2x} ${to.sy}, ${to.sx} ${to.sy}" />`;
  }).join('');
  const nodeSize = Math.max(16, Math.min(30, 22 * Math.min(1.35, scale)));
  nodesLayer.innerHTML = screenNodes.map(node => {
    const issue = getNodeIssueLevel(node);
    const icon = getPreviewNodeIcon(node.type);
    const title = `${node.label} (${node.type})`;
    return `
      <div class="mini-node mini-node-${node.type || 'message'} issue-${issue}" style="left:${node.sx}px; top:${node.sy}px; width:${nodeSize}px; height:${nodeSize}px;" title="${title}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
        <span class="mini-node-indicator"></span>
      </div>
    `;
  }).join('');
  const resetBtn = container.querySelector('[data-preview-action="reset"]');
  if (resetBtn) resetBtn.textContent = `${Math.round((state.zoom || 1) * 100)}%`;
}

function bindFlowPreviewInteractions(container, flow) {
  if (!container || container.dataset.boundPreview === '1') return;
  container.dataset.boundPreview = '1';
  const flowId = String(flow.id);
  window.__flowPreviewState = window.__flowPreviewState || {};
  window.__flowPreviewState[flowId] = window.__flowPreviewState[flowId] || { zoom: 1, panX: 0, panY: 0, autoAlign: true, drag: null, fingerprint: '', epoch: 0 };
  const state = window.__flowPreviewState[flowId];
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    state.zoom = Math.max(0.45, Math.min(2.5, (state.zoom || 1) + delta));
    drawSingleFlowPreview(container, flow);
  }, { passive: false });
  container.addEventListener('pointerdown', (e) => {
    const ctrl = e.target.closest('.preview-ctrl-btn');
    if (ctrl) return;
    container.setPointerCapture(e.pointerId);
    state.drag = { x: e.clientX, y: e.clientY };
    container.classList.add('panning');
  });
  container.addEventListener('pointermove', (e) => {
    if (!state.drag) return;
    state.panX += e.clientX - state.drag.x;
    state.panY += e.clientY - state.drag.y;
    state.drag = { x: e.clientX, y: e.clientY };
    drawSingleFlowPreview(container, flow);
  });
  container.addEventListener('pointerup', () => {
    state.drag = null;
    container.classList.remove('panning');
  });
  container.addEventListener('pointercancel', () => {
    state.drag = null;
    container.classList.remove('panning');
  });
  container.querySelectorAll('.preview-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.previewAction;
      if (action === 'zoom-in') state.zoom = Math.min(2.5, (state.zoom || 1) + 0.15);
      if (action === 'zoom-out') state.zoom = Math.max(0.45, (state.zoom || 1) - 0.15);
      if (action === 'reset') {
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
      }
      if (action === 'toggle-align') {
        state.autoAlign = !state.autoAlign;
        btn.classList.toggle('active', state.autoAlign);
      }
      drawSingleFlowPreview(container, flow);
    });
  });
}

window.initFlowPreviewRenderers = function(flows) {
  const map = {};
  (flows || []).forEach(flow => { map[String(flow.id)] = flow; });
  document.querySelectorAll('.mini-graph-container.flow-preview').forEach(container => {
    const flow = map[String(container.dataset.flowId)];
    if (!flow) return;
    bindFlowPreviewInteractions(container, flow);
    drawSingleFlowPreview(container, flow);
  });
};

window.runFlowDashboardVisualQaTests = function() {
  const container = document.getElementById('flow-items-container');
  const searchBar = document.querySelector('.flow-search-bar');
  const searchInput = document.getElementById('flow-search');
  const actionButton = document.querySelector('.flow-main-topbar .rs-btn-premium') || document.querySelector('.flow-dash-header .rs-btn-premium');
  if (!container) return { ok: false, reason: 'container_not_found' };

  const cards = Array.from(container.querySelectorAll('.flow-card'));
  const previewContainers = Array.from(container.querySelectorAll('.mini-graph-container'));
  const previewChecks = previewContainers.map(graph => {
    const expectedNodes = Number(graph.dataset.realNodes || 0);
    const expectedEdges = Number(graph.dataset.realEdges || 0);
    const renderedNodes = graph.querySelectorAll('.mini-node').length;
    const renderedEdges = graph.querySelectorAll('.mini-edge-path').length;
    const hasControls = graph.querySelectorAll('.preview-ctrl-btn').length >= 4;
    return {
      ok: expectedNodes === renderedNodes && expectedEdges === renderedEdges && hasControls,
      expectedNodes,
      renderedNodes,
      expectedEdges,
      renderedEdges,
      hasControls
    };
  });

  const searchRect = searchInput?.getBoundingClientRect();
  const iconRect = searchBar?.querySelector('svg')?.getBoundingClientRect();
  const buttonRect = actionButton?.getBoundingClientRect();
  const searchStates = {};
  if (searchInput) {
    const prevDisabled = searchInput.disabled;
    searchInput.focus();
    const focusStyle = getComputedStyle(searchInput);
    searchStates.focus = {
      borderColor: focusStyle.borderColor,
      visible: searchRect ? searchRect.width > 120 && searchRect.height > 28 : false
    };
    searchInput.blur();
    searchInput.disabled = true;
    const disabledStyle = getComputedStyle(searchInput);
    searchStates.disabled = {
      opacity: Number(disabledStyle.opacity || 1),
      pointerEvents: disabledStyle.pointerEvents
    };
    searchInput.disabled = prevDisabled;
  }

  const report = {
    timestamp: new Date().toISOString(),
    previewFidelityOk: previewChecks.length ? previewChecks.every(c => c.ok) : true,
    previewChecks,
    layoutOk: cards.every(card => {
      const rect = card.getBoundingClientRect();
      return rect.width > 180 && rect.height > 64;
    }),
    actionButtonOk: !!buttonRect && buttonRect.height >= 38 && buttonRect.width >= 120,
    searchBarOk: !!searchRect && !!iconRect && searchRect.height >= 30 && iconRect.height >= 14,
    searchStates,
    totalCards: cards.length,
    supportsPanAndZoom: previewContainers.length ? previewContainers.every(graph => !!graph.querySelector('.flow-preview-controls')) : true
  };
  window.__upsidenFlowUiQa = report;
  return report;
};

window.runFlowPreviewUnitTests = function() {
  const t1 = normalizeFlowGraph({
    nodes_json: [{ id: 'n1', type: 'message', x: 10, y: 10, data: { content: 'Oi' } }, { id: 'n2', type: 'condition', data: {} }],
    edges_json: [{ source: 'n1', target: 'n2', sourceHandle: 'true' }]
  });
  const t2 = buildAutoLayout(t1);
  const t3 = computePreviewViewport([
    { px: 0, py: 0 },
    { px: 120, py: 80 },
    { px: 300, py: 140 }
  ], 280, 140, { zoom: 1 });
  const tests = [
    { name: 'normalizacao_nos', ok: t1.nodes.length === 2 },
    { name: 'normalizacao_conexoes', ok: t1.edges.length === 1 },
    { name: 'layout_auto_tem_posicoes', ok: Number.isFinite(t2.n1?.x) && Number.isFinite(t2.n2?.y) },
    { name: 'viewport_fit_valido', ok: Number.isFinite(t3.fit) && t3.fit > 0 },
    { name: 'icone_loop_suportado', ok: getPreviewNodeIcon('loop').includes('path') },
    { name: 'detector_condicao_false', ok: getEdgeKind({ sourceHandle: 'false' }) === 'false' }
  ];
  const report = {
    timestamp: new Date().toISOString(),
    total: tests.length,
    passed: tests.filter(t => t.ok).length,
    failed: tests.filter(t => !t.ok).length,
    tests
  };
  window.__upsidenFlowUnitTests = report;
  return report;
};

window.addEventListener('upsiden:flow-updated', () => {
  const root = document.getElementById('automacoes-content-root');
  if (root && window.autoSubTab === 'flow_builder') {
    window.renderFlowDashboard(root);
  }
});

window.switchAutoView = function(mode) {
  window.autoViewMode = mode;
  const container = document.getElementById('flow-items-container');
  if (container) {
    container.classList.toggle('flow-grid', mode === 'grid');
    container.classList.toggle('flow-list', mode === 'list');
  }
  document.querySelectorAll('.flow-view-nav-item, .view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-click').includes(`'${mode}'`));
  });
  const search = document.getElementById('flow-search');
  const term = (search?.value || '').toLowerCase();
  const flows = Array.isArray(window.__autoDashboardFlows) ? window.__autoDashboardFlows : [];
  const filtered = term ? flows.filter(f => (f.name || '').toLowerCase().includes(term)) : flows;
  window.renderFlowCards(filtered);
  window.runFlowDashboardVisualQaTests?.();
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
