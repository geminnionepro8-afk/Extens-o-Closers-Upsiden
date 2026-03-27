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
    availability_matrix: null, /* Version B New */
    global_rules: null,       /* Version B New */
    flows: []
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
    if (payload.availability_matrix !== undefined) this.config.availability_matrix = payload.availability_matrix;
    if (payload.global_rules !== undefined) this.config.global_rules = payload.global_rules;
    if (payload.flow !== undefined) this.config.flows = payload.flow; // Used by flow builder LocalStorage sync
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
    // Legacy fallback
    const globalConf = this.config.horario || {};
    const usar = confSaudacao && confSaudacao.usar_horario;
    
    if (!usar) return { ativo: true, msgFora: false };
    
    // Versão B - Avaliador de Matriz
    if (this.config.availability_matrix && this.config.availability_matrix.length === 7) {
        const agora = new Date();
        const jDay = agora.getDay(); // 0(Sun) - 6(Sat)
        // Mapear JS Day pra Matriz (Seg=0, Ter=1... Dom=6)
        const matrixDay = jDay === 0 ? 6 : jDay - 1;
        const slot = (agora.getHours() * 2) + Math.floor(agora.getMinutes() / 30);
        
        const isOnline = this.config.availability_matrix[matrixDay][slot];
        return { 
            ativo: isOnline, 
            msgFora: !isOnline, 
            msg: confSaudacao.msg_fora_horario 
        };
    }
    
    return { ativo: true, msgFora: false };
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

  static evaluateGlobalRules(tags, textoRecebido) {
      if (!this.config.global_rules || this.config.global_rules.length === 0) return { blocked: false };
      
      let finalBlock = false;
      const tks = tags || [];
      
      for(const rule of this.config.global_rules) {
          const match = rule.tagsCond.some(rc => tks.includes(rc));
          if(match && rule.blockFlow) {
              finalBlock = true;
              break;
          }
      }
      return { blocked: finalBlock };
  }

  /**
   * Recebe mensagens DO WPP Engine e delega lógica de Triggers ou Saudação.
   */
  static async handleIncomingMessage(msg, chatName) {
    this.limparCacheDiario();
    
    const isGroup = msg.isGroupMsg;
    const chatId = (msg.id && msg.id.remote) || msg.from || (msg.chatId && msg.chatId._serialized) || msg.chatId;
    const textoRecebido = (msg.body || msg.text || msg.content || '').trim().toLowerCase();

    // 0. Interceptar Mensagens de Sessões Ativas (Flow Builder Wait For Reply)
    if (window.FlowRunner && window.FlowRunner.activeSessions && window.FlowRunner.activeSessions[chatId]) {
        const session = window.FlowRunner.activeSessions[chatId];
        if (session.waitingForReply && session.resolveWait) {
            console.log(`[AutomationController] Interceptando resposta para resolver Flow Node (Aguardar Resposta)`);
            session.resolveWait(msg);
            return; // Bloqueia propagação! O Fluxo Mestre toma conta daqui.
        }
    }

    // 1. REGRAS GLOBAIS (Top-Down Priority Sandbox)
    const mockTags = msg.contactTags || []; 
    const ruleEvaluation = this.evaluateGlobalRules(mockTags, textoRecebido);
    if(ruleEvaluation.blocked) {
        console.log(`[AutomationController] Fluxo cancelado por Regra Global`);
        return; // BLOCK COMPLETO
    }

    // 2. Processar Fluxos Visuais da Versão B 
    const flowTriggers = this.config.flows && this.config.flows.nodes ? this.config.flows.nodes : [];
    if (flowTriggers && flowTriggers.length > 0 && textoRecebido.length > 0) {
        const triggerNode = flowTriggers.find(n => n.type === 'trigger' && textoRecebido.includes((n.data.palavra || '').toLowerCase()));
        if(triggerNode) {
            console.log('[Automation] Gatilho Visual Match:', triggerNode.title);
            const edge = (this.config.flows.edges || []).find(e => e.source === triggerNode.id);
            if(edge) {
                const actNode = flowTriggers.find(n => n.id === edge.target);
                if(actNode && actNode.data.resposta) {
                    await this.executeSequentialFollowup(chatId, [{ tipo: 'texto', delay_segundos: actNode.data.delay, conteudo: actNode.data.resposta }], chatName);
                }
            }
            return; // Para tudo e deixa o FlowRunner assumir a conversa
        }
    }

    // 3. Processar Triggers de Palavra-chave (Clássicos)
    if (this.config.triggers && this.config.triggers.length > 0 && textoRecebido.length > 0) {
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

    // 4. Processar Saudação (Modular Drag and Drop)
    const conf = this.config.saudacao;
    if (!conf || !conf.saudacao_ativa) return;
    if (!this.checkAllowedTarget(isGroup, conf.apenas_privado, conf.apenas_grupo)) return;

    const chatKey = chatId._serialized || chatId;
    if (this.chatsSaudados.has(chatKey)) return;

    const schedule = this.checkSchedule(conf);
    
    if (schedule.msgFora && schedule.msg && schedule.msg.trim()) {
       await window.InjetorWPP.enviarTexto({ texto: this.parseTemplate(schedule.msg, chatName) }, chatId);
       this.chatsSaudados.add(chatKey);
       return;
    }

    if (schedule.ativo) {
       this.chatsSaudados.add(chatKey);

       const steps = [];
       if(conf.saudacao_mensagem) steps.push({ tipo: 'texto', delay_segundos: 2, conteudo: conf.saudacao_mensagem });
       if(conf.followup_steps && conf.followup_steps.length > 0){
           conf.followup_steps.forEach(f => steps.push(f));
       }

       if (steps.length > 0) {
          await this.executeSequentialFollowup(chatId, steps, chatName);
       }
    }
  }

  /**
   * Executa pipeline de envio sequencial
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
