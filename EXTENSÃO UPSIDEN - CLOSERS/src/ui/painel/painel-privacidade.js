/**
 * @file painel-privacidade.js
 * @description Modulo 05: UI - Controle de Privacidade e Seguranca
 *              Gerencia as chaves (toggles) que injetam Regras no WPPConnect.
 */

window.renderPrivacidade = async function(container) {
  const html = `
    <div style="padding: 0 40px 40px 40px; max-width: 800px; min-height: 100vh;">
      
      <!-- SESSÃO 1: MODO BORRADO (Checkboxes Style) -->
      <div style="margin-bottom: 48px;">
        <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 24px; margin-top: 0;">
          Modo Borrado (Blur Visual)
        </h3>
        
        <div style="display:flex; flex-direction:column; gap:8px;">
           <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin:0;">Ocultar Elementos em Tela...</h4>
           <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Selecione os elementos que deseja proteger para que só fiquem visíveis sob a passagem do mouse.</p>
           
           <div style="display:flex; flex-direction:column; gap: 16px;">
              <label style="display:flex; align-items:center; gap: 12px; cursor: pointer;">
                 <input type="checkbox" id="chk_privacy_blur_contacts" style="accent-color: var(--accent); width: 18px; height: 18px; cursor:pointer; flex-shrink:0; border-radius:4px; border:1px solid var(--border-color);">
                 <span style="font-size: 14px; font-weight: 500; color: var(--text-primary);">Nomes dos Contatos</span>
              </label>
              
              <label style="display:flex; align-items:center; gap: 12px; cursor: pointer;">
                 <input type="checkbox" id="chk_privacy_blur_avatars" style="accent-color: var(--accent); width: 18px; height: 18px; cursor:pointer; flex-shrink:0; border-radius:4px; border:1px solid var(--border-color);">
                 <span style="font-size: 14px; font-weight: 500; color: var(--text-primary);">Fotos de Perfil (Avatares)</span>
              </label>
              
              <label style="display:flex; align-items:center; gap: 12px; cursor: pointer;">
                 <input type="checkbox" id="chk_privacy_blur_msgs" style="accent-color: var(--accent); width: 18px; height: 18px; cursor:pointer; flex-shrink:0; border-radius:4px; border:1px solid var(--border-color);">
                 <span style="font-size: 14px; font-weight: 500; color: var(--text-primary);">Janela de Bate-Papo (Mensagens)</span>
              </label>
           </div>
        </div>
      </div>

      <!-- SESSÃO 2: MODO FANTASMA (Toggles Style - Interruptores à direita) -->
      <div style="margin-bottom: 48px;">
        <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 16px;">
          Modo Fantasma (Infraestrutura)
        </h3>

        <!-- Toggle Row 1 -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.02);">
           <div style="padding-right: 24px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Ocultar Status "Online"</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin:0;">Esconda totalmente sua presença e permanência enquanto navega.</p>
           </div>
           <label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" id="chk_privacy_hide_online"><span class="toggle-slider"></span></label>
        </div>

        <!-- Toggle Row 2 -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.02);">
           <div style="padding-right: 24px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Ocultar "Digitando..." e "Gravando..."</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin:0;">Não deixe os contatos perceberem seu momento de ação ao redigir conteúdo.</p>
           </div>
           <label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" id="chk_privacy_hide_typing"><span class="toggle-slider"></span></label>
        </div>

        <!-- Toggle Row 3 -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.02);">
           <div style="padding-right: 24px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Ocultar Tiques Azuis (Notificação de Leitura)</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin:0;">Sua confirmação de leitura não será enviada à outra ponta do chat.</p>
           </div>
           <label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" id="chk_privacy_hide_read"><span class="toggle-slider"></span></label>
        </div>

        <!-- Toggle Row 4 -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.02);">
           <div style="padding-right: 24px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Visualizar Stories & Status Confidencialmente</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin:0;">Explore os status contatados de modo totalmente isolado e não rastreado.</p>
           </div>
           <label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" id="chk_privacy_hide_status"><span class="toggle-slider"></span></label>
        </div>
        
        <!-- Toggle Row 5 -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0;">
           <div style="padding-right: 24px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--accent); margin-bottom: 4px;">Interceptador de Mensagens Apagadas</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin:0;">Realiza a leitura forçada em cache de toda mensagem que for excluída 'para ambos'.</p>
           </div>
           <label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" id="chk_privacy_recover_deleted"><span class="toggle-slider"></span></label>
        </div>
      </div>

      <!-- SESSÃO 3: CADEADO (Toggles Style + Input field) -->
      <div style="margin-bottom: 48px;">
        <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 16px;">
          Segurança Local
        </h3>

        <!-- Toggle Row PIN -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 16px 0;">
           <div style="padding-right: 24px;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Autenticação em Duas Etapas Externa (PIN Mestre)</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin:0;">Tranque e sele o acesso primário ao ser exigido quatro dígitos secretos no seu portal.</p>
           </div>
           <label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" id="chk_privacy_pin_enabled"><span class="toggle-slider"></span></label>
        </div>
        
        <!-- Bloco Interativo PIN (Compacto) -->
        <div id="pin-setup-box" style="display:none; align-items:center; justify-content:space-between; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-top: 8px;">
           <div style="flex:1;">
               <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Defina seu Código de Segredo:</div>
               <input type="password" id="inp_privacy_pin_code" maxlength="4" placeholder="••••" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; font-size: 20px; letter-spacing: 12px; border-radius: 8px; width: 140px; color: #fff; text-align: center; outline: none;">
           </div>
           <button id="btn_salvar_pin" style="background: var(--accent); color: #fff; padding: 10px 24px; font-weight: 700; border-radius: 8px; font-size: 13px; border: none; cursor: pointer; transition: all 0.2s;">Guardar Senha Secreta</button>
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
     });
  });
};
