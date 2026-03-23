/**
 * @file painel-privacidade.js
 * @description Modulo 05: UI - Controle de Privacidade e Seguranca
 *              Gerencia as chaves (toggles) que injetam Regras no WPPConnect.
 */

window.renderPrivacidade = async function(container) {
  const html = `
    <div style="padding: 20px; max-width: 800px;">
      <div class="module-header" style="margin-bottom:24px;">
        <h2>Segurança e Privacidade</h2>
        <p style="color:var(--text-muted);">Gerencie quem ve seus passos no WhatsApp e proteja sua tela de olhos curiosos.</p>
      </div>

      <!-- Toggles List -->
      <div class="config-section" style="background:var(--bg-layer-2); padding:20px; border-radius:12px; margin-bottom:24px; border: 1px solid var(--border-color);">
        <h3 style="margin-bottom:16px; font-size:16px; color:var(--text-primary); border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          Modo Fantasma (Via WPPConnect Sockets)
        </h3>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Ocultar Status "Online"</span>
          <input type="checkbox" id="chk_privacy_hide_online" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Ocultar "Digitando..." e "Gravando..."</span>
          <input type="checkbox" id="chk_privacy_hide_typing" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Desativar Tiques Azuis (Avisos de Leitura)</span>
          <input type="checkbox" id="chk_privacy_hide_read" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Visualizar Status/Stories Em Segredo</span>
          <input type="checkbox" id="chk_privacy_hide_status" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500; color:#3b82f6;">Ver Mensagens Apagadas (Anti-Delete Real-Time)</span>
          <input type="checkbox" id="chk_privacy_recover_deleted" class="toggle-cb" style="transform:scale(1.2);">
        </label>
      </div>

      <div class="config-section" style="background:var(--bg-layer-2); padding:20px; border-radius:12px; margin-bottom:24px; border: 1px solid var(--border-color);">
        <h3 style="margin-bottom:16px; font-size:16px; color:var(--text-primary); border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          Modo Borrado (Blur) (Injecao CSS)
        </h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
          As informacoes borradas se revelam magicamente quando voce rolar o mouse por cima delas.
        </p>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Borrar Nomes dos Contatos</span>
          <input type="checkbox" id="chk_privacy_blur_contacts" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Borrar Fotos de Perfil (Avatares)</span>
          <input type="checkbox" id="chk_privacy_blur_avatars" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; cursor:pointer;">
          <span style="font-weight:500;">Borrar Janela de Bate-Papo (Mensagens)</span>
          <input type="checkbox" id="chk_privacy_blur_msgs" class="toggle-cb" style="transform:scale(1.2);">
        </label>
      </div>

      <div class="config-section" style="background:var(--bg-layer-2); padding:20px; border-radius:12px; border: 1px solid rgba(239, 68, 68, 0.4);">
        <h3 style="margin-bottom:16px; font-size:16px; color:#ef4444; border-bottom:1px solid rgba(239, 68, 68, 0.2); padding-bottom:8px;">
          Cadeado de Tela (Senha PIN Mestra)
        </h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
          Exige uma senha imodificavel de 4 digitos sempre que a tela do Web.WhatsApp carregar, isolando o Workspace.
        </p>
        <label class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
          <span style="font-weight:500;">Ativar Bloqueio por Senha (PIN)</span>
          <input type="checkbox" id="chk_privacy_pin_enabled" class="toggle-cb" style="transform:scale(1.2);">
        </label>
        
        <div id="pin-setup-box" style="display:none; margin-top:20px; align-items:center; justify-content:space-between; background:var(--bg-layer-1); padding:16px; border-radius:8px;">
          <div>
            <span style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:6px;">Defina seu PIN de 4 digitos:</span>
            <input type="password" id="inp_privacy_pin_code" maxlength="4" placeholder="••••" style="width:100px; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-layer-3); color:var(--text-primary); text-align:center; font-size:20px; letter-spacing:4px;">
          </div>
          <button id="btn_salvar_pin" class="btn btn-sm" style="background:#ef4444; border:none; padding:10px 24px; border-radius:8px; font-weight:600; cursor:pointer; color:#fff;">Gravar PIN de Seguranca</button>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;

  // Key map
  const toggles = [
    'privacy_hide_online', 'privacy_hide_typing', 'privacy_hide_read', 
    'privacy_hide_status', 'privacy_recover_deleted',
    'privacy_blur_contacts', 'privacy_blur_avatars', 'privacy_blur_msgs',
    'privacy_pin_enabled'
  ];

  // Load States
  chrome.storage.local.get([...toggles, 'privacy_pin_code'], (res) => {
    toggles.forEach(key => {
      const el = document.getElementById('chk_' + key);
      if(el) {
        el.checked = (res[key] === 'true' || res[key] === true);
        
        el.addEventListener('change', (e) => {
          const val = e.target.checked;
          chrome.storage.local.set({ [key]: val }, () => {
             // Injetar mensagem pro WhatsApp Web recarregar configuracoes (subindo via parent do iframe)
             window.parent.postMessage({ origem: 'PAINEL', acao: 'privacy_update', chave: key, valor: val }, '*');
             if(typeof toast === 'function') toast('Regra de privacidade salva: ' + key, 'info');
             
             if(key === 'privacy_pin_enabled') {
               togglePinBox(val);
             }
          });
        });
      }
    });
    
    // Initial PIN box rule
    togglePinBox(res['privacy_pin_enabled'] === 'true' || res['privacy_pin_enabled'] === true);
    
    if(res['privacy_pin_code']) {
        document.getElementById('inp_privacy_pin_code').value = res['privacy_pin_code'];
    }
  });
  
  function togglePinBox(show) {
     const box = document.getElementById('pin-setup-box');
     if(box) box.style.display = show ? 'flex' : 'none';
  }

  // PIN Save Logic
  document.getElementById('btn_salvar_pin')?.addEventListener('click', () => {
     const inp = document.getElementById('inp_privacy_pin_code');
     if(!inp) return;
     const val = inp.value.trim();
     if(val.length !== 4) {
         if(typeof toast === 'function') toast('O PIN mestre deve conter exatamente 4 digitos!', 'error');
         return;
     }
     chrome.storage.local.set({ privacy_pin_code: val }, () => {
         if(typeof toast === 'function') toast('PIN Mestre Gravado com Seguranca.', 'success');
         // Relay pin setup explicitly
         window.parent.postMessage({ origem: 'PAINEL', acao: 'privacy_update', chave: 'privacy_pin_code', valor: val }, '*');
     });
  });
};
