const fs = require('fs');

let code = fs.readFileSync('EXTENSÃO UPSIDEN - CLOSERS/painel.js', 'utf8');

// 1. Substituir autoSubTab inline
code = code.replace(/onclick="window\.autoSubTab='([^']+)';renderAutomacoes\(document\.getElementById\('main-content'\)\)"/g, 'data-click="switchTab(\\'$1\\')"');

// 2. Substituir campSubTab inline
code = code.replace(/onclick="window\.campSubTab='([^']+)';renderCampanhas\(document\.getElementById\('main-content'\)\)"/g, 'data-click="switchCampTab(\\'$1\\')"');

// 3. Navigate inline (e.stopPropagation();navigate('...'))
code = code.replace(/onclick="event\.stopPropagation\(\);navigate\('([^']+)'\)"/g, 'data-click="navigate(\\'$1\\')"');

// 4. Navigate normal
code = code.replace(/onclick="navigate\('([^']+)'\)"/g, 'data-click="navigate(\\'$1\\')"');

// 5. This closest remove
code = code.replace(/onclick="this\.closest\('\\.modal-overlay'\\)\\.remove\\(\\)"/g, 'data-click="closeModal()"');

// 6. Generic onclick="func(args)" -> data-click="func(args)"
code = code.replace(/onclick="([a-zA-Z0-9_]+)\(([^")]*)\)"/g, 'data-click="$1($2)"');

const delegator = `
// ═══ EVENT DELEGATION (CSP COMPATIBLE) ═════════════════════════
window.switchTab = function(id) {
  window.autoSubTab = id;
  renderAutomacoes(document.getElementById('main-content'));
};

window.switchCampTab = function(id) {
  window.campSubTab = id;
  renderCampanhas(document.getElementById('main-content'));
};

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
      console.warn('Função não encontrada globalmente:', fnName);
    }
  }
});
`;

if (!code.includes('EVENT DELEGATION (CSP COMPATIBLE)')) {
  code += '\n' + delegator;
}

fs.writeFileSync('EXTENSÃO UPSIDEN - CLOSERS/painel.js', code);
console.log('Painel.js refatorado!');
