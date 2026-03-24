/**
 * @file metrics.service.js
 * @description Wrapper de Métricas utilizando o Supabase SDK oficial.
 * @module Módulo 07: Serviços (Analytics)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

class UpsidenMetrics {
  static async logEvent(evento, metadata = {}) {
    try {
      const uid = await UpsidenAuth.getUserId();
      if (!uid) return;
      const { error } = await supabaseClient.from('metrics').insert({
        user_id: uid,
        evento: evento,
        metadata: metadata
      });
      if (error) console.error('Erro métrica:', error);
    } catch(e) { /* ignore */ }
  }

  static async getTeamMetrics(startDate, endDate) {
    let query = supabaseClient.from('metrics')
      .select('*, profiles:user_id(nome, role)');

    if (startDate) query = query.gte('created_at', startDate.toISOString());
    if (endDate) query = query.lte('created_at', endDate.toISOString());

    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  }

  static async getDashboardData(period = '7d') {
    const end = new Date();
    const start = new Date();
    if (period === '7d') start.setDate(start.getDate() - 7);
    if (period === '30d') start.setDate(start.getDate() - 30);
    
    // Fetch metrics
    const rawMetrics = await this.getTeamMetrics(start, end);
    
    // 1. Resumo Geral
    const summary = {
      msgs: rawMetrics.filter(m => m.evento === 'message_sent').length,
      audios: rawMetrics.filter(m => m.evento === 'audio_sent').length,
      docs: rawMetrics.filter(m => m.evento === 'doc_sent').length,
      leads: rawMetrics.filter(m => m.evento === 'lead_created').length,
    };

    // 2. Ranking de Closers
    const closersMap = {};
    rawMetrics.forEach(m => {
      if (!m.profiles) return;
      const nome = m.profiles.nome || 'Desconhecido';
      if (!closersMap[nome]) closersMap[nome] = { nome, msgs: 0, leads: 0, sessoes: 0, time_to_reply: [] };
      if (m.evento.includes('_sent')) closersMap[nome].msgs++;
      if (m.evento === 'lead_created') closersMap[nome].leads++;
      if (m.evento === 'session_start') closersMap[nome].sessoes++;
      if (m.evento === 'message_sent' && m.metadata && m.metadata.reply_time_ms) {
        closersMap[nome].time_to_reply.push(m.metadata.reply_time_ms);
      }
    });
    
    const ranking = Object.values(closersMap).map(c => {
      const avgReply = c.time_to_reply.length > 0 
        ? c.time_to_reply.reduce((a,b)=>a+b,0) / c.time_to_reply.length 
        : 0;
      return { ...c, avgReplyStr: avgReply > 0 ? (avgReply / 1000 / 60).toFixed(1) + ' min' : 'N/A' };
    }).sort((a,b) => b.msgs - a.msgs);

    // 3. Gráficos de Atividade (Por dia)
    const chartMap = {};
    // Pre fill days
    for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) {
      chartMap[d.toISOString().split('T')[0]] = { msgs: 0, leads: 0 };
    }
    rawMetrics.forEach(m => {
      const day = m.created_at.split('T')[0];
      if (chartMap[day]) {
        if (m.evento.includes('_sent')) chartMap[day].msgs++;
        if (m.evento === 'lead_created') chartMap[day].leads++;
      }
    });

    // 4. Taxa de conversão Funil (Leads movidos vs criados)
    const funnelMoved = rawMetrics.filter(m => m.evento === 'lead_funnel_moved').length;
    const conversionRate = summary.leads > 0 ? ((funnelMoved / summary.leads) * 100).toFixed(1) : 0;

    return {
      summary,
      ranking,
      chartData: Object.keys(chartMap).map(date => ({ date, ...chartMap[date] })),
      conversionRate
    };
  }
}
