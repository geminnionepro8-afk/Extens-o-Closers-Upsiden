/**
 * @file painel-automacoes.js
 * @description Renderiza a seção Automações do Painel Upsiden.
 *              Sub-abas: Saudação, Gatilhos, Horário de Funcionamento, Anti-Ban.
 *              Versão: 3.0 — REESTRUTURADO
 *                - Recarga instantânea do Engine ao salvar
 *                - Dropdown de condição (exata/contém) por gatilho
 *                - Suporte multi-palavra (vírgula)
 * @module Módulo 06: UI — Painel (Automações)
 * @date 03/04/2026
 */

// ═══ STATE ═══════════════════════════════════════════════════
window.renderAutomacoes = function(c) {
  if (typeof window.autoSelectedFolder === 'undefined') window.autoSelectedFolder = 'todos';
  if (typeof window.autoSubTab === 'undefined') window.autoSubTab = 'saudacao';
  
  const tabs = [
    { id: 'saudacao', label: 'Saudação' },
    { id: 'gatilhos', label: 'Gatilhos' },
    { id: 'horario', label: 'Horário' },
    { id: 'regras', label: 'Anti-Ban' }
  ];

  let html = `
    <div class="rs-crm-header-wrap" style="margin-bottom: 24px;">
       <div class="rs-controls-row" style="justify-content: flex-start;">
          <div class="selector-group animate-in">
             ${tabs.map(t => {
               const icons = {
                 saudacao: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
                 gatilhos: '<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
                 horario: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                 regras: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
               };
               return `
                 <button class="selector-item ${window.autoSubTab === t.id ? 'active' : ''}" 
                         data-click="switchTab('${t.id}')">
                   ${icons[t.id] || ''}
                   ${t.label}
                 </button>
               `;
             }).join('')}
          </div>
       </div>
    </div>
  `;
  
  if (window.autoSubTab === 'saudacao') {
    html += `<div class="rs-card rs-card-accent animate-in" style="width:100%; padding:32px;">
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
    </div>`;
  } else if (window.autoSubTab === 'gatilhos') {
    html += `
    <div class="auto-container animate-in">
       <aside class="auto-sidebar-rs">
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

       <div class="auto-content-rs">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
             <div>
                <h3 style="font-size:18px; font-weight:800; color:#fff; margin:0;" id="folder-title">Todos os Gatilhos</h3>
                <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Combine palavras-chave para criar fluxos inquebráveis.</p>
             </div>
              <div style="display:flex; gap:12px;">
                <button class="rs-btn-premium" style="background:rgba(255,255,255,0.03); color:white; border:1px solid rgba(255,255,255,0.08); box-shadow:none; padding:10px 20px;" data-click="addTriggerRow()">
                   <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><path d="M12 5v14M5 12h14"/></svg>
                   Novo Gatilho
                </button>
                <button class="rs-btn-plus" data-click="salvarGatilhos()" style="padding:10px 24px;">Salvar Alterações</button>
             </div>
          </div>
          
          <div id="triggers-list" style="display:flex; flex-direction:column; gap:20px;">
             <div class="rs-empty-automations animate-in">
                <div style="width:60px; height:60px; background:rgba(255,255,255,0.03); border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:var(--text-muted);">
                   <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <h4 style="color:#fff; margin:0 0 8px 0; font-weight:800;">Nenhum gatilho nesta pasta</h4>
                <p style="font-size:12px; color:var(--text-muted); margin:0;">Clique em 'Novo Gatilho' para expandir sua inteligência artificial.</p>
             </div>
          </div>
       </div>
    </div>`;
  } else if (window.autoSubTab === 'horario') {
    html += `
    <div class="rs-card rs-card-accent animate-in" style="width:100%; padding:32px; border-left-width:4px;">
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
    </div>`;
  } else if (window.autoSubTab === 'regras') {
    html += `<div class="rs-card rs-card-accent animate-in" style="width:100%; padding:32px;">
      <h3 style="margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:18px; font-weight:800;">Regras de Humanização</h3>
      <p style="text-align:center; font-size:12px; color:var(--text-muted); margin-bottom:24px;">Pausas randômicas entre o envio das mensagens.</p>
      <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:16px; border:1px solid rgba(255,255,255,0.05); margin-bottom:20px;">
         <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
           <div class="form-group" style="margin:0;"><label class="form-label" style="margin-bottom:6px;">Atraso Mínimo (seg)</label><input type="number" class="rs-input" id="regra-min" value="2" style="width:100%; padding:10px;"></div>
           <div class="form-group" style="margin:0;"><label class="form-label" style="margin-bottom:6px;">Atraso Máximo (seg)</label><input type="number" class="rs-input" id="regra-max" value="5" style="width:100%; padding:10px;"></div>
         </div>
      </div>
      <button class="rs-btn-plus" data-click="salvarRegrasGlobais()" style="width:100%; padding:12px;">Aplicar Regras</button>
    </div>`;
  }

  c.innerHTML = html;
  
  if (window.autoSubTab === 'gatilhos') {
    setTimeout(renderFoldersSidebar, 50);
  }
  setTimeout(loadAutomationConfig, 100);
};

