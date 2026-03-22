# MÓDULO 02: CONTEXTOS DE EXECUÇÃO E CICLO DE VIDA (O MOTOR)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth)

Este módulo detalha o funcionamento interno das extensões Chrome, focando na eliminação de erros de "Context not found" e na sobrevivência ao ciclo de vida efêmero do Manifesto V3.

---

## 1. SERVICE WORKER (SW): O CORAÇÃO EFÊMERO

O Service Worker é o cérebro da extensão, mas ele não é persistente. Em 2026, o Chrome aplica um limite rigoroso de **30 segundos de inatividade** antes de encerrar o processo.

### 1.1 Gerenciamento de Efemeridade
O SW morre para economizar recursos do sistema. Você **NÃO PODE** confiar em variáveis globais para manter estado.
- **Pecado Capital #1:** Tentar acessar `window`, `document` ou `localStorage`. O SW roda em um contexto de *Worker*, onde essas APIs não existem.
- **Alternativa Correta:** Use `chrome.storage.session` para estados de memória e `chrome.storage.local` para dados em disco.

### 1.2 Protocolo de Ressurreição
Para garantir que o SW "acorde" para realizar tarefas, você **DEVE** usar gatilhos de eventos:
- **`chrome.alarms`**: Única forma permitida para tarefas agendadas. `setInterval` e `setTimeout` falham assim que o SW entra em sono.
- **`chrome.runtime.onMessage`**: Desperta o SW quando um Content Script ou Popup envia um sinal.

```javascript
// OBRIGATÓRIO: Registrar alarmes para tarefas futuras
chrome.alarms.create("keepAlive", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("SW Ressuscitado para tarefa agendada.");
  }
});
```

---

## 2. CONTENT SCRIPTS: ISOLAMENTO DE MUNDOS

Content Scripts rodam no contexto da página web, mas em um **Mundo Isolado**.

### 2.1 Mundos Isolados
- O seu script compartilha o **DOM** com o site, mas **NÃO** compartilha o JavaScript.
- Variáveis globais definidas pelo site (ex: `window.jQuery`) não são visíveis para o seu Content Script, e vice-versa. Isso evita conflitos e quebra de sites.

### 2.2 Comunicação Segura
Para enviar dados da página para o SW sem expor a lógica:
```javascript
// No Content Script
chrome.runtime.sendMessage({ type: "DATA_FOUND", payload: { id: 123 } });
```

---

## 3. INTERFACES DE VIDA CURTA (POPUP & OPTIONS)

### 3.1 A Morte do Popup
O Popup é um documento HTML que vive apenas enquanto está visível. No momento em que o usuário clica fora dele, o processo é **destruído**.

### 3.2 Regra de Estado (Persistência em Tempo Real)
Você **DEVE** salvar cada input do usuário imediatamente no `storage.session` para evitar perda de dados em fechamentos acidentais.
```javascript
// No popup.js
document.querySelector("#myInput").addEventListener("input", (e) => {
  chrome.storage.session.set({ draft: e.target.value });
});
```

---

## 4. SIDE PANEL API (UI PERSISTENTE)

Diferente do Popup, o **Side Panel** pode permanecer aberto enquanto o usuário navega entre abas, sendo o padrão para fluxos de trabalho longos em 2026.

- **Persistência Global:** Configure `path` no manifesto para um painel que não muda.
- **Persistência por Aba:** Use `chrome.sidePanel.setOptions({ tabId, path, enabled: true })` para comportamentos específicos.

---

## 5. OFFSCREEN DOCUMENTS (DOM EM SEGUNDO PLANO)

O Service Worker não tem acesso ao DOM. Se você precisa de APIs como `DOMParser`, `Canvas`, ou reprodução de áudio, você **DEVE** usar um Offscreen Document.

### 5.1 O Refúgio do DOM
O Offscreen Document é um arquivo HTML invisível que possui acesso total às APIs de web padrão.

### 5.2 Ciclo de Vida do Offscreen
**Imperativo:** Você deve abrir o documento apenas quando necessário e **FECHAR** imediatamente após o uso para evitar vazamento de memória e penalidades na Web Store.

```javascript
async function handleOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["DOM_PARSER"],
    justification: "Necessário para processar dados complexos do site."
  });
}

// Fechar após o uso
// chrome.offscreen.closeDocument();
```

---

## 6. O ERRO FATAL DA MENSAGERIA (CRITICAL)

O erro mais comum em 2026 é o fechamento prematuro do canal de comunicação.

- **Regra de Ouro:** Se o seu listener de `onMessage` for realizar qualquer tarefa assíncrona (ex: `fetch` ou `storage.get`), você **DEVE** retornar `true` no final da função.
- **Consequência:** Se não retornar `true`, o `sendResponse` se tornará inválido e o remetente receberá um erro de "Channel closed before a response was received".

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_DATA") {
    fetchData().then(data => sendResponse(data));
    return true; // MANTÉM O CANAL ABERTO PARA RESPOSTA ASSÍNCRONA
  }
});
```

---

## CHECKLIST DE CICLO DE VIDA: "MINHA EXTENSÃO SOBREVIVE?"

- [ ] O Service Worker usa `chrome.alarms` em vez de `setInterval`?
- [ ] Todos os listeners assíncronos de `onMessage` retornam `true`?
- [ ] O estado do Popup é salvo em tempo real no `storage.session`?
- [ ] O Offscreen Document é fechado (`closeDocument`) após a execução da tarefa?
- [ ] O SW não tenta acessar `window` ou `document` diretamente?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
