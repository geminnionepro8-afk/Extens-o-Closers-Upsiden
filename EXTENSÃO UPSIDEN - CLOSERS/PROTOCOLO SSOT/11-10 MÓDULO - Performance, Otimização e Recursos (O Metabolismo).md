# MÓDULO 10: PERFORMANCE, OTIMIZAÇÃO E RECURSOS (O METABOLISMO)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth) | DENSIDADE SÊNIOR

Este módulo estabelece as diretrizes imperativas para a eficiência térmica e de memória em extensões Chrome 140+, focando em latência zero, baixo consumo de RAM e fluidez total do navegador.

---

## 1. GESTÃO DE MEMÓRIA E SERVICE WORKERS

No Manifesto V3, a efemeridade do Service Worker (SW) é uma oportunidade para limpar a memória, mas se mal gerenciada, pode causar vazamentos (Memory Leaks) que degradam o sistema.

### 1.1 Memory Leak Prevention
- **Regra SSOT:** Todo listener de evento adicionado dinamicamente (ex: no `content script` ou `offscreen document`) **DEVE** ser removido quando o componente for destruído.
- **Listeners de Longa Duração:** No Service Worker, evite adicionar listeners dentro de outros listeners. Isso cria múltiplas instâncias do mesmo evento a cada despertar do SW.

### 1.2 Garbage Collection (GC) e V8 2026
O motor V8 de 2026 é altamente eficiente, mas você deve facilitar o seu trabalho:
- **Pecado Capital:** O uso de variáveis globais gigantes (objetos ou arrays de cache) que nunca são limpas. 
- **Ação:** Use `null` para liberar referências de objetos grandes assim que terminarem de ser processados. Prefira `WeakMap` e `WeakSet` para armazenar metadados de elementos do DOM, permitindo que o GC os limpe automaticamente quando o elemento for removido.

---

## 2. LAZY LOADING E IMPORTAÇÃO DINÂMICA

Carregar tudo no início (Eager Loading) aumenta o tempo de "boot" da extensão e consome RAM desnecessária.

### 2.1 Code Splitting (Importação Dinâmica)
Use `import()` dinâmico para carregar SDKs pesados (Supabase, Firebase, bibliotecas de IA/WASM) apenas no momento da execução da tarefa.

```javascript
// Exemplo SSOT: Carregamento sob demanda do Supabase
async function getSupabaseClient() {
  const { createClient } = await import('./libs/supabase-js.min.js');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
}
```

### 2.2 Conditional Execution
Não carregue scripts de UI pesados se o usuário não interagiu com a extensão. Use o Service Worker para monitorar o clique no `action` e injete o código necessário apenas naquele momento via `chrome.scripting.executeScript`.

---

## 3. OTIMIZAÇÃO DE DOM E SELETORES

Manipular o DOM é a operação mais cara em termos de CPU em um Content Script.

### 3.1 Cache de Seletores e Intersection Observer
- **Proibição:** Nunca execute `document.querySelectorAll` dentro de um loop de processamento ou evento de scroll.
- **Intersection Observer:** Substitua o monitoramento de scroll (`onscroll`) pela `Intersection Observer API`. Ela permite detectar quando um elemento entra na tela com custo de CPU próximo de zero.

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Inicia processamento apenas quando visível
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-item').forEach(el => observer.observe(el));
```

### 3.2 RequestAnimationFrame (RAF)
Para animações ou mudanças visuais intensas (ex: barras de progresso), use `requestAnimationFrame`. Isso sincroniza a manipulação do DOM com a taxa de atualização do monitor, evitando o **Layout Thrashing**.

---

## 4. PRIORIZAÇÃO DE RECURSOS E ASSETS

### 4.1 Offscreen Documents para Processamento Pesado
Se sua extensão realiza cálculos matemáticos complexos, processamento de imagem ou IA local (WASM), **DEVE** delegar isso para um **Offscreen Document**.
- **Por que?** Isso evita que a thread principal do Service Worker fique bloqueada, garantindo que a extensão continue respondendo a eventos de rede e cliques.

### 4.2 Formatos Modernos (WebP/AVIF)
Substitua todos os ativos visuais por formatos modernos.
- **AVIF/WebP:** Reduzem o tamanho das imagens em até 80% em comparação ao PNG/JPG, acelerando o carregamento da UI.

---

## 5. MÉTRICAS DE PERFORMANCE (TELEMETRIA)

Você não pode otimizar o que não mede.

### 5.1 Memory Footprint Monitoring
Use a API de performance para registrar o consumo de memória em logs de debug.
```javascript
if (performance.memory) {
  const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
  Logger.debug('Memory Usage', { 
    used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
  });
}
```

---

## COMPARATIVO: ANTES (INEFICIENTE) VS. DEPOIS (SSOT)

### ❌ Código Ineficiente (Consumo Alto)
```javascript
// Monitoramento de scroll pesado
window.addEventListener('scroll', () => {
  const items = document.querySelectorAll('.item'); // Query repetitiva
  items.forEach(item => {
    if (item.getBoundingClientRect().top < window.innerHeight) {
      item.style.opacity = 1;
    }
  });
});
```

### ✅ Código Otimizado SSOT (Consumo Zero)
```javascript
// Intersection Observer isolado e performante
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.style.opacity = 1;
  });
});
document.querySelectorAll('.item').forEach(el => observer.observe(el));
```

---

## CHECKLIST DE METABOLISMO SSOT

- [ ] A extensão usa `Intersection Observer` em vez de eventos de scroll?
- [ ] SDKs pesados (Supabase/IA) são carregados via `import()` dinâmico?
- [ ] Referências de objetos grandes são limpas com `null` após o uso?
- [ ] O Service Worker delega tarefas pesadas para um `Offscreen Document`?
- [ ] A interface utiliza `requestAnimationFrame` para manipulações visuais?
- [ ] O consumo de RAM em repouso é monitorado e mantido abaixo de 50MB?

---
**Pesquisador-Arquiteto SSOT**
*Documentação gerada sob protocolo de alta densidade técnica.*
*Data de Validação: 21 de Março de 2026.*
