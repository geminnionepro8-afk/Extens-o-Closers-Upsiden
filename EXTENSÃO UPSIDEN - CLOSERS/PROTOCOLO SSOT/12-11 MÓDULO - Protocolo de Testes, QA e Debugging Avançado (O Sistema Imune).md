# MÓDULO 11: PROTOCOLO DE TESTES, QA E DEBUGGING (O SISTEMA IMUNE)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth) | DENSIDADE SÊNIOR

Este módulo estabelece os protocolos de defesa e auditoria para garantir que toda funcionalidade da extensão seja resiliente, testável e livre de regressões no ecossistema Chrome 140+.

---

## 1. UNIT TESTING NO ECOSSISTEMA CHROME

Em 2026, testar extensões não exige mais abrir o navegador manualmente para cada pequena alteração. O padrão SSOT utiliza o **Vitest** pela sua velocidade e integração nativa com o pipeline de build (Módulo 09).

### 1.1 Mocking da API Chrome
Como a API `chrome` não existe no Node.js, você **DEVE** utilizar mocks esquemáticos que simulem o comportamento assíncrono do Manifesto V3.

```javascript
// Exemplo de Teste Unitário (Vitest) para Mensageria (Módulo 03)
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { sendMessageToBackground } from './messaging';

// Mock global da API Chrome
global.chrome = {
  runtime: {
    sendMessage: vi.fn()
  }
};

describe('Protocolo IPC - Envio de Mensagens', () => {
  it('deve enviar mensagem formatada corretamente', async () => {
    const payload = { data: 'teste' };
    chrome.runtime.sendMessage.mockImplementation((msg, callback) => {
      callback({ success: true });
    });

    const response = await sendMessageToBackground('ACTION_TEST', payload);
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ACTION_TEST',
        payload: payload
      }),
      expect.any(Function)
    );
    expect(response.success).toBe(true);
  });
});
```

---

## 2. CHAOS ENGINEERING (SIMULAÇÃO DE FALHAS)

O "Sistema Imune" da extensão deve ser treinado para sobreviver ao caos da internet real.

### 2.1 Protocolo "Offline First"
Simule a perda de conexão durante chamadas críticas para o Supabase ou n8n.
- **Teste de Resiliência:** Force um erro `TypeError: Failed to fetch` e valide se a UI (Módulo 06) exibe o alerta de reconexão em vez de travar.

### 2.2 Mocks de Erro 500/403
Configure seus testes de integração para retornar status de erro do servidor.
- **Regra SSOT:** Toda chamada de API deve ter um teste correspondente que valide o comportamento da extensão diante de um `Token Expirado (403)` ou `Erro de Servidor (500)`.

---

## 3. CHECKLIST DE AUTO-CRÍTICA DA IA (PRE-FLIGHT)

Antes de qualquer entrega de código, a IA **DEVE** validar os seguintes pontos:

1.  **Sobrevivência ao Sono:** Este código funciona se o Service Worker for encerrado e reiniciado no meio da execução?
2.  **Isolamento de Contexto:** Existe algum risco de vazamento de variáveis para o escopo global do site hospedeiro?
3.  **Sanitização:** Todos os dados vindos de fontes externas passam por `textContent` ou `Trusted Types`?
4.  **Eficiência Térmica:** Há algum loop ou listener que possa causar alto consumo de CPU em repouso?
5.  **Persistência:** O estado necessário para completar esta ação está salvo no `storage.session` ou `local`?

---

## 4. TRILHA DE MIGALHAS (AUDITORIA DE BUGS)

Para erros que ocorrem apenas após uso prolongado, o padrão SSOT exige uma trilha de auditoria.

### 4.1 Persistent Breadcrumbs
Registre as últimas 20 ações do usuário em um log circular volátil no `storage.session`.
```javascript
// Logger de migalhas
async function addBreadcrumb(action) {
  const { crumbs = [] } = await chrome.storage.session.get('crumbs');
  const updated = [...crumbs, { t: Date.now(), action }].slice(-20);
  await chrome.storage.session.set({ crumbs: updated });
}
```

### 4.2 Snapshot do Estado
No momento de um erro crítico (capturado via `try/catch` global - Módulo 08), capture um snapshot completo do `storage.local` e anexe ao log de erro. Isso permite reproduzir o cenário exato do bug no laboratório.

---

## 5. DEBUGGING AVANÇADO EM PRODUÇÃO

### 5.1 Source Maps Protegidos
Para depurar em produção sem expor o código fonte original:
- **Regra:** Gere Source Maps durante o build, mas **NÃO** os envie para o servidor público. Mantenha-os em um servidor de símbolos privado ou carregue-os localmente no Chrome DevTools quando necessário.

---

## CHECKLIST DO SISTEMA IMUNE SSOT

- [ ] Toda nova função possui um teste unitário no Vitest?
- [ ] O comportamento "Offline" foi testado e validado na UI?
- [ ] O Checklist de Auto-Crítica foi aplicado ao código final?
- [ ] O sistema de Breadcrumbs está registrando ações críticas?
- [ ] Erros de API (500/403) resultam em mensagens amigáveis ao usuário?
- [ ] O Service Worker é capaz de recuperar o estado após um crash simulado?

---
**Pesquisador-Arquiteto SSOT**
*Documentação de resiliência e QA senior.*
*Data de Validação: 21 de Março de 2026.*
