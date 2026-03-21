/**
 * @file painel-init.js
 * @description Ponto de entrada do Painel Upsiden. ResponsÃ¡vel por:
 *              - Verificar autenticaÃ§Ã£o do usuÃ¡rio via Supabase.
 *              - Carregar todos os dados iniciais (Ã¡udios, docs, mÃ­dias, templates, leads).
 *              - Configurar a sidebar (toggle collapse) e o menu do usuÃ¡rio.
 *              - Registrar os event listeners de navegaÃ§Ã£o.
 *              Este arquivo deve ser carregado POR ÃšLTIMO no painel.html,
 *              pois depende de todas as funÃ§Ãµes de renderizaÃ§Ã£o dos outros mÃ³dulos.
 * @module MÃ³dulo 06: UI â€” Painel (InicializaÃ§Ã£o)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

const P = '[Painel]';
let currentSection = 'dashboard';
let userData = { userId: null, nome: '', email: '', isAdmin: false };
let painelData = { audios: [], documentos: [], midias: [], templates: [], leads: [], membros: [] };

// â•â•â• TOAST â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function toast(msg, tipo = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// â•â•â• INIT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

    // UI â€” user info
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

    // â”€ Sidebar toggle (collapse / expand) â”€
    const sidebar    = document.getElementById('painel-sidebar');
    const toggleBtn  = document.getElementById('sidebar-toggle');
    const savedState = localStorage.getItem('ups_sidebar_collapsed');
    if (savedState === 'true') sidebar.classList.add('collapsed');

    toggleBtn?.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      localStorage.setItem('ups_sidebar_collapsed', isCollapsed);
      updateUserMenuPosition();
    });

    // â”€ User menu popup â”€
    const btnUserMenu      = document.getElementById('btn-user-menu');
    const userMenuPopup    = document.getElementById('user-menu-popup');
    const userMenuOverlay  = document.getElementById('user-menu-overlay');

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
    const umpName  = document.getElementById('ump-name');
    const umpEmail = document.getElementById('ump-email');
    const umpAvatar = document.getElementById('user-avatar-popup');
    if (umpName)   umpName.textContent   = userData.nome  || 'UsuÃ¡rio';
    if (umpEmail)  umpEmail.textContent  = userData.email || '';
    if (umpAvatar) umpAvatar.textContent = (userData.nome[0] || 'U').toUpperCase();

    // Logout (inside popup)
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      closeUserMenu();
      await UpsidenAuth.signOut();
      window.location.reload();
    });

    console.log(P, 'âœ… Painel pronto!');
    navigate('dashboard');

  } catch(err) {
    console.error(P, 'Erro ao inicializar:', err);
    document.getElementById('loading-page').innerHTML = `<p style="color:var(--danger);">Erro ao carregar painel. Recarregue a pÃ¡gina.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', initPainel);

// Expor funÃ§Ãµes para event delegation
window.navigate = navigate;
window.deleteItem = deleteItem;
window.showNewTemplateModal = showNewTemplateModal;
window.editTemplate = editTemplate;
window.showNewLeadModal = showNewLeadModal;
window.salvarLead = salvarLead;

// â•â•â• EVENT DELEGATION (CSP COMPATIBLE) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
      console.warn('[Painel] FunÃ§Ã£o nÃ£o encontrada:', fnName);
    }
  }
});

