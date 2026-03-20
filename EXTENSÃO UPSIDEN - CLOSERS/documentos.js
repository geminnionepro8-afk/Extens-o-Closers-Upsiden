/* =========================================
   Upsiden — Biblioteca de Documentos (Supabase)
   ========================================= */

let documentos = [];
let buscaAtual = '';
let filtroCategoria = 'todos';
let userId = null;
let isAdmin = false;

function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function iconeDoTipo(tipo) {
  if (tipo.includes('pdf')) return '📕';
  if (tipo.includes('word') || tipo.includes('doc')) return '📘';
  if (tipo.includes('sheet') || tipo.includes('excel') || tipo.includes('csv')) return '📗';
  if (tipo.includes('presentation') || tipo.includes('powerpoint')) return '📙';
  return '📄';
}

async function carregarDocs() {
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('documentos').select('*').order('created_at', false).execute();
  documentos = data || [];
}

function renderizar() {
  const lista = document.getElementById('doc-lista');
  const vazio = document.getElementById('doc-vazio');
  const count = document.getElementById('doc-count');

  let filtrados = documentos.filter(d => d.nome.toLowerCase().includes(buscaAtual.toLowerCase()));
  if (filtroCategoria === 'equipe') {
    filtrados = filtrados.filter(d => d.compartilhado);
  }

  lista.innerHTML = '';
  if (filtrados.length === 0) {
    lista.style.display = 'none'; vazio.style.display = 'flex';
  } else {
    lista.style.display = 'flex'; vazio.style.display = 'none';
    filtrados.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'mod-card';
      const compartilhadoBadge = doc.compartilhado ? ' <span style="font-size:8px;background:#FF6200;color:white;padding:1px 3px;border-radius:2px;">TIME</span>' : '';
      card.innerHTML = `
        <div class="mod-card-icon">${iconeDoTipo(doc.tipo)}</div>
        <div class="mod-card-info">
          <div class="mod-card-title">${doc.nome}${compartilhadoBadge}</div>
          <div class="mod-card-meta">${formatarTamanho(doc.tamanho)}</div>
        </div>
        <div class="mod-card-actions">
          <button class="btn-send" data-id="${doc.id}" title="Enviar para o chat">Enviar</button>
          <button class="btn-danger" data-del="${doc.id}" title="Excluir">✕</button>
        </div>
      `;
      lista.appendChild(card);
    });
  }

  count.textContent = `${documentos.length} documento${documentos.length !== 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar os documentos.</p>';
    return;
  }

  await carregarDocs();
  renderizar();

  document.getElementById('doc-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const storagePath = `${userId}/${Date.now()}_${file.name}`;
        await UpsidenStorage.upload('documentos', storagePath, file, file.type);
        const result = await UpsidenDB.from('documentos').insert({
          nome: file.name, tipo: file.type, tamanho: file.size,
          storage_path: storagePath, criado_por: userId, compartilhado: isAdmin
        }).execute();
        if (result && result.length) documentos.unshift(result[0]);
      } catch (err) { console.error('Upload failed:', err); alert(`Erro ao fazer upload de ${file.name}`); }
    }
    
    filtroCategoria = 'todos';
    const catContainer = document.getElementById('container-categorias-doc');
    if (catContainer) {
      catContainer.querySelectorAll('.cat-chip').forEach(c => {
        c.style.background = 'transparent';
        c.style.color = '#8696a0';
        c.style.border = '1px solid rgba(42,57,66,0.8)';
        c.classList.remove('active');
      });
      const chipTodos = catContainer.querySelector('.cat-chip[data-categoria="todos"]');
      if (chipTodos) {
        chipTodos.classList.add('active');
        chipTodos.style.background = '#FF6200';
        chipTodos.style.color = '#fff';
        chipTodos.style.border = 'none';
      }
    }

    renderizar();
    e.target.value = '';
  });

  document.getElementById('doc-busca').addEventListener('input', (e) => { buscaAtual = e.target.value; renderizar(); });

  const catContainer = document.getElementById('container-categorias-doc');
  if (catContainer) {
    catContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      catContainer.querySelectorAll('.cat-chip').forEach(c => {
        c.style.background = 'transparent';
        c.style.color = '#8696a0';
        c.style.border = '1px solid rgba(42,57,66,0.8)';
        c.classList.remove('active');
      });
      chip.classList.add('active');
      chip.style.background = '#FF6200';
      chip.style.color = '#fff';
      chip.style.border = 'none';
      
      filtroCategoria = chip.dataset.categoria;
      renderizar();
    });
  }

  document.getElementById('doc-lista').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-id]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      const doc = documentos.find(d => d.id === btnDel.dataset.del);
      if (doc) {
        await UpsidenStorage.remove('documentos', [doc.storage_path]).catch(() => {});
        await UpsidenDB.from('documentos').eq('id', doc.id).delete().execute();
        documentos = documentos.filter(d => d.id !== doc.id);
        renderizar();
      }
    }

    if (btnSend && !btnSend.closest('[data-del]')) {
      const doc = documentos.find(d => d.id === btnSend.dataset.id);
      if (doc) {
        try {
          const blob = await UpsidenStorage.download('documentos', doc.storage_path);
          const reader = new FileReader();
          reader.onload = () => {
            window.parent.postMessage({
              type: 'upsiden_send_file',
              data: { nome: doc.nome, tipo: doc.tipo, base64: reader.result }
            }, '*');
            UpsidenMetrics.registrar('documento', doc.id);
          };
          reader.readAsDataURL(blob);
        } catch (err) { alert('Erro ao enviar documento'); }
      }
    }
  });
});
