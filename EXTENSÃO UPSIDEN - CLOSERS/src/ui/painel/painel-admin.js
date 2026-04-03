/**
 * @file painel-admin.js
 * @description Renderiza a secao Painel de Administracao.
 *              Acessivel apenas por admins. Exibe a tabela de membros da equipe
 *              e uma tabela de todos os arquivos globais compartilhados.
 * @module Modulo 06: UI - Painel (Admin)
 * @author Arquiteto Upsiden
 * @date 21/03/2026
 */

const ADMIN_ICONS = {
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  chart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  audio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
  doc: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
};

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
              <div class="cell-icon" style="background: var(--bg-secondary); border: 1px solid var(--border); color: var(--accent);">
                ${ADMIN_ICONS.user}
              </div>
              <div style="display:flex; flex-direction:column;">
                <span style="font-weight:600;">${m.nome || 'Sem nome'}</span>
                <span style="font-size:11px; color:var(--text-muted);">${m.role === 'admin' ? 'Administrador' : 'Equipe de Vendas'}</span>
              </div>
            </div>
          </td>
          <td style="color:var(--text-muted)">${m.email || ''}</td>
          <td><span class="badge ${badgeClass}" style="padding: 4px 10px; border-radius: 20px;">${role}</span></td>
          <td style="color:var(--text-muted)">
            <div style="display:flex; align-items:center; gap:6px;">
               <div style="width:8px; height:8px; border-radius:50%; background:${m.admin_id ? 'var(--success)' : 'var(--warning)'};"></div>
               ${m.admin_id ? 'Vinculado' : 'Aguardando'}
            </div>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn-icon" title="Permissões" data-click="abrirPermissoes('${m.id}')" style="background: var(--bg-secondary); border-color:var(--border);">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </button>
              <button class="btn-icon" title="Ver Métricas" data-click="abrirMetricasMembro('${m.id}')" style="background: var(--bg-secondary); border-color:var(--border);">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
  `;

  const allFiles = [
    ...painelData.audios.filter(a=>a.compartilhado).map(a=>({...a,_tipo:'🎵'})),
    ...painelData.documentos.filter(d=>d.compartilhado).map(d=>({...d,_tipo:docIcon(d.tipo)})),
    ...painelData.midias.filter(m=>m.compartilhado).map(m=>({...m,_tipo:'🖼️'}))
  ];

  if (allFiles.length === 0) {
    html += `<p style="color:var(--text-muted);font-size:14px; margin-top:20px;">Nenhum arquivo compartilhado com a equipe ainda.</p>`;
  } else {
    html += `
        <div class="section-header" style="margin-top:40px;">
          <h2>Arquivos Globais da Equipe</h2>
          <span style="font-size:12px; color:var(--text-muted);">${allFiles.length} arquivos compartilhados</span>
        </div>
    `;

    html += `
      <table class="data-table">
        <thead><tr><th>Tipo</th><th>Nome</th><th>Tamanho</th><th>Data</th><th style="text-align:right;">Ação</th></tr></thead>
        <tbody>
    `;
    allFiles.forEach(f => {
      const icon = f._tipo === '🎵' ? ADMIN_ICONS.audio : (f._tipo === '🖼️' ? ADMIN_ICONS.image : ADMIN_ICONS.doc);
      html += `
        <tr class="animate-in row-selectable" style="cursor:pointer;" data-click="previewFile('${f.id}', '${f._tipo}')">
          <td><div style="color:var(--accent);">${icon}</div></td>
          <td style="font-weight:600;">${f.nome}</td>
          <td style="color:var(--text-muted)">${fmtSize(f.tamanho||0)}</td>
          <td style="color:var(--text-muted)">${fmtDate(f.created_at)}</td>
          <td style="text-align:right;">
             <button class="btn-icon" style="width:28px; height:28px; border:none; background:var(--accent-dim); color:var(--accent);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
             </button>
          </td>
        </tr>`;
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
    <div class="modal animate-in" style="max-width:440px;">
      <div class="modal-header" style="padding: 24px 28px; border-bottom: 1px solid rgba(255,255,255,0.03);">
        <h3 style="font-size:16px; margin:0;">Permissões: <span style="color:var(--accent);">${m.nome || m.email}</span></h3>
        <button class="btn-icon" style="width:32px; height:32px; border:none; background:rgba(255,255,255,0.03);" data-click="closeModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
      <div class="modal-body" style="padding: 32px;">
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:24px; font-weight:500;">Defina quais áreas este closer pode acessar na extensão.</p>
        <div class="perms-list" style="display:grid; gap:16px;">
          ${renderPermSwitch('Áudios da Biblioteca', 'audios', perms.audios)}
          ${renderPermSwitch('Mídias (Imagens/Vídeos)', 'midias', perms.midias)}
          ${renderPermSwitch('Documentos Gerenciais', 'documentos', perms.documentos)}
          ${renderPermSwitch('Templates de Mensagem', 'templates', perms.templates)}
          ${renderPermSwitch('Visualizar CRM & Leads', 'crm', perms.crm)}
          ${renderPermSwitch('Configurações de Automação', 'automacao', perms.automacao)}
          ${renderPermSwitch('Gatilhos de Resposta Zap', 'gatilhos', perms.gatilhos)}
          ${renderPermSwitch('Fluxos Inteligentes (IA)', 'fluxos', perms.fluxos)}
        </div>
      </div>
      <div class="modal-footer" style="padding: 24px 32px; background: rgba(0,0,0,0.1);">
        <button class="btn btn-secondary" style="border:none;" data-click="closeModal()">Cancelar</button>
        <button class="btn btn-primary" style="padding: 10px 24px;" data-click="salvarPermissoes('${userId}')">Salvar Alterações</button>
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
      <div class="modal animate-in" style="max-width:480px;">
        <div class="modal-header" style="padding: 24px 28px; border-bottom: 1px solid rgba(255,255,255,0.03);">
          <h3 style="font-size:16px; margin:0;">Atividade de: <span style="color:var(--accent);">${m.nome || m.email}</span></h3>
          <button class="btn-icon" style="width:32px; height:32px; border:none; background:rgba(255,255,255,0.03);" data-click="closeModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body" style="padding: 32px;">
          <div class="metrics-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            ${renderMetricItem(ADMIN_ICONS.audio, 'Áudios', audios.length)}
            ${renderMetricItem(ADMIN_ICONS.image, 'Mídias', midias.length)}
            ${renderMetricItem(ADMIN_ICONS.doc, 'Docs', docs.length)}
            ${renderMetricItem(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`, 'Gatilhos', gatilhos.length)}
            ${renderMetricItem(ADMIN_ICONS.user, 'Leads', leads.length)}
          </div>
          <div style="margin-top:32px; padding:16px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
             <p style="font-size:12px; color:var(--text-muted); margin:0; line-height:1.5;">
               * Estas métricas representam o total acumulado de recursos criados e gerenciados por este closer dentro da plataforma.
             </p>
          </div>
        </div>
        <div class="modal-footer" style="padding: 24px 32px; background: rgba(0,0,0,0.1);">
          <button class="btn btn-primary" style="width:100%; height:44px; justify-content:center;" data-click="closeModal()">Fechar Relatório</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch(err) {
    console.error('[Admin] Erro ao carregar métricas:', err);
    toast('Erro ao carregar dados do membro.', 'error');
  }
};

