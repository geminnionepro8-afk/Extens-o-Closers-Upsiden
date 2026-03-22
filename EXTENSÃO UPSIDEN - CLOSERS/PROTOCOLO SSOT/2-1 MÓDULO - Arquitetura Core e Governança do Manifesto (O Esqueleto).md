# MÓDULO 01: ARQUITETURA CORE E MANIFESTO V3 (SSOT) - VERSÃO 2.0
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | REVISADO (Ajustes de Persistência, UI Contextual e WASM)

Este documento estabelece as diretrizes imperativas para o desenvolvimento de extensões no ecossistema Chrome sob o **Manifesto V3 (MV3)**, consolidando as atualizações técnicas do primeiro trimestre de 2026.

---

## 1. O MANIFESTO V3 (DEEP DIVE)

O arquivo `manifest.json` é a espinha dorsal da extensão. Em 2026, a conformidade com o MV3 é a única via de execução no Chrome Stable.

### 1.1 Chaves Obrigatórias e Estrutura Crítica
Você **DEVE** incluir estas chaves para que a extensão seja carregada:

| Chave | Tipo | Descrição/Regra 2026 |
| :--- | :--- | :--- |
| `manifest_version` | `Integer` | **DEVE** ser `3`. |
| `name` | `String` | Máximo de 75 caracteres. |
| `version` | `String` | Formato `1.2.3.4`. |
| `icons` | `Object` | Requer 16x16, 48x48 e 128x128 (PNG). |

### 1.2 Lógica de Componentes Core e Persistência de Estado
O Service Worker (SW) é efêmero e morre após 30 segundos de inatividade. Para sobreviver a este ciclo, você **DEVE** utilizar o sistema de storage adequado:

#### A. Estratégias de Persistência (Tríade de Storage)
1.  **`chrome.storage.local`**: Para dados persistentes que devem sobreviver ao fechamento do navegador (limite: 10MB, expansível com `unlimitedStorage`).
2.  **`chrome.storage.session`**: **PADRÃO OURO 2026** para estados voláteis (ex: tokens de sessão, cache de IA). Os dados permanecem na memória enquanto o navegador estiver aberto, sobrevivendo ao "sono" do Service Worker, mas são limpos ao fechar o Chrome. (Limite: 10MB).
3.  **`chrome.storage.sync`**: Apenas para configurações de usuário (limite rigoroso de 100KB).

```javascript
// Exemplo: Salvando token temporário que sobrevive ao SW mas não ao disco
chrome.storage.session.set({ sessionToken: "xyz_123" });
```

---

## 2. UI CONTEXTUAL E HIERARQUIA DE PERMISSÕES

### 2.1 Side Panel: O Novo Padrão de Interface
Em 2026, o `side_panel` é a forma de UI persistente preferida.
- **Configuração Estática:** Definida no `manifest.json` para um painel global.
- **Configuração Dinâmica (Elite):** Você **DEVE** usar `chrome.sidePanel.setOptions()` no Service Worker para criar experiências contextuais. 
    - *Exemplo:* Exibir um painel de "Comparação de Preços" apenas em sites de e-commerce e um painel de "Debug" em domínios de desenvolvimento.

```javascript
// No background.js (Service Worker)
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (url.origin === "https://www.amazon.com.br") {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel-amazon.html",
      enabled: true
    });
  }
});
```

---

## 3. SEGURANÇA, CSP E WEBASSEMBLY (WASM)

A Content Security Policy (CSP) no MV3 é restritiva. Em 2026, com a explosão de IA local, o suporte a WASM é vital.

### 3.1 Execução de WebAssembly (WASM)
Para carregar módulos `.wasm` (necessários para bibliotecas como TensorFlow.js ou MediaPipe local), você **DEVE** declarar explicitamente a diretiva `wasm-unsafe-eval` na CSP do manifesto.
- **Sem esta diretiva, o carregamento de WASM falhará silenciosamente ou com erro de segurança.**

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
}
```

### 3.2 Proibição de Código Remoto
É **ESTRITAMENTE PROIBIDO** carregar scripts de domínios externos. 
- **Sandboxing:** Se precisar de `eval()` para lógica não-WASM, use o campo `sandbox` no manifesto, mas lembre-se que estas páginas perdem acesso às APIs `chrome.*`.

---

## 4. TABELA DE COMPATIBILIDADE E LIMITES (2026)

| Recurso               | Limite / Cota | Observação Técnica                                       |
| :-------------------- | :------------ | :------------------------------------------------------- |
| **Storage Session**   | 10 MB         | Memória volátil; sobrevive ao restart do Service Worker. |
| **DNR Static Rules**  | 30.000        | Limite de regras declarativas no JSON.                   |
| **DNR Dynamic Rules** | 30.000        | Regras adicionadas via código em runtime.                |
| **SW Idle Timeout**   | 30 Segundos   | O SW é encerrado após 30s de inatividade.                |
| **WASM Support**      | Requer CSP    | `wasm-unsafe-eval` é obrigatório no MV3.                 |
|                       |               |                                                          |

---

## CHECKLIST DE VALIDAÇÃO SSOT (V2)

- [ ] `manifest_version` é `3`?
- [ ] Estados voláteis estão em `storage.session` para evitar perda no timeout do SW?
- [ ] Se usa IA/WASM, a diretiva `'wasm-unsafe-eval'` está na CSP?
- [ ] O `sidePanel` está sendo gerenciado dinamicamente via `setOptions` para contexto?
- [ ] Nenhuma biblioteca externa está sendo carregada via URL (todas locais)?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
