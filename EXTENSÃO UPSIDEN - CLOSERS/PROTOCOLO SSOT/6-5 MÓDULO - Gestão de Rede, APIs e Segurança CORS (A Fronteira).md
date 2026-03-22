# MÓDULO 05: GESTÃO DE REDE, APIS E SEGURANÇA CORS (A FRONTEIRA)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth)

Este módulo estabelece os protocolos de comunicação externa e segurança de rede para extensões Chrome 140+, focando na blindagem de dados e conformidade com o Manifesto V3.

---

## 1. FETCH API: A COMUNICAÇÃO EXTERNA

A `Fetch API` é o padrão para requisições HTTP em 2026. No entanto, o local de disparo determina o sucesso ou falha da operação.

### 1.1 Onde disparar? (O Proxy do Service Worker)
- **Regra SSOT:** Requisições para APIs externas (Supabase, n8n, Firebase) **DEVEM** ser realizadas no **Service Worker**.
- **Por que?** 
    1.  **CORS:** O Service Worker da extensão não é bloqueado pelas políticas de CORS da página onde o Content Script está injetado.
    2.  **Segurança:** Chaves de API e segredos não ficam expostos no DOM da página web, permanecendo no contexto isolado da extensão.

### 1.2 Tratamento de Timeouts e AbortController
Como o Service Worker pode ser encerrado a qualquer momento, você **DEVE** gerenciar o ciclo de vida das requisições para evitar processos órfãos.

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s

try {
  const response = await fetch('https://api.supabase.co/v1/...', {
    signal: controller.signal,
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await response.json();
} catch (error) {
  if (error.name === 'AbortError') console.error('Requisição expirada.');
} finally {
  clearTimeout(timeoutId);
}
```

---

## 2. DECLARATIVE NET REQUEST (DNR): O NOVO PADRÃO

O `chrome.declarativeNetRequest` substituiu o antigo `webRequest` (bloqueante) por um sistema de regras processado pelo próprio navegador, garantindo performance e privacidade.

### 2.1 Regras Estáticas vs. Dinâmicas
- **Estáticas (`rule_resources`):** Definidas em arquivos JSON no manifesto. Ideal para bloqueio de anúncios ou rastreadores conhecidos.
- **Dinâmicas (`updateDynamicRules`):** Adicionadas via código em runtime. Essencial para modificar headers baseados em tokens de usuário.

### 2.2 Exemplo: Modificação de Headers (User-Agent/Referer)
Para APIs que exigem um `Referer` específico ou para ocultar a origem da extensão:

```javascript
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [{
    id: 1,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        { header: 'Referer', operation: 'set', value: 'https://trusted-source.com' },
        { header: 'X-Custom-Header', operation: 'set', value: 'SSOT-Protocol-2026' }
      ]
    },
    condition: { urlFilter: 'https://api.restrita.com/*', resourceTypes: ['xmlhttprequest'] }
  }],
  removeRuleIds: [1]
});
```

---

## 3. CONTENT SECURITY POLICY (CSP): A MURALHA

A CSP no MV3 é a defesa contra XSS e injeção de scripts.

### 3.1 Configuração 2026
Você **DEVE** declarar explicitamente quais domínios a extensão pode contactar no manifesto.

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src https://*.supabase.co https://*.n8n.cloud"
}
```
*Nota: `connect-src` define os domínios permitidos para `fetch` e `WebSocket`.*

### 3.2 Proibição de 'unsafe-eval' e 'unsafe-inline'
- **Imperativo:** O uso de scripts inline (`<script>alert(1)</script>`) ou `eval()` em strings é **TERMINANTEMENTE PROIBIDO**.
- **Exceção WASM:** Apenas `'wasm-unsafe-eval'` é permitido para execução de módulos binários WebAssembly.

---

## 4. PECADO CAPITAL: SCRIPTS EXTERNOS (CDN)

**Regra de Ouro:** É PROIBIDO carregar qualquer código executável de uma URL remota.
- **O Erro:** `<script src="https://cdn.com/supabase.js"></script>`.
- **A Solução SSOT:** Baixe o SDK, inclua-o na pasta `/libs` da sua extensão e importe localmente.
- **Impacto:** Isso garante que a extensão funcione offline, seja mais rápida e passe na revisão da Web Store sem questionamentos de segurança.

---

## 5. CROSS-ORIGIN RESOURCE SHARING (CORS)

Muitas APIs modernas bloqueiam requisições de origens desconhecidas.

- **O Problema:** Erro `Refused to connect to...` no console.
- **A Solução:** Use o Service Worker como um "Proxy". O Content Script envia uma mensagem para o SW, o SW faz o `fetch` (onde o CORS é mais flexível para extensões) e retorna o dado para o Content Script.

---

## TABELA DE ERROS COMUNS E SOLUÇÕES (2026)

| Erro no Console | Causa Provável | Solução SSOT |
| :--- | :--- | :--- |
| `Refused to connect to 'URL' because it violates CSP` | Domínio não listado em `connect-src`. | Adicionar a URL ao `content_security_policy` no manifesto. |
| `Fetch API cannot load 'URL'. No Access-Control-Allow-Origin` | Bloqueio de CORS no Content Script. | Mover a lógica de `fetch` para o Service Worker. |
| `Uncaught EvalError: Refused to evaluate a string` | Uso de `eval()` ou `new Function()`. | Refatorar código ou usar `wasm-unsafe-eval` (se for WASM). |
| `Ruleset at index 0 is invalid` | Erro de sintaxe no JSON do DNR. | Validar esquema de regras do `declarativeNetRequest`. |

---

## CHECKLIST DE FRONTEIRA SSOT

- [ ] Todas as chamadas de API externas estão no Service Worker?
- [ ] O `connect-src` da CSP inclui todos os domínios de API (Supabase, n8n, etc.)?
- [ ] O `AbortController` está sendo usado para evitar requisições órfãs?
- [ ] Nenhum script externo (CDN) está sendo carregado via URL?
- [ ] Se houver modificação de headers, o `declarativeNetRequest` foi configurado?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
