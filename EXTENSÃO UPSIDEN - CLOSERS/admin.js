/* =========================================
   Upsiden — Painel Admin (Supabase)
   ========================================= */

let equipe = [];
let arquivosGlobais = [];
let buscaAtual = '';

// ======================== RENDERIZAÇÃO EQUIPE ========================
function renderizarEquipe() {
  const lista = document.getElementById('lista-equipe');
  lista.innerHTML = '';

  if (equipe.length === 0) {
    lista.innerHTML = '<div class="mod-empty">Nenhum membro encontrado.</div>';
    return;
  }

  equipe.forEach(membro => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const roleClass = membro.role === 'admin' ? 'badge-role admin' : 'badge-role';
    
    card.innerHTML = `
      <div class="card-info">
        <div class="card-title">${membro.nome || membro.email.split('@')[0]}</div>
        <div class="card-meta">
          <span class="${roleClass}">${membro.role || 'Closer'}</span>
          <span>${membro.email}</span>
        </div>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ======================== RENDERIZAÇÃO ARQUIVOS ========================
function renderizarArquivos() {
  const lista = document.getElementById('lista-arquivos');
  lista.innerHTML = '';

  const filtrados = arquivosGlobais.filter(arq => {
    const termo = buscaAtual.toLowerCase();
    const dono = equipe.find(e => e.id === arq.criado_por);
    const nomeDono = dono ? (dono.nome || dono.email).toLowerCase() : '';
    return arq.nome.toLowerCase().includes(termo) || nomeDono.includes(termo);
  });

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="mod-empty">Nenhum arquivo encontrado.</div>';
    return;
  }

  filtrados.forEach(arq => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    
    const dono = equipe.find(e => e.id === arq.criado_por);
    const nomeDono = dono ? (dono.nome || dono.email.split('@')[0]) : 'Desconhecido';
    
    // Identificar de onde vem o arquivo pela estrutura
    let tipoIcone = '🎵';
    let tabela = 'audios';
    if (arq.hasOwnProperty('tamanho') && !arq.hasOwnProperty('duracao')) {
      tipoIcone = '📄'; tabela = 'documentos';
    } else if (arq.hasOwnProperty('url')) {
      tipoIcone = '🖼️'; tabela = 'midias';
    }

    const ehCompartilhado = arq.compartilhado === true;

    card.innerHTML = `
      <div class="card-info">
        <div class="card-title">${tipoIcone} ${arq.nome}</div>
        <div class="card-meta">
          <span>Criado por: <strong>${nomeDono}</strong></span>
          <span>•</span>
          <span>Tipo: ${tabela.charAt(0).toUpperCase() + tabela.slice(1)}</span>
        </div>
      </div>
      <div>
        <button class="tog-btn ${ehCompartilhado ? 'on' : ''}" data-id="${arq.id}" data-table="${tabela}" title="Compartilhar com toda a equipe">
          ${ehCompartilhado ? 'Compartilhado' : 'Tornar Global'}
        </button>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ======================== API FETCHERS ========================
async function carregarDadosAdmin() {
  try {
    // 1. Carregar Perfis
    const token = await UpsidenAuth.getValidToken();
    const resPerfis = await fetch('https://imxwpacwtphekrbgwbph.supabase.co/rest/v1/profiles?select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteHdwYWN3dHBoZWtyYmd3YnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDg3NzAsImV4cCI6MjA4OTU4NDc3MH0.4UEhD5nbt-WaEjyJ0pdWx1rgdIFZLnin0lOHaMFAhQE',
        'Authorization': `Bearer ${token}`
      }
    });

    if(resPerfis.ok) {
      equipe = await resPerfis.json();
    } else {
      console.warn("Nao foi possivel carregar perfis via Rest Admin", await resPerfis.text());
    }

    // 2. Carregar Arquivos (Podemos fazer union ou requisições paralelas)
    const [audios, docs] = await Promise.all([
      UpsidenDB.from('audios').select('*').order('created_at', false).execute(),
      UpsidenDB.from('documentos').select('*').order('created_at', false).execute()
    ]);
    
    arquivosGlobais = [...(audios || []), ...(docs || [])].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  } catch (error) {
    console.error('Erro ao buscar dados admin', error);
  }
}

// ======================== EVENT HANDLERS ========================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await UpsidenAuth.isAdmin();
  
  if (!isAdmin) {
    document.getElementById('restrito-view').style.display = 'flex';
    document.getElementById('tab-equipe').style.display = 'none';
    document.querySelector('.tabs-header').style.display = 'none';
    return;
  }

  await carregarDadosAdmin();
  renderizarEquipe();
  renderizarArquivos();

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      
      e.target.classList.add('active');
      document.getElementById(`tab-${e.target.dataset.tab}`).style.display = 'block';
    });
  });

  // Busca
  document.getElementById('admin-busca').addEventListener('input', (e) => {
    buscaAtual = e.target.value;
    renderizarArquivos();
  });

  // Toggle Compartilhado
  document.getElementById('lista-arquivos').addEventListener('click', async (e) => {
    const btn = e.target.closest('.tog-btn');
    if (!btn) return;

    const id = btn.dataset.id;
    const table = btn.dataset.table;
    const arquivo = arquivosGlobais.find(a => a.id === id);

    if (arquivo) {
      const novoEstado = !arquivo.compartilhado;
      btn.textContent = 'Aguarde...';
      
      try {
        await UpsidenDB.from(table).update({ compartilhado: novoEstado }).eq('id', id).execute();
        arquivo.compartilhado = novoEstado;
        renderizarArquivos();
      } catch (err) {
        alert('Erro ao atualizar permissão.');
        renderizarArquivos();
      }
    }
  });

});
