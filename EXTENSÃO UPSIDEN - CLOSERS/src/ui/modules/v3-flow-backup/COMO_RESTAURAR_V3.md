# Backup do Flow Builder v3 (Airy Refactoring) - 26/03/2026

Este diretório contém a versão v3.2.2 do Flow Builder que foi revertida para a v2. 
Se você desejar retornar para esta interface de alta fidelidade no futuro, siga estas instruções:

## Arquivos neste Backup:
- `flow.js`: Motor dinâmico v3 com suporte a propriedades avançadas e motor de arraste v2.
- `flow.html`: Interface baseada em herança pai/filho e painel de analytics integrado.
- `flow.css`: Estilo Airy (glassmorphism, padding generoso).
- `painel-flow.js`: Script de integração que injeta o Flow v3 no painel principal.

## Como Restaurar a v3:
1. Copie os arquivos `flow.js`, `flow.html` e `flow.css` deste diretório de volta para `src/ui/modules/`.
2. Copie o arquivo `painel-flow.js` deste diretório de volta para `src/ui/painel/`.
3. Recarregue a extensão.

**Nota:** Esta versão v3 foi deixada em estado funcional com sincronização dinâmica de metadados, mas revertida a pedido por não atender ao fluxo de trabalho desejado no momento.
