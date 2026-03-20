/* ==============================================================
   Upsiden — Painel de Notas & CRM Integrado (notas.js)
   ============================================================== */

const elNome = document.getElementById('ui-nome');
const elTelefone = document.getElementById('ui-telefone');
const selFunil = document.getElementById('ui-funil');
const txtNotas = document.getElementById('ui-notas');
const inpValor = document.getElementById('ui-valor');
const btnSalvar = document.getElementById('btn-salvar');

let contatoAtualId = null;

// Solicitar ao host (content_script) os dados do chat atual
window.addEventListener('message', (ev) => {
  if (ev.data && ev.data.type === 'init_chat_data') {
    contatoAtualId = ev.data.chatId; // ex: 5511999999999@c.us
    elNome.textContent = ev.data.nome || 'Desconhecido';
    elTelefone.textContent = ev.data.telefone || contatoAtualId.split('@')[0];

    carregarDadosContato(contatoAtualId);
  }
});

// Pedir os dados init logo que abrir (Sprint 2 refactor)
window.parent.postMessage({ type: 'upsiden_get_active_chat' }, '*');

async function carregarDadosContato(chatId) {
  const chave = `ups_crm_${chatId}`;
  chrome.storage.local.get([chave], (result) => {
    const dados = result[chave] || {};
    selFunil.value = dados.funil || 'lead';
    txtNotas.value = dados.notas || '';
    inpValor.value = dados.valor || '';
    // Etiquetas serão carregadas em uma função dedicada futuramente
  });
}

btnSalvar.addEventListener('click', () => {
  if (!contatoAtualId) return;

  const chave = `ups_crm_${contatoAtualId}`;
  const dadosParaSalvar = {
    nome: elNome.textContent,
    telefone: elTelefone.textContent,
    funil: selFunil.value,
    notas: txtNotas.value,
    valor: inpValor.value,
    atualizadoEm: Date.now()
  };

  chrome.storage.local.set({ [chave]: dadosParaSalvar }, () => {
    btnSalvar.textContent = 'Salvo com Sucesso! ✓';
    btnSalvar.style.background = '#02c098';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Alterações';
      btnSalvar.style.background = '#00a884';
    }, 2000);

    // Notificar o pai que o funil mudou para atualizar kanban e listas (Futuro)
    window.parent.postMessage({ type: 'upsiden_crm_updated', data: { chatId: contatoAtualId, ...dadosParaSalvar } }, '*');
  });
});
