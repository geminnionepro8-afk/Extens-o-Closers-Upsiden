/**
 * @file ipc-bridge.js
 * @description Ponte de comunicação (Content Script). 
 *              Versão: 3.0 — INSTANT SYNC + STORAGE.ONCHANGED
 */

const IPC_CTX = '[IPC-Bridge]';

console.log(`%c🛸 ${IPC_CTX} v3.0 RODANDO — Config Instantânea via storage.onChanged`, "background: green; color: white; font-size: 12px; padding: 4px 8px;");

// ── FUNÇÃO PRINCIPAL: Empurrar config para a página ─────────
function pushConfigToPage() {
    chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_flows', 'ups_config_horario', 'ups_config_regras'], (res) => {
        if (chrome.runtime.lastError) {
            console.error(`${IPC_CTX} Erro ao ler storage:`, chrome.runtime.lastError.message);
            return;
        }

        if (res.ups_config_saudacao) {
            window.postMessage({ origem: 'CONTENT_SCRIPT', tipoMensagem: 'set_config_auto_reply', dados: res.ups_config_saudacao }, '*');
        }
        if (res.ups_config_triggers) {
            window.postMessage({ origem: 'CONTENT_SCRIPT', tipoMensagem: 'set_config_triggers', dados: res.ups_config_triggers }, '*');
        }
        if (res.ups_config_flows) {
            window.postMessage({ origem: 'CONTENT_SCRIPT', tipoMensagem: 'set_config_flows', dados: res.ups_config_flows }, '*');
        }
    });
}

// ── PRIMÁRIO: storage.onChanged (INSTANTÂNEO) ───────────────
// Quando o Painel salva config, o storage muda e o Engine recebe IMEDIATAMENTE
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    const autoKeys = ['ups_config_saudacao', 'ups_config_triggers', 'ups_config_flows', 'ups_config_horario', 'ups_config_regras'];
    const changedAutoKeys = Object.keys(changes).filter(k => autoKeys.includes(k));

    if (changedAutoKeys.length > 0) {
        console.log(`%c${IPC_CTX} ⚡ storage.onChanged DETECTADO: [${changedAutoKeys.join(', ')}] — Sincronizando INSTANTANEAMENTE`, "color: #FF4D00; font-weight: bold;");
        pushConfigToPage();
    }
});

// ── LISTENERS DE MENSAGENS DA PÁGINA ────────────────────────
window.addEventListener('message', (ev) => {
    // CSP BYPASS PROXY PARA DOWNLOAD DE MÍDIAS (SUPABASE)
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'fetch_media_base64') {
       const reqId = ev.data.reqId;
       const url = ev.data.url;
       
       let session = null;
       try {
           for (let i = 0; i < localStorage.length; i++) {
               const key = localStorage.key(i);
               if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                   session = localStorage.getItem(key);
                   break;
               }
           }
       } catch(e) {}

       chrome.runtime.sendMessage({ 
           tipo: 'fetch_media_base64_bg', 
           url: url,
           session: session 
       }, (resposta) => {
          if (chrome.runtime.lastError) {
             console.error(`${IPC_CTX} [CRITICAL] IPC failed. LastError:`, chrome.runtime.lastError.message);
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, erro: chrome.runtime.lastError.message }, '*');
          } else if (resposta && resposta.base64) {
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, base64: resposta.base64 }, '*');
          } else {
             console.error(`${IPC_CTX} [CRITICAL] IPC Resposta inválida:`, resposta);
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, erro: resposta?.erro || 'Vazio/Timeout' }, '*');
          }
       });
       return;
    }

    // FALLBACK: Polling do wpp-engine (backup — primário é storage.onChanged)
    if (ev.data?.origem === 'INJETOR_PAGINA_INIT' && ev.data.ev === 'puxar_config_auto_reply') {
        pushConfigToPage();
        return;
    }

    // REPASSAR OUTRAS MENSAGENS (DA PÁGINA → EXTENSÃO)
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.tipoMensagem) {
        chrome.runtime.sendMessage(ev.data);
    }
});

// ── ESCUTAR COMANDOS DO BACKGROUND → PÁGINA ─────────────────
chrome.runtime.onMessage.addListener((msg) => {
    const tiposPermitidos = [
        'enviar_audio_biblioteca', 
        'resume_flow_task', 
        'enviar_agendamento',
        'set_config_auto_reply',
        'set_config_triggers',
        'set_config_horario',
        'set_config_regras',
        'set_config_flows',
        'set_config_privacidade',
        'reload_automation_config'
    ];

    // Reload automação: forçar push de toda config para a página
    if (msg.tipo === 'reload_automation_config' || msg.tipoMensagem === 'reload_automation_config') {
        console.log(`${IPC_CTX} 🔄 Recebeu reload_automation_config — Forçando sync`);
        pushConfigToPage();
        return;
    }

    if (tiposPermitidos.includes(msg.tipoMensagem) || tiposPermitidos.includes(msg.tipo)) {
        console.log(`${IPC_CTX} Redirecionando comando para a página:`, msg.tipoMensagem || msg.tipo);
        window.postMessage({ 
            origem: 'CONTENT_SCRIPT', 
            tipoMensagem: msg.tipoMensagem || msg.tipo, 
            dados: msg.dados || msg 
        }, '*');
    }
});
