/**
 * @file nav-injector.js
 * @description Este arquivo é responsável por localizar a barra de navegação lateral
 *              do WhatsApp Web e injetar os controles visuais da Upsiden:
 *              - O botão-logo que alterna entre o modo WhatsApp e o modo Upsiden.
 *              - A lista de ferramentas (ícones SVG) que aparecem quando o modo Upsiden está ativo.
 *              Cada ferramenta corresponde a um módulo (Áudios, Documentos, CRM, etc).
 *              Quando o Sr. Arthur clica no logo, os ícones nativos do WhatsApp são escondidos
 *              e substituídos pelas ferramentas Upsiden. Clicar novamente restaura tudo.
 * @module Módulo 06: Content Scripts  Injeção na Nav
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

let modoUpsiden = false;
let navRef = null;
let nativosBackup = [];

//  Definição dos Módulos (ferramentas da sidebar) 
const MODULOS = [
  { tela: 'painel',       title: 'Painel Upsiden',        iframe: '__OPEN_TAB__',
    svg: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>' },
  { tela: 'audios',       title: 'Biblioteca de  udios',  iframe: 'src/ui/modules/audios.html',
    svg: '<path d="M12 3v9.28A4.39 4.39 0 0010.5 12C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>' },
  { tela: 'documentos',   title: 'Documentos',            iframe: 'src/ui/modules/documentos.html',
    svg: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
  { tela: 'midias',       title: 'Mídias',                iframe: 'src/ui/modules/midias.html',
    svg: '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>' },
  { tela: 'templates',    title: 'Templates de Texto',    iframe: 'src/ui/modules/templates.html',
    svg: '<path d="M21 6h-2v9H6v2c0 1.1.9 2 2 2h11l4 4V8c0-1.1-.9-2-2-2zm-4 2H3c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>' },
  { tela: 'crm',          title: 'CRM e Funil',           iframe: 'src/ui/modules/crm.html',
    svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>' },
  { tela: 'auto_reply',   title: 'Resposta Automática',    iframe: 'src/ui/modules/saudacao.html',
    svg: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' },
  { tela: 'gatilhos',     title: 'Gatilhos Inteligentes',  iframe: 'src/ui/modules/triggers.html',
    svg: '<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>' },
  { tela: 'admin',        title: 'Gestão da Equipe',       iframe: 'src/ui/modules/admin.html',
    svg: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>' },
];


//  Localizar a barra de navegação lateral do WhatsApp 
/**
 * Percorre o DOM do WhatsApp Web procurando a barra lateral esquerda.
 * Identifica pela geometria (largura 30-70px, altura > 70% da tela,
 * posição à esquerda) e pela presença de pelo menos 3 botões.
 * @returns {HTMLElement|null} O elemento da nav encontrado, ou null.
 */
function encontrarNavLeft() {
  const app = document.querySelector('#app');
  if (!app) return null;
  const allEls = app.querySelectorAll('div, nav, aside, span');
  for (const el of allEls) {
    const r = el.getBoundingClientRect();
    if (r.width >= 30 && r.width <= 70 && r.height > window.innerHeight * 0.7 && r.left < 10) {
      const temBotoes = el.querySelectorAll('button, a, [role="button"]');
      if (temBotoes.length >= 3) return el;
    }
  }
  return null;
}

//  Toggle: alternar entre modo WhatsApp e modo Upsiden 
/**
 * Função principal de alternância. Um clique no logo ativa as ferramentas
 * Upsiden (escondendo os ícones nativos do WhatsApp). Outro clique restaura.
 */
function toggle() {
  if (modoUpsiden) {
    voltarParaWhatsApp();
  } else {
    mostrarFerramentas();
  }
}

/**
 * Ativa o modo Upsiden: esconde os filhos nativos da nav
 * e exibe o container de ferramentas da Upsiden.
 */
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

/**
 * Desativa o modo Upsiden: restaura os filhos nativos do WhatsApp,
 * esconde as ferramentas e fecha o painel lateral.
 */
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

//  Injetar controles na barra de navegação 
/**
 * Cria o botão-logo da Upsiden e o container de ferramentas,
 * e os insere no topo da barra de navegação do WhatsApp Web.
 * Cada ferramenta abre o módulo correspondente no painel lateral.
 * @param {HTMLElement} nav - O elemento da barra de navegação do WhatsApp.
 */
function injetarNaNav(nav) {
  if (nav.querySelector('#ups-logo-toggle')) return;
  navRef = nav;

  //  Logo toggle (inserido no TOPO da nav) 
  const logo = document.createElement('button');
  logo.id = 'ups-logo-toggle';
  logo.className = 'ups-logo-toggle';
  logo.title = 'Upsiden Tools';
  logo.innerHTML = `<img src="${chrome.runtime.getURL('public/icons/icone48.png')}" style="width:26px;height:26px;border-radius:6px;object-fit:contain;">`;
  logo.addEventListener('click', toggle);

  //  Container de ferramentas (oculto por padrão) 
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

  console.log(CTX, 'S& Logo toggle + ferramentas injetados!');
}

