/**
 * @file chat-filters.js
 * @description Este arquivo gerencia as abas de filtro de conversas no WhatsApp Web.
 *              Injeta um barra de abas acima da lista de chats com os filtros:
 *              "Todas", "Não Lidas", "Grupos" e "Novo Lead".
 *              Ao clicar em uma aba, os chats que não se encaixam no filtro
 *              são escondidos visualmente, permitindo ao Sr. Arthur focar
 *              apenas nas conversas relevantes para cada momento.
 * @module Módulo 06: Content Scripts — Filtros de Chat
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

/**
 * Injeta a barra de abas de filtro acima da lista de chats do WhatsApp Web.
 * As abas são: Todas, Não Lidas, Grupos, Novo Lead.
 * Evita duplicidade verificando se já existe '.ups-top-tabs'.
 */
function injetarTopTabs() {
  const paneSide = document.getElementById('pane-side');
  if (!paneSide || !paneSide.parentElement) return;

  const containerPainelLateral = paneSide.parentElement;

  if (containerPainelLateral.querySelector('.ups-top-tabs')) return;

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'ups-top-tabs';
  tabsContainer.style.cssText = 'display:flex; overflow-x:auto; padding:6px 12px; background:#111b21; border-bottom:1px solid #222e35; gap:8px; z-index:100;';

  const abas = [
    { id: 'todas', label: 'Todas', ativa: true },
    { id: 'nao_lidas', label: 'Não Lidas' },
    { id: 'grupos', label: 'Grupos' },
    { id: 'funil_lead', label: 'Novo Lead' }
  ];

  abas.forEach(aba => {
    const btn = document.createElement('button');
    btn.textContent = aba.label;
    btn.dataset.tabId = aba.id;
    btn.className = `ups-tab-btn ${aba.ativa ? 'ativa' : ''}`;
    btn.style.cssText = `
      background: ${aba.ativa ? '#00a884' : '#202c33'}; 
      color: ${aba.ativa ? '#111b21' : '#aebac1'}; 
      border:none; border-radius:16px; padding:6px 14px; font-size:13px; font-weight:500; cursor:pointer; flex-shrink:0; transition:0.2s;
    `;
    
    btn.addEventListener('click', () => {
      // Toggle visual das abas
      tabsContainer.querySelectorAll('.ups-tab-btn').forEach(b => {
        b.style.background = '#202c33';
        b.style.color = '#aebac1';
        b.classList.remove('ativa');
      });
      btn.style.background = '#00a884';
      btn.style.color = '#111b21';
      btn.classList.add('ativa');

      // Aplicar filtro
      aplicarFiltroChats(aba.id);
    });
    
    tabsContainer.appendChild(btn);
  });

  // Inserir antes da lista de chats
  containerPainelLateral.insertBefore(tabsContainer, paneSide);
}

/**
 * Aplica um filtro visual na lista de chats do WhatsApp, escondendo
 * os itens que não correspondem à aba selecionada.
 * @param {string} tabId - Identificador da aba ('todas', 'nao_lidas', 'grupos', 'funil_lead').
 */
function aplicarFiltroChats(tabId) {
  const paneSide = document.getElementById('pane-side');
  if (!paneSide) return;

  const contatos = paneSide.querySelectorAll('div[role="listitem"]');

  contatos.forEach(item => {
    // Restaurar todos primeiro
    item.style.display = 'flex';

    if (tabId === 'todas') return;

    if (tabId === 'nao_lidas') {
      const unreadSpan = item.querySelector('span[aria-label*="não lid"], span[aria-label*="unread"], span[data-testid="icon-unread-count"]');
      if (!unreadSpan) {
        item.style.display = 'none';
      }
    }

    if (tabId === 'grupos') {
      const avatarContainer = item.querySelector('div[data-testid="cell-frame-title"]');
      // Identificação real precisa vir do backend do injetor_pagina
    }

    if (tabId.startsWith('funil_')) {
      const hasTag = item.querySelector('.ups-list-tag');
      if (!hasTag) {
        item.style.display = 'none';
      }
    }
  });
}

// ── Injeção Persistente Visual de CRM Tags em todos os Chats ──
let lastTagsSync = 0;
let cachedLeads = [];
let cachedTags = {};
let cachedStages = [];