// --- FUNÇÕES DE GESTÃO DE PASTAS ---
window.switchAutoFolder = function(id) {
  window.autoSelectedFolder = id;
  const title = document.getElementById('folder-title');
  if (title) title.textContent = id === 'todos' ? 'Todos os Gatilhos' : `Pasta: ${id}`;
  
  document.querySelectorAll('.rs-folder-btn').forEach(b => {
     b.classList.toggle('active', b.getAttribute('data-click').includes(`'${id}'`));
  });

  document.querySelectorAll('.trigger-wrapper').forEach(card => {
     if (id === 'todos') card.style.display = 'flex';
     else card.style.display = card.dataset.pasta === id ? 'flex' : 'none';
  });
};

window.addAutoFolder = function() {
  const nome = prompt("Nome da nova pasta:");
  if (!nome) return;
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  if (folders.includes(nome)) return toast("Esta pasta já existe!", "warning");
  folders.push(nome);
  localStorage.setItem('ups_auto_folders', JSON.stringify(folders));
  renderFoldersSidebar();
  toast("Pasta criada!", "success");
};

window.renderFoldersSidebar = function() {
  const container = document.getElementById('auto-folders-list');
  if (!container) return;
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  
  container.innerHTML = folders.map(f => `
     <button class="rs-folder-btn ${window.autoSelectedFolder === f ? 'active' : ''}" data-click="switchAutoFolder('${f}')">
        <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z"/></svg> ${f}
     </button>
  `).join('');
  
  const cards = document.querySelectorAll('.trigger-wrapper');
  if (document.getElementById('count-all')) document.getElementById('count-all').textContent = cards.length;
};

