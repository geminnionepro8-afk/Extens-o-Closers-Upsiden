/**
 * @file ipc-bridge.js
 * @description Ponte de comunicação (Content Script). 
 *              Versão: 2.3 - OPEN CONFIG FLOW
 */

const IPC_CTX = '[IPC-Bridge]';

console.log(`%c🛸 ${IPC_CTX} ATENÇÃO: VERSÃO 2.3 RODANDO - CONFIGURADO!`, "background: green; color: white; font-size: 14px; padding: 5px;");

window.addEventListener('message', (ev) => {
    //   CSP BYPASS PROXY PARA DOWNLOAD DE MÍDIAS (SUPABASE)
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

    // ── CONFIGURAÇÕES GLOBAL LISTENER (RESOLUÇÃO DO APAGÃO) ──
    // Responde ao polling do wpp-engine puxando da extensão e enviando para o Engine
    if (ev.data?.origem === 'INJETOR_PAGINA_INIT' && ev.data.ev === 'puxar_config_auto_reply') {
        chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_flows', 'ups_config_horario', 'ups_config_regras'], (res) => {
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
        return;
    }

    // REPESSAR OUTRAS MENSAGENS (COMUM: DA PÁGINA -> EXTENSÃO)
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.tipoMensagem) {
        chrome.runtime.sendMessage(ev.data);
    }
});

// ESCUTAR RESPOSTAS E CONFIGURAÇÕES (DA EXTENSÃO -> PÁGINA)
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
        'set_config_privacidade'
    ];

    if (tiposPermitidos.includes(msg.tipoMensagem) || tiposPermitidos.includes(msg.tipo)) {
        console.log(`${IPC_CTX} Redirecionando comando para a página:`, msg.tipoMensagem || msg.tipo);
        window.postMessage({ 
            origem: 'CONTENT_SCRIPT', 
            tipoMensagem: msg.tipoMensagem || msg.tipo, 
            dados: msg.dados || msg 
        }, '*');
    }
});
