/**
 * @file template-engine.js
 * @description Template Engine centralizado para processamento de variáveis
 *              dinâmicas em templates de texto e mensagens automáticas.
 *              Suporta: {nome}, {primeiro_nome}, {sobrenome}, {saudacao_periodo},
 *              {data}, {hora}
 * @module Lote 09 — Biblioteca Pro (#54)
 * @adjusted Arquiteto Gemini — Smart Variables: {primeiro_nome} adicionado
 */

class TemplateEngine {
  /**
   * Processa um texto substituindo variáveis por valores reais.
   * @param {string} text - Texto com variáveis entre chaves
   * @param {Object} context - Dados do contato
   * @param {string} [context.nome] - Nome completo do contato
   * @param {string} [context.sobrenome] - Sobrenome do contato
   * @returns {string} Texto processado
   */
  static process(text, context = {}) {
    if (!text) return '';

    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

    // Smart Variable: extrai primeiro nome do nome completo
    const nomeCompleto = context.nome || 'Cliente';
    const primeiroNome = nomeCompleto.split(/\s+/)[0];

    return text
      // {primeiro_nome} — Architect adjustment
      .replace(/\{primeiro_nome\}/gi, primeiroNome)
      .replace(/\{\{primeiro_nome\}\}/gi, primeiroNome)
      // {nome} — nome completo
      .replace(/\{nome\}/gi, nomeCompleto)
      .replace(/\{\{nome\}\}/gi, nomeCompleto)
      // {sobrenome}
      .replace(/\{sobrenome\}/gi, context.sobrenome || '')
      .replace(/\{\{sobrenome\}\}/gi, context.sobrenome || '')
      // {saudacao_periodo}
      .replace(/\{saudacao_periodo\}/gi, saudacao)
      .replace(/\{\{saudacao_periodo\}\}/gi, saudacao)
      // {data}
      .replace(/\{data\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{data\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      // {hora}
      .replace(/\{hora\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      .replace(/\{\{hora\}\}/gi, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  /**
   * Retorna HTML de preview com variáveis destacadas
   * @param {string} text - Texto com variáveis
   * @returns {string} HTML com spans coloridos
   */
  static preview(text) {
    if (!text) return '';
    return text.replace(/\{?\{(\w+)\}?\}/g, '<span style="color:#00a884;font-weight:600;background:rgba(0,168,132,0.15);padding:0 4px;border-radius:3px;">$1</span>');
  }

  /**
   * Lista todas as variáveis suportadas
   * @returns {Array<{key: string, desc: string}>}
   */
  static getVariables() {
    return [
      { key: '{nome}', desc: 'Nome completo do contato' },
      { key: '{primeiro_nome}', desc: 'Primeiro nome (extraído do nome completo)' },
      { key: '{sobrenome}', desc: 'Sobrenome do contato' },
      { key: '{saudacao_periodo}', desc: 'Bom dia / Boa tarde / Boa noite' },
      { key: '{data}', desc: 'Data atual (DD/MM/AAAA)' },
      { key: '{hora}', desc: 'Hora atual (HH:MM)' }
    ];
  }
}

// Exporta globalmente para uso em Page Scripts
if (typeof window !== 'undefined') window.TemplateEngine = TemplateEngine;
