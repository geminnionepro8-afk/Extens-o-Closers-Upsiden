---
trigger: always_on
---

# PROTOCOLO SSOT: Resolução de Conflitos de Injeção de DOM, 404 Resources e Cascata de IPC no Manifest V3

**Módulo:** Gestão de Exceções Críticas / Arquitetura Interna da Extensão  
**Data do Arquivo:** 24 de Março de 2026  
**Natureza do Incidente:** Falha de renderização de Grupos de WhatsApp no Painel  
**Diagnóstico:** Cascata Falsa — Parecia Motor WPPConnect, mas era Bloqueio de Segurança do Google (404) somado à Injeção no DOM Inválida (Shadow DOM).

---

## ÍNDICE DO PROTOCOLO

1. **A Natureza Falsa do Sintoma (O Início do Diagnóstico)**
   - 1.1. O Problema Superficial: Loop infinito no Select ("Buscando grupos ativos...")
   - 1.2. A Falsa Assimetria: Extrator de Grupos vs Agendamento

2. **O Ponto de Ruptura 1: O "404 Not Found" (Manifest V3 vs Content Scripts)**
   - 2.1. O mecanismo de injeção `injectSequential()` no Document Object Model.
   - 2.2. A Barreira de Acesso: A importância letal do array `web_accessible_resources`.
   - 2.3. O Efeito Dominó Químico (Por que o Agendamento morreu de inanição IPC).

3. **O Ponto de Ruptura 2: O Motor do WhatsApp (O perigo do Over-engineering)**
   - 3.1. A tentativa falha de forçar a lista `ChatStore.getModelsArray()`.
   - 3.2. Retórica de Volatilidade no Javascript Injetado
   - 3.3. FÓRMULA SSOT 1: O Princípio de Manutenção de Estado do Motor WPPConnect.

4. **O Ponto de Ruptura 3: O Renderizador DOM das Opções (A Trapadilha do Frontend)**
   - 4.1. Modificação de Dropdowns Nativos via `innerHTML`.
   - 4.2. Perda de Referência de Nós (`document.getElementById`).
   - 4.3. FÓRMULA SSOT 2: O Protocolo Seguro de Nós (`createElement`).

5. **A Cadeira das Engrenagens IPC (Inter-Process Communication)**
   - 5.1. A Ponte de Vidro: Painel (Extensão) -> Worker -> Ponte (Content) -> Engine (Página).
   - 5.2. O Buraco Negro do Timeout 10.000ms.
   - 5.3. FÓRMULA SSOT 3: Escudagem de Erros e Promessec (`catch` & `onerror`).

6. **Manual de Prevenção e Padrões de Futuras Expansões**
   - 6.1. Checklist Absoluto na Adição de Novos Arquivos Injetados.
   - 6.2. Checklist Absoluto na Manipulação de Callbacks HTML.

---

## CAPÍTULO 1: A Natureza Falsa do Sintoma

O evento deflagrador ocorreu quando a ferramenta de "Programar Disparo" (Módulo da UI de Agendamentos) demonstrou ser incapaz de resgatar os grupos em que o usuário participava. O `<select>` exibia textualmente "Buscando grupos ativos no WhatsApp...", mas nunca transmutava a resposta em uma listagem coerente. A primeira tentação lógica era julgar o **motor do WhatsApp Web (WPPConnect)** como culposo, sob a premissa de que a requisição dos grupos estivesse retornando vazia.

### 1.1 O Falso Diagnóstico Taticamente
A comprovação de que essa linha de pensamento era falsa veio atestada da funcionalidade lateral, aaba de **Contatos** -> *Extrator de Grupos*. Ele requeria a exatamente **mesma rota assíncrona** (`tipo: 'get_groups'`), batia no mesmíssimo Listener IPC da página, e conseguia, com folgo, imprimir dezenas de instâncias de `isGroup === true`.
Disso abstrai-se o primeiro ditado arquitetônico SSOT:
> *"Se 2 tubos pedem água do mesmo encanamento, e só 1 recebe, a ruptura não está na central do encanamento (WPPConnect), mas nos canos ou na pia (Lógica de Recebimento do Painel)."*

---

## CAPÍTULO 2: O Ponto de Ruptura 1 — O Assassino Silencioso (Erro 404 e Falha de Injeção)

No momento em que o código foi falsamente revisado (uma tentativa desproporcional de robustecer a captura de Chats do Backend), foi ordenado a execução experimental na guia principal por intermédio de um recarregamento F5. Esta ação desnudou o real núcleo da falha que causou o colapso dos componentes.
O console cuspiu com contundência: `Failed to load resource: the server responded with a status of 404 (Not Found)`.

