/**
 * @file ipc-bridge.js
 * @description Este arquivo é a "ponte de comunicação" (IPC Bridge) entre os diferentes
 *              contextos da extensão Upsiden:
 *              - Content Script ↔ Injetor de Página (via window.postMessage)
 *              - Content Script ↔ Service Worker (via chrome.runtime)
 *              - Iframes dos módulos ↔ Content Script (via window.postMessage)
 *              Toda troca de dados entre estes contextos passa por aqui.
 *              Exemplos: enviar áudio da biblioteca, receber comandos de bulk send,
 *              sincronizar configuração de automação, relatar progresso de campanhas.
 * @module Módulo 03: Protocolo de Comunicação Inter-Processos (IPC)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

const IPC_CTX = '[IPC-Bridge]';

// ── Enviar dados para o Injetor de Página (WPP Engine) ───
function enviarParaPagina(dados) {
  return new Promise((resolve, reject) => {
    const id = Date.now() + Math.random().toString();
    const payload = { ...dados, msgId: id, origem: 'CONTENT_SCRIPT' };
    
    // Timeout de segurança (10s)
    const timeout = setTimeout(() => {
      window.removeEventListener('message', fn);
      reject(new Error(`Timeout IPC: O motor do WhatsApp (WPP) não respondeu ao comando: ${dados.tipoMensagem || dados.tipo}`));
    }, 10000);

    const fn = ev => {
      if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.msgId === id) {
        window.removeEventListener('message', fn);
        clearTimeout(timeout);
        resolve(ev.data.resposta);
      }
    };
    window.addEventListener('message', fn);
    window.postMessage(payload, '*');
  });
}

// Expõe métodos para os Módulos UI nativos (Shadow DOM) rodando no mesmo Content Script
window.UpsidenIPC = { enviarParaPagina, sincronizarConfigAutomacao };

// ── Receber comandos do Service Worker (chrome.runtime) ──
/**
 * Escuta mensagens do Service Worker (background) e roteia para o injetor de página.
 * Comandos suportados:
 * - enviar_audio_biblioteca: envia um áudio gravado para o chat ativo.
 * - bulk_send_start: inicia envio em massa de mensagens.
 * - bulk_pausar/continuar/cancelar: controles do envio em massa.
 */
