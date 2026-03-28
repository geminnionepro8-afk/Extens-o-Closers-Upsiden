/**
 * @file painel-perfil.js
 * @description Renderiza a secao Painel de Perfil do usuario.
 *              Permite alteracao de Nome, Email e Foto de Perfil (Logotipo da conta).
 * @module Modulo 06: UI - Painel (Perfil)
 */

function renderPerfil(c) {
  if (!userData || !userData.userId) {
    c.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-muted);">Erro: Dados do usuário não carregados. Recarregue a página.</p>';
    return;
  }

  let initial = (userData.nome || userData.email || 'U')[0].toUpperCase();
  let avatarBg = userData.avatar_url ? `url('${userData.avatar_url}')` : '';
  let avatarClass = userData.avatar_url ? 'has-avatar' : '';
  
  let html = `
    <div class="perfil-container animate-in">
      <div class="perfil-header-glass">
        <!-- Input invisivel para upload de foto -->
        <input type="file" id="perfil-avatar-upload" accept="image/*" style="display:none;" />
        
        <div class="perfil-avatar-wrapper" data-click="triggerAvatarUpload()" title="Alterar Logotipo">
          <div class="perfil-avatar ${avatarClass}" id="perfil-avatar-preview" style="background-image: ${avatarBg};">
            ${!userData.avatar_url ? `<span>${initial}</span>` : ''}
          </div>
          <div class="perfil-avatar-overlay">
            <svg viewBox="0 0 24 24" fill="none" class="camera-icon"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle></svg>
            <span>Trocar Logo</span>
          </div>
        </div>
        
        <div class="perfil-title-area">
          <h2>Meu Perfil ${userData.isAdmin ? '<svg class="role-badge" viewBox="0 0 24 24" style="width: 18px; height: 18px; margin-left: 6px; fill: var(--sb-accent); vertical-align: -2px;"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>' : ''}</h2>
          <p>Gerencie as informacoes e a logomarca da sua conta.</p>
        </div>
      </div>
      
      <div class="perfil-form-area">
        <div class="form-group-perfil">
          <label>Nome Completo (Membro/Conta)</label>
          <div class="input-glass">
            <svg viewBox="0 0 24 24" class="input-icon"><path stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
            <input type="text" id="perfil-input-nome" value="${userData.nome || ''}" placeholder="Seu nome" />
          </div>
        </div>
        
        <div class="form-group-perfil">
          <label>Email de Acesso</label>
          <div class="input-glass disabled">
            <svg viewBox="0 0 24 24" class="input-icon"><path stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <input type="text" value="${userData.email || ''}" disabled />
          </div>
          <span class="form-hint">O email principal de conexao nao pode ser alterado por aqui.</span>
        </div>
        
        <div class="perfil-actions">
          <button class="btn-perfil-save" data-click="salvarPerfil()">
            <svg class="btn-icon" style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Salvar Alteracoes
          </button>
        </div>
      </div>
    </div>
  `;
  c.innerHTML = html;

  // Custom listener for file input (change event)
  const up = c.querySelector('#perfil-avatar-upload');
  if (up) up.addEventListener('change', window.handlePerfilAvatar);
}

// Handler para trigger (CSP)
window.triggerAvatarUpload = function() {
  const up = document.getElementById('perfil-avatar-upload');
  if (up) up.click();
};