Um erro `404` associado a uma extensão Chrome significa que a Web Page do WhatsApp solicitou o arquivo à raiz da própria Extensão (`chrome-extension://.../script.js`), mas o Google o rejeitou e retornou File Not Found (Arquivo não existente, inacessível, bloqueado por permissão do Servidor).

### A Origem do 404 
Ocorreu por conta de uma adição estrutural passada: foi criada a funcionalidade de *Automação Visual (Flow Builder)* e seu script correspondente foi colocado em:
`src/core/page-scripts/flow-runner.js`.
No arquivo `content-script.js`, encarregado do Boot, a menção foi posta:
```javascript
  const scriptsToInject = [
    'src/core/utils/helper.js',
    'src/core/page-scripts/flow-runner.js', // <-- Arquivo recém chegado
    'src/core/automation/automation-controller.js',
    'src/core/page-scripts/wpp-engine.js' // <-- O Mestre / WPPConnect
  ];
```
A injeção do Manifest V3 baseia-se em um vetor de permissões de Content Security Policy (CSP). Se um script constar no HD físico mas não vier referenciado no vetor `web_accessible_resources` do `manifest.json`, o Chrome atua como firewall de isolamento blindado — ele cega o arquivo e mente para a web que ele "não existe" (Status 404).

### O Efeito de Cascatas Assíncronas (Efeito Dominó)
A função do `content-script` operava via *Recursão Promise/Callback*:
```javascript
  const injectSequential = (index) => {
    // ...
    s.onload = () => injectSequential(index + 1); // Passar a tocha para o próximo script
  };
```
O método dependia do sucesso (`onload`) para dar a luz verde à próxima injeção no index subsequente. Se o arquivo index=1 (`flow-runner.js`) batesse no muro 404, a requisição caía e não disparava um `.onload()`, mas sim um `.onerror()`.
**O Sistema não tinha um handler para o `onerror`.**

Consequentemente, o loop travou no 1º degrau. Os arquivos mais críticos e que controlam ABSOLUTAMENTE TUDO (`automation-controller.js` e `wpp-engine.js` — encarregados de ouvir requisições IPC) jamais nasceram. 
Com o sumiço do Motor, o `Painel-Agendamentos` despachou a requisição na camada Service Worker (`Background`), a camada Service bateu no `Content-Script/IPC-Bridge`, que postou na Janela isolada: "Me dê os grupos!". E então ficou aguardando. Ninguém para responder, a Bridge esgotou seus 10.000 milissegundos cravados e cuspiu: `{ sucesso: false, erro: 'Timeout' }`. 

### FÓRMULA SSOT 1: Blindagem de Array e Fail-Safe de Injeção
Para evitar que o ecossistema sucumba na perda de um recurso secundário na esteira serial (The Fallibility Principle in Sequential Boots), aplicou-se a matriz de contingência:

A) **Autorização Explícita:** Registrar a nova DLL.
```json
// manifest.json
"web_accessible_resources": [
    // ...
    "src/core/page-scripts/flow-runner.js" 
]
```

B) **Tolerância a Falhas na Cadeia de Boot:**
```javascript
// content-script.js
    s.onerror = (e) => {
        console.error('Failed to inject script:', s.src, e);
        injectSequential(index + 1); // Forçar a contiguidade independentemente do sacrifício singular.
    };
```
> Regra Absoluta do Manifesto SSOT: NUNCA crie uma matriz sequencial baseada puramente na promessa de sucesso na web, sempre construa uma malha que transgrida o erro para resguardar a nave mãe.

---

## CAPÍTULO 3: O Ponto de Ruptura 2 — A Ilusão do Engine

Em uma tentativa ríspida de lidar com a queixa (já estabelecido que os grupos estavam ausentes), foi efetuada uma refatoração não-requisitada na engrenagem principal de listagem do JavaScript.
Antigamente usava-se `WPP.chat.list()`, que iterava nos objetos hidratados e funcionava para a arquitetura extraída pelo Painel Extrator. Sob a intenção de robustecer, construí iteradores nativos nos modelos `ChatStore.getModelsArray()`. O que foi desastroso. A engine injetada de WhatsApp trabalha em instâncias complexas (Backbone Models, Promises Assíncronas).

