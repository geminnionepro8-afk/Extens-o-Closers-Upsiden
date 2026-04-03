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
let userData = { userId: null, nome: '', email: '', isAdmin: false, avatar_url: '', permissions: {} };
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
    const profile = await UpsidenAuth.getProfile();
    
    console.log(P, 'Perfil carregado:', profile);
    
    if (profile) {
      userData.isAdmin = (profile.role === 'admin');
      userData.teamAdminId = userData.isAdmin ? userData.userId : profile.admin_id;
      userData.nome = profile.nome || profile.email?.split('@')[0] || '';
      userData.email = profile.email || '';
      userData.avatar_url = profile.avatar_url || '';
      userData.permissions = profile.permissions || {
        audios: true, midias: true, documentos: true, templates: true, 
        crm: true, automacao: true, gatilhos: true, fluxos: true
      };
    } else {
      console.warn(P, 'Nenhum perfil encontrado para o ID:', userData.userId);
      userData.isAdmin = false;
    }

    // UI - user info
    document.getElementById('user-display-name').textContent = userData.nome;
    document.getElementById('user-display-role').textContent = userData.isAdmin ? 'Administrador' : 'Closer';
    document.getElementById('user-display-role').className = `user-role ${userData.isAdmin ? 'admin' : ''}`;
    
    // Avatar Logic (Header & Popup)
    const initial = (userData.nome[0] || 'U').toUpperCase();
    const avatarEl = document.getElementById('user-avatar');
    const presenceStack = document.getElementById('presence-stack');
    
    if (userData.avatar_url) {
      if (avatarEl) {
        avatarEl.style.backgroundImage = `url('${userData.avatar_url}')`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        avatarEl.textContent = '';
        avatarEl.classList.add('has-avatar');
      }
      if (presenceStack) {
        presenceStack.innerHTML = `<div class="p-avatar has-avatar" style="background-image: url('${userData.avatar_url}'); background-size: cover; background-position: center;"></div>`;
      }
    } else {
      if (avatarEl) avatarEl.textContent = initial;
      if (presenceStack) presenceStack.innerHTML = `<div class="p-avatar">${initial}</div>`;
    }

    if (userData.isAdmin) {
      document.getElementById('nav-admin').style.display = 'flex';
      document.getElementById('admin-section-label').style.display = 'block';
    }

    // Hide restricted sections for non-admins
    if (!userData.isAdmin) {
      const map = {
        'biblioteca': 'audios',
        'templates': 'templates',
        'crm': 'crm',
        'automacoes': 'automacao',
        'gatilhos': 'gatilhos',
        'flow': 'fluxos'
      };
      Object.entries(map).forEach(([section, key]) => {
        if (userData.permissions[key] === false) {
          const btn = document.querySelector(`.nav-item[data-section="${section}"]`);
          if (btn) btn.style.display = 'none';
        }
      });
    }

    // Load data with Partitioning
    console.log(P, 'Carregando dados particionados...');
    const teamAdminId = userData.isAdmin ? userData.userId : profile.admin_id;
    
    // Filtro base: admin_id do time
    const baseQuery = (table) => {
      let q = UpsidenDB.from(table).select('*').eq('admin_id', teamAdminId);
      // Se for closer, vê o dele, o compartilhado com o time OU o compartilhado individualmente com ele
      if (!userData.isAdmin) {
        q = q.or(`criado_por.eq.${userData.userId},compartilhado.eq.true,acesso_individual.cs.["${userData.userId}"]`);
      }
      return q.order('created_at', false).execute().catch(() => []);
    };

    const [audios, docs, midias, templates, leads, membros] = await Promise.all([
      baseQuery('audios'),
      baseQuery('documentos'),
      baseQuery('midias'),
      baseQuery('templates'),
      baseQuery('leads'),
      userData.isAdmin ? UpsidenDB.from('profiles').select('*').eq('admin_id', userData.userId).execute().catch(()=>[]) : Promise.resolve([])
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
      if (!userMenuPopup || !sidebar || !btnUserMenu) return;
      const rect = btnUserMenu.getBoundingClientRect();
      const isCollapsed = sidebar.classList.contains('collapsed');
      
      // Posicionamento horizontal (Dentro da sidebar)
      if (isCollapsed) {
        userMenuPopup.style.left = '8px';
        userMenuPopup.style.width = 'calc(var(--sidebar-collapsed) - 16px)';
      } else {
        userMenuPopup.style.left = '12px';
        userMenuPopup.style.width = 'calc(var(--sidebar-width) - 24px)';
      }
      
      // Posicionamento vertical: ACIMA do card
      const distanceToBottom = window.innerHeight - rect.top;
      userMenuPopup.style.bottom = `${distanceToBottom + 12}px`;
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
    if (userData.avatar_url) {
      if (umpAvatar) {
        umpAvatar.style.backgroundImage = `url('${userData.avatar_url}')`;
        umpAvatar.style.backgroundSize = 'cover';
        umpAvatar.style.backgroundPosition = 'center';
        umpAvatar.textContent = '';
        umpAvatar.classList.add('has-avatar');
      }
    } else {
      if (umpAvatar) umpAvatar.textContent = initial;
    }

    // Perfil (inside popup)
    document.getElementById('btn-nav-perfil')?.addEventListener('click', () => {
      closeUserMenu();
      navigate('perfil');
    });

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

    window.checkNotifications();
    setInterval(window.checkNotifications, 60000);

  } catch(err) {
    console.error(P, 'Erro ao inicializar:', err);
    document.getElementById('loading-page').innerHTML = `<p style="color:var(--danger);">Erro ao carregar painel. Recarregue a pagina.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', initPainel);

window.setCRMTab = function(tab) {
  if (typeof window.renderCRM === 'function') {
    window.currentCRMTab = tab;
    if (currentSection !== 'crm') {
       navigate('crm');
    } else {
       renderSection('crm');
    }
  }
};

window.checkNotifications = async function() {
  try {
     const profile = await UpsidenAuth.getProfile();
     const uid = profile?.role === 'admin' ? profile?.id : (profile?.admin_id || profile?.id);
     
     const { data, count, error } = await UpsidenDB.from('crm_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', uid)
        .eq('status', 'pending')
        .lte('reminder_at', new Date().toISOString());

     const badges = ['notif-badge', 'notif-badge-crm'];
     badges.forEach(id => {
       const badge = document.getElementById(id);
       if (badge) {
          if (count > 0) {
             badge.textContent = count > 9 ? '9+' : count;
             badge.style.display = 'flex';
             badge.parentElement.classList.add('pulse-notif');
          } else {
             badge.style.display = 'none';
             badge.parentElement.classList.remove('pulse-notif');
          }
       }
     });
  } catch(e) {}
};

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
