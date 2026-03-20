/* ==============================================================
   Upsiden — Painel de Notas & CRM Integrado (Supabase)
   ============================================================== */

const elNome = document.getElementById('ui-nome');
const elTelefone = document.getElementById('ui-telefone');
const selFunil = document.getElementById('ui-funil');
const txtNotas = document.getElementById('ui-notas');
const inpValor = document.getElementById('ui-valor');
const btnSalvar = document.getElementById('btn-salvar');

let contatoAtualId = null;
let userId = null;

window.addEventListener('message', (ev) => {
  if (ev.data && ev.data.type === 'init_chat_data') {
    contatoAtualId = ev.data.chatId;
    elNome.textContent = ev.data.nome || 'Desconhecido';
    elTelefone.textContent = ev.data.telefone || contatoAtualId.split('@')[0];
    carregarDadosContato(contatoAtualId);
  }
});

window.parent.postMessage({ type: 'upsiden_get_active_chat' }, '*');

async function carregarDadosContato(chatId) {
  userId = await UpsidenAuth.getUserId();
  if (!userId) return;

  try {
    const results = await UpsidenDB.from('notas_contato')
      .select('*')
      .eq('chat_id', chatId)
      .eq('closer_id', userId)
      .execute();

    const dados = results && results.length > 0 ? results[0] : {};
    selFunil.value = dados.funil || 'lead';
    txtNotas.value = dados.notas || '';
    inpValor.value = dados.valor || '';
  } catch (err) {
    console.error('[Notas] Erro ao carregar:', err);
  }
}

btnSalvar.addEventListener('click', async () => {
  if (!contatoAtualId || !userId) return;

  const dadosParaSalvar = {
    chat_id: contatoAtualId,
    closer_id: userId,
    nome_contato: elNome.textContent,
    telefone: elTelefone.textContent,
    funil: selFunil.value,
    notas: txtNotas.value,
    valor: inpValor.value,
    updated_at: new Date().toISOString()
  };

  try {
    await UpsidenDB.from('notas_contato').upsert(dadosParaSalvar).execute();

    btnSalvar.textContent = 'Salvo com Sucesso! ✓';
    btnSalvar.style.background = '#02c098';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Alterações';
      btnSalvar.style.background = '#00a884';
    }, 2000);

    window.parent.postMessage({
      type: 'upsiden_crm_updated',
      data: { chatId: contatoAtualId, ...dadosParaSalvar }
    }, '*');
  } catch (err) {
    console.error('[Notas] Erro ao salvar:', err);
    btnSalvar.textContent = 'Erro ao salvar!';
    btnSalvar.style.background = '#dc3545';
    setTimeout(() => {
      btnSalvar.textContent = 'Salvar Alterações';
      btnSalvar.style.background = '#00a884';
    }, 2000);
  }
});
