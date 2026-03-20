/* ═══════════════════════════════════════════════════════════════
   Upsiden Painel — Full-Page Dashboard (Vanilla JS SPA)
   ═══════════════════════════════════════════════════════════════ */

const P = '[Painel]';
let currentSection = 'dashboard';
let userData = { userId: null, nome: '', email: '', isAdmin: false };
let painelData = { audios: [], documentos: [], midias: [], templates: [], leads: [], membros: [] };

// ═══ TOAST ═══════════════════════════════════════════════════
function toast(msg, tipo = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

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
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (active) active.classList.add('active');

  const titles = {
    dashboard: 'Dashboard', audios: 'Biblioteca de Áudios', documentos: 'Documentos',
    midias: 'Mídias', templates: 'Templates de Texto', crm: 'CRM / Funil',
    automacoes: 'Automações', admin: 'Gestão da Equipe', config: 'Configurações'
  };
  const title = titles[section] || section;
  document.getElementById('page-title').textContent = title;
  const bc = document.getElementById('breadcrumb-section');
  if (bc) bc.textContent = title;
  document.getElementById('header-actions').innerHTML = '';
  renderSection(section);
}

// ═══ RENDER SECTIONS ═════════════════════════════════════════
function renderSection(section) {
  const c = document.getElementById('main-content');
  c.scrollTop = 0;
  switch(section) {
    case 'dashboard': return renderDashboard(c);
    case 'audios': return renderAudios(c);
    case 'documentos': return renderDocumentos(c);
    case 'midias': return renderMidias(c);
    case 'templates': return renderTemplates(c);
    case 'crm': return renderCRM(c);
    case 'automacoes': return renderAutomacoes(c);
    case 'admin': return renderAdmin(c);
    default: c.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div><h3>Em desenvolvimento</h3><p>Esta seção estará disponível em breve.</p></div>`;
  }
}

// ═══ DASHBOARD ══════════════════════════════════════════
function renderDashboard(c) {
  const nome = userData.nome || 'Closer';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // SVG icons for stat cards
  const iconAudio = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  const iconDoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  const iconImg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  const iconMsg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  const iconChevron = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>`;

  // Stat cards data
  const stats = [
    { icon: iconAudio, value: painelData.audios.length,     label: 'Áudios na Biblioteca',  section: 'audios' },
    { icon: iconDoc,   value: painelData.documentos.length, label: 'Documentos',             section: 'documentos' },
    { icon: iconImg,   value: painelData.midias.length,     label: 'Mídias',                 section: 'midias' },
    { icon: iconMsg,   value: painelData.templates.length,  label: 'Templates de Texto',    section: 'templates' },
  ];

  const statCards = stats.map((s, i) => `
    <div class="stat-card animate-in" style="animation-delay:${i * 60}ms" onclick="navigate('${s.section}')">
      <div class="stat-card-top">
        <div class="stat-icon">${s.icon}</div>
        <button class="stat-link" onclick="event.stopPropagation();navigate('${s.section}')">
          Ver detalhes ${iconChevron}
        </button>
      </div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');

  // Quick actions — SVG icons
  const qIcons = {
    audios: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    documentos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    templates: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>`,
    crm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  };
  const actions = [
    { key: 'audios',     title: 'Importar Áudios',    sub: 'Adicione novos áudios',   bg: 'rgba(255,98,0,0.12)',     color: 'var(--accent)' },
    { key: 'documentos', title: 'Upload Documentos', sub: 'PDFs, Word, planilhas',  bg: 'rgba(0,168,132,0.12)',    color: 'var(--success)' },
    { key: 'templates',  title: 'Novo Template',     sub: 'Crie um texto rápido',   bg: 'rgba(247,201,72,0.12)',   color: 'var(--warning)' },
    { key: 'crm',        title: 'Gerenciar Leads',   sub: 'Funil de vendas',        bg: 'rgba(255,98,0,0.12)',     color: 'var(--accent)' },
  ];

  const actionCards = actions.map(a => `
    <div class="quick-action-card" onclick="navigate('${a.key}')">
      <div class="qa-icon" style="background:${a.bg};color:${a.color};">${qIcons[a.key]}</div>
      <div class="qa-title">${a.title}</div>
      <div class="qa-sub">${a.sub}</div>
    </div>`).join('');

  // Recent items (last 4 audios + templates combined)
  const recents = [
    ...painelData.audios.slice(0,2).map(a => ({ icon:'🎧', title: a.nome, sub: 'Biblioteca de Áudios', date: fmtDate(a.created_at), badge: 'Novo', badgeColor: 'orange', section: 'audios' })),
    ...painelData.templates.slice(0,2).map(t => ({ icon:'💬', title: t.titulo||t.nome||'Template', sub: 'Templates de Texto', date: fmtDate(t.created_at), badge: 'Ativo', badgeColor: 'green', section: 'templates' })),
    ...painelData.leads.slice(0,2).map(l => ({ icon:'📊', title: l.nome, sub: 'CRM / Funil', date: fmtDate(l.created_at), badge: l.estagio === 'fechado' ? 'Fechado' : l.estagio === 'negociacao' ? 'Em negociação' : 'Prospecção', badgeColor: l.estagio === 'fechado' ? 'green' : l.estagio === 'negociacao' ? 'orange' : 'yellow', section: 'crm' })),
  ].slice(0, 6);

  const recentCards = recents.length > 0 ? recents.map(r => `
    <div class="recent-card animate-in" onclick="navigate('${r.section}')">
      <div class="recent-card-header">
        <span class="rc-tag">${r.icon}</span>
        <span class="rc-badge ${r.badgeColor}">${r.badge}</span>
      </div>
      <h4>${r.title}</h4>
      <p>${r.sub}</p>
      <div class="rc-footer">
        <div class="rc-footer-left">
          <div class="rc-mini-avatar">${(userData.nome[0]||'U').toUpperCase()}</div>
        </div>
        <span class="rc-date">${r.date}</span>
      </div>
    </div>`).join('') : `<p style="color:var(--text-muted);font-size:13px;">Nenhum item recente.</p>`;

  c.innerHTML = `
    <div class="dash-welcome animate-in">
      <h2>${saudacao}, ${nome}! 👋</h2>
      <p>Gerencie seus áudios, documentos, templates e leads em um só lugar.</p>
    </div>

    <div class="dash-banner animate-in">
      <div class="banner-icon">⚡</div>
      <div class="banner-text"><strong>Upsiden está ativo.</strong> Acesse rapidamente seus recursos e automatize suas conversas no WhatsApp.</div>
      <button class="banner-link" onclick="navigate('automacoes')">Ver Automações</button>
    </div>

    <div class="stat-grid">${statCards}</div>

    <div class="section-header">
      <h2>Ações Rápidas</h2>
    </div>
    <div class="quick-actions" style="margin-bottom:28px;">${actionCards}</div>

    <div class="section-header">
      <h2>Atividade Recente</h2>
      <button class="see-all" onclick="navigate('audios')">Ver tudo →</button>
    </div>
    <div class="recent-grid">${recentCards}</div>
  `;
}

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
        <td><label class="toggle-switch"><input type="checkbox" ${a.compartilhado?'checked':''} onchange="toggleShare('audios','${a.id}',this.checked)"><span class="toggle-slider"></span></label></td>
        <td style="color:var(--text-muted)">${fmtDate(a.created_at)}</td>
        <td><div class="cell-actions"><button class="btn-icon" title="Excluir" onclick="deleteItem('audios','${a.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button></div></td>
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
        <td><label class="toggle-switch"><input type="checkbox" ${d.compartilhado?'checked':''} onchange="toggleShare('documentos','${d.id}',this.checked)"><span class="toggle-slider"></span></label></td>
        <td style="color:var(--text-muted)">${fmtDate(d.created_at)}</td>
        <td><div class="cell-actions"><button class="btn-icon" title="Excluir" onclick="deleteItem('documentos','${d.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button></div></td>
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

// ═══ TEMPLATES ═══════════════════════════════════════════════
function renderTemplates(c) {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" onclick="showNewTemplateModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Template</button>`;

  if (painelData.templates.length === 0) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><h3>Nenhum template</h3><p>Crie templates de texto para agilizar suas conversas.</p></div>`;
  } else {
    let html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    painelData.templates.forEach(t => {
      html += `<div class="auto-section animate-in" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div style="flex:1;"><h3 style="margin-bottom:8px;">${t.titulo || t.nome || 'Sem título'}</h3><p style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.5;">${t.conteudo || t.texto || ''}</p></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn-icon" title="Editar" onclick="editTemplate('${t.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="btn-icon" title="Excluir" onclick="deleteItem('templates','${t.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </div>
      </div>`;
    });
    html += '</div>';
    c.innerHTML = html;
  }
}

