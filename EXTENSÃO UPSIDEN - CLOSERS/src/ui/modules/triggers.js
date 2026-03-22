/* =========================================
   Upsiden — Gatilhos Inteligentes (Supabase)
   ========================================= */

const inpPalavra = document.getElementById('inp-palavra');
const inpResposta = document.getElementById('inp-resposta');
const rdoCondicoes = document.getElementsByName('condicao');
const btnAdd = document.getElementById('btn-add');
const listaGatilhos = document.getElementById('lista-gatilhos');

// Novas fields
const inpSimular = document.getElementById('inp-simular');
const inpPrivado = document.getElementById('inp-privado');
const inpGrupo = document.getElementById('inp-grupo');
const inpDelayMin = document.getElementById('inp-delay-min');
const inpDelayMax = document.getElementById('inp-delay-max');

let triggersVars = [];
let userId = null;
let isAdmin = false;

function showToast(msg) {
  const btnOriginal = btnAdd.innerHTML;
  btnAdd.innerHTML = `✓ ${msg}`;
  btnAdd.style.background = '#02c098';
  setTimeout(() => { btnAdd.innerHTML = btnOriginal; btnAdd.style.background = '#00a884'; }, 2000);
}

function getCondicaoSelecionada() {
  for (const rdo of rdoCondicoes) { if (rdo.checked) return rdo.value; }
  return 'exata';
}

function renderizarLista() {
  listaGatilhos.innerHTML = '';
  if (triggersVars.length === 0) {
    listaGatilhos.innerHTML = '<p style="color:#8696a0; font-size:13px; text-align:center; padding: 20px 0;">Nenhum gatilho configurado ainda.</p>';
    return;
  }

  triggersVars.forEach((trig) => {
    const el = document.createElement('div');
    el.className = 'gatilho-item';
    const labelCondicao = trig.condicao === 'exata' ? 'Frase Exata' : 'Contém na Frase';
    const compartilhadoBadge = trig.compartilhado ? ' <span style="font-size:8px;background:#FF6200;color:white;padding:1px 3px;border-radius:2px;">TIME</span>' : '';
    const alvoBadge = trig.apenas_privado && !trig.apenas_grupo ? 'PRIVADO' : (!trig.apenas_privado && trig.apenas_grupo ? 'GRUPOS' : 'GERAL');
    const simBadge = trig.simular_digitacao !== false ? `⏱️ ${trig.delay_min || 2}-${trig.delay_max || 5}s` : '⚡ INSTA';

    el.innerHTML = `
      <div class="gatilho-header">
        <span class="gatilho-keyword">"${trig.palavra}"${compartilhadoBadge}</span>
        <button class="btn-remover" data-id="${trig.id}" title="Remover Gatilho">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
      <div style="display:flex; gap: 8px; margin: 4px 0;">
        <span class="gatilho-condicao">${labelCondicao}</span>
        <span style="font-size: 10px; background:#111b21; color:#8696a0; padding: 2px 6px; border-radius: 4px;">${alvoBadge}</span>
        <span style="font-size: 10px; background:#111b21; color:#00a884; padding: 2px 6px; border-radius: 4px;">${simBadge}</span>
      </div>
      <p class="gatilho-msg">${trig.resposta}</p>
    `;

    el.querySelector('.btn-remover').addEventListener('click', () => removerGatilho(trig.id));
    listaGatilhos.appendChild(el);
  });
}

async function carregarTriggers() {
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('gatilhos').select('*').order('created_at', false).execute();
  triggersVars = data || [];
  renderizarLista();

  // Also sync to local storage for the automation engine
  sincronizarLocal();
}

function sincronizarLocal() {
  // The automation engine reads triggers from chrome.storage.local
  // So we sync Supabase data to local
  const localTriggers = triggersVars.filter(t => t.ativo).map(t => ({
    id: t.id, 
    palavra: t.palavra, 
    resposta: t.resposta, 
    condicao: t.condicao,
    simular_digitacao: t.simular_digitacao,
    delay_min: t.delay_min,
    delay_max: t.delay_max,
    apenas_privado: t.apenas_privado,
    apenas_grupo: t.apenas_grupo
  }));
  chrome.storage.local.set({ ups_config_triggers: localTriggers });
  window.parent.postMessage({ type: 'upsiden_reload_automation' }, '*');
}

async function removerGatilho(id) {
  await UpsidenDB.from('gatilhos').eq('id', id).delete().execute();
  triggersVars = triggersVars.filter(t => t.id !== id);
  renderizarLista();
  sincronizarLocal();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.querySelector('.mod-app') && (document.body.innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar os gatilhos.</p>');
    return;
  }
  await carregarTriggers();
});

btnAdd.addEventListener('click', async () => {
  const palavra = inpPalavra.value.trim();
  const resposta = inpResposta.value.trim();
  const condicao = getCondicaoSelecionada();

  if (!palavra || !resposta) { alert('Preencha a Palavra-Chave e a Resposta!'); return; }

  const result = await UpsidenDB.from('gatilhos').insert({
    palavra, 
    resposta, 
    condicao, 
    simular_digitacao: inpSimular.checked,
    apenas_privado: inpPrivado.checked,
    apenas_grupo: inpGrupo.checked,
    delay_min: parseInt(inpDelayMin.value, 10) || 2,
    delay_max: parseInt(inpDelayMax.value, 10) || 5,
    criado_por: userId, 
    compartilhado: isAdmin, 
    ativo: true
  }).execute();

  if (result && result.length) triggersVars.unshift(result[0]);

  inpPalavra.value = '';
  inpResposta.value = '';
  renderizarLista();
  sincronizarLocal();
  showToast('Salvo');
});
