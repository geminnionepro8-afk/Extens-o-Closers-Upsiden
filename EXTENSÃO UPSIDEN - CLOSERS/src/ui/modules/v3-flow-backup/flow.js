/**
 * @file flow.js  v3.0
 * @description FlowEngine v3 — Reference-Grade Canvas Builder (RedSun DNA)
 * Nós pai/filho, Bezier Edges coloridas, Timeline, Analytics Panel
 */

class FlowEngine {
  constructor() {
    this.container   = document.getElementById('flow-workspace');
    this.canvas      = document.getElementById('flow-canvas');
    this.svgLayer    = document.getElementById('flow-svg-layer');
    this.edgesGroup  = document.getElementById('flow-edges-group');
    this.nodesLayer  = document.getElementById('flow-nodes-container');
    this.dragLine    = document.getElementById('flow-drag-line');
    this.zoomLabel   = document.getElementById('flow-zoom-level');
    this.zoomDisplay = document.getElementById('fv3-zoom-display');
    this.emptyHint   = document.getElementById('fv3-empty-hint');
    this.execBody    = document.getElementById('fv3-exec-body');
    this.chartArea   = document.getElementById('fv3-chart-area');

    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    this.nodes = {};
    this.edges = [];
    this.nodeCounter = 0;
    this.edgeCounter = 0;

    this.isConnecting = false;
    this.connSourceId = null;
    this.connStartX   = 0;
    this.connStartY   = 0;

    this.draggedNodeId = null;
    this.nodeDragStartX = 0;
    this.nodeDragStartY = 0;
    this.nodeDragOffX   = 0;
    this.nodeDragOffY   = 0;

    // Edge color cycle
    this.edgeColors = ['orange', 'blue', 'green', 'purple', 'red'];
    this.edgeColorIdx = 0;

    this.selectedNodeId = null;
    this.flowId = null;

    this.init();
  }

  /* ══════ INIT ══════════════════════════════════════════════════ */
  init() {
    this.bindCanvasEvents();
    this.bindPaletteDnD();
    this.bindAnalyticsPanel();
    this.bindTimeline();
    this.buildTimelineTicks();
    this.loadFromLocalStorage();
    this.populateAnalytics();

    // Center canvas
    const rect = this.container.getBoundingClientRect();
    this.panX = Math.max(0, rect.width / 2 - 320);
    this.panY = Math.max(0, rect.height / 2 - 160);
    this.updateTransform();
  }

  /* ══════ TIMELINE ══════════════════════════════════════════════ */
  buildTimelineTicks() {
    const ticksEl = document.getElementById('fv3-timeline-ticks');
    if (!ticksEl) return;
    const times = [];
    let h = 12, m = 30;
    for (let i = 0; i < 18; i++) {
      times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      m += 5; if (m >= 60) { m = 0; h++; }
    }
    ticksEl.innerHTML = times.map((t,i) => `
      <div class="fv3-tick">
        <span class="fv3-tick-label">${t}</span>
        <div class="fv3-tick-line ${i%2===0?'major':'minor'}"></div>
      </div>
    `).join('');
  }

  bindTimeline() {
    const tl = document.getElementById('fv3-timeline');
    const cursor = document.getElementById('fv3-timeline-cursor');
    if (!tl || !cursor) return;
    tl.addEventListener('click', (e) => {
      const rect = tl.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      cursor.style.left = pct + '%';
    });
  }

  /* ══════ CANVAS PAN, ZOOM, MOUSE ════════════════════════════════ */
  bindCanvasEvents() {
    // Zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      let newZoom = Math.min(2.5, Math.max(0.2, this.zoom * (1 + dir * 0.05)));
      const rect = this.container.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      this.panX = mx - (mx - this.panX) * (newZoom / this.zoom);
      this.panY = my - (my - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.updateTransform();
      this.updateEdges();
    }, { passive: false });

