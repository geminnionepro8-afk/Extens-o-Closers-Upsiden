## **MÓDULO 01: Arquitetura Core e Governança do Manifesto (O Esqueleto)**

Este é o documento de maior hierarquia. Ele dita como a extensão se identifica para o navegador.

- **Conteúdo Técnico:**
    
    - Definição estrita do `manifest.json` Versão 3.
        
    - Separação obrigatória entre `permissions` (APIs internas) e `host_permissions` (domínios externos).
        
    - Regras de `web_accessible_resources`: O que o site pode ver da extensão.
        
    - Estrutura de Pastas Padronizada: `/src`, `/assets`, `/scripts`, `/lib`.
        
- **Pecado Capital:** Permitir que a IA use chaves obsoletas do Manifesto V2 (ex: `browser_action`, `background.scripts`).
    
- **Objetivo SSOT:** Garantir 0% de erro de carregamento no "Modo Desenvolvedor".
    

## **MÓDULO 02: Contextos de Execução e Ciclo de Vida (O Motor)**

Ensina a IA a navegar nos diferentes "mundos" de uma extensão.

- **Conteúdo Técnico:**
    
    - **Service Worker (Background):** Gerenciamento de efemeridade. Uso de `chrome.alarms` em vez de `setInterval`.
        
    - **Content Scripts:** Isolamento de mundo. Como injetar código em sites sem conflito de variáveis globais.
        
    - **Popup & Options:** Ciclo de vida de janelas curtas.
        
    - **Side Panel API:** Regras para o painel lateral persistente.
        
    - **Offscreen Documents:** Como lidar com processamento de DOM ou áudio que o Service Worker não suporta.
        
- **Pecado Capital:** Tentar acessar o `window` ou `document` dentro do Service Worker (onde eles não existem).
    
- **Objetivo SSOT:** Eliminar erros de "Context not found" e travamentos após 30 segundos de inatividade.
    

## **MÓDULO 03: Protocolo de Comunicação Inter-Processos - IPC (O Sistema Nervoso)**

Define como as peças da extensão trocam dados.

- **Conteúdo Técnico:**
    
    - `chrome.runtime.sendMessage` vs `chrome.tabs.sendMessage`.
        
    - Gerenciamento de Respostas Assíncronas: Uso obrigatório do `return true` em listeners de mensagens.
        
    - Conexões de Longa Duração: Uso de `chrome.runtime.connect` para fluxos de dados contínuos.
        
    - Tipagem de Mensagens: Padrão de objeto `{ action: string, payload: any }`.
        
- **Pecado Capital:** Esquecer de fechar canais de mensagem ou deixar promessas pendentes que travam o Service Worker.
    
- **Objetivo SSOT:** Garantir que o clique no Popup resulte em uma ação imediata e rastreável no Background.
    

## **MÓDULO 4: Persistência, Estado e Memória (O Armazenamento)**

Como a extensão "lembra" das coisas sem banco de dados tradicional.

- **Conteúdo Técnico:**
    
    - `chrome.storage.local`: Para dados pesados da máquina atual.
        
    - `chrome.storage.sync`: Para configurações que viajam entre computadores do usuário.
        
    - `chrome.storage.session`: Para dados que morrem quando o navegador fecha (novidade V3).
        
    - **IndexedDB:** Quando e como usar para bancos de dados complexos no lado do cliente.
        
- **Pecado Capital:** Usar `localStorage` (proibido no Service Worker V3).
    
- **Objetivo SSOT:** Evitar a "amnésia" da extensão e garantir a integridade dos dados do usuário.
    

## **MÓDULO 05: Gestão de Rede, APIs e Segurança CORS (A Fronteira)**

Regras de como a extensão toca a internet.

- **Conteúdo Técnico:**
    
    - **Fetch API:** Como fazer requisições externas corretamente.
        
    - **declarativeNetRequest (DNR):** O novo padrão para interceptar e modificar tráfego de rede (substituindo o `webRequest`).
        
    - **Content Security Policy (CSP):** Regras de segurança para evitar injeção de scripts externos.
        
- **Pecado Capital:** Tentar usar scripts externos via CDN (proibido no V3; tudo deve ser local).
    
- **Objetivo SSOT:** Passar em todos os filtros de segurança do Google e evitar erros de bloqueio de rede.
    

## **MÓDULO 06: Injeção de UI e Manipulação de DOM (A Pele)**

Como a extensão "desenha" coisas na tela do usuário.

