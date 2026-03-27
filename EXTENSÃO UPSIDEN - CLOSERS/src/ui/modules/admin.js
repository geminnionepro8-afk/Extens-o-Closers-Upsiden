/* =========================================
   Upsiden — Painel Maestro (Configurações Avançadas)
   ========================================= */

let equipe = [];
let arquivosGlobais = [];
let buscaAtual = '';
let userId = null;

// ======================== TABS ========================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    
    e.target.classList.add('active');
    const tabId = `tab-${e.target.dataset.tab}`;
    const tabEl = document.getElementById(tabId);
    if(tabEl) {
        // Some tabs like regras/matrix need height: 100% and flex
        if(tabId === 'tab-matrix' || tabId === 'tab-regras') {
            tabEl.style.display = 'flex';
            tabEl.style.flexDirection = 'column';
        } else {
            tabEl.style.display = 'block';
        }
    }
  });
});

// ======================== MATRIZ DE HORÁRIOS ========================
let isPainting = false;
let paintMode = true; // true = pintar (ativar), false = apagar
const THE_MATRIX = Array(7).fill(0).map(() => Array(48).fill(false)); // 7 dias * 48 blocos (30min)

function renderMatrixGrid() {
    const container = document.getElementById('time-matrix');
    container.innerHTML = '';
    
    // Header Vazio (canto esc esquerdo)
    const emptyCorner = document.createElement('div');
    emptyCorner.className = 'matrix-header';
    container.appendChild(emptyCorner);
    
    // Headers dos Dias
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    dias.forEach(d => {
        const h = document.createElement('div');
        h.className = 'matrix-header';
        h.textContent = d;
        container.appendChild(h);
    });

    for(let r = 0; r < 48; r++) {
        // Rotulo da hora
        const hora = Math.floor(r / 2);
        const min = r % 2 === 0 ? '00' : '30';
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = `${hora.toString().padStart(2, '0')}:${min}`;
        container.appendChild(label);

        // Celulas
        for(let c = 0; c < 7; c++) {
            const cell = document.createElement('div');
            cell.className = 'time-cell' + (THE_MATRIX[c][r] ? ' active' : '');
            cell.dataset.day = c;
            cell.dataset.row = r;
            
            cell.addEventListener('mousedown', (e) => {
                isPainting = true;
                paintMode = !cell.classList.contains('active');
                toggleCell(cell, c, r, paintMode);
            });
            cell.addEventListener('mouseenter', (e) => {
                if(isPainting) toggleCell(cell, c, r, paintMode);
            });
            
            container.appendChild(cell);
        }
    }
}

function toggleCell(cell, day, row, forceActive) {
    THE_MATRIX[day][row] = forceActive;
    if(forceActive) cell.classList.add('active');
    else cell.classList.remove('active');
}

window.addEventListener('mouseup', () => { isPainting = false; });

document.getElementById('btn-save-matrix').addEventListener('click', async () => {
    try {
        await UpsidenDB.from('config_automacao').upsert({
            closer_id: userId,
            availability_matrix: THE_MATRIX,
            updated_at: new Date().toISOString()
        }).execute();
        
        chrome.storage.local.set({ ups_config_matrix: THE_MATRIX });
        window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');
        
        const btn = document.getElementById('btn-save-matrix');
        btn.textContent = 'Salvo ✓';
        btn.style.background = '#02c098';
        setTimeout(() => { btn.textContent = 'Salvar Matriz'; btn.style.background = '#00a884'; }, 2000);
    } catch(e) { console.error('Error saving matrix', e); }
});

// ======================== REGRAS E SANDBOX ========================
let globalRules = [
    { id: 'gr1', title: 'Bloqueio de Spam', tagsCond: ['Spam', 'Ofensivo'], action: 'Silenciar', blockFlow: true },
    { id: 'gr2', title: 'Roteamento VIP', tagsCond: ['VIP'], action: 'Priorizar Fila', blockFlow: false }
];
let draggedRuleIndex = -1;