window.handlePerfilAvatar = async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Por favor, selecione uma imagem valida.', 'error');
    return;
  }
  
  try {
    toast('Iniciando envio do logotipo...', 'info');
    const btn = document.querySelector('.btn-perfil-save');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    
    // Convert to strict base64 if needed, but UpsidenStorage is better.
    // Try bucket "midias" which handles public files
    const path = `avatars/${userData.userId}_${Date.now()}`;
    await UpsidenStorage.upload('midias', path, file, file.type);
    
    // Retrieve the public URL
    const publicUrl = UpsidenStorage.signedUrl('midias', path);
    if (!publicUrl) throw new Error("Falha ao resolver URL do Storage");

    // Persist to user's profile table
    await UpsidenDB.from('profiles').update({ avatar_url: publicUrl }).eq('id', userData.userId).execute();
    
    // Overwrite local memory
    userData.avatar_url = publicUrl;
    
    // Patch local visual components globally
    const preview = document.getElementById('perfil-avatar-preview');
    if (preview) {
      preview.style.backgroundImage = `url('${publicUrl}')`;
      preview.classList.add('has-avatar');
      preview.innerHTML = '';
    }
    
    // Header Avatar (Sidebar footer)
    const headerAvatar = document.getElementById('user-avatar');
    if (headerAvatar) {
      headerAvatar.style.backgroundImage = `url('${publicUrl}')`;
      headerAvatar.style.backgroundSize = 'cover';
      headerAvatar.style.backgroundPosition = 'center';
      headerAvatar.textContent = '';
      headerAvatar.classList.add('has-avatar');
    }
    
    // Presence Stack Avatar (Topbar)
    const presenceAvatar = document.querySelector('.p-avatar');
    if (presenceAvatar) {
      presenceAvatar.style.backgroundImage = `url('${publicUrl}')`;
      presenceAvatar.style.backgroundSize = 'cover';
      presenceAvatar.style.backgroundPosition = 'center';
      presenceAvatar.textContent = '';
      presenceAvatar.classList.add('has-avatar');
    }
    
    // User Menu Modal Avatar
    const umpAvatar = document.getElementById('user-avatar-popup');
    if (umpAvatar) {
      umpAvatar.style.backgroundImage = `url('${publicUrl}')`;
      umpAvatar.style.backgroundSize = 'cover';
      umpAvatar.style.backgroundPosition = 'center';
      umpAvatar.textContent = '';
      umpAvatar.classList.add('has-avatar');
    }
    
    toast('Logotipo atualizado e salvo com Sucesso!', 'success');
  } catch (err) {
    console.error('[Painel Perfil]', err);
    toast('Erro de rede ao salvar logotipo. Tente novamente.', 'error');
  } finally {
    const btn = document.querySelector('.btn-perfil-save');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    e.target.value = '';
  }
};

window.salvarPerfil = async function() {
  const inputNome = document.getElementById('perfil-input-nome');
  if (!inputNome) return;
  const novoNome = inputNome.value.trim();
  
  if (!novoNome) {
    toast('O nome da conta nao pode ser vazio!', 'error');
    return;
  }
  
  try {
    const btn = document.querySelector('.btn-perfil-save');
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';
    
    await UpsidenDB.from('profiles').update({ nome: novoNome }).eq('id', userData.userId).execute();
    
    userData.nome = novoNome;
    
    // Atualizar UI reflexiva (Topbar e Painel do Usuario)
    const topName = document.getElementById('user-display-name');
    if (topName) topName.textContent = userData.nome;
    
    const umpName = document.getElementById('ump-name');
    const nameVerifiedIcon = userData.isAdmin ? `<svg class="role-badge" viewBox="0 0 24 24" style="width: 18px; height: 18px; margin-left: 6px; fill: var(--sb-accent); vertical-align: -2px;"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>` : '';
    if (umpName) umpName.innerHTML = userData.nome + nameVerifiedIcon;

    // Se estiver sem avatar, atualizar a inicial do circulo
    if (!userData.avatar_url) {
      const initial = userData.nome[0].toUpperCase();
      const ua = document.getElementById('user-avatar'); if(ua) ua.textContent = initial;
      const pa = document.querySelector('.p-avatar'); if(pa) pa.textContent = initial;
      const uap = document.getElementById('user-avatar-popup'); if(uap) uap.textContent = initial;
    }
    
    toast('Nome atualizado e salvo com sucesso!', 'success');
  } catch (err) {
    console.error('[Painel Perfil]', err);
    toast('Erro ao alterar os dados', 'error');
  } finally {
    const btn = document.querySelector('.btn-perfil-save');
    btn.disabled = false;
    btn.innerHTML = `<svg class="btn-icon" style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Salvar Alteracoes`;
  }
};
