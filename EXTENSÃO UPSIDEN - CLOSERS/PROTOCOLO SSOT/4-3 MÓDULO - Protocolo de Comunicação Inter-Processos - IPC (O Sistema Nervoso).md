# MÓDULO 03: PROTOCOLO DE COMUNICAÇÃO INTER-PROCESSOS (IPC)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth)

Este módulo estabelece o padrão arquitetural para a troca de dados entre os componentes de uma extensão Chrome (Service Worker, Content Scripts, Popup, Side Panel e Offscreen Documents) no ecossistema de 2026.

---

## 1. MENSAGENS DE DISPARO ÚNICO (ONE-TIME REQUESTS)

A comunicação de disparo único é o método mais comum para solicitações rápidas e troca de pequenos volumes de dados.

### 1.1 Fluxo Direcionado
Você **DEVE** diferenciar o destino da mensagem pelo método utilizado:

| Método | Origem | Destino | Uso Típico |
| :--- | :--- | :--- | :--- |
| `chrome.runtime.sendMessage` | Qualquer parte | Service Worker / Popup | Solicitar dados de storage, disparar ações de background. |
| `chrome.tabs.sendMessage` | Service Worker / Popup | Content Script (Aba) | Manipular o DOM de uma página específica, extrair dados visíveis. |

### 1.2 Tratamento de Respostas e Erros
**Imperativo:** Sempre verifique `chrome.runtime.lastError` ou use `try/catch` com `async/await`. O erro mais comum em 2026 é tentar enviar uma mensagem para uma aba que ainda não carregou o Content Script ("Could not establish connection. Receiving end does not exist").

```javascript
// Exemplo SSOT: Envio seguro para aba
async function notifyTab(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    console.warn("Aba não pronta ou sem script injetado:", error.message);
    return null;
  }
}
```

---

## 2. GESTÃO DE ASSINCRONIA E CANAIS (A LEI DO RETURN TRUE)

No Manifesto V3, o ciclo de vida do Service Worker é agressivo. Se você não gerenciar a assincronia, o canal de comunicação será fechado antes da resposta ser enviada.

### 2.1 A Lei do Canal Aberto
Se o seu listener de `onMessage` realiza uma operação assíncrona (ex: `fetch`, `storage.get`, ou chamada para API externa), você **DEVE** retornar `true` de forma síncrona dentro do listener.

### 2.2 Pecado Capital: Promessas Pendentes
Não retornar `true` causa o encerramento prematuro do canal, resultando no erro: *"The message port closed before a response was received"*.

```javascript
// CÓDIGO SSOT (CORRETO)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_API") {
    callExternalAPI(request.payload).then(data => {
      sendResponse({ success: true, data });
    });
    return true; // MANTÉM O CANAL VIVO
  }
});
```

---

## 3. CONEXÕES DE LONGA DURAÇÃO (PORTAS)

Para fluxos de dados contínuos (streaming de IA, logs em tempo real ou múltiplas trocas rápidas), o envio único é ineficiente. Use `chrome.runtime.connect`.

### 3.1 Quando usar Portas?
- Streaming de respostas de LLM (Gemini Nano/WASM).
- Sincronização complexa entre Side Panel e Content Script.
- Monitoramento de estado de uploads longos.

### 3.2 Gerenciamento de Ciclo de Vida
Você **DEVE** monitorar o evento `onDisconnect` para limpar recursos e evitar vazamentos de memória.

```javascript
// No Service Worker
chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === "ai-stream");
  port.onMessage.addListener((msg) => {
    // Processamento contínuo
  });
  port.onDisconnect.addListener(() => {
    console.log("Porta fechada. Limpando recursos...");
  });
});
```

---

## 4. PADRONIZAÇÃO DE ESQUEMA (O OBJETO SSOT)

Para evitar o caos de mensagens sem estrutura, toda comunicação **DEVE** seguir este esquema de objeto:

### 4.1 O Objeto de Mensagem Padrão
```typescript
interface SSOTMessage {
  action: string;      // Ação única definida em um Enum/Dicionário
  payload: any;       // Dados necessários para a ação
  metadata?: {        // Informações auxiliares (timestamp, version, etc)
    ts: number;
    origin: string;
  };
}
```

### 4.2 Enum de Actions (Dicionário Único)
**PROIBIDO** o uso de strings soltas no código. Centralize as ações em um arquivo de constantes.
```javascript
const ACTIONS = {
  GET_USER_DATA: "GET_USER_DATA",
  UPDATE_UI: "UPDATE_UI",
  START_STREAM: "START_STREAM"
};
```

---

## 5. SEGURANÇA NA TROCA DE DADOS

O Content Script vive em um ambiente hostil (a página web). Nunca confie cegamente nos dados recebidos dele.

### 5.1 Validação de Origem
Sempre valide o `sender` no Service Worker para garantir que a mensagem vem da sua própria extensão.
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    console.error("Tentativa de injeção externa detectada!");
    return;
  }
  // Prosseguir com segurança...
});
```

### 5.2 Sanitização de Payload
Trate o `payload` como entrada não confiável. Valide tipos e limite o tamanho dos dados para evitar ataques de estouro de memória ou injeção de scripts no background.

---

## COMPARATIVO: CÓDIGO CAÓTICO VS. CÓDIGO SSOT

### ❌ Código Caótico (Anti-Padrão)
```javascript
chrome.runtime.sendMessage("get-data", (res) => {
  console.log(res); // Sem tratamento de erro, string solta
});
```

### ✅ Código SSOT (Padrão 2026)
```javascript
import { ACTIONS } from "./constants.js";

async function fetchData() {
  const response = await chrome.runtime.sendMessage({
    action: ACTIONS.GET_USER_DATA,
    payload: { userId: 1 },
    metadata: { ts: Date.now(), origin: "popup" }
  });
  
  if (chrome.runtime.lastError) {
    handleError(chrome.runtime.lastError);
    return;
  }
  return response;
}
```

---

## CHECKLIST DE COMUNICAÇÃO SSOT

- [ ] A mensagem usa o objeto padrão `{ action, payload, metadata }`?
- [ ] O listener assíncrono retorna `true` explicitamente?
- [ ] A origem `sender.id` é validada no Service Worker?
- [ ] Todas as chamadas `sendMessage` estão envolvidas em blocos `try/catch` ou verificam `lastError`?
- [ ] Conexões de longa duração (`Port`) possuem listeners de `onDisconnect`?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
