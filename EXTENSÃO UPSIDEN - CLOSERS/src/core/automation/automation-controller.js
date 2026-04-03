/**
 * @file automation-controller.js
 * @description Controlador Mestre de Automação (O "Cérebro").
 * Versão: 3.0 — REESTRUTURADO
 *   - Multi-palavra (vírgula) nos gatilhos
 *   - Condição 'contém' e 'exata'
 *   - Logs de diagnóstico completos
 *   - Normalização robusta de steps
 */

class AutomationController {

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

  // ── SYNC CONFIG (com diagnóstico) ────────────────────────
  static syncConfig(payload) {
    if (payload.saudacao !== undefined) {
      this.config.saudacao = payload.saudacao;
      const s = payload.saudacao;
      if (s) {
        // Normalizar followup_steps se vier como string JSON
        if (typeof s.followup_steps === 'string') {
          try { s.followup_steps = JSON.parse(s.followup_steps); } catch(e) { s.followup_steps = []; }
        }
        const fupCount = Array.isArray(s.followup_steps) ? s.followup_steps.length : 0;
        console.log(`%c[Automation] ⚙️ SAUDAÇÃO SYNC: ativa=${s.saudacao_ativa}, msg="${(s.saudacao_mensagem||'').substring(0,40)}...", follow-ups=${fupCount}`, "color: #3498db; font-weight: bold;");
      } else {
        console.log(`[Automation] ⚙️ SAUDAÇÃO SYNC: null/desativada`);
      }
    }
    if (payload.triggers !== undefined) {
      this.config.triggers = Array.isArray(payload.triggers) ? payload.triggers : [];
      console.log(`%c[Automation] ⚙️ TRIGGERS SYNC: ${this.config.triggers.length} gatilho(s) carregado(s)`, "color: #e67e22; font-weight: bold;");
      this.config.triggers.forEach((t, i) => {
        console.log(`  [${i}] palavra="${t.palavra}" | condição=${t.condicao || 'exata'} | pasta=${t.pasta || 'Geral'}`);
      });
    }
    if (payload.followups !== undefined) this.config.followups = payload.followups;
    if (payload.availability_matrix !== undefined) this.config.availability_matrix = payload.availability_matrix;
    if (payload.global_rules !== undefined) this.config.global_rules = payload.global_rules;
    if (payload.flows !== undefined) this.config.flows = payload.flows;
  }

