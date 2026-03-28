/* =========================================
   Upsiden — Construtor Lógico (Flow Builder)
   Versão B (Vanilla JS)
   ========================================= */

// --- Estado Global ---
let nodes = [];
let edges = [];
let scale = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let startPanX, startPanY;
let isDraggingNode = false;
let draggedNodeId = null;
let offsetNodeX, offsetNodeY;
let isDrawingEdge = false;
let drawingSourceNodeId = null;
let selectedNodeId = null;

let userId = null;

// --- Elementos DOM ---
const viewportInfo = document.getElementById('viewport');
const canvasInfo = document.getElementById('canvas');
const svgLayer = document.getElementById('svg-layer');
const zoomText = document.getElementById('zoom-text');

const inspector = document.getElementById('inspector');
const insTitle = document.getElementById('ins-title');
const insBody = document.getElementById('ins-body');
const btnSaveNode = document.getElementById('btn-save-node');
const btnDeleteNode = document.getElementById('btn-delete-node');
const btnCloseIns = document.getElementById('btn-close-ins');

// --- Inicialização e DB ---
async function initFlow() {
  userId = await UpsidenAuth.getUserId();
  if (!userId) return;

  try {
    const res = await UpsidenDB.from('config_automacao').select('flow_nodes, flow_edges').eq('closer_id', userId).execute();
    const data = res && res.length ? res[0] : null;
    if (data && data.flow_nodes && data.flow_nodes.length > 0) {
      nodes = data.flow_nodes;
      edges = data.flow_edges || [];
    } else {
      // Setup Initial Demo Nodes se vazio
      nodes = [
        { id: 'n1', type: 'trigger', title: 'Gatilho: Olá', x: 200, y: 300, data: { palavra: 'Olá', condicao: 'exata' } },
        { id: 'n2', type: 'action', title: 'Ação: Responder', x: 600, y: 300, data: { resposta: 'Olá! Como posso ajudar?', delay: 2, duracaoSimulacao: 2 } }
      ];
      edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
    }
    renderCanvas();
  } catch(e) { console.error('Flow load error:', e); }
}

function generateId() { return Math.random().toString(36).substr(2, 9); }

// --- Renderização ---
function renderCanvas() {
  // Limpa Nós
  const oldNodes = canvasInfo.querySelectorAll('.node');
  oldNodes.forEach(n => n.remove());

  // Renderiza Nós
  nodes.forEach(n => {
    const el = document.createElement('div');
    el.className = `node type-${n.type} ${selectedNodeId === n.id ? 'selected' : ''}`;
    el.id = `node-${n.id}`;
    el.style.transform = `translate(${n.x}px, ${n.y}px)`;
    
    // Gerar corpo baseado no tipo
    let bodyHtml = '';
    if(n.type === 'trigger') {
      bodyHtml = `Gatilho quando usuário diz:<div class="node-data">"${n.data.palavra || ''}" (${n.data.condicao || 'exata'})</div>`;
    } else if(n.type === 'action') {
      bodyHtml = `Enviar Mensagem:<div class="node-data">${n.data.resposta || '...'}</div>`;
    }

    el.innerHTML = `
      ${n.type === 'action' ? '<div class="handle input" data-nodeid="'+n.id+'"></div>' : ''}
      <div class="node-header">
        <div class="node-title">${n.title}</div>
      </div>
      <div class="node-body">${bodyHtml}</div>
      ${n.type === 'trigger' ? '<div class="handle output" data-nodeid="'+n.id+'"></div>' : ''}
    `;

    // Eventos de Nó
    el.querySelector('.node-header').addEventListener('mousedown', (e) => startDragNode(e, n.id));
    el.addEventListener('dblclick', (e) => openInspector(n.id));
    el.addEventListener('click', (e) => { e.stopPropagation(); selectNode(n.id); });

    // Handles logic for edges
    const outputHandle = el.querySelector('.handle.output');
    if (outputHandle) {
      outputHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isDrawingEdge = true;
        drawingSourceNodeId = n.id;
        createTempEdge(e);
      });
    }
    const inputHandle = el.querySelector('.handle.input');
    if (inputHandle) {
      inputHandle.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        if (isDrawingEdge && drawingSourceNodeId !== n.id) {
          edges.push({ id: generateId(), source: drawingSourceNodeId, target: n.id });
          isDrawingEdge = false;
          renderEdges();
        }
      });
    }

    canvasInfo.appendChild(el);
  });

  renderEdges();
}

function renderEdges() {
  svgLayer.innerHTML = '';
  edges.forEach(edge => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'connection-line');
    path.id = `edge-${edge.id}`;
    
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if(sourceNode && targetNode) {
      // Calcular posições. Cada node tem 260px width e 100~px height
      // Os handles estão nas bordas
      const x1 = sourceNode.x + 260 + 8; // output handle right side
      const y1 = sourceNode.y + 60; // aprox middle of node
      const x2 = targetNode.x - 8; // input handle left side
      const y2 = targetNode.y + 60;
      
      const d = getBezierPath(x1, y1, x2, y2);
      path.setAttribute('d', d);
      
      // Deletar edge on click
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        if(confirm('Excluir conexão?')) {
          edges = edges.filter(ed => ed.id !== edge.id);
          renderEdges();
        }
      });

      svgLayer.appendChild(path);
    }
  });
}

function getBezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// --- Funções de Node / Edge Dragging ---
function startDragNode(e, id) {
  if (e.button !== 0) return; // Só left click
  e.stopPropagation();
  isDraggingNode = true;
  draggedNodeId = id;
  const node = nodes.find(n => n.id === id);
  // Transform mouse coords to canvas coords
  const mouseX = (e.clientX - translateX) / scale;
  const mouseY = (e.clientY - translateY) / scale;
  offsetNodeX = mouseX - node.x;
  offsetNodeY = mouseY - node.y;
  selectNode(id);
}

// Global mouse listeners
window.addEventListener('mousemove', (e) => {
  if (isPanning) {
    translateX = e.clientX - startPanX;
    translateY = e.clientY - startPanY;
    applyTransform();
  }

  if (isDraggingNode && draggedNodeId) {
    const mouseX = (e.clientX - translateX) / scale;
    const mouseY = (e.clientY - translateY) / scale;
    const node = nodes.find(n => n.id === draggedNodeId);
    if(node) {
      node.x = mouseX - offsetNodeX;
      node.y = mouseY - offsetNodeY;
      document.getElementById(`node-${node.id}`).style.transform = `translate(${node.x}px, ${node.y}px)`;
      renderEdges();
    }
  }

  if (isDrawingEdge && drawingSourceNodeId) {
    const sourceNode = nodes.find(n => n.id === drawingSourceNodeId);
    let tempPath = document.getElementById('temp-edge');
    if(!tempPath) {
      tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('class', 'connection-line active');
      tempPath.id = 'temp-edge';
      svgLayer.appendChild(tempPath);
    }
    const x1 = sourceNode.x + 260 + 8;
    const y1 = sourceNode.y + 60;
    const mouseX = (e.clientX - translateX) / scale;
    const mouseY = (e.clientY - translateY) / scale;
    tempPath.setAttribute('d', getBezierPath(x1, y1, mouseX, mouseY));
  }
});

window.addEventListener('mouseup', () => {
  isPanning = false;
  isDraggingNode = false;
  draggedNodeId = null;
  viewportInfo.style.cursor = 'grab';

  if (isDrawingEdge) {
    isDrawingEdge = false;
    const tempEdge = document.getElementById('temp-edge');
    if(tempEdge) tempEdge.remove();
  }
});

function createTempEdge(e) {
  // Helper que inicializa o dom para o edge
  const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tempPath.setAttribute('class', 'connection-line active');
  tempPath.id = 'temp-edge';
  svgLayer.appendChild(tempPath);
}

// --- Pan & Zoom do Canvas ---
viewportInfo.addEventListener('mousedown', (e) => {
  if(e.button === 1 || e.button === 0) { // Click do meio ou clique vazio
    if(e.target.closest('.node')) return; // ignorar se clicou no nó
    isPanning = true;
    startPanX = e.clientX - translateX;
    startPanY = e.clientY - translateY;
    viewportInfo.style.cursor = 'grabbing';
    selectNode(null); // unselect
    closeInspector();
  }
});

viewportInfo.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 0.05;
  const delta = e.deltaY > 0 ? -1 : 1;
  
  // Math para dar zoom no ponteiro do mouse
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  const prevScale = scale;
  
  scale += delta * zoomFactor;
  scale = Math.min(Math.max(0.2, scale), 3); // Limites de zoom
  
  // Adjust translate to zoom into mouse
  translateX = mouseX - ((mouseX - translateX) * (scale / prevScale));
  translateY = mouseY - ((mouseY - translateY) * (scale / prevScale));
  
  applyTransform();
}, { passive: false });

function applyTransform() {
  canvasInfo.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  zoomText.textContent = `${Math.round(scale * 100)}%`;
}

document.getElementById('btn-zoom-in').addEventListener('click', () => { scale = Math.min(scale+0.1, 3); applyTransform(); });
document.getElementById('btn-zoom-out').addEventListener('click', () => { scale = Math.max(scale-0.1, 0.2); applyTransform(); });


// --- Botoes Globais UI ---
document.getElementById('btn-add-trigger').addEventListener('click', () => { // Top bar button
  const id = generateId();
  // Posiciona no centro da tela atual
  const cx = (-translateX + window.innerWidth/2) / scale;
  const cy = (-translateY + window.innerHeight/2) / scale;
  nodes.push({ id, type: 'trigger', title: 'Novo Gatilho', x: cx, y: cy, data: { palavra: '', condicao: 'exata' } });
  renderCanvas();
  openInspector(id);
});

