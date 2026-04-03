/**
 * @file wpp-engine.js
 * @description MOTOR CENTRAL — Universal Dispatcher.
 * Versão: 3.0 — REESTRUTURADO
 * Roda dentro da página do WhatsApp Web com acesso direto à API WPP Connect.
 */

const CONTEXTO = '[Upsiden-Engine]';
console.log('%c' + CONTEXTO + ' v3.0 SCRIPT LOADED @ ' + new Date().toLocaleTimeString('pt-BR'), 'background: #222; color: #bada55; padding: 4px 8px; font-size: 13px;');

class InjetorWPP {
  static bulkActive = false;
  static bulkPausado = false;
  static bulkFila = [];
  static bulkStepsParams = [];
  static bulkDelayMin = 4;
  static bulkDelayMax = 10;
  static bulkEnviados = 0;
  static bulkFalhas = 0;
  static bulkCampanhaId = '';

  // ── INICIALIZAÇÃO ──
  static async inicializar() {
    console.log(`${CONTEXTO} 🚀 Inicializando Engine...`);
    let timeout = 0;
    while (!window.WPP && timeout < 60) {
      await new Promise(r => setTimeout(r, 500));
      timeout++;
    }

    if (!window.WPP) {
      console.error(`${CONTEXTO} ❌ window.WPP não detectado após 30s. Abortando.`);
      return;
    }

    try {
       const cached = window.localStorage.getItem('ups_privacy_state');
       if (cached) {
           window.upsidenPrivacyState = JSON.parse(cached);
       }
    } catch(e) {}

    while (!window.WPP.webpack || !window.WPP.webpack.isReady) {
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`%c${CONTEXTO} API WPP PRONTA (v3.0 Universal) ✅`, 'background: #25D366; color: white; padding: 4px 8px; font-weight: bold; font-size: 13px;');
    
    try {
      InjetorWPP.iniciarOuvintes();
      if (typeof instalarInterceptadoresPrivacidade === 'function') {
          instalarInterceptadoresPrivacidade();
      }
    } catch (e) {
      console.error(`${CONTEXTO} Erro fatal no boot dos ouvintes:`, e);
    }
  }

