const chkAtivo = document.getElementById('chk-ativo');
const txtMsg = document.getElementById('txt-msg');
const chkHorario = document.getElementById('chk-horario');
const containerHorarios = document.getElementById('container-horarios');
const inpHoraInicio = document.getElementById('inp-hora-inicio');
const inpHoraFim = document.getElementById('inp-hora-fim');
const btnSalvar = document.getElementById('btn-salvar');

const STORAGE_KEY = 'ups_config_saudacao';

// Toggle da exibição dos horários
chkHorario.addEventListener('change', () => {
  containerHorarios.style.display = chkHorario.checked ? 'block' : 'none';
});

// Carregar Dados Salvos
function carregarConfig() {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    const data = res[STORAGE_KEY];
    if (data) {
      chkAtivo.checked = data.ativo || false;
      txtMsg.value = data.mensagem || '';
      chkHorario.checked = data.usarHorario || false;
      inpHoraInicio.value = data.horaInicio || '09:00';
      inpHoraFim.value = data.horaFim || '18:00';
      
      if (data.usarHorario) {
        containerHorarios.style.display = 'block';
      }
    }
  });
}

// Salvar Configurações
btnSalvar.addEventListener('click', () => {
  const config = {
    ativo: chkAtivo.checked,
    mensagem: txtMsg.value,
    usarHorario: chkHorario.checked,
    horaInicio: inpHoraInicio.value,
    horaFim: inpHoraFim.value
  };

  chrome.storage.local.set({ [STORAGE_KEY]: config }, () => {
    btnSalvar.textContent = 'Configurações Salvas ✓';
    btnSalvar.style.background = '#02c098';
    
    // Avisar o script principal recarregar a regra em memória
    window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');

    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Configurações';
      btnSalvar.style.background = '#00a884';
    }, 2000);
  });
});

carregarConfig();
