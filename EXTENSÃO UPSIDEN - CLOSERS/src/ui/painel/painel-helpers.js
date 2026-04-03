/**
 * @file painel-helpers.js
 * @description Funções auxiliares e utilitárias usadas por todas as seções do Painel.
 *              Inclui: formatação de tamanho (bytes→KB/MB), duração (seg→mm:ss),
 *              data (ISO→pt-BR), ícone de documento por tipo MIME.
 *              Também inclui as funções de navegação e renderização de seções,
 *              ações globais (toggle share, delete, filter) e upload handlers.
 * @module Módulo 06: UI — Painel (Helpers + Navegação + Ações)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

// ═══ HELPERS ═════════════════════════════════════════════════
function fmtSize(b) { return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
function fmtDur(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('pt-BR'); }
function docIcon(t) {
  if (!t) return '📄';
  if (t.includes('pdf')) return '📕'; if (t.includes('word')||t.includes('doc')) return '📘';
  if (t.includes('sheet')||t.includes('excel')||t.includes('csv')) return '📗'; return '📄';
}

// ═══ NAVIGATION ══════════════════════════════════════════════
function navigate(section) {
  // Verificação de Permissão
  if (!userData.isAdmin && !['dashboard', 'perfil'].includes(section)) {
    const perms = userData.permissions || {};
    const map = {
      'biblioteca': 'audios', // Acesso base à biblioteca (audios)
      'templates': 'templates',
      'crm': 'crm',
      'automacoes': 'automacao',
      'gatilhos': 'gatilhos',
      'flow': 'fluxos'
    };
    const key = map[section];
    if (key && perms[key] === false) {
      document.getElementById('main-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>Acesso Restrito</h3>
          <p>Você não possui permissão para acessar esta funcionalidade. Contate seu administrador.</p>
        </div>
      `;
      return;
    }
  }

  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (active) active.classList.add('active');

  const titles = {
    perfil: 'Meu Perfil', dashboard: 'Dashboard', biblioteca: 'Biblioteca Central', templates: 'Templates de Texto', crm: 'CRM / Funil',
    agendamentos: 'Calendário de Envios', automacoes: 'Automações Clássicas', flow: 'Automação Visual (Flow)', campanhas: 'Campanhas de Envio', contatos: 'Gestão de Contatos', admin: 'Gestão da Equipe', config: 'Configurações',
    privacidade: 'Privacidade & Segurança'
  };
  
  const icons = {
    home: `<svg class="header-route-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    dashboard: `<svg class="header-route-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    crm: `<svg class="header-route-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    biblioteca: `<svg class="header-route-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    config: `<svg class="header-route-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  };

  const title = titles[section] || section;
  document.getElementById('page-title').textContent = title;
  
  // Header breadcrumb top - OCULTO PARA EVITAR REDUNDÂNCIA PREMIUM
  const bcTop = document.getElementById('header-breadcrumb-top');
  if (bcTop) bcTop.style.display = 'none';

  // Header Route Nav - MODERNIZADO (estilo premium com respiro saudável)
  const routeNav = document.getElementById('header-route-nav');
  if (routeNav) {
    const sectionIcon = icons[section] || icons.dashboard;
    routeNav.innerHTML = `
      <div class="rs-breadcrumbs">
        <div class="rs-breadcrumb-item" onclick="navigate('dashboard')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> Início
        </div>
        <span class="rs-breadcrumb-sep">/</span>
        <div class="rs-breadcrumb-item" onclick="navigate('dashboard')">Painel</div>
        <span class="rs-breadcrumb-sep">/</span>
        <div class="rs-breadcrumb-item active" style="color:var(--accent);">${title}</div>
      </div>
    `;
  }

  // Inject Modern CSS for Breadcrumbs if not exists
  if (!document.getElementById('rs-global-nav-styles')) {
    const s = document.createElement('style');
    s.id = 'rs-global-nav-styles';
    s.textContent = `
       .rs-breadcrumbs { 
          display: flex; align-items: center; gap: 10px; 
          color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 500; 
          margin-top: 24px; padding-bottom: 8px;
          animation: fadeIn 0.3s ease;
       }
       .rs-breadcrumb-item { display: flex; align-items: center; gap: 6px; cursor: pointer; transition: color 0.2s; }
       .rs-breadcrumb-item:hover { color: #fff; }
       .rs-breadcrumb-item svg { width: 14px; height: 14px; opacity: 0.7; }
       .rs-breadcrumb-sep { opacity: 0.3; font-size: 11px; }
       .rs-breadcrumb-item.active { font-weight: 600; }
       @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(s);
  }

  // Stats / Subtitle
  const subtitleEl = document.getElementById('page-subtitle');
  if (subtitleEl) {
    if (section === 'crm') {
      const count = (painelData.leads || []).length;
      subtitleEl.textContent = `${count} contatos no funil, última atualização hoje`;
    } else if (section === 'templates') {
      const count = (painelData.templates || []).length;
      subtitleEl.textContent = `${count} templates disponíveis`;
    } else {
      subtitleEl.textContent = `Acesso rápido e gestão centralizada`;
    }
  }

  // Limpiar controles bar por padrão
  const controlsBar = document.getElementById('page-controls-bar');
  if (controlsBar) {
    controlsBar.innerHTML = '';
  }

  document.getElementById('header-actions').innerHTML = '';
  
  // Restaurar sino original do header (caso tenha sido escondido pelo CRM)
  const headerBell = document.getElementById('btn-bell-reminders');
  if (headerBell) headerBell.parentElement.style.display = 'block';

  renderSection(section);
}

function renderSection(section) {
  const c = document.getElementById('main-content');
  c.scrollTop = 0;
  switch(section) {
    case 'dashboard': return renderDashboard(c);
    case 'biblioteca': return renderBiblioteca(c);
    case 'templates': return renderTemplates(c);
    case 'crm': return renderCRM(c);
    case 'automacoes': return renderAutomacoes(c);
    case 'agendamentos': return renderAgendamentos(c);
    case 'flow': return renderFlow(c);
    case 'campanhas': return renderCampanhas(c);
    case 'contatos': return renderContatos(c);
    case 'privacidade': return renderPrivacidade(c);
    case 'admin': return renderAdmin(c);
    case 'perfil': return renderPerfil(c);
    default: c.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div><h3>Em desenvolvimento</h3><p>Esta seção estará disponível em breve.</p></div>`;
  }
}

// ═══ BIBLIOTECA HEADER NAVIGATION ════════════════════════════
function renderBibliotecaHeader() {
  const subNav = document.getElementById('page-controls-bar');
  if (!subNav) return;
  subNav.innerHTML = ''; 
}

window.switchBibliotecaTab = function(tab) {
  console.log('[Painel] Clique recebido ->', tab);
  if (!tab) return;

  window.bibliotecaTabAtiva = tab;
  localStorage.setItem('upsiden_last_lib_tab', tab);
  
  const c = document.getElementById('main-content');
  if (!c) {
    console.error('[Painel] Erro: main-content não encontrado');
    return;
  }

  const moduleUrls = {
    'audios': '../modules/audios.html',
    'documentos': '../modules/documentos.html',
    'midias': '../modules/midias.html'
  };

  const url = moduleUrls[tab] || moduleUrls['audios'];
  
  // Limpar conteúdo e injetar novo iframe para garantir recarregamento limpo
  c.innerHTML = `
    <div class="animate-in" style="height: 100%; width: 100%; overflow: hidden; opacity: 0; animation: fadeIn 0.3s forwards;">
      <iframe src="${url}" frameborder="0" style="width: 100%; height: 100%; display: block; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-primary);"></iframe>
    </div>
  `;
};

async function atualizarBadgesBiblioteca() {
  // Primário: Usar dados do cache global (painelData) para resposta instantânea
  if (typeof painelData !== 'undefined') {
    const ba = document.getElementById('badge-audios'); if(ba) ba.textContent = (painelData.audios || []).length;
    const bd = document.getElementById('badge-documentos'); if(bd) bd.textContent = (painelData.documentos || []).length;
    const bm = document.getElementById('badge-midias'); if(bm) bm.textContent = (painelData.midias || []).length;
  }

  // Secundário: Buscar no DB para garantir sincronia total
  try {
    const [a, d, m] = await Promise.all([
      UpsidenDB.from('audios').select('id').execute().catch(()=>[]),
      UpsidenDB.from('documentos').select('id').execute().catch(()=>[]),
      UpsidenDB.from('midias').select('id').execute().catch(()=>[])
    ]);
    
    const ba = document.getElementById('badge-audios'); if(ba) ba.textContent = a?.length || 0;
    const bd = document.getElementById('badge-documentos'); if(bd) bd.textContent = d?.length || 0;
    const bm = document.getElementById('badge-midias'); if(bm) bm.textContent = m?.length || 0;
  } catch(e) { /* ignore silent failure */ }
}

