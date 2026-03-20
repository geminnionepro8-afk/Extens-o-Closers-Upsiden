const fs = require('fs');
let code = fs.readFileSync('EXTENSÃO UPSIDEN - CLOSERS/painel.js', 'utf8');

// Remove old duplicate block
const startMarker = '// ═══ AUTOMATION CONFIG ═══════════════════════════════════════';
const endMarker = '// ═══ INIT ═══';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx > -1 && endIdx > -1 && endIdx > startIdx) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
  console.log('Removido bloco duplicado entre AUTOMATION CONFIG e INIT');
} else {
  console.log('Bloco não encontrado:', startIdx, endIdx);
}

// Convert remaining onclick in modal templates to addEventListener pattern
// Template modal
code = code.replace(
  /onclick="this\.closest\('\.modal-overlay'\)\.remove\(\)"/g,
  'data-click="closeModal()"'
);
code = code.replace(
  /onclick="salvarTemplate\('([^']*)'\)"/g, 
  'data-click="salvarTemplate(\'$1\')"'
);
code = code.replace(
  /onclick="salvarLead\(\)"/g,
  'data-click="salvarLead()"'
);
code = code.replace(
  /onclick="showNewTemplateModal\(\)"/g,
  'data-click="showNewTemplateModal()"'
);
code = code.replace(
  /onclick="showNewLeadModal\(\)"/g,
  'data-click="showNewLeadModal()"'
);
code = code.replace(
  /onclick="editTemplate\('([^']*)'\)"/g,
  'data-click="editTemplate(\'$1\')"'
);
code = code.replace(
  /onclick="deleteItem\('([^']*)',\s*'([^']*)'\)"/g,
  'data-click="deleteItem(\'$1\',\'$2\')"'
);
code = code.replace(
  /onchange="toggleShare\('([^']*)',\s*'([^']*)',\s*this\.checked\)"/g,
  'data-change="toggleShare(\'$1\',\'$2\')"'
);

// Add event delegation for closeModal + other global functions if not present
if (!code.includes('EVENT DELEGATION')) {
  code += `
// ═══ EVENT DELEGATION (CSP COMPATIBLE) ═════════════════════════
window.closeModal = function() {
  document.querySelector('.modal-overlay')?.remove();
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-click]');
  if (!btn) return;
  e.stopPropagation();

  const action = btn.getAttribute('data-click');
  const match = action.match(/^([a-zA-Z0-9_]+)\\((.*?)\\)$/);

  if (match) {
    const fnName = match[1];
    let argsStr = match[2];
    let args = [];
    if (argsStr) {
      args = argsStr.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (typeof window[fnName] === 'function') {
      window[fnName](...args);
    } else {
      console.warn('[Painel] Função não encontrada:', fnName);
    }
  }
});
`;
}

fs.writeFileSync('EXTENSÃO UPSIDEN - CLOSERS/painel.js', code);
console.log('Painel.js limpo e finalizado!');
