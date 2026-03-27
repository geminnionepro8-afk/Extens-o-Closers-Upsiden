/**
 * @file painel-biblioteca.js
 * @description Renderiza as seções de Biblioteca do Painel: Áudios, Documentos e Mídias.
 *              Cada seção exibe uma tabela/grid com os itens, botões de upload e busca.
 * @module Módulo 06: UI — Painel (Biblioteca)
 * @date 21/03/2026
 */

// ═══ ÁUDIOS ══════════════════════════════════════════════════
function renderAudios(c) {
  document.getElementById('header-actions').innerHTML = `<label class="btn btn-primary" for="audio-upload-input" style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Importar</label><input type="file" id="audio-upload-input" accept=".mp3,.wav,.ogg,.m4a,.opus,audio/*" multiple hidden>`;
  document.getElementById('audio-upload-input')?.addEventListener('change', handleAudioUpload);

  let html = `<div class="section-header"><div class="search-bar"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" id="audio-search" placeholder="Buscar áudio..."></div></div>`;

  if (painelData.audios.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">🎵</div><h3>Nenhum áudio na biblioteca</h3><p>Clique em <strong>Importar</strong> para adicionar seus áudios.</p></div>`;
  } else {
    html += `<table class="data-table"><thead><tr><th></th><th>Nome</th><th>Duração</th><th>Tamanho</th><th>Compartilhado</th><th>Data</th><th></th></tr></thead><tbody>`;
    painelData.audios.forEach(a => {
      html += `<tr class="animate-in">
        <td><button class="audio-play-btn" data-audio-id="${a.id}"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></td>
        <td><div class="cell-name"><span>${a.nome}</span></div></td>
        <td style="color:var(--text-muted)">${fmtDur(a.duracao||0)}</td>
        <td style="color:var(--text-muted)">${fmtSize(a.tamanho||0)}</td>
        <td><label class="toggle-switch"><input type="checkbox" ${a.compartilhado?'checked':''} data-change="toggleShare('audios','${a.id}')"><span class="toggle-slider"></span></label></td>
        <td style="color:var(--text-muted)">${fmtDate(a.created_at)}</td>
        <td><div class="cell-actions"><button class="btn-icon" title="Excluir" data-click="deleteItem('audios','${a.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button></div></td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }
  c.innerHTML = html;
  document.getElementById('audio-search')?.addEventListener('input', e => filterTable(e.target.value));
}

// ═══ DOCUMENTOS ══════════════════════════════════════════════
function renderDocumentos(c) {
  document.getElementById('header-actions').innerHTML = `<label class="btn btn-primary" for="doc-upload-input" style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Upload</label><input type="file" id="doc-upload-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" multiple hidden>`;
  document.getElementById('doc-upload-input')?.addEventListener('change', handleDocUpload);

  let html = `<div class="section-header"><div class="search-bar"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" id="doc-search" placeholder="Buscar documento..."></div></div>`;

  if (painelData.documentos.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📄</div><h3>Nenhum documento</h3><p>Clique em <strong>Upload</strong> para adicionar documentos.</p></div>`;
  } else {
    html += `<table class="data-table"><thead><tr><th></th><th>Nome</th><th>Tamanho</th><th>Compartilhado</th><th>Data</th><th></th></tr></thead><tbody>`;
    painelData.documentos.forEach(d => {
      html += `<tr class="animate-in">
        <td><div class="cell-icon">${docIcon(d.tipo)}</div></td>
        <td><div class="cell-name"><span>${d.nome}</span></div></td>
        <td style="color:var(--text-muted)">${fmtSize(d.tamanho||0)}</td>
        <td><label class="toggle-switch"><input type="checkbox" ${d.compartilhado?'checked':''} data-change="toggleShare('documentos','${d.id}')"><span class="toggle-slider"></span></label></td>
        <td style="color:var(--text-muted)">${fmtDate(d.created_at)}</td>
        <td><div class="cell-actions"><button class="btn-icon" title="Excluir" data-click="deleteItem('documentos','${d.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button></div></td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }
  c.innerHTML = html;
  document.getElementById('doc-search')?.addEventListener('input', e => filterTable(e.target.value));
}

// ═══ MÍDIAS ══════════════════════════════════════════════════
function renderMidias(c) {
  document.getElementById('header-actions').innerHTML = `<label class="btn btn-primary" for="media-upload-input" style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Upload</label><input type="file" id="media-upload-input" accept="image/*,video/*" multiple hidden>`;
  document.getElementById('media-upload-input')?.addEventListener('change', handleMediaUpload);

  if (painelData.midias.length === 0) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">🖼️</div><h3>Nenhuma mídia</h3><p>Adicione imagens e vídeos para compartilhar com sua equipe.</p></div>`;
  } else {
    let html = '<div class="media-grid">';
    painelData.midias.forEach(m => {
      const isVideo = m.tipo && m.tipo.startsWith('video');
      const thumbUrl = m._url || '';
      html += `<div class="media-item animate-in">
        ${isVideo ? `<video src="${thumbUrl}" muted></video>` : `<img src="${thumbUrl}" alt="${m.nome}" loading="lazy">`}
        <div class="media-overlay"><span>${m.nome}</span></div>
      </div>`;
    });
    html += '</div>';
    c.innerHTML = html;
  }
}

// ═══ BIBLIOTECA CENTRAL (UNIFICADA) ══════════════════════════
function renderBiblioteca(c) {
  // Restore last active tab or default to 'audios'
  const lastTab = localStorage.getItem('upsiden_last_lib_tab') || 'audios';
  
  // Update state
  window.bibliotecaTabAtiva = lastTab;

  // Render the official sub-nav in the header
  renderBibliotecaHeader();
  
  // Call the switcher to render the initial module content
  switchBibliotecaTab(lastTab);
}