// ═══ FOLLOWUP ROW (SHARED: Saudação + Gatilhos) ═════════════
window.addFollowupRow = function(containerId, stepObj = {}) {
  const list = document.getElementById(containerId);
  if(!list) return;

  const {
     tipo = 'texto', conteudo = '', base64 = '', url = '', mime = '',
     nome = '', delay_segundos = 3, duracaoSimulacao = 2, sendAs = ''
  } = stepObj;

  const row = document.createElement('div');
  row.className = 'rs-action-row followup-row animate-in';

  row.innerHTML = `
    <div class="rs-step-pill" style="padding: 16px; display:flex; align-items:center; gap:16px; margin-bottom:12px; border-radius:12px; flex-wrap:nowrap; overflow:hidden;">
       
       <div style="display:flex; flex-direction:column; width:130px; flex-shrink:0;">
         <select class="rs-input fup-tipo" style="height:38px; padding:0 10px; font-size:12px; font-weight:700;">
            <option value="texto">Texto Escrito</option>
            <option value="audio">Áudio (PTT)</option>
            <option value="imagem">Mídia/Imagem</option>
            <option value="documento">Documento</option>
         </select>
       </div>

       <div style="flex:1; display:flex; flex-direction:column; gap:8px; min-width:0;">
          <textarea class="rs-input fup-conteudo" rows="2" placeholder="Conteúdo da resposta..." 
                style="width:100%; min-height:46px; height:auto; padding:10px 14px; font-size:13px; resize:vertical; line-height:1.4;">${conteudo}</textarea>
          
          <div class="media-fields" style="display: ${tipo === 'texto' ? 'none' : 'flex'}; gap:10px;">
             <select class="fup-midia-url rs-input" style="height:32px; font-size:11px; padding:0 10px; flex:1; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);"><option value="">-- Selecione a Mídia --</option></select>
             <select class="fup-send-as rs-input fup-send-as-container" style="height:32px; font-size:11px; padding:0 10px; flex:1; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); display:none;"></select>
          </div>
       </div>

       <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.03); padding:0 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); height:38px;">
            <span style="font-size:10px; color:var(--text-muted); font-weight:800;">TIMER:</span>
            <input type="number" class="fup-delay" value="${delay_segundos}" min="0" style="width:36px; background:transparent; border:none; color:#fff; font-weight:800; font-size:14px; outline:none; text-align:center;">
            <span style="font-size:10px; color:var(--text-muted);">s</span>
          </div>
          <button class="btn-remove" title="Remover Etapa" style="background:rgba(241, 92, 109, 0.1); border:1px solid rgba(241, 92, 109, 0.15); color:var(--danger); cursor:pointer; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:all 0.2s;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
       </div>
    </div>
    
    <input type="hidden" class="fup-url" value="${url}">
    <input type="hidden" class="fup-mime" value="${mime}">
    <input type="hidden" class="fup-nome" value="${nome}">
    <input type="hidden" class="fup-base64" value="${base64}">
    <input type="hidden" class="fup-duracao" value="${duracaoSimulacao}">
  `;

  list.appendChild(row);

  const selTipo = row.querySelector('.fup-tipo');
  const selMidia = row.querySelector('.fup-midia-url');
  const selSendAs = row.querySelector('.fup-send-as');
  const sendAsContainer = row.querySelector('.fup-send-as-container');
  const mediaFields = row.querySelector('.media-fields');
  const hiddenUrl = row.querySelector('.fup-url');
  const hiddenMime = row.querySelector('.fup-mime');
  const hiddenNome = row.querySelector('.fup-nome');

  selTipo.value = ['audio', 'imagem', 'video', 'documento', 'midia'].includes(tipo) ? (tipo==='midia'?'documento':tipo) : 'texto';

  row.querySelector('.btn-remove').onclick = () => row.remove();

  const populatarMidias = (tipoAtivo) => {
     selMidia.innerHTML = `<option value="">-- Selecione do Seu Cofre --</option>`;
     selSendAs.innerHTML = '';
     sendAsContainer.style.display = 'none';
     
     if (tipoAtivo === 'texto') {
        mediaFields.style.display = 'none';
        return;
     }
     mediaFields.style.display = 'flex';
     const baseUrl = 'https://imxwpacwtphekrbgwbph.supabase.co/storage/v1/object/public/';
     
     if (tipoAtivo === 'audio') {
        selSendAs.innerHTML = '<option value="ptt">Áudio Gravado na Hora (Voz PTT)</option><option value="audio_play">Música / Faixa Pronta</option><option value="document">Enviar como Arquivo Documento</option>';
        sendAsContainer.style.display = 'block';
        if (sendAs) selSendAs.value = sendAs;

        (painelData?.audios || []).forEach(a => {
           const op = document.createElement('option');
           op.value = baseUrl + 'audios/' + a.storage_path;
           op.dataset.nome = a.nome; op.dataset.mime = a.tipo_mime || 'audio/ogg';
           op.textContent = `${a.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     } else {
        selSendAs.innerHTML = '<option value="nativo">Visual Nativo (Galeria WPP)</option><option value="document">Forçar como Arquivo Documento</option>';
        sendAsContainer.style.display = 'block';
        if (sendAs) selSendAs.value = sendAs;

        (painelData?.midias || []).filter(m => m.tipo && (m.tipo.includes('image') || m.tipo.includes('video'))).forEach(m => {
           const op = document.createElement('option');
           op.value = baseUrl + 'midias/' + m.storage_path;
           op.dataset.nome = m.nome; op.dataset.mime = m.tipo;
           op.textContent = `${m.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
        (painelData?.documentos || []).forEach(d => {
           const op = document.createElement('option');
           op.value = baseUrl + 'documentos/' + d.storage_path;
           op.dataset.nome = d.nome; op.dataset.mime = d.tipo;
           op.textContent = `${d.nome}`;
           if (op.value === url) op.selected = true;
           selMidia.appendChild(op);
        });
     }
  };

  selTipo.onchange = (e) => populatarMidias(e.target.value);
  selMidia.onchange = (e) => {
     hiddenUrl.value = e.target.value;
     if (e.target.options[e.target.selectedIndex]) {
        hiddenMime.value = e.target.options[e.target.selectedIndex].dataset.mime || '';
        hiddenNome.value = e.target.options[e.target.selectedIndex].dataset.nome || '';
     }
  };

  populatarMidias(selTipo.value);
};

// ═══ HELPER: Forçar recarga do Engine ════════════════════════
function forcarReloadEngine() {
  try {
    chrome.runtime.sendMessage({ tipo: 'reload_automation_config' });
  } catch(e) {
    console.warn('[Painel] Falha ao enviar reload para background:', e);
  }
}

// ═══ SALVAR SAUDAÇÃO ════════════════════════════════════════
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
  
  // Salvar no Supabase (silencioso)
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
  
  // Salvar no chrome.storage.local (PRIMÁRIO — dispara storage.onChanged)
  const storageData = { 
    saudacao_ativa: ativo, 
    saudacao_mensagem: msg, 
    apenas_privado: p, 
    apenas_grupo: g, 
    followup_steps: followups 
  };
  chrome.storage.local.set({ ups_config_saudacao: storageData }, () => {
    forcarReloadEngine();
    toast(`Saudação salva com ${followups.length} passo(s) e sincronizada com o WhatsApp!`, 'success');
  });
};

// ═══ SALVAR GATILHOS ════════════════════════════════════════
window.salvarGatilhos = async function() {
  const rows = document.querySelectorAll('.trigger-wrapper');
  const triggers = [];
  rows.forEach(row => {
    const p = row.querySelector('.trigger-palavra')?.value?.trim();
    if (!p) return;
    
    const pst = row.querySelector('.trigger-pasta')?.value || 'Geral';
    const cond = row.querySelector('.trigger-condicao')?.value || 'exata';
    const stepsListParams = [];
    const stepRows = row.querySelectorAll('.followup-row');
    stepRows.forEach(sr => {
        const tp = sr.querySelector('.fup-tipo').value;
        const ct = sr.querySelector('.fup-conteudo').value.trim();
        const dl = Number(sr.querySelector('.fup-delay').value) || 0;
        const dur = Number(sr.querySelector('.fup-duracao').value) || 2;
        const url = sr.querySelector('.fup-url').value;
        const mime = sr.querySelector('.fup-mime').value;
        const nome = sr.querySelector('.fup-nome').value;
        const sendAs = sr.querySelector('.fup-send-as')?.value || '';
        if (ct || url) {
           stepsListParams.push({ 
              tipo: tp, conteudo: ct, delay_segundos: dl, duracaoSimulacao: dur, 
              url: url, mime: mime, nome: nome, sendAs: sendAs 
           });
        }
    });
    
    triggers.push({ 
        palavra: p, 
        resposta: JSON.stringify(stepsListParams), 
        condicao: cond, 
        ativo: true,
        apenas_privado: true,
        pasta: pst
    });
  });
  
  // Supabase (silencioso)
  try {
    await UpsidenDB.from('gatilhos').delete().eq('criado_por', userData.userId);
    for (const t of triggers) {
      await UpsidenDB.from('gatilhos').insert({
        palavra: t.palavra, resposta: t.resposta, condicao: t.condicao,
        ativo: true, criado_por: userData.userId, simular_digitacao: true,
        apenas_privado: true, pasta: t.pasta
      }).execute();
    }
  } catch(e) { /* silent */ }

  // chrome.storage.local (dispara storage.onChanged → Engine recebe instantaneamente)
  chrome.storage.local.set({ ups_config_triggers: triggers }, () => {
    forcarReloadEngine();
    toast(`${triggers.length} gatilho(s) salvo(s) e sincronizado(s) com o WhatsApp!`, 'success');
  });
};

// ═══ ADD TRIGGER ROW ════════════════════════════════════════
window.addTriggerRow = function(palavra='', respostaObj={}, pasta='Geral', condicao='exata') {
  const list = document.getElementById('triggers-list');
  if(!list) return;
  const uid = 'gatilho-fluxo-' + Date.now() + Math.random().toString(36).substring(2,6);

  // Remover empty state se existir
  const emptyState = list.querySelector('.rs-empty-automations');
  if (emptyState) emptyState.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'rs-trigger-card trigger-wrapper animate-in';
  wrapper.dataset.pasta = pasta;

  wrapper.innerHTML = `
    <div class="trigger-header-rs">
       <div class="trigger-title-wrap">
          <div class="trigger-word-label">
             <span>Regra de Ativação (Palavras-chave separadas por vírgula)</span>
             <input type="text" class="trigger-palavra rs-input" placeholder="Ex: preco, valor, comprar" value="${palavra}" 
                    style="font-size:16px; font-weight:700; padding:10px 16px; margin-top:8px; width:100%; min-width:320px;">
          </div>
       </div>
       <div style="display:flex; gap:12px; align-items:center;">
          <div style="text-align:left;">
             <div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Condição</div>
             <select class="trigger-condicao rs-input" style="height:36px; padding:0 12px; font-size:13px; font-weight:600; min-width:120px; cursor:pointer;">
                <option value="exata" ${condicao === 'exata' ? 'selected' : ''}>Exata</option>
                <option value="contem" ${condicao === 'contem' ? 'selected' : ''}>Contém</option>
             </select>
          </div>
          <div style="text-align:left;">
             <div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Pasta do Gatilho</div>
             <select class="trigger-pasta rs-input" style="height:36px; padding:0 12px; font-size:13px; font-weight:600; min-width:140px; cursor:pointer;">
                <!-- Dinâmico -->
             </select>
          </div>
          <div style="display:flex; flex-direction:column; justify-content:flex-end;">
             <div style="height:21px;"></div>
             <div style="display:flex; gap:8px;">
                <button class="rs-btn-premium btn-add-step" style="padding:0 16px; height:36px; font-size:12px; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); box-shadow:none;">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg> Adicionar Ação
                </button>
                <button class="btn-remove-trigger" style="background:rgba(241, 92, 109, 0.1); color:var(--danger); width:36px; height:36px; border-radius:12px; border:1px solid rgba(241, 92, 109, 0.15); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;">
                   <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
             </div>
          </div>
       </div>
    </div>

    
    <div id="${uid}" class="action-flow-container">
       <!-- Followup Rows nested here -->
    </div>
  `;

  list.appendChild(wrapper);

  // Popular seletor de pastas no gatilho
  const selPasta = wrapper.querySelector('.trigger-pasta');
  const folders = JSON.parse(localStorage.getItem('ups_auto_folders') || '["Geral", "Vendas", "Suporte"]');
  selPasta.innerHTML = folders.map(f => `<option value="${f}" ${f === pasta ? 'selected' : ''}>${f}</option>`).join('');

  wrapper.querySelector('.btn-add-step').onclick = () => window.addFollowupRow(uid);
  wrapper.querySelector('.btn-remove-trigger').onclick = () => wrapper.remove();
  if (respostaObj) {
     let steps = [];
     if (typeof respostaObj === 'string') {
        try {
           const parsed = JSON.parse(respostaObj);
           if (Array.isArray(parsed)) steps = parsed;
           else steps = [{ tipo: 'texto', conteudo: respostaObj, delay_segundos: 0, duracaoSimulacao: 2 }];
        } catch(e) {
           steps = [{ tipo: 'texto', conteudo: respostaObj, delay_segundos: 0, duracaoSimulacao: 2 }];
        }
     } else if (Array.isArray(respostaObj)) {
        steps = respostaObj;
     }

     steps.forEach(p => window.addFollowupRow(uid, p));
  } else {
     window.addFollowupRow(uid);
  }
};

// ═══ LOAD CONFIG ════════════════════════════════════════════
window.loadAutomationConfig = async function() {
  const fallbackLocal = () => {
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_horario', 'ups_config_regras'], res => {
      if(window.autoSubTab === 'saudacao' && res.ups_config_saudacao) {
        const s = res.ups_config_saudacao;
        const eMsg = document.getElementById('auto-saudacao'); const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = s.saudacao_mensagem || s.mensagem || '';
        if(eAtivo) eAtivo.checked = s.saudacao_ativa || s.ativo || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = s.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = s.apenas_grupo || false;
        const list = document.getElementById('followups-list');
        if (list) list.innerHTML = '';
        const steps = s.followup_steps || s.followupSteps;
        if (steps && Array.isArray(steps)) {
           steps.forEach(p => window.addFollowupRow('followups-list', p));
        }
      }
      if(window.autoSubTab === 'gatilhos') {
        const triggers = res.ups_config_triggers || [];
        if(!triggers.length) window.addTriggerRow();
        else triggers.forEach(t => window.addTriggerRow(t.palavra, t.resposta, t.pasta || 'Geral', t.condicao || 'exata'));
        setTimeout(renderFoldersSidebar, 100);
      }
      if (window.autoSubTab === 'horario' && res.ups_config_horario) {
        if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = res.ups_config_horario.ini || '08:00';
        if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = res.ups_config_horario.fim || '18:00';
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = res.ups_config_horario.msg || '';
      }
      if (window.autoSubTab === 'regras' && res.ups_config_regras) {
        if(document.getElementById('regra-min')) document.getElementById('regra-min').value = res.ups_config_regras.delayMin || 2;
        if(document.getElementById('regra-max')) document.getElementById('regra-max').value = res.ups_config_regras.delayMax || 5;
      }
    });
  };

  try {
    if (window.autoSubTab === 'saudacao') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        const eMsg = document.getElementById('auto-saudacao');
        const eAtivo = document.getElementById('auto-saudacao-ativo');
        if(eMsg) eMsg.value = data.saudacao_mensagem || '';
        if(eAtivo) eAtivo.checked = data.saudacao_ativa || false;
        if(document.getElementById('auto-privado')) document.getElementById('auto-privado').checked = data.apenas_privado !== false;
        if(document.getElementById('auto-grupo')) document.getElementById('auto-grupo').checked = data.apenas_grupo || false;
        
        const list = document.getElementById('followups-list');
        if (list) list.innerHTML = '';
        if (data.followup_steps) {
           try {
             const passos = typeof data.followup_steps === 'string' ? JSON.parse(data.followup_steps) : data.followup_steps;
             if (Array.isArray(passos)) {
                passos.forEach(p => window.addFollowupRow('followups-list', p));
             }
           } catch(e) {}
        }
      } else {
        fallbackLocal();
      }
    }
    if (window.autoSubTab === 'gatilhos') {
      const resGatilhos = await UpsidenDB.from('gatilhos').select('*').eq('criado_por', userData.userId).order('created_at', { ascending: false });
      const gatilhos = resGatilhos.data || resGatilhos || [];
      if (!gatilhos.length) fallbackLocal();
      else gatilhos.forEach(t => window.addTriggerRow(t.palavra, t.resposta, t.pasta || 'Geral', t.condicao || 'exata'));
      setTimeout(renderFoldersSidebar, 100);
    }
    if (window.autoSubTab === 'horario') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('hora-ini')) document.getElementById('hora-ini').value = data.hora_inicio || '08:00';
        if(document.getElementById('hora-fim')) document.getElementById('hora-fim').value = data.hora_fim || '18:00';
        if(document.getElementById('msg-fechado')) document.getElementById('msg-fechado').value = data.msg_fora_horario || '';
      } else { fallbackLocal(); }
    }
    if (window.autoSubTab === 'regras') {
      const results = await UpsidenDB.from('config_automacao').select('*').eq('closer_id', userData.userId);
      const data = results && results.length > 0 ? results[0] : null;
      if (data) {
        if(document.getElementById('regra-min')) document.getElementById('regra-min').value = data.delay_min || 2;
        if(document.getElementById('regra-max')) document.getElementById('regra-max').value = data.delay_max || 5;
      } else { fallbackLocal(); }
    }
  } catch(e) {
    console.error('[Painel-Automações] Erro ao carregar config:', e);
    fallbackLocal();
  }
};

