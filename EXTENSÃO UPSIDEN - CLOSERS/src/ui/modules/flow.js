/**
 * @file flow.js
 * @description Engine Vanilla JS para o Visual Flow Builder.
 * Matemática de Pan, Zoom e conexões Bezier. Estilo RedSun DNA v3.0.
 */

class FlowEngine {
  constructor() {
    this.container = document.getElementById('flow-workspace');
    this.canvas = document.getElementById('flow-canvas');
    this.svgLayer = document.getElementById('flow-svg-layer');
    this.edgesGroup = document.getElementById('flow-edges-group');
    this.nodesContainer = document.getElementById('flow-nodes-container');
    this.dragLine = document.getElementById('flow-drag-line');
    this.zoomLabel = document.getElementById('flow-zoom-level');

    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;

    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    this.nodes = {}; // node_id -> { el, data, x, y }
    this.edges = []; // { id, source, target, pathEl }

    // Connection State
    this.isConnecting = false;
    this.connSourceNode = null;
    this.connStartX = 0;
    this.connStartY = 0;

    // Node Drag State
    this.draggedNodeId = null;
    this.nodeDragStartX = 0;
    this.nodeDragStartY = 0;

    this.selectedNodeId = null;
    this.currentFlowId = null;
    this.currentFlowName = "Novo Fluxo";

    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.bindPaletteDnD();

    // Initial Pan
    const rect = this.container.getBoundingClientRect();
    this.panX = rect.width / 2 - 100;
    this.panY = rect.height / 2 - 100;
    this.updateTransform();

    const nameEl = document.getElementById('flow-display-name');
    if (nameEl) this.currentFlowName = nameEl.textContent;
  }

