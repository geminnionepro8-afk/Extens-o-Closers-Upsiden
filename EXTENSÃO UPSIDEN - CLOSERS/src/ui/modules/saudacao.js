/* =========================================
   Upsiden — Saudação Automática Modular
   Versão B (Vanilla JS Drag & Drop UI)
   ========================================= */

// -- Elementos Globais --
const chkAtivo = document.getElementById('chk-ativo');
const chkHorario = document.getElementById('chk-horario');
const containerHorarios = document.getElementById('container-horarios');
const inpHoraInicio = document.getElementById('inp-hora-inicio');
const inpHoraFim = document.getElementById('inp-hora-fim');
const txtMsgFora = document.getElementById('txt-msg-fora');
const btnSalvar = document.getElementById('btn-salvar');

const chkSimularDig = document.getElementById('chk-simular-dig');
const chkApenasPrivado = document.getElementById('chk-apenas-privado');
const chkApenasGrupo = document.getElementById('chk-apenas-grupo');

const timelineContainer = document.getElementById('timeline-container');
const btnAddText = document.getElementById('btn-add-text');
const btnAddAudio = document.getElementById('btn-add-audio');

const wpPreviewContainer = document.getElementById('wp-preview-container');

// -- Estado em Memória --
let userId = null;
let timelineSteps = []; // A união da Saudação principal (index 0) + FollowUps
let dragSourceIndex = -1;

// Observers e Handlers de UI Estática
chkHorario.addEventListener('change', () => {
  containerHorarios.style.display = chkHorario.checked ? 'block' : 'none';
});