// ═══ SALVAR HORÁRIO ════════════════════════════════════════
window.salvarHorario = async function() {
  const ini = document.getElementById('hora-ini')?.value || '08:00';
  const fim = document.getElementById('hora-fim')?.value || '18:00';
  const msg = document.getElementById('msg-fechado')?.value?.trim() || '';
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      hora_inicio: ini,
      hora_fim: fim,
      msg_fora_horario: msg,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_horario: { ini, fim, msg } }, () => {
    forcarReloadEngine();
    toast('Horário de atendimento salvo e sincronizado!', 'success');
  });
};

// ═══ SALVAR REGRAS GLOBAIS ═════════════════════════════════
window.salvarRegrasGlobais = async function() {
  const delayMin = Number(document.getElementById('regra-min')?.value) || 2;
  const delayMax = Number(document.getElementById('regra-max')?.value) || 5;
  try {
    await UpsidenDB.from('config_automacao').upsert({
      closer_id: userData.userId,
      delay_min: delayMin,
      delay_max: delayMax,
      updated_at: new Date().toISOString()
    }).execute();
  } catch(e) { /* silent */ }
  chrome.storage.local.set({ ups_config_regras: { delayMin, delayMax } }, () => {
    forcarReloadEngine();
    toast('Regras de humanização salvas e sincronizadas!', 'success');
  });
};