  // ── TEMPLATE PARSER ──────────────────────────────────────
  static parseTemplate(texto, chatName) {
    const nome = chatName || 'Cliente';
    return String(texto || '')
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{data\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{hora\}\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  // ── HORÁRIO ──────────────────────────────────────────────
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

  // ── FILTRO DE ALVO ───────────────────────────────────────
  static checkAllowedTarget(isGroup, apenasPrivado, apenasGrupo) {
    if (apenasPrivado && isGroup) return false;
    if (apenasGrupo && !isGroup) return false;
    return true;
  }

  // ── REGRAS GLOBAIS ───────────────────────────────────────
  static evaluateGlobalRules(tags, textoRecebido) {
    if (!this.config.global_rules || this.config.global_rules.length === 0) return { blocked: false };
    const tks = tags || [];
    for (const rule of this.config.global_rules) {
      const match = rule.tagsCond.some(rc => tks.includes(rc));
      if (match && rule.blockFlow) return { blocked: true };
    }
    return { blocked: false };
  }

  // ── NORMALIZER DE MENSAGEM ───────────────────────────────
  static getRawMessageData(msg) {
    const data = {
      text: '',
      isAudio: false,
      isMedia: false,
      type: msg.type || 'unknown'
    };

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

  // ── NORMALIZER DE CHAT ID ────────────────────────────────
  static normalizeChatId(id) {
    if (!id) return '';
    if (typeof id === 'string') return id;
    return id._serialized || String(id);
  }

  // ── PARSE STEPS (de string JSON ou array) ────────────────
  static parseSteps(resposta) {
    if (!resposta) return [];
    if (Array.isArray(resposta)) return resposta;
    if (typeof resposta === 'string') {
      const trimmed = resposta.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch(e) {
          return [{ tipo: 'texto', conteudo: resposta, delay_segundos: 1 }];
        }
      }
      return [{ tipo: 'texto', conteudo: resposta, delay_segundos: 1 }];
    }
    return [];
  }

  // ── MATCH DE GATILHO (Multi-palavra + Contém) ────────────
  static matchTrigger(trig, textoRecebido, isAudio) {
    if (!trig.palavra) return false;

    // Separar múltiplas palavras-chave por vírgula
    const keywords = String(trig.palavra).split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const condicao = trig.condicao || 'exata';

    for (const kw of keywords) {
      // Áudio especial
      if (isAudio && (kw === '[audio]' || kw === '[ptt]')) return true;

      // Match por condição
      if (condicao === 'contem') {
        if (textoRecebido.includes(kw)) return true;
      } else {
        // Exata: texto inteiro === palavra-chave
        if (textoRecebido === kw) return true;
      }
    }

    return false;
  }

  // ── HANDLER PRINCIPAL ────────────────────────────────────
  static async handleIncomingMessage(msg, chatName) {
    const isGroup = !!msg.isGroupMsg;
    const rawChatId = (msg.id && msg.id.remote) || msg.from || msg.chatId;
    const chatId = this.normalizeChatId(rawChatId);
    if (!chatId) return;

    const messageData = this.getRawMessageData(msg);
    const textoRecebido = messageData.text;
    
    console.log(`[Automation] 📩 Msg [${messageData.type}] de ${chatId}: "${textoRecebido.substring(0, 80)}"`);

    // Limpar cache a cada 12h
    if (Date.now() - this.ultimaLimpeza > 43200000) {
      this.chatsSaudados.clear();
      this.ultimaLimpeza = Date.now();
      console.log('[Automation] 🧹 Cache de saudações limpo (12h)');
    }

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
    if (this.evaluateGlobalRules(mockTags, textoRecebido).blocked) {
      console.log('[Automation] 🚫 Bloqueado por regra global');
      return;
    }

    // 2. Triggers Clássicos
    if (this.config.triggers?.length > 0) {
      for (const trig of this.config.triggers) {
        if (this.matchTrigger(trig, textoRecebido, messageData.isAudio)) {
          if (!this.checkAllowedTarget(isGroup, trig.apenas_privado, trig.apenas_grupo)) continue;

          console.log(`%c[Automation] ⚡ GATILHO ATIVADO: "${trig.palavra}"`, "background: #FF4D00; color: white; padding: 2px 10px; font-weight: bold;");
          
          const steps = this.parseSteps(trig.resposta);
          if (steps.length > 0) {
            await this.executeSequentialFollowup(chatId, steps, chatName);
          }
          return; // Primeiro gatilho que bate, para.
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
      console.log(`[Automation] 🕐 Fora de horário → Enviando mensagem de fechado`);
      await window.InjetorWPP.sendUniversalMessage({ texto: schedule.msg, chatName }, chatId);
      this.chatsSaudados.add(chatId);
      return;
    }

    if (schedule.ativo) {
      this.chatsSaudados.add(chatId);
      const steps = [];
      if (conf.saudacao_mensagem?.trim()) {
        steps.push({ tipo: 'texto', delay_segundos: 1, conteudo: conf.saudacao_mensagem });
      }
      
      // Followup steps (já normalizados no syncConfig)
      const fups = Array.isArray(conf.followup_steps) ? conf.followup_steps : [];
      fups.forEach(f => steps.push(f));
      
      if (steps.length > 0) {
        console.log(`%c[Automation] 👋 SAUDAÇÃO ATIVADA: ${steps.length} passo(s)`, "background: #25D366; color: white; padding: 2px 10px; font-weight: bold;");
        await this.executeSequentialFollowup(chatId, steps, chatName);
      }
    }
  }

  // ── EXECUÇÃO SEQUENCIAL ──────────────────────────────────
  static async executeSequentialFollowup(chatId, steps, chatName) {
    console.log(`%c[Automation] 🚀 INICIANDO SEQUÊNCIA: ${steps.length} PASSOS para ${chatId}`, "background: #25D366; color: white; padding: 2px 10px; font-weight: bold;");
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const delay = (step.delay_segundos || 2) * 1000;
      
      console.log(`[Automation] ⏳ Passo ${i+1}/${steps.length} (${step.tipo}) - Delay ${step.delay_segundos || 2}s...`);
      await new Promise(r => setTimeout(r, delay));
      
      try {
        const res = await window.InjetorWPP.sendUniversalMessage({ 
          ...step, 
          chatName: chatName,
          duracaoSimulacao: (step.duracaoSimulacao || 2) * 1000 
        }, chatId);

        if (res.sucesso) {
          console.log(`[Automation] ✅ Passo ${i+1} OK`);
        } else {
          console.error(`[Automation] ❌ Passo ${i+1} FALHOU: ${res.erro}`);
        }
      } catch (e) {
        console.error(`[Automation] 🚨 Exceção no Passo ${i+1}:`, e);
      }
    }
    console.log(`%c[Automation] 🏁 SEQUÊNCIA FINALIZADA (${steps.length} passos)`, "background: #2ecc71; color: white; padding: 2px 10px;");
  }
}

window.AutomationController = AutomationController;
