/**
 * @file painel-flow.js
 * @description Injeta e gerencia a interface do Flow Builder no Painel principal.
 */

window.renderFlow = async function(c) {
  // 1. Injetar o CSS do Flow, se não existir
  if (!document.getElementById('flow-css')) {
    const link = document.createElement('link');
    link.id = 'flow-css';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/ui/modules/flow.css');
    document.head.appendChild(link);
  }

  // 2. Fetch do HTML
  try {
    const urlHtml = chrome.runtime.getURL('src/ui/modules/flow.html');
    const resp = await fetch(urlHtml);
    const html = await resp.text();
    c.innerHTML = html;
    
    const wrapper = document.getElementById('module-flow');
    if (wrapper) {
      wrapper.style.display = 'flex';
    }

    // 3. Carregar o motor javascript do flow
    if (!document.getElementById('flow-js-script')) {
      const script = document.createElement('script');
      script.id = 'flow-js-script';
      script.src = chrome.runtime.getURL('src/ui/modules/flow.js');
      script.onload = () => {
        if (typeof FlowEngine !== 'undefined') {
          window.flowEngine = new FlowEngine();
          if (window.activeFlowId) window.flowEngine.loadFlow(window.activeFlowId);
        }
      };
      document.body.appendChild(script);
    } else {
      // Re-initiate if coming back to the tab
      if (typeof FlowEngine !== 'undefined') {
         window.flowEngine = new FlowEngine();
         if (window.activeFlowId) window.flowEngine.loadFlow(window.activeFlowId);
      }
    }

  } catch (err) {
    console.error('[Painel Flow] Erro ao carregar Flow Builder:', err);
    c.innerHTML = '<div class="empty-state"><h3>Erro</h3><p>Nao foi possivel carregar o construtor visual.</p></div>';
  }
};