chrome.runtime.onMessage.addListener((msg, _, responder) => {
  if (msg.tipo === 'enviar_audio_biblioteca') {
    enviarParaPagina(msg.dados)
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  // ── AGENDAMENTO DE MENSAGENS: Roteador de Despertador ──
  if (msg.tipo === 'enviar_agendamento') {
    enviarParaPagina({ tipoMensagem: 'agendamento', dados: msg.dados })
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  // ── RETOMAR FLOWS E TIMEOUTS LONGOS ──
  if (msg.tipo === 'resume_flow_task') {
    enviarParaPagina({ tipoMensagem: 'resume_bg_flow', dados: msg.dados });
    responder({ sucesso: true });
    return false;
  }
  // ── GESTÃO DE CONTATOS E EXTRATOR ──
  if (msg.tipo === 'open_chat_unsaved') {
    enviarParaPagina({ tipoMensagem: 'open_chat_unsaved', dados: msg.dados })
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  if (msg.tipo === 'get_groups') {
    enviarParaPagina({ tipoMensagem: 'get_groups' })
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  if (msg.tipo === 'get_wpp_labels') {
    enviarParaPagina({ tipoMensagem: 'get_wpp_labels' })
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  if (msg.tipo === 'wpp_update_label') {
    enviarParaPagina({ tipoMensagem: 'wpp_update_label', dados: msg.dados })
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  if (msg.tipo === 'extract_group_members') {
    enviarParaPagina({ tipoMensagem: 'extract_group_members', dados: msg.dados })
      .then(r => responder(r))
      .catch(e => responder({ sucesso: false, erro: e.message }));
    return true;
  }
  // ── BULK SEND: Receber comando do Painel (via background) ──
  if (msg.tipo === 'bulk_send_start') {
    enviarParaPagina({ tipoMensagem: 'bulk_send_start', dados: msg.dados });
    responder({ sucesso: true, msg: 'Bulk send iniciado.' });
    return false;
  }
  if (msg.tipo === 'bulk_pausar') {
    enviarParaPagina({ tipoMensagem: 'bulk_pausar' });
    responder({ sucesso: true });
    return false;
  }
  if (msg.tipo === 'bulk_continuar') {
    enviarParaPagina({ tipoMensagem: 'bulk_continuar' });
    responder({ sucesso: true });
    return false;
  }
  if (msg.tipo === 'bulk_cancelar') {
    enviarParaPagina({ tipoMensagem: 'bulk_cancelar' });
    responder({ sucesso: true });
    return false;
  }
});

// ── Sincronizar configuração de automação ────────────────
/**
 * Lê as configurações de automação (saudação e gatilhos) do chrome.storage
 * e envia para o injetor de página via postMessage, para que o engine
 * de automação saiba como responder mensagens recebidas.
 */
function sincronizarConfigAutomacao() {
  chrome.storage.local.get(['ups_config_saudacao', 'ups_config_triggers', 'ups_config_horario', 'ups_config_regras', 'ups_config_flow'], (res) => {
    window.postMessage({
      origem: 'CONTENT_SCRIPT',
      msgId: Date.now().toString() + 'S',
      tipoMensagem: 'set_config_auto_reply',
      dados: res.ups_config_saudacao || null
    }, '*');
    window.postMessage({
      origem: 'CONTENT_SCRIPT',
      msgId: Date.now().toString() + 'T',
      tipoMensagem: 'set_config_triggers',
      dados: res.ups_config_triggers || []
    }, '*');
    window.postMessage({
      origem: 'CONTENT_SCRIPT',
      msgId: Date.now().toString() + 'H',
      tipoMensagem: 'set_config_horario',
      dados: res.ups_config_horario || null
    }, '*');
    window.postMessage({
      origem: 'CONTENT_SCRIPT',
      msgId: Date.now().toString() + 'R',
      tipoMensagem: 'set_config_regras',
      dados: res.ups_config_regras || null
    }, '*');
    window.postMessage({
      origem: 'CONTENT_SCRIPT',
      msgId: Date.now().toString() + 'F',
      tipoMensagem: 'set_config_flows',
      dados: res.ups_config_flow || null
    }, '*');
  });
}

// ── SINC PRIVACIDADE EM TEMPO REAL ──
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const pKeys = [
    'privacy_hide_online', 'privacy_hide_typing', 'privacy_hide_read', 
    'privacy_hide_status', 'privacy_recover_deleted', 'privacy_blur_contacts', 
    'privacy_blur_avatars', 'privacy_blur_msgs', 'privacy_pin_enabled', 'privacy_pin_code'
  ];
  
  for (let key in changes) {
    if (pKeys.includes(key)) {
       window.postMessage({
         origem: 'CONTENT_SCRIPT',
         tipoMensagem: 'set_config_privacidade_single',
         chave: key,
         valor: changes[key].newValue
       }, '*');
    }
  }
});

function sincronizarConfigPrivacidade() {
  const keys = [
     'privacy_hide_online', 'privacy_hide_typing', 'privacy_hide_read', 
     'privacy_hide_status', 'privacy_recover_deleted', 'privacy_blur_contacts', 
     'privacy_blur_avatars', 'privacy_blur_msgs', 'privacy_pin_enabled', 'privacy_pin_code'
  ];
  chrome.storage.local.get(keys, (res) => {
    window.postMessage({
      origem: 'CONTENT_SCRIPT',
      msgId: Date.now().toString() + 'P',
      tipoMensagem: 'set_config_privacidade',
      dados: res
    }, '*');
    
    // Aplicar Blur CSS baseado no estado salvo
    aplicarBlurCSS(res);
  });
}

// ── BLUR CSS INJECTION ENGINE ──
// Injeta/Remove CSS no DOM do WhatsApp Web para borrar elementos visuais
function aplicarBlurCSS(cfg) {
  const STYLE_ID = 'upsiden-privacy-blur-css';
  let existente = document.getElementById(STYLE_ID);
  if (existente) existente.remove();
  
  let regras = [];
  
  // Borrar Nomes de Contatos (lista lateral + cabeçalho do chat)
  if (cfg.privacy_blur_contacts === true || cfg.privacy_blur_contacts === 'true') {
    regras.push(`
      /* Nomes na lista de conversas */
      [data-testid="cell-frame-title"] span,
      ._ahxt span, ._ahxu span, ._ahxk > span,
      /* Nome no cabeçalho do chat aberto */
      header [data-testid="conversation-info-header-chat-title"] span,
      header ._amig span, header ._amid span,
      /* Nome em grupos */
      [data-testid="msg-container"] [data-testid="author"] span,
      ._amk6 ._ao3e {
        filter: blur(6px) !important;
        transition: filter 0.3s ease !important;
      }
      [data-testid="cell-frame-title"] span:hover,
      ._ahxt span:hover, ._ahxu span:hover, ._ahxk > span:hover,
      header [data-testid="conversation-info-header-chat-title"] span:hover,
      header ._amig span:hover, header ._amid span:hover,
      [data-testid="msg-container"] [data-testid="author"] span:hover,
      ._amk6 ._ao3e:hover {
        filter: blur(0px) !important;
      }
    `);
  }
  
  // Borrar Avatares (fotos de perfil)
  if (cfg.privacy_blur_avatars === true || cfg.privacy_blur_avatars === 'true') {
    regras.push(`
      /* Avatares na lista de conversas */
      [data-testid="cell-frame-primary"] img,
      [data-testid="chat-list"] img[draggable="false"],
      ._ahlk img, ._ahli img,
      /* Avatar no header do chat */
      header [data-testid="conversation-panel-header"] img,
      header ._amia img,
      /* Avatares genéricos do WA */
      [data-testid="default-user"] svg,
      [data-testid="image-thumb"] img {
        filter: blur(8px) !important;
        transition: filter 0.3s ease !important;
      }
      [data-testid="cell-frame-primary"] img:hover,
      [data-testid="chat-list"] img[draggable="false"]:hover,
      ._ahlk img:hover, ._ahli img:hover,
      header [data-testid="conversation-panel-header"] img:hover,
      header ._amia img:hover,
      [data-testid="default-user"] svg:hover,
      [data-testid="image-thumb"] img:hover {
        filter: blur(0px) !important;
      }
    `);
  }
  
  // Borrar Mensagens (conteúdo do chat)
  if (cfg.privacy_blur_msgs === true || cfg.privacy_blur_msgs === 'true') {
    regras.push(`
      /* Conteúdo das mensagens */
      [data-testid="msg-container"] [data-testid="balloon-message-text"],
      [data-testid="msg-container"] ._ao3e,
      ._amjy ._ao3e,
      .message-in .selectable-text, .message-out .selectable-text,
      /* Mídia nas mensagens */
      [data-testid="msg-container"] [data-testid="media-url-cover"],
      [data-testid="msg-container"] img.selectable-text,
      [data-testid="msg-container"] video {
        filter: blur(6px) !important;
        transition: filter 0.3s ease !important;
      }
      [data-testid="msg-container"] [data-testid="balloon-message-text"]:hover,
      [data-testid="msg-container"] ._ao3e:hover,
      ._amjy ._ao3e:hover,
      .message-in .selectable-text:hover, .message-out .selectable-text:hover,
      [data-testid="msg-container"] [data-testid="media-url-cover"]:hover,
      [data-testid="msg-container"] img.selectable-text:hover,
      [data-testid="msg-container"] video:hover {
        filter: blur(0px) !important;
      }
    `);
  }
  
  if (regras.length > 0) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = regras.join('\n');
    document.head.appendChild(style);
    console.log('[Upsiden-IPC] Blur CSS injetado com', regras.length, 'regras ativas.');
  }
}

// Reagir a mudanças de blur em TEMPO REAL
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const blurKeys = ['privacy_blur_contacts', 'privacy_blur_avatars', 'privacy_blur_msgs'];
  const hasBlurChange = Object.keys(changes).some(k => blurKeys.includes(k));
  if (hasBlurChange) {
    chrome.storage.local.get(blurKeys, (res) => aplicarBlurCSS(res));
  }
});

// ── Receber mensagens dos iframes (Módulos UI) ───────────
/**
 * Escuta mensagens enviadas pelos iframes dos módulos (Áudios, CRM, Templates, etc.)
 * e pelo injetor de página. Roteia cada tipo de mensagem para a ação correta:
 * - upsiden_send_text: envia texto via WPP.
 * - upsiden_send_file: envia arquivo via WPP.
 * - upsiden_get_active_chat: obtém dados do chat ativo e os envia de volta ao iframe.
 * - upsiden_crm_updated: atualiza tag visual no contato na lista de chats.
 * - upsiden_reload_automation: recarrega configuração de automação.
 * - Eventos do injetor: engine_pronto, puxar_config, bulk_progresso, bulk_concluido.
 */
window.addEventListener('message', async (ev) => {
  if (!ev.data || !ev.data.type) {
    // Verificar mensagens do injetor (sem .type, com .origem)
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'engine_pronto_para_automacao') {
      sincronizarConfigAutomacao();
      sincronizarConfigPrivacidade();
    }
    if (ev.data?.origem === 'INJETOR_PAGINA_INIT' && ev.data.ev === 'puxar_config_auto_reply') {
      sincronizarConfigAutomacao();
      sincronizarConfigPrivacidade();
    }
    //   BULK: Progresso e conclusão — relay pro Painel via chrome.runtime  
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'bulk_progresso') {
      chrome.runtime.sendMessage({ tipo: 'bulk_progresso', dados: ev.data.dados });
    }
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'bulk_concluido') {
      chrome.runtime.sendMessage({ tipo: 'bulk_concluido', dados: ev.data.dados });
    }
    //   TELEMETRIA DE MÉTRICAS OMNICANAL  
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'upsiden_metric_bg') {
      chrome.runtime.sendMessage({ tipo: 'log_metric', evento: ev.data.evento, metadata: ev.data.metadata });
    }
    //   CSP BYPASS PROXY PARA DOWNLOAD DE MÍDIAS  
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'fetch_media_base64') {
       const reqId = ev.data.reqId;
       const url = ev.data.url;
       console.log(`${IPC_CTX} [MEDIA-RELAY] Recebido pedido do Engine. reqId: ${reqId}, URL: ${(url||'').substring(0, 60)}...`);
       
       chrome.runtime.sendMessage({ tipo: 'fetch_media_base64_bg', url: url }, (resposta) => {
          if (chrome.runtime.lastError) {
             console.error(`${IPC_CTX} [MEDIA-RELAY] chrome.runtime.lastError:`, chrome.runtime.lastError.message);
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, erro: 'Extensão desconectada: ' + chrome.runtime.lastError.message }, '*');
          } else if (resposta && !resposta.sucesso) {
             console.error(`${IPC_CTX} [MEDIA-RELAY] Background retornou erro:`, resposta.erro);
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, erro: resposta.erro }, '*');
          } else if (resposta && resposta.base64) {
             console.log(`${IPC_CTX} [MEDIA-RELAY] Sucesso! Retornando Base64 (${(resposta.base64.length/1024).toFixed(1)}KB) para o Engine.`);
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, base64: resposta.base64 }, '*');
          } else {
             console.error(`${IPC_CTX} [MEDIA-RELAY] Resposta vazia ou indefinida do Background.`);
             window.postMessage({ origem: 'CONTENT_SCRIPT', reqId: reqId, erro: 'Resposta vazia do Background Service Worker' }, '*');
          }
       });
       return;
    }
    //   AGENDAMENTO PARA CRON JOB (FLOW RUNNER)
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'schedule_bg_flow') {
       chrome.runtime.sendMessage({ tipo: 'schedule_flow_task', task: ev.data.task });
    }
    // ── AUTOMATED CRM LOGGING ──
    if (ev.data?.origem === 'INJETOR_PAGINA' && ev.data.ev === 'upsiden_interaction_log') {
       try {
          const { chatId, descricao } = ev.data.dados;
          if (!chatId) return;
          // Tenta puxar do cache local pra descobrir qual o Lead ID atrelado a esse contato
          chrome.storage.local.get(['ups_leads'], (res) => {
             const leads = res.ups_leads || [];
             const phoneOnly = chatId.split('@')[0];
             // Simple contains check instead of strict match (country codes might vary +55 vs 55)
             const lRef = leads.find(l => l.telefone && (l.telefone.includes(phoneOnly) || phoneOnly.includes(l.telefone)));
             
             if (lRef && lRef.id && window.UpsidenDB) {
                 window.UpsidenDB.from('historico_interacoes').insert({
                     lead_id: lRef.id,
                     tipo: 'envio',
                     descricao: descricao,
                     criado_por: 'engine_extensao'
                 }).execute().catch(e=>console.warn(IPC_CTX, 'Fail CRM Log:', e));
             }
          });
       } catch(e) {}
    }
    return;
  }

  if (ev.data.type === 'upsiden_send_text') {
    console.log(IPC_CTX, 'Enviando texto a partir do iframe', ev.data.data);
    await enviarParaPagina({ ...ev.data.data, tipoMensagem: 'texto' });
  }

  if (ev.data.type === 'upsiden_send_file') {
    console.log(IPC_CTX, 'Enviando arquivo a partir do iframe', ev.data.data);
    await enviarParaPagina({ ...ev.data.data, tipoMensagem: 'arquivo' });
  }

  if (ev.data.type === 'upsiden_get_active_chat') {
    const chatData = await enviarParaPagina({ tipoMensagem: 'get_active_chat' });
    if (chatData && chatData.sucesso) {
      document.querySelectorAll('#ups-panel-body iframe').forEach(ifr => {
        ifr.contentWindow.postMessage({
          type: 'init_chat_data',
          chatId: chatData.id,
          nome: chatData.nome || chatData.id.split('@')[0],
          telefone: chatData.id.split('@')[0]
        }, '*');
      });
    }
  }

  if (ev.data.type === 'upsiden_crm_updated') {
    console.log(IPC_CTX, 'CRM Atualizado, sincronizando UI...', ev.data.data);
    const contatoAtivo = document.querySelector('div[aria-selected="true"]');
    if (contatoAtivo) {
      const containerTitulo = contatoAtivo.querySelector('div[data-testid="cell-frame-title"]');
      if (containerTitulo) {
        // Locate the target wrapper
        let containerTags = containerTitulo.querySelector('.ups-tag-wrapper');
        if (!containerTags) {
          containerTags = document.createElement('div');
          containerTags.className = 'ups-tag-wrapper';
          containerTags.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px; margin-left:8px;';
          containerTitulo.appendChild(containerTags);
        }
        
        containerTags.innerHTML = ''; // Wipe existing
        
        const ledData = ev.data.data;
        const baseTags = Array.isArray(ledData.tag) ? ledData.tag : [ledData.tag];
        const tags = baseTags.filter(Boolean); // remove empty

        // Adiciona a tag de Funil Primeiro
        if (ledData.funil) {
             const fTag = document.createElement('span');
             fTag.className = 'ups-list-tag';
             fTag.textContent = String(ledData.funil).toUpperCase();
             fTag.style.cssText = 'font-size:9px; font-weight:bold; background:#2a3942; color:#00a884; padding:2px 6px; border-radius:4px; line-height:1.2;';
             containerTags.appendChild(fTag);
        }

        // Adiciona as multi-tags Customizadas
        chrome.storage.local.get(['ups_crm_tags'], (res) => {
             const dynamicTags = res.ups_crm_tags || {
                 quente:  { bg: '#FFB4B4', cor: '#8B1A1A', emoji: '🔥' },
                 morno:   { bg: '#FFE5B4', cor: '#8B6914', emoji: '☀️' },
                 frio:    { bg: '#B4D7FF', cor: '#1A4B8B', emoji: '❄️' },
                 vip:     { bg: '#E5B4FF', cor: '#5A1A8B', emoji: '⭐' },
                 urgente: { bg: '#FFB4D7', cor: '#8B1A4B', emoji: '🚨' }
             };
             
             tags.forEach(tgKey => {
                 if (dynamicTags[tgKey]) {
                    const cTag = document.createElement('span');
                    cTag.className = 'ups-custom-tag';
                    cTag.textContent = `${dynamicTags[tgKey].emoji} ${tgKey}`;
                    cTag.style.cssText = `font-size:9px; font-weight:bold; background:${dynamicTags[tgKey].bg}; color:${dynamicTags[tgKey].cor}; padding:2px 6px; border-radius:4px; line-height:1.2;`;
                    containerTags.appendChild(cTag);
                 }
             });
        });
      }
    }
  }

  if (ev.data.type === 'upsiden_reload_automation') {
    console.log(IPC_CTX, 'Recarregando regras de automação...');
    sincronizarConfigAutomacao();
  }
});
