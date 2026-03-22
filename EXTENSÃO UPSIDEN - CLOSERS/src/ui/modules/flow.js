/**
 * @file flow.js
 * @description Engine Vanilla JS para o Canvas Infinito e Drag-and-Drop (Visual Flow Builder).
 * Matemática de Pan, Zoom e Bezier Connections. Estilo RedSun DNA.
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
    
    this.nodes = {}; // Map id -> data
    this.edges = []; // Array of {id, source, target}
    this.nodeCounter = 0;
    this.edgeCounter = 0;
    
    // Connection Drag State
    this.isConnecting = false;
    this.connSourceNode = null;
    this.connStartX = 0;
    this.connStartY = 0;
    
    // Node Drag State
    this.draggedNodeId = null;
    this.nodeDragStartX = 0;
    this.nodeDragStartY = 0;
    
    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.bindPaletteDnD();
    
    const rect = this.container.getBoundingClientRect();
    this.panX = rect.width / 2 - 140;
    this.panY = rect.height / 2 - 100;
    this.updateTransform();
  }

  /* ═══ 1. GLOBAL PAN, ZOOM E MOUSE ═════════════════════════════ */
  bindGlobalEvents() {
    // Zoom (Wheel)
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
    }, { passive: false });

    // Pan / Drag Nodes / Draw Lines
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.flow-node') || e.target.closest('.node-handle')) return;
      
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      this.container.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
      // 1. Panning Canvas
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateTransform();
        return;
      }
      
      // 2. Dragging Node
      if (this.draggedNodeId) {
        const dx = (e.clientX - this.nodeDragStartX) / this.zoom;
        const dy = (e.clientY - this.nodeDragStartY) / this.zoom;
        
        const node = this.nodes[this.draggedNodeId];
        node.x += dx;
        node.y += dy;
        node.el.style.transform = `translate(${node.x}px, ${node.y}px)`;
        
        this.nodeDragStartX = e.clientX;
        this.nodeDragStartY = e.clientY;
        this.updateEdges();
        return;
      }
      
      // 3. Drawing Connection Line
      if (this.isConnecting) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseCanvasX = (e.clientX - rect.left) / this.zoom;
        const mouseCanvasY = (e.clientY - rect.top) / this.zoom;
        this.drawBezier(this.dragLine, this.connStartX, this.connStartY, mouseCanvasX, mouseCanvasY);
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
        
        const dropHandle = e.target.closest('.handle-in');
        if (dropHandle) {
          const targetNodeId = dropHandle.dataset.nodeId;
          if (targetNodeId !== this.connSourceNode) {
            this.createEdge(this.connSourceNode, targetNodeId);
          }
        }
      }
    });
    
    document.getElementById('flow-btn-zoom-in')?.addEventListener('click', () => this.zoomManual(0.1));
    document.getElementById('flow-btn-zoom-out')?.addEventListener('click', () => this.zoomManual(-0.1));
  }

  zoomManual(amount) {
    let newZoom = this.zoom + amount;
    newZoom = Math.min(Math.max(0.3, newZoom), 2);
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.panX = centerX - (centerX - this.panX) * (newZoom / this.zoom);
    this.panY = centerY - (centerY - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.updateTransform();
    this.updateEdges();
  }

  updateTransform() {
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.container.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
    this.container.style.backgroundSize = `${24 * this.zoom}px ${24 * this.zoom}px`;
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
  }

  /* ═══ 2. PALETTE DRAG & DROP ══════════════════════════════════ */
  bindPaletteDnD() {
    const paletteItems = document.querySelectorAll('.palette-node');
    paletteItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/upsiden-node-type', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    this.container.addEventListener('dragover', (e) => {
      e.preventDefault(); // allow drop
      e.dataTransfer.dropEffect = 'copy';
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/upsiden-node-type');
      if (!type) return;
      
      // Calculate drop position relative to canvas
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.zoom;
      const y = (e.clientY - rect.top) / this.zoom;
      
      this.createNode(type, x, y);
    });
  }

  /* ═══ 3. NODE CREATION & DRAGGING ═════════════════════════════ */
  createNode(type, x, y) {
    this.nodeCounter++;
    const id = `node_${this.nodeCounter}`;
    
    const titles = {
      'trigger': '⚡ Gatilho Manual',
      'keyword': '🔑 Palavra-Chave',
      'message': '💬 Enviar Mensagem',
      'audio': '🎵 Enviar Áudio',
      'delay': '⏳ Atraso Inteligente',
      'condition': '🔀 Condição (Se)'
    };

    const el = document.createElement('div');
    el.className = 'flow-node';
    el.dataset.id = id;
    el.dataset.type = type;
    el.style.transform = `translate(${x}px, ${y}px)`;
    
    el.innerHTML = `
      <div class="node-header">
        <div class="node-icon">${titles[type].split(' ')[0]}</div>
        <div class="node-title">${titles[type].substring(2)}</div>
      </div>
      <div class="node-body">
        <div class="node-content-preview">Configure as propriedades...</div>
      </div>
      <div class="node-handle handle-in" data-node-id="${id}" title="Entrada"></div>
      <div class="node-handle handle-out" data-node-id="${id}" title="Saída (Puxe para conectar)"></div>
    `;

    // Remove input handle for triggers
    if (type === 'trigger' || type === 'keyword') {
      el.querySelector('.handle-in').style.display = 'none';
    }

    this.nodesContainer.appendChild(el);
    this.nodes[id] = { id, type, x, y, el, data: {} };

    this.bindNodeInteractions(id, el);
  }

  bindNodeInteractions(id, el) {
    const header = el.querySelector('.node-header');
    
    // Select node
    el.addEventListener('mousedown', (e) => {
      // Remove selected class from all
      Object.values(this.nodes).forEach(n => n.el.classList.remove('selected'));
      el.classList.add('selected');
      // show properties panel logic here later
    });

    // Move node
    header.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.draggedNodeId = id;
      this.nodeDragStartX = e.clientX;
      this.nodeDragStartY = e.clientY;
      // bring to front
      this.nodesContainer.appendChild(el);
    });

    // Start connection
    const handleOut = el.querySelector('.handle-out');
    handleOut.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isConnecting = true;
      this.connSourceNode = id;
      this.dragLine.style.display = 'block';
      
      // Calculate absolute center of the handle in the canvas
      const node = this.nodes[id];
      const hRect = handleOut.getBoundingClientRect();
      const cRect = this.canvas.getBoundingClientRect();
      this.connStartX = (hRect.left + hRect.width/2 - cRect.left) / this.zoom;
      this.connStartY = (hRect.top + hRect.height/2 - cRect.top) / this.zoom;
      
      this.drawBezier(this.dragLine, this.connStartX, this.connStartY, this.connStartX, this.connStartY);
    });
  }

  /* ═══ 4. EDGE CONNECTIONS (BEZIER MATH) ═══════════════════════ */
  createEdge(sourceId, targetId) {
    if (this.edges.some(e => e.source === sourceId && e.target === targetId)) return; // Prevent duplicate
    
    this.edgeCounter++;
    const id = `edge_${this.edgeCounter}`;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('id', id);
    path.setAttribute('class', 'flow-edge');
    path.setAttribute('stroke', 'url(#line-gradient)');
    this.edgesGroup.appendChild(path);
    
    this.edges.push({ id, source: sourceId, target: targetId, pathEl: path });
    this.updateEdges();
  }

  updateEdges() {
    this.edges.forEach(edge => {
      const sourceNode = this.nodes[edge.source];
      const targetNode = this.nodes[edge.target];
      if (!sourceNode || !targetNode) return;

      const sourceHandle = sourceNode.el.querySelector('.handle-out');
      const targetHandle = targetNode.el.querySelector('.handle-in');
      
      const sRect = sourceHandle.getBoundingClientRect();
      const tRect = targetHandle.getBoundingClientRect();
      const cRect = this.canvas.getBoundingClientRect();
      
      const startX = (sRect.left + sRect.width/2 - cRect.left) / this.zoom;
      const startY = (sRect.top + sRect.height/2 - cRect.top) / this.zoom;
      const endX = (tRect.left + tRect.width/2 - cRect.left) / this.zoom;
      const endY = (tRect.top + tRect.height/2 - cRect.top) / this.zoom;
      
      this.drawBezier(edge.pathEl, startX, startY, endX, endY);
    });
  }

  drawBezier(pathEl, x1, y1, x2, y2) {
    // Curvature logic: Control points are pulled horizontally based on distance
    const dist = Math.abs(x2 - x1);
    const curvature = Math.max(dist * 0.4, 40); 
    const cp1x = x1 + curvature;
    const cp1y = y1;
    const cp2x = x2 - curvature;
    const cp2y = y2;
    
    const pathStr = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    pathEl.setAttribute('d', pathStr);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('module-flow')) {
    window.flowEngine = new FlowEngine();
  }
});
