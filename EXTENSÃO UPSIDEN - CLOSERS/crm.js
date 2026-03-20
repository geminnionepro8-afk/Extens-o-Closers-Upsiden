/* =====================================
   Upsiden — CRM Kanban Logic Engine
   Drag and Drop & State Management
   ===================================== */

const ESTADO_CRM = {
  leads: [
    { id: '1', nome: 'Arthur Elkuri', telefone: '+55 11 99999-9999', valor: 'R$ 1.500', etapa: '1' },
    { id: '2', nome: 'Lead Enterprise', telefone: '+1 800 555-0199', valor: 'R$ 15.000', etapa: '2' },
    { id: '3', nome: 'Cliente VIP', telefone: '+55 21 88888-8888', valor: 'R$ 4.200', etapa: '3' }
  ]
};

function renderizarKanban() {
  document.getElementById('coluna-prospeccao').innerHTML = '';
  document.getElementById('coluna-negociacao').innerHTML = '';
  document.getElementById('coluna-fechado').innerHTML = '';

  let qtd = { '1': 0, '2': 0, '3': 0 };

  ESTADO_CRM.leads.forEach(lead => {
    const card = document.createElement('div');
    card.className = 'crm-card';
    card.draggable = true;
    card.innerHTML = `
      <div class="crm-card-title">${lead.nome}</div>
      <div class="crm-card-meta">
        <span>${lead.telefone}</span>
        <span style="color: #00a884; font-weight: 600">${lead.valor}</span>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', lead.id);
      setTimeout(() => card.style.opacity = '0.5', 0);
    });
    
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });

    const coluna = lead.etapa === '1' ? 'coluna-prospeccao' : 
                   lead.etapa === '2' ? 'coluna-negociacao' : 'coluna-fechado';
    
    document.getElementById(coluna).appendChild(card);
    qtd[lead.etapa]++;
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    const etapa = col.dataset.etapa;
    col.querySelector('.badge').textContent = qtd[etapa];
  });
}

function configurarDragAndDrop() {
  const colunas = document.querySelectorAll('.kanban-cards');
  
  colunas.forEach(coluna => {
    coluna.addEventListener('dragover', (e) => {
      e.preventDefault();
      coluna.closest('.kanban-column').style.borderColor = '#00a884';
    });

    coluna.addEventListener('dragleave', (e) => {
      coluna.closest('.kanban-column').style.borderColor = '#222e35';
    });

    coluna.addEventListener('drop', (e) => {
      e.preventDefault();
      coluna.closest('.kanban-column').style.borderColor = '#222e35';
      const leadId = e.dataTransfer.getData('text/plain');
      const novaEtapa = coluna.closest('.kanban-column').dataset.etapa;
      
      const lead = ESTADO_CRM.leads.find(l => l.id === leadId);
      if (lead && lead.etapa !== novaEtapa) {
        lead.etapa = novaEtapa;
        renderizarKanban();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderizarKanban();
  configurarDragAndDrop();

  document.getElementById('btn-add-lead').addEventListener('click', () => {
    const nome = prompt("Qual o nome do novo Lead?");
    if (nome && nome.trim() !== '') {
      ESTADO_CRM.leads.push({
        id: Date.now().toString(),
        nome: nome,
        telefone: 'S/ Telefone',
        valor: 'R$ 0,00',
        etapa: '1'
      });
      renderizarKanban();
    }
  });
});
