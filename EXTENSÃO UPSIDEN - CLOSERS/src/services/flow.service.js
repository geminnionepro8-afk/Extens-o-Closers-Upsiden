/**
 * @file flow.service.js
 * @description Serviço para gerenciar operações CRUD de Fluxos (Flow Builder) no Supabase.
 */

window.FlowService = {
  
  /**
   * Salva ou atualiza um fluxo no banco de dados.
   * @param {Object} flowData Objeto contendo id, name, nodes (JSON), edges (JSON)
   */
  async saveFlow(flowData) {
    if (!window.supabaseClient) throw new Error('Supabase client não inicializado.');
    
    // Pega o ID do usuário (baseado no AuthService ou configData)
    const userId = window.configData?.userId || null;
    if (!userId) {
      console.warn('[FlowService] userId nulo, salvando sem vínculo estrito localmente para fins de dev.');
    }

    const payload = {
      id: flowData.id || `flow_${Date.now()}`,
      user_id: userId,
      name: flowData.name || 'Fluxo sem Nome',
      nodes_json: flowData.nodes,
      edges_json: flowData.edges,
      is_active: flowData.is_active !== undefined ? flowData.is_active : true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await window.supabaseClient
      .from('flows')
      .upsert(payload)
      .select();
      
    if (error) {
      console.error('[FlowService] Erro ao salvar fluxo:', error);
      throw error;
    }
    
    // Sincroniza estado para o Engine
    await this.syncToLocal();
    
    return data && data.length > 0 ? data[0] : payload;
  },

  /**
   * Retorna a lista de todos os fluxos do usuário.
   */
  async getFlows() {
    if (!window.supabaseClient) return [];
    
    const userId = window.configData?.userId || null;
    let query = window.supabaseClient.from('flows').select('*').order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[FlowService] Erro ao buscar fluxos:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Sincroniza a tabela flows do Supabase com o localStorage da extensão.
   * Chamado após salvar ou deletar, para que o WPP Engine (background) 
   * leia a configuração mais recente.
   */
  async syncToLocal() {
    try {
      const allFlows = await this.getFlows();
      chrome.storage.local.set({ ups_config_flows: allFlows }, () => {
         console.log('[FlowService] Cache local de fluxos atualizado. Total:', allFlows.length);
      });
    } catch (e) {
      console.error('[FlowService] Erro no syncToLocal:', e);
    }
  },

  /**
   * Deleta um fluxo.
   */
  async deleteFlow(flowId) {
    if (!window.supabaseClient) return false;
    
    const { error } = await window.supabaseClient
      .from('flows')
      .delete()
      .eq('id', flowId);
      
    if (error) {
      console.error('[FlowService] Erro ao deletar fluxo:', error);
      return false;
    }
    
    await this.syncToLocal();
    return true;
  }
};
