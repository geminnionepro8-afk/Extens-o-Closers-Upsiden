/* =========================================
   Upsiden — Saudação Automática (Supabase)
   v2 — Com simulação, delay e horário
   ========================================= */

const chkAtivo = document.getElementById('chk-ativo');
const txtMsg = document.getElementById('txt-msg');
const chkHorario = document.getElementById('chk-horario');
const containerHorarios = document.getElementById('container-horarios');
const inpHoraInicio = document.getElementById('inp-hora-inicio');
const inpHoraFim = document.getElementById('inp-hora-fim');
const btnSalvar = document.getElementById('btn-salvar');

const chkSimularDig = document.getElementById('chk-simular-dig');
const chkSimularGrav = document.getElementById('chk-simular-grav');
const inpDelayMin = document.getElementById('inp-delay-min');
const inpDelayMax = document.getElementById('inp-delay-max');
const chkApenasPrivado = document.getElementById('chk-apenas-privado');
const chkApenasGrupo = document.getElementById('chk-apenas-grupo');
const txtMsgFora = document.getElementById('txt-msg-fora');

// Pipeline Builder
const btnAddFollowup = document.getElementById('btn-add-followup');
const listaFollowup = document.getElementById('lista-followup');

let userId = null;
let followupSteps = [];

chkHorario.addEventListener('change', () => {
  containerHorarios.style.display = chkHorario.checked ? 'block' : 'none';
});

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
      txtMsg.value = data.saudacao_mensagem || '';
      chkHorario.checked = data.usar_horario || false;
      inpHoraInicio.value = data.hora_inicio || '09:00';
      inpHoraFim.value = data.hora_fim || '18:00';
      if (data.usar_horario) containerHorarios.style.display = 'block';
      chkSimularDig.checked = data.simular_digitacao !== false;
      chkSimularGrav.checked = data.simular_gravacao !== false;
      inpDelayMin.value = data.delay_min || 2;
      inpDelayMax.value = data.delay_max || 5;
      chkApenasPrivado.checked = data.apenas_privado || false;
      chkApenasGrupo.checked = data.apenas_grupo || false;
      txtMsgFora.value = data.msg_fora_horario || '';
      followupSteps = data.followup_steps || [];
    }

    renderizarFollowups();
    sincronizarLocal(data);
  } catch (err) {
    console.error('[Saudação] Erro ao carregar:', err);
  }
}

function sincronizarLocal(data) {
  const config = data ? {
    ativo: data.saudacao_ativa,
    mensagem: data.saudacao_mensagem,
    usarHorario: data.usar_horario,
    horaInicio: data.hora_inicio,
    horaFim: data.hora_fim,
    simularDigitacao: data.simular_digitacao !== false,
    simularGravacao: data.simular_gravacao !== false,
    delayMin: data.delay_min || 2,
    delayMax: data.delay_max || 5,
    diasSemana: data.dias_semana || ['seg','ter','qua','qui','sex'],
    msgForaHorario: data.msg_fora_horario || '',
    apenasPrivado: data.apenas_privado || false,
    apenasGrupo: data.apenas_grupo || false,
    followupSteps: data.followup_steps || []
  } : null;
  chrome.storage.local.set({ ups_config_saudacao: config });
  window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');
}

