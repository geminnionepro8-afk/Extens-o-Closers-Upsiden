const fs = require('fs');
const path = "c:\\Users\\arthu\\Extens-o-Closers-Upsiden\\EXTENSÃO UPSIDEN - CLOSERS\\src\\ui\\modules\\crm.js";
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

// Replace lines 379 to 408 (Indices 378 to 407)
const newContent = `      <div class="modal-tabs">
         <div class="modal-tab active" data-tab="dados">Dados do Contato</div>
         <div class="modal-tab" data-tab="lembretes">Lembretes & Agenda</div>
         <div class="modal-tab" data-tab="tags">Tags & Automações</div>
         <div class="modal-tab" data-tab="historico">Histórico</div>
      </div>
      <div id="modal-tab-content">
         <div class="tab-pane active" id="tab-dados" style="padding-top: 20px;">
             <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="det-nome" value="\${l.nome || ''}">
             </div>
             <div style="display:flex;gap:12px;">
               <div class="form-group" style="flex:1;">
                  <label>Estágio no Pipeline</label>
                  <select id="det-estagio">
                     \${dynamicStages.map(s => \`<option value="\${s.id}" \${s.id === l.etapa || s.id === l.estagio ? 'selected' : ''}>\${s.label}</option>\`).join('')}
                  </select>
               </div>
               <div class="form-group" style="flex:1;">
                  <label>Prioridade / Urgência</label>
                  <select id="det-urgencia" style="border-color:\${(URGENCY_LEVELS[l.urgencia] || URGENCY_LEVELS.normal).color};">
                     \${urgOptions}
                  </select>
               </div>
             </div>
             <div class="form-group">
                <label>Valor do Negócio (R$)</label>
                <input type="number" id="det-valor" value="\${l.valor || 0}">
             </div>
         </div>
      </div>`.split('\n');

lines.splice(378, 30, ...newContent);

fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
console.log('Fixed crm.js with line index');