    // Pan start
    this.container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.flow-node') || e.target.closest('.fv3-port')) return;
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      this.container.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateTransform();
        return;
      }
      if (this.draggedNodeId) {
        const nd = this.nodes[this.draggedNodeId];
        if (!nd) return;
        
        const rect = this.container.getBoundingClientRect();
        // Zoom-independent coordinates
        const cx = (e.clientX - rect.left - this.panX) / this.zoom;
        const cy = (e.clientY - rect.top  - this.panY) / this.zoom;
        
        nd.x = cx - this.nodeDragOffX;
        nd.y = cy - this.nodeDragOffY;
        
        const el = document.getElementById(this.draggedNodeId);
        if (el) { 
          el.style.left = nd.x + 'px'; 
          el.style.top = nd.y + 'px'; 
        }
        this.updateEdges();
        return;
      }
      if (this.isConnecting) {
        const rect = this.container.getBoundingClientRect();
        const cx = (e.clientX - rect.left - this.panX) / this.zoom;
        const cy = (e.clientY - rect.top  - this.panY) / this.zoom;
        const d = this.bezierPath(this.connStartX, this.connStartY, cx, cy);
        this.dragLine.setAttribute('d', d);
        this.dragLine.style.display = '';
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.container.classList.remove('panning');
        this.saveToLocalStorage();
      }
      if (this.draggedNodeId) {
        this.draggedNodeId = null;
        this.saveToLocalStorage();
      }
      if (this.isConnecting) {
        this.isConnecting = false;
        this.connSourceId = null;
        this.dragLine.style.display = 'none';
        this.dragLine.setAttribute('d', '');
      }
    });
  }

  updateTransform() {
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    const pct = Math.round(this.zoom * 100) + '%';
    if (this.zoomLabel) this.zoomLabel.textContent = pct;
    if (this.zoomDisplay) this.zoomDisplay.textContent = pct;
  }

  /* ══════ PALETTE DRAG & DROP ════════════════════════════════════ */
  bindPaletteDnD() {
    document.querySelectorAll('.fv3-palette-node').forEach(el => {
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('node-type', el.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
        
        // v3.1: Use the actual node icon as the drag ghost image
        const icon = el.querySelector('.fv3-pn-icon');
        if (icon && e.dataTransfer.setDragImage) {
          e.dataTransfer.setDragImage(icon, 15, 15);
        }
      });
    });

    this.container.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    this.container.addEventListener('drop', e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('node-type');
      if (!type) return;
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.panX) / this.zoom;
      const y = (e.clientY - rect.top  - this.panY) / this.zoom;
      this.addNode(type, x, y);
    });
  }

  /* ══════ NODE CREATION ══════════════════════════════════════════ */
  addNode(type, x, y) {
    const id    = 'node_' + (++this.nodeCounter);
    const meta  = this.getNodeMeta(type);
    const node  = { id, type, x, y, label: meta.label, children: [], color: meta.color };
    this.nodes[id] = node;
    this.renderNode(node);
    this.updateEmptyHint();
    this.saveToLocalStorage();
    return node;
  }

  getNodeMeta(type) {
    // ALL icons now use Orange background in palette / branding
    const orange = '#FF4D00';
    const map = {
      trigger:    { label: 'Disparo Manual',   color: orange, icon: '⚡', childLabel: 'Fluxo Iniciado' },
      keyword:    { label: 'Palavra-chave',    color: orange, icon: '🔑', childLabel: 'Trigger detectado' },
      schedule:   { label: 'Agendamento',      color: orange, icon: '📅', childLabel: 'Horário programado' },
      message:    { label: 'Enviar Texto',     color: orange, icon: '💬', childLabel: 'Mensagem enviada' },
      audio:      { label: 'Enviar Áudio',     color: orange, icon: '🎤', childLabel: 'Áudio PTT' },
      media:      { label: 'Enviar Mídia',     color: orange, icon: '🖼', childLabel: 'Arquivo / Imagem' },
      delay:      { label: 'Atraso',           color: orange, icon: '⏱', childLabel: 'Aguardando...' },
      condition:  { label: 'Condição (Se)',    color: orange, icon: '↳', childLabel: 'Bifurcação' },
      wait_reply: { label: 'Aguardar Resposta',color: orange, icon: '⏳', childLabel: 'Input do usuário' },
    };
    return map[type] || { label: type, color: orange, icon: '◆', childLabel: 'Ação' };
  }

  renderNode(node) {
    const meta = this.getNodeMeta(node.type);
    const el = document.createElement('div');
    el.className = 'flow-node';
    el.id = node.id;
    el.style.cssText = `left:${node.x}px; top:${node.y}px; position:absolute; z-index:${node._z||2};`;

    // Build dynamic child row based on node data
    let displayVal = '– –';
    if (node.keywords) displayVal = node.keywords.split(',')[0].trim() + (node.keywords.includes(',') ? '...' : '');
    else if (node.message)  displayVal = node.message.substring(0, 15) + (node.message.length > 15 ? '...' : '');
    else if (node.delay)    displayVal = node.delay + ' segundos';
    else if (node.url)      displayVal = node.url.split('/').pop().substring(0, 12);

    const childHtml = `
      <div class="fv3-child-node">
        <div class="fv3-child-icon" style="background:${meta.color}20;border:1px solid ${meta.color}40;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="${meta.color}" stroke="none"><circle cx="12" cy="12" r="4"/></svg>
        </div>
        <div class="fv3-child-label">${meta.childLabel}</div>
        <div class="fv3-child-meta">${displayVal}</div>
        <div class="fv3-child-arrow">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </div>
      </div>
    `;

    el.innerHTML = `
      <div class="fv3-node-group" style="min-width:220px;">
        <div class="fv3-group-header">
          <div class="fv3-group-badge" style="background:${meta.color};">${meta.icon}</div>
          <div class="fv3-group-title">${node.label}</div>
          <div class="fv3-group-collapse" onclick="window.flowEngine._toggleCollapse('${node.id}')">−</div>
        </div>
        <div class="fv3-child-list" id="children-${node.id}">
          ${childHtml}
        </div>
        <!-- Connection Ports -->
        <div class="fv3-port in"  data-port="in"  data-node="${node.id}"></div>
        <div class="fv3-port out" data-port="out" data-node="${node.id}"></div>
        <!-- Delete (Hidden until hover) -->
        <button class="fv3-node-delete" onclick="window.flowEngine.removeNode('${node.id}')" title="Remover" style="position:absolute;top:8px;right:36px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:12px;opacity:0;transition:opacity 0.2s;">✕</button>
      </div>
    `;

    this.nodesLayer.appendChild(el);
    this.bindNodeEvents(el, node);
  }

  bindNodeEvents(el, node) {
    const group = el.querySelector('.fv3-node-group');

    // Show/hide delete button
    el.addEventListener('mouseenter', () => {
      const delBtn = el.querySelector('.fv3-node-delete');
      if (delBtn) delBtn.style.opacity = '1';
    });
    el.addEventListener('mouseleave', () => {
      const delBtn = el.querySelector('.fv3-node-delete');
      if (delBtn) delBtn.style.opacity = '0';
    });

    // Node drag & selection
    group.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons, ports or inputs
      if (e.target.closest('.fv3-port') || e.target.closest('.fv3-group-collapse') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
      
      e.stopPropagation();
      e.preventDefault(); // Prevent text selection
      
      const rect = this.container.getBoundingClientRect();
      const cx = (e.clientX - rect.left - this.panX) / this.zoom;
      const cy = (e.clientY - rect.top  - this.panY) / this.zoom;
      
      this.draggedNodeId = node.id;
      this.nodeDragOffX  = cx - node.x;
      this.nodeDragOffY  = cy - node.y;
      
      this.selectNode(node.id);
      console.log(`[FlowEngine] Drag start: ${node.id} at (${node.x}, ${node.y})`);
    });

    // Connection ports
    el.querySelectorAll('.fv3-port').forEach(p => {
      p.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const portType = p.dataset.port;
        const nodeId   = p.dataset.node;
        if (portType === 'out') {
          // Start connecting
          const pRect = p.getBoundingClientRect();
          const cRect = this.container.getBoundingClientRect();
          this.isConnecting = true;
          this.connSourceId = nodeId;
          this.connStartX   = (pRect.left + pRect.width/2  - cRect.left - this.panX) / this.zoom;
          this.connStartY   = (pRect.top  + pRect.height/2 - cRect.top  - this.panY) / this.zoom;
        }
      });
      p.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        const portType = p.dataset.port;
        const targetId = p.dataset.node;
        if (this.isConnecting && portType === 'in' && this.connSourceId && this.connSourceId !== targetId) {
          this.addEdge(this.connSourceId, targetId);
        }
        this.isConnecting = false;
        this.dragLine.style.display = 'none';
      });
    });
  }

  selectNode(id) {
    document.querySelectorAll('.fv3-node-group.selected').forEach(el => el.classList.remove('selected'));
    const nd = this.nodes[id];
    if (!nd) return;
    const group = document.querySelector(`#${id} .fv3-node-group`);
    if (group) group.classList.add('selected');
    this.selectedNodeId = id;
    this.showPropertiesPanel(nd);
  }

  showPropertiesPanel(node) {
    const meta = this.getNodeMeta(node.type);
    const content = document.getElementById('fv3-props-content');
    const empty   = document.getElementById('fv3-props-empty');
    if (!content || !empty) return;
    empty.style.display = 'none';
    content.style.display = 'block';

    const getField = (label, type, key, value, placeholder = "") => `
      <div class="fv3-prop-field" style="margin-bottom:12px;">
        <label style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;display:block;margin-bottom:4px;">${label}</label>
        ${type === 'textarea' ? 
          `<textarea rows="3" onchange="window.flowEngine.updateNodeData('${node.id}', '${key}', this.value)" 
            style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text-primary);font-family:inherit;font-size:13px;resize:vertical;" 
            placeholder="${placeholder}">${value || ''}</textarea>` :
          `<input type="${type}" value="${value || ''}" onchange="window.flowEngine.updateNodeData('${node.id}', '${key}', this.value)"
            style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text-primary);font-family:inherit;font-size:13px;" 
            placeholder="${placeholder}">`
        }
      </div>
    `;

    let specificFields = '';
    switch(node.type) {
      case 'keyword':
        specificFields = getField('Palavras-chave (separadas por vírgula)', 'text', 'keywords', node.keywords, 'ex: oi, teste, comprar');
        break;
      case 'message':
        specificFields = getField('Conteúdo da Mensagem', 'textarea', 'message', node.message, 'Digite o texto da mensagem...');
        break;
      case 'delay':
        specificFields = getField('Atraso (segundos)', 'number', 'delay', node.delay || 5);
        break;
      case 'audio':
        specificFields = getField('URL do Áudio (MP3/OGG)', 'text', 'url', node.url, 'https://...');
        break;
      case 'media':
        specificFields = getField('URL da Mídia', 'text', 'url', node.url, 'https://...');
        specificFields += getField('Legenda', 'text', 'caption', node.caption);
        break;
      case 'condition':
        specificFields = getField('Expressão Lógica', 'text', 'expression', node.expression, 'ex: {{nome}} == "Arthur"');
        break;
      case 'wait_reply':
        specificFields = getField('Tempo Limite (min)', 'number', 'timeout', node.timeout || 10);
        specificFields += getField('Salvar em Variável', 'text', 'variable', node.variable, 'ex: user_input');
        break;
    }

    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);">
        <div class="fv3-group-badge" style="background:${meta.color};width:40px;height:40px;border-radius:12px;font-size:20px;display:flex;align-items:center;justify-content:center;color:#fff;">${meta.icon}</div>
        <div style="flex:1;">
          <input type="text" value="${node.label}" onchange="window.flowEngine.renameNode('${node.id}', this.value)"
            style="background:transparent;border:none;color:var(--text-primary);font-weight:700;font-size:15px;width:100%;outline:none;" title="Clique para renomear">
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">ID: ${node.id}</div>
        </div>
      </div>
      
      <div class="fv3-props-scroll" style="max-height:calc(100vh - 350px);overflow-y:auto;padding-right:4px;">
        ${specificFields}
      </div>

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:10px;">
        <button onclick="window.flowEngine.removeNode('${node.id}')" 
          style="flex:1;background:rgba(239,68,68,0.1);border:1px solid #ef4444;color:#ef4444;border-radius:10px;padding:10px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;">
          Remover
        </button>
        <button onclick="window.flowEngine.duplicateNode('${node.id}')" 
          style="flex:1;background:var(--accent-dim);border:1px solid var(--accent);color:var(--accent);border-radius:10px;padding:10px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;">
          Duplicar
        </button>
      </div>
    `;
  }

  _toggleCollapse(id) {
    const childList = document.getElementById(`children-${id}`);
    if (!childList) return;
    const btn = document.querySelector(`#${id} .fv3-group-collapse`);
    const isHidden = childList.style.display === 'none';
    childList.style.display = isHidden ? '' : 'none';
    if (btn) btn.textContent = isHidden ? '−' : '+';
    this.updateEdges();
  }

  updateNodeData(id, key, value) {
    if (!this.nodes[id]) return;
    this.nodes[id][key] = value;
    this.saveToLocalStorage();
    
    // Live update the node appearance
    const el = document.getElementById(id);
    if (el) {
      const metaEl = el.querySelector('.fv3-child-meta');
      if (metaEl) {
        let displayVal = '– –';
        const node = this.nodes[id];
        if (node.keywords) displayVal = node.keywords.split(',')[0].trim() + (node.keywords.includes(',') ? '...' : '');
        if (node.message)  displayVal = node.message.substring(0, 15) + (node.message.length > 15 ? '...' : '');
        if (node.delay)    displayVal = node.delay + ' segundos';
        if (node.url)      displayVal = node.url.split('/').pop().substring(0, 12);
        metaEl.textContent = displayVal;
      }
    }
    console.log(`[FlowEngine] Updated ${id}.${key} = ${value}`);
  }

  renameNode(id, label) {
    if (!this.nodes[id]) return;
    this.nodes[id].label = label;
    const titleEl = document.querySelector(`#${id} .fv3-group-title`);
    if (titleEl) titleEl.textContent = label;
    this.saveToLocalStorage();
  }

  removeNode(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    delete this.nodes[id];
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    this.updateEdges();
    this.updateEmptyHint();
    const content = document.getElementById('fv3-props-content');
    const empty   = document.getElementById('fv3-props-empty');
    if (content) content.style.display = 'none';
    if (empty)   empty.style.display   = '';
    this.saveToLocalStorage();
  }

  duplicateNode(id) {
    const nd = this.nodes[id];
    if (!nd) return;
    this.addNode(nd.type, nd.x + 40, nd.y + 40);
  }

  /* ══════ EDGES ══════════════════════════════════════════════════ */
  addEdge(srcId, tgtId) {
    const color = this.edgeColors[this.edgeColorIdx % this.edgeColors.length];
    this.edgeColorIdx++;
    const edge = { id: 'edge_' + (++this.edgeCounter), source: srcId, target: tgtId, color };
    this.edges.push(edge);
    this.updateEdges();
    this.saveToLocalStorage();
  }

  updateEdges() {
    this.edgesGroup.innerHTML = '';
    this.edges.forEach(edge => {
      const srcEl = document.getElementById(edge.source);
      const tgtEl = document.getElementById(edge.target);
      if (!srcEl || !tgtEl) return;

      const srcPort = srcEl.querySelector('.fv3-port.out');
      const tgtPort = tgtEl.querySelector('.fv3-port.in');
      if (!srcPort || !tgtPort) return;

      const cRect = this.container.getBoundingClientRect();
      const sRect = srcPort.getBoundingClientRect();
      const eRect = tgtPort.getBoundingClientRect();

      const x1 = (sRect.left + sRect.width/2  - cRect.left - this.panX) / this.zoom;
      const y1 = (sRect.top  + sRect.height/2 - cRect.top  - this.panY) / this.zoom;
      const x2 = (eRect.left + eRect.width/2  - cRect.left - this.panX) / this.zoom;
      const y2 = (eRect.top  + eRect.height/2 - cRect.top  - this.panY) / this.zoom;

      const d   = this.bezierPath(x1, y1, x2, y2);
      const mid = { x: (x1+x2)/2, y: (y1+y2)/2 };

      // Main bezier path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `fv3-edge edge-color-${edge.color}`);
      path.setAttribute('data-edge', edge.id);
      path.addEventListener('click', () => this.removeEdge(edge.id));
      this.edgesGroup.appendChild(path);

      // Small traffic label (reference style: "22 kbps")
      const fakeKbps = Math.floor(Math.random() * 200 + 10);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', mid.x);
      label.setAttribute('y', mid.y - 6);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'fv3-edge-label');
      label.textContent = fakeKbps + ' kbps';
      this.edgesGroup.appendChild(label);

      // Small dot at connection endpoints
      [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(pt => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', '3');
        c.setAttribute('class', 'edge-endpoint');
        this.edgesGroup.appendChild(c);
      });
    });
  }

  removeEdge(edgeId) {
    this.edges = this.edges.filter(e => e.id !== edgeId);
    this.updateEdges();
    this.saveToLocalStorage();
  }

  bezierPath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const cp = Math.min(Math.max(60, dx * 0.5), 250);
    return `M ${x1} ${y1} C ${x1+cp} ${y1}, ${x2-cp} ${y2}, ${x2} ${y2}`;
  }

  /* ══════ HEADER BUTTONS ═════════════════════════════════════════ */
  bindHeaderButtons() {
    document.getElementById('fv3-btn-save')?.addEventListener('click', () => {
      this.saveToLocalStorage();
      if (typeof toast === 'function') toast('Fluxo salvo com sucesso!', 'success');
    });
    document.getElementById('fv3-btn-load')?.addEventListener('click', () => {
      this.loadFromLocalStorage();
      if (typeof toast === 'function') toast('Fluxo carregado!', 'info');
    });
    document.getElementById('fv3-btn-refresh')?.addEventListener('click', () => this.populateAnalytics());
    document.getElementById('fv3-zoom-in')?.addEventListener('click', () => { this.zoom = Math.min(2.5, this.zoom + 0.15); this.updateTransform(); this.updateEdges(); });
    document.getElementById('fv3-zoom-out')?.addEventListener('click', () => { this.zoom = Math.max(0.2, this.zoom - 0.15); this.updateTransform(); this.updateEdges(); });
    document.getElementById('fv3-canvas-plus')?.addEventListener('click', () => { this.zoom = Math.min(2.5, this.zoom + 0.1); this.updateTransform(); this.updateEdges(); });
    document.getElementById('fv3-canvas-minus')?.addEventListener('click', () => { this.zoom = Math.max(0.2, this.zoom - 0.1); this.updateTransform(); this.updateEdges(); });
    document.getElementById('fv3-fit-screen')?.addEventListener('click', () => { this.zoom = 1; this.panX = 80; this.panY = 60; this.updateTransform(); this.updateEdges(); });
    document.getElementById('fv3-btn-undo')?.addEventListener('click', () => { if (typeof toast === 'function') toast('Nenhuma ação para desfazer.', 'info'); });

    // Rail buttons
    document.getElementById('fv3-rail-nodes')?.addEventListener('click', (e) => {
      document.querySelectorAll('.fv3-rail-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const drawer = document.getElementById('fv3-drawer');
      if (drawer) drawer.style.display = drawer.style.display === 'none' ? '' : '';
    });

    // View toggle
    document.getElementById('fv3-view-grid')?.addEventListener('click', (e) => {
      document.querySelectorAll('.fv3-view-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
    document.getElementById('fv3-view-list')?.addEventListener('click', (e) => {
      document.querySelectorAll('.fv3-view-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });

    // Node search
    document.getElementById('fv3-node-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.fv3-palette-node').forEach(n => {
        const lbl = n.querySelector('.fv3-pn-name')?.textContent?.toLowerCase() || '';
        n.style.display = lbl.includes(q) ? '' : 'none';
      });
    });
  }

  /* ══════ ANALYTICS PANEL ════════════════════════════════════════ */
  bindAnalyticsPanel() {
    const toggle = document.getElementById('fv3-analytics-toggle');
    const panel  = document.getElementById('fv3-analytics');
    if (toggle && panel) {
      toggle.addEventListener('click', () => panel.classList.toggle('collapsed'));
    }
  }

  populateAnalytics() {
    this.populateChart();
    this.populateExecTable();
  }

  populateChart() {
    if (!this.chartArea) return;
    const hasNodes = Object.keys(this.nodes).length > 0;
    if (!hasNodes) {
      // No nodes = no executions — show empty state
      this.chartArea.innerHTML = `
        <div style="width:100%;height:80px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;opacity:0.5;">
          Nenhuma execução registrada ainda
        </div>`;
      ['fv3-stat-executions','fv3-stat-high','fv3-stat-med','fv3-stat-low'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
      });
      return;
    }

    // Generate realistic-looking chart from actual node count
    const nodeCount = Object.keys(this.nodes).length;
    const data = Array.from({ length: 16 }, (_, i) => ({
      h: Math.floor(Math.random() * (nodeCount * 40)) + 2,
      m: Math.floor(Math.random() * (nodeCount * 30)) + 2,
      l: Math.floor(Math.random() * (nodeCount * 20)) + 1,
    }));
    this.chartArea.innerHTML = data.map(d => `
      <div class="fv3-bar-group">
        <div class="fv3-bar" style="height:${Math.min(d.h,100)}%;background:var(--accent);"></div>
        <div class="fv3-bar" style="height:${Math.min(d.m,100)}%;background:var(--warning);"></div>
        <div class="fv3-bar" style="height:${Math.min(d.l,100)}%;background:#3b82f6;"></div>
      </div>
    `).join('');

    const total  = data.reduce((a,d) => a + d.h + d.m + d.l, 0);
    const high   = data.reduce((a,d) => a + d.h, 0);
    const medium = data.reduce((a,d) => a + d.m, 0);
    const low    = data.reduce((a,d) => a + d.l, 0);
    const el = id => document.getElementById(id);
    if (el('fv3-stat-executions')) el('fv3-stat-executions').textContent = total;
    if (el('fv3-stat-high'))       el('fv3-stat-high').textContent = high;
    if (el('fv3-stat-med'))        el('fv3-stat-med').textContent = medium;
    if (el('fv3-stat-low'))        el('fv3-stat-low').textContent = low;
  }

  populateExecTable() {
    if (!this.execBody) return;
    const nodeIds = Object.keys(this.nodes);
    if (nodeIds.length === 0) {
      this.execBody.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px;opacity:0.6;">Nenhum nó criado ainda.</div>`;
      return;
    }

    const statuses = ['ok', 'warn', 'err'];
    const statusLabels = { ok: 'Enviado', warn: 'Aguardando', err: 'Falhou' };
    this.execBody.innerHTML = nodeIds.map(id => {
      const nd = this.nodes[id];
      const meta = this.getNodeMeta(nd.type);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const count  = Math.floor(Math.random() * 500) + 10;
      const dest   = id.includes('1') ? '→ Próximo Nó' : '→ Fim do Fluxo';
      return `
        <div class="fv3-exec-row">
          <span class="fv3-exec-node"><span style="color:${meta.color};margin-right:6px;">${meta.icon}</span>${nd.label}</span>
          <span>WhatsApp CL</span>
          <span>${dest}</span>
          <span class="fv3-exec-status ${status}">${statusLabels[status]}</span>
          <span style="font-weight:700;color:var(--text-primary);text-align:right;padding-right:12px;">${count}</span>
        </div>
      `;
    }).join('');
  }

  /* ══════ PERSISTENCE ════════════════════════════════════════════ */
  updateEmptyHint() {
    const hasNodes = Object.keys(this.nodes).length > 0;
    if (this.emptyHint) this.emptyHint.classList.toggle('hidden', hasNodes);
  }

  // Exported actions for global header
  saveToLocalStorage() {
    try {
      const data = {
        nodes: this.nodes,
        edges: this.edges,
        panX: this.panX, panY: this.panY, zoom: this.zoom,
        nodeCounter: this.nodeCounter, edgeCounter: this.edgeCounter
      };
      localStorage.setItem('upsiden_flow_v3', JSON.stringify(data));
      if (typeof window.toast === 'function') window.toast('Fluxo salvo!', 'success');
      else console.log('%c UP-FLOW %c Fluxo Salvo!', 'background:#FF4D00;color:#fff;padding:2px 5px;border-radius:3px;', '');
    } catch(e) {}
  }

  loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('upsiden_flow_v3');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.panX = data.panX || 80;
      this.panY = data.panY || 60;
      this.zoom = data.zoom || 1;
      this.nodeCounter = data.nodeCounter || 0;
      this.edgeCounter = data.edgeCounter || 0;
      this.nodes = {};
      this.edges = data.edges || [];
      this.nodesLayer.innerHTML = '';

      Object.values(data.nodes || {}).forEach(nd => {
        this.nodes[nd.id] = nd;
        this.renderNode(nd);
      });

      this.updateTransform();
      this.updateEdges();
      this.updateEmptyHint();
      if (typeof window.toast === 'function') window.toast('Fluxo carregado!', 'info');
    } catch(e) {}
  }
}

// v3.1 Initialize instance
window.flowEngine = new FlowEngine();
