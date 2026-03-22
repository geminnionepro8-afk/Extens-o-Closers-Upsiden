# MÓDULO 13: INTEGRAÇÃO DE LLMS E SOBERANIA DE DADOS (A INTELIGÊNCIA)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth) | DENSIDADE SÊNIOR

Este módulo estabelece os protocolos para a integração de Modelos de Linguagem (LLMs) em extensões Chrome 140+, garantindo inteligência fluida, soberania de dados do utilizador e proteção absoluta de segredos via infraestrutura de proxy.

---

## 1. GESTÃO DE SECRETS E API KEYS (O PROTOCOLO PROXY)

Em 2026, a exposição de chaves de API de IA (OpenAI, Anthropic, Gemini) no código da extensão é uma falha de segurança crítica que resulta em banimento e prejuízo financeiro.

### 1.1 Proibição de Hardcoding e Exposição
- **REGRA DE OURO:** NENHUMA chave de API de LLM deve residir no pacote da extensão (JS ou Manifest).
- **O Padrão n8n Proxy:** A extensão **DEVE** atuar apenas como um cliente que envia o prompt para um Webhook seguro do n8n. O n8n, operando em ambiente de servidor, injeta as credenciais e processa a chamada para a LLM.

### 1.2 Criptografia Local (Web Crypto API)
Caso a arquitetura exija que o utilizador forneça a sua própria chave (BYOK - Bring Your Own Key), você **DEVE** cifrar o dado antes de salvar no `chrome.storage.local`.

```javascript
// Exemplo: Criptografia AES-GCM via Web Crypto API
async function encryptKey(plainText, password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: crypto.getRandomValues(new Uint8Array(16)), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText));
  return { ciphertext, iv };
}
```

---

## 2. SERVER-SENT EVENTS (SSE) & STREAMING NO MV3

O streaming é essencial para o "efeito de digitação" da IA. No Manifesto V3, o desafio é manter o Service Worker (SW) vivo durante respostas longas.

### 2.1 Implementação de Streaming Robusto
Para consumir fluxos SSE sem que o SW entre em suspensão, você deve utilizar uma porta de longa duração (`chrome.runtime.connect`) entre a UI (Popup/Side Panel) e o SW.

```javascript
// No Service Worker (background.js)
async function handleStreaming(prompt, port) {
  const response = await fetch('https://seu-n8n.com/ai-proxy', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    headers: { 'Accept': 'text/event-stream' }
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    port.postMessage({ type: 'CHUNK', text: chunk }); // Envia para a UI
  }
  port.postMessage({ type: 'DONE' });
}
```

### 2.2 Keep-Alive do Service Worker
Enquanto houver uma porta aberta e tráfego de mensagens, o Chrome 140+ tende a manter o SW ativo. No entanto, para fluxos superiores a 30s, utilize um `chrome.alarms` de segurança para "acordar" o SW se necessário.

---

## 3. PRIVACIDADE E REDAÇÃO DE PII (ANONIMIZAÇÃO)

**Soberania de Dados:** O utilizador é o dono da informação. Dados sensíveis nunca devem sair do contexto local sem redação prévia.

### 3.1 Filtro de Sensibilidade (PII Redaction)
Antes de enviar qualquer texto para a LLM, a extensão **DEVE** aplicar um filtro de redação para substituir Informações Pessoalmente Identificáveis (PII).

| Tipo de Dado | Padrão de Redação (Regex/IA) | Placeholder SSOT |
| :--- | :--- | :--- |
| **E-mails** | `[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}` | `[EMAIL_REDAZIDO]` |
| **NIF/CPF** | `\d{3}\.\d{3}\.\d{3}-\d{2}` | `[ID_REDAZIDO]` |
| **Passwords** | Identificação via contexto de input | `[SENHA_REDAZIDA]` |
| **Nomes Próprios** | Identificação via Named Entity Recognition (NER) local | `[NOME_REDAZIDO]` |

---

## 4. WEB WORKERS E OFFSCREEN DOCUMENTS

### 4.1 Processamento de Grandes Volumes
Para limpar e estruturar JSONs massivos antes de enviá-los à IA, use **Web Workers** no Content Script para não bloquear a thread de renderização do site.

### 4.2 Offscreen Context para IA Local
Se estiver a usar IA local (WASM/Gemini Nano), utilize um **Offscreen Document** para gerenciar o modelo. Isso garante acesso a APIs de memória mais robustas e isola o consumo de RAM do Service Worker principal.

---

## 5. INTEGRAÇÃO SEGURA COM n8n (AUTH HEADERS)

Para evitar que o seu Webhook do n8n seja abusado por terceiros, implemente uma assinatura de pedido.

### 5.1 Protocolo de Assinatura X-SSOT
- **Auth:** Use um cabeçalho `X-SSOT-Signature` que contenha um token gerado dinamicamente ou um segredo partilhado que o n8n valide antes de prosseguir.
- **Rate Limiting:** O n8n deve limitar o número de pedidos por `extension_id` para evitar custos inesperados com a API da LLM.

---

## CHECKLIST DE INTELIGÊNCIA SSOT

- [ ] Nenhuma chave de API de LLM está no código-fonte?
- [ ] O fluxo de streaming (SSE) utiliza portas de longa duração para manter o SW vivo?
- [ ] O filtro de redação de PII é aplicado antes de qualquer envio externo?
- [ ] O n8n valida a assinatura `X-SSOT-Signature` da extensão?
- [ ] Tarefas de IA pesada são delegadas para um `Offscreen Document`?
- [ ] O utilizador deu consentimento explícito para o processamento de dados via IA?

---
**Pesquisador-Arquiteto SSOT**
*Documentação de inteligência artificial e soberania de dados.*
*Data de Validação: 21 de Março de 2026.*
