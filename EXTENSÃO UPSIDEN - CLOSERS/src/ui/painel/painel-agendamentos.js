/**
 * @file painel-agendamentos.js
 * @description Módulo premium de Agendamentos (Red Sun DNA).
 * Gerencia a fila de disparos, persistência no Supabase e visualização em grade.
 */

// CSS Centralizado Red Sun para Agendamentos
const AGEND_CORE_STYLE = `
  <style id="agend-premium-styles">
     .agend-wrapper-rs { display: flex; gap: 24px; min-height: 80vh; flex-wrap: wrap; font-family: 'Outfit', sans-serif; animation: fadeIn 0.4s ease-out; }
     
     /* --- Inputs & Selections (Premium Reset) --- */
     .upx-input, select.upx-input {
        width: 100%; 
        background: var(--bg-input); 
        border: 1px solid var(--border); 
        border-radius: 14px; 
        padding: 14px 18px; 
        color: var(--text-primary); 
        font-family: inherit; 
        font-size: 14.5px; 
        font-weight: 500;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) inset;
        -webkit-appearance: none;
        appearance: none;
     }
     select.upx-input {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 16px center;
        padding-right: 48px;
     }
     .upx-input:focus {
        border-color: var(--accent);
        background: rgba(255, 77, 0, 0.05);
        box-shadow: 0 0 0 4px var(--accent-dim), 0 4px 12px rgba(0,0,0,0.2);
        transform: translateY(-1px);
     }
     .upx-input::placeholder {
        color: var(--text-muted);
        opacity: 0.5;
     }

     /* Date-Time Picker Override */
     input[type="datetime-local"].upx-input::-webkit-calendar-picker-indicator {
        filter: invert(0.6) sepia(1) saturate(5) hue-rotate(340deg);
        cursor: pointer;
        opacity: 0.7;
        transition: 0.2s;
     }
     input[type="datetime-local"].upx-input::-webkit-calendar-picker-indicator:hover {
        filter: invert(0.8) sepia(1) saturate(10) hue-rotate(340deg);
        opacity: 1;
     }

     /* Seletor Segmentado Profissional */
     .segmented-control-rs { 
        display: flex; background: var(--bg-input); padding: 5px; border-radius: 16px; 
        border: 1px solid var(--border); margin-bottom: 28px; position: relative; gap: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
     }
     .segmented-item-rs { 
        flex: 1; padding: 12px 6px; border-radius: 12px; cursor: pointer; text-align: center;
        font-size: 13.5px; font-weight: 700; color: var(--text-muted); transition: all 0.25s;
        display: flex; align-items: center; justify-content: center; gap: 10px; z-index: 2;
     }
     .segmented-item-rs.active { 
        color: #fff; background: var(--accent); 
        box-shadow: var(--shadow-accent); 
        border: 1px solid rgba(255,255,255,0.1); 
     }
     .segmented-item-rs:hover:not(.active) { color: var(--text-secondary); background: rgba(255,255,255,0.05); }
     
     /* Form Elements */
     .form-label-rs { 
        display: flex; align-items: center; gap: 10px; font-size: 11.5px; font-weight: 800; 
        color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.8px; 
        transition: color 0.2s;
     }
     .form-group-rs:focus-within .form-label-rs { color: var(--accent); }
     .form-label-rs svg { color: var(--accent); filter: drop-shadow(0 0 3px var(--accent-glow)); }
     
     /* Calendar Premium Grid */
     .cal-container-rs { 
        background: var(--bg-card); border-radius: 28px; border: 1px solid var(--border); 
        padding: 30px; box-shadow: var(--shadow-lg); 
        position: relative; overflow: hidden;
     }
     .cal-container-rs::after {
        content: ''; position: absolute; top: -100px; right: -100px; width: 200px; height: 200px;
        background: var(--accent-dim); filter: blur(80px); border-radius: 50%; pointer-events: none;
     }
     .cal-header-rs { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
     .cal-grid-rs { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
     
     .cal-day-rs { 
        background: rgba(255,255,255,0.02); backdrop-filter: blur(8px); border: 1px solid var(--border);
        border-radius: 16px; min-height: 95px; padding: 14px; display: flex; flex-direction: column;
        align-items: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default;
     }
     .cal-day-rs:hover { background: rgba(255,255,255,0.07); transform: translateY(-3px) scale(1.02); border-color: var(--text-muted); }
     .cal-day-rs.today { border-color: var(--accent); background: var(--accent-dim); box-shadow: 0 0 20px var(--accent-dim); }
     .cal-day-num { font-size: 15px; font-weight: 800; color: var(--text-muted); margin-bottom: 10px; }
     .cal-day-rs.today .cal-day-num { color: var(--accent); font-size: 18px; }
     
     /* Scheduled Queue Cards */
     .agend-card-rs { 
        background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 18px; 
        padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; 
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1); box-shadow: var(--shadow-sm); 
        border-left: 4px solid var(--accent);
     }
     .agend-card-rs:hover { transform: translateX(8px); border-color: var(--accent); box-shadow: var(--shadow-md); }
     .agend-info-rs { display: flex; flex-direction: column; gap: 6px; }
     .agend-target-rs { font-size: 16px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
     .agend-meta-rs { font-size: 12.5px; color: var(--text-muted); display: flex; align-items: center; gap: 14px; }
     
     .status-pill-rs { font-size: 10.5px; font-weight: 800; padding: 4px 10px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
     .status-pill-rs.scheduled { background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent-glow); }
     
     .delete-btn-rs { 
        width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--danger-dim); 
        background: transparent; color: var(--danger); cursor: pointer; display: flex; 
        align-items: center; justify-content: center; transition: all 0.2s;
     }
     .delete-btn-rs:hover { background: var(--danger); color: white; border-color: var(--danger); transform: scale(1.1); box-shadow: 0 4px 12px var(--danger-dim); }

     /* --- Premium Buttons Overrides --- */
     .agend-wrapper-rs .btn-primary {
        background: linear-gradient(135deg, var(--accent) 0%, #ff6b00 100%);
        border: none;
        color: white;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-size: 14px;
        padding: 16px;
        border-radius: 14px;
        box-shadow: 0 10px 25px rgba(255, 77, 0, 0.3), 0 4px 10px rgba(0,0,0,0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
     }
     .agend-wrapper-rs .btn-primary:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 15px 35px rgba(255, 77, 0, 0.4), 0 6px 15px rgba(0,0,0,0.3);
        filter: brightness(1.1);
     }
     .agend-wrapper-rs .btn-primary:active {
        transform: translateY(-1px) scale(0.98);
     }
     .agend-wrapper-rs .btn-secondary {
        background: var(--bg-input);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        font-weight: 700;
        border-radius: 12px;
        transition: all 0.2s;
     }
     .agend-wrapper-rs .btn-secondary:hover {
        background: var(--bg-card-hover);
        border-color: var(--text-muted);
        color: var(--text-primary);
     }

     @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  </style>
`;

