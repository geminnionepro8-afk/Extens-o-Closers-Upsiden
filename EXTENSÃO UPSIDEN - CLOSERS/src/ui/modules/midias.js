/* =========================================
   Upsiden — Biblioteca de Mídias (Supabase)
   ========================================= */

let midias = [];
let buscaAtual = '';
let userId = null;
let isAdmin = false;

function formatarTamanho(b) { return b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }

async function carregar() {
  userId = await UpsidenAuth.getUserId();
  isAdmin = await UpsidenAuth.isAdmin();
  const data = await UpsidenDB.from('midias').select('*').order('created_at', false).execute();
  midias = data || [];
}

function renderizar() {
  const grid = document.getElementById('media-grid');
  const vazio = document.getElementById('media-vazio');
  const count = document.getElementById('media-count');

  const filtradas = midias.filter(m => m.nome.toLowerCase().includes(buscaAtual.toLowerCase()));

  grid.innerHTML = '';
  if (filtradas.length === 0) {
    grid.style.display = 'none';
    vazio.style.display = 'flex';
  } else {
    grid.style.display = 'grid';
    vazio.style.display = 'none';

    filtradas.forEach(m => {
      const thumb = document.createElement('div');
      thumb.className = 'media-thumb';

      const isVideo = m.tipo.startsWith('video');
      // Use a placeholder since files are in Supabase Storage
      const preview = `<div style="width:100%;height:80px;background:#1a2730;display:flex;align-items:center;justify-content:center;color:#8696a0;font-size:24px;">${isVideo ? '🎬' : '🖼️'}</div>`;

      const compartilhadoBadge = m.compartilhado ? ' <span style="font-size:8px;background:#FF6200;color:white;padding:1px 3px;border-radius:2px;">TIME</span>' : '';

      thumb.innerHTML = `
        ${preview}
        <div class="media-thumb-bar">
          <span class="media-thumb-name">${m.nome}${compartilhadoBadge}</span>
          <button class="btn-send" data-id="${m.id}" style="font-size:9px;padding:2px 5px;">▶</button>
          <button class="btn-danger" data-del="${m.id}" style="font-size:9px;padding:2px 4px;">✕</button>
        </div>
      `;
      grid.appendChild(thumb);
    });
  }

  count.textContent = `${midias.length} mídia${midias.length !== 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await verificarAuth())) {
    document.querySelector('.mod-app').innerHTML = '<p style="padding:20px;color:#8696a0;text-align:center;">Faça login para acessar as mídias.</p>';
    return;
  }

  await carregar();
  renderizar();

  document.getElementById('media-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) { alert(`${file.name} excede 25MB.`); continue; }
      try {
        const storagePath = `${userId}/${Date.now()}_${file.name}`;
        await UpsidenStorage.upload('midias', storagePath, file, file.type);
        const result = await UpsidenDB.from('midias').insert({
          nome: file.name, tipo: file.type, tamanho: file.size,
          storage_path: storagePath, criado_por: userId, compartilhado: isAdmin
        }).execute();
        if (result && result.length) midias.unshift(result[0]);
      } catch (err) { console.error('Upload failed:', err); alert(`Erro ao fazer upload de ${file.name}`); }
    }
    renderizar();
    e.target.value = '';
  });

  document.getElementById('media-busca').addEventListener('input', (e) => { buscaAtual = e.target.value; renderizar(); });

  document.getElementById('media-grid').addEventListener('click', async (e) => {
    const btnSend = e.target.closest('[data-id]');
    const btnDel = e.target.closest('[data-del]');

    if (btnDel) {
      const m = midias.find(x => x.id === btnDel.dataset.del);
      if (m) {
        await UpsidenStorage.remove('midias', [m.storage_path]).catch(() => {});
        await UpsidenDB.from('midias').eq('id', m.id).delete().execute();
        midias = midias.filter(x => x.id !== m.id);
        renderizar();
      }
    }
    if (btnSend && !btnSend.closest('[data-del]')) {
      const m = midias.find(x => x.id === btnSend.dataset.id);
      if (m) {
        try {
          const blob = await UpsidenStorage.download('midias', m.storage_path);
          const reader = new FileReader();
          reader.onload = () => {
            window.parent.postMessage({
              type: 'upsiden_send_file',
              data: { nome: m.nome, tipo: m.tipo, base64: reader.result }
            }, '*');
            UpsidenMetrics.registrar('midia', m.id);
          };
          reader.readAsDataURL(blob);
        } catch (err) { alert('Erro ao enviar mídia'); }
      }
    }
  });
});
