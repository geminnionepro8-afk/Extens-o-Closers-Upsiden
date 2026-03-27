/**
 * @file painel-flow.js
 * @description Injeta e gerencia o Flow Builder v3 no Painel principal.
 */

window.renderFlow = async function(c) {
  // 1. CSS
  if (!document.getElementById('flow-css')) {
    const link = document.createElement('link');
    link.id   = 'flow-css';
    link.rel  = 'stylesheet';
    link.href = '../modules/flow.css';
    document.head.appendChild(link);
  }

  // 2. HTML
  try {
    const resp = await fetch('../modules/flow.html');
    const html = await resp.text();
    c.innerHTML = html;

    const wrapper = document.getElementById('module-flow');
    if (wrapper) wrapper.style.display = 'flex';

    // 3. Inject Header Actions (v3.1 Integration)
    const headerActions = document.getElementById('header-actions');
    if (headerActions) {
      headerActions.innerHTML = `
        <div class="fv3-header-integration">
          <button class="btn btn-outline-secondary" id="fv3-global-sync" title="Sincronizar com WhatsApp">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Sincronizar
          </button>
          <div class="fv3-divider-v"></div>
          <button class="btn btn-outline-secondary" id="fv3-global-load">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Carregar
          </button>
          <button class="btn btn-primary" id="fv3-global-save">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar Fluxo
          </button>
          <div class="fv3-divider-v"></div>
          <button class="btn btn-icon-only" id="fv3-global-config" title="Configurações">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      `;
    }

    // 4. Destroy previous engine instance
    window.flowEngine = null;

    // 5. Load / reload JS
    const old = document.getElementById('flow-js-script');
    if (old) old.remove();

    const script = document.createElement('script');
    script.id  = 'flow-js-script';
    script.src = '../modules/flow.js?v=' + Date.now();
    script.onload = () => {
      if (typeof FlowEngine !== 'undefined') {
        window.flowEngine = new FlowEngine();
        
        // Bind global header buttons to engine
        const btnSave = document.getElementById('fv3-global-save');
        const btnLoad = document.getElementById('fv3-global-load');
        const btnSync = document.getElementById('fv3-global-sync');
        const btnConf = document.getElementById('fv3-global-config');

        if (btnSave) btnSave.onclick = () => window.flowEngine.saveToLocalStorage();
        if (btnLoad) btnLoad.onclick = () => window.flowEngine.loadFromLocalStorage();
        if (btnSync) btnSync.onclick = () => {
          if (typeof window.toast === 'function') window.toast('Sincronizando com WhatsApp...', 'info');
          // Integration point for actual sync logic could go here
        };
        if (btnConf) btnConf.onclick = () => {
          if (typeof window.toast === 'function') window.toast('Abrindo configurações do fluxo...', 'info');
        };
      }
    };
    document.body.appendChild(script);

  } catch (err) {
    console.error('[Painel Flow v3.1] Erro ao carregar Flow Builder:', err);
    c.innerHTML = '<div class="empty-state"><h3>Erro</h3><p>Não foi possível carregar o construtor visual.</p></div>';
  }
};

