/**
 * @file helper.js
 * @description Utilitários Globais da Upsiden.
 * @module Módulo Core - Utilitários
 */

const UpsidenHelpers = {
  /**
   * getSmartDelay
   * Gera um atraso aleatório com base em milissegundos para simular comportamento humano (Jitter).
   * Varia entre 80% e 120% do tempo base para evitar detecção algorítmica.
   * @param {number} baseMs Tempo base em milissegundos
   * @returns {number} Delay calculado em milissegundos
   */
  getSmartDelay: function(baseMs) {
    const jitter = Math.random() * 0.4 + 0.8; // Multiplicador entre 0.8 e 1.2
    return Math.floor(baseMs * jitter);
  }
};

window.UpsidenHelpers = UpsidenHelpers;
