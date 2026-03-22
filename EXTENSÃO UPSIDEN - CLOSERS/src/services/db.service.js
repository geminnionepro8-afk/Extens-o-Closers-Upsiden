/**
 * @file db.service.js
 * @description Wrapper do Banco de Dados utilizando o Supabase SDK oficial com Queue Manager Anti-429.
 * @module Módulo 07: Serviços (Banco de Dados)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

class DBQueueManager {
  static queue = [];
  static processing = false;

  static async push(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this.process();
    });
  }

  static async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const { taskFn, resolve, reject } = this.queue.shift();
      try {
        const res = await taskFn();
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.data);
      } catch (err) {
        reject(err);
      }
      
      // Buffer Anti-429 (Jitter na requisição)
      await new Promise(r => setTimeout(r, 150)); 
    }
    
    this.processing = false;
  }
}

class UpsidenDB {
  static from(table) {
    const builder = supabaseClient.from(table);
    
    function createExecuteProxy(query) {
      return new Proxy(query, {
        get(target, prop) {
          if (prop === 'execute') {
            return async () => DBQueueManager.push(() => target);
          }
          if (prop === 'then') {
            return (resolve, reject) => {
              DBQueueManager.push(() => target)
                .then(resolve)
                .catch(reject);
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