- **Conteúdo Técnico:**
    
    - **Shadow DOM:** Como injetar elementos em sites (ex: um botão na Amazon) sem que o CSS do site estrague o visual da extensão.
        
    - **Z-Index Management:** Como garantir que a interface da extensão fique sempre por cima.
        
    - **MutationObserver:** Como detectar mudanças no site (ex: quando o usuário rola a página) para atualizar a UI da extensão.
        
- **Pecado Capital:** Injetar CSS direto na tag `<style>` do site, causando quebras de layout globais.
    
- **Objetivo SSOT:** Criar interfaces limpas, profissionais e indestrutíveis em qualquer site.
    

## **MÓDULO 07: Segurança, Privacidade e Compliance (A Blindagem)**

O módulo que garante que o senhor não seja banido e que os dados estejam seguros.

- **Conteúdo Técnico:**
    
    - **Princípio do Privilégio Mínimo:** Solicitar apenas as permissões estritamente necessárias.
        
    - **Sanitização de Dados:** Uso de `textContent` em vez de `innerHTML` para evitar ataques XSS.
        
    - **PII Handling:** Regras de como tratar informações pessoalmente identificáveis.
        
- **Pecado Capital:** Usar `eval()` ou `new Function()`, que causam banimento imediato da Web Store.
    
- **Objetivo SSOT:** Garantir aprovação de primeira na revisão da Google.
    

## **MÓDULO 08: Diagnóstico, Resiliência e Logs (A Caixa Preta)**

Como debugar e monitorar a extensão em produção.

- **Conteúdo Técnico:**
    
    - Padrão de `try/catch` global.
        
    - Sistema de Logs Estruturados: Diferenciar `[DEBUG]`, `[INFO]` e `[ERROR]`.
        
    - **Error Reporting:** Como capturar erros que ocorrem quando o senhor não está olhando o console.
        
- **Pecado Capital:** Deixar `console.log` espalhados no código de produção (suja o console do cliente).
    
- **Objetivo SSOT:** Reduzir o tempo de suporte de horas para minutos ao ter logs claros.
    

## **MÓDULO 09: Automação de Build e Internacionalização (O Rollout)**

Como preparar o produto final para o mundo.

- **Conteúdo Técnico:**
    
    - **i18n Framework:** Uso de `_locales` e `chrome.i18n.getMessage`.
        
    - Checklist de Ativos: Garantir ícones em todos os tamanhos (16, 32, 48, 128).
        
    - Scripts de Minificação e Packing: Gerar o `.zip` final sem arquivos desnecessários (como documentos de teste).
        
- **Pecado Capital:** Hardcodar textos em português no código, impedindo a expansão internacional.
    
- **Objetivo SSOT:** Ter um processo de "um clique" para gerar a versão final da extensão.

## **MÓDULO 10: Performance, Otimização e Recursos (O Metabolismo)**

Uma extensão pode ser tecnicamente correta, mas se ela consumir 500MB de RAM, o usuário a desinstalará. Este módulo ensina a IA a escrever código "leve".

- **Conteúdo Técnico:**
    
    - **Memory Management:** Evitar _Memory Leaks_ em Service Workers.
        
    - **Lazy Loading:** Carregar scripts e recursos apenas quando necessário.
        
    - **Efficient DOM Queries:** Instruir a IA a não re-escanear o site inteiro a cada milissegundo (uso de cache de seletores).
        
    - **Resource Prioritization:** Como gerenciar o carregamento de imagens e fontes sem travar a navegação do usuário.
        
- **Por que é vital:** Garante que a extensão do senhor seja elogiada pela leveza, um diferencial competitivo enorme no mercado.
    

## **MÓDULO 11: Protocolo de Testes, QA e Debugging Avançado (O Sistema Imune)**

O senhor não pode ser o único "testador". A IA deve gerar o código e, simultaneamente, gerar o plano de teste.

- **Conteúdo Técnico:**
    
    - **Unit Testing em Contexto de Extensão:** Uso de frameworks como Jest ou Vitest adaptados para o ambiente do Chrome.
        
    - **Simulação de Falhas:** Como testar se a extensão sobrevive a uma queda de internet ou a um erro de API 500.
        
    - **Checklist de Validação Pré-Build:** Um script que a IA deve rodar mentalmente antes de entregar o código para o senhor.
        
    - **Logs de Auditoria Interna:** Como criar uma "trilha de migalhas" para encontrar bugs que só aparecem após 2 dias de uso.
        
