/* =========================================================
   Upsiden Content Script — v9
   SINGLE TOGGLE: 1 clique no logo = ferramentas, 
                  1 clique de novo = volta ao normal
   ========================================================= */

const CTX = '[Upsiden]';
let modoUpsiden = false;
let navRef = null;
let nativosBackup = []; // guarda { el, cssText } dos nativos

// ── Injetar WPP Connect ──────────────────────────────────
function injetarScripts() {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('wppconnect-wa.js');
  s.onload = () => {
    const core = document.createElement('script');
    core.src = chrome.runtime.getURL('injetor_pagina.js');
    document.documentElement.appendChild(core);
  };
  document.documentElement.appendChild(s);
}

// ── Módulos ──────────────────────────────────────────────
const MODULOS = [
  { tela: 'audios',       title: 'Biblioteca de Áudios',  iframe: 'audios.html',
    svg: '<path d="M12 3v9.28A4.39 4.39 0 0010.5 12C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>' },
  { tela: 'documentos',   title: 'Documentos',            iframe: 'documentos.html',
    svg: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
  { tela: 'midias',       title: 'Mídias',                iframe: 'midias.html',
    svg: '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>' },
  { tela: 'templates',    title: 'Templates de Texto',    iframe: 'templates.html',
    svg: '<path d="M21 6h-2v9H6v2c0 1.1.9 2 2 2h11l4 4V8c0-1.1-.9-2-2-2zm-4 2H3c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>' },
  { tela: 'crm',          title: 'CRM e Funil',           iframe: 'crm.html',
    svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>' },
  { tela: 'auto_reply',   title: 'Resposta Automática',    iframe: 'saudacao.html',
    svg: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' },
  { tela: 'gatilhos',     title: 'Gatilhos Inteligentes',  iframe: 'triggers.html',
    svg: '<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>' },
  { tela: 'admin',        title: 'Gestão da Equipe',       iframe: 'admin.html',
    svg: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>' },
];

// ══════════════════════════════════════════════════════════
// ENCONTRAR NAV
// ══════════════════════════════════════════════════════════
function encontrarNavLeft() {
  const app = document.querySelector('#app');
  if (!app) return null;
  const allEls = app.querySelectorAll('div, nav, aside, header');
  for (const el of allEls) {
    const r = el.getBoundingClientRect();
    // Aumentado a tolerancia, mas MANTENDO O FILTRO DE BOTÕES para não pegar divs vazias!
    if (r.width >= 30 && r.width <= 110 && r.height > window.innerHeight * 0.5 && r.left < 15) {
      const temBotoes = el.querySelectorAll('button, a, [role="button"], span[data-icon]');
      if (temBotoes.length >= 3) {
        return el;
      }
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// TOGGLE ÚNICO: clique no logo = alterna
// ══════════════════════════════════════════════════════════
function toggle() {
  if (modoUpsiden) {
    voltarParaWhatsApp();
  } else {
    mostrarFerramentas();
  }
}

function mostrarFerramentas() {
  if (!navRef) return;
  modoUpsiden = true;

  // Backup e esconder TODOS os filhos nativos (exceto nossos)
  nativosBackup = [];
  for (const child of Array.from(navRef.children)) {
    if (child.id === 'ups-logo-toggle' || child.id === 'ups-tools-container') continue;
    nativosBackup.push(child);
    child.style.setProperty('display', 'none', 'important');
  }

  // Mostrar ferramentas
  const tools = navRef.querySelector('#ups-tools-container');
  if (tools) tools.style.setProperty('display', 'flex', 'important');

  // Marcar logo como ativo
  const logo = navRef.querySelector('#ups-logo-toggle');
  if (logo) logo.classList.add('ups-logo-ativo');

  console.log(CTX, 'Modo Upsiden ativado');
}

function voltarParaWhatsApp() {
  if (!navRef) return;
  modoUpsiden = false;

  // Restaurar nativos: REMOVER a propriedade display forçada
  nativosBackup.forEach(el => {
    el.style.removeProperty('display');
  });
  nativosBackup = [];

  // Esconder ferramentas
  const tools = navRef.querySelector('#ups-tools-container');
  if (tools) tools.style.setProperty('display', 'none', 'important');

  // Fechar painel
  fecharPainel();

  // Desmarcar logo
  const logo = navRef.querySelector('#ups-logo-toggle');
  if (logo) logo.classList.remove('ups-logo-ativo');

  console.log(CTX, 'Modo WhatsApp restaurado');
}

// ══════════════════════════════════════════════════════════
// INJETAR NA NAV
// ══════════════════════════════════════════════════════════
function injetarNaNav(nav) {
  if (nav.querySelector('#ups-logo-toggle')) return;
  navRef = nav;

  // ── Logo toggle (inserido no TOPO da nav) ──
  const logo = document.createElement('button');
  logo.id = 'ups-logo-toggle';
  logo.className = 'ups-logo-toggle';
  logo.title = 'Upsiden Tools';
  logo.innerHTML = `<img src="${chrome.runtime.getURL('icones/icone48.png')}" style="width:26px;height:26px;border-radius:6px;object-fit:contain;">`;
  logo.addEventListener('click', toggle);

  // ── Container de ferramentas (oculto por padrão) ──
  const tools = document.createElement('div');
  tools.id = 'ups-tools-container';
  tools.style.cssText = 'display:none;flex-direction:column;align-items:center;width:100%;flex:1;overflow-y:auto;overflow-x:hidden;gap:2px;padding:8px 0;';

  MODULOS.forEach(mod => {
    const btn = document.createElement('button');
    btn.className = 'ups-tool-btn';
    btn.dataset.tela = mod.tela;
    btn.setAttribute('data-title', mod.title);
    btn.innerHTML = `<svg viewBox="0 0 24 24">${mod.svg}</svg>`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentBtn = e.currentTarget;
      
      const panel = document.getElementById('upsiden-panel');
      const aberto = panel && panel.classList.contains('aberto');
      const mesmo = currentBtn.classList.contains('ativo');

      console.log(CTX, `Clicou no módulo: ${mod.tela}. Aberto? ${aberto}. Mesmo? ${mesmo}`);

      tools.querySelectorAll('.ups-tool-btn').forEach(b => b.classList.remove('ativo'));

      if (aberto && mesmo) {
        fecharPainel();
      } else {
        currentBtn.classList.add('ativo');
        abrirPainel(mod.tela, mod.title, mod.iframe);
      }
    });
    tools.appendChild(btn);
  });

  // Inserir logo no topo e tools logo depois
  nav.insertBefore(tools, nav.firstChild);
  nav.insertBefore(logo, nav.firstChild);

  console.log(CTX, '✅ Logo toggle + ferramentas injetados!');
}

// ══════════════════════════════════════════════════════════
// PAINEL DRAWER
// ══════════════════════════════════════════════════════════
function criarPainel() {
  if (document.getElementById('upsiden-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'upsiden-panel';
  panel.innerHTML = `
    <div id="ups-panel-header">
      <span id="ups-panel-titulo">Upsiden</span>
      <button id="ups-fechar"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    </div>
    <div id="ups-panel-body"></div>
  `;
  document.body.appendChild(panel);
  document.getElementById('ups-fechar').addEventListener('click', fecharPainel);
}

function abrirPainel(tela, titulo, iframeSrc) {
  criarPainel();
  const body = document.getElementById('ups-panel-body');
  document.getElementById('ups-panel-titulo').textContent = titulo;
  if (iframeSrc) {
    body.innerHTML = `<iframe src="${chrome.runtime.getURL(iframeSrc)}"></iframe>`;
  } else {
    body.innerHTML = `<div style="padding:24px;color:#aebac1;font-size:14px;font-family:sans-serif;line-height:1.6;">
      <p style="color:#e9edef;font-size:16px;font-weight:500;margin:0 0 8px">${titulo}</p>
      <p style="margin:0;">Este módulo está em desenvolvimento.</p>
    </div>`;
  }
  document.getElementById('upsiden-panel').classList.add('aberto');
}

function fecharPainel() {
  const p = document.getElementById('upsiden-panel');
  if (p) p.classList.remove('aberto');
  document.querySelectorAll('.ups-tool-btn').forEach(b => b.classList.remove('ativo'));
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
let tentativas = 0;
function tentarInjetar() {
  tentativas++;
  if (!document.querySelector('#app')) {
    if (tentativas < 30) setTimeout(tentarInjetar, 500);
    return;
  }
  const nav = encontrarNavLeft();
  if (nav) {
    injetarNaNav(nav);
    criarPainel();
    // Re-check caso WA reconstrua o DOM
    setInterval(() => {
      const n = encontrarNavLeft();
      if (n && !n.querySelector('#ups-logo-toggle')) injetarNaNav(n);
    }, 3000);
    return;
  }
  if (tentativas < 60) { setTimeout(tentarInjetar, 500); return; }
  console.log(CTX, 'Nav não encontrada no carregamento inicial (Timeout).');
}

function enviarParaPagina(dados) {
  return new Promise(resolve => {
    const id = Date.now() + Math.random().toString();
    const payload = { ...dados, msgId: id, origem: 'CONTENT_SCRIPT' };
    const fn = ev => {
      if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.msgId === id) {
        window.removeEventListener('message', fn);
        resolve(ev.data.resposta);
      }
    };
    window.addEventListener('message', fn);
    window.postMessage(payload, '*');
  });
}

chrome.runtime.onMessage.addListener((msg, _, responder) => {
  if (msg.tipo === 'enviar_audio_biblioteca') {
    enviarParaPagina(msg.dados).then(r => responder(r));
    return true;
  }
});

// ── Receber mensagens dos iframes (Modulos) ──
window.addEventListener('message', async (ev) => {
  if (!ev.data || !ev.data.type) return;

  if (ev.data.type === 'upsiden_send_text') {
    // Ex: { type: 'upsiden_send_text', data: { texto: "Olá" } }
    console.log(CTX, 'Enviando texto a partir do iframe', ev.data.data);
    await enviarParaPagina({ ...ev.data.data, tipoMensagem: 'texto' });
  }

  if (ev.data.type === 'upsiden_send_file') {
    // Ex: { type: 'upsiden_send_file', data: { nome, tipo, base64 } }
    console.log(CTX, 'Enviando arquivo a partir do iframe', ev.data.data);
    await enviarParaPagina({ ...ev.data.data, tipoMensagem: 'arquivo' });
  }

  if (ev.data.type === 'upsiden_get_active_chat') {
    // Solicitação do painel de Notas para saber de quem é o chat aberto
    const chatData = await enviarParaPagina({ tipoMensagem: 'get_active_chat' });
    if (chatData && chatData.sucesso) {
      // Enviar de volta para os iframes (todos os painéis abertos receberão)
      document.querySelectorAll('#ups-panel-body iframe').forEach(ifr => {
        ifr.contentWindow.postMessage({
          type: 'init_chat_data',
          chatId: chatData.id,
          nome: chatData.nome || chatData.id.split('@')[0],
          telefone: chatData.id.split('@')[0]
        }, '*');
      });
    }
  }

  if (ev.data.type === 'upsiden_crm_updated') {
    console.log(CTX, 'CRM Atualizado, sincronizando UI...', ev.data.data);
    
    // Tentar encontrar o contato selecionado na lista (para injetar a tag visual)
    const contatoAtivo = document.querySelector('div[aria-selected="true"]');
    if (contatoAtivo) {
      const containerTitulo = contatoAtivo.querySelector('div[data-testid="cell-frame-title"]');
      if (containerTitulo) {
        let tag = containerTitulo.querySelector('.ups-list-tag');
        if (!tag) {
          tag = document.createElement('span');
          tag.className = 'ups-list-tag';
          containerTitulo.appendChild(tag);
        }
        tag.textContent = ev.data.data.funil.toUpperCase();
        tag.style.cssText = 'margin-left:8px; font-size:10px; font-weight:bold; background:#2a3942; color:#00a884; padding:2px 6px; border-radius:4px;';
      }
    }
  }

  if (ev.data.type === 'upsiden_reload_automation') {
    console.log(CTX, 'Recarregando regras de automação...');
    // Lê do storage e manda pro injetor
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers'], (res) => {
      window.postMessage({
        origem: 'CONTENT_SCRIPT',
        msgId: Date.now().toString(),
        tipoMensagem: 'set_config_auto_reply',
        dados: res.ups_config_saudacao || null
      }, '*');
      window.postMessage({
        origem: 'CONTENT_SCRIPT',
        msgId: Date.now().toString() + 'T',
        tipoMensagem: 'set_config_triggers',
        dados: res.ups_config_triggers || []
      }, '*');
    });
  }

  // Quando o injetor estiver pronto para automação e nos pedir a config
  if (ev.data.origem === 'INJETOR_PAGINA' && ev.data.ev === 'engine_pronto_para_automacao') {
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers'], (res) => {
      window.postMessage({
        origem: 'CONTENT_SCRIPT',
        msgId: Date.now().toString(),
        tipoMensagem: 'set_config_auto_reply',
        dados: res.ups_config_saudacao || null
      }, '*');
      window.postMessage({
        origem: 'CONTENT_SCRIPT',
        msgId: Date.now().toString() + 'T',
        tipoMensagem: 'set_config_triggers',
        dados: res.ups_config_triggers || []
      }, '*');
    });
  }

  // Fallback que adicionamos na inicialização local
  if (ev.data.origem === 'INJETOR_PAGINA_INIT' && ev.data.ev === 'puxar_config_auto_reply') {
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers'], (res) => {
      console.log(CTX, 'Enviando config auto_reply para o WPP Engine (Polling):', res.ups_config_saudacao);
      window.postMessage({
        origem: 'CONTENT_SCRIPT',
        msgId: Date.now().toString(),
        tipoMensagem: 'set_config_auto_reply',
        dados: res.ups_config_saudacao || null
      }, '*');
      window.postMessage({
        origem: 'CONTENT_SCRIPT',
        msgId: Date.now().toString() + 'T',
        tipoMensagem: 'set_config_triggers',
        dados: res.ups_config_triggers || []
      }, '*');
    });
  }
});

// ══════════════════════════════════════════════════════════
// OBSERVER DO CHAT (INJETAR QUICK ACTIONS)
// ══════════════════════════════════════════════════════════
function inicializarObserverDoChat() {
  const observer = new MutationObserver(() => {
    try {
      injetarQuickActions();
      injetarInputActions();
      injetarTopTabs();
    } catch(e) {
      console.log(CTX, 'Silenciando erro de inject:', e);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function injetarInputActions() {
  // O container do compose box do whatsapp nativo
  const footer = document.querySelector('#main footer');
  if (!footer) return;

  // Evitar duplicidade
  if (footer.querySelector('.ups-input-actions')) return;

  // Encontrar o botão de ferramentas à esquerda (emoji, +, etc)
  const leftTools = footer.querySelector('div[data-testid="conversation-compose-box-insert-template"]')?.parentElement?.parentElement;
  if (!leftTools) return;

  const inputActions = document.createElement('div');
  inputActions.className = 'ups-input-actions';
  inputActions.style.cssText = 'display:flex; align-items:center; gap:4px; margin-left:8px;';

  // 1. Respostas Rápidas (Quick Replies inline)
  const btnQuickReplies = criarBotaoQuickAction('⚡', 'Respostas Rápidas', () => {
    abrirPainel('templates', 'Respostas Rápidas', 'templates.html');
  });

  inputActions.appendChild(btnQuickReplies);

  // Inserir logo após os botões da esquerda
  leftTools.appendChild(inputActions);
}

function injetarQuickActions() {
  const header = document.querySelector('#main header');
  if (!header) return;
  
  // Não injetar se já existir
  if (header.querySelector('.ups-quick-actions')) return;

  // Encontrar a div que envolve os ícones originais (Câmera, Lupa, Menu)
  const buttonsContainer = header.lastChild;
  if (!buttonsContainer) return;

  const quickActions = document.createElement('div');
  quickActions.className = 'ups-quick-actions';
  quickActions.style.cssText = 'display:flex; gap:12px; align-items:center; margin-right:12px; padding-right:12px; border-right:1px solid #2a3942;';

  // 1. Notas (Contact Notes)
  const btnNotas = criarBotaoQuickAction('📝', 'Notas do Cliente', () => {
    // Pegar o título do chat atual
    const titleEl = header.querySelector('span[dir="auto"]');
    const nome = titleEl ? titleEl.title || titleEl.textContent : 'Cliente';
    abrirPainel('notas', `Notas: ${nome}`, 'notas.html'); // Sprint 2: Abre o notas.html
  });

  // 3. Agendamento Google Calendar
  const btnCalendar = criarBotaoQuickAction('📅', 'Google Calendar', () => {
    window.open('https://calendar.google.com/calendar/render?action=TEMPLATE', '_blank');
  });

  // 4. Modo Borrar (Blur Mode)
  let blurAtivo = false;
  const btnBlur = criarBotaoQuickAction('👁️', 'Desfoque de Privacidade', () => {
    blurAtivo = !blurAtivo;
    document.body.classList.toggle('ups-blur-active', blurAtivo);
  });

  quickActions.appendChild(btnNotas);
  quickActions.appendChild(btnCalendar);
  quickActions.appendChild(btnBlur);

  header.insertBefore(quickActions, buttonsContainer);
}

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

      // Lógica de filtro real (a ser implementada via CSS ou DOM hiding)
      aplicarFiltroChats(aba.id);
    });
    
    tabsContainer.appendChild(btn);
  });

  // Inserir antes da lista de chats
  containerPainelLateral.insertBefore(tabsContainer, paneSide);
}

