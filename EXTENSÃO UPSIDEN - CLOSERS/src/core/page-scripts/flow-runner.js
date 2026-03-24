/**
 * @file flow-runner.js
 * @description Roteador/Executor de Fluxos Visuais injetado no WPP Web.
 * Navega pelos Nodes e Edges para disparar ações, agendar delays e checar condições.
 */

window.FlowRunner = {
  
  /**
   * Inicia a execução do fluxo para um dado contato (chatId).
   * @param {Object} flow - Objeto do fluxo salvo (com .nodes_json e .edges_json)
   * @param {String} chatId - '5511999999999@c.us'
   * @param {String} triggerKeyword - Caso tenha sido acionado por palavra-chave
   */
  async startFlow(flow, chatId, triggerKeyword = null) {
    if (!flow || !flow.nodes_json || !flow.edges_json) {
      console.error('[FlowRunner] Fluxo invalido.', flow);
      return;
    }
    
    // 1. Encontrar o nó inicial (Trigger Manual ou Keyword)
    let startNodes = flow.nodes_json.filter(n => n.type === 'trigger' || n.type === 'keyword');
    
    if (triggerKeyword) {
      startNodes = startNodes.filter(n => n.type === 'keyword' && n.data?.keyword?.toLowerCase() === triggerKeyword.toLowerCase());
    }
    
    // Se há gatilho correspondente
    for (const node of startNodes) {
      console.log(`[FlowRunner] Iniciando fluxo '${flow.name}' pelo nó id: ${node.id}`);
      await this.executeNode(node, flow, chatId);
    }
  },

  /**
   * Avalia e executa um único nó, e prossegue nas arestas conectadas
   */
  async executeNode(node, flow, chatId) {
    console.log(`[FlowRunner] Executando Nó: [${node.type}] (id: ${node.id}) para ${chatId}`);
    
    try {
      if (node.type === 'message') {
        const text = node.data?.text || '';
        if (text) {
          await this._simulateTyping(chatId, text.length * 30); // 30ms por caractere
          await window.InjetorWPP.enviarMensagemTexto(chatId, text);
        }
      } 
      else if (node.type === 'audio') {
        const audioId = node.data?.audioId;
        if (audioId) {
          await this._simulateRecording(chatId, 3000); // Finge gravar por 3s
          // OBS: Enviar áudio requer buscar a Blob do Supabase. O Injetor tem api para isso?
          // Supondo que InjetorWPP tem um método genérico ou disparar postMessage
          window.postMessage({ origem: 'FLOW_RUNNER', ev: 'dispatch_audio', chatId, audioId }, '*');
        }
      }
      else if (node.type === 'delay') {
        let secs = parseInt(node.data?.delay) || 5;
        let delayMs = secs * 1000;
        
        const outgoingEdges = flow.edges_json.filter(e => e.source === node.id);
        
        if (delayMs > 300000 && outgoingEdges.length > 0) {
            console.log(`[FlowRunner] Delay muito longo (${secs}s), agendando tarefa no Background...`);
            window.postMessage({
               origem: 'INJETOR_PAGINA',
               ev: 'schedule_bg_flow',
               task: {
                  flow: flow,
                  chatId: chatId,
                  nextNodeId: outgoingEdges[0].target,
                  targetTime: Date.now() + delayMs
               }
            }, '*');
            return; // Interrompe arvore de execução local
        } else {
            console.log(`[FlowRunner] Node Timeout/Delay - Aguardando ${secs}s...`);
            await new Promise(r => setTimeout(r, delayMs));
        }
      }
      else if (node.type === 'condition') {
        // Ex: Checar se o contato tem uma tag no CRM local.
        const requiredTag = node.data?.tag;
        // Se a tag não for 'VIP' e precisarmos de 'VIP', nós paramos o fluxo (ou ramificamos).
        // Por simplificação (MVP do flow), apenas continua a edge se a condição for metida.
        // Simularemos validado:
        console.log(`[FlowRunner] Condição avaliada: ${requiredTag}`);
      }
      
      // Procura próximos passos (Arestas que saem deste nó)
      const outgoingEdges = flow.edges_json.filter(e => e.source === node.id);
      
      for (const edge of outgoingEdges) {
        const nextNode = flow.nodes_json.find(n => n.id === edge.target);
        if (nextNode) {
          // Executa em cadeia
          // Atenção: para evitar CallStack issues em grafos muito longos, usar setTimeout
          setTimeout(() => {
            this.executeNode(nextNode, flow, chatId);
          }, 50);
        }
      }
    } catch (err) {
      console.error(`[FlowRunner] Erro ao executar nó ${node.id}:`, err);
    }
  },
  
  /**
   * Ponto de entrada chamado pelo WPP Engine/Background 
   * quando um cronjob desperta esta aba do WhatsApp Web.
   */
  async resumeBgFlow(task) {
    if (!task || !task.flow || !task.chatId || !task.nextNodeId) return;
    
    console.log(`[FlowRunner] ⏰ CRON DESPERTADO: Retomando fluxo '${task.flow.name}' a partir do nó ${task.nextNodeId} para o lead ${task.chatId}`);
    
    const nextNode = task.flow.nodes_json.find(n => n.id === task.nextNodeId);
    if (nextNode) {
      this.executeNode(nextNode, task.flow, task.chatId);
    }
  },
  
  // -- Auxiliary -- //
  
  async _simulateTyping(chatId, ms) {
    console.log('[FlowRunner] Simulando digitando...');
    if (window.WPP && window.WPP.chat && window.WPP.chat.markIsRead) {
      window.WPP.chat.markIsRead(chatId);
      window.WPP.chat.markIsComposing(chatId, ms);
    }
    return new Promise(r => setTimeout(r, ms));
  },
  
  async _simulateRecording(chatId, ms) {
    console.log('[FlowRunner] Simulando gravando áudio...');
    if (window.WPP && window.WPP.chat && window.WPP.chat.markIsRecording) {
      window.WPP.chat.markIsRead(chatId);
      window.WPP.chat.markIsRecording(chatId, ms);
    }
    return new Promise(r => setTimeout(r, ms));
  }

};
