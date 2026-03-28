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
    if (payload.flows !== undefined) this.config.flows = payload.flows; // Used by flow builder LocalStorage sync
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
   * Normaliza o ID do chat para string (_serialized).
   */
  static normalizeChatId(id) {
    if (!id) return '';
    if (typeof id === 'string') return id;
    return id._serialized || String(id);
  }

  /**
   * Recebe mensagens DO WPP Engine e delega lógica de Triggers ou Saudação.
   */
  static async handleIncomingMessage(msg, chatName) {
    this.limparCacheDiario();
    
    const isGroup = !!msg.isGroupMsg;
    const rawChatId = (msg.id && msg.id.remote) || msg.from || (msg.chatId && msg.chatId._serialized) || msg.chatId;
    const chatId = this.normalizeChatId(rawChatId);
    if (!chatId) return;

    const textoRecebido = (msg.body || msg.text || msg.content || '').trim().toLowerCase();

    if (this.DEBUG_MODE) console.log(`[AutomationController] Msg de ${chatId}: "${textoRecebido}" (Grupo: ${isGroup})`);

    // 0. Interceptar Mensagens de Sessões Ativas (Flow Builder Wait For Reply)
    if (window.FlowRunner && window.FlowRunner.activeSessions && window.FlowRunner.activeSessions[chatId]) {
        const session = window.FlowRunner.activeSessions[chatId];
        if (session.waitingForReply && session.resolveWait) {
            console.log(`[AutomationController] Interceptando resposta para resolver Flow Node (Aguardar Resposta)`);
            session.resolveWait(msg);
            return; 
        }
    }

    // 1. REGRAS GLOBAIS
    const mockTags = msg.contactTags || []; 
    const ruleEvaluation = this.evaluateGlobalRules(mockTags, textoRecebido);
    if(ruleEvaluation.blocked) {
        console.log(`[AutomationController] Fluxo cancelado por Regra Global`);
        return;
    }

    // 2. Processar Fluxos Visuais (Version B)
    if (this.config.flows && this.config.flows.nodes && textoRecebido.length > 0) {
        const nodes = this.config.flows.nodes;
        const triggerNode = nodes.find(n => n.type === 'trigger' && n.data && n.data.palavra && textoRecebido.includes(String(n.data.palavra).toLowerCase()));
        
        if(triggerNode) {
            console.log('[Automation] Gatilho Visual Detectado:', triggerNode.data.palavra);
            const edge = (this.config.flows.edges || []).find(e => e.source === triggerNode.id);
            if(edge) {
                const nextNode = nodes.find(n => n.id === edge.target);
                if(nextNode && nextNode.data) {
                    // Se for um nó de resposta simples, executa. Se for o início de um fluxo complexo, o FlowRunner deveria assumir.
                    // Para compatibilidade, executamos a resposta do nó se disponível.
                    if (nextNode.data.resposta) {
                        await this.executeSequentialFollowup(chatId, [{ 
                            tipo: 'texto', 
                            delay_segundos: nextNode.data.delay || 1, 
                            duracaoSimulacao: nextNode.data.duracaoSimulacao || 2,
                            conteudo: nextNode.data.resposta 
                        }], chatName);
                    }
                }
            }
            return;
        }
    }

    // 3. Processar Triggers Clássicos (Simples)
    if (this.config.triggers && this.config.triggers.length > 0 && textoRecebido.length > 0) {
      for (const trig of this.config.triggers) {
        if (!trig.palavra) continue;
        if (!this.checkAllowedTarget(isGroup, trig.apenas_privado, trig.apenas_grupo)) continue;

        const palavraChave = String(trig.palavra).trim().toLowerCase();
        const condicao = trig.condicao || 'exata';
        let match = false;

        if (condicao === 'exata' && textoRecebido === palavraChave) match = true;
        else if (condicao === 'contem' && textoRecebido.includes(palavraChave)) match = true;

        if (match) {
          console.log(`[Automation] Gatilho Simples Detectado: ${palavraChave}`);
          
          let steps = [];
          try { 
              if (typeof trig.resposta === 'string' && (trig.resposta.startsWith('[') || trig.resposta.startsWith('{'))) {
                  const parsed = JSON.parse(trig.resposta);
                  steps = Array.isArray(parsed) ? parsed : [parsed];
              } else if (Array.isArray(trig.resposta)) {
                  steps = trig.resposta;
              } else {
                  steps = [{ tipo: 'texto', conteudo: trig.resposta, delay_segundos: 1, duracaoSimulacao: 2 }];
              }
          } catch(e) {
              steps = [{ tipo: 'texto', conteudo: String(trig.resposta), delay_segundos: 1, duracaoSimulacao: 2 }];
          }

          if (steps.length > 0) {
             await this.executeSequentialFollowup(chatId, steps, chatName);
          }
          return;
        }
      }
    }

    // 4. Processar Saudação
    const conf = this.config.saudacao;
    if (!conf || !conf.saudacao_ativa) return;
    if (!this.checkAllowedTarget(isGroup, conf.apenas_privado, conf.apenas_grupo)) return;

    if (this.chatsSaudados.has(chatId)) return;

    const schedule = this.checkSchedule(conf);
    
    if (schedule.msgFora && schedule.msg && schedule.msg.trim()) {
       await window.InjetorWPP.enviarTexto({ texto: this.parseTemplate(schedule.msg, chatName) }, chatId);
       this.chatsSaudados.add(chatId);
       return;
    }

    if (schedule.ativo) {
       console.log(`[Automation] Disparando Saudação para: ${chatId}`);
       this.chatsSaudados.add(chatId);
 
       const steps = [];
       if (conf.saudacao_mensagem && conf.saudacao_mensagem.trim()) {
           steps.push({ tipo: 'texto', delay_segundos: 1, conteudo: conf.saudacao_mensagem });
       }
       if (conf.followup_steps && Array.isArray(conf.followup_steps)) {
           conf.followup_steps.forEach(f => steps.push(f));
       }
 
       if (steps.length > 0) {
          await this.executeSequentialFollowup(chatId, steps, chatName);
       }
    }
  }

  /**
   * Helper IPC: Pede ao Background para baixar uma mídia (Bypass CSP)
   * e retornar o Base64 pronto para o WPP Engine.
   */
  static async syncFetchMedia(url) {
    try {
        console.info(`[Automation] Solicitando download via IPC: ${url.substring(0, 50)}...`);
        // Chama o buscador base64 do injetor principal (que sabe falar com o Content Script)
        const b64 = await window.InjetorWPP.requestBase64FromIPC(url);
        if (b64) return b64;
        throw new Error('Retorno vazio do IPC');
    } catch (e) {
        console.error(`[Automation] Erro crítico no download via IPC:`, e.message);
        return null;
    }
  }

  /**
   * Executa pipeline de envio sequencial (Texto, Áudio, Documentos)
   */
  static async executeSequentialFollowup(chatId, steps, chatName) {
    console.log(`[Automation] Iniciando Sequência (${steps.length} passos) para ${chatId}`);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const delaySeg = step.delay_segundos !== undefined ? step.delay_segundos : 2;
      
      // Delay de espera ANTES de começar a simulação do passo
      await new Promise(r => setTimeout(r, delaySeg * 1000));
      
      try {
        const payload = {
            ...step,
            duracaoSimulacao: (step.duracaoSimulacao || 2) * 1000 
        };

        let res = { sucesso: false, erro: 'Tipo de step inválido' };

        if (step.tipo === 'texto') {
           payload.texto = this.parseTemplate(step.conteudo || '', chatName);
           res = await window.InjetorWPP.enviarTexto(payload, chatId);
        }
        else if (step.tipo === 'audio') {
           payload.chatName = chatName;
           // Verificar se o conteúdo é uma URL ou Base64 puro
           const content = step.base64 || step.conteudo || '';
           if (content.startsWith('http')) {
               const b64 = await this.syncFetchMedia(content);
               if (b64) {
                   payload.base64 = b64;
                   res = await window.InjetorWPP.enviarAudio(payload, chatId);
               } else {
                   res = { sucesso: false, erro: 'Download do áudio falhou.' };
               }
           } else {
               payload.base64 = content;
               res = await window.InjetorWPP.enviarAudio(payload, chatId);
           }
        }
        else if (['documento', 'midia', 'imagem', 'video'].includes(step.tipo)) {
           payload.chatName = chatName;
           const content = step.base64 || step.conteudo || '';
           if (content.startsWith('http')) {
               const b64 = await this.syncFetchMedia(content);
               if (b64) {
                   payload.base64 = b64;
                   payload.tipo = step.mime || 'application/octet-stream'; // Tenta inferir ou usa fallback
                   res = await window.InjetorWPP.enviarArquivo(payload, chatId);
               } else {
                   res = { sucesso: false, erro: 'Download da mídia falhou.' };
               }
           } else {
               payload.base64 = content;
               res = await window.InjetorWPP.enviarArquivo(payload, chatId);
           }
        }

        if (res && !res.sucesso) {
            console.error(`[Automation] Erro no passo ${i+1} (${step.tipo}):`, res.erro);
        } else {
            console.log(`[Automation] Passo ${i+1} (${step.tipo}) enviado com sucesso.`);
        }
      } catch (e) { 
         console.error('[Automation] Exceção crítica no Pipeline:', e);
      }
    }
  }
}

window.AutomationController = AutomationController;
