/* ==============================================================
   Upsiden — Injetor de Página via WPP Connect (wa-js)
   Modo Instantâneo sem Simulação de Interface.
   ============================================================== */

const CONTEXTO = '[Upsiden-Injetor]';

class InjetorWPP {
  static configSaudacao = null;
  static configTriggers = [];

  static async inicializar() {
    console.log(`${CONTEXTO} Aguardando injeção do objeto window.WPP...`);
    let tentativas = 0;
    while (!window.WPP && tentativas < 60) {
      await new Promise(r => setTimeout(r, 500));
      tentativas++;
    }

    if (!window.WPP) {
      console.error(`${CONTEXTO} window.WPP não carregou no tempo limite.`);
      return;
    }

    console.log(`${CONTEXTO} WPP Detectado. Aguardando prontidão do Webpack...`);
    tentativas = 0;
    while (!window.WPP.webpack || !window.WPP.webpack.isReady) {
      if (tentativas > 60) break; // Desiste após 30 segundos
      await new Promise(r => setTimeout(r, 500));
      tentativas++;
    }

    console.log(`${CONTEXTO} WPP Inicializado com Sucesso ✅`);
    
    // Iniciar listeners de automação indepedente de pequenos erros
    try {
      InjetorWPP.iniciarOuvintes();
    } catch (e) {
      console.error(`${CONTEXTO} Erro crítico ao iniciar ouvintes:`, e);
    }
  }

