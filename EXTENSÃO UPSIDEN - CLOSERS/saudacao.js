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

let userId = null;

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
    }

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
