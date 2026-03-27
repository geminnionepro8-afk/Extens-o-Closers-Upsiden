/**
 * @file flow-runner.js
 * @description Roteador/Executor de Fluxos Visuais injetado no WPP Web.
 * Navega pelos Nodes e Edges para disparar ações, agendar delays, checar condições e aguardar respostas.
 */

window.FlowRunner = {
  
  // Mapa de sessões: { '5511999999999@c.us': { waitingForReply: true, resolveWait: func, lastMessageObj: msg } }
  activeSessions: {},

  /**
   * Inicia a execução do fluxo para um dado contato (chatId).
   */
  async startFlow(flow, chatId, triggerKeyword = null) {
    if (!flow || !flow.nodes_json || !flow.edges_json) {
      console.error('[FlowRunner] Fluxo inválido.', flow);
      return;
    }
    
    // Inicia a sessão se não existir
    if (!this.activeSessions[chatId]) this.activeSessions[chatId] = {};
    
    // 1. Encontrar o nó inicial (Trigger Manual ou Keyword)
    let startNodes = flow.nodes_json.filter(n => n.type === 'trigger' || n.type === 'keyword');
    
    if (triggerKeyword) {
      startNodes = startNodes.filter(n => n.type === 'keyword' && n.data?.keyword?.toLowerCase() === triggerKeyword.toLowerCase());
    }
    
    // Se há gatilho correspondente
    for (const node of startNodes) {
      console.log(`[FlowRunner] Iniciando fluxo '${flow.name}' pelo nó id: ${node.id}`);
      this.executeNode(node, flow, chatId);
    }
  },

  /**
   * Avalia e executa um único nó, e prossegue nas arestas conectadas baseadas em handles (true/false, etc).
   */
  async executeNode(node, flow, chatId) {
    console.log(`[FlowRunner] Executando Nó: [${node.type}] (id: ${node.id}) para ${chatId}`);
    
    let sourceHandleId = null; // Para onde devo seguir depois desse nó? null = segue o default.

    try {
      // 1. Mensagem de Texto (Integra o motor de Follow-ups nativo)
      if (node.type === 'message') {
        const text = node.data?.text || '';
        if (text) {
          await window.AutomationController.executeSequentialFollowup(chatId, [{ tipo: 'texto', conteudo: text, simular_digitacao: true }], '');
        }
      } 
      // 2. Mensagem de Áudio Nativo Modulado
      else if (node.type === 'audio') {
        const audioId = node.data?.audioId;
        if (audioId) {
           // Posta para a extensão a requisição de injeção de base64 pelo Supabase (A API precisa buscar).
           // Idealmente InjetorWPP já sabe como pegar o arquivo do banco, ou o painel postMessage.
           window.postMessage({ origem: 'FLOW_RUNNER', ev: 'dispatch_audio', chatId, audioId }, '*');
        }
      }
      // 3. Delay Simples
      else if (node.type === 'delay') {
        let secs = parseInt(node.data?.seconds) || 5;
        let delayMs = secs * 1000;
        
        const outgoingEdges = flow.edges_json.filter(e => e.source === node.id);
        
        // Suporte a Alarmes Background para delays gigantes (> 5 minutos)
        if (delayMs > 300000 && outgoingEdges.length > 0) {
            console.log(`[FlowRunner] Delay longo (${secs}s), transferindo carga para Background Worker...`);
            window.postMessage({
               origem: 'INJETOR_PAGINA',
               ev: 'schedule_bg_flow',
               task: { flow: flow, chatId: chatId, nextNodeId: outgoingEdges[0].target, targetTime: Date.now() + delayMs }
            }, '*');
            return; // Morre aqui na thread da página, renasce no background
        } else {
            console.log(`[FlowRunner] Node Delay - Aguardando ${secs}s...`);
            await new Promise(r => setTimeout(r, delayMs));
        }
      }
      // 4. Aguardar Resposta (O Coração Multi-Steps / Timeouts do Fluxo)
      else if (node.type === 'wait_reply') {
         let timeoutSecs = parseInt(node.data?.timeout) || 3600; // 1 hr default
         console.log(`[FlowRunner] Agendando espera (Timeout: ${timeoutSecs}s)`);
         
         const msgRcvd = await this.waitForMessage(chatId, timeoutSecs * 1000);
         
         if (msgRcvd === null) {
            console.log(`[FlowRunner] Timeout atingido! Indo para handle de timeout.`);
            sourceHandleId = 'timeout'; // Siga aresta amarrada na bola vermelha
         } else {
            console.log(`[FlowRunner] Mensagem recebida ('${msgRcvd.body}'). Indo para handle de response.`);
            // Cache da resposta no state para o nó condição!
            if (!this.activeSessions[chatId]) this.activeSessions[chatId] = {};
            this.activeSessions[chatId].lastMessageObj = msgRcvd;
            
            sourceHandleId = 'response'; // Siga aresta amarrada na bola verde
         }
      }
      // 5. Bloco de Ramificação Condicional (If/Else Visual)
      else if (node.type === 'condition') {
         const lastMsg = this.activeSessions[chatId]?.lastMessageObj?.body || this.activeSessions[chatId]?.lastMessageObj?.text || '';
         const op = node.data?.operator || 'equals';
         const val = node.data?.value || '';
         
         let match = false;
         if (op === 'equals') match = (lastMsg.toLowerCase() === val.toLowerCase());
         if (op === 'contains') match = lastMsg.toLowerCase().includes(val.toLowerCase());
         if (op === 'regex') match = new RegExp(val, 'i').test(lastMsg);
         
         console.log(`[FlowRunner] Avaliação de Condição ('${lastMsg}' ${op} '${val}') -> Resultado: ${match}`);
         sourceHandleId = match ? 'true' : 'false';
      }

      // Procura próximos passos (Arestas que saem deste nó)
      this.followOutgoingEdges(node, flow, chatId, sourceHandleId);

    } catch (err) {
      console.error(`[FlowRunner] Erro ao executar nó ${node.id}:`, err);
    }
  },

  /**
   * Traça as Rotas baseado nas Edges SVG que o construtor conectou.
   */
  followOutgoingEdges(node, flow, chatId, filteredSourceHandle) {
     let outgoingEdges = flow.edges_json.filter(e => e.source === node.id);
      
     // Multi-Handle Filter: Se a execução gerou uma escolha (True/False ou Resposta/Timeout)
     if (filteredSourceHandle) {
         // Importante: No front-end do Flow Builder, os portos de saída terão "id" como handle-out-true
         outgoingEdges = outgoingEdges.filter(e => String(e.sourceHandle || '').includes(filteredSourceHandle));
     }

     for (const edge of outgoingEdges) {
         const nextNode = flow.nodes_json.find(n => n.id === edge.target);
         if (nextNode) {
             // Deixa o event loop respirar antes do próximo pulo
             setTimeout(() => {
                 this.executeNode(nextNode, flow, chatId);
             }, 50);
         }
     }
  },

  /**
   * Promessa assíncrona que interliga com a Injeção de AutomationController.
   */
  async waitForMessage(chatId, timeoutMs) {
      if (!this.activeSessions[chatId]) this.activeSessions[chatId] = {};

      return new Promise(resolve => {
          // Timer de morte
          let timerId = setTimeout(() => {
              if (this.activeSessions[chatId]) {
                  this.activeSessions[chatId].waitingForReply = false;
                  this.activeSessions[chatId].resolveWait = null;
              }
              resolve(null);
          }, timeoutMs);

          // Armadilha pendente
          this.activeSessions[chatId].waitingForReply = true;
          this.activeSessions[chatId].resolveWait = (msg) => {
              clearTimeout(timerId); // Desarma a bomba
              this.activeSessions[chatId].waitingForReply = false;
              this.activeSessions[chatId].resolveWait = null;
              resolve(msg); // Devolve quem disparou
          };
      });
  },
  
  /**
   * Desperta fluxos que dormiram no background (Delays de muitas horas).
   */
  async resumeBgFlow(task) {
    if (!task || !task.flow || !task.chatId || !task.nextNodeId) return;
    
    console.log(`[FlowRunner] ⏰ DESPERTADOR: Retomando fluxo '${task.flow.name}' nó ${task.nextNodeId} do lead ${task.chatId}`);
    
    const nextNode = task.flow.nodes_json.find(n => n.id === task.nextNodeId);
    if (nextNode) {
      this.executeNode(nextNode, task.flow, task.chatId);
    }
  }

};