  // ── IPC SYNC (MEDIA BYPASS) ──
  static requestBase64FromIPC(url) {
    if (!url) return Promise.resolve('');
    return new Promise((resolve, reject) => {
      const reqId = 'ipc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const timer = setTimeout(() => {
         window.removeEventListener('message', h);
         reject(new Error('IPC Timeout (45s) solicitando: ' + url));
      }, 45000);
      const h = (ev) => {
        if (ev.data?.origem === 'CONTENT_SCRIPT' && ev.data.reqId === reqId) {
          window.removeEventListener('message', h);
          clearTimeout(timer);
          if (ev.data.erro) {
              reject(new Error(ev.data.erro));
          } else {
              resolve(ev.data.base64);
          }
        }
      };
      window.addEventListener('message', h);
      window.postMessage({ origem: 'INJETOR_PAGINA', ev: 'fetch_media_base64', reqId, url }, '*');
    });
  }

  // ── HELPERS ──
  static registrarLogGlobal(chatId, descricao) {
     window.postMessage({ origem: 'INJETOR_PAGINA', ev: 'upsiden_interaction_log', dados: { chatId, descricao } }, '*');
  }

  static randomDelay(min = 2, max = 5) {
    return (Math.random() * (max - min) + min) * 1000;
  }

  static normalizeChatId(id) {
    if (!id) return '';
    if (typeof id === 'string') return id;
    return id._serialized || String(id);
  }

  static base64ToBlob(base64, mime = 'application/octet-stream') {
    try {
      if (!base64 || typeof base64 !== 'string') return null;
      const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) { 
        return null; 
    }
  }

  static substituirVariaveis(texto, chatName) {
    const nome = chatName || 'Cliente';
    return String(texto || '')
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{data\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{hora\}\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  // ── SIMULAÇÃO ANTI-BAN ──
  static async simularDigitacao(chatId, duracao = 2000) {
    try {
      if (window.WPP?.chat?.markIsComposing) {
        await window.WPP.chat.markIsComposing(chatId);
        await new Promise(r => setTimeout(r, duracao));
        await window.WPP.chat.markIsPaused(chatId);
      }
    } catch (e) {}
  }

  static async simularGravacao(chatId, duracao = 3000) {
    try {
      if (window.WPP?.chat?.markIsRecording) {
        await window.WPP.chat.markIsRecording(chatId);
        await new Promise(r => setTimeout(r, duracao));
        await window.WPP.chat.markIsPaused(chatId);
      }
    } catch (e) {}
  }

  // ── OUVINTES DE MENSAGENS ──
  static iniciarOuvintes() {
    // Config polling (fallback — primário agora é storage.onChanged via IPC Bridge)
    setInterval(() => window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*'), 10000);
    window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');

    // Handler de mensagens recebidas
    const handleMsg = async (msg) => {
      try {
        if (msg.fromMe || msg.id?.fromMe || msg.isStatusV3) return;
        const timestamp = (msg.t || msg.timestamp) * 1000;
        if (Date.now() - timestamp > 600000) return;

        const chatId = InjetorWPP.normalizeChatId(msg.from || msg.id?.remote);
        let chatName = '';
        try {
          const chat = await window.WPP.chat.get(chatId);
          chatName = chat?.name || chat?.formattedTitle || '';
        } catch (e) {}

        if (window.AutomationController) {
          window.AutomationController.handleIncomingMessage(msg, chatName);
        } else {
          console.warn(`${CONTEXTO} AutomationController não disponível!`);
        }
      } catch(err) {
        console.error(`${CONTEXTO} Erro no handler de mensagem:`, err);
      }
    };

    // Registrar listener com fallback robusto
    let listenerRegistered = false;
    try {
      if (window.WPP?.on) {
        window.WPP.on('chat.msg_receive', handleMsg);
        window.WPP.on('chat.new_message', handleMsg); // Fallback secundário
        listenerRegistered = true;
        console.log(`%c${CONTEXTO} ✅ Listeners 'chat.msg_receive' / 'chat.new_message' REGISTRADOS`, 'color: #2ecc71; font-weight: bold;');
      }
    } catch(e) {
      console.error(`${CONTEXTO} Falha ao registrar listener primário:`, e);
    }

    if (!listenerRegistered) {
      console.error(`%c${CONTEXTO} ❌ NENHUM LISTENER REGISTRADO — Automação NÃO funcionará!`, 'color: #e74c3c; font-weight: bold; font-size: 14px;');
    }

    // Diagnóstico final
    console.log(`%c${CONTEXTO} 🔧 STATUS DO ENGINE:`, 'color: #f39c12; font-weight: bold;');
    console.log(`  • WPP Ready: ${!!window.WPP?.webpack?.isReady}`);
    console.log(`  • AutomationController: ${!!window.AutomationController}`);
    console.log(`  • Listener: ${listenerRegistered ? 'ATIVO ✅' : 'FALHOU ❌'}`);

    window.postMessage({ origem: 'INJETOR_PAGINA', ev: 'engine_pronto_para_automacao' }, '*');
  }

  // ── TAREFA 1: UNIVERSAL DISPATCHER (Elimina Silos de Disparo) ──
  static async sendUniversalMessage(payload, forcedChatId = null) {
    if (!window.WPP?.webpack?.isReady) return { sucesso: false, erro: 'WPP Offline' };
    
    try {
      const chatId = InjetorWPP.normalizeChatId(forcedChatId || payload.chatId || window.WPP.chat.getActiveChat()?.id);
      if (!chatId) return { sucesso: false, erro: 'Destinatário não localizado' };

      const textResolved = InjetorWPP.substituirVariaveis(payload.texto || payload.conteudo || '', payload.chatName || '');
      const mediaUrl = payload.url || (String(payload.conteudo || '').startsWith('http') ? payload.conteudo : null);
      const isAudio = payload.tipo === 'audio' || payload.type === 'audio';

      // ── TAREFA 3: LOG DE AUDITORIA DE SAÍDA ──
      console.log(`%c${CONTEXTO} 📤 [Universal-Dispatcher] Enviando para ${chatId}`, "color: #e67e22; font-weight: bold;");
      console.dir({
          destinatario: chatId,
          tipo_origem: payload.tipo,
          tem_midia: !!(mediaUrl || payload.base64),
          texto_final: textResolved,
          caption_aplicada: (mediaUrl || payload.base64) && !isAudio ? textResolved : 'N/A'
      });

      // CASO A: ÁUDIO (Tarefa 2: PTT Garantido)
      if (isAudio) {
         await InjetorWPP.simularGravacao(chatId, payload.duracaoSimulacao || 3000);
         let b64 = payload.base64 || '';
         if (!b64 && mediaUrl) b64 = await InjetorWPP.requestBase64FromIPC(mediaUrl);
         
         if (!b64) throw new Error('Falha ao obter binário do áudio');
         
         const mime = payload.mime || 'audio/ogg';
         if (!b64.startsWith('data:')) {
             b64 = `data:${mime};base64,${b64}`;
         }
         
         const resAudio = await window.WPP.chat.sendFileMessage(chatId, b64, { 
             type: 'audio', 
             isPtt: payload.sendAs !== 'audio_play',
             filename: payload.nome || 'audio.ogg'
         });

         if (textResolved.trim()) {
            await new Promise(r => setTimeout(r, 1000));
            await window.WPP.chat.sendTextMessage(chatId, textResolved);
         }

         return { sucesso: true, id: resAudio.id };
      }

      // CASO B: MÍDIA COM LEGENDA (Tarefa 1: Unificação)
      if (mediaUrl || payload.base64) {
         if (payload.simular !== false) await InjetorWPP.simularDigitacao(chatId, 1500);
         
         let b64 = payload.base64 || '';
         if (!b64 && mediaUrl) b64 = await InjetorWPP.requestBase64FromIPC(mediaUrl);
         
         if (!b64) throw new Error('Falha ao obter binário da mídia');

         let mime = payload.mime || 'application/octet-stream';
         if (b64.startsWith('data:')) {
             const match = b64.match(/^data:([^;]+);base64,/);
             if (match) mime = match[1];
         } else {
             b64 = `data:${mime};base64,${b64}`;
         }

         let waType = 'document';
         if (mime.includes('image')) waType = 'image';
         else if (mime.includes('video')) waType = 'video';

         const options = { 
             type: waType, 
             filename: payload.nome || 'file',
             caption: textResolved.trim() || undefined // AQUI: Texto vira Legenda no mesmo balão
         };

         const resMedia = await window.WPP.chat.sendFileMessage(chatId, b64, options);
         return { sucesso: true, id: resMedia.id };
      }

      // CASO C: TEXTO PURO
      if (payload.simularDigitacao !== false) await InjetorWPP.simularDigitacao(chatId, payload.duracaoSimulacao || 1500);
      const resText = await window.WPP.chat.sendTextMessage(chatId, textResolved);
      return { sucesso: true, id: resText.id };

    } catch (e) {
      console.error(`${CONTEXTO} ❌ Erro Universal Dispatcher:`, e);
      return { sucesso: false, erro: String(e) };
    }
  }

  // Compatibilidade com chamadas antigas via redirecionamento unificado
  static async enviarTexto(d, c) { return this.sendUniversalMessage(d, c); }
  static async enviarAudio(d, c) { d.type = 'audio'; return this.sendUniversalMessage(d, c); }
  static async enviarArquivo(d, c) { return this.sendUniversalMessage(d, c); }

  // ── DISPARO EM MASSA ──
  static iniciarBulkSend(dados) {
    if (this.bulkActive) return;
    this.bulkActive = true;
    this.bulkPausado = false;
    this.bulkFila = [...dados.contatos];
    this.bulkStepsParams = dados.stepsParams || dados.steps || [];
    this.bulkDelayMin = dados.min || 4;
    this.bulkDelayMax = dados.max || 10;
    this.bulkEnviados = 0;
    this.bulkFalhas = 0;
    this.bulkCampanhaId = dados.campanha_id || dados.campanhaId;
    this.processarFilaBulk();
  }

  static async processarFilaBulk() {
    if (!this.bulkActive || this.bulkPausado) return;
    if (this.bulkFila.length === 0) {
      this.bulkActive = false;
      this.reportarBulkProgress('concluido');
      return;
    }
    const c = this.bulkFila.shift();
    const id = c.telefone.includes('@') ? c.telefone : `${c.telefone}@c.us`;
    try {
      if (window.AutomationController) await window.AutomationController.executeSequentialFollowup(id, this.bulkStepsParams, c.nome || '');
      this.bulkEnviados++;
    } catch(e) { this.bulkFalhas++; }
    this.reportarBulkProgress('andamento');
    if (this.bulkFila.length > 0 && this.bulkActive && !this.bulkPausado) {
       setTimeout(() => this.processarFilaBulk(), InjetorWPP.randomDelay(this.bulkDelayMin, this.bulkDelayMax));
    } else if (this.bulkFila.length === 0) {
       this.bulkActive = false;
       this.reportarBulkProgress('concluido');
    }
  }

  static reportarBulkProgress(status) {
    window.postMessage({ origem: 'INJETOR_PAGINA', ev: status === 'concluido' ? 'bulk_concluido' : 'bulk_progresso', 
      dados: { id: this.bulkCampanhaId, enviados: this.bulkEnviados, falhas: this.bulkFalhas, status } }, '*');
  }

  static getActiveChatData() {
    try {
      const active = window.WPP.chat.getActiveChat();
      return active ? { sucesso: true, id: active.id._serialized, nome: active.name || '' } : { sucesso: false, erro: 'Nenhum chat aberto' };
    } catch(e) { return { sucesso: false, erro: String(e) }; }
  }

  static aplicarRegraPrivacidade(chave, valor) {
      if (!window.upsidenPrivacyState) window.upsidenPrivacyState = {};
      window.upsidenPrivacyState[chave] = valor;
      if (chave.includes('blur_contacts')) document.body.classList.toggle('ups-blur-contacts', valor);
      if (chave.includes('blur_avatars')) document.body.classList.toggle('ups-blur-avatars', valor);
      if (chave.includes('blur_msgs')) document.body.classList.toggle('ups-blur-msgs', valor);
  }
}

// ── ROTEADOR DE MENSAGENS IPC ──
window.addEventListener('message', async (ev) => {
  if (ev.data?.origem !== 'CONTENT_SCRIPT') return;
  const tipoMensagem = ev.data.tipoMensagem || ev.data.dados?.tipoMensagem || ev.data.tipo;
  const dados = ev.data.dados || ev.data;
  const msgId = ev.data.msgId;

  if (!tipoMensagem) return;
  let res = { sucesso: false, erro: 'Comando inválido' };

  try {
      if (tipoMensagem === 'set_config_auto_reply') {
         if (window.AutomationController) window.AutomationController.syncConfig({ saudacao: dados.dados || dados });
         res = { sucesso: true };
      } else if (tipoMensagem === 'set_config_triggers') {
         if (window.AutomationController) window.AutomationController.syncConfig({ triggers: dados.dados || dados });
         res = { sucesso: true };
      } else if (tipoMensagem === 'set_config_flows') {
         if (window.AutomationController) window.AutomationController.syncConfig({ flows: dados.dados || dados });
         res = { sucesso: true };
      } else if (['texto', 'audio', 'arquivo', 'midia', 'imagem', 'video', 'documento'].includes(tipoMensagem)) {
         dados.type = tipoMensagem;
         res = await InjetorWPP.sendUniversalMessage(dados);
      } else if (tipoMensagem === 'bulk_send_start') {
         InjetorWPP.iniciarBulkSend(dados);
         res = { sucesso: true };
      } else if (tipoMensagem === 'get_active_chat') {
         res = InjetorWPP.getActiveChatData();
      } else if (tipoMensagem === 'agendamento') {
         res = await InjetorWPP.sendUniversalMessage(dados.dados || dados);
      } else if (tipoMensagem === 'set_config_privacidade_single') {
         InjetorWPP.aplicarRegraPrivacidade(ev.data.chave || dados.chave, ev.data.valor || dados.valor);
         res = { sucesso: true };
      }
  } catch(e) { res = { sucesso: false, erro: String(e) }; }

  window.postMessage({ origem: 'INJETOR_PAGINA', msgId, resposta: res }, '*');
});

window.InjetorWPP = InjetorWPP;

// ── PRIVACY ENGINE (MONKEY PATCHING) ──
function instalarInterceptadoresPrivacidade() {
  const p = (obj, prop, key) => {
    if (!obj || !obj[prop]) return;
    const orig = obj[prop].bind(obj);
    obj[prop] = function() {
      if (window.upsidenPrivacyState?.[key]) return Promise.resolve(true);
      return orig.apply(this, arguments);
    };
  };
  try {
     p(window.WPP?.conn, 'markAvailable', 'privacy_hide_online');
     p(window.WPP?.chat, 'markIsRead', 'privacy_hide_read');
     p(window.WPP?.chat, 'markIsComposing', 'privacy_hide_typing');
     p(window.WPP?.chat, 'markIsRecording', 'privacy_hide_typing');
  } catch(e) {}
}

InjetorWPP.inicializar();
