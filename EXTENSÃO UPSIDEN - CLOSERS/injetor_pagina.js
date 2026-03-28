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

  // ── OUVINTES DE AUTOMAÇÃO (MODERNIZADO) ────────────────
  static iniciarOuvintes() {
    console.log(`${CONTEXTO} Iniciando ouvintes de sincronização WPP...`);
    
    // Polling a cada 5s para config atualizada (vincular ao AutomationController no futuro)
    setInterval(() => {
      window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');
    }, 5000);

    // Tentativa inicial
    window.postMessage({ origem: 'INJETOR_PAGINA_INIT', ev: 'puxar_config_auto_reply' }, '*');

    // Limpar cache diariamente
    setInterval(() => InjetorWPP.limparCacheDiario(), 60000);

    // NOTA: O listener 'chat.msg_receive' legado foi removido.
    // Agora a AutomationController (src/core/automation/automation-controller.js) 
    // é quem escuta as mensagens e coordena os disparos via window.WPP.on direta ou via Background.
    
    // Escutar mensagens recebidas (Centralizado)
    try {
        window.WPP.on('chat.msg_receive', async (msg) => {
            if (msg.id.fromMe || msg.isStatusV3) return;
            
            // Repassar para o AutomationController se disponível
            if (window.AutomationController && window.AutomationController.handleIncomingMessage) {
                const chat = await window.WPP.chat.get(msg.chatId);
                window.AutomationController.handleIncomingMessage(msg, chat?.name || '');
            }
        });
    } catch(e) { console.error(`${CONTEXTO} Falha ao vincular AutomationController`, e); }

    window.postMessage({ origem: 'INJETOR_PAGINA', ev: 'engine_pronto_para_automacao' }, '*');
  }

  // ── MÉTODOS DE ENVIO (SIMULAÇÃO + DIRECIONAMENTO) ───────
  static base64ToBlob(base64, mime) {
    try {
        const binStr = atob(base64);
        const len = binStr.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
        return new Blob([arr], { type: mime });
    } catch(e) { return null; }
  }

  /**
   * Envia texto com simulação opcional de digitação.
   * @param {Object} dados { texto, duracaoSimulacao }
   * @param {string} targetId ID do chat (ex: 55... @c.us)
   */
  static async enviarTexto(dados, targetId) {
    if (!window.WPP?.webpack?.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatId = targetId || dados.chatId || (window.WPP.chat.getActiveChat())?.id;
      if (!chatId) return { sucesso: false, erro: 'ID do chat não fornecido.' };

      if (dados.duracaoSimulacao > 0) {
        await InjetorWPP.simularDigitacao(chatId, dados.duracaoSimulacao);
      }

      const res = await window.WPP.chat.sendTextMessage(chatId, dados.texto);
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  /**
   * Envia áudio como PTT (Gravado na hora) com simulação.
   */
  static async enviarAudio(dados, targetId) {
    if (!window.WPP?.webpack?.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatId = targetId || dados.chatId || (window.WPP.chat.getActiveChat())?.id;
      if (!chatId) return { sucesso: false, erro: 'ID do chat não fornecido.' };

      if (dados.duracaoSimulacao > 0) {
        await InjetorWPP.simularGravacao(chatId, dados.duracaoSimulacao);
      }

      const b64 = dados.base64.includes(',') ? dados.base64.split(',')[1] : dados.base64;
      const blob = InjetorWPP.base64ToBlob(b64, 'audio/ogg');
      if (!blob) throw new Error('Falha ao processar base64 do áudio');

      const file = new File([blob], `ptt_${Date.now()}.ogg`, { type: 'audio/ogg; codecs=opus' });
      const waveform = new Uint8Array(64).map(() => Math.floor(Math.random() * 50) + 10);
      
      const res = await window.WPP.chat.sendFileMessage(chatId, file, { 
        type: 'audio', 
        isPtt: true, 
        waveform: Array.from(waveform) 
      });
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  /**
   * Envia arquivo (imagem, vídeo, documento) com caption e simulação.
   */
  static async enviarArquivo(dados, targetId) {
    if (!window.WPP?.webpack?.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatId = targetId || dados.chatId || (window.WPP.chat.getActiveChat())?.id;
      if (!chatId) return { sucesso: false, erro: 'ID do chat não fornecido.' };

      // Documentos/Mídias costumam simular digitação se tiverem legenda
      if (dados.duracaoSimulacao > 0) {
        await InjetorWPP.simularDigitacao(chatId, dados.duracaoSimulacao);
      }

      const b64 = dados.base64.includes(',') ? dados.base64.split(',')[1] : dados.base64;
      const blob = InjetorWPP.base64ToBlob(b64, dados.tipo || 'application/octet-stream');
      if (!blob) throw new Error('Falha ao processar base64 do arquivo');

      const file = new File([blob], dados.nome || `file_${Date.now()}`, { type: dados.tipo });
      const res = await window.WPP.chat.sendFileMessage(chatId, file, { 
        type: 'auto', 
        caption: dados.caption || dados.texto || '' 
      });
      return { sucesso: true, resultado: res.id };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  static getActiveChatData() {
    if (!window.WPP?.webpack?.isReady) return { sucesso: false, erro: 'WPP não carregado.' };
    try {
      const chatAtivo = window.WPP.chat.getActiveChat();
      if (!chatAtivo) return { sucesso: false, erro: 'Nenhum chat ativo.' };
      return { sucesso: true, id: chatAtivo.id._serialized || chatAtivo.id, nome: chatAtivo.name || '' };
    } catch (e) { return { sucesso: false, erro: String(e) }; }
  }

  // ── MÉTODOS DE CONTROLE ─────────────────────────────────
  static pausarBulk() { InjetorWPP.bulkPausado = true; }
  static continuarBulk() { InjetorWPP.bulkPausado = false; }
  static cancelarBulk() { InjetorWPP.bulkEmAndamento = false; }

  /**
   * INICIAR DISPARO EM MASSA (BULK SEND)
   * Itera sobre contatos e executa a sequência de passos (mensagens).
   */
  static async iniciarBulkSend(dados) {
    if (InjetorWPP.bulkEmAndamento) return;
    InjetorWPP.bulkEmAndamento = true;
    InjetorWPP.bulkPausado = false;

    const { contatos, stepsParams, campanha_id, min, max } = dados;
    let enviados = 0;
    let falhas = 0;

    console.log(`${CONTEXTO} Iniciando Campanha [${campanha_id}] para ${contatos.length} contatos.`);

    for (let i = 0; i < contatos.length; i++) {
        if (!InjetorWPP.bulkEmAndamento) break;

        // Pausa
        while (InjetorWPP.bulkPausado) {
            await new Promise(r => setTimeout(r, 2000));
            if (!InjetorWPP.bulkEmAndamento) break;
        }

        const contato = contatos[i];
        const chatId = contato.telefone.includes('@') ? contato.telefone : `${contato.telefone}@c.us`;

        try {
            console.log(`${CONTEXTO} Enviando sequência para ${chatId} (${i + 1}/${contatos.length})`);
            
            // Reutilizar o AutomationController se disponível para garantir consistência de mídia
            if (window.AutomationController && window.AutomationController.executeSequentialFollowup) {
                await window.AutomationController.executeSequentialFollowup(chatId, stepsParams, contato.nome);
            } else {
                // Fallback manual se o controlador não existir (improvável)
                for (const step of stepsParams) {
                    const delay = (step.delay_segundos || 2) * 1000;
                    await new Promise(r => setTimeout(r, delay));
                    
                    if (step.tipo === 'texto') {
                        await InjetorWPP.enviarTexto({ texto: step.conteudo }, chatId);
                    } else if (step.tipo === 'audio') {
                        // Precisa de base64... se não tiver, o Bulk vai falhar sem o controller
                        await InjetorWPP.enviarAudio(step, chatId);
                    } else {
                        await InjetorWPP.enviarArquivo(step, chatId);
                    }
                }
            }

            enviados++;
        } catch (err) {
            console.error(`${CONTEXTO} Erro ao enviar para ${chatId}:`, err);
            falhas++;
        }

        // Delay Anti-ban entre contatos
        const delayBan = InjetorWPP.randomDelay(min || 5, max || 15);
        console.log(`${CONTEXTO} Aguardando ${Math.floor(delayBan / 1000)}s (Anti-ban)...`);

        // Feedback de Progresso
        window.postMessage({
            origem: 'INJETOR_PAGINA',
            ev: 'bulk_progresso',
            dados: { id: campanha_id, enviados, falhas, status: 'andamento' }
        }, '*');

        await new Promise(r => setTimeout(r, delayBan));
    }

    InjetorWPP.bulkEmAndamento = false;
    window.postMessage({
        origem: 'INJETOR_PAGINA',
        ev: 'bulk_concluido',
        dados: { id: campanha_id, enviados, falhas, status: 'concluida' }
    }, '*');

    console.log(`${CONTEXTO} Campanha Finalizada. Sucesso: ${enviados}, Falhas: ${falhas}`);
  }
}

// ── ESCUTAR ORDENS DO CONTENT_SCRIPT / BACKEND ───────────
window.addEventListener('message', async (evento) => {
  if (evento.data?.origem === 'CONTENT_SCRIPT') {
    let resposta = { sucesso: false, erro: 'Tipo de mensagem não reconhecido ou parâmetro ausente.' };
    const { tipoMensagem, dados, msgId, chatId } = evento.data;
    
    try {
        if (tipoMensagem === 'get_active_chat') {
          resposta = InjetorWPP.getActiveChatData();
        } 
        else if (tipoMensagem === 'set_config_auto_reply') {
          InjetorWPP.configSaudacao = dados;
          if(window.AutomationController) window.AutomationController.syncConfig({ saudacao: dados });
          resposta = { sucesso: true };
        } 
        else if (tipoMensagem === 'set_config_triggers') {
          InjetorWPP.configTriggers = dados;
          if(window.AutomationController) window.AutomationController.syncConfig({ triggers: dados });
          resposta = { sucesso: true };
        } 
        else if (tipoMensagem === 'set_config_followups') {
          InjetorWPP.configFollowups = dados;
          if(window.AutomationController) window.AutomationController.syncConfig({ followups: dados });
          resposta = { sucesso: true };
        } 
        else if (tipoMensagem === 'texto') {
          resposta = await InjetorWPP.enviarTexto(dados, chatId || dados.chatId);
        } 
        else if (tipoMensagem === 'arquivo') {
          resposta = await InjetorWPP.enviarArquivo(dados, chatId || dados.chatId);
        } 
        else if (tipoMensagem === 'audio') {
          resposta = await InjetorWPP.enviarAudio(dados, chatId || dados.chatId);
        }
        else if (tipoMensagem === 'bulk_send_start') {
          InjetorWPP.iniciarBulkSend(dados);
          resposta = { sucesso: true, msg: 'Envio em massa iniciado.' };
        } 
        else if (tipoMensagem === 'bulk_pausar') { InjetorWPP.pausarBulk(); resposta = { sucesso: true }; }
        else if (tipoMensagem === 'bulk_continuar') { InjetorWPP.continuarBulk(); resposta = { sucesso: true }; }
        else if (tipoMensagem === 'bulk_cancelar') { InjetorWPP.cancelarBulk(); resposta = { sucesso: true }; }
    } catch(err) {
        resposta = { sucesso: false, erro: err.message };
    }

    if (msgId) {
        window.postMessage({ origem: 'INJETOR_PAGINA', msgId, resposta }, '*');
    }
  }
});

InjetorWPP.inicializar();
console.log(`${CONTEXTO} Upsiden Engine v2 Pronto!`);
