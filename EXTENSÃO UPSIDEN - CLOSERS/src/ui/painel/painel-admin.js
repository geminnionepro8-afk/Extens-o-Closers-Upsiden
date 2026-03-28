/**
 * @file painel-admin.js
 * @description Renderiza a secao Painel de Administracao.
 *              Acessivel apenas por admins. Exibe a tabela de membros da equipe
 *              e uma tabela de todos os arquivos globais compartilhados.
 * @module Modulo 06: UI - Painel (Admin)
 * @author Arquiteto Upsiden
 * @date 21/03/2026
 */

// === ADMIN ===
async function renderAdmin(c) {
  if (!userData.isAdmin) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><h3>Acesso Restrito</h3><p>Apenas administradores podem acessar esta secao.</p></div>`;
    return;
  }

  // Carregar convites pendentes
  let convites = [];
  try {
    convites = await UpsidenDB.from('team_invitations').select('*').eq('admin_id', userData.userId).execute();
  } catch(e) { console.warn('[Admin] Erro ao carregar convites:', e); }

  let html = `
    <div class="admin-grid" style="display: grid; grid-template-columns: 1fr 340px; gap: 24px;">
      
      <div class="admin-main-col">
        <div class="section-header">
          <h2>Membros da Equipe</h2>
          <div class="search-bar">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="text" placeholder="Buscar membro...">
          </div>
        </div>
        
        <table class="data-table">
          <thead>
            <tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Link</th><th>Ações</th></tr>
          </thead>
          <tbody>
  `;

  const membros = painelData.membros || [];
  if (membros.length === 0) {
    html += `<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum membro encontrado.</td></tr>`;
  } else {
    membros.forEach(m => {
      const role = m.role === 'admin' ? 'Admin' : 'Closer';
      const badgeClass = m.role === 'admin' ? 'badge-admin' : 'badge-closer';
      html += `
        <tr class="animate-in">
          <td>
            <div class="cell-name">
              <div class="cell-icon" style="font-size:14px;">${(m.nome||'U')[0].toUpperCase()}</div>
              <span>${m.nome || 'Sem nome'}</span>
            </div>
          </td>
          <td style="color:var(--text-muted)">${m.email || ''}</td>
          <td><span class="badge ${badgeClass}">${role}</span></td>
          <td style="color:var(--text-muted)">${m.admin_id ? 'Vinculado' : 'Global'}</td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn-icon" title="Permissões" data-click="abrirPermissoes('${m.id}')" style="color:var(--accent);"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.52-2.98 8.69-7 9.88-4.02-1.19-7-5.36-7-9.88V6.29l7-3.11zM10.5 7v2h3V7h-3zm0 4v2h3v-2h-3zm0 4v2h3v-2h-3z"/></svg></button>
              <button class="btn-icon" title="Ver Métricas" data-click="abrirMetricasMembro('${m.id}')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path fill="currentColor" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg></button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>

        <div class="section-header" style="margin-top:40px;">
          <h2>Arquivos Globais da Equipe</h2>
        </div>
  `;

  const allFiles = [
    ...painelData.audios.filter(a=>a.compartilhado).map(a=>({...a,_tipo:'🎵'})),
    ...painelData.documentos.filter(d=>d.compartilhado).map(d=>({...d,_tipo:docIcon(d.tipo)})),
    ...painelData.midias.filter(m=>m.compartilhado).map(m=>({...m,_tipo:'🖼️'}))
  ];

  if (allFiles.length === 0) {
    html += `<p style="color:var(--text-muted);font-size:14px;">Nenhum arquivo compartilhado com a equipe ainda.</p>`;
  } else {
    html += `
      <table class="data-table">
        <thead><tr><th></th><th>Nome</th><th>Tamanho</th><th>Data</th></tr></thead>
        <tbody>
    `;
    allFiles.forEach(f => {
      html += `<tr><td>${f._tipo}</td><td>${f.nome}</td><td style="color:var(--text-muted)">${fmtSize(f.tamanho||0)}</td><td style="color:var(--text-muted)">${fmtDate(f.created_at)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  html += `
      </div> <!-- /admin-main-col -->

      <div class="admin-sidebar-col">
        <div class="card-glass" style="padding: 24px; border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border);">
          <h3 style="margin-bottom: 8px; font-size: 16px;">Gerar Novo Convite</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">Crie um código de identificação para um novo membro da sua equipe.</p>
          
          <div class="form-group-perfil" style="margin-bottom: 16px;">
             <label>Cargo do Novo Membro</label>
             <select id="invite-role" style="width:100%; height:42px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; color:#fff; padding: 0 10px;">
               <option value="closer">Closer (Padrão)</option>
               <option value="admin">Administrador (Equipe)</option>
             </select>
          </div>

          <button class="btn-perfil-save" style="width:100%; margin-bottom: 24px;" data-click="gerarConvite()">
            Gerar ID de Convite
          </button>

          <div class="invites-list">
            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 12px;">Convites Gerados</h4>
            <div id="list-convites-area">
              ${renderListaConvites(convites)}
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  c.innerHTML = html;
}

function renderListaConvites(convites) {
  if (!convites || convites.length === 0) return `<p style="font-size:12px; color:var(--text-muted); text-align:center;">Nenhum ID gerado.</p>`;
  
  return convites.map(cv => `
    <div class="invite-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px; border: 1px solid ${cv.used_at ? 'var(--border-light)' : 'rgba(255,77,0,0.2)'}">
      <div>
        <div style="font-family: monospace; font-size: 14px; color: ${cv.used_at ? 'var(--text-muted)' : 'var(--accent)'}; font-weight: bold;">${cv.code}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${cv.role}</div>
      </div>
      <div>
        ${cv.used_at 
          ? `<span style="font-size: 10px; color: var(--success);">USADO</span>` 
          : `<button class="btn-icon" title="Copiar" data-click="copyInvite('${cv.code}')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>`
        }
      </div>
    </div>
  `).join('');
}

// --- FUNCOES DE ACAO ---

window.gerarConvite = async function() {
  const role = document.getElementById('invite-role').value;
  const code = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    toast('Gerando convite...', 'info');
    await UpsidenDB.from('team_invitations').insert({
      code: code,
      admin_id: userData.userId,
      role: role
    }).execute();

    toast('ID de Convite gerado com sucesso!', 'success');
    navigate('admin'); // Recarregar secao
  } catch(err) {
    console.error('[Admin] Erro ao gerar convite:', err);
    toast('Erro ao gerar código de convite.', 'error');
  }
};

window.copyInvite = function(code) {
  navigator.clipboard.writeText(code);
  toast('ID copiado para a área de transferência!', 'success');
};

// --- GESTAO DE PERMISSOES ---

window.abrirPermissoes = function(userId) {
  const m = painelData.membros.find(x => x.id === userId);
  if (!m) return;

  const perms = m.permissions || {
    audios: true, midias: true, documentos: true, templates: true, 
    crm: true, automacao: true, gatilhos: true, fluxos: true
  };

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card animate-in" style="max-width:400px;">
      <div class="modal-header">
        <h3>Permissões: ${m.nome || m.email}</h3>
        <button class="btn-icon" data-click="closeModal()"><svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
      </div>
      <div class="modal-body">
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Defina quais áreas este closer pode acessar na extensão.</p>
        <div class="perms-list" style="display:grid; gap:12px;">
          ${renderPermSwitch('Audios', 'audios', perms.audios)}
          ${renderPermSwitch('Mídias (Imagens/Vídeos)', 'midias', perms.midias)}
          ${renderPermSwitch('Documentos', 'documentos', perms.documentos)}
          ${renderPermSwitch('Templates de Mensagem', 'templates', perms.templates)}
          ${renderPermSwitch('CRM & Leads', 'crm', perms.crm)}
          ${renderPermSwitch('Config. Automação', 'automacao', perms.automacao)}
          ${renderPermSwitch('Gatilhos de Resposta', 'gatilhos', perms.gatilhos)}
          ${renderPermSwitch('Fluxos Inteligentes', 'fluxos', perms.fluxos)}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" data-click="closeModal()">Cancelar</button>
        <button class="btn-primary" data-click="salvarPermissoes('${userId}')">Salvar Alterações</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

function renderPermSwitch(label, key, value) {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:14px;">${label}</span>
      <label class="switch">
        <input type="checkbox" id="perm-${key}" ${value ? 'checked' : ''}>
        <span class="slider round"></span>
      </label>
    </div>
  `;
}

window.salvarPermissoes = async function(userId) {
  const keys = ['audios', 'midias', 'documentos', 'templates', 'crm', 'automacao', 'gatilhos', 'fluxos'];
  const newPerms = {};
  keys.forEach(k => {
    newPerms[k] = document.getElementById(`perm-${k}`).checked;
  });

  try {
    toast('Salvando permissões...', 'info');
    await UpsidenDB.from('profiles').update({ permissions: newPerms }).eq('id', userId).execute();
    
    // Atualizar estado local
    const m = painelData.membros.find(x => x.id === userId);
    if (m) m.permissions = newPerms;

    toast('Permissões atualizadas!', 'success');
    closeModal();
  } catch(err) {
    console.error('[Admin] Erro ao salvar permissões:', err);
    toast('Erro ao salvar permissões.', 'error');
  }
};

// --- GESTAO DE METRICAS ---

window.abrirMetricasMembro = async function(userId) {
  const m = painelData.membros.find(x => x.id === userId);
  if (!m) return;

  toast('Carregando métricas...', 'info');

  try {
    const [audios, midias, docs, gatilhos, leads] = await Promise.all([
      UpsidenDB.from('audios').select('id').eq('criado_por', userId).execute(),
      UpsidenDB.from('midias').select('id').eq('criado_por', userId).execute(),
      UpsidenDB.from('documentos').select('id').eq('criado_por', userId).execute(),
      UpsidenDB.from('gatilhos').select('id').eq('criado_por', userId).execute(),
      UpsidenDB.from('leads').select('id').eq('responsavel_id', userId).execute()
    ]);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card animate-in" style="max-width:450px;">
        <div class="modal-header">
          <h3>Atividade de: ${m.nome || m.email}</h3>
          <button class="btn-icon" data-click="closeModal()"><svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
        </div>
        <div class="modal-body">
          <div class="metrics-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            ${renderMetricItem('🎵 Áudios', audios.length)}
            ${renderMetricItem('🖼️ Mídias', midias.length)}
            ${renderMetricItem('📄 Docs', docs.length)}
            ${renderMetricItem('⚡ Gatilhos', gatilhos.length)}
            ${renderMetricItem('👥 Leads', leads.length)}
          </div>
          <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border);">
             <p style="font-size:12px; color:var(--text-muted);">
               * Estas métricas representam o total acumulado de recursos criados/gerenciados por este closer.
             </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" style="width:100%" data-click="closeModal()">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch(err) {
    console.error('[Admin] Erro ao carregar métricas:', err);
    toast('Erro ao carregar dados do membro.', 'error');
  }
};

function renderMetricItem(label, value) {
  return `
    <div class="metric-card-mini" style="background:var(--bg-secondary); padding:16px; border-radius:12px; border:1px solid var(--border); text-align:center;">
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">${label}</div>
      <div style="font-size:24px; font-weight:bold; color:var(--accent);">${value}</div>
    </div>
  `;
}
