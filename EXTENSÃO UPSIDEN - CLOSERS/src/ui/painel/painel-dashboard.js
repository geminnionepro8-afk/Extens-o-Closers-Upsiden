/**
 * @file painel-dashboard.js
 * @description Renderiza a seção Dashboard do Painel Upsiden.
 *              Mostra: saudação personalizada, stat cards (áudios, docs, mídias, templates),
 *              ações rápidas e atividade recente.
 * @module Módulo 06: UI — Painel (Dashboard)
 * @date 21/03/2026
 */

function renderDashboard(c) {
  const nome = userData.nome || 'Closer';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const iconAudio = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  const iconDoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  const iconImg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  const iconMsg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  const iconChevron = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>`;

  const stats = [
    { icon: iconAudio, value: painelData.audios.length,     label: 'Áudios na Biblioteca',  section: 'audios' },
    { icon: iconDoc,   value: painelData.documentos.length, label: 'Documentos',             section: 'documentos' },
    { icon: iconImg,   value: painelData.midias.length,     label: 'Mídias',                 section: 'midias' },
    { icon: iconMsg,   value: painelData.templates.length,  label: 'Templates de Texto',    section: 'templates' },
  ];

  const statCards = stats.map((s, i) => `
    <div class="stat-card animate-in" style="animation-delay:${i * 60}ms" data-click="navigate('${s.section}')">
      <div class="stat-card-top">
        <div class="stat-icon">${s.icon}</div>
        <button class="stat-link" data-click="navigate('${s.section}')">
          Ver detalhes ${iconChevron}
        </button>
      </div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');

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
    <div class="quick-action-card" data-click="navigate('${a.key}')">
      <div class="qa-icon" style="background:${a.bg};color:${a.color};">${qIcons[a.key]}</div>
      <div class="qa-title">${a.title}</div>
      <div class="qa-sub">${a.sub}</div>
    </div>`).join('');

  const recents = [
    ...painelData.audios.slice(0,2).map(a => ({ icon:'🎧', title: a.nome, sub: 'Biblioteca de Áudios', date: fmtDate(a.created_at), badge: 'Novo', badgeColor: 'orange', section: 'audios' })),
    ...painelData.templates.slice(0,2).map(t => ({ icon:'💬', title: t.titulo||t.nome||'Template', sub: 'Templates de Texto', date: fmtDate(t.created_at), badge: 'Ativo', badgeColor: 'green', section: 'templates' })),
    ...painelData.leads.slice(0,2).map(l => ({ icon:'📊', title: l.nome, sub: 'CRM / Funil', date: fmtDate(l.created_at), badge: l.estagio === 'fechado' ? 'Fechado' : l.estagio === 'negociacao' ? 'Em negociação' : 'Prospecção', badgeColor: l.estagio === 'fechado' ? 'green' : l.estagio === 'negociacao' ? 'orange' : 'yellow', section: 'crm' })),
  ].slice(0, 6);

  const recentCards = recents.length > 0 ? recents.map(r => `
    <div class="recent-card animate-in" data-click="navigate('${r.section}')">
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
      <button class="banner-link" data-click="navigate('automacoes')">Ver Automações</button>
    </div>
    <div class="stat-grid">${statCards}</div>
    <div class="section-header"><h2>Ações Rápidas</h2></div>
    <div class="quick-actions" style="margin-bottom:28px;">${actionCards}</div>
    <div class="section-header"><h2>Atividade Recente</h2><button class="see-all" data-click="navigate('audios')">Ver tudo →</button></div>
    <div class="recent-grid">${recentCards}</div>
  `;
}