function renderMetricItem(icon, label, value) {
  return `
    <div class="metric-card-mini" style="background:var(--bg-secondary); padding:24px 16px; border-radius:16px; border:1px solid rgba(255,255,255,0.03); text-align:center; transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--accent-glow)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.03)';this.style.transform='none'">
      <div style="color:var(--text-muted); margin-bottom:12px; display:flex; justify-content:center;">${icon}</div>
      <div style="font-size:32px; font-weight:800; color:var(--text-primary); margin-bottom:4px; letter-spacing:-1px;">${value}</div>
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; font-weight:700; color:var(--text-muted);">${label}</div>
    </div>
  `;
}

// --- PREVIEW DE ARQUIVOS ---
window.previewFile = function(fileId, tipoEmoji) {
    let file = null;
    let bucket = '';

    if (tipoEmoji === '🎵') {
        file = painelData.audios.find(x => x.id === fileId);
        bucket = 'audios';
    } else if (tipoEmoji === '🖼️') {
        file = painelData.midias.find(x => x.id === fileId);
        bucket = 'midias';
    } else {
        file = painelData.documentos.find(x => x.id === fileId);
        bucket = 'documentos';
    }

    if (!file) {
        toast('Arquivo não encontrado.', 'error');
        return;
    }

    // Gerar URL real via UpsidenStorage
    const fileUrl = UpsidenStorage.signedUrl(bucket, file.storage_path);
    console.log('[Admin] Preview URL:', fileUrl);

    if (!fileUrl) {
        toast('URL do arquivo inválida.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let previewContent = '';

    if (bucket === 'audios') {
        previewContent = `
            <div style="padding:32px; text-align:center; background:var(--bg-secondary);">
                <div style="width:64px; height:64px; background:var(--accent-dim); color:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px;">
                    ${ADMIN_ICONS.audio}
                </div>
                <h4 style="margin-bottom:16px; font-size:15px;">${file.nome}</h4>
                <audio src="${fileUrl}" controls autoplay style="width:100%; border-radius:12px;"></audio>
            </div>
        `;
    } else if (bucket === 'midias') {
        const isVideo = file.tipo && file.tipo.startsWith('video');
        previewContent = `
            <div style="max-height:85vh; overflow:hidden; border-radius:12px; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                ${isVideo 
                  ? `<video src="${fileUrl}" controls autoplay style="max-width:100%; max-height:80vh;"></video>` 
                  : `<img src="${fileUrl}" style="max-width:100%; max-height:80vh; object-fit:contain;">`
                }
                <div style="padding:16px; width:100%; background:rgba(0,0,0,0.8); color:#fff; font-size:13px; text-align:center; border-top:1px solid rgba(255,255,255,0.1);">
                  ${file.nome}
                </div>
            </div>
        `;
    } else {
        previewContent = `
            <div style="padding:48px; text-align:center; background:var(--bg-secondary);">
                <div style="width:64px; height:64px; background:var(--accent-dim); color:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px;">
                    ${ADMIN_ICONS.doc}
                </div>
                <h4 style="margin-bottom:8px;">${file.nome}</h4>
                <p style="margin-bottom:32px; color:var(--text-muted); font-size:13px;">O documento está pronto para ser visualizado em uma nova guia segura.</p>
                <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="width:100%; height:46px; justify-content:center; font-size:14px; font-weight:700;">
                  Visualizar Documento Real
                </a>
            </div>
        `;
    }

    modal.innerHTML = `
      <div class="modal animate-in" style="max-width: ${bucket==='midias' ? '900px' : '480px'}; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
        <div class="modal-header" style="background: rgba(0,0,0,0.2);">
          <h3 style="font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px; opacity:0.7;">Preview do Recurso Global</h3>
          <button class="btn-icon" style="width:28px; height:28px; border:none; background:rgba(255,255,255,0.05);" data-click="closeModal()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="modal-body" style="padding:0;">
          ${previewContent}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
}
