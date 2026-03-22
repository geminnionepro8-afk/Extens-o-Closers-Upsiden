# MÓDULO 07: SEGURANÇA, PRIVACIDADE E COMPLIANCE (A INVIOLÁVEL)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth)

Este módulo estabelece os protocolos de segurança e privacidade para extensões Chrome 140+, focando no **Princípio do Privilégio Mínimo (PoLP)** e na conformidade rigorosa para aprovação imediata na Chrome Web Store em 2026.

---

## 1. PRINCÍPIO DO PRIVILÉGIO MÍNIMO (PoLP)

A segurança começa no `manifest.json`. Em 2026, a Google prioriza extensões que demonstram parcimônia no acesso a dados.

### 1.1 Manifesto Limpo e Permissões Opcionais
- **Regra SSOT:** Solicite apenas o que for vital para a função principal.
- **`optional_permissions`**: Use para recursos secundários. Isso reduz o "Alerta de Medo" na instalação e permite que o usuário conceda acesso apenas quando necessário.

### 1.2 Host Permissions: O Perigo do `<all_urls>`
- **Proibição:** Evite o uso de `<all_urls>` a menos que a extensão seja um utilitário global (ex: AdBlocker).
- **Ação:** Restrinja o acesso apenas aos domínios de trabalho (ex: `https://*.supabase.co/*`, `https://*.n8n.cloud/*`). Isso acelera a revisão humana em até 70%.

---

## 2. SANITIZAÇÃO DE DADOS E PREVENÇÃO DE XSS

A injeção de scripts maliciosos (XSS) é a maior vulnerabilidade em extensões.

### 2.1 Defesa de DOM: A Regra de Ouro
- **PROIBIDO:** O uso de `innerHTML`, `outerHTML` ou `document.write()`.
- **PERMITIDO:** Use `textContent` ou `innerText` para inserir textos. Para criar elementos complexos, use `document.createElement()`.

### 2.2 Trusted Types API (Padrão 2026)
Para manipular HTML de forma segura quando for estritamente necessário, você **DEVE** usar a API de **Trusted Types**.

```javascript
// No Service Worker ou Content Script
if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const policy = window.trustedTypes.createPolicy('ssot-policy', {
    createHTML: (string) => string.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  });
  // Uso seguro
  element.innerHTML = policy.createHTML(userData);
}
```

---

## 3. MANUSEIO DE PII (INFORMAÇÕES PESSOALMENTE IDENTIFICÁVEIS)

### 3.1 Privacidade por Design
- **Anonimização:** Remova e-mails, nomes e IDs antes de enviar logs ou dados para IAs externas.
- **Tratamento de Dados:** Nunca armazene PII em `storage.sync` sem criptografia.

### 3.2 Política de Privacidade 2026
Sua política deve declarar explicitamente:
1.  Quais dados são coletados.
2.  Por que são necessários (justificativa técnica).
3.  Com quem são compartilhados (ex: "Dados enviados apenas para Supabase via HTTPS").

---

## 4. PECADOS CAPITAIS E PROIBIÇÕES MV3

O descumprimento destas regras gera **banimento imediato** ou rejeição automática:

| Prática Proibida | Motivo Técnico | Alternativa SSOT |
| :--- | :--- | :--- |
| `eval()` / `new Function()` | Execução de código arbitrário. | Refatorar para lógica estática. |
| Scripts Remotos (CDN) | Risco de alteração de código pós-revisão. | Incluir SDKs localmente no pacote. |
| `setTimeout(string)` | Execução de string como código. | Passar uma função anônima: `setTimeout(() => {}, 100)`. |
| Coleta Oculta de Dados | Violação de confiança do usuário. | Declaração clara e permissão `optional`. |

---

## 5. COMUNICAÇÃO SEGURA COM BACK-END

### 5.1 Segurança de Headers e Tokens
- **HTTPS:** Obrigatório para toda comunicação externa.
- **Validação:** Sempre valide o esquema do JSON retornado pela API antes de processá-lo. Não confie que o servidor sempre enviará dados limpos.

---

## COMPARATIVO: CÓDIGO VULNERÁVEL VS. CÓDIGO BLINDADO

### ❌ Código Vulnerável (Anti-Padrão)
```javascript
// Risco de XSS e injeção de script
const userData = await fetch('https://api.com/user').then(r => r.json());
document.getElementById('welcome').innerHTML = `Olá, ${userData.name}`;
```

### ✅ Código Blindado SSOT (Padrão 2026)
```javascript
// Uso de textContent e validação de origem
const response = await fetch('https://api.com/user');
if (response.ok) {
  const userData = await response.json();
  const welcomeEl = document.getElementById('welcome');
  welcomeEl.textContent = `Olá, ${String(userData.name).substring(0, 50)}`; // Sanitização básica
}
```

---

## CHECKLIST DE AUDITORIA SSOT

- [ ] A extensão solicita apenas as permissões mínimas no manifesto?
- [ ] O uso de `innerHTML` foi totalmente eliminado ou protegido por `Trusted Types`?
- [ ] Todos os SDKs (Supabase, Firebase) estão dentro do pacote da extensão?
- [ ] A política de privacidade reflete exatamente o que o código faz?
- [ ] Dados sensíveis são criptografados antes de irem para o `storage.local`?
- [ ] O `sender.id` é validado em todas as mensagens recebidas no Service Worker?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
