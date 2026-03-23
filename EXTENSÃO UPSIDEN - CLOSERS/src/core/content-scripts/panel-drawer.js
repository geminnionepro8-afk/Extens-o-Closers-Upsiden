/**
 * @file panel-drawer.js
 * @description Este arquivo gerencia o painel lateral (drawer) que aparece dentro do WhatsApp Web
 *              quando o Sr. Arthur clica em uma ferramenta da Upsiden na barra lateral.
 *              Responsável por:
 *              - Criar o HTML do painel (header com título + botão fechar + body para iframe).
 *              - Abrir o painel com o módulo correto carregado em um iframe.
 *              - Fechar o painel e limpar os estados visuais dos botões.
 *              - Redirecionar para nova aba no caso do Painel full-page.
 * @module Módulo 06: Content Scripts — Painel Drawer
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

/**
 * Cria o elemento HTML do painel lateral na página do WhatsApp, se ainda não existir.
 * O painel tem um header (título + botão fechar) e um body (onde o iframe é carregado).
 */
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

/**
 * Abre o painel lateral com o módulo especificado.
 * Se o módulo for o Painel full-page ('__OPEN_TAB__'), abre em nova aba.
 * Caso contrário, carrega o HTML do módulo dentro de um iframe no drawer.
 * @param {string} tela - Identificador da tela/módulo (ex: 'audios', 'crm').
 * @param {string} titulo - Título a exibir no header do painel.
 * @param {string} iframeSrc - Caminho do HTML do módulo, ou '__OPEN_TAB__' para nova aba.
 */
function abrirPainel(tela, titulo, iframeSrc) {
  // Painel full-page abre em nova aba
  if (iframeSrc === '__OPEN_TAB__') {
    chrome.runtime.sendMessage({ tipo: 'abrir_painel' });
    return;
  }
  criarPainel();
  const body = document.getElementById('ups-panel-body');
  document.getElementById('ups-panel-titulo').textContent = titulo;
  
  if (iframeSrc) {
    // 1. Prepara o Shadow Host
    body.innerHTML = '';
    const shadowHost = document.createElement('div');
    shadowHost.id = `ups-module-host-${tela}`;
    shadowHost.style.cssText = 'width:100%; height:100%; border:none; display:flex; flex-direction:column;';
    body.appendChild(shadowHost);
    
    // Anexa o Shadow DOM (fechado ou aberto, aberto é mais facil pra debug)
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    // Globais para os módulos (O módulo buscará os elementos por window.$upsRoot)
    window.$upsRoot = shadowRoot;
    window.$upsCtx = tela;

    // Reset base do Shadow DOM
    const resetStyle = document.createElement('style');
    resetStyle.textContent = `
      :host { all: initial; display: block; width: 100%; height: 100%; background: #111b21; }
      * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    `;
    shadowRoot.appendChild(resetStyle);

    // 2. Fetch do HTML do módulo
    fetch(chrome.runtime.getURL(iframeSrc))
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 3. Injeta Links de CSS com URLs absolutas
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
          const newLink = document.createElement('link');
          newLink.rel = 'stylesheet';
          const oldHref = link.getAttribute('href');
          const basePath = iframeSrc.split('/').slice(0, -1).join('/');
          newLink.href = chrome.runtime.getURL(`${basePath}/${oldHref}`);
          shadowRoot.appendChild(newLink);
        });

        // 3.5. Corrige caminhos relativos de imagens
        doc.querySelectorAll('img').forEach(img => {
          if (img.hasAttribute('src')) {
            const oldSrc = img.getAttribute('src');
            img.src = new URL(oldSrc, chrome.runtime.getURL(iframeSrc)).href;
          }
        });

        // 4. Injeta o HTML Body
        const wrapper = document.createElement('div');
        wrapper.id = 'ups-shadow-wrapper';
        wrapper.style.cssText = 'width:100%; height:100%; overflow:auto;';
        wrapper.innerHTML = doc.body.innerHTML;
        shadowRoot.appendChild(wrapper);

        // 5. Aciona o inicializador nativo do módulo carregado previamente no manifest.json
        if (typeof window['upsInit_' + tela] === 'function') {
           setTimeout(() => window['upsInit_' + tela](), 50);
        }
      })
      .catch(err => {
        console.error('[Upsiden] Erro Shadow DOM', err);
        shadowRoot.innerHTML = `<div style="padding:24px;color:#f15c6d;">Erro ao carregar módulo: ${err.message}</div>`;
      });

  } else {
    body.innerHTML = `<div style="padding:24px;color:#aebac1;font-size:14px;font-family:sans-serif;line-height:1.6;">
      <p style="color:#e9edef;font-size:16px;font-weight:500;margin:0 0 8px">${titulo}</p>
      <p style="margin:0;">Este módulo está em desenvolvimento.</p>
    </div>`;
  }
  document.getElementById('upsiden-panel').classList.add('aberto');
}

/**
 * Fecha o painel lateral e remove o estado "ativo" de todos os botões de ferramenta.
 */
function fecharPainel() {
  const p = document.getElementById('upsiden-panel');
  if (p) p.classList.remove('aberto');
  document.querySelectorAll('.ups-tool-btn').forEach(b => b.classList.remove('ativo'));
}
