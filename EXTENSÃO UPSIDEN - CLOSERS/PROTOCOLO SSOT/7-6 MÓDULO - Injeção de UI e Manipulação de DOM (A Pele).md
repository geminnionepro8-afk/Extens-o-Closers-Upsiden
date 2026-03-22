# MÓDULO 06: INJEÇÃO DE UI E MANIPULAÇÃO DE DOM (A PELE)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth)

Este módulo estabelece as diretrizes imperativas para a criação e injeção de interfaces profissionais em páginas web, garantindo isolamento visual total e imunidade a conflitos de CSS em 2026.

---

## 1. SHADOW DOM: O ESCUDO DE ISOLAMENTO

Em 2026, injetar elementos diretamente no `body` ou `head` do site hospedeiro é considerado uma falha arquitetural grave. O **Shadow DOM** é a única tecnologia que garante que o CSS do site não quebre a sua extensão e vice-versa.

### 1.1 Conceito de Encapsulamento
O Shadow DOM cria uma subárvore do DOM isolada. Estilos definidos dentro dela não "vazam" para fora, e seletores globais do site (como `div { background: red; }`) não afetam o interior do seu componente.

### 1.2 Implementação Técnica (Modo Open)
Você **DEVE** usar o modo `open` para permitir que o seu script de extensão manipule o conteúdo interno, mantendo o isolamento do site.

```javascript
// 1. Criar o host da extensão
const host = document.createElement('div');
host.id = 'ssot-extension-root';
document.body.appendChild(host);

// 2. Anexar o Shadow Root
const shadowRoot = host.attachShadow({ mode: 'open' });

// 3. Injetar Estilos Isolados (CSSStyleSheet é o padrão 2026)
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { all: initial; } /* Reseta heranças do site */
  .container { 
    background: white; 
    border: 1px solid #ccc; 
    padding: 10px; 
    position: fixed; 
    top: 20px; 
    right: 20px; 
    z-index: 2147483647; 
  }
`);
shadowRoot.adoptedStyleSheets = [sheet];

// 4. Injetar Conteúdo
const container = document.createElement('div');
container.className = 'container';
container.innerHTML = '<h1>SSOT UI Ativa</h1>';
shadowRoot.appendChild(container);
```

### 1.3 Injeção de Assets (Imagens e Fontes)
Para carregar imagens do seu pacote dentro do Shadow DOM, você **DEVE** usar `chrome.runtime.getURL()` e declarar os recursos no manifesto.

---

## 2. GESTÃO DE Z-INDEX E SOBREPOSIÇÃO

### 2.1 A Guerra das Camadas
Para garantir que sua interface não suma atrás de menus `fixed` ou modais do site, utilize o valor máximo permitido para `z-index`: **2147483647**.

### 2.2 Stacking Contexts (Contextos de Empilhamento)
Se o elemento pai (host) estiver dentro de um container com `opacity < 1` ou `transform`, sua UI pode ficar presa em uma camada inferior.
- **Regra SSOT:** Sempre anexe o host da extensão diretamente no `document.documentElement` ou no final do `document.body` para minimizar interferências de contexto.

---

## 3. MUTATIONOBSERVER: REATIVIDADE AO SITE

Sites modernos (Amazon, YouTube, n8n) carregam conteúdo dinamicamente via AJAX ou scroll infinito.

### 3.1 Detecção de Mudanças Dinâmicas
Use o `MutationObserver` para injetar elementos assim que novos nós aparecerem no DOM.

```javascript
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      const product = document.querySelector('.product-card:not(.processed)');
      if (product) {
        injectButton(product);
        product.classList.add('processed');
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

### 3.2 Performance e Higiene
**Imperativo:** Não observe o `document` inteiro se puder observar um container específico. Use filtros de `childList` e sempre chame `observer.disconnect()` se a UI da extensão for removida para evitar vazamento de memória.

---

## 4. PECADO CAPITAL: CONTAMINAÇÃO GLOBAL

**É TERMINANTEMENTE PROIBIDO:**
1.  Injetar tags `<style>` globais que afetem elementos do site.
2.  Modificar classes existentes do site hospedeiro (ex: `document.body.className = 'my-theme'`).
3.  Usar seletores genéricos em Content Scripts.

**Consequência:** A "quebra" do layout original do site é motivo de rejeição imediata na Web Store e causa uma experiência de usuário desastrosa.

---

## 5. WEB_ACCESSIBLE_RESOURCES (MANIFESTO)

Para que o Shadow DOM consiga carregar imagens ou scripts auxiliares, você **DEVE** configurá-los no `manifest.json`.

```json
"web_accessible_resources": [
  {
    "resources": ["assets/*", "styles/injected.css"],
    "matches": ["https://*.amazon.com/*", "https://*.google.com/*"]
  }
]
```

---

## COMPARATIVO: INJEÇÃO INSEGURA VS. INJEÇÃO SSOT

### ❌ Injeção Insegura (Anti-Padrão)
```javascript
const div = document.createElement('div');
div.style.cssText = "background: red; z-index: 999;"; // Sofre herança do CSS do site
document.body.appendChild(div);
```

### ✅ Injeção SSOT (Padrão 2026)
```javascript
const host = document.createElement('div');
const shadow = host.attachShadow({ mode: 'open' });
// Estilos encapsulados via adoptedStyleSheets
document.documentElement.appendChild(host);
```

---

## CHECKLIST DE INTERFACE SSOT

- [ ] A interface está encapsulada em um **Shadow DOM**?
- [ ] O CSS usa `:host { all: initial; }` para resetar heranças?
- [ ] O `z-index` está configurado para o valor máximo (**2147483647**)?
- [ ] Assets externos são carregados via `chrome.runtime.getURL`?
- [ ] Recursos injetados estão listados em `web_accessible_resources`?
- [ ] O `MutationObserver` possui filtros para evitar sobrecarga de CPU?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