window.renderAgendamentos = async function(c) {
  const main = c || document.getElementById('main-content');
  
  main.innerHTML = AGEND_CORE_STYLE + `
    <div class="agend-wrapper-rs">
      <!-- Coluna Esquerda: Formulário -->
      <div class="panel-card" style="flex: 1; min-width: 340px; max-width: 420px; border-radius: 20px;">
        <h2 style="margin-top:0; margin-bottom:24px; font-weight:800; font-size:22px; display:flex; align-items:center; gap:10px;">
           <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--accent)" fill="none" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
           Programar Disparo
        </h2>
        
        <div class="segmented-control-rs">
           <div class="segmented-item-rs active" data-value="contato">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Individual</span>
           </div>
           <div class="segmented-item-rs" data-value="grupo">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Grupos</span>
           </div>
           <div class="segmented-item-rs" data-value="status">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
              <span>Status</span>
           </div>
        </div>
        <input type="hidden" id="agend-alvo-val" value="contato">

        <div id="wrapper-contato">
           <div class="form-group-rs">
             <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>ID do WhatsApp</label>
             <input type="text" id="agend-numero" placeholder="Ex: 5511999999999" class="upx-input">
           </div>
           <div class="form-group-rs" style="margin-top:20px;">
             <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Nome do Contato</label>
             <input type="text" id="agend-nome" placeholder="Ex: João Silva" class="upx-input">
           </div>
        </div>

        <div id="wrapper-grupo" style="display:none;">
           <div class="form-group-rs">
             <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>Selecionar Grupo</label>
             <select id="agend-grupo-select" class="upx-input"><option value="">Buscando grupos...</option></select>
           </div>
        </div>

        <div id="wrapper-status" style="display:none;">
           <div class="form-group-rs">
             <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Privacidade Status</label>
             <select id="agend-status-privacy" class="upx-input">
               <option value="contacts">Contatos</option>
               <option value="contactBlacklist">Exceto...</option>
               <option value="contactWhitelist">Somente...</option>
             </select>
           </div>
        </div>

        <div class="form-group-rs" style="margin-top:24px;">
           <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Data e Hora</label>
           <input type="datetime-local" id="agend-data" class="upx-input">
        </div>

        <div class="form-group-rs" style="margin-top:24px;">
           <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>Recorrência</label>
           <select id="agend-recorrencia" class="upx-input">
             <option value="nenhuma">Único</option>
             <option value="diaria">Diário</option>
             <option value="semanal">Semanal</option>
             <option value="mensal">Mensal</option>
           </select>
        </div>

        <div class="form-group-rs" style="margin-top:24px;">
           <label class="form-label-rs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Tipo de Conteúdo</label>
           <select id="agend-tipo" class="upx-input">
             <option value="texto">Texto</option>
             <option value="audio">Áudio</option>
             <option value="documento">Arquivo</option>
           </select>
        </div>

        <div id="agend-conteudo-wrapper" style="margin-top:20px;">
           <div class="form-group-rs">
             <textarea id="agend-texto" rows="5" placeholder="Sua mensagem..." class="upx-input" style="resize:none; min-height:120px;"></textarea>
           </div>
           <div id="agend-media-wrapper" style="display:none; margin-top:10px;">
             <label class="btn-secondary" style="width:100%; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:12px; padding:18px; border: 2px dashed var(--border); border-radius:14px; font-weight:700;">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Selecionar Mídia Premium
                <input type="file" id="agend-file" style="display:none;">
             </label>
             <div id="agend-file-name" style="font-size:11.5px; color:var(--text-muted); text-align:center; margin-top:10px; font-weight:600;">Nenhum arquivo selecionado.</div>
           </div>
        </div>

        <button id="btn-salvar-agendamento" class="btn-primary" style="width:100%; margin-top:32px;">
           <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
           Agendar Envio Premium
        </button>
      </div>

      <!-- Coluna Direita: Dashboard -->
      <div style="flex: 2; display:flex; flex-direction:column; gap:24px;">
        <div class="cal-container-rs">
           <div class="cal-header-rs">
              <h2 style="margin:0; font-size:20px; font-weight:800; display:flex; align-items:center; gap:10px;">
                 <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 Sua Visão Mensal
              </h2>
              <div style="display:flex; gap:10px; align-items:center;">
                 <button class="btn btn-secondary" style="width:32px; height:32px; padding:0;" onclick="window.mudarMes(-1)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <span id="cal-mes-atual" style="font-weight:800; min-width:120px; text-align:center; text-transform:capitalize;">Mês Atual</span>
                 <button class="btn btn-secondary" style="width:32px; height:32px; padding:0;" onclick="window.mudarMes(1)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
              </div>
           </div>
           <div class="cal-grid-rs" id="cal-grid"></div>
        </div>

        <div class="panel-card" style="flex:1; border-radius: 20px;">
          <h3 style="margin-top:0; margin-bottom:20px; font-weight:800; display:flex; align-items:center; gap:10px;">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path></svg>
             Fila de Próximos Disparos
          </h3>
          <div id="lista-agendamentos" style="display:flex; flex-direction:column; gap:12px;"></div>
        </div>
      </div>
    </div>
  `;

  // --- Lógica do Seletor Segmentado ---
  const segments = document.querySelectorAll('.segmented-item-rs');
  const alvoHidden = document.getElementById('agend-alvo-val');
  const wrappers = {
    contato: document.getElementById('wrapper-contato'),
    grupo: document.getElementById('wrapper-grupo'),
    status: document.getElementById('wrapper-status')
  };

  segments.forEach(seg => {
    seg.addEventListener('click', () => {
       segments.forEach(s => s.classList.remove('active'));
       seg.classList.add('active');
       const val = seg.dataset.value;
       alvoHidden.value = val;
       Object.keys(wrappers).forEach(k => {
          if (wrappers[k]) wrappers[k].style.display = (k === val ? 'block' : 'none');
       });
       
       if (val === 'grupo' && document.getElementById('agend-grupo-select').options.length <= 1) {
          chrome.runtime.sendMessage({ tipo: 'get_groups' }, (res) => {
             const sel = document.getElementById('agend-grupo-select');
             if (res?.grupos && sel) {
                sel.innerHTML = res.grupos.map(g => `<option value="${g.id}">${g.nome}</option>`).join('');
             }
          });
       }
    });
  });

  // --- Lógica de Mídia ---
  const tipoSelect = document.getElementById('agend-tipo');
  const txtArea = document.getElementById('agend-texto');
  const midiaWrap = document.getElementById('agend-media-wrapper');
  const fileLbl = document.getElementById('agend-file-name');
  let base64File = null; let mimeFile = null;

  tipoSelect.addEventListener('change', (e) => {
    const v = e.target.value;
    txtArea.style.display = (v === 'texto' ? 'block' : 'none');
    midiaWrap.style.display = (v === 'texto' ? 'none' : 'block');
  });

  const fileInp = document.getElementById('agend-file');
  if (fileInp) {
    fileInp.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileLbl.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (reData) => {
        mimeFile = file.type;
        base64File = reData.target.result.split(',')[1];
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Salvar Agendamento ---
  document.getElementById('btn-salvar-agendamento').addEventListener('click', async () => {
     const alvo = alvoHidden.value;
     const dt = document.getElementById('agend-data').value;
     if (!dt) return typeof toast === 'function' && toast('Selecione Data e Hora!', 'error');

     let chatId = '';
     let nomeContato = '';

     if (alvo === 'contato') {
        chatId = document.getElementById('agend-numero').value.replace(/\D/g, '');
        if (!chatId) return toast('Número inválido!', 'error');
        chatId += '@c.us';
        nomeContato = document.getElementById('agend-nome').value || chatId.split('@')[0];
     } else if (alvo === 'grupo') {
        const selG = document.getElementById('agend-grupo-select');
        chatId = selG.value;
        nomeContato = selG.options[selG.selectedIndex].text;
     } else {
        chatId = 'status@broadcast';
        nomeContato = 'Status';
     }

     const payload = {
        id: Date.now().toString(),
        chatId,
        nomeContato,
        when: new Date(dt).getTime(),
        tipo: tipoSelect.value,
        conteudo: txtArea.value,
        base64: base64File,
        mime: mimeFile,
        recorrencia: document.getElementById('agend-recorrencia').value
     };

     const btn = document.getElementById('btn-salvar-agendamento');
     btn.textContent = "Agendando...";
     btn.disabled = true;

     UpsidenDB.from('agendamentos').insert({
        id: payload.id,
        chat_id: payload.chatId,
        nome_contato: payload.nomeContato,
        when_ms: payload.when,
        tipo: payload.tipo,
        conteudo: payload.conteudo,
        base64: payload.base64,
        mime: payload.mime,
        recorrencia: payload.recorrencia
     }).execute().then(() => {
        chrome.runtime.sendMessage({ action: 'SET_AGENDAMENTO', payload }, () => {
           btn.disabled = false;
           btn.textContent = "Agendar Envio Premium";
           typeof toast === 'function' && toast('Disparo agendado com sucesso!', 'success');
           refreshAgendamentosList();
        });
     }).catch(err => {
        btn.disabled = false;
        btn.textContent = "Agendar Envio Premium";
        typeof toast === 'function' && toast('Erro: ' + err.message, 'error');
     });
  });

  refreshAgendamentosList();
};

let calMonthOffset = 0;
window.mudarMes = function(offset) {
  calMonthOffset += offset;
  refreshAgendamentosList();
}

async function refreshAgendamentosList() {
  chrome.storage.local.get('ups_agendamentos', (res) => {
     const agends = res.ups_agendamentos || {};
     const items = Object.values(agends).sort((a,b) => a.when - b.when);
     
     // 1. Renderizar Fila
     const listCont = document.getElementById('lista-agendamentos');
     if (!listCont) return;

     if (items.length === 0) {
        listCont.innerHTML = '<div style="background:rgba(255,255,255,0.02); padding:24px; border-radius:12px; text-align:center; color:var(--text-muted); border: 1px dashed var(--border);">Sua fila está vazia.</div>';
     } else {
        listCont.innerHTML = items.map(ai => {
           const d = new Date(ai.when);
           const isMedia = ai.tipo !== 'texto';
           return `
              <div class="agend-card-rs">
                 <div class="agend-info-rs">
                    <div class="agend-target-rs">
                       ${isMedia ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'}
                       ${ai.nomeContato}
                    </div>
                    <div class="agend-meta-rs">
                       <span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${d.toLocaleDateString()} ${d.toLocaleTimeString().slice(0,5)}</span>
                       <span class="status-pill-rs scheduled">Agendado</span>
                    </div>
                 </div>
                 <button class="delete-btn-rs" onclick="window.deletarAgendamento('${ai.id}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                 </button>
              </div>
           `;
        }).join('');
     }

     // 2. Renderizar Calendário
     const gridCont = document.getElementById('cal-grid');
     if (!gridCont) return;

     const dateHoje = new Date();
     const cursorDt = new Date(dateHoje.getFullYear(), dateHoje.getMonth() + calMonthOffset, 1);
     document.getElementById('cal-mes-atual').textContent = cursorDt.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

     const year = cursorDt.getFullYear();
     const month = cursorDt.getMonth();
     const daysInMonth = new Date(year, month + 1, 0).getDate();
     const firstDay = new Date(year, month, 1).getDay();

     let calHTML = '';
     // Headers
     ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(h => {
        calHTML += `<div style="text-align:center; font-size:11px; font-weight:800; color:var(--text-muted); padding-bottom:12px;">${h}</div>`;
     });

     for (let i=0; i < firstDay; i++) calHTML += '<div></div>';

     for (let d=1; d <= daysInMonth; d++) {
        const loopDt = new Date(year, month, d).toDateString();
        const isToday = loopDt === new Date().toDateString();
        const events = items.filter(ai => new Date(ai.when).toDateString() === loopDt);
        
        calHTML += `
           <div class="cal-day-rs ${isToday ? 'today' : ''}">
              <span class="cal-day-num">${d}</span>
              <div style="display:flex; gap:3px; flex-wrap:wrap; justify-content:center;">
                 ${events.slice(0,3).map(() => '<div style="width:6px; height:6px; border-radius:50%; background:var(--accent); box-shadow:0 0 4px var(--accent);"></div>').join('')}
              </div>
           </div>
        `;
     }
     gridCont.innerHTML = calHTML;
  });
}

window.deletarAgendamento = function(id) {
  chrome.storage.local.get('ups_agendamentos', (res) => {
     const agends = res.ups_agendamentos || {};
     const key = Object.keys(agends).find(k => agends[k].id === id);
     if (key) {
        chrome.alarms.clear(key);
        delete agends[key];
        chrome.storage.local.set({ ups_agendamentos: agends }, () => {
           UpsidenDB.from('agendamentos').delete().eq('id', id).execute().catch(console.error);
           typeof toast === 'function' && toast('Agendamento excluído!', 'info');
           refreshAgendamentosList();
        });
     }
  });
}