document.getElementById('btn-add-action').addEventListener('click', () => {
  const id = generateId();
  const cx = (-translateX + window.innerWidth/2) / scale;
  const cy = (-translateY + window.innerHeight/2) / scale;
  nodes.push({ id, type: 'action', title: 'Nova Ação', x: cx, y: cy, data: { resposta: '', delay: 2, duracaoSimulacao: 2 } });
  renderCanvas();
  openInspector(id);
});

// --- Inspector Lateral (Offcanvas) ---
function selectNode(id) {
  selectedNodeId = id;
  document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
  if(id) {
    const el = document.getElementById(`node-${id}`);
    if(el) el.classList.add('selected');
  }
}

function openInspector(id) {
  selectNode(id);
  const n = nodes.find(node => node.id === id);
  if(!n) return;

  insTitle.textContent = n.title;
  insBody.innerHTML = '';

  if (n.type === 'trigger') {
    insBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Nome de Exibição do Nó</label>
        <input type="text" class="form-input" id="ins-title-input" value="${n.title}">
      </div>
      <hr style="border:0;border-top:1px solid #2a3942;margin:4px 0;">
      <div class="form-group">
        <label class="form-label">Palavra ou Frase Chave</label>
        <input type="text" class="form-input" id="ins-palavra" value="${n.data.palavra || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Condição</label>
        <select class="form-input" id="ins-condicao">
          <option value="exata" ${n.data.condicao==='exata'?'selected':''}>Frase Exata</option>
          <option value="contem" ${n.data.condicao==='contem'?'selected':''}>Contém na Frase</option>
        </select>
      </div>
    `;
  } else if (n.type === 'action') {
    insBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Nome de Exibição do Nó</label>
        <input type="text" class="form-input" id="ins-title-input" value="${n.title}">
      </div>
      <hr style="border:0;border-top:1px solid #2a3942;margin:4px 0;">
      <div class="form-group">
        <label class="form-label">Texto da Resposta</label>
        <textarea class="form-input form-textarea" id="ins-resposta">${n.data.resposta || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Delay antes de Enviar (segundos)</label>
        <input type="number" class="form-input" id="ins-delay" value="${n.data.delay || 2}">
      </div>
      <div class="form-group">
        <label class="form-label">Simular Digitação (segundos)</label>
        <input type="number" class="form-input" id="ins-simulacao" value="${n.data.duracaoSimulacao || 2}">
      </div>
    `;
  }

  inspector.classList.add('open');
}

function closeInspector() {
  inspector.classList.remove('open');
}

btnCloseIns.addEventListener('click', closeInspector);

btnSaveNode.addEventListener('click', () => {
  if(!selectedNodeId) return;
  const n = nodes.find(node => node.id === selectedNodeId);
  if(!n) return;

  n.title = document.getElementById('ins-title-input').value;

  if (n.type === 'trigger') {
    n.data.palavra = document.getElementById('ins-palavra').value;
    n.data.condicao = document.getElementById('ins-condicao').value;
  } else if (n.type === 'action') {
    n.data.resposta = document.getElementById('ins-resposta').value;
    n.data.delay = parseInt(document.getElementById('ins-delay').value, 10) || 0;
    n.data.duracaoSimulacao = parseInt(document.getElementById('ins-simulacao').value, 10) || 0;
  }

  renderCanvas();
  closeInspector();
});

btnDeleteNode.addEventListener('click', () => {
  if(confirm('Excluir este nó?')) {
    nodes = nodes.filter(n => n.id !== selectedNodeId);
    edges = edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);
    renderCanvas();
    closeInspector();
  }
});


// --- Salvar Flow no Supabase e Sync Background ---
document.getElementById('btn-save-flow').addEventListener('click', async () => {
  if(!userId) return;
  const btn = document.getElementById('btn-save-flow');
  const txtBackup = btn.textContent;
  btn.textContent = 'Salvando...';

  const config = {
    closer_id: userId,
    flow_nodes: nodes,
    flow_edges: edges,
    updated_at: new Date().toISOString()
  };

  try {
    // Nós salvamos uma representação combinada JSON chamada flow_nodes e flow_edges
    // Isso é mais avançado que "Lista de Gatilhos" padrão do v1.
    await UpsidenDB.from('config_automacao').upsert(config).execute();
    
    // Sync to local chrome storage
    chrome.storage.local.set({ ups_config_flow: { nodes, edges } });
    window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');
    
    btn.textContent = 'Vínculos Salvos ✓';
    btn.style.background = '#02c098';
    setTimeout(() => { btn.textContent = txtBackup; btn.style.background = '#00a884'; }, 2000);
  } catch(e) {
    console.error('Erro ao salvar flow', e);
    btn.textContent = 'Erro';
  }
});


// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.body.innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar o Construtor Visual.</p>';
    return;
  }
  
  // Center screen
  translateX = window.innerWidth / 2 - 300;
  translateY = window.innerHeight / 2 - 200;
  applyTransform();

  await initFlow();
});