btnSalvar.addEventListener('click', async () => {
  if (!userId) return;

  const config = {
    closer_id: userId,
    saudacao_ativa: chkAtivo.checked,
    saudacao_mensagem: txtMsg.value,
    usar_horario: chkHorario.checked,
    hora_inicio: inpHoraInicio.value,
    hora_fim: inpHoraFim.value,
    simular_digitacao: chkSimularDig.checked,
    simular_gravacao: chkSimularGrav.checked,
    delay_min: parseInt(inpDelayMin.value, 10) || 2,
    delay_max: parseInt(inpDelayMax.value, 10) || 5,
    apenas_privado: chkApenasPrivado.checked,
    apenas_grupo: chkApenasGrupo.checked,
    msg_fora_horario: txtMsgFora.value,
    followup_steps: lerFollowupsDoDOM(),
    updated_at: new Date().toISOString()
  };

  try {
    await UpsidenDB.from('config_automacao').upsert(config).execute();

    sincronizarLocal(config);

    btnSalvar.textContent = 'Configurações Salvas ✓';
    btnSalvar.style.background = '#02c098';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Configurações';
      btnSalvar.style.background = '#00a884';
    }, 2000);
  } catch (err) {
    console.error('[Saudação] Erro ao salvar:', err);
    btnSalvar.textContent = 'Erro ao salvar!';
    btnSalvar.style.background = '#dc3545';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Configurações';
      btnSalvar.style.background = '#00a884';
    }, 2000);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.body.innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para configurar saudação.</p>';
    return;
  }
  await carregarConfig();
});

// """ LOGICA DE FOLLOW-UP PIPELINE """""""""""""""""""""""""""""""""
function renderizarFollowups() {
  listaFollowup.innerHTML = '';
  followupSteps.forEach((step, index) => {
    const el = document.createElement('div');
    el.className = 'followup-item';
    el.style.cssText = 'background: #2a3942; border: 1px solid #374045; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; position:relative;';
    
    el.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 600; color: #00a884; background: #111b21; padding: 2px 6px; border-radius: 4px;">Passo ${index + 1}</span>
        <button class="btn-remove-step" data-index="${index}" style="background:transparent; border:none; color:#f15c6d; cursor:pointer;" title="Remover Passo"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
      </div>
      <div style="display:flex; gap: 8px;">
        <div style="flex:1;">
          <label style="font-size: 11px; color: #8696a0;">Tipo</label>
          <select class="fup-tipo input-time" style="width:100%; padding: 6px;">
            <option value="texto" ${step.tipo === 'texto' ? 'selected' : ''}>Texto</option>
            <option value="audio" ${step.tipo === 'audio' ? 'selected' : ''}>Áudio (Ogg/Ptt)</option>
            <option value="arquivo" ${step.tipo === 'arquivo' ? 'selected' : ''}>Arquivo/Mídia</option>
          </select>
        </div>
        <div style="flex:1;">
          <label style="font-size: 11px; color: #8696a0;">Atraso (segundos)</label>
          <input type="number" class="fup-delay input-time" style="width:100%; padding: 6px;" value="${step.delay_segundos || 3}" min="0">
        </div>
      </div>
      <div>
        <label style="font-size: 11px; color: #8696a0;">Conteúdo (Texto ou ID do Arquivo Base64)</label>
        <textarea class="fup-conteudo textarea-msg" style="min-height: 40px; padding: 6px;">${step.conteudo || step.base64 || ''}</textarea>
      </div>
    `;
    
    el.querySelector('.btn-remove-step').addEventListener('click', (e) => {
      followupSteps.splice(parseInt(e.currentTarget.dataset.index, 10), 1);
      renderizarFollowups();
    });
    
    listaFollowup.appendChild(el);
  });
}

function lerFollowupsDoDOM() {
  const arr = [];
  const items = listaFollowup.querySelectorAll('.followup-item');
  items.forEach(el => {
    const tipo = el.querySelector('.fup-tipo').value;
    const delay = parseInt(el.querySelector('.fup-delay').value, 10) || 0;
    const conteudo = el.querySelector('.fup-conteudo').value;
    arr.push({ tipo, delay_segundos: delay, conteudo: tipo === 'texto' ? conteudo : '', base64: tipo !== 'texto' ? conteudo : '' });
  });
  followupSteps = arr;
  return arr;
}

if(btnAddFollowup) btnAddFollowup.addEventListener('click', () => {
  followupSteps = lerFollowupsDoDOM();
  followupSteps.push({ tipo: 'texto', delay_segundos: 3, conteudo: '' });
  renderizarFollowups();
});
