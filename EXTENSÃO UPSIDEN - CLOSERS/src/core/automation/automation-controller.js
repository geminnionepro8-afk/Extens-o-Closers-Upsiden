/**
 * @file automation-controller.js
 * @description Controlador Mestre de Automação (O "Cérebro").
 *              Recebe mensagens brutas do WPP Engine, aplica regras de negócio cruzadas 
 *              (Horário de Expediente, Delay Inteligente, Filtro de Grupos) e comanda
 *              o motor para disparar a ação adequada.
 * @module Módulo 08: Automação - Backend Local
 */

class AutomationController {
  /** @type {boolean} Flag SSOT-08: desabilitar em produção */
  static DEBUG_MODE = false;

  static config = {
    saudacao: null,
    triggers: [],
    followups: [],
    horario: null,
    regras_globais: null
  };
  
  static chatsSaudados = new Set();
  static ultimaLimpeza = Date.now();

  /**
   * Atualiza a configuração local baseada nos dados síncronos injetados do Supabase
   * via IPC Bridge.
   */
  static syncConfig(payload) {
    if (payload.saudacao !== undefined) this.config.saudacao = payload.saudacao;
    if (payload.triggers !== undefined) this.config.triggers = payload.triggers;
    if (payload.followups !== undefined) this.config.followups = payload.followups;
    if (payload.horario !== undefined) this.config.horario = payload.horario;
    if (payload.regras_globais !== undefined) this.config.regras_globais = payload.regras_globais;
  }