function aplicarFiltroChats(tabId) {
  const paneSide = document.getElementById('pane-side');
  if (!paneSide) return;

  const contatos = paneSide.querySelectorAll('div[role="listitem"]');

  contatos.forEach(item => {
    // Restaurar todos primeiro
    item.style.display = 'flex';

    if (tabId === 'todas') return;

    if (tabId === 'nao_lidas') {
      // Procura por ícones/balões de não lidas dentro do chat (aria-label="Não lidas" ou span com background verde)
      const unreadSpan = item.querySelector('span[aria-label*="não lid"], span[aria-label*="unread"], span[data-testid="icon-unread-count"]');
      if (!unreadSpan) {
        item.style.display = 'none';
      }
    }

    if (tabId === 'grupos') {
      // Procura icone de grupo ou o WPPConnect pode nos avisar depois.
      // Por enquanto, testamos se o titulo tem SVG default de grupo
      const avatarContainer = item.querySelector('div[data-testid="cell-frame-title"]');
      // Identificação real precisa vir do backend do injetor_pagina, mas vamos esconder temporariamente para demonstrar o filtro
      // item.style.display = 'none'; // Temporário
    }

    if (tabId.startsWith('funil_')) {
      // Isso dependerá de adicionarmos data-attributes aos itens da lista baseado no storage.
      // Para demonstração do Sprint 2, escondemos tudo que não tiver uma tag visível ainda.
      const hasTag = item.querySelector('.ups-list-tag');
      if (!hasTag) {
        item.style.display = 'none';
      }
    }
  });
}

function criarBotaoQuickAction(icone, tooltip, onClick) {
  const btn = document.createElement('button');
  btn.innerHTML = icone;
  btn.title = tooltip;
  btn.style.cssText = 'background:none; border:none; color:#aebac1; font-size:18px; cursor:pointer; padding:4px; border-radius:4px; transition:0.2s; display:flex; align-items:center; justify-content:center;';
  btn.onmouseover = () => btn.style.background = '#2a3942';
  btn.onmouseout = () => btn.style.background = 'none';
  btn.addEventListener('click', onClick);
  return btn;
}

injetarScripts();
tentarInjetar();
inicializarObserverDoChat();
