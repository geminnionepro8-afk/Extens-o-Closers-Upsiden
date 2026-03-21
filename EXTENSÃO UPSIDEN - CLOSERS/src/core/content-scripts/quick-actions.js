/**
 * @file quick-actions.js
 * @description Este arquivo injeta botões de ação rápida dentro do WhatsApp Web:
 *              1. No HEADER do chat ativo: Notas do Cliente 📝, Google Calendar 📅,
 *                 Modo de Privacidade (desfoque) 👁️.
 *              2. No FOOTER (campo de mensagem): Botão de Respostas Rápidas ⚡.
 *              Esses botões permitem ao Sr. Arthur acessar funcionalidades da Upsiden
 *              sem precisar abrir o painel lateral — agilizando o fluxo de trabalho.
 *              Também contém o Observer que monitora mudanças no DOM do WhatsApp
 *              para re-injetar os botões quando o chat muda.
 * @module Módulo 06: Content Scripts — Quick Actions
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

// ── Observer do DOM do WhatsApp ──────────────────────────
/**
 * Inicializa um MutationObserver que monitora mudanças no DOM do WhatsApp.
 * Sempre que o DOM é alterado (ex: trocar de chat, abrir novo contato),
 * tenta injetar os Quick Actions e os filtros de abas.
 */
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

// ── Botões de ação rápida no campo de mensagem (footer) ──
/**
 * Injeta o botão ⚡ "Respostas Rápidas" ao lado do campo de digitação do WhatsApp.
 * Ao clicar, abre o módulo de Templates no painel lateral.
 */
function injetarInputActions() {
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

  const btnQuickReplies = criarBotaoQuickAction('⚡', 'Respostas Rápidas', () => {
    abrirPainel('templates', 'Respostas Rápidas', 'templates.html');
  });

  inputActions.appendChild(btnQuickReplies);
  leftTools.appendChild(inputActions);
}

// ── Botões de ação rápida no header do chat ──────────────
/**
 * Injeta botões de ação rápida no header do chat ativo do WhatsApp:
 * - 📝 Notas do Cliente: abre o módulo de notas para o contato atual.
 * - 📅 Google Calendar: abre o Google Calendar para agendamento rápido.
 * - 👁️ Modo Desfoque: alterna um efeito blur para privacidade visual.
 */
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
    const titleEl = header.querySelector('span[dir="auto"]');
    const nome = titleEl ? titleEl.title || titleEl.textContent : 'Cliente';
    abrirPainel('notas', `Notas: ${nome}`, 'notas.html');
  });

  // 2. Agendamento Google Calendar
  const btnCalendar = criarBotaoQuickAction('📅', 'Google Calendar', () => {
    window.open('https://calendar.google.com/calendar/render?action=TEMPLATE', '_blank');
  });

  // 3. Modo Borrar (Blur Mode)
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

// ── Fábrica de botões de ação rápida ─────────────────────
/**
 * Cria um botão padronizado de ação rápida com emoji, tooltip e callback.
 * @param {string} icone - O emoji ou texto do botão.
 * @param {string} tooltip - Texto que aparece ao passar o mouse.
 * @param {Function} onClick - Função chamada ao clicar no botão.
 * @returns {HTMLButtonElement} O botão criado.
 */
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