function injetarTagsVisuaisGlobais() {
  const paneSide = document.getElementById('pane-side');
  if (!paneSide) return;
  const chats = paneSide.querySelectorAll('div[role="listitem"]');
  if (chats.length === 0) return;

  const now = Date.now();
  if (now - lastTagsSync > 3000) { // Sync leve a cada 3s com o painel Chrome local
     chrome.storage.local.get(['ups_leads', 'ups_crm_tags', 'ups_crm_colunas'], res => {
         cachedLeads = res.ups_leads || [];
         cachedTags = res.ups_crm_tags || {
            quente:  { bg: '#FFB4B4', cor: '#8B1A1A', emoji: '🔥' },
            morno:   { bg: '#FFE5B4', cor: '#8B6914', emoji: '☀️' },
            frio:    { bg: '#B4D7FF', cor: '#1A4B8B', emoji: '❄️' },
            vip:     { bg: '#E5B4FF', cor: '#5A1A8B', emoji: '⭐' },
            urgente: { bg: '#FFB4D7', cor: '#8B1A4B', emoji: '🚨' }
         };
         cachedStages = res.ups_crm_colunas || [
            { id: 'prospeccao', label: 'Prospecção', color: '#FFD666' },
            { id: 'negociacao', label: 'Negociação', color: '#66B2FF' },
            { id: 'fechado', label: 'Fechado', color: '#66FFB2' }
         ];
         lastTagsSync = now;
         renderizarTagsNosChats(chats);
     });
  } else {
     renderizarTagsNosChats(chats);
  }
}

function renderizarTagsNosChats(chats) {
  if (cachedLeads.length === 0) return;
  chats.forEach(chatEl => {
      const titleContainer = chatEl.querySelector('div[data-testid="cell-frame-title"]');
      if (!titleContainer) return;
      const infoSpan = titleContainer.querySelector('span[dir="auto"]');
      if (!infoSpan) return;
      
      const chatName = infoSpan.title || infoSpan.textContent;
      const lead = cachedLeads.find(l => l.nome === chatName || (l.telefone && chatName.includes(l.telefone)));
      
      if (lead) {
          let containerTags = titleContainer.querySelector('.ups-global-tag-wrapper');
          if (!containerTags) {
             containerTags = document.createElement('div');
             containerTags.className = 'ups-global-tag-wrapper';
             containerTags.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px; margin-left:8px;';
             titleContainer.appendChild(containerTags);
          }
          
          const dataSignature = lead.estagio + (lead.tag ? JSON.stringify(lead.tag) : '');
          if (containerTags.dataset.signature === dataSignature) return; // Performance check
          containerTags.dataset.signature = dataSignature;
          
          containerTags.innerHTML = '';
          
          // 1. Funnel Stage
          if (lead.estagio) {
             const stageObj = cachedStages.find(s => s.id === lead.estagio);
             if (stageObj) {
                const fTag = document.createElement('span');
                fTag.className = 'ups-list-tag';
                fTag.textContent = String(stageObj.label).toUpperCase();
                fTag.style.cssText = `font-size:9px; font-weight:bold; background:${stageObj.color}22; color:${stageObj.color}; padding:2px 6px; border-radius:4px; border: 1px solid ${stageObj.color}44; line-height:1.2;`;
                containerTags.appendChild(fTag);
             }
          }
          
          // 2. Custom Tags
          if (lead.tag) {
             const tags = (Array.isArray(lead.tag) ? lead.tag : [lead.tag]).filter(Boolean);
             tags.forEach(tgKey => {
                 if (cachedTags[tgKey]) {
                    const cTag = document.createElement('span');
                    cTag.className = 'ups-custom-tag';
                    cTag.textContent = `${cachedTags[tgKey].emoji} ${tgKey}`;
                    cTag.style.cssText = `font-size:9px; font-weight:bold; background:${cachedTags[tgKey].bg}; color:${cachedTags[tgKey].cor}; padding:2px 6px; border-radius:4px; line-height:1.2;`;
                    containerTags.appendChild(cTag);
                 }
             });
          }
      } else {
         const oldWrapper = titleContainer.querySelector('.ups-global-tag-wrapper');
         if (oldWrapper) oldWrapper.remove();
      }
  });
}