  /**
   * Substitui variáveis de template no texto ({{nome}}, {{data}}, {{hora}}).
   */
  static parseTemplate(texto, chatName) {
    const nome = chatName || 'Cliente';
    return texto
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{data\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{hora\}\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  /**
   * Verifica expediente ativo. Regra #7.
   */
  static checkSchedule(confSaudacao) {
    const globalConf = this.config.horario || {};
    const usar = globalConf.ativo !== undefined ? globalConf.ativo : (confSaudacao && confSaudacao.usarHorario);
    
    if (!usar) return { ativo: true, msgFora: false };
    
    const agora = new Date();
    const minAtual = (agora.getHours() * 60) + agora.getMinutes();
    const diaSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][agora.getDay()];

    const diasAtivos = globalConf.diasSemana || (confSaudacao && confSaudacao.diasSemana) || ['seg', 'ter', 'qua', 'qui', 'sex'];
    if (!diasAtivos.includes(diaSemana)) return { ativo: false, msgFora: true, msg: globalConf.msg || confSaudacao.msgForaHorario };

    const inicio = globalConf.ini || (confSaudacao && confSaudacao.horaInicio) || '09:00';
    const fim = globalConf.fim || (confSaudacao && confSaudacao.horaFim) || '18:00';

    const [hin, minIn] = inicio.split(':').map(Number);
    const startMin = (hin * 60) + minIn;
    
    const [hfi, minFi] = fim.split(':').map(Number);
    const endMin = (hfi * 60) + minFi;

    const dentro = minAtual >= startMin && minAtual <= endMin;
    return { ativo: dentro, msgFora: !dentro, msg: globalConf.msg || confSaudacao.msgForaHorario };
  }

  /**
   * Regra Mestre de Validação Privado/Grupo (#8)
   */
  static checkAllowedTarget(isGroup, apenasPrivado, apenasGrupo) {
    if (apenasPrivado && isGroup) return false;
    if (apenasGrupo && !isGroup) return false;
    return true;
  }

  static limparCacheDiario() {
    const agora = Date.now();
    if (agora - this.ultimaLimpeza > 43200000) { // 12h
      this.chatsSaudados.clear();
      this.ultimaLimpeza = agora;
    }
  }

  /**
   * Recebe mensagens DO WPP Engine e delega lógica de Triggers ou Saudação.
   */
  static async handleIncomingMessage(msg, chatName) {
    this.limparCacheDiario();
    
    const isGroup = msg.isGroupMsg;
    const chatId = (msg.id && msg.id.remote) || msg.from || (msg.chatId && msg.chatId._serialized) || msg.chatId;
    const textoRecebido = (msg.body || msg.text || msg.content || '').trim().toLowerCase();

    // 1. Processar Triggers de Palavra-chave
    if (this.config.triggers.length > 0 && textoRecebido.length > 0) {
      for (const trig of this.config.triggers) {
        if (!trig.palavra) continue;
        if (!this.checkAllowedTarget(isGroup, trig.apenas_privado, trig.apenas_grupo)) continue;

        const palavra = trig.palavra.trim().toLowerCase();
        const condicao = trig.condicao || 'exata';
        let match = false;

        if (condicao === 'exata' && textoRecebido === palavra) match = true;
        else if (condicao === 'contem' && textoRecebido.includes(palavra)) match = true;

        if (match) {
          if (this.DEBUG_MODE) console.log(`[Automation] Trigger: ${palavra}`);
          
          let parsedSteps = null;
          try { 
              const possibleArray = JSON.parse(trig.resposta);
              if (Array.isArray(possibleArray)) parsedSteps = possibleArray;
          } catch(e) {}

          if (parsedSteps && parsedSteps.length > 0) {
             await this.executeSequentialFollowup(chatId, parsedSteps, chatName);
          } else {
             await window.InjetorWPP.enviarTexto({ texto: this.parseTemplate(trig.resposta, chatName) }, chatId);
          }
          return; // Para no primeiro gatilho
        }
      }
    }

    // 2. Processar Saudação (Apenas se não disparou gatilho)
    const conf = this.config.saudacao;
    if (!conf || !conf.ativo || !conf.mensagem) return;

    if (!this.checkAllowedTarget(isGroup, conf.apenasPrivado, conf.apenasGrupo)) return;

    const chatKey = chatId._serialized || chatId;
    if (this.chatsSaudados.has(chatKey)) return;

    const schedule = this.checkSchedule(conf);
    
    if (schedule.msgFora && schedule.msg && schedule.msg.trim()) {
       await window.InjetorWPP.enviarTexto({ texto: this.parseTemplate(schedule.msg, chatName) }, chatId);
       this.chatsSaudados.add(chatKey);
       return;
    }

    if (schedule.ativo) {
       await window.InjetorWPP.enviarTexto({ texto: this.parseTemplate(conf.mensagem, chatName) }, chatId);
       this.chatsSaudados.add(chatKey);

       // 3. Processar Follow-ups Sequenciais
       if (conf.followupSteps && conf.followupSteps.length > 0) {
          await this.executeSequentialFollowup(chatId, conf.followupSteps, chatName);
       }
    }
  }

  /**
   * Executa pipeline de envio sequencial (Regra #6 e Fase 2 Multimedia)
   */
  static async executeSequentialFollowup(chatId, steps, chatName) {
    if (this.DEBUG_MODE) console.log(`[Automation] Pipeline: ${steps.length} steps`);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const ms = (step.delay_segundos !== undefined ? step.delay_segundos : 3) * 1000;
      await new Promise(r => setTimeout(r, ms));
      
      try {
        if (step.tipo === 'texto') {
           const texto = this.parseTemplate(step.conteudo || '', chatName);
           const res = await window.InjetorWPP.enviarTexto({ texto, duracaoSimulacao: step.duracaoSimulacao ? step.duracaoSimulacao * 1000 : null }, chatId);
           if (res && !res.sucesso) window.alert('Upsiden (Passo ' + (i+1) + '): Falha ao Enviar Texto -> ' + res.erro);
        }
        else if (step.tipo === 'audio') {
           const res = await window.InjetorWPP.enviarAudio({ 
               base64: step.base64, 
               url: step.url, 
               tipoMime: 'audio/ogg', 
               sendAs: step.sendAs,
               duracaoSimulacao: step.duracaoSimulacao ? step.duracaoSimulacao * 1000 : null 
           }, chatId);
           if (res && !res.sucesso) window.alert('Upsiden (Passo ' + (i+1) + '): O Motor de Mídia falhou ao injetar o Áudio -> ' + res.erro);
        }
        else if ((step.tipo === 'documento' || step.tipo === 'midia' || step.tipo === 'imagem' || step.tipo === 'video')) {
           const captionParsed = this.parseTemplate(step.conteudo || '', chatName);
           const res = await window.InjetorWPP.enviarArquivo({ 
              base64: step.base64, 
              url: step.url, 
              tipo: step.mime || 'application/octet-stream', 
              nome: step.nome || `file_${Date.now()}`, 
              caption: captionParsed,
              sendAs: step.sendAs,
              duracaoSimulacao: step.duracaoSimulacao ? step.duracaoSimulacao * 1000 : null 
           }, chatId);
           if (res && !res.sucesso) window.alert('Upsiden (Passo ' + (i+1) + '): O Motor WPPConnect falhou ao enviar Imagem/Documento -> ' + res.erro);
        }
      } catch (e) { 
         window.alert('Upsiden: Exceção Fatal no Processamento de Automação -> ' + e.message); 
         if (this.DEBUG_MODE) console.error('[Automation] Pipeline err', e); 
      }
    }
  }
}

window.AutomationController = AutomationController;
