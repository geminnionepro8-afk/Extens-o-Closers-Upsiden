/**
 * @file painel-admin.js
 * @description Renderiza a seo Painel de Administrao.
 *              Acessvel apenas por admins. Exibe a tabela de membros da equipe
 *              e uma tabela de todos os arquivos globais compartilhados.
 * @module Mdulo 06: UI  Painel (Admin)
 * @date 21/03/2026
 */
// """ ADMIN """""""""""""""""""""""""""""""""""""""""""""""""""
function renderAdmin(c) {
  if (!userData.isAdmin) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">x</div><h3>Acesso Restrito</h3><p>Apenas administradores podem acessar esta seção.</p></div>`;
    return;
  }
  let html = `<div class="section-header"><h2>Membros da Equipe</h2><div class="search-bar"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Buscar membro..."></div></div>`;
  html += `<table class="data-table"><thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Criado em</th></tr></thead><tbody>`;
  painelData.membros.forEach(m => {
    const role = m.isAdmin ? 'Admin' : 'Closer';
    const badgeClass = m.isAdmin ? 'badge-admin' : 'badge-closer';
    html += `<tr class="animate-in"><td><div class="cell-name"><div class="cell-icon" style="font-size:14px;">${(m.nome||'U')[0].toUpperCase()}</div><span>${m.nome || 'Sem nome'}</span></div></td><td style="color:var(--text-muted)">${m.email || ''}</td><td><span class="badge ${badgeClass}">${role}</span></td><td style="color:var(--text-muted)">${fmtDate(m.created_at)}</td></tr>`;
  });
  html += `</tbody></table>`;

  html += `<div class="section-header" style="margin-top:32px;"><h2>Arquivos Globais da Equipe</h2></div>`;
  const allFiles = [...painelData.audios.filter(a=>a.compartilhado).map(a=>({...a,_tipo:'x}'})), ...painelData.documentos.filter(d=>d.compartilhado).map(d=>({...d,_tipo:docIcon(d.tipo)})), ...painelData.midias.filter(m=>m.compartilhado).map(m=>({...m,_tipo:'x️'}))];
  if (allFiles.length === 0) {
    html += `<p style="color:var(--text-muted);font-size:14px;">Nenhum arquivo compartilhado com a equipe ainda.</p>`;
  } else {
    html += `<table class="data-table"><thead><tr><th></th><th>Nome</th><th>Tamanho</th><th>Data</th></tr></thead><tbody>`;
    allFiles.forEach(f => {
      html += `<tr><td>${f._tipo}</td><td>${f.nome}</td><td style="color:var(--text-muted)">${fmtSize(f.tamanho||0)}</td><td style="color:var(--text-muted)">${fmtDate(f.created_at)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  c.innerHTML = html;
}

