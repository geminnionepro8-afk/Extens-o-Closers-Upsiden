/**
 * @file content-script.js
 * @description Este é o ponto de entrada (entry point) do Content Script da extensão Upsiden.
 *              Ele é o primeiro arquivo injetado pelo Chrome no WhatsApp Web e tem a função de:
 *              1. Carregar os scripts WPP Connect e o Engine de automação na página.
 *              2. Encontrar a barra lateral do WhatsApp e injetar o logo + ferramentas Upsiden.
 *              3. Inicializar o observer que monitora mudanças no DOM do WhatsApp.
 *              Este arquivo é "magro" por design — ele delega cada responsabilidade
 *              para módulos especializados (nav-injector, panel-drawer, quick-actions, etc).
 * @module Módulo 06: Content Scripts
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

const CTX = '[Upsiden]';

// Estado gerenciado pelos módulos


// ── Injetar WPP Connect + Engine na página ───────────────
/**
 * Injeta os scripts da biblioteca WPP Connect e do Engine Upsiden
 * diretamente na página do WhatsApp Web via tags <script>.
 * O WPP Connect carrega primeiro, e quando terminar, o Engine é carregado.
 */
function injetarScripts() {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('src/core/page-scripts/wpp-engine.js');
  document.documentElement.appendChild(s);
}

/**
 * Injeta a biblioteca WPP Connect (wa-js) na página.
 * Ao terminar, chama injetarScripts() para carregar o Engine.
 */
function injetarWppConnect() {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('src/libs/wppconnect-wa.js');
  s.onload = () => injetarScripts();
  document.documentElement.appendChild(s);
}

// ── Inicialização ────────────────────────────────────────
/**
 * Tenta localizar a barra de navegação lateral do WhatsApp Web
 * e injetar os controles da Upsiden. Retenta a cada 500ms até
 * encontrar ou esgotar as tentativas (30s).
 */
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

// ── Boot ─────────────────────────────────────────────────
injetarWppConnect();
tentarInjetar();
inicializarObserverDoChat();