function renderGlobalRules() {
    const list = document.getElementById('rules-dnd-list');
    list.innerHTML = '';
    
    globalRules.forEach((rule, idx) => {
        const el = document.createElement('div');
        el.className = 'rule-item';
        el.draggable = true;
        
        el.innerHTML = `
            <div class="rule-handle">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </div>
            <div class="rule-content">
                <div class="rule-header">
                    <div class="rule-title">${rule.title}</div>
                    <div class="rule-priority">P${idx + 1}</div>
                </div>
                <div class="rule-logic">
                    [ SE ] <span class="logic-pill logic-if">Tag IN (${rule.tagsCond.join(',')})</span>
                    [ ENTÃO ] <span class="logic-pill logic-then">${rule.action}</span>
                    ${rule.blockFlow ? ' <span style="color:#f15c6d; font-size:10px; margin-left: 8px;">(Bloqueia Outros Fluxos)</span>' : ''}
                </div>
            </div>
        `;

        el.addEventListener('dragstart', (e) => {
            draggedRuleIndex = idx;
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            document.querySelectorAll('.rule-item').forEach(i => i.classList.remove('drag-over'));
            el.classList.add('drag-over');
        });

        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));

        el.addEventListener('drop', (e) => {
            e.stopPropagation();
            el.classList.remove('drag-over');
            if(draggedRuleIndex !== idx) {
                const item = globalRules.splice(draggedRuleIndex, 1)[0];
                globalRules.splice(idx, 0, item);
                renderGlobalRules();
                saveRulesToDB();
            }
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            document.querySelectorAll('.rule-item').forEach(i => i.classList.remove('drag-over'));
            draggedRuleIndex = -1;
        });

        list.appendChild(el);
    });
}

function saveRulesToDB() {
    // Saves globalRules array order via Supabase
    UpsidenDB.from('config_automacao').upsert({
        closer_id: userId,
        global_rules: globalRules,
        updated_at: new Date().toISOString()
    }).execute();
}

// Emulador Sandbox
document.getElementById('btn-run-sim').addEventListener('click', () => {
    const consoleEl = document.getElementById('sb-console');
    const msg = document.getElementById('sb-msg').value;
    const tags = document.getElementById('sb-tags').value.split(',').map(t => t.trim());
    
    consoleEl.innerHTML += `<div style="color:#fff; margin-top:12px;">➜ Injetando Contexto: [Msg: "${msg}" | Tags: ${tags.join(',')}]</div>`;
    consoleEl.scrollTop = consoleEl.scrollHeight;

    setTimeout(() => {
        let blocked = false;
        // Avaliação Sequencial Top-Down
        globalRules.forEach((rule, idx) => {
            if(blocked) return;
            
            const match = rule.tagsCond.some(rc => tags.includes(rc));
            if(match) {
                consoleEl.innerHTML += `<div>✅ Regra P${idx+1} (${rule.title}) ➔ <span style="color:#53bdeb">MATCH</span>. Ação: ${rule.action}</div>`;
                if(rule.blockFlow) {
                    consoleEl.innerHTML += `<div style="color:#f15c6d;">➜ Interrupção (Short-Circuit) engatilhada pela Regra P${idx+1}. Todos os gatilhos inferiores cancelados.</div>`;
                    blocked = true;
                }
            } else {
                consoleEl.innerHTML += `<div style="color:#8696a0;">❌ Regra P${idx+1} (${rule.title}) ➔ SKIP (False).</div>`;
            }
        });

        if(!blocked) {
            consoleEl.innerHTML += `<div style="color:#00a884;">➜ Fim das Regras Globais. Repassando evento "Receber Msg" para o Motor de Fluxo/Start.</div>`;
        }
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }, 400);
});

// ======================== ADMIN CLASSIC (Equipe/Arquivos) ========================
// (Mantive mos a versao limpa dos fetchers anteriores pra assegurar que nada quebre)
function renderizarEquipe() {
  const lista = document.getElementById('lista-equipe');
  lista.innerHTML = '';
  if (equipe.length === 0) { lista.innerHTML = '<div class="mod-empty">Nenhum membro encontrado.</div>'; return; }
  equipe.forEach(membro => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const roleClass = membro.role === 'admin' ? 'badge-role admin' : 'badge-role';
    card.innerHTML = `<div class="card-info"><div class="card-title">${membro.nome || membro.email.split('@')[0]}</div>
      <div class="card-meta"><span class="${roleClass}">${membro.role || 'Closer'}</span><span>${membro.email}</span></div></div>`;
    lista.appendChild(card);
  });
}