// ═══ ACTIONS ═════════════════════════════════════════════════
async function toggleShare(table, id, val) {
  try {
    await UpsidenDB.from(table).update({ compartilhado: val }).eq('id', id);
    const arr = painelData[table]; const item = arr.find(i => i.id === id);
    if (item) item.compartilhado = val;
    toast(val ? 'Compartilhado com o time' : 'Removido do compartilhamento', 'success');
  } catch(e) { toast('Erro ao alterar compartilhamento', 'error'); }
}

async function deleteItem(table, id) {
  if (!confirm('Tem certeza que deseja excluir?')) return;
  try {
    const item = painelData[table].find(i => i.id === id);
    if (item?.storage_path) await UpsidenStorage.remove(table, [item.storage_path]).catch(()=>{});
    await UpsidenDB.from(table).delete().eq('id', id);
    painelData[table] = painelData[table].filter(i => i.id !== id);
    renderSection(currentSection);
    toast('Item excluído', 'success');
  } catch(e) { toast('Erro ao excluir', 'error'); }
}

function filterTable(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.data-table tbody tr').forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(q) ? '' : 'none';
  });
}

// ═══ UPLOAD HANDLERS ═════════════════════════════════════════
async function handleAudioUpload(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  toast(`Importando ${files.length} áudio(s)...`, 'info');
  for (const file of files) {
    try {
      const ab = await file.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ctx.decodeAudioData(ab.slice(0)); const dur = buf.duration; await ctx.close();
      const path = `${userData.userId}/${Date.now()}_${file.name}`;
      await UpsidenStorage.upload('audios', path, file, file.type);
      const res = await UpsidenDB.from('audios').insert({ 
        nome: file.name.replace(/\.[^/.]+$/,''), 
        nome_original: file.name, 
        tipo_mime: file.type||'audio/mpeg', 
        duracao: dur, 
        tamanho: file.size, 
        storage_path: path, 
        criado_por: userData.userId, 
        admin_id: userData.teamAdminId, 
        compartilhado: userData.isAdmin,
        acesso_individual: [], 
        favorito: false 
      }).select().execute();
      if (res && res.length) painelData.audios.unshift(res[0]);
    } catch(err) { console.error(P, err); toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('audios'); toast(`${files.length} áudio(s) importado(s)!`, 'success'); e.target.value = '';
}

async function handleDocUpload(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  for (const file of files) {
    try {
      const path = `${userData.userId}/${Date.now()}_${file.name}`;
      await UpsidenStorage.upload('documentos', path, file, file.type);
      const res = await UpsidenDB.from('documentos').insert({ 
        nome: file.name, 
        tipo: file.type, 
        tamanho: file.size, 
        storage_path: path, 
        criado_por: userData.userId, 
        admin_id: userData.teamAdminId, 
        compartilhado: userData.isAdmin,
        acesso_individual: []
      }).select().execute();
      if (res && res.length) painelData.documentos.unshift(res[0]);
    } catch(err) { toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('documentos'); toast('Documentos enviados!', 'success'); e.target.value = '';
}

async function handleMediaUpload(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  for (const file of files) {
    try {
      const path = `${userData.userId}/${Date.now()}_${file.name}`;
      await UpsidenStorage.upload('midias', path, file, file.type);
      const res = await UpsidenDB.from('midias').insert({ 
        nome: file.name, 
        tipo: file.type, 
        tamanho: file.size, 
        storage_path: path, 
        criado_por: userData.userId, 
        admin_id: userData.teamAdminId, 
        compartilhado: userData.isAdmin,
        acesso_individual: []
      }).select().execute();
      if (res && res.length) painelData.midias.unshift(res[0]);
    } catch(err) { toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('midias'); toast('Mídias enviadas!', 'success'); e.target.value = '';
}

// Sub-tab switchers
window.switchTab = function(tab) { window.autoSubTab = tab; renderSection('automacoes'); };
window.switchCampTab = function(tab) { window.campSubTab = tab; renderSection('campanhas'); };

/**
 * Modal dinâmico para gerenciar acesso granular (Equipe + Individual)
 */
async function abrirModalAcesso(table, item, onSave) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; z-index: 10001;
    animation: fadeIn 0.3s ease;
  `;
  
  // Buscar Membros do Time
  const adminId = userData.role === 'admin' ? userData.userId : userData.admin_id;
  let members = [];
  try {
     const resMembers = await UpsidenDB.from('profiles')
      .select('id, nome, email, role')
      .eq('admin_id', adminId)
      .or(`id.eq.${adminId}`)
      .execute();
     members = resMembers || [];
  } catch(e) { console.error('Erro ao buscar membros', e); }

  const acessoIndividual = item.acesso_individual || [];
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 480px; width: 90%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
      <div style="padding: 24px 32px; background: linear-gradient(to right, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Configurações de Acesso</h3>
          <p style="margin: 4px 0 0; font-size: 13px; color: var(--text-muted); font-weight: 500;">${item.nome}</p>
        </div>
        <button class="btn-dim btn-close-modal" style="padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.05);">✕</button>
      </div>

      <div style="padding: 32px; max-height: 450px; overflow-y: auto;">
        <!-- Seção: Compartilhamento Global -->
        <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 44px; height: 44px; background: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(255,69,0,0.2);">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Liberar para toda a equipe</div>
              <div style="font-size: 12px; color: var(--text-muted);">Todos os closers poderão ver/enviar</div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" id="check-share-team" ${item.compartilhado ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>

        <div style="margin-bottom: 16px; font-weight: 700; font-size: 14px; color: var(--text); display:flex; align-items:center; gap:8px;">
           <div style="width: 4px; height: 16px; background: var(--accent); border-radius: 4px;"></div>
           Acesso Individual
        </div>
        
        <div id="members-selection-list" style="display: flex; flex-direction: column; gap: 10px;">
          ${members.filter(m => m.id !== userData.userId).map(m => {
            const iniciais = m.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return `
              <label style="display: flex; align-items: center; gap: 14px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 14px; cursor: pointer; transition: all .2s; background: var(--bg-secondary);" class="member-access-row">
                <input type="checkbox" name="member-access" value="${m.id}" ${acessoIndividual.includes(m.id) ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent);">
                <div style="width: 36px; height: 36px; background: var(--border); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--text-muted);">${iniciais}</div>
                <div style="flex: 1;">
                  <div style="font-size: 14px; font-weight: 600; color: var(--text);">${m.nome}</div>
                  <div style="font-size: 11px; color: var(--text-muted); opacity: 0.7;">${m.email}</div>
                </div>
                <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; padding: 4px 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted);">${m.role}</span>
              </label>
            `;
          }).join('') || '<div style="text-align:center; padding: 30px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed var(--border);"><p style="color:var(--text-muted); font-size:13px; margin:0;">Nenhum outro membro no seu time.</p></div>'}
        </div>
      </div>

      <div style="padding: 24px 32px; background: var(--bg-secondary); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px;">
        <button class="btn-dim btn-close-modal" style="padding: 12px 24px; border-radius: 12px; font-weight: 600;">Cancelar</button>
        <button id="btn-save-access" class="btn-primary" style="padding: 12px 32px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 15px rgba(255,69,0,0.3);">Salvar Alterações</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Estilos Adicionais
  if(!document.getElementById('modal-sharing-styles')) {
    const s = document.createElement('style');
    s.id = 'modal-sharing-styles';
    s.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border); transition: .4s; border-radius: 34px; }
      .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
      input:checked + .slider { background-color: var(--accent); }
      input:checked + .slider:before { transform: translateX(24px); }
      .member-access-row:hover { border-color: var(--accent) !important; background: rgba(255,69,0,0.05) !important; transform: translateX(4px); }
      .member-access-row input:checked + div { background: var(--accent) !important; color: white !important; }
    `;
    document.head.appendChild(s);
  }

  // Eventos
  modal.querySelectorAll('.btn-close-modal').forEach(b => b.onclick = () => modal.remove());
  
  const btnSave = modal.querySelector('#btn-save-access');
  btnSave.onclick = async () => {
    btnSave.disabled = true;
    btnSave.textContent = 'Processando...';
    
    const compartilhado = modal.querySelector('#check-share-team').checked;
    const individual = Array.from(modal.querySelectorAll('input[name="member-access"]:checked')).map(i => i.value);
    
    try {
      await UpsidenDB.from(table).update({
        compartilhado,
        acesso_individual: individual
      }).eq('id', item.id).execute();
      
      toast('Visibilidade atualizada! 🚀', 'success');
      modal.remove();
      if(onSave) onSave({ compartilhado, acesso_individual: individual });
    } catch(e) {
      console.error('Erro ao salvar acesso', e);
      toast('Falha ao sincronizar acesso', 'error');
      btnSave.disabled = false;
      btnSave.textContent = 'Tentar Novamente';
    }
  };
}
