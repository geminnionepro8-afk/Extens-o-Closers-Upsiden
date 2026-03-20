/* =====================================
   Upsiden — CRM Kanban (Supabase)
   ===================================== */

let leads = [];
let userId = null;

async function carregarLeads() {
  userId = await UpsidenAuth.getUserId();
  const data = await UpsidenDB.from('leads').select('*').order('created_at', false).execute();
  leads = data || [];
}

function renderizarKanban() {
  document.getElementById('coluna-prospeccao').innerHTML = '';
  document.getElementById('coluna-negociacao').innerHTML = '';
  document.getElementById('coluna-fechado').innerHTML = '';

  let qtd = { 'prospeccao': 0, 'negociacao': 0, 'fechado': 0 };

  leads.forEach(lead => {
    if (!qtd.hasOwnProperty(lead.etapa)) return;
    const card = document.createElement('div');
    card.className = 'crm-card';
    card.draggable = true;
    card.innerHTML = `
      <div class="crm-card-title">${lead.nome}</div>
      <div class="crm-card-meta">
        <span>${lead.telefone || 'S/ Telefone'}</span>
        <span style="color: #00a884; font-weight: 600">${lead.valor || 'R$ 0,00'}</span>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', lead.id);
      setTimeout(() => card.style.opacity = '0.5', 0);
    });
    card.addEventListener('dragend', () => card.style.opacity = '1');

    const colunaMap = { 'prospeccao': 'coluna-prospeccao', 'negociacao': 'coluna-negociacao', 'fechado': 'coluna-fechado' };
    document.getElementById(colunaMap[lead.etapa]).appendChild(card);
    qtd[lead.etapa]++;
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    const etapa = col.dataset.etapa;
    const badge = col.querySelector('.badge');
    if (badge && qtd[etapa] !== undefined) badge.textContent = qtd[etapa];
  });
}

function configurarDragAndDrop() {
  document.querySelectorAll('.kanban-cards').forEach(coluna => {
    coluna.addEventListener('dragover', (e) => {
      e.preventDefault();
      coluna.closest('.kanban-column').style.borderColor = '#00a884';
    });
    coluna.addEventListener('dragleave', () => {
      coluna.closest('.kanban-column').style.borderColor = '#222e35';
    });
    coluna.addEventListener('drop', async (e) => {
      e.preventDefault();
      coluna.closest('.kanban-column').style.borderColor = '#222e35';
      const leadId = e.dataTransfer.getData('text/plain');
      const novaEtapa = coluna.closest('.kanban-column').dataset.etapa;
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.etapa !== novaEtapa) {
        lead.etapa = novaEtapa;
        await UpsidenDB.from('leads').eq('id', leadId).update({ etapa: novaEtapa, updated_at: new Date().toISOString() }).execute();
        renderizarKanban();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar o CRM.</p>';
    return;
  }

  await carregarLeads();
  renderizarKanban();
  configurarDragAndDrop();

  document.getElementById('btn-add-lead').addEventListener('click', async () => {
    const nome = prompt("Qual o nome do novo Lead?");
    if (nome && nome.trim()) {
      const result = await UpsidenDB.from('leads').insert({
        nome: nome.trim(), telefone: 'S/ Telefone', valor: 'R$ 0,00',
        etapa: 'prospeccao', responsavel_id: userId
      }).execute();
      if (result && result.length) leads.push(result[0]);
      renderizarKanban();
    }
  });
});
