/**
 * @file automation-controller.js
 * @description Controlador Mestre de Automação (O "Cérebro").
 * Versão: 2.5 - CONTROLADOR UNIFICADO (Clean Execution)
 */

class AutomationController {
  static DEBUG_MODE = true; 

  static config = {
    saudacao: null,
    triggers: [],
    followups: [],
    availability_matrix: null,
    global_rules: null,
    flows: []
  };
  
  static chatsSaudados = new Set();
  static ultimaLimpeza = Date.now();

  static syncConfig(payload) {
    if (payload.saudacao !== undefined) this.config.saudacao = payload.saudacao;
    if (payload.triggers !== undefined) this.config.triggers = payload.triggers;
    if (payload.followups !== undefined) this.config.followups = payload.followups;
    if (payload.availability_matrix !== undefined) this.config.availability_matrix = payload.availability_matrix;
    if (payload.global_rules !== undefined) this.config.global_rules = payload.global_rules;
    if (payload.flows !== undefined) this.config.flows = payload.flows;
  }

  static parseTemplate(texto, chatName) {
    const nome = chatName || 'Cliente';
    return String(texto || '')
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{data\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{hora\}\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  static checkSchedule(confSaudacao) {
    const usar = confSaudacao && confSaudacao.usar_horario;
    if (!usar) return { ativo: true, msgFora: false };
    if (this.config.availability_matrix && this.config.availability_matrix.length === 7) {
        const agora = new Date();
        const jDay = agora.getDay();
        const matrixDay = jDay === 0 ? 6 : jDay - 1;
        const slot = (agora.getHours() * 2) + Math.floor(agora.getMinutes() / 30);
        const isOnline = this.config.availability_matrix[matrixDay][slot];
        return { ativo: isOnline, msgFora: !isOnline, msg: confSaudacao.msg_fora_horario };
    }
    return { ativo: true, msgFora: false };
  }

  static checkAllowedTarget(isGroup, apenasPrivado, apenasGrupo) {
    if (apenasPrivado && isGroup) return false;
    if (apenasGrupo && !isGroup) return false;
    return true;
  }

  static evaluateGlobalRules(tags, textoRecebido) {
      if (!this.config.global_rules || this.config.global_rules.length === 0) return { blocked: false };
      const tks = tags || [];
      for(const rule of this.config.global_rules) {
          const match = rule.tagsCond.some(rc => tks.includes(rc));
          if(match && rule.blockFlow) return { blocked: true };
      }
      return { blocked: false };
  }

  static getRawMessageData(msg) {
    const data = {
      text: '',
      isAudio: false,
      isMedia: false,
      type: msg.type || 'unknown'
    };

    // ── NORMALIZADOR UNIVERSAL ──
    data.text = String(
      msg.body ||            
      msg.caption ||         
      msg.text ||            
      msg.content ||         
      ''
    ).toLowerCase().trim();

    if (msg.type === 'ptt' || msg.type === 'audio' || msg.isAudioMsg) data.isAudio = true;
    if (msg.type === 'image' || msg.type === 'video' || msg.type === 'document') data.isMedia = true;

    return data;
  }

  static normalizeChatId(id) {
    if (!id) return '';
    if (typeof id === 'string') return id;
    return id._serialized || String(id);
  }

  static async handleIncomingMessage(msg, chatName) {
    const isGroup = !!msg.isGroupMsg;
    const rawChatId = (msg.id && msg.id.remote) || msg.from || msg.chatId;
    const chatId = this.normalizeChatId(rawChatId);
    if (!chatId) return;

    // ── EXTRAÇÃO AGNÓSTICA (Normalizador Universal) ──
    const messageData = this.getRawMessageData(msg);
    const textoRecebido = messageData.text;
    
    console.log(`[Automation] 📩 Msg [${messageData.type}] de ${chatId}: "${textoRecebido}"`);
    
    // 0. Interceptar Flow Builder Wait For Reply
    if (window.FlowRunner?.activeSessions?.[chatId]) {
        const session = window.FlowRunner.activeSessions[chatId];
        if (session.waitingForReply && session.resolveWait) {
            session.resolveWait(msg);
            return; 
        }
    }

    // 1. Regras Globais
    const mockTags = msg.contactTags || []; 
    if(this.evaluateGlobalRules(mockTags, textoRecebido).blocked) return;

    // 2. Triggers Clássicos
    if (this.config.triggers?.length > 0) {
      for (const trig of this.config.triggers) {
        if (!trig.palavra) continue;
        const palavraChave = String(trig.palavra).trim().toLowerCase();
        let match = false;

        if (messageData.isAudio && (palavraChave === '[audio]' || palavraChave === '[ptt]')) match = true;
        else match = trig.condicao === 'contem' ? textoRecebido.includes(palavraChave) : textoRecebido === palavraChave;

        if (match && this.checkAllowedTarget(isGroup, trig.apenas_privado, trig.apenas_grupo)) {
          let steps = [];
          try { 
              if (typeof trig.resposta === 'string' && (trig.resposta.startsWith('[') || trig.resposta.startsWith('{'))) {
                  steps = JSON.parse(trig.resposta);
                  if (!Array.isArray(steps)) steps = [steps];
              } else {
                  steps = Array.isArray(trig.resposta) ? trig.resposta : [{ tipo: 'texto', conteudo: trig.resposta, delay_segundos: 1 }];
              }
          } catch(e) { steps = [{ tipo: 'texto', conteudo: String(trig.resposta), delay_segundos: 1 }]; }
          
          if (steps.length > 0) await this.executeSequentialFollowup(chatId, steps, chatName);
          return;
        }
      }
    }

    // 3. Saudação
    const conf = this.config.saudacao;
    if (!conf || !conf.saudacao_ativa) return;
    if (!this.checkAllowedTarget(isGroup, conf.apenas_privado, conf.apenas_grupo)) return;
    if (this.chatsSaudados.has(chatId)) return;

    const schedule = this.checkSchedule(conf);
    if (!schedule.ativo && !schedule.msgFora) return;

    if (schedule.msgFora && schedule.msg?.trim()) {
       await window.InjetorWPP.sendUniversalMessage({ texto: schedule.msg, chatName }, chatId);
       this.chatsSaudados.add(chatId);
       return;
    }

    if (schedule.ativo) {
       this.chatsSaudados.add(chatId);
       const steps = [];
       if (conf.saudacao_mensagem?.trim()) steps.push({ tipo: 'texto', delay_segundos: 1, conteudo: conf.saudacao_mensagem });
       if (conf.followup_steps) conf.followup_steps.forEach(f => steps.push(f));
       if (steps.length > 0) await this.executeSequentialFollowup(chatId, steps, chatName);
    }
  }

  // ── TAREFA 2: EXECUÇÃO UNIFICADA (Cleanup de IFs excludentes) ──
  static async executeSequentialFollowup(chatId, steps, chatName) {
    console.log(`%c[Automation] 🚀 INICIANDO SEQUÊNCIA: ${steps.length} PASSOS`, "background: #25D366; color: white; padding: 2px 10px; font-weight: bold;");
    
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const delay = (step.delay_segundos || 2) * 1000;
        
        console.log(`[Automation] Passo ${i+1}/${steps.length} (${step.tipo}) - Delay ${step.delay_segundos || 2}s...`);
        await new Promise(r => setTimeout(r, delay));
        
        try {
            // Unificação Total: Passamos o objeto do passo inteiro para o Universal Dispatcher
            // Ele decidirá se envia como texto, imagem com legenda ou áudio sequencial
            const res = await window.InjetorWPP.sendUniversalMessage({ 
                ...step, 
                chatName: chatName,
                duracaoSimulacao: (step.duracaoSimulacao || 2) * 1000 
            }, chatId);

            if (res.sucesso) console.log(`[Automation] Passo ${i+1} OK ✅`);
            else console.error(`[Automation] Passo ${i+1} FALHOU ❌: ${res.erro}`);

        } catch (e) { console.error(`[Automation] 🚨 Exceção no Passo ${i+1}:`, e); }
    }
    console.log(`[Automation] 🏁 SEQUÊNCIA FINALIZADA`);
  }
}

window.AutomationController = AutomationController;
