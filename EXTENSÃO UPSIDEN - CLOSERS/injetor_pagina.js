/* ==============================================================
   Upsiden — Injetor de Página via WPP Connect (wa-js)
   Engine de Automação v2 — Simulação + Delay + Follow-up + Bulk
   ============================================================== */

const CONTEXTO = '[Upsiden-Engine]';

class InjetorWPP {
  static configSaudacao = null;
  static configTriggers = [];
  static configFollowups = [];
  static chatsSaudados = new Set(); // cache de chatIds já saudados hoje
  static ultimaLimpeza = Date.now();
  static bulkEmAndamento = false;
  static bulkPausado = false;

  // ── INICIALIZAÇÃO ──────────────────────────────────────
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
      if (tentativas > 60) break;
      await new Promise(r => setTimeout(r, 500));
      tentativas++;
    }

    console.log(`${CONTEXTO} WPP Inicializado com Sucesso ✅`);
    
    try {
      InjetorWPP.iniciarOuvintes();
    } catch (e) {
      console.error(`${CONTEXTO} Erro crítico ao iniciar ouvintes:`, e);
    }
  }

  // ── HELPERS ─────────────────────────────────────────────
  static randomDelay(min = 2, max = 5) {
    return (Math.random() * (max - min) + min) * 1000;
  }

  static async simularDigitacao(chatId, duracao = 2000) {
    try {
      if (window.WPP.chat.markIsComposing) {
        await window.WPP.chat.markIsComposing(chatId);
        await new Promise(r => setTimeout(r, duracao));
      }
    } catch (e) {
      console.warn(`${CONTEXTO} Falha ao simular digitação:`, e.message);
    }
  }

  static async simularGravacao(chatId, duracao = 3000) {
    try {
      if (window.WPP.chat.markIsRecording) {
        await window.WPP.chat.markIsRecording(chatId);
        await new Promise(r => setTimeout(r, duracao));
      }
    } catch (e) {
      console.warn(`${CONTEXTO} Falha ao simular gravação:`, e.message);
    }
  }

  static substituirVariaveis(texto, chatName) {
    const nome = chatName || 'Cliente';
    return texto
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{data\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{hora\}\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  static verificarHorarioFuncionamento(conf) {
    if (!conf || !conf.usarHorario) return { dentroHorario: true, deveResponder: true };

    const agora = new Date();
    const minAtual = (agora.getHours() * 60) + agora.getMinutes();
    const diaSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][agora.getDay()];

    // Verificar dia da semana
    const diasAtivos = conf.diasSemana || ['seg', 'ter', 'qua', 'qui', 'sex'];
    if (!diasAtivos.includes(diaSemana)) {
      return { dentroHorario: false, deveResponder: true };
    }

    const [hin, minIn] = (conf.horaInicio || '09:00').split(':').map(Number);
    const startMin = (hin * 60) + minIn;
    
    const [hfi, minFi] = (conf.horaFim || '18:00').split(':').map(Number);
    const endMin = (hfi * 60) + minFi;

    const dentroHorario = minAtual >= startMin && minAtual <= endMin;
    return { dentroHorario, deveResponder: !dentroHorario };
  }

  static limparCacheDiario() {
    const agora = Date.now();
    // Limpar cache a cada 12h
    if (agora - InjetorWPP.ultimaLimpeza > 43200000) {
      InjetorWPP.chatsSaudados.clear();
      InjetorWPP.ultimaLimpeza = agora;
      console.log(`${CONTEXTO} Cache de saudações limpo.`);
    }
  }

  // ── OUVINTES DE AUTOMAÇÃO ──────────────────────────────
  static iniciarOuvintes() {
    console.log(`${CONTEXTO} Iniciando ouvintes de automação WPP v2...`);
    
    // Polling a cada 5s para config atualizada
    setInterval(() => {
      window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');
    }, 5000);

    // Tentativa inicial
    window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');

    // Limpar cache diariamente
    setInterval(() => InjetorWPP.limparCacheDiario(), 60000);

    // ── LISTENER PRINCIPAL DE MENSAGENS ──
    window.WPP.on('chat.msg_receive', async (msg) => {
      console.log(`${CONTEXTO} [MSG] ID:`, msg.id._serialized, 'fromMe:', msg.id.fromMe, 'isGroup:', msg.isGroupMsg);
      
      // Ignorar: mensagens nossas, status, broadcast
      if (msg.id.fromMe || msg.isStatusV3 || msg.id.id.startsWith('status@')) return;

      // Ignorar mensagens antigas (> 5 min)
      const tempoMsg = msg.t * 1000;
      if (Date.now() - tempoMsg > 300000) {
        console.log(`${CONTEXTO} Mensagem ignorada: Muito antiga.`);
        return;
      }

      const isGroup = msg.isGroupMsg;
      const chatId = msg.chatId;
      let textoPuro = msg.body || msg.text || msg.content || '';
      let chatName = '';

      try {
        const chat = await window.WPP.chat.get(chatId);
        chatName = chat?.name || '';
      } catch (e) { }

      // ── GATILHOS (TRIGGERS) ──
      const gatilhos = InjetorWPP.configTriggers || [];
      
      if (gatilhos.length > 0 && typeof textoPuro === 'string' && textoPuro.trim().length > 0) {
        const textoRecebido = textoPuro.trim().toLowerCase();
        
        for (const trig of gatilhos) {
          if (!trig.palavra) continue;

          // Filtro contato/grupo (#8)
          if (trig.apenas_privado && isGroup) continue;
          if (trig.apenas_grupo && !isGroup) continue;

          const palavra = trig.palavra.trim().toLowerCase();
          let match = false;

          if (trig.condicao === 'exata' && textoRecebido === palavra) match = true;
          else if (trig.condicao === 'contem' && textoRecebido.includes(palavra)) match = true;

          if (match) {
            try {
              console.log(`${CONTEXTO} Gatilho disparado: "${trig.palavra}"`);
              
              // Delay configurável (#5)
              const delayMin = trig.delay_min || 1;
              const delayMax = trig.delay_max || 3;
              const delay = InjetorWPP.randomDelay(delayMin, delayMax);

              // Simulação de digitação (#3)
              if (trig.simular_digitacao !== false) {
                await InjetorWPP.simularDigitacao(chatId, Math.min(delay, 3000));
              }

              await new Promise(r => setTimeout(r, delay));

              let textoResp = InjetorWPP.substituirVariaveis(trig.resposta, chatName);

              console.log(`${CONTEXTO} Enviando resposta gatilho: "${textoResp}"`);
              await window.WPP.chat.sendTextMessage(chatId, textoResp);
              console.log(`${CONTEXTO} Resposta gatilho enviada ✅`);
              
              return; // Impede saudação se gatilho disparou
            } catch (e) {
              console.error(`${CONTEXTO} Erro ao disparar gatilho:`, e);
            }
          }
        }
      }

      // ── SAUDAÇÃO AUTOMÁTICA ──
      const conf = InjetorWPP.configSaudacao;
      if (!conf || !conf.ativo || !conf.mensagem) return;

      // Filtro contato/grupo (#8)
      if (conf.apenasPrivado && isGroup) return;
      if (conf.apenasGrupo && !isGroup) return;

      // Evitar saudar o mesmo contato mais de uma vez por dia
      if (InjetorWPP.chatsSaudados.has(chatId._serialized || chatId)) {
        console.log(`${CONTEXTO} Saudação ignorada: já saudado hoje.`);
        return;
      }

      // Verificar horário de funcionamento (#7)
      const { dentroHorario, deveResponder } = InjetorWPP.verificarHorarioFuncionamento(conf);
      
      if (!deveResponder) {
        console.log(`${CONTEXTO} Saudação ignorada: Dentro do horário comercial.`);
        return;
      }

      // Se fora do horário e tem msg específica, enviar ela
      if (!dentroHorario && conf.msgForaHorario && conf.msgForaHorario.trim()) {
        try {
          const delayMin = conf.delayMin || 2;
          const delayMax = conf.delayMax || 5;
          const delay = InjetorWPP.randomDelay(delayMin, delayMax);

          if (conf.simularDigitacao !== false) {
            await InjetorWPP.simularDigitacao(chatId, Math.min(delay, 3000));
          }
          await new Promise(r => setTimeout(r, delay));

          const textoFora = InjetorWPP.substituirVariaveis(conf.msgForaHorario, chatName);
          await window.WPP.chat.sendTextMessage(chatId, textoFora);
          InjetorWPP.chatsSaudados.add(chatId._serialized || chatId);
          console.log(`${CONTEXTO} Mensagem "fora do horário" enviada ✅`);
        } catch (e) {
          console.error(`${CONTEXTO} Erro msg fora horário:`, e);
        }
        return;
      }

      // Enviar saudação normal
      try {
        const delayMin = conf.delayMin || 2;
        const delayMax = conf.delayMax || 5;
        const delay = InjetorWPP.randomDelay(delayMin, delayMax);

        // Simulação de digitação (#3)
        if (conf.simularDigitacao !== false) {
          await InjetorWPP.simularDigitacao(chatId, Math.min(delay, 3000));
        }

        await new Promise(r => setTimeout(r, delay));

        let textoFinal = InjetorWPP.substituirVariaveis(conf.mensagem, chatName);

        console.log(`${CONTEXTO} Enviando saudação: "${textoFinal}"`);
        await window.WPP.chat.sendTextMessage(chatId, textoFinal);
        InjetorWPP.chatsSaudados.add(chatId._serialized || chatId);
        console.log(`${CONTEXTO} Saudação enviada ✅`);

        // ── FOLLOW-UP SEQUENCIAL (#6) ──
        if (conf.followupSteps && conf.followupSteps.length > 0) {
          console.log(`${CONTEXTO} Iniciando follow-up com ${conf.followupSteps.length} passos...`);
          await InjetorWPP.executarSequencia(chatId, conf.followupSteps, chatName);
        }
      } catch (e) {
        console.error(`${CONTEXTO} Erro saudação:`, e);
      }
    });

    window.postMessage({ origem: 'INJETOR_PAGINA', ev: 'engine_pronto_para_automacao' }, '*');
  }

  // ── FOLLOW-UP SEQUENCIAL (#6) ──────────────────────────
  static async executarSequencia(chatId, steps, chatName) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const delay = (step.delay_segundos || 3) * 1000;

      console.log(`${CONTEXTO} Follow-up passo ${i + 1}/${steps.length}: tipo=${step.tipo}, delay=${delay}ms`);
      await new Promise(r => setTimeout(r, delay));

      try {
        if (step.tipo === 'texto') {
          if (step.simular_digitacao !== false) {
            await InjetorWPP.simularDigitacao(chatId, Math.min(delay, 2000));
          }
          const texto = InjetorWPP.substituirVariaveis(step.conteudo || '', chatName);
          await window.WPP.chat.sendTextMessage(chatId, texto);
        } else if (step.tipo === 'audio' && step.base64) {
          if (step.simular_gravacao !== false) {
            await InjetorWPP.simularGravacao(chatId, Math.min(delay, 3000));
          }
          const blob = InjetorWPP.base64ToBlob(step.base64.split(',')[1] || step.base64, 'audio/ogg');
          const file = new File([blob], `follow_${Date.now()}.ogg`, { type: 'audio/ogg; codecs=opus' });
          const waveform = new Uint8Array(64).map(() => Math.floor(Math.random() * 50) + 10);
          await window.WPP.chat.sendFileMessage(chatId, file, { type: 'audio', isPtt: true, waveform: Array.from(waveform) });
        } else if ((step.tipo === 'documento' || step.tipo === 'midia') && step.base64) {
          const blob = InjetorWPP.base64ToBlob(step.base64.split(',')[1] || step.base64, step.mime || 'application/octet-stream');
          const file = new File([blob], step.nome || `file_${Date.now()}`, { type: step.mime || 'application/octet-stream' });
          await window.WPP.chat.sendFileMessage(chatId, file, { type: 'auto' });
        }
        console.log(`${CONTEXTO} Follow-up passo ${i + 1} enviado ✅`);
      } catch (e) {
        console.error(`${CONTEXTO} Erro follow-up passo ${i + 1}:`, e);
      }
    }
    console.log(`${CONTEXTO} Sequência follow-up completa ✅`);
  }

  // ── ENVIO EM MASSA (BULK) (#9-#14) ─────────────────────
  static async iniciarBulkSend(dados) {
    if (InjetorWPP.bulkEmAndamento) {
      return { sucesso: false, erro: 'Já existe um envio em massa em andamento.' };
    }

    InjetorWPP.bulkEmAndamento = true;
    InjetorWPP.bulkPausado = false;

    const { contatos, tipo, conteudo, recurso, delayMin, delayMax, campanhaId } = dados;
    const total = contatos.length;
    let enviados = 0;
    let falhas = 0;
    const log = [];

    console.log(`${CONTEXTO} [BULK] Iniciando envio para ${total} contatos. Tipo: ${tipo}`);

    for (let i = 0; i < contatos.length; i++) {
      // Verificar pausa/cancelamento
      if (!InjetorWPP.bulkEmAndamento) {
        console.log(`${CONTEXTO} [BULK] Envio cancelado.`);
        break;
      }

      while (InjetorWPP.bulkPausado) {
        await new Promise(r => setTimeout(r, 500));
        if (!InjetorWPP.bulkEmAndamento) break;
      }

      const contato = contatos[i];
      const telefone = contato.telefone.replace(/\D/g, '');
      const chatId = `${telefone}@c.us`;

      try {
        // Delay anti-ban (#13)
        if (i > 0) {
          const delay = InjetorWPP.randomDelay(delayMin || 3, delayMax || 8);
          console.log(`${CONTEXTO} [BULK] Aguardando ${Math.round(delay / 1000)}s (anti-ban)...`);
          await new Promise(r => setTimeout(r, delay));
        }

        // Simular digitação
        await InjetorWPP.simularDigitacao(chatId, 2000);

        // Substituir variáveis personalizadas
        let textoFinal = conteudo || '';
        textoFinal = textoFinal
          .replace(/\{nome\}/gi, contato.nome || '')
          .replace(/\{\{nome\}\}/gi, contato.nome || '')
          .replace(/\{telefone\}/gi, contato.telefone || '')
          .replace(/\{\{telefone\}\}/gi, contato.telefone || '');

        // Enviar conforme tipo
        if (tipo === 'texto') {
          await window.WPP.chat.sendTextMessage(chatId, textoFinal);
        } else if (tipo === 'audio' && recurso?.base64) {
          await InjetorWPP.simularGravacao(chatId, 3000);
          const blob = InjetorWPP.base64ToBlob(recurso.base64.split(',')[1] || recurso.base64, 'audio/ogg');
          const file = new File([blob], `bulk_${Date.now()}.ogg`, { type: 'audio/ogg; codecs=opus' });
          const waveform = new Uint8Array(64).map(() => Math.floor(Math.random() * 50) + 10);
          await window.WPP.chat.sendFileMessage(chatId, file, { type: 'audio', isPtt: true, waveform: Array.from(waveform) });
        } else if ((tipo === 'documento' || tipo === 'midia') && recurso?.base64) {
          const blob = InjetorWPP.base64ToBlob(recurso.base64.split(',')[1] || recurso.base64, recurso.mime || 'application/octet-stream');
          const file = new File([blob], recurso.nome || `bulk_file_${Date.now()}`, { type: recurso.mime || 'application/octet-stream' });
          await window.WPP.chat.sendFileMessage(chatId, file, { type: 'auto' });
        }

        enviados++;
        log.push({ nome: contato.nome, telefone: contato.telefone, status: 'enviado', erro: null });
        console.log(`${CONTEXTO} [BULK] ✅ ${enviados}/${total} — ${contato.nome || telefone}`);
      } catch (e) {
        falhas++;
        log.push({ nome: contato.nome, telefone: contato.telefone, status: 'falha', erro: e.message });
        console.error(`${CONTEXTO} [BULK] ❌ Falha: ${contato.nome || telefone} —`, e.message);
      }

      // Reportar progresso
      window.postMessage({
        origem: 'INJETOR_PAGINA',
        ev: 'bulk_progresso',
        dados: { campanhaId, enviados, falhas, total, porcentagem: Math.round(((enviados + falhas) / total) * 100) }
      }, '*');
    }

    InjetorWPP.bulkEmAndamento = false;
    InjetorWPP.bulkPausado = false;

    const resultado = { sucesso: true, campanhaId, total, enviados, falhas, log };
    
    window.postMessage({
      origem: 'INJETOR_PAGINA',
      ev: 'bulk_concluido',
      dados: resultado
    }, '*');

    console.log(`${CONTEXTO} [BULK] Concluído — ${enviados} enviados, ${falhas} falhas.`);
    return resultado;
  }

  static pausarBulk() { InjetorWPP.bulkPausado = true; }
  static continuarBulk() { InjetorWPP.bulkPausado = false; }
  static cancelarBulk() { InjetorWPP.bulkEmAndamento = false; }

  // ── ENVIOS INDIVIDUAIS (existentes) ────────────────────
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
      
      // Simulação de gravação (#4)
      if (dados.simularGravacao !== false) {
        await InjetorWPP.simularGravacao(chatAtivo.id, 3000);
      }

      const blob = InjetorWPP.base64ToBlob(dados.base64.split(',')[1] || dados.base64, dados.tipoMime);
      const file = new File([blob], `voz_Upsiden_${Date.now()}.ogg`, { type: 'audio/ogg; codecs=opus' });
      const fakeWaveform = new Uint8Array(64).map(() => Math.floor(Math.random() * 50) + 10);
      const res = await window.WPP.chat.sendFileMessage(chatAtivo.id, file, { type: 'audio', isPtt: true, waveform: Array.from(fakeWaveform) });
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  static async enviarArquivo(dados) {
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
    if (!window.WPP || !window.WPP.webpack.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatAtivo = window.WPP.chat.getActiveChat();
      if (!chatAtivo) return { sucesso: false, erro: 'Abra um chat primeiro!' };
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

// ── ESCUTAR ORDENS DO CONTENT_SCRIPT ─────────────────────
window.addEventListener('message', async (evento) => {
  if (evento.data?.origem === 'CONTENT_SCRIPT') {
    let resposta = { sucesso: false, erro: 'Tipo desconhecido.' };
    
    if (evento.data.tipoMensagem === 'get_active_chat') {
      resposta = InjetorWPP.getActiveChatData();
    } else if (evento.data.tipoMensagem === 'set_config_auto_reply') {
      InjetorWPP.configSaudacao = evento.data.dados;
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'set_config_triggers') {
      InjetorWPP.configTriggers = evento.data.dados;
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'set_config_followups') {
      InjetorWPP.configFollowups = evento.data.dados;
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'texto') {
      resposta = await InjetorWPP.enviarTexto(evento.data);
    } else if (evento.data.tipoMensagem === 'arquivo') {
      resposta = await InjetorWPP.enviarArquivo(evento.data);
    } else if (evento.data.tipoMensagem === 'bulk_send_start') {
      // Não bloquear — iniciar em background
      InjetorWPP.iniciarBulkSend(evento.data.dados);
      resposta = { sucesso: true, msg: 'Envio em massa iniciado.' };
    } else if (evento.data.tipoMensagem === 'bulk_pausar') {
      InjetorWPP.pausarBulk();
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'bulk_continuar') {
      InjetorWPP.continuarBulk();
      resposta = { sucesso: true };
    } else if (evento.data.tipoMensagem === 'bulk_cancelar') {
      InjetorWPP.cancelarBulk();
      resposta = { sucesso: true };
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
console.log(`${CONTEXTO} Upsiden Engine v2 Pronto!`);
