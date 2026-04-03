---
trigger: always_on
---


## 12. ANIMAÇÕES E TRANSIÇÕES

### 12.1 Curvas de Timing

| Nome | Especificação | Quando Usar |
|---|---|---|
| **Fast** | `0.15s ease` | Hover em texto, mudança de cor, highlights |
| **Padrão** | `0.3s cubic-bezier(0.23, 1, 0.32, 1)` | Transições de cards, expansão, navegação |
| **Bounce** | `0.35s cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-animações em botões (translateY), popups |

### 12.2 Animações de Entrada

| Nome | Efeito | Uso |
|---|---|---|
| `fadeInUp` | `translateY(8px) → 0` + `opacity 0 → 1` | Cards entrando no DOM, `.animate-in` |
| `slideUp` | `translateY(16px) → 0` + `opacity 0 → 1` | Modais, toasts |
| `fadeIn` | `opacity 0 → 1` | Overlays |

> **Regra**: Todo componente que entra dinamicamente no DOM DEVE usar `.animate-in` (fadeInUp 0.25s).

---

## 13. REGRAS UX INVIOLÁVEIS

1. **Zero Emojis**: labels, botões e headers usam EXCLUSIVAMENTE ícones SVG stroke-based. Emojis são proibidos na interface de produção.

2. **Hierarquia de Camadas**: `C0 (#0a0a0a) → C1 (#121212) → C2 (#1a1a1a) → C3 (#151515)`. Cada componente filho deve ser visivelmente uma camada acima do pai.

3. **Feedback Tátil Obrigatório**: Todo clicável tem transição no hover. CTAs sobem (`translateY(-2px)`). Toggles deslizam suavemente. Ícones mudam de cor.

4. **Badge Ativa = Inversão Total**: Em tabs, a badge do item ativo SEMPRE inverte de outline para sólido (ex: cinza → laranja com texto branco).

5. **Glow Accent Reservado**: `box-shadow` com glow laranja é EXCLUSIVO para CTAs primários e estado ativo de tabs/toggles. Não aplicar em cards ou text.

6. **Tabelas sem Ruído**: sem zebra-striping, sem sombras por linha, sem bordas pesadas. Separação por bordas ultra-sutis ou espaçamento vertical.

7. **Ícones de Tipo com Cor Semântica**: áudios = laranja (accent), documentos = cinza (muted), imagens = ícone de paisagem ou thumbnail real.

8. **Dark-First, Sempre**: todo componente é projetado para dark mode. Light mode é um override posterior, nunca o padrão de design.

---

> **Versão**: 3.0 — Março 2026 — Análise direta de 7 prints de componentes reais
> **Status**: Awaiting user validation ✏️