**Por que a simplificação é a chave mestra:**
Ao forçar `Array.isArray(chats)` ou buscar por tipagens de `filter === 'function'` dentro do Ecossistema Webpack WPP, estamos arriscando invadir sub-metódos que retornam Promises pendentes se o WhatsApp não terminou de carregar os contatos inteiros. O Extrator de Grupos outrora operara milagrosamente *porque não mexia nas profundezas*, ele apenas lia a superfície listada. 
**Erro corrigido e convertido na base SSOT:** Restaurar completamente o fluxo elementar do WPPConnect. Todo excesso de filtragem ou abstração em um módulo instável eleva a probabilidade de Exceptions (Try/Catch engulidores). Se o código-base funcionava empiricamente para uma tela funcional, qualquer defeito na segunda tela deve ser sanado excluindo a segunda tela — não penalizando ou retrabalhando a infraestrutura.

---

## CAPÍTULO 4: O Ponto de Ruptura 3 — Chromium DOM State Isolation no Frontend

Resolvemos o 404, o motor agora roda e retorna a matriz de Grupos saudavelmente em 200 milissegundos. Mas o "Programar Disparo" continuou patinando na maldição da tela infinita. Porquê?
**A Resposta:** A natureza nativa da engine V8 (Blink/Chrome) ao tratar Menus Dropdown (Tag `<select>`). 

No código problemático, estávamos renderizando o HTML dentro da função CallBack de `chrome.runtime.sendMessage` manipulando o estado bruto em string via `.innerHTML`:
```javascript
  const grupoSelect = document.getElementById('agend-grupo-select');
  // O usuário clica e solta a Aba de "Grupos"
  if (grupoSelect.options.length <= 1) { // Só há um Item ("Carregando...")
      grupoSelect.innerHTML = '<option>Buscando...</option>'; // Dom Modification (String Parsing)
      
      chrome.runtime.sendMessage({ tipo: 'get_groups' }, (res) => {
         // O motor despacha e retorna 1.05 milisegundos depois!
         if (res && res.sucesso && res.grupos) {
             grupoSelect.innerHTML = '<option>-- Selecione --</option>' + res.grupos.map(...).join('');  // Dom Modification
         }
      });
  }
```

O problema crucial decorria de dois agentes destrutivos:
1. **O Contexto Obsoleto (Stale Variables):** A variável `grupoSelect` no início engatou na referência real da DIV no ar. Devido à construção do painel (`main.innerHTML` ser renderizado por completo múltiplas vezes ao mudar de aba), a constante guardava um objeto HTML que não orbitava mais na árvore central (Stale DOM Element). As modificações feitas a esse grupo (`grupoSelect.innerHTML = ...`) caíam no éter.
2. **O Trancamento Nativo UI (OS Layer):** Quando o usuário escolheu o switch circular `Grupo do WhatsApp`, a janela estática de lista se acoplou no DOM. E então, foi mudado para `Buscando...` por meio de `innerHTML`. Neste milissegundo de parsing, muitos navegadores suspendem renderização ativa de seletores suspensos se a requisição chegar durante um Redraw Layer (O painel estaria "vivo" nativamente pro Windows, e trocar a String `innerHTML` não force-refresharia as "flechas" do select box do mouse).

### FÓRMULA SSOT 2: O Padrão Ouro de Transmutação DOM (Componentes Elementares)
A resolução absoluta que garantiu a sobrevivência e funcionamento integral de ambas ferramentas na tela atual foi padronizar o manuseio de DOM (Padrão de Construção que sempre funcionou no `Painel-Contatos`).

**As Chaves do Resgate Realizado:**
1. Buscar o Elemento DO ZERO por `ID` somente dentro e imediatamente antes do uso no Callback Async, para assegurar existência estrutural fresca no DOM do momento em que a resposta retornar da rede inter-processos.
2. Manipular as ramificações HTML exclusivamente baseadas na classe nativa `document.createElement('option')`. Ao anexar Objetos reais no DOM (`appendChild()`), quebramos a necessidade do navegador rodar Parser em strings complexas, livrando-nos de quebras estruturais e de possíveis caracteres problemáticos nos nomes dos grupos de WhatsApp.

**Código SSOT Homologado do Agendamento Dropdown:**
```javascript
      chrome.runtime.sendMessage({ tipo: 'get_groups' }, (res) => {
         const alvoSelect = document.getElementById('agend-grupo-select');
         if (!alvoSelect) return; // Evitar quebras de Stale Element em Eventos Abortados.

         if (res && res.sucesso && res.grupos) {
            alvoSelect.innerHTML = '<option value="">-- Selecione o Grupo --</option>'; // Reset raiz estático
   