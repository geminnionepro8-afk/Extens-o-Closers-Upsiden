/**
 * @file metrics.service.js
 * @description Wrapper de Métricas utilizando o Supabase SDK oficial.
 * @module Módulo 07: Serviços (Analytics)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

class UpsidenMetrics {
  static async logEvent(evento, metadata = {}) {
    const uid = await UpsidenAuth.getUserId();
    if (!uid) return;
    const { error } = await supabaseClient.from('metrics').insert({
      user_id: uid,
      evento: evento,
      metadata: metadata
    });
    if (error) console.error('Erro métrica:', error);
  }
}