// -- Carregamento e Formatação de Dados --
async function carregarConfig() {
  userId = await UpsidenAuth.getUserId();
  if (!userId) return;

  try {
    const results = await UpsidenDB.from('config_automacao')
      .select('*')
      .eq('closer_id', userId)
      .execute();

    const data = results && results.length > 0 ? results[0] : null;
    
    if (data) {
      chkAtivo.checked = data.saudacao_ativa || false;
      chkHorario.checked = data.usar_horario || false;
      inpHoraInicio.value = data.hora_inicio || '09:00';
      inpHoraFim.value = data.hora_fim || '18:00';
      if (data.usar_horario) containerHorarios.style.display = 'block';
      chkSimularDig.checked = data.simular_digitacao !== false;
      chkApenasPrivado.checked = data.apenas_privado || false;
      chkApenasGrupo.checked = data.apenas_grupo || false;
      txtMsgFora.value = data.msg_fora_horario || '';
      
      // Unifica Saudacao(Main) + Followups na Mesma Timeline
      const mainMsg = data.saudacao_mensagem || '';
      timelineSteps = [];
      
      if(mainMsg || (data.followup_steps && data.followup_steps.length > 0)){
        if(mainMsg) timelineSteps.push({ id: generateId(), tipo: 'texto', delay_segundos: 2, duracaoSimulacao: 2, conteudo: mainMsg });
        if(data.followup_steps) {
            data.followup_steps.forEach(f => {
                timelineSteps.push({ 
                    id: generateId(), 
                    tipo: f.tipo, 
                    delay_segundos: f.delay_segundos || 3, 
                    duracaoSimulacao: f.duracaoSimulacao || 3,
                    conteudo: f.conteudo || f.base64 || '' 
                });
            });
        }
      } else {
        // Timeline base por padrão
        timelineSteps.push({ id: generateId(), tipo: 'texto', delay_segundos: 2, duracaoSimulacao: 2, conteudo: 'Olá! Tudo bem? Como posso ajudar?' });
      }
    }

    renderTimeline();
    renderLivePreview();
    sincronizarLocal(data);
  } catch (err) {
    console.error('[Saudação Modular] Erro ao carregar:', err);
  }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// -- Drag and Drop Logic --
function renderTimeline() {
    timelineContainer.innerHTML = '';
    
    timelineSteps.forEach((step, index) => {
        const el = document.createElement('div');
        el.className = 'timeline-item';
        el.draggable = true;
        el.dataset.index = index;
        
        let contentHtml = '';
        if(step.tipo === 'texto') {
            contentHtml = `
                <div class="rt-toolbar">
                    <button class="btn-toolbar" onclick="insertTag(${index}, 'negrito')"><b>B</b></button>
                    <button class="btn-toolbar" onclick="insertTag(${index}, 'italico')"><i>I</i></button>
                    <button class="btn-toolbar" style="color: #00a884;" onclick="insertTag(${index}, 'variavel')">{ Variável }</button>
                </div>
                <textarea class="textarea-msg txt-val" placeholder="Digite a mensagem...">${step.conteudo}</textarea>
            `;
        } else {
            contentHtml = `
                <textarea class="textarea-msg txt-val" style="min-height:40px; font-family:monospace; font-size:12px;" placeholder="Cole o ID da mídia do Supabase Storage ou link...">${step.conteudo}</textarea>
            `;
        }

        const iconPath = step.tipo === 'texto' 
            ? '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h12v2H6zm0 4h8v2H6z"/>'
            : '<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>';

        el.innerHTML = `
            <div class="drag-handle" title="Arrastar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </div>
            <div class="item-content">
                <div class="item-header">
                    <span class="item-type"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle; margin-right: 4px;"><path d="${iconPath}"/></svg> Bloco de ${step.tipo.toUpperCase()}</span>
                    <button class="btn-remove-step" onclick="removeStep(${index})"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                </div>
                ${contentHtml}
                <div class="row-inputs" style="margin-top: 8px; display: flex; gap: 12px;">
                    <div style="flex:1;">
                        <label style="font-size: 11px; color: #8696a0; display:block; margin-bottom:2px;">Atraso antes de enviar (s):</label>
                        <input type="number" class="input-time delay-val" style="width: 100%;" value="${step.delay_segundos}" min="0">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size: 11px; color: #8696a0; display:block; margin-bottom:2px;">Simular ${step.tipo === 'audio' ? 'Gravação' : 'Digitação'} (s):</label>
                        <input type="number" class="input-time sim-val" style="width: 100%;" value="${step.duracaoSimulacao || 3}" min="0">
                    </div>
                </div>
            </div>
        `;

        // Eventos de Drag & Drop
        el.addEventListener('dragstart', (e) => {
            dragSourceIndex = index;
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Remove classe drag-over de todos e adiciona no alvo atual
            document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('drag-over'));
            el.classList.add('drag-over');
        });

        el.addEventListener('dragleave', () => {
            el.classList.remove('drag-over');
        });

        el.addEventListener('drop', (e) => {
            e.stopPropagation();
            el.classList.remove('drag-over');
            
            if (dragSourceIndex !== index) {
                // Sincronizar DOM p/ Estado Mémoria antes do Reorder
                syncDOMtoState();
                
                // Reorder na array
                const draggedItem = timelineSteps[dragSourceIndex];
                timelineSteps.splice(dragSourceIndex, 1);
                timelineSteps.splice(index, 0, draggedItem);
                
                renderTimeline();
                renderLivePreview();
            }
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('drag-over'));
            dragSourceIndex = -1;
        });

        // Eventos de Update para Preview em Tempo Real
        const textInputArea = el.querySelector('.txt-val');
        const delayInput = el.querySelector('.delay-val');
        
        textInputArea.addEventListener('input', () => {
            timelineSteps[index].conteudo = textInputArea.value;
            renderLivePreview();
        });
        
        delayInput.addEventListener('input', () => {
            timelineSteps[index].delay_segundos = parseInt(delayInput.value, 10) || 0;
        });

        const simInput = el.querySelector('.sim-val');
        simInput.addEventListener('input', () => {
            timelineSteps[index].duracaoSimulacao = parseInt(simInput.value, 10) || 0;
        });

        timelineContainer.appendChild(el);
    });
}

