require('child_process').exec('node -c "EXTENSÃO UPSIDEN - CLOSERS\\\\painel.js"', (err, stdout, stderr) => {
  require('fs').writeFileSync('err.utf8.txt', stderr || 'OK - sem erros de sintaxe', 'utf8');
  console.log(stderr || 'OK - sem erros de sintaxe');
});
