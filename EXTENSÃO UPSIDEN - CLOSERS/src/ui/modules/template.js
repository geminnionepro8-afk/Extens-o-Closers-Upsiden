/**
 * @file template.js
 * @description 'Forma de Bolo' (Base Module) para as janelas de interface (Iframes) injetados no WhatsApp.
 * @module Módulo de UI - Template Base
 */

class UpsidenModule {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.chatId = null;
    this.chatName = null;
  }

  /**
   * Inicializa o ciclo de vida do módulo.
   */
  init() {
    console.log(`[Upsiden Module] Inicializando ${this.moduleName}`);
    this.bindEvents();
    
    // Escuta dados do chat ativo vindos do Injetor (WPP Engine)
    window.addEventListener('message', (ev) => {
      if (ev.data?.type === 'init_chat_data') {
        this.chatId = ev.data.chatId;
        this.chatName = ev.data.nome;
        this.updateUI();
      }
    });

    // Solicita os dados do chat ativo ao carregar
    window.parent.postMessage({ type: 'upsiden_get_active_chat' }, '*');
  }

  /**
   * Método abstrato: Deve ser sobrescrito pelas classes filhas para
   * o registro dos eventos de cliques (listeners).
   */
  bindEvents() {
    console.warn(`[Upsiden Module] O módulo ${this.moduleName} não implementou bindEvents().`);
  }

  /**
   * Método abstrato: Deve ser sobrescrito pelas classes filhas para
   * atualizar a interface quando o chat mudar ou os dados carregarem.
   */
  updateUI() {
    console.warn(`[Upsiden Module] O módulo ${this.moduleName} não implementou updateUI().`);
  }

  /**
   * Envia um arquivo/áudio usando a ponte IPC, passando pela validação Anti-Detection.
   * @param {Object} fileData Dados do arquivo e da mensagem
   */
  async sendFile(fileData) {
    if (!this.chatId) return alert('Selecione um chat no WhatsApp primeiro.');
    window.parent.postMessage({ 
      type: 'upsiden_send_file', 
      data: { chatId: this.chatId, ...fileData } 
    }, '*');
  }

  /**
   * Envia um texto puro usando a ponte IPC.
   * @param {string} text Texto da mensagem
   */
  async sendText(text) {
    if (!this.chatId) return alert('Selecione um chat no WhatsApp primeiro.');
    window.parent.postMessage({ 
      type: 'upsiden_send_text', 
      data: { chatId: this.chatId, text } 
    }, '*');
  }
}

window.UpsidenModule = UpsidenModule;