function syncDOMtoState() {
    const items = timelineContainer.querySelectorAll('.timeline-item');
    items.forEach((el, idx) => {
        timelineSteps[idx].conteudo = el.querySelector('.txt-val').value;
        timelineSteps[idx].delay_segundos = parseInt(el.querySelector('.delay-val').value, 10) || 0;
        timelineSteps[idx].duracaoSimulacao = parseInt(el.querySelector('.sim-val').value, 10) || 0;
    });
}

// Funções de Ação Rápida no HTML (usada via onclick puro)
window.removeStep = function(index) {
    syncDOMtoState();
    timelineSteps.splice(index, 1);
    renderTimeline();
    renderLivePreview();
};

window.insertTag = function(index, type) {
    syncDOMtoState();
    const txtArea = timelineContainer.querySelectorAll('.timeline-item')[index].querySelector('.txt-val');
    const startPos = txtArea.selectionStart;
    const endPos = txtArea.selectionEnd;
    const currentText = txtArea.value;
    
    let wrapStart = '', wrapEnd = '';
    if(type === 'negrito') { wrapStart = '*'; wrapEnd = '*'; }
    if(type === 'italico') { wrapStart = '_'; wrapEnd = '_'; }
    if(type === 'variavel') { wrapStart = '{nome}'; wrapEnd = ''; }

    const newText = currentText.substring(0, startPos) + wrapStart + currentText.substring(startPos, endPos) + wrapEnd + currentText.substring(endPos);
    
    timelineSteps[index].conteudo = newText;
    renderTimeline();
    renderLivePreview();
};

btnAddText.addEventListener('click', () => {
    syncDOMtoState();
    timelineSteps.push({ id: generateId(), tipo: 'texto', delay_segundos: 2, duracaoSimulacao: 2, conteudo: '' });
    renderTimeline();
    renderLivePreview();
    // Scroll para final
    timelineContainer.scrollTop = timelineContainer.scrollHeight;
});

btnAddAudio.addEventListener('click', () => {
    syncDOMtoState();
    timelineSteps.push({ id: generateId(), tipo: 'audio', delay_segundos: 4, duracaoSimulacao: 5, conteudo: '' });
    renderTimeline();
    renderLivePreview();
    timelineContainer.scrollTop = timelineContainer.scrollHeight;
});


// -- Live Preview Generator --
function formatWhatsAppText(text) {
    if(!text) return '';
    let parsed = text
        .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/~(.*?)~/g, "<del>$1</del>")
        .replace(/\{nome\}/gi, "<span style='color:#53bdeb; background: rgba(83, 189, 235, 0.1); padding: 0 4px; border-radius: 4px;'>João Silva</span>");
    return parsed;
}