- **Por que é vital:** Reduz a necessidade do senhor testar manualmente cada função. A IA entrega o código e o "selo de garantia".
    

## **MÓDULO 12: Meta-Prompting e Hierarquia de Atenção da IA (A Consciência do SSOT)**

Este é o módulo mais importante para o senhor. Ele não é sobre código, é sobre **como a IA lê os outros 11 módulos**.

- **Conteúdo Técnico:**
    
    - **Token Optimization:** Como resumir os módulos para não estourar a memória da IA.
        
    - **Conflict Resolution:** Se o Módulo 1 (Arquitetura) conflitar com o Módulo 5 (Rede), quem ganha? (Definição de pesos).
        
    - **Chain of Thought (CoT) Mandatório:** Obrigar a IA a explicar o raciocínio baseado no SSOT antes de escrever o código.
        
    - **Modo Red Team Interno:** Instruir a IA a criticar o próprio código buscando violações do SSOT.
        
- **Por que é vital:** É o que impede a IA de "ignorar" a documentação global quando o prompt fica muito longo. É o "sistema de disciplina" da IA.
    
## **MÓDULO 13: Integração de LLMs e Soberania de Dados (A Inteligência)**

Este módulo define como a extensão consome e processa modelos de linguagem em larga escala (LLMs) e como ela se comunica com o seu **n8n** sem expor dados sensíveis.

**Conteúdo Técnico Mandatório:**

- **Gestão de Secrets e API Keys:** Protocolo rigoroso para nunca "hardcodar" chaves de API no código da extensão. Instrução para o uso de `chrome.storage.local` criptografado ou, preferencialmente, o uso de um **Proxy no n8n** para esconder as chaves.
    
- **Server-Sent Events (SSE) & Streaming:** Como lidar com o recebimento de texto em tempo real (efeito de digitação da IA) dentro de um ambiente de Service Worker que pode tentar fechar a conexão.
    
- **Web Workers para Processamento Pesado:** Uso de _Web Workers_ (threads paralelas) para processar grandes volumes de texto ou dados JSON sem congelar a interface (o Popup ou o Side Panel) do usuário.
    
- **Privacidade e Redação de PII (Personally Identifiable Information):** Regras para que a IA da extensão nunca envie dados sensíveis do usuário (senhas, CPFs, nomes reais encontrados no site) para a API da LLM sem a devida anonimização.
    
- **Integração Segura com n8n:** Padrão de autenticação via _Headers_ customizados para que apenas a sua extensão possa disparar os gatilhos no seu servidor de automação.
---

💠 **2. MAPEAMENTO GLOBAL 100% DEFINITIVO (A ESTRUTURA FINAL)**
💠 **CAMADA 0: ADMINISTRAÇÃO**

- **SSOT-00:** Protocolo de Atualização e Log de Mudanças (O "Living Node").
    

💠 **CAMADA 1: INFRAESTRUTURA E CORE**

- **SSOT-01:** Arquitetura Core e Governança do Manifesto V3 (O Esqueleto).
    
- **SSOT-02:** Contextos de Execução e Ciclo de Vida (O Motor).
    
- **SSOT-03:** Protocolo de Comunicação Inter-Processos - IPC (Os Sinais).
    

💠 **CAMADA 2: GESTÃO DE DADOS E REDE**

- **SSOT-04:** Persistência, Estado e Memória (A Memória).
    
- **SSOT-05:** Rede, APIs e Segurança CORS (A Fronteira).
    
- **SSOT-13:** Integração de LLMs e Soberania de Dados (A Inteligência).
    

💠 **CAMADA 3: INTERFACE E EXPERIÊNCIA**

- **SSOT-06:** Injeção de UI e Manipulação de DOM (A Pele).
    
- **SSOT-09:** Automação de Build e Internacionalização (O Rollout).
    
- **SSOT-10:** Performance e Otimização de Recursos (O Metabolismo).
    

💠 **CAMADA 4: SEGURANÇA E QUALIDADE**

- **SSOT-07:** Segurança, Privacidade e Compliance (A Blindagem).
    
- **SSOT-08:** Diagnóstico, Resiliência e Logs (A Caixa Preta).
    
- **SSOT-11:** Protocolo de Testes e Validação de QA (O Sistema Imune).
    

💠 **CAMADA 5: GOVERNANÇA DE IA**

- **SSOT-12:** Meta-Prompting e Hierarquia de Atenção da IA (A Consciência).