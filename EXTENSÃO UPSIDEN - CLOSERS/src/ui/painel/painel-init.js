/**
 * @file painel-init.js
 * @description Ponto de entrada do Painel Upsiden. Responsavel por:
 *              - Verificar autenticacao do usuario via Supabase.
 *              - Carregar todos os dados iniciais (audios, docs, midias, templates, leads).
 *              - Configurar a sidebar (toggle collapse) e o menu do usuario.
 *              - Registrar os event listeners de navegacao.
 *              Este arquivo deve ser carregado POR ULTIMO no painel.html,
 *              pois depende de todas as funcoes de renderizacao dos outros modulos.
 * @module Modulo 06: UI - Painel (Inicializacao)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

const P = '[Painel]';
let currentSection = 'dashboard';
let userData = { userId: null, nome: '', email: '', isAdmin: false };
let painelData = { audios: [], documentos: [], midias: [], templates: [], leads: [], membros: [] };

// === TOAST ===
function toast(msg, tipo = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// === INIT ===
async function initPainel() {
  console.log(P, 'Inicializando Painel Upsiden...');
  try {
    const loggedIn = await verificarAuth();
    document.getElementById('loading-page').style.display = 'none';

    if (!loggedIn) {
      document.getElementById('auth-guard').style.display = 'block';
      document.getElementById('btn-goto-login')?.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/login/login.html') });
      });
      return;
    }

    document.getElementById('painel-app').style.display = 'flex';
    userData.userId = await UpsidenAuth.getUserId();
    userData.isAdmin = await UpsidenAuth.isAdmin();
    const profile = await UpsidenAuth.getProfile();
    userData.nome = profile?.nome || profile?.email?.split('@')[0] || '';
    userData.email = profile?.email || '';

    // UI - user info
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

    // -- Sidebar toggle (collapse / expand) --
    const sidebar = document.getElementById('painel-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    // Emergency sidebar injection: force visible if storage fails
    try {
      chrome.storage.local.get('ups_sidebar_collapsed', (res) => {
        if (chrome.runtime.lastError) {
          console.warn(P, 'Storage falhou, sidebar forcada visivel');
          return;
        }
        if (res.ups_sidebar_collapsed === 'true') sidebar.classList.add('collapsed');
      });
    } catch(e) {
      console.warn(P, 'Fallback: sidebar sem storage');
    }

    toggleBtn?.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      try { chrome.storage.local.set({ ups_sidebar_collapsed: String(isCollapsed) }); } catch(e) {}
      updateUserMenuPosition();
    });

    // -- User menu popup --
    const btnUserMenu = document.getElementById('btn-user-menu');
    const userMenuPopup = document.getElementById('user-menu-popup');
    const userMenuOverlay = document.getElementById('user-menu-overlay');

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
    const umpName = document.getElementById('ump-name');
    const umpEmail = document.getElementById('ump-email');
    const umpAvatar = document.getElementById('user-avatar-popup');
    if (umpName) umpName.textContent = userData.nome || 'Usuario';
    if (umpEmail) umpEmail.textContent = userData.email || '';
    if (umpAvatar) umpAvatar.textContent = (userData.nome[0] || 'U').toUpperCase();

    // Logout (inside popup)
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      closeUserMenu();
      await UpsidenAuth.signOut();
      window.location.reload();
    });

    // Toggle Theme
    document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
      closeUserMenu();
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const nxt = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nxt);
      localStorage.setItem('upsiden_theme', nxt);
    });

    console.log(P, 'Painel pronto!');
    navigate('dashboard');

  } catch(err) {
    console.error(P, 'Erro ao inicializar:', err);
    document.getElementById('loading-page').innerHTML = `<p style="color:var(--danger);">Erro ao carregar painel. Recarregue a pagina.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', initPainel);

// === GUARD SYSTEM: Exportar funcoes com verificacao de seguranca ===
// Cada export verifica se a funcao existe antes de atribuir ao window.
// Se nao existir, atribui um stub que loga erro em vez de crashar.

function _guard(name) {
  return (typeof window[name] === 'function')
    ? window[name]
    : function() { console.warn('[Painel] Modulo nao carregado:', name); };
}

window.navigate = (typeof navigate !== 'undefined') ? navigate : function(s) { console.warn('[Painel] navigate nao definido'); };
window.deleteItem = (typeof deleteItem !== 'undefined') ? deleteItem : function() { console.warn('[Painel] deleteItem nao carregado'); };
window.showNewTemplateModal = (typeof showNewTemplateModal !== 'undefined') ? showNewTemplateModal : function() { console.warn('[Painel] showNewTemplateModal nao carregado'); };
window.editTemplate = (typeof editTemplate !== 'undefined') ? editTemplate : function() { console.warn('[Painel] editTemplate nao carregado'); };
window.showNewLeadModal = (typeof showNewLeadModal !== 'undefined') ? showNewLeadModal : function() { console.warn('[Painel] showNewLeadModal nao carregado'); };
window.salvarLead = (typeof salvarLeadCompleto !== 'undefined') ? salvarLeadCompleto : function() { console.warn('[Painel] salvarLead/salvarLeadCompleto nao carregado'); };
window.salvarLeadCompleto = (typeof salvarLeadCompleto !== 'undefined') ? salvarLeadCompleto : function() { console.warn('[Painel] salvarLeadCompleto nao carregado'); };
window.editLeadModal = (typeof editLeadModal !== 'undefined') ? editLeadModal : function() {};
window.showLeadEditModal = (typeof showLeadEditModal !== 'undefined') ? showLeadEditModal : (typeof showNewLeadModal !== 'undefined' ? showNewLeadModal : function() {});
window.salvarTemplate = (typeof salvarTemplate !== 'undefined') ? salvarTemplate : function() { console.warn('[Painel] salvarTemplate nao carregado'); };

// === EVENT DELEGATION (CSP COMPATIBLE) ===
window.closeModal = function() {
  document.querySelector('.modal-overlay')?.remove();
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-click]');
  if (!btn) return;
  e.stopPropagation();

  const action = btn.getAttribute('data-click');
  const match = action.match(/^([a-zA-Z0-9_]+)\((.*?)\)$/);

  if (match) {
    const fnName = match[1];
    let argsStr = match[2];
    let args = [];
    if (argsStr) {
      args = argsStr.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (typeof window[fnName] === 'function') {
      window[fnName](...args);
    } else {
      console.warn('[Painel] Funcao nao encontrada:', fnName);
    }
  }
});