function renderLivePreview() {
    wpPreviewContainer.innerHTML = '';
    
    // Bubble Inbound de Cliente Falso
    wpPreviewContainer.innerHTML += `
        <div class="bubble in">
            Olá! Vi o anúncio e tenho interesse.
            <div class="bubble-meta">13:59</div>
        </div>
    `;

    // Bolhas da Automação
    let totalDelayAnimacao = 0;
    let acumuladoMinutos = 14;

    timelineSteps.forEach(step => {
        let contentHtml = '';
        
        if (step.tipo === 'texto') {
            contentHtml = formatWhatsAppText(step.conteudo || '<span style="color:#8696a0;font-style:italic;">Mensagem vazia</span>');
        } else {
            // Audio layout fake
            contentHtml = `
                <div class="bubble-audio">
                    <div class="play-btn"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z"/></svg></div>
                    <div class="audio-waveform">
                        ${Array.from({length: 20}).map(() => `<div class="audio-bar" style="height: ${Math.random() * 100}%"></div>`).join('')}
                    </div>
                </div>
            `;
        }

        // Increment time based on items to simulate flow
        let fakeTime = `14:0${acumuladoMinutos % 10}`;
        if(step.delay_segundos > 10) acumuladoMinutos++;

        wpPreviewContainer.innerHTML += `
            <div class="bubble out" style="animation: dropIn 0.3s ease-out forwards; opacity: 0; animation-delay: ${Math.min(0.5, totalDelayAnimacao)}s">
                ${contentHtml}
                <div class="bubble-meta">
                    ${fakeTime}
                    <svg class="tick" viewBox="0 0 16 16"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.275-8.048a.366.366 0 0 0-.064-.51z"/><path d="M10.457 5.437l-.477-.372a.365.365 0 0 0-.51.063L4.113 11.996a.32.32 0 0 1-.484.033L1.31 9.92b-.143-.13-.362-.12-.485.033l-.378.483a.418.418 0 0 0 .036.541l2.809 2.693c.143.14.361.125.484-.033L10.52 6.007a.366.366 0 0 0-.063-.57z"/></svg>
                </div>
            </div>
        `;
        totalDelayAnimacao += 0.15;
    });

    // Animação CSS inline pro fade
    if (!document.getElementById('wp-anim-style')) {
        const style = document.createElement('style');
        style.id = 'wp-anim-style';
        style.textContent = `
            @keyframes dropIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
}

// -- Salvar Fluxo --
function sincronizarLocal(data) {
  const config = data ? {
    saudacao_ativa: data.saudacao_ativa,
    usar_horario: data.usar_horario,
    hora_inicio: data.hora_inicio,
    hora_fim: data.hora_fim,
    simular_digitacao: data.simular_digitacao !== false,
    apenas_privado: data.apenas_privado || false,
    apenas_grupo: data.apenas_grupo || false,
    msg_fora_horario: data.msg_fora_horario || '',
    saudacao_mensagem: data.saudacao_mensagem,
    followup_steps: data.followup_steps || []
  } : null;
  chrome.storage.local.set({ ups_config_saudacao: config });
  window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');
}

btnSalvar.addEventListener('click', async () => {
  if (!userId) return;
  syncDOMtoState(); // Puxa do HTML p/ Variaveis de Seguranca

  // Segrega Saudacao principal (Step 0 de texto se existir) do resto
  let saudacaoMensagem = '';
  let followups = [];
  
  if(timelineSteps.length > 0) {
      if(timelineSteps[0].tipo === 'texto') {
          saudacaoMensagem = timelineSteps[0].conteudo;
          followups = timelineSteps.slice(1);
      } else {
          followups = timelineSteps;
      }
  }

  // Formatacao correta pros followups pro background controller
  const formatados = followups.map(s => ({
      tipo: s.tipo,
      delay_segundos: s.delay_segundos,
      duracaoSimulacao: s.duracaoSimulacao,
      conteudo: s.tipo === 'texto' ? s.conteudo : '',
      base64: s.tipo !== 'texto' ? s.conteudo : ''
  }));

  const config = {
    closer_id: userId,
    saudacao_ativa: chkAtivo.checked,
    saudacao_mensagem: saudacaoMensagem,
    usar_horario: chkHorario.checked,
    hora_inicio: inpHoraInicio.value,
    hora_fim: inpHoraFim.value,
    simular_digitacao: chkSimularDig.checked,
    simular_gravacao: chkSimularDig.checked, // Usa mesma proxy
    apenas_privado: chkApenasPrivado.checked,
    apenas_grupo: chkApenasGrupo.checked,
    msg_fora_horario: txtMsgFora.value,
    followup_steps: formatados,
    updated_at: new Date().toISOString()
  };

  try {
    await UpsidenDB.from('config_automacao').upsert(config).execute();

    sincronizarLocal(config);

    btnSalvar.textContent = 'Deploy Enviado ✓';
    btnSalvar.style.background = '#02c098';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Fluxo (Deploy)';
      btnSalvar.style.background = '#00a884';
    }, 2000);
  } catch (err) {
    console.error('[Saudação] Erro ao salvar deploy:', err);
    btnSalvar.textContent = 'Erro ao salvar!';
    btnSalvar.style.background = '#dc3545';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Fluxo (Deploy)';
      btnSalvar.style.background = '#00a884';
    }, 2000);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.body.innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para configurar saudação modular.</p>';
    return;
  }
  await carregarConfig();
});