function renderizarArquivos() {
  const lista = document.getElementById('lista-arquivos');
  lista.innerHTML = '';
  const filtrados = arquivosGlobais.filter(arq => {
    const termo = buscaAtual.toLowerCase();
    const dono = equipe.find(e => e.id === arq.criado_por);
    const nomeDono = dono ? (dono.nome || dono.email).toLowerCase() : '';
    return arq.nome.toLowerCase().includes(termo) || nomeDono.includes(termo);
  });

  if (filtrados.length === 0) { lista.innerHTML = '<div class="mod-empty">Nenhum arquivo encontrado.</div>'; return; }
  filtrados.forEach(arq => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const dono = equipe.find(e => e.id === arq.criado_por);
    const nomeDono = dono ? (dono.nome || dono.email.split('@')[0]) : 'Desconhecido';
    
    let tipoIcone = '<'; let tabela = 'audios';
    if (arq.hasOwnProperty('tamanho') && !arq.hasOwnProperty('duracao')) { tipoIcone = '='; tabela = 'documentos'; }
    else if (arq.hasOwnProperty('url')) { tipoIcone = '= '; tabela = 'midias'; }

    const ehCompartilhado = arq.compartilhado === true;
    card.innerHTML = `<div class="card-info"><div class="card-title">${tipoIcone} ${arq.nome}</div>
      <div class="card-meta"><span>Criado por: <strong>${nomeDono}</strong></span><span>"</span><span>Tipo: ${tabela.charAt(0).toUpperCase() + tabela.slice(1)}</span></div></div>
      <div><button class="tog-btn ${ehCompartilhado ? 'on' : ''}" data-id="${arq.id}" data-table="${tabela}" title="Compartilhar com toda a equipe">
      ${ehCompartilhado ? 'Compartilhado' : 'Tornar Global'}</button></div>`;
    lista.appendChild(card);
  });
}

async function carregarDadosAdmin() {
  try {
    const token = await UpsidenAuth.getValidToken();
    const resPerfis = await fetch('https://imxwpacwtphekrbgwbph.supabase.co/rest/v1/profiles?select=*', {
      headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteHdwYWN3dHBoZWtyYmd3YnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDg3NzAsImV4cCI6MjA4OTU4NDc3MH0.4UEhD5nbt-WaEjyJ0pdWx1rgdIFZLnin0lOHaMFAhQE', 'Authorization': `Bearer ${token}` }
    });
    if(resPerfis.ok) equipe = await resPerfis.json();

    const [audios, docs] = await Promise.all([
      UpsidenDB.from('audios').select('*').order('created_at', false).execute(),
      UpsidenDB.from('documentos').select('*').order('created_at', false).execute()
    ]);
    arquivosGlobais = [...(audios || []), ...(docs || [])].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    const confRes = await UpsidenDB.from('config_automacao').select('global_rules, availability_matrix').eq('closer_id', userId).execute();
    if(confRes && confRes.length) {
        if(confRes[0].global_rules) globalRules = confRes[0].global_rules;
        if(confRes[0].availability_matrix) {
            confRes[0].availability_matrix.forEach((colArray, c) => colArray.forEach((val, r) => THE_MATRIX[c][r] = val));
        }
    }

  } catch (error) { console.error('Erro buscar config global', error); }
}

// INIT
document.addEventListener('DOMContentLoaded', async () => {
    userId = await UpsidenAuth.getUserId();
    const isAdmin = await UpsidenAuth.isAdmin();
    
    if (!isAdmin) {
      document.getElementById('restrito-view').style.display = 'flex';
      document.getElementById('tab-equipe').style.display = 'none';
      document.querySelector('.tabs-header').style.display = 'none';
      return;
    }
  
    await carregarDadosAdmin();
    renderizarEquipe();
    renderizarArquivos();
    renderMatrixGrid();
    renderGlobalRules();

    // Defaults for Matrix Tabs Display handling inside DOM elements handled dynamically above.
});
