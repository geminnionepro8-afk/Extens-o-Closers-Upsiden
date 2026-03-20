const inpPalavra = document.getElementById('inp-palavra');
const inpResposta = document.getElementById('inp-resposta');
const rdoCondicoes = document.getElementsByName('condicao');
const btnAdd = document.getElementById('btn-add');
const listaGatilhos = document.getElementById('lista-gatilhos');

const STORAGE_KEY = 'ups_config_triggers';
let triggersVars = [];

function showToast(msg) {
  // Poderiamos usar um toast customizado, mas vamos usar log/alert ou visual feedback no botao por simplicidade
  const btnOriginal = btnAdd.innerHTML;
  btnAdd.innerHTML = `✓ ${msg}`;
  btnAdd.style.background = '#02c098';
  setTimeout(() => {
    btnAdd.innerHTML = btnOriginal;
    btnAdd.style.background = '#00a884';
  }, 2000);
}

function getCondicaoSelecionada() {
  for (const rdo of rdoCondicoes) {
    if (rdo.checked) return rdo.value;
  }
  return 'exata';
}

function renderizarLista() {
  listaGatilhos.innerHTML = '';
  
  if (triggersVars.length === 0) {
    listaGatilhos.innerHTML = '<p style="color:#8696a0; font-size:13px; text-align:center; padding: 20px 0;">Nenhum gatilho configurado ainda.</p>';
    return;
  }

  triggersVars.forEach((trig, index) => {
    const el = document.createElement('div');
    el.className = 'gatilho-item';
    
    const labelCondicao = trig.condicao === 'exata' ? 'Frase Exata' : 'Contém na Frase';
    
    el.innerHTML = `
      <div class="gatilho-header">
        <span class="gatilho-keyword">"${trig.palavra}"</span>
        <button class="btn-remover" data-index="${index}" title="Remover Gatilho">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
      <span class="gatilho-condicao">${labelCondicao}</span>
      <p class="gatilho-msg">${trig.resposta}</p>
    `;
    
    el.querySelector('.btn-remover').addEventListener('click', () => {
      removerGatilho(index);
    });
    
    listaGatilhos.appendChild(el);
  });
}

function carregarTriggers() {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    if (res[STORAGE_KEY]) {
      triggersVars = res[STORAGE_KEY];
    }
    renderizarLista();
  });
}

function salvarTriggers(notificar = true) {
  chrome.storage.local.set({ [STORAGE_KEY]: triggersVars }, () => {
    renderizarLista();
    
    // Avisar o ContentScript (que repassará ao WPP Engine) para atualizar a regra
    window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');
    
    if (notificar) showToast('Salvo');
  });
}

function removerGatilho(index) {
  triggersVars.splice(index, 1);
  salvarTriggers(false);
}

btnAdd.addEventListener('click', () => {
  const palavra = inpPalavra.value.trim();
  const resposta = inpResposta.value.trim();
  const condicao = getCondicaoSelecionada();
  
  if (!palavra || !resposta) {
    alert('Preencha a Palavra-Chave e a Resposta!');
    return;
  }

  triggersVars.push({
    id: Date.now().toString(),
    palavra: palavra,
    resposta: resposta,
    condicao: condicao
  });

  inpPalavra.value = '';
  inpResposta.value = '';
  
  salvarTriggers();
});

carregarTriggers();
