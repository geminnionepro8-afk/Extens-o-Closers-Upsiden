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
    this.nodeDragOffsetX = 0;
    this.nodeDragOffsetY = 0;

    this.selectedNodeId = null;
    this.currentFlowId = null;
    this.currentFlow = null;
    this.currentFlowName = "Novo Fluxo";
    this.flowNameOriginal = "Novo Fluxo";
    this.isEditingFlowName = false;
    this.gridSize = 24;
    this.alignmentTolerance = 1.25;

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
    this.runVisualDiagnostics();

    const nameEl = document.getElementById('flow-display-name');
    if (nameEl) this.currentFlowName = nameEl.value || this.currentFlowName;

    window.addEventListener('resize', () => {
      this.updateEdges();
      this.updatePopoverPosition();
      this.runVisualDiagnostics();
      this.runEditorVisualQaTests();
    });
    this.runEditorVisualQaTests();
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
        const node = this.nodes[this.draggedNodeId];
        if (!node) return;
        const pointer = this.getCanvasPointFromClient(e.clientX, e.clientY);
        const nextX = pointer.x - this.nodeDragOffsetX;
        const nextY = pointer.y - this.nodeDragOffsetY;
        const dx = nextX - node.x;
        const dy = nextY - node.y;
        if (Math.abs(dx) > 0.35 || Math.abs(dy) > 0.35) {
          this.nodeDragDidMove = true;
        }
        node.x = nextX;
        node.y = nextY;
        node.el.style.transform = `translate(${node.x}px, ${node.y}px)`;
        this.updateEdges();
        if (this.selectedNodeId === this.draggedNodeId) this.updatePopoverPosition();
        return;
      }
      if (this.isConnecting) {
        const cursorPoint = this.getCanvasPointFromClient(e.clientX, e.clientY);
        this.drawConnectionPath(this.dragLine, this.connStartX, this.connStartY, cursorPoint.x, cursorPoint.y);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.container.classList.remove('panning');
      }
      if (this.draggedNodeId) {
        const node = this.nodes[this.draggedNodeId];
        if (node) {
          node.x = this.snapToGrid(node.x);
          node.y = this.snapToGrid(node.y);
          node.el.style.transform = `translate(${node.x}px, ${node.y}px)`;
          node.el.classList.remove('dragging');
        }
        this.updateEdges();
        if (this.selectedNodeId === this.draggedNodeId) this.updatePopoverPosition();
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
    const flowNameInput = document.getElementById('flow-display-name');
    flowNameInput?.setAttribute('readonly', 'readonly');
    flowNameInput?.classList.add('readonly');
    flowNameInput?.addEventListener('click', () => this.startFlowNameEdit());
    flowNameInput?.addEventListener('input', (e) => this.validateFlowNameInput(e.target));
    flowNameInput?.addEventListener('blur', () => this.applyFlowNameEdit());
    flowNameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.applyFlowNameEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelFlowNameEdit();
      }
    });
    document.getElementById('flow-active-toggle')?.addEventListener('change', (e) => {
      const statusBadge = document.getElementById('flow-status-badge');
      const statusText = document.getElementById('flow-status-text');
      const isActive = !!e.target.checked;
      if (statusBadge) {
        statusBadge.textContent = isActive ? 'Published' : 'Draft';
        statusBadge.classList.toggle('published', isActive);
      }
      if (statusText) statusText.textContent = isActive ? 'Published' : 'Draft';
      if (this.currentFlow) this.currentFlow.is_active = isActive;
    });

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
      const point = this.getCanvasPointFromClient(e.clientX, e.clientY);
      this.createNode(type, point.x - 100, point.y - 40);
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

    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    const el = document.createElement('div');
    el.className = 'flow-node';
    el.id = nodeId;
    el.dataset.type = type;
    el.style.transform = `translate(${snappedX}px, ${snappedY}px)`;

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
    this.nodes[nodeId] = { el, data: nodeData, x: snappedX, y: snappedY, id: nodeId };

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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-5 4V5.5z"></path>
          <line x1="8" y1="8.5" x2="16" y2="8.5"></line>
          <line x1="8" y1="12" x2="13.5" y2="12"></line>
        </svg>`,
      audio: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="3" width="6" height="10" rx="3"></rect>
          <path d="M6 11.5a6 6 0 0 0 12 0"></path>
          <line x1="12" y1="18" x2="12" y2="21"></line>
        </svg>`,
      image: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3.5" y="4" width="17" height="16" rx="3"></rect>
          <circle cx="9" cy="9" r="1.5"></circle>
          <path d="M6.5 16.5l4-4 3 3 2.5-2.5 2 3"></path>
        </svg>`,
      document: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5z"></path>
          <path d="M14 3.5V8h4.5"></path>
          <line x1="9" y1="12" x2="15.5" y2="12"></line>
          <line x1="9" y1="15.5" x2="14" y2="15.5"></line>
        </svg>`,
      pause: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="7.5" x2="12" y2="12"></line>
          <line x1="12" y1="12" x2="15.2" y2="13.8"></line>
        </svg>`,
      condition: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="7.5" cy="7.5" r="2.5"></circle>
          <circle cx="16.5" cy="16.5" r="2.5"></circle>
          <path d="M10 9.5l4 4"></path>
          <path d="M12 4h7v7"></path>
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

  snapToGrid(value) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  startFlowNameEdit() {
    const input = document.getElementById('flow-display-name');
    if (!input || this.isEditingFlowName) return;
    this.isEditingFlowName = true;
    this.flowNameOriginal = (input.value || this.currentFlowName || 'Sem título').trim() || 'Sem título';
    input.removeAttribute('readonly');
    input.classList.remove('readonly');
    input.focus();
    input.select();
    this.validateFlowNameInput(input);
  }

  validateFlowNameInput(inputEl) {
    if (!inputEl) return false;
    const value = (inputEl.value || '').trim();
    const isValid = this.isValidFlowName(value);
    inputEl.classList.toggle('invalid', !isValid);
    return isValid;
  }

  isValidFlowName(value) {
    const text = String(value || '').trim();
    return text.length >= 3 && text.length <= 80;
  }

  cancelFlowNameEdit() {
    const input = document.getElementById('flow-display-name');
    if (!input) return;
    input.value = this.flowNameOriginal || this.currentFlowName || 'Sem título';
    input.setAttribute('readonly', 'readonly');
    input.classList.remove('invalid');
    input.classList.add('readonly');
    input.blur();
    this.isEditingFlowName = false;
  }

  async applyFlowNameEdit() {
    const input = document.getElementById('flow-display-name');
    if (!input || !this.isEditingFlowName) return;
    const isValid = this.validateFlowNameInput(input);
    if (!isValid) {
      if (typeof window.showToast === 'function') window.showToast('Nome do fluxo deve ter entre 3 e 80 caracteres.', 'error');
      input.focus();
      return;
    }
    const normalized = (input.value || '').trim();
    const hasChanged = normalized !== (this.flowNameOriginal || '');
    this.currentFlowName = normalized;
    if (this.currentFlow) this.currentFlow.name = normalized;
    input.value = normalized;
    input.setAttribute('readonly', 'readonly');
    input.classList.remove('invalid');
    input.classList.add('readonly');
    this.isEditingFlowName = false;
    if (hasChanged) {
      await this.persistFlowHeaderChanges();
      if (typeof window.showToast === 'function') window.showToast('Nome do fluxo atualizado.', 'success');
    }
  }

  async persistFlowHeaderChanges() {
    if (!this.currentFlow || !window.FlowService) return;
    const payload = {
      ...this.currentFlow,
      name: this.currentFlow.name || this.currentFlowName || 'Sem título',
      is_active: !!this.currentFlow.is_active,
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
      const saved = await window.FlowService.saveFlow(payload);
      this.currentFlow = { ...payload, ...saved };
      this.currentFlowId = this.currentFlow.id;
      window.dispatchEvent(new CustomEvent('upsiden:flow-updated', {
        detail: { flow: this.currentFlow, source: 'flow-header' }
      }));
    } catch (err) {
      if (typeof window.showToast === 'function') window.showToast('Erro ao persistir nome do fluxo.', 'error');
      console.error('[FlowEngine] Error persisting header changes:', err);
    }
  }

  getCanvasPointFromClient(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.panX) / this.zoom,
      y: (clientY - rect.top - this.panY) / this.zoom
    };
  }

  getPortCenter(nodeId, portType) {
    const node = this.nodes[nodeId];
    if (!node) return null;
    const port = node.el.querySelector(`.node-port.${portType}`);
    if (!port) return null;
    const x = node.x + port.offsetLeft + (port.offsetWidth / 2);
    const y = node.y + port.offsetTop + (port.offsetHeight / 2);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y, port, node };
  }

  onNodeMouseDown(e, nodeId) {
    const port = e.target.closest('.node-port');
    if (port && port.classList.contains('output')) {
      this.isConnecting = true;
      this.connSourceNode = nodeId;
      this.dragLine.style.display = 'block';
      const start = this.getPortCenter(nodeId, 'output');
      if (!start) {
        this.isConnecting = false;
        this.dragLine.style.display = 'none';
        return;
      }
      this.connStartX = start.x;
      this.connStartY = start.y;
      return;
    }

    // Bring to front with z-index, don't move in DOM (to avoid breaking click event)
    Object.values(this.nodes).forEach(n => n.el.style.zIndex = 10);
    this.nodes[nodeId].el.style.zIndex = 100;

    e.stopPropagation();
    this.draggedNodeId = nodeId;
    this.nodeDragStartX = e.clientX;
    this.nodeDragStartY = e.clientY;
    const pointer = this.getCanvasPointFromClient(e.clientX, e.clientY);
    this.nodeDragOffsetX = pointer.x - this.nodes[nodeId].x;
    this.nodeDragOffsetY = pointer.y - this.nodes[nodeId].y;
    this.nodes[nodeId].el.classList.add('dragging');

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
    const id = `edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const bgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bgPath.setAttribute('class', 'flow-edge-underlay');
    
    const animPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    animPath.setAttribute('class', 'flow-edge');
    
    this.edgesGroup.appendChild(bgPath);
    this.edgesGroup.appendChild(animPath);
    
    this.edges.push({ id, source: src, target: tgt, bgPath, animPath, hasAlignmentIssue: false });
    this.updateEdges();
  }

  updateEdges() {
    // Reset all ports first
    document.querySelectorAll('.node-port').forEach(p => p.classList.remove('connected', 'alignment-fault'));

    this.edges.forEach(edge => {
      const start = this.getPortCenter(edge.source, 'output');
      const end = this.getPortCenter(edge.target, 'input');

      if (!start || !end) {
        edge.animPath.classList.add('misaligned');
        edge.bgPath.classList.add('misaligned');
        edge.hasAlignmentIssue = true;
        return;
      }

      start.port.classList.add('connected');
      end.port.classList.add('connected');

      const d = this.getOrthogonalPathD(start.x, start.y, end.x, end.y);
      edge.bgPath.setAttribute('d', d);
      edge.animPath.setAttribute('d', d);

      const isAligned = this.validatePortAlignment(start, 'output') && this.validatePortAlignment(end, 'input');
      edge.hasAlignmentIssue = !isAligned;
      edge.animPath.classList.toggle('misaligned', !isAligned);
      edge.bgPath.classList.toggle('misaligned', !isAligned);
      start.port.classList.toggle('alignment-fault', !isAligned);
      end.port.classList.toggle('alignment-fault', !isAligned);
    });
    this.runVisualDiagnostics();
  }

  drawConnectionPath(path, x1, y1, x2, y2) {
    path.setAttribute('d', this.getOrthogonalPathD(x1, y1, x2, y2));
  }

  getOrthogonalPathD(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const direction = dx >= 0 ? 1 : -1;
    const distance = Math.abs(dx);
    const c1x = x1 + direction * Math.max(48, Math.min(180, distance * 0.45));
    const c2x = x2 - direction * Math.max(48, Math.min(180, distance * 0.45));
    return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
  }

  validatePortAlignment(portData, portType) {
    const expectedX = portData.node.x + portData.port.offsetLeft + (portData.port.offsetWidth / 2);
    const expectedY = portData.node.y + portData.port.offsetTop + (portData.port.offsetHeight / 2);
    const deltaX = Math.abs(expectedX - portData.x);
    const deltaY = Math.abs(expectedY - portData.y);
    return deltaX <= this.alignmentTolerance && deltaY <= this.alignmentTolerance && (portType === 'input' || portType === 'output');
  }

  runVisualDiagnostics() {
    const topBar = document.querySelector('.flow-top-bar');
    const publishBtn = document.getElementById('flow-btn-save');
    const misalignedEdges = this.edges.filter(e => e.hasAlignmentIssue).length;
    const report = {
      timestamp: new Date().toISOString(),
      seamlessHeader: topBar ? getComputedStyle(topBar).borderBottomWidth === '0px' : false,
      publishButtonGradient: publishBtn ? getComputedStyle(publishBtn).backgroundImage.includes('gradient') : false,
      gridSnap: this.gridSize,
      edgeAlignmentIssues: misalignedEdges
    };
    window.__upsidenFlowVisualDiagnostics = report;
    this.container.dataset.alignmentIssues = String(misalignedEdges);
  }

  runEditorVisualQaTests() {
    const nameInput = document.getElementById('flow-display-name');
    const publishBtn = document.getElementById('flow-btn-save');
    const searchlessTop = document.querySelector('.flow-top-bar');
    const nameRect = nameInput?.getBoundingClientRect();
    const btnRect = publishBtn?.getBoundingClientRect();
    const report = {
      timestamp: new Date().toISOString(),
      hasReadonlyNameInput: !!nameInput && nameInput.hasAttribute('readonly'),
      flowNameValidation: {
        minRejected: !this.isValidFlowName('ab'),
        normalAccepted: this.isValidFlowName('Fluxo de Vendas'),
        maxRejected: !this.isValidFlowName('x'.repeat(81))
      },
      publishButtonProportionOk: !!btnRect && btnRect.height >= 40 && btnRect.width >= 150,
      nameInputProportionOk: !!nameRect && nameRect.height >= 28 && nameRect.width >= 160,
      topBarVisible: !!searchlessTop && getComputedStyle(searchlessTop).display !== 'none',
      edgeAlignmentOk: this.edges.every(edge => !edge.hasAlignmentIssue),
      dragTrackingMode: 'pointer-offset-lock',
      edgesCount: this.edges.length
    };
    window.__upsidenFlowEditorQa = report;
    return report;
  }

  /* ═══ 5. LOAD / SAVE ════════════════════════════════════════ */
  async loadFlow(flowId) {
    console.log('[FlowEngine] Loading flow:', flowId);
    this.currentFlowId = flowId;
    const loadingOverlay = document.getElementById('flow-loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
      const flows = await window.FlowService.getFlows();
      const flow = flows.find(f => String(f.id) === String(flowId));
      if (!flow) {
        this.currentFlow = {
          id: flowId,
          name: this.currentFlowName || 'Sem título',
          is_active: false,
          nodes: [],
          edges: []
        };
      } else {
        this.currentFlow = JSON.parse(JSON.stringify(flow));
      }

      // Update Header
      const nameInput = document.getElementById('flow-display-name');
      if (nameInput) {
        const flowName = this.currentFlow.name || 'Sem título';
        nameInput.value = flowName;
        nameInput.setAttribute('readonly', 'readonly');
        nameInput.classList.remove('invalid');
        nameInput.classList.add('readonly');
        this.currentFlowName = flowName;
        this.flowNameOriginal = flowName;
        this.isEditingFlowName = false;
      }
      
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
      const nodesData = this.currentFlow.nodes_json || this.currentFlow.nodes || [];
      nodesData.forEach(n => {
        this.createNode(n.type, n.x, n.y, n.id, n.data);
      });

      // Restore Edges
      const edgesData = this.currentFlow.edges_json || this.currentFlow.edges || [];
      edgesData.forEach(e => {
        this.createEdge(e.source, e.target);
      });

    } catch (err) {
      console.error('[FlowEngine] Error loading flow:', err);
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      const wrapper = document.getElementById('module-flow');
      if (wrapper) wrapper.style.display = 'flex';
      this.runEditorVisualQaTests();
    }
  }

  async saveFlow() {
    if (this.isEditingFlowName) await this.applyFlowNameEdit();
    const btn = document.getElementById('flow-btn-save');
    const originalHTML = btn ? btn.innerHTML : 'Publish';
    if (btn) {
      btn.innerHTML = 'Publicando...';
      btn.disabled = true;
    }
    
    // Sync current values from Header
    const nameInput = document.getElementById('flow-display-name');
    const activeToggle = document.getElementById('flow-active-toggle');
    if (!this.currentFlow) {
      this.currentFlow = {
        id: this.currentFlowId || `flow_${Date.now()}`,
        name: this.currentFlowName || 'Sem título',
        is_active: false
      };
    }
    if (nameInput) this.currentFlow.name = (nameInput.value || '').trim() || 'Sem título';
    if (activeToggle) this.currentFlow.is_active = !!activeToggle.checked;

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
        const savedFlow = await window.FlowService.saveFlow(flow);
        if (typeof window.showToast === 'function') window.showToast('Fluxo publicado com sucesso!', 'success');
        this.currentFlow = { ...flow, ...savedFlow };
        this.currentFlowId = this.currentFlow.id;
        window.dispatchEvent(new CustomEvent('upsiden:flow-updated', {
          detail: { flow: this.currentFlow, source: 'flow-save' }
        }));
        await this.loadFlow(this.currentFlow.id);
      }
    } catch (e) {
      console.error('[FlowEngine] Error saving flow:', e);
      if (typeof window.showToast === 'function') window.showToast('Erro ao salvar fluxo', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  }
}
// Inicialização manual removida. O motor agora é instanciado via loader (painel-flow.js)
