/**
 * @file db.service.js
 * @description Wrapper do Banco de Dados utilizando o Supabase SDK oficial.
 * @module Módulo 07: Serviços (Banco de Dados)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

class UpsidenDB {
  static from(table) {
    const builder = supabaseClient.from(table);
    
    function createExecuteProxy(query) {
      return new Proxy(query, {
        get(target, prop) {
          if (prop === 'execute') {
            return async () => {
              const res = await target;
              if (res.error) throw new Error(res.error.message); return res.data;
            };
          }
          if (prop === 'then') {
            return (resolve, reject) => {
              target.then(res => {
                if (res.error) reject(new Error(res.error.message)); else resolve(res.data);
              }).catch(reject);
            };
          }
          const val = target[prop];
          if (typeof val === 'function') {
            return (...args) => createExecuteProxy(val.apply(target, args));
          }
          return val;
        }
      });
    }

    const wrapper = {};
    ['select', 'insert', 'update', 'delete', 'upsert'].forEach(method => {
      wrapper[method] = function(...args) {
        return createExecuteProxy(builder[method].apply(builder, args));
      };
    });
    return wrapper;
  }
}
