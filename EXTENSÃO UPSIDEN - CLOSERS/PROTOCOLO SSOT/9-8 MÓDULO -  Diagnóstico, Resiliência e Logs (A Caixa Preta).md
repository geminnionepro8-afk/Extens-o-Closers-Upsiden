# MÓDULO 08: DIAGNÓSTICO, RESILIÊNCIA E LOGS (A CAIXA PRETA)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth)

Este módulo estabelece os padrões imperativos para o tratamento de erros, sistemas de logs estruturados e telemetria, garantindo que as extensões Chrome 140+ sejam resilientes e fáceis de depurar.

---

## 1. PADRÃO DE TRY/CATCH GLOBAL E RESILIÊNCIA

Em 2026, a resiliência não é opcional. Uma extensão SSOT deve antecipar falhas de rede, de API (Supabase/n8n) e de contexto.

### 1.1 Hierarquia de Erros e Graceful Degradation
- **Regra SSOT:** Toda função que interage com APIs externas ou com o DOM **DEVE** estar envolta em um bloco `try/catch`.
- **Degradação Graciosa:** Se o Supabase cair, a extensão **NÃO DEVE** travar. Ela deve exibir uma mensagem clara: *"Serviço temporariamente indisponível. Tentando reconectar..."*.

### 1.2 Uncaught Exceptions no Service Worker
O Service Worker (SW) pode morrer silenciosamente. Para capturar erros globais:
```javascript
self.addEventListener('error', (event) => {
  Logger.error('Erro Crítico no Service Worker', event.error, { fatal: true });
});

self.addEventListener('unhandledrejection', (event) => {
  Logger.warn('Promessa Rejeitada sem Tratamento', event.reason);
});
```

---

## 2. SISTEMA DE LOGS ESTRUTURADOS (LOGGER SSOT)

Logs de texto simples são ineficientes. O padrão SSOT exige logs baseados em objetos para facilitar a filtragem.

### 2.1 Níveis de Log e Formato de Objeto
O Logger deve seguir esta estrutura de metadados:
```javascript
const Logger = {
  DEBUG_MODE: false, // Flag de produção
  
  log(level, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: location.pathname,
      message,
      metadata,
      stack: level === 'ERROR' ? new Error().stack : undefined
    };

    if (this.DEBUG_MODE) console.log(`[${entry.level}] ${message}`, entry);
    this.persist(entry);
  },

  async persist(entry) {
    const { logs = [] } = await chrome.storage.local.get('logs');
    const updatedLogs = [entry, ...logs].slice(0, 50); // Mantém os últimos 50
    await chrome.storage.local.set({ logs: updatedLogs });
  }
};
```

---

## 3. ERROR REPORTING (TELEMETRIA)

### 3.1 Captura Automática (Throttling)
Erros críticos devem ser enviados para o back-end (Webhook n8n ou Supabase), mas com limites para evitar ataques de negação de serviço (DoS) contra si mesmo.
- **Regra de Ruído:** Não envie o mesmo erro mais de uma vez por minuto.

```javascript
async function reportError(errorEntry) {
  const lastReport = await chrome.storage.session.get('lastErrorReport');
  if (Date.now() - (lastReport.ts || 0) < 60000) return; // Throttling

  fetch('https://seu-n8n-webhook.com/errors', {
    method: 'POST',
    body: JSON.stringify(errorEntry)
  });
  chrome.storage.session.set({ lastErrorReport: { ts: Date.now() } });
}
```

---

## 4. PECADO CAPITAL: CONSOLE.LOG EM PRODUÇÃO

**É TERMINANTEMENTE PROIBIDO** deixar `console.log` ativos no código final da extensão.
- **Motivo:** Logs de desenvolvimento expõem a lógica interna ao cliente e "sujam" o console de depuração do usuário.
- **A Solução:** Use o **Wrapper de Produção** (Logger SSOT) com a flag `DEBUG_MODE` definida como `false`.

---

## 5. MONITORAMENTO DE PERFORMANCE (SERVICE WORKER)

O Chrome encerra Service Workers que demoram muito para responder.
- **Métrica SSOT:** Registre o tempo de execução de chamadas de API. Se uma tarefa exceder 2 segundos, registre como um `WARN` de performance.

```javascript
const start = performance.now();
await processLargeData();
const duration = performance.now() - start;

if (duration > 2000) {
  Logger.warn('Tarefa Pesada Detectada', { duration: `${duration.toFixed(2)}ms` });
}
```

---

## TABELA DE RESILIÊNCIA: "O QUE FAZER SE...?"

| Cenário de Falha | Comportamento Esperado (SSOT) | Ação de Log |
| :--- | :--- | :--- |
| **Supabase Offline** | Mostrar "Offline Mode" no Popup. | `[ERROR] API_UNAVAILABLE` |
| **n8n Timeout** | Tentar novamente (Retry) até 3 vezes. | `[WARN] WEBHOOK_TIMEOUT` |
| **Context Invalidated** | Instruir o usuário a recarregar a aba. | `[INFO] CONTEXT_RELOAD_REQ` |
| **Quota Excedida** | Limpar logs antigos e avisar o usuário. | `[ERROR] STORAGE_QUOTA_FULL` |

---

## CHECKLIST DE RESILIÊNCIA SSOT

- [ ] A flag `DEBUG_MODE` está como `false` para o build de produção?
- [ ] Todas as chamadas `fetch` possuem blocos `try/catch` e timeouts?
- [ ] O sistema de logs mantém os últimos 50 eventos no `storage.local`?
- [ ] Existe um listener global para `unhandledrejection` no Service Worker?
- [ ] A extensão exibe mensagens de erro amigáveis em vez de falhar silenciosamente?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