  /* ═══ 1. GLOBAL EVENTS & CANVAS MATH ══════════════════════════ */
  bindGlobalEvents() {
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const change = 1 + direction * 0.05;
      let newZoom = this.zoom * change;
      newZoom = Math.min(Math.max(0.3, newZoom), 2);
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.updateTransform();
      this.updateEdges();
      this.updatePopoverPosition();
    }, { passive: false });

    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.flow-node') || e.target.closest('.node-port') || e.target.closest('.node-popover')) return;
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      this.container.classList.add('panning');
      this.closePopover();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateTransform();
        this.updatePopoverPosition();
        return;
      }
      if (this.draggedNodeId) {
        const dx = (e.clientX - this.nodeDragStartX) / this.zoom;
        const dy = (e.clientY - this.nodeDragStartY) / this.zoom;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          this.nodeDragDidMove = true;
        }

        const node = this.nodes[this.draggedNodeId];
        node.x += dx;
        node.y += dy;
        node.el.style.transform = `translate(${node.x}px, ${node.y}px)`;
        this.nodeDragStartX = e.clientX;
        this.nodeDragStartY = e.clientY;
        this.updateEdges();
        if (this.selectedNodeId === this.draggedNodeId) this.updatePopoverPosition();
        return;
      }
      if (this.isConnecting) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / this.zoom;
        const my = (e.clientY - rect.top) / this.zoom;
        this.drawBezier(this.dragLine, this.connStartX, this.connStartY, mx, my);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.container.classList.remove('panning');
      }
      if (this.draggedNodeId) {
        this.draggedNodeId = null;
      }
      if (this.isConnecting) {
        this.isConnecting = false;
        this.dragLine.style.display = 'none';
        const dropPort = e.target.closest('.node-port.input');
        if (dropPort) {
          const targetNodeId = dropPort.closest('.flow-node').id;
          if (targetNodeId !== this.connSourceNode) {
            this.createEdge(this.connSourceNode, targetNodeId);
          }
        }
      }
    });

    document.getElementById('flow-btn-zoom-in')?.addEventListener('click', () => this.zoomManual(0.1));
    document.getElementById('flow-btn-zoom-out')?.addEventListener('click', () => this.zoomManual(-0.1));
    document.getElementById('flow-btn-save')?.addEventListener('click', () => this.saveFlow());
    document.getElementById('flow-back-btn')?.addEventListener('click', () => this.closeFlowBuilder());

    document.getElementById('pop-btn-close')?.addEventListener('click', () => this.closePopover());
    document.getElementById('pop-btn-delete')?.addEventListener('click', () => this.deleteNode(this.selectedNodeId));
  }

  updateTransform() {
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  zoomManual(amount) {
    let newZoom = this.zoom + amount;
    newZoom = Math.min(Math.max(0.3, newZoom), 2);
    const rect = this.container.getBoundingClientRect();
    this.panX = (rect.width / 2) - ((rect.width / 2) - this.panX) * (newZoom / this.zoom);
    this.panY = (rect.height / 2) - ((rect.height / 2) - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.updateTransform();
    this.updateEdges();
    this.updatePopoverPosition();
  }

  closeFlowBuilder() {
    const wrapper = document.getElementById('module-flow');
    if (wrapper) wrapper.remove();
    if (typeof window.navigate === 'function') window.navigate('automacoes');
  }

  /* ═══ 2. PALETTE & NODE CREATION ══════════════════════════════ */
  bindPaletteDnD() {
    const items = document.querySelectorAll('.palette-card');
    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('node-type', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    this.container.addEventListener('dragover', (e) => e.preventDefault());
    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('node-type');
      if (!type) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.zoom;
      const y = (e.clientY - rect.top) / this.zoom;
      this.createNode(type, x - 100, y - 40);
    });
  }

  createNode(type, x, y, id = null, data = null) {
    const nodeId = id || `node_${Date.now()}`;
    const nodeData = data || {
      type: type,
      name: this.getNodeName(type),
      content: '',
      delay: 3,
      url: '',
      mime: '',
      fileName: ''
    };

    const el = document.createElement('div');
    el.className = 'flow-node';
    el.id = nodeId;
    el.dataset.type = type;
    el.style.transform = `translate(${x}px, ${y}px)`;

    const icon = this.getNodeIcon(type);

    el.innerHTML = `
      <div class="node-content">
        <div class="node-icon-wrap">${icon}</div>
        <div class="node-info-wrap">
          <div class="node-label">${nodeData.name}</div>
          <div class="node-subtext">${type}</div>
        </div>
      </div>
      <div class="node-port input"></div>
      <div class="node-port output"></div>
    `;

    this.nodesContainer.appendChild(el);
    this.nodes[nodeId] = { el, data: nodeData, x, y, id: nodeId };

    el.addEventListener('mousedown', (e) => this.onNodeMouseDown(e, nodeId));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // If we moved the node during mousedown, don't trigger the selection popover
      if (this.nodeDragDidMove) return;
      this.selectNode(nodeId);
    });

    return nodeId;
  }

  getNodeIcon(type) {
    const icons = {
      message: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 9h8"></path>
          <path d="M8 13h6"></path>
        </svg>`,
      audio: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>`,
      image: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>`,
      document: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>`,
      pause: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`,
      condition: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <polyline points="23 21 23 16 18 16"></polyline>
          <path d="M17 11V9a4 4 0 0 1 4-4h1"></path>
        </svg>`
    };
    return icons[type] || icons.message;
  }

  getNodeName(type) {
    const names = {
      message: 'Enviar Mensagem', audio: 'Enviar Áudio', image: 'Enviar Imagem',
      document: 'Enviar Documento', pause: 'Pausa (Delay)', condition: 'Condição'
    };
    return names[type] || 'Ação';
  }

  onNodeMouseDown(e, nodeId) {
    const port = e.target.closest('.node-port');
    if (port && port.classList.contains('output')) {
      this.isConnecting = true;
      this.connSourceNode = nodeId;
      this.dragLine.style.display = 'block';
      const sNode = this.nodes[nodeId];
      this.connStartX = sNode.x + port.offsetLeft + port.offsetWidth / 2;
      this.connStartY = sNode.y + port.offsetTop + port.offsetHeight / 2;
      return;
    }

    // Bring to front with z-index, don't move in DOM (to avoid breaking click event)
    Object.values(this.nodes).forEach(n => n.el.style.zIndex = 10);
    this.nodes[nodeId].el.style.zIndex = 100;

    e.stopPropagation();
    this.draggedNodeId = nodeId;
    this.nodeDragStartX = e.clientX;
    this.nodeDragStartY = e.clientY;

    // Record start position to determine if it was a drag or a click
    this.nodeDragDidMove = false;
  }

  /* ═══ 3. POPOVER (THE "JANELINHA") ══════════════════════════ */
  selectNode(nodeId) {
    if (this.selectedNodeId && this.nodes[this.selectedNodeId]) {
      this.nodes[this.selectedNodeId].el.classList.remove('selected');
    }
    this.selectedNodeId = nodeId;
    this.nodes[nodeId].el.classList.add('selected');
    this.openPopover(nodeId);
  }

  openPopover(nodeId) {
    const node = this.nodes[nodeId];
    const popover = document.getElementById('flow-node-popover');
    const content = document.getElementById('popover-content');
    const titleEl = document.getElementById('popover-node-title');
    if (!popover || !content) return;

    popover.style.display = 'flex';
    this.updatePopoverPosition();

    if (titleEl) titleEl.textContent = this.getNodeName(node.data.type);

    let html = `
      <div class="fp-content">
        <div class="prop-group">
          <label class="prop-label">Título do Nó</label>
          <input type="text" class="prop-input" id="prop-name" value="${node.data.name}">
        </div>
    `;

    if (node.data.type === 'message') {
      html += `
        <div class="prop-group">
          <label class="prop-label">Texto da Mensagem</label>
          <textarea class="prop-textarea" id="prop-content" rows="4">${node.data.content || ''}</textarea>
        </div>
      `;
    } else if (['audio', 'image', 'document'].includes(node.data.type)) {
      const typeKey = node.data.type === 'audio' ? 'audios' : (node.data.type === 'image' ? 'midias' : 'documentos');
      const library = window.painelData?.[typeKey] || [];
      const baseUrl = 'https://imxwpacwtphekrbgwbph.supabase.co/storage/v1/object/public/';

      html += `
        <div class="prop-group">
          <label class="prop-label">Arquivo da Biblioteca</label>
          <select class="prop-select" id="prop-library">
            <option value="">-- Selecione arquivo --</option>
            ${library.map(m => {
        const url = baseUrl + m.storage_path;
        return `<option value="${url}" ${node.data.url === url ? 'selected' : ''} data-mime="${m.tipo_mime || m.tipo}" data-name="${m.nome}">${m.nome}</option>`;
      }).join('')}
          </select>
          <button class="direct-upload-btn" id="prop-upload-btn" style="margin-top:8px;">
             <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
             Upload Direto
          </button>
        </div>
      `;
    } else if (node.data.type === 'pause') {
      html += `
        <div class="prop-group">
          <label class="prop-label">Espera (segundos)</label>
          <input type="number" class="prop-input" id="prop-delay" value="${node.data.delay || 3}">
        </div>
      `;
    }

    html += `</div>`;
    content.innerHTML = html;

    // Listeners
    document.getElementById('prop-name')?.addEventListener('input', (e) => {
      node.data.name = e.target.value;
      node.el.querySelector('.node-label').textContent = e.target.value;
    });
    document.getElementById('prop-content')?.addEventListener('input', (e) => node.data.content = e.target.value);
    document.getElementById('prop-delay')?.addEventListener('input', (e) => node.data.delay = parseInt(e.target.value));
    document.getElementById('prop-library')?.addEventListener('change', (e) => {
      const opt = e.target.options[e.target.selectedIndex];
      node.data.url = e.target.value;
      node.data.mime = opt.dataset.mime || '';
      node.data.fileName = opt.dataset.name || '';
    });
    document.getElementById('prop-upload-btn')?.addEventListener('click', () => this.handleDirectUpload(node.data.type));
  }

  updatePopoverPosition() {
    const popover = document.getElementById('flow-node-popover');
    if (!popover || !this.selectedNodeId) return;
    const node = this.nodes[this.selectedNodeId];
    const rect = node.el.getBoundingClientRect();
    const workspaceRect = this.container.getBoundingClientRect();

    popover.style.left = `${rect.right - workspaceRect.left + 15}px`;
    popover.style.top = `${rect.top - workspaceRect.top}px`;
  }

  closePopover() {
    const popover = document.getElementById('flow-node-popover');
    if (popover) popover.style.display = 'none';
    if (this.selectedNodeId && this.nodes[this.selectedNodeId]) {
      this.nodes[this.selectedNodeId].el.classList.remove('selected');
    }
    this.selectedNodeId = null;
  }

  deleteNode(nodeId) {
    if (!nodeId || !this.nodes[nodeId]) return;
    const node = this.nodes[nodeId];
    node.el.remove();
    this.edges = this.edges.filter(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        edge.bgPath.remove();
        edge.animPath.remove();
        return false;
      }
      return true;
    });
    delete this.nodes[nodeId];
    this.closePopover();
  }

  async handleDirectUpload(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const userId = (await chrome.storage.local.get('userData'))?.userData?.userId;
        const table = type === 'audio' ? 'audios' : (type === 'image' ? 'midias' : 'documentos');
        const path = `${userId}/flow/${Date.now()}_${file.name}`;
        await window.UpsidenStorage.upload(table, path, file, file.type);
        const res = await window.UpsidenDB.from(table).insert({
          nome: file.name, tipo_mime: file.type, tamanho: file.size,
          storage_path: path, criado_por: userId, admin_id: userId, compartilhado: true
        }).select().execute();
        if (res?.length) {
          if (!window.painelData[table]) window.painelData[table] = [];
          window.painelData[table].unshift(res[0]);
          this.openPopover(this.selectedNodeId);
        }
      } catch (err) { console.error(err); }
    };
    input.click();
  }

  /* ═══ 4. EDGES (Flowing Energy DNA) ══════════════════════════ */
  createEdge(src, tgt) {
    if (this.edges.some(e => e.source === src && e.target === tgt)) return;
    const id = `edge_${Date.now()}`;
    
    const bgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bgPath.setAttribute('class', 'flow-edge-underlay');
    
    const animPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    animPath.setAttribute('class', 'flow-edge');
    
    this.edgesGroup.appendChild(bgPath);
    this.edgesGroup.appendChild(animPath);
    
    this.edges.push({ id, source: src, target: tgt, bgPath, animPath });
    this.updateEdges();
  }

  updateEdges() {
    // Reset all ports first
    document.querySelectorAll('.node-port').forEach(p => p.classList.remove('connected'));

    this.edges.forEach(edge => {
      const sNode = this.nodes[edge.source];
      const tNode = this.nodes[edge.target];
      if (!sNode || !tNode) return;

      const sPort = sNode.el.querySelector('.node-port.output');
      const tPort = tNode.el.querySelector('.node-port.input');
      
      if (sPort) sPort.classList.add('connected');
      if (tPort) tPort.classList.add('connected');

      const x1 = sNode.x + sPort.offsetLeft + sPort.offsetWidth / 2;
      const y1 = sNode.y + sPort.offsetTop + sPort.offsetHeight / 2;
      const x2 = tNode.x + tPort.offsetLeft + tPort.offsetWidth / 2;
      const y2 = tNode.y + tPort.offsetTop + tPort.offsetHeight / 2;
      
      const d = this.getBezierD(x1, y1, x2, y2);
      edge.bgPath.setAttribute('d', d);
      edge.animPath.setAttribute('d', d);
    });
  }

  drawBezier(path, x1, y1, x2, y2) {
    path.setAttribute('d', this.getBezierD(x1, y1, x2, y2));
  }

  getBezierD(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  /* ═══ 5. LOAD / SAVE ════════════════════════════════════════ */
  async loadFlow(flowId) {
    console.log('[FlowEngine] Loading flow:', flowId);
    this.currentFlowId = flowId;
    const loadingOverlay = document.getElementById('flow-loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
      const flows = await window.FlowService.getFlows();
      const flow = flows.find(f => f.id === flowId);
      if (!flow) throw new Error('Flow not found');

      this.currentFlow = JSON.parse(JSON.stringify(flow));
    
      // Update Header
      const nameInput = document.getElementById('flow-display-name');
      if (nameInput) nameInput.value = this.currentFlow.name || 'Sem título';
      
      const statusBadge = document.getElementById('flow-status-badge');
      const statusText = document.getElementById('flow-status-text');
      const activeToggle = document.getElementById('flow-active-toggle');
      
      if (statusBadge) {
        statusBadge.textContent = this.currentFlow.is_active ? 'Published' : 'Draft';
        statusBadge.classList.toggle('published', !!this.currentFlow.is_active);
      }
      if (statusText) statusText.textContent = this.currentFlow.is_active ? 'Published' : 'Draft';
      if (activeToggle) activeToggle.checked = !!this.currentFlow.is_active;

      // Clear existing
      this.nodesContainer.innerHTML = '';
      this.edgesGroup.innerHTML = '';
      this.nodes = {};
      this.edges = [];

      // Restore Nodes
      const nodesData = flow.nodes_json || flow.nodes || [];
      nodesData.forEach(n => {
        this.createNode(n.type, n.x, n.y, n.id, n.data);
      });

      // Restore Edges
      const edgesData = flow.edges_json || flow.edges || [];
      edgesData.forEach(e => {
        this.createEdge(e.source, e.target);
      });

    } catch (err) {
      console.error('[FlowEngine] Error loading flow:', err);
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      const wrapper = document.getElementById('module-flow');
      if (wrapper) wrapper.style.display = 'flex';
    }
  }

  async saveFlow() {
    const btn = document.getElementById('flow-btn-save');
    const originalText = btn ? btn.textContent : 'Publish';
    if (btn) btn.textContent = 'Saving...';
    
    // Sync current values from Header
    const nameInput = document.getElementById('flow-display-name');
    const activeToggle = document.getElementById('flow-active-toggle');
    
    if (nameInput) this.currentFlow.name = nameInput.value;
    if (activeToggle) this.currentFlow.is_active = activeToggle.checked;

    const flow = {
      ...this.currentFlow,
      nodes: Object.values(this.nodes).map(n => ({
        id: n.id,
        type: n.data.type,
        x: n.x,
        y: n.y,
        data: n.data
      })),
      edges: this.edges.map(e => ({ source: e.source, target: e.target })),
      updated_at: new Date().toISOString()
    };

    try {
      if (window.FlowService) {
        await window.FlowService.saveFlow(flow);
        if (typeof window.showToast === 'function') window.showToast('Fluxo publicado com sucesso!', 'success');
        this.currentFlow = flow;
        this.loadFlow(flow.id);
      }
    } catch (e) {
      console.error('[FlowEngine] Error saving flow:', e);
      if (typeof window.showToast === 'function') window.showToast('Erro ao salvar fluxo', 'error');
    } finally {
      if (btn) btn.textContent = originalText;
    }
  }
}
// Inicialização manual removida. O motor agora é instanciado via loader (painel-flow.js)