  static iniciarOuvintes() {
    console.log(`${CONTEXTO} Iniciando ouvintes de automação WPP...`);
    
    // Polling a cada 5 segundos para garantir que o script sempre tenha a config mais atual, mesmo que as abas durmam.
    setInterval(() => {
      window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');
    }, 5000);

    // Tentativa inicial forçada
    window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');

    window.WPP.on('chat.msg_receive', async (msg) => {
      console.log(`${CONTEXTO} [EVENTO chat.msg_receive] ID:`, msg.id._serialized, 'fromMe:', msg.id.fromMe, 'isGroup:', msg.isGroupMsg);
      
      // Ignorar mensagens de grupos, broadcast, status ou mandadas por nós mesmos
      if (msg.isGroupMsg || msg.id.fromMe || msg.isStatusV3 || msg.id.id.startsWith('status@')) return;

      // Evitar responder a mensagens velhas que acabaram de sincronizar
      // Se a mensagem for mais velha que 5 minutos, ignorar.
      const tempoMsg = msg.t * 1000; 
      if (Date.now() - tempoMsg > 300000) {
        console.log(`${CONTEXTO} Mensagem ignorada: Muito antiga.`);
        return;
      }

      // ---- LÓGICA DE GATILHOS (TRIGGERS) ----
      const gatilhos = InjetorWPP.configTriggers || [];
      console.log(`${CONTEXTO} Gatilhos na memória:`, gatilhos.length, gatilhos);
      
      let gatilhoDisparado = null;
      let textoPuro = msg.body || msg.text || msg.content || '';

      console.log(`${CONTEXTO} MSG EXTRAÍDA (textoPuro): "${textoPuro}"`);

      if (gatilhos.length > 0 && typeof textoPuro === 'string' && textoPuro.trim().length > 0) {
        const textoRecebido = textoPuro.trim().toLowerCase();
        
        for (const trig of gatilhos) {
          if (!trig.palavra) continue;
          const palavra = trig.palavra.trim().toLowerCase();
          
          if (trig.condicao === 'exata' && textoRecebido === palavra) {
            gatilhoDisparado = trig;
            break;
          } else if (trig.condicao === 'contem' && textoRecebido.includes(palavra)) {
            gatilhoDisparado = trig;
            break;
          }
        }
      }

      if (gatilhoDisparado) {
        try {
          console.log(`${CONTEXTO} Gatilho disparado: "${gatilhoDisparado.palavra}". Preparando resposta...`);
          await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
          
          let textoResp = gatilhoDisparado.resposta;
          const chat = await window.WPP.chat.get(msg.chatId);
          if (chat && chat.name) {
            textoResp = textoResp.replace(/\{\{nome\}\}/gi, chat.name);
          } else {
            textoResp = textoResp.replace(/\{\{nome\}\}/gi, 'Cliente');
          }

          console.log(`${CONTEXTO} Enviando Resposta de Gatilho: "${textoResp}"`);
          const blockSend = await window.WPP.chat.sendTextMessage(msg.chatId, textoResp);
          console.log(`${CONTEXTO} Resposta de gatilho enviada com sucesso! ID:`, blockSend.id);
          
          // Impede enviar a saudação inicial se um gatilho acabou de disparar
          return; 
        } catch (e) {
          console.error(`${CONTEXTO} Erro fatal ao disparar gatilho:`, e);
        }
      }
      // ---- FIM LÓGICA DE GATILHOS ----

      const conf = InjetorWPP.configSaudacao;
      console.log(`${CONTEXTO} Config Saudação Atual:`, conf);
      
      if (!conf || !conf.ativo || !conf.mensagem) {
        console.log(`${CONTEXTO} Saudação ignorada: Desativada ou sem msg.`);
        return;
      }



      let deveResponder = true;
      if (conf.usarHorario) {
        const agora = new Date();
        const minAtual = (agora.getHours() * 60) + agora.getMinutes();
        
        const [hin, minIn] = conf.horaInicio.split(':').map(Number);
        const startMin = (hin * 60) + minIn;
        
        const [hfi, minFi] = conf.horaFim.split(':').map(Number);
        const endMin = (hfi * 60) + minFi;

        if (minAtual >= startMin && minAtual <= endMin) {
          deveResponder = false;
          console.log(`${CONTEXTO} Saudação ignorada: Dentro do horário comercial.`);
        }
      }

      if (deveResponder) {
        try {
          console.log(`${CONTEXTO} Preparando envio automático para ${msg.chatId}...`);
          // Delay de 2 a 4 segundos
          await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));
          
          let textoFinal = conf.mensagem;
          const chat = await window.WPP.chat.get(msg.chatId);
          if (chat && chat.name) {
            textoFinal = textoFinal.replace(/\{\{nome\}\}/gi, chat.name);
          } else {
            textoFinal = textoFinal.replace(/\{\{nome\}\}/gi, 'Cliente');
          }

          console.log(`${CONTEXTO} Enviando Saudação Automática: "${textoFinal}"`);
          const blockSend = await window.WPP.chat.sendTextMessage(msg.chatId, textoFinal);
          console.log(`${CONTEXTO} Resposta enviada com sucesso! ID:`, blockSend.id);
        } catch (e) {
          console.error(`${CONTEXTO} Erro fatal ao auto-responder:`, e);
        }
      }
    });

    // Avisa ao ContentScript
    window.postMessage({ origem: 'INJETOR_PAGINA', ev: 'engine_pronto_para_automacao' }, '*');
  }

  static base64ToBlob(base64, mime) {
    const binStr = atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: mime });
  }

  static async enviarAudio(dados) {
    if (!window.WPP || !window.WPP.webpack.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatAtivo = window.WPP.chat.getActiveChat();
      if (!chatAtivo) return { sucesso: false, erro: 'Abra um chat primeiro!' };
      const blob = InjetorWPP.base64ToBlob(dados.base64.split(',')[1] || dados.base64, dados.tipoMime);
      const file = new File([blob], `voz_Upsiden_${Date.now()}.ogg`, { type: 'audio/ogg; codecs=opus' });
      const fakeWaveform = new Uint8Array(64).map(() => Math.floor(Math.random() * 50) + 10);
      const res = await window.WPP.chat.sendFileMessage(chatAtivo.id, file, { type: 'audio', isPtt: true, waveform: Array.from(fakeWaveform) });
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  static async enviarArquivo(dados) {
    // dados = { nome, tipo, base64 }
    if (!window.WPP || !window.WPP.webpack.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatAtivo = window.WPP.chat.getActiveChat();
      if (!chatAtivo) return { sucesso: false, erro: 'Abra um chat primeiro!' };
      const b64Data = dados.base64.split(',')[1] || dados.base64;
      const blob = InjetorWPP.base64ToBlob(b64Data, dados.tipo);
      const file = new File([blob], dados.nome, { type: dados.tipo });
      const res = await window.WPP.chat.sendFileMessage(chatAtivo.id, file, { type: 'auto' });
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  static async enviarTexto(dados) {
    // dados = { texto }
    if (!window.WPP || !window.WPP.webpack.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatAtivo = window.WPP.chat.getActiveChat();
      if (!chatAtivo) return { sucesso: false, erro: 'Abra um chat primeiro!' };
      // O WPPConnect suporta enviar texto direto com notifyName para mentions etc, o básico serve
      const res = await window.WPP.chat.sendTextMessage(chatAtivo.id, dados.texto);
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }
  static getActiveChatData() {
    if (!window.WPP || !window.WPP.webpack.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatAtivo = window.WPP.chat.getActiveChat();
      if (!chatAtivo) return { sucesso: false, erro: 'Nenhum chat ativo.' };
      return { sucesso: true, id: chatAtivo.id._serialized, nome: chatAtivo.name || '' };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }
}

// Escutar as ordens do ContentScript
window.addEventListener('message', async (evento) => {
  if (evento.data?.origem === 'CONTENT_SCRIPT') {
    let resposta = { sucesso: false, erro: 'Tipo de mensagem desconhecido.' };
    
    if (evento.data.tipoMensagem === 'get_active_chat') {
      resposta = InjetorWPP.getActiveChatData();
    } else if (evento.data.tipoMensagem === 'set_config_auto_reply') {
      InjetorWPP.configSaudacao = evento.data.dados;
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'set_config_triggers') {
      InjetorWPP.configTriggers = evento.data.dados;
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'texto') {
      resposta = await InjetorWPP.enviarTexto(evento.data);
    } else if (evento.data.tipoMensagem === 'arquivo') {
      resposta = await InjetorWPP.enviarArquivo(evento.data);
    } else {
      resposta = await InjetorWPP.enviarAudio(evento.data);
    }

    window.postMessage({
      origem: 'INJETOR_PAGINA',
      msgId: evento.data.msgId,
      resposta: resposta
    }, '*');
  }
});

InjetorWPP.inicializar();
console.log(`${CONTEXTO} Upsiden Engine Pronto!`);

