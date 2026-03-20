const fs = require('fs');
let code = fs.readFileSync('EXTENSÃO UPSIDEN - CLOSERS/painel.js', 'utf8');

// Find all data-click function names that are called
const dataClickCalls = new Set();
const regex = /data-click="([a-zA-Z0-9_]+)\(/g;
let m;
while ((m = regex.exec(code)) !== null) {
  dataClickCalls.add(m[1]);
}
console.log('Funções referenciadas por data-click:', [...dataClickCalls]);

// Check which are already window.* or already global  
const globalFns = new Set();
const windowFnRegex = /window\.([a-zA-Z0-9_]+)\s*=/g;
while ((m = windowFnRegex.exec(code)) !== null) {
  globalFns.add(m[1]);
}
console.log('Já globais (window.):', [...globalFns]);

// Find ones that are NOT global
const missing = [...dataClickCalls].filter(fn => !globalFns.has(fn));
console.log('Precisam ser expostas globalmente:', missing);

// For each missing, check if a regular function declaration exists
missing.forEach(fn => {
  const funcDecl = new RegExp(`function\\s+${fn}\\s*\\(`);
  if (funcDecl.test(code)) {
    console.log(`  -> ${fn}: encontrada declaração, expondo com window.${fn} = ${fn}`);
  } else {
    console.log(`  -> ${fn}: NÃO encontrada declaração!`);
  }
});

// Expose missing functions by appending window aliases before the event delegation block
const exposures = missing
  .filter(fn => new RegExp(`function\\s+${fn}\\s*\\(`).test(code))
  .map(fn => `window.${fn} = ${fn};`)
  .join('\n');

if (exposures) {
  const marker = '// ═══ EVENT DELEGATION';
  const idx = code.indexOf(marker);
  if (idx > -1) {
    code = code.substring(0, idx) + '// Expor funções para event delegation\n' + exposures + '\n\n' + code.substring(idx);
    console.log('Funções expostas!');
  }
}

fs.writeFileSync('EXTENSÃO UPSIDEN - CLOSERS/painel.js', code);
console.log('Done!');
