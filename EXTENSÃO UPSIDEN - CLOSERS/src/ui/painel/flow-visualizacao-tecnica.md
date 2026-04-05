# Visualização de Fluxo — Especificação Técnica

## Objetivo

Implementar uma visualização prévia fiel da estrutura interna dos fluxos no dashboard de automações, com suporte a:

- renderização completa de nós e conexões reais;
- auto-alinhamento de grafos;
- zoom e navegação (pan);
- atualização em tempo real após alterações;
- múltiplos tipos de elementos (nós padrão, condições e loops);
- indicadores visuais de status/propriedades;
- testes unitários de lógica de visualização.

## Arquitetura

### Módulo principal

- Arquivo: `src/ui/painel/painel-automacoes.js`
- Funções centrais:
  - `normalizeFlowGraph(flow)`: normaliza `nodes_json/nodes` e `edges_json/edges`.
  - `buildAutoLayout(graph)`: layout automático por camadas (topologia + fallback para ciclos).
  - `computePreviewViewport(nodes, width, height, state)`: cálculo de enquadramento e escala base.
  - `drawSingleFlowPreview(container, flow)`: renderer final de nós/arestas.
  - `bindFlowPreviewInteractions(container, flow)`: eventos de zoom/pan e controle de auto-align.
  - `initFlowPreviewRenderers(flows)`: inicialização dos previews após render dos cards.
  - `runFlowPreviewUnitTests()`: suíte de testes unitários da camada de visualização.

### Estilos e camadas visuais

- Arquivo: `src/ui/painel/painel-automacoes.css`
- Blocos principais:
  - `.flow-preview-controls`: controles de navegação (+, -, reset e auto-align).
  - `.mini-edges-svg` + `.mini-edges-group`: camada SVG de conexões.
  - `.mini-nodes-layer`: camada DOM para nós.
  - `.mini-node-*`: variações semânticas por tipo.
  - `.mini-node-indicator`: indicador de status/propriedade por nó.
  - `.edge-kind-*`: variações visuais por tipo de conexão (true/false/loop/default).

### Atualização em tempo real

- Em `src/ui/modules/flow.js`, após persistência:
  - dispara evento `upsiden:flow-updated`.
- Em `src/ui/painel/painel-automacoes.js`:
  - listener re-renderiza dashboard automaticamente se aba ativa for `flow_builder`.

## Comportamento Funcional

## 1) Renderização fiel do fluxo

- A prévia usa os dados reais (`nodes_json`/`edges_json`) da entidade de fluxo.
- Não existe simulação com linhas decorativas fixas.
- Quantidade de nós e conexões renderizadas é validada por QA e unit tests.

## 2) Auto-alinhamento

- Modo opcional por card (`A` nos controles).
- Estratégia:
  - calcula indegree por nó;
  - distribui por camadas via fila topológica;
  - aplica fallback para componentes cíclicos (loops).
- Resultado:
  - visual limpo para fluxos sem coordenadas ou com layout inválido.

## 3) Zoom e navegação

- Suportado por:
  - botões `+`, `-`, `100%`;
  - roda do mouse;
  - pan por arraste no preview.
- Estado persistido em memória por `flowId`:
  - `zoom`, `panX`, `panY`, `autoAlign`.

## 4) Elementos suportados

- Tipos com ícone dedicado:
  - `message`, `audio`, `image`, `document`, `pause`, `condition`, `loop`.
- Conexões classificadas por semântica:
  - `default`, `true`, `false`, `loop`.

## 5) Indicadores de status/propriedade

- Cada nó recebe indicador visual:
  - `issue-ok`: configuração mínima válida;
  - `issue-warning`: propriedades essenciais ausentes.
- Regras principais:
  - `message`: exige texto;
  - `pause`: exige delay numérico;
  - `condition`: exige valor de condição;
  - `loop`: exige iterações válidas.

## Testes Unitários

Função de teste:

- `window.runFlowPreviewUnitTests()`

Cobertura atual:

- normalização de nós;
- normalização de conexões;
- geração de layout automático;
- cálculo de viewport/fit;
- suporte de ícone para loop;
- classificação de conexão condicional (`false`).

Relatório retornado:

- `total`, `passed`, `failed`, `tests[]`.
- cache global: `window.__upsidenFlowUnitTests`.

## QA Visual Automatizado

Função:

- `window.runFlowDashboardVisualQaTests()`

Valida:

- fidelidade de nós/conexões renderizadas;
- existência de controles de navegação;
- integridade de layout dos cards;
- integridade visual da busca;
- presença de suporte pan/zoom.

Relatório:

- `window.__upsidenFlowUiQa`.

## Integração com editor

Quando um fluxo é salvo ou renomeado no editor:

- `flow.js` dispara `upsiden:flow-updated`.
- dashboard escuta o evento e re-renderiza os cards automaticamente.

## Diretrizes de uso

1. Abra a aba **Flow Builder** em **Automações Clássicas**.
2. Visualize os cards com preview de nós + conexões reais.
3. Use controles da prévia para:
   - ampliar/reduzir;
   - resetar zoom;
   - ativar/desativar auto-alinhamento.
4. Execute `window.runFlowPreviewUnitTests()` no console para validar regras de render.
5. Execute `window.runFlowDashboardVisualQaTests()` no console para validar QA visual.