// ═══ CRM ═════════════════════════════════════════════════════
function renderCRM(c) {
  document.getElementById('header-actions').innerHTML = `<button class="btn btn-primary" onclick="showNewLeadModal()"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Lead</button>`;

  const stages = [
    { id: 'prospeccao', label: 'Prospecção', color: 'var(--warning)' },
    { id: 'negociacao', label: 'Negociação', color: 'var(--accent)' },
    { id: 'fechado', label: 'Fechado', color: 'var(--success)' }
  ];

  let html = '<div class="kanban-board">';
  stages.forEach(stage => {
    const stageLeads = painelData.leads.filter(l => l.estagio === stage.id);
    html += `<div class="kanban-column">
      <div class="kanban-column-header"><span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:${stage.color}"></span>${stage.label}</span><span class="count">${stageLeads.length}</span></div>
      <div class="kanban-cards" data-stage="${stage.id}">`;
    stageLeads.forEach(lead => {
      html += `<div class="kanban-card" draggable="true" data-lead-id="${lead.id}"><div class="card-name">${lead.nome}</div><div class="card-phone">${lead.telefone || ''}</div></div>`;
    });
    if (stageLeads.length === 0) html += `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Nenhum lead</div>`;
    html += `</div></div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// ═══ AUTOMAÇÕES ══════════════════════════════════════════════
function renderAutomacoes(c) {
  c.innerHTML = `
    <div class="auto-section animate-in">
      <h3>💬 Resposta Automática (Saudação)</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Configure uma mensagem automática de boas-vindas para novos contatos.</p>
      <div class="form-group"><label class="form-label">Mensagem de Saudação</label><textarea class="form-textarea" id="auto-saudacao" rows="3" placeholder="Ex: Olá! Obrigado por entrar em contato. Em breve retornaremos."></textarea></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <label class="toggle-switch"><input type="checkbox" id="auto-saudacao-ativo"><span class="toggle-slider"></span></label>
        <span style="font-size:13px;color:var(--text-secondary);">Ativar saudação automática</span>
      </div>
      <button class="btn btn-primary" onclick="salvarSaudacao()">Salvar Saudação</button>
    </div>
    <div class="auto-section animate-in" style="animation-delay:100ms">
      <h3>⚡ Gatilhos Inteligentes</h3>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Defina palavras-chave que disparam respostas automáticas.</p>
      <div id="triggers-list"></div>
      <button class="btn btn-secondary" onclick="addTriggerRow()" style="margin-top:12px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Novo Gatilho</button>
      <button class="btn btn-primary" onclick="salvarGatilhos()" style="margin-top:12px;margin-left:8px;">Salvar Gatilhos</button>
    </div>`;
  loadAutomationConfig();
}

// ═══ ADMIN ═══════════════════════════════════════════════════
function renderAdmin(c) {
  if (!userData.isAdmin) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><h3>Acesso Restrito</h3><p>Apenas administradores podem acessar esta seção.</p></div>`;
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
  const allFiles = [...painelData.audios.filter(a=>a.compartilhado).map(a=>({...a,_tipo:'🎵'})), ...painelData.documentos.filter(d=>d.compartilhado).map(d=>({...d,_tipo:docIcon(d.tipo)})), ...painelData.midias.filter(m=>m.compartilhado).map(m=>({...m,_tipo:'🖼️'}))];
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

// ═══ ACTIONS ═════════════════════════════════════════════════
async function toggleShare(table, id, val) {
  try {
    await UpsidenDB.from(table).eq('id', id).update({ compartilhado: val }).execute();
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
    await UpsidenDB.from(table).eq('id', id).delete().execute();
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
      const res = await UpsidenDB.from('audios').insert({ nome: file.name.replace(/\.[^/.]+$/,''), nome_original: file.name, tipo_mime: file.type||'audio/mpeg', duracao: dur, tamanho: file.size, storage_path: path, criado_por: userData.userId, compartilhado: userData.isAdmin, favorito: false }).execute();
      if (res?.length) painelData.audios.unshift(res[0]);
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
      const res = await UpsidenDB.from('documentos').insert({ nome: file.name, tipo: file.type, tamanho: file.size, storage_path: path, criado_por: userData.userId, compartilhado: userData.isAdmin }).execute();
      if (res?.length) painelData.documentos.unshift(res[0]);
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
      const res = await UpsidenDB.from('midias').insert({ nome: file.name, tipo: file.type, tamanho: file.size, storage_path: path, criado_por: userData.userId, compartilhado: userData.isAdmin }).execute();
      if (res?.length) painelData.midias.unshift(res[0]);
    } catch(err) { toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('midias'); toast('Mídias enviadas!', 'success'); e.target.value = '';
}

// ═══ TEMPLATE MODAL ══════════════════════════════════════════
function showNewTemplateModal() { showTemplateModal(null); }
function editTemplate(id) { const t = painelData.templates.find(x=>x.id===id); if (t) showTemplateModal(t); }

function showTemplateModal(template) {
  const existing = document.querySelector('.modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${template ? 'Editar' : 'Novo'} Template</h3><button class="btn-ghost" onclick="this.closest('.modal-overlay').remove()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
  <div class="modal-body"><div class="form-group"><label class="form-label">Título</label><input class="form-input" id="tpl-titulo" value="${template?.titulo||template?.nome||''}"></div><div class="form-group"><label class="form-label">Conteúdo</label><textarea class="form-textarea" id="tpl-conteudo" rows="5">${template?.conteudo||template?.texto||''}</textarea></div></div>
  <div class="modal-footer"><button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button class="btn btn-primary" onclick="salvarTemplate('${template?.id||''}')">Salvar</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function salvarTemplate(id) {
  const titulo = document.getElementById('tpl-titulo').value.trim();
  const conteudo = document.getElementById('tpl-conteudo').value.trim();
  if (!titulo || !conteudo) { toast('Preencha título e conteúdo', 'error'); return; }
  try {
    if (id) {
      await UpsidenDB.from('templates').eq('id', id).update({ titulo, conteudo }).execute();
      const idx = painelData.templates.findIndex(t=>t.id===id);
      if (idx>=0) painelData.templates[idx] = {...painelData.templates[idx], titulo, conteudo};
    } else {
      const res = await UpsidenDB.from('templates').insert({ titulo, conteudo, criado_por: userData.userId }).execute();
      if (res?.length) painelData.templates.unshift(res[0]);
    }
    document.querySelector('.modal-overlay')?.remove();
    renderSection('templates'); toast('Template salvo!', 'success');
  } catch(e) { toast('Erro ao salvar template', 'error'); }
}

// ═══ LEAD MODAL ══════════════════════════════════════════════
function showNewLeadModal() {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>Novo Lead</h3><button class="btn-ghost" onclick="this.closest('.modal-overlay').remove()"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div>
  <div class="modal-body"><div class="form-group"><label class="form-label">Nome</label><input class="form-input" id="lead-nome" placeholder="Nome do lead"></div><div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="lead-tel" placeholder="Ex: 5531999999999"></div></div>
  <div class="modal-footer"><button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button class="btn btn-primary" onclick="salvarLead()">Salvar</button></div></div>`;
  document.body.appendChild(overlay);
}

async function salvarLead() {
  const nome = document.getElementById('lead-nome').value.trim();
  const telefone = document.getElementById('lead-tel').value.trim();
  if (!nome) { toast('Informe o nome do lead', 'error'); return; }
  try {
    const res = await UpsidenDB.from('leads').insert({ nome, telefone, estagio: 'prospeccao', criado_por: userData.userId }).execute();
    if (res?.length) painelData.leads.unshift(res[0]);
    document.querySelector('.modal-overlay')?.remove();
    renderSection('crm'); toast('Lead criado!', 'success');
  } catch(e) { toast('Erro ao criar lead', 'error'); }
}

// ═══ AUTOMATION CONFIG ═══════════════════════════════════════
function loadAutomationConfig() {
  chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers'], res => {
    const saud = res.ups_config_saudacao;
    if (saud) {
      const msgEl = document.getElementById('auto-saudacao');
      const ativoEl = document.getElementById('auto-saudacao-ativo');
      if (msgEl) msgEl.value = saud.mensagem || '';
      if (ativoEl) ativoEl.checked = saud.ativo || false;
    }
    const triggers = res.ups_config_triggers || [];
    triggers.forEach(t => addTriggerRow(t.palavra, t.resposta));
  });
}

function addTriggerRow(palavra, resposta) {
  const list = document.getElementById('triggers-list');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  row.innerHTML = `<input class="form-input trigger-palavra" placeholder="Palavra-chave" value="${palavra||''}" style="flex:1;"><input class="form-input trigger-resposta" placeholder="Resposta automática" value="${resposta||''}" style="flex:2;"><button class="btn-icon" onclick="this.parentElement.remove()" title="Remover"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`;
  list.appendChild(row);
}

function salvarSaudacao() {
  const msg = document.getElementById('auto-saudacao').value.trim();
  const ativo = document.getElementById('auto-saudacao-ativo').checked;
  chrome.storage.local.set({ ups_config_saudacao: { mensagem: msg, ativo } }, () => toast('Saudação salva!', 'success'));
}

function salvarGatilhos() {
  const rows = document.querySelectorAll('#triggers-list > div');
  const triggers = [];
  rows.forEach(row => {
    const p = row.querySelector('.trigger-palavra').value.trim();
    const r = row.querySelector('.trigger-resposta').value.trim();
    if (p && r) triggers.push({ palavra: p, resposta: r });
  });
  chrome.storage.local.set({ ups_config_triggers: triggers }, () => toast(`${triggers.length} gatilho(s) salvo(s)!`, 'success'));
}

// ═══ INIT ════════════════════════════════════════════════════
async function initPainel() {
  console.log(P, 'Inicializando Painel Upsiden...');
  try {
    const loggedIn = await verificarAuth();
    document.getElementById('loading-page').style.display = 'none';

    if (!loggedIn) {
      document.getElementById('auth-guard').style.display = 'block';
      document.getElementById('btn-goto-login')?.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
      });
      return;
    }

    document.getElementById('painel-app').style.display = 'flex';
    userData.userId = await UpsidenAuth.getUserId();
    userData.isAdmin = await UpsidenAuth.isAdmin();
    const profile = await UpsidenAuth.getProfile();
    userData.nome = profile?.nome || profile?.email?.split('@')[0] || '';
    userData.email = profile?.email || '';

    // UI — user info
    document.getElementById('user-display-name').textContent = userData.nome;
    document.getElementById('user-display-role').textContent = userData.isAdmin ? 'Administrador' : 'Closer';
    document.getElementById('user-display-role').className = `user-role ${userData.isAdmin ? 'admin' : ''}`;
    document.getElementById('user-avatar').textContent = (userData.nome[0] || 'U').toUpperCase();
    const presenceStack = document.getElementById('presence-stack');
    if (presenceStack) presenceStack.innerHTML = `<div class="p-avatar">${(userData.nome[0] || 'U').toUpperCase()}</div>`;

    if (userData.isAdmin) {
      document.getElementById('nav-admin').style.display = 'flex';
      document.getElementById('admin-section-label').style.display = 'block';
    }

    // Load data
    console.log(P, 'Carregando dados...');
    const [audios, docs, midias, templates, leads, membros] = await Promise.all([
      UpsidenDB.from('audios').select('*').order('created_at', false).execute().catch(()=>[]),
      UpsidenDB.from('documentos').select('*').order('created_at', false).execute().catch(()=>[]),
      UpsidenDB.from('midias').select('*').order('created_at', false).execute().catch(()=>[]),
      UpsidenDB.from('templates').select('*').order('created_at', false).execute().catch(()=>[]),
      UpsidenDB.from('leads').select('*').order('created_at', false).execute().catch(()=>[]),
      userData.isAdmin ? UpsidenDB.from('profiles').select('*').execute().catch(()=>[]) : Promise.resolve([])
    ]);

    painelData = { audios: audios||[], documentos: docs||[], midias: midias||[], templates: templates||[], leads: leads||[], membros: membros||[] };

    // Nav events
    document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.section));
    });

    // ─ Sidebar toggle (collapse / expand) ─
    const sidebar    = document.getElementById('painel-sidebar');
    const toggleBtn  = document.getElementById('sidebar-toggle');
    const savedState = localStorage.getItem('ups_sidebar_collapsed');
    if (savedState === 'true') sidebar.classList.add('collapsed');

    toggleBtn?.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      localStorage.setItem('ups_sidebar_collapsed', isCollapsed);
      // Update user menu popup position
      updateUserMenuPosition();
    });

    // ─ User menu popup ─
    const btnUserMenu      = document.getElementById('btn-user-menu');
    const userMenuPopup    = document.getElementById('user-menu-popup');
    const userMenuOverlay  = document.getElementById('user-menu-overlay');

    function updateUserMenuPosition() {
      if (!userMenuPopup || !sidebar) return;
      const sidebarW = sidebar.classList.contains('collapsed')
        ? getComputedStyle(document.documentElement).getPropertyValue('--sidebar-collapsed').trim()
        : getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
      userMenuPopup.style.left = `calc(${sidebarW} + 8px)`;
    }

    function openUserMenu() {
      updateUserMenuPosition();
      userMenuPopup?.classList.add('open');
      userMenuOverlay?.classList.add('open');
    }
    function closeUserMenu() {
      userMenuPopup?.classList.remove('open');
      userMenuOverlay?.classList.remove('open');
    }

    btnUserMenu?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = userMenuPopup?.classList.contains('open');
      isOpen ? closeUserMenu() : openUserMenu();
    });
    userMenuOverlay?.addEventListener('click', closeUserMenu);

    // Populate user menu popup
    const umpName  = document.getElementById('ump-name');
    const umpEmail = document.getElementById('ump-email');
    const umpAvatar = document.getElementById('user-avatar-popup');
    if (umpName)   umpName.textContent   = userData.nome  || 'Usuário';
    if (umpEmail)  umpEmail.textContent  = userData.email || '';
    if (umpAvatar) umpAvatar.textContent = (userData.nome[0] || 'U').toUpperCase();

    // Logout (inside popup)
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      closeUserMenu();
      await UpsidenAuth.signOut();
      window.location.reload();
    });

    console.log(P, '✅ Painel pronto!');
    navigate('dashboard');

  } catch(err) {
    console.error(P, 'Erro ao inicializar:', err);
    document.getElementById('loading-page').innerHTML = `<p style="color:var(--danger);">Erro ao carregar painel. Recarregue a página.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', initPainel);
