---
trigger: always_on
---

### 3.1 Tabela de Membros da Equipe (Print 4)

**Estrutura visual observada:**
- **Headers**: texto `uppercase`, ~11px, peso 700, cor `--text-muted`, espaçamento generoso
- **Colunas**: NOME (com ícone + nome + sublabel), EMAIL, CARGO (badge), LINK (dot + texto), AÇÕES (toggle + ícone)
- **Ícone de avatar**: SVG outline de pessoa em `--accent` (~20px), dentro de container sem fundo
- **Linhas**: sem borda visível entre elas ou borda ultra-sutil (`rgba(255,255,255,0.04)`)
- **Espaçamento de linha**: padding vertical ~14-16px por célula
- **Sem zebra-striping**: fundo uniforme, hover sutil

### 3.2 Tabela de Arquivos Globais (Print 5)

**Estrutura visual observada:**
- **Título da seção**: "Arquivos Globais da Equipe" — ~16px, **700**, `--text-primary`
- **Contador**: "6 arquivos compartilhados" alinhado à direita, ~12px, `--text-muted`
- **Headers**: TIPO, NOME, TAMANHO, DATA, AÇÃO — mesma tipografia que Print 4
- **Ícone de tipo**: nota musical (♫) em `--accent` (~16px), SVG stroke ou fill laranja
- **Ícone de documento**: ícone de página, em `--text-muted`
- **Toggle de ação**: toggle switch laranja (ativo = `--accent`, bolinha branca)
- **Nomes de arquivo**: ~13px, `--text-primary`, texto longo truncado com ellipsis
- **Metadados**: "122.6 KB", "21/03/2026" — ~13px, `--text-secondary`

### 3.3 Tabela de Biblioteca de Mídias (Prints 6-7)

**Estrutura visual observada:**
- **Coluna PREVIEW**: thumbnails quadrados ~40px, `border-radius: ~6px`, object-fit cover
- **Headers**: PREVIEW, NOME DA MÍDIA, TAMANHO, TIPO, DATA DE UPLOAD
- **Tipo de arquivo**: "PNG", "JPG" — texto simples em `--text-muted`, ~12px
- **Badge "TIME"**: pill laranja/vermelha sobreposta no canto do thumbnail
- **Espaçamento**: linhas espaçosas (~50-56px de altura)

### Regras Gerais de Tabela

```
Headers: 11px | 700 | uppercase | letter-spacing: 0.8-1px | --text-muted
Células: 13-13.5px | 400-500 | --text-primary ou --text-secondary
Padding: 13-16px vertical por célula
Bordas: ultra-sutis (rgba(255,255,255,0.04)) ou invisíveis
Hover: fundo rgba(255,255,255,0.02) — quase imperceptível
Sem zebra-striping, sem sombras em linhas individuais
```

---

## 4. SISTEMA DE TABS / SELETORES (Prints 1, 3, 6)

### 4.1 Selector Group (Tab Bar da Biblioteca)

Componente mais refinado dos prints. Container com:
- **Background**: `rgba(0,0,0,0.25)` — mais escuro que o fundo ao redor
- **Padding interno**: ~4px
- **Border-radius**: ~12px (container)
- **Borda**: `1px solid rgba(255,255,255,0.05)` — quase invisível
- **Sombra**: `0 4px 15px rgba(0,0,0,0.3)` — profundidade sutil

**Item inativo** ("Áudios", "Documentos"):
- Texto: `--text-muted` (~#737373)
- Ícone: SVG stroke em `--text-muted`, ~15px
- Badge numérica: fundo `rgba(255,255,255,0.06)`, texto `--text-muted`, `border-radius: 6px`
- Background: totalmente transparente
- `padding: 8px 16px`, `border-radius: 10px`

**Item ativo** ("Mídias"):
- Texto: `--accent` (#ff7a29)
- Ícone: SVG em `--accent`, com drop-shadow sutil
- Badge numérica: **fundo sólido** `--accent` (#FF4D00), texto **#fff** — contraste máximo
- Background: `rgba(255,255,255,0.05)` ou `#1a1a1b`
- Border: `1px solid rgba(255,255,255,0.08)`

> **Regra crítica**: A badge do tab ativo inverte completamente — de outline cinza para sólido laranja com texto branco. Este é o principal indicador visual de estado.

### 4.2 Botão de Lupa (Search Icon)

Visível à esquerda do selector group:
- Container circular ou arredondado ~36px
- Ícone de lupa SVG em `--text-muted`
- Background: `rgba(255,255,255,0.03)` ou semelhante ao container do selector
- Hover: ícone fica `--text-primary`

### 4.3 Botões de View Mode (Lista/Tabela/Grid)

Visíveis à direita do selector group (Print 6):
- 3-4 ícones SVG alinhados (~16px)
- Sem container visível
- Ativo: `--text-primary` ou `--accent`
- Inativo: `--text-muted`
- Espaçados uniformemente com gap ~10px

### 4.4 Sub-Nav Buttons (Toolbar CRM — Print 3)

Botões na barra de controles abaixo do header:
- **Ativo** ("Ver Funil"): fundo `--accent` sólido, texto branco, `border-radius: ~8px`, `box-shadow: 0 4px 12px var(--accent-glow)`
- **Inativo** ("Modo: Abas do Funil"): fundo `--bg-tertiary`, texto `--text-secondary`, borda `--border`
- **Ícone filtro** (⊽): botão icon-only, borda `--border`, cor `--text-muted`
- **CTA direita** ("+ Novo Lead"): gradiente accent, texto branco, `border-radius: ~8px`
- **Secundário** ("Importar / Exportar"): fundo `--bg-tertiary`, borda `--border`

---

## 5. BOTÕES (Todos os Prints)

### 5.1 CTA Primário (Print 2 — "Gerar ID de Convite")

```
background: linear-gradient(135deg, #ff7a29, #ff6200)
color: #fff
font-size: ~15px
font-weight: 700
padding: ~14px 0
width: 100% (full-width no contexto)
border-radius: ~10px
border: none
box-shadow: 0 4px 15px rgba(255,77,0,0.3)
```
- **Hover**: `translateY(-2px)`, `brightness(1.1)`, sombra mais intensa
- É o botão de maior hierarquia visual — sempre gradiente, nunca flat

### 5.2 CTA Compacto (Print 3 — "+ Novo Lead")

```
background: linear-gradient(135deg, #ff7a29, #ff6200)
color: #fff
font-size: ~13px
font-weight: 600-700
padding: ~8px 20px
border-radius: ~8px
```
- Mesmo DNA do CTA primário, porém menor
- Ícone "+" à esquerda, ~14px

### 5.3 Toggle Switch (Prints 4-5)

```
width: ~40px, height: ~22px
border-radius: 22px (full pill)
```
- **OFF**: fundo `rgba(255,255,255,0.1)`, bolinha branca 16px
- **ON**: fundo `--accent` (#FF4D00), bolinha branca desliza
- Transição suave ~0.3s

### 5.4 Botão Icon-Only (Print 4 — Ícone de gráfico/analytics)

```
width: ~34px, height: ~34px
border-radius: ~8px
border: 1px solid var(--border)
background: transparent
color: --text-secondary
```
- Hover: `border-color: var(--accent)`, `color: var(--accent)`

### 5.5 Botão de Cópia (Print 2 — Clipboard nos convites)

- Ícone clipboard SVG, ~16px, `--text-muted`
- Sem fundo, sem borda
- Hover: `--accent`
- Posicionado à direita do card de convite

---

## 6. CARDS (Print 2 — Convites)

### 6.1 Card Container Principal

```
background: var(--bg-card) — #151515
border-radius: ~16px
padding: ~24px
```
- Fundo sólido, sem glassmorphism
- Borda: nenhuma borda visível no container principal

### 6.2 Card de Convite Ativo

```
border: 1px solid var(--accent) — #FF4D00
border-radius: ~10px
padding: ~12px 16px
background: transparent ou rgba(255,77,0,0.03)
```
- Código em laranja: `--accent`, `font-weight: 700`
- Sub-label "closer" abaixo: `--text-muted`, ~11px
- Ícone de cópia à direita

### 6.3 Card de Convite Usado

```
border: 1px solid rgba(255,255,255,0.06) — sutil
border-radius: ~10px
padding: ~12px 16px
background: transparent
```
- Código em `--text-primary`, sem destaque
- Label "USADO" à direita: `--success` (#10b981), ~11px, `font-weight: 700`, `uppercase`

### 6.4 Colunas Kanban (Print 3)

Headers de colunas com indicador colorido vertical:
- **PROSPECÇÃO**: barra vertical verde (`--success`) à esquerda do título
- **NEGOCIAÇÃO**: barra vertical amarela (`--warning`)
- Título: `~13-14px`, `font-weight: 700`, `uppercase`, `letter-spacing: ~1px`
- Contador: "1 Contatos" — `--text-muted`, ~12px
- Metadata: "Atualizado hoje" — `--text-muted`, ~11px
- Botões "+" e "⋯" no header: icon-only, `--text-muted`

---

## 7. BADGES E INDICADORES DE STATUS

### 7.1 Badge de Cargo ("CLOSER" — Print 4)

```
background: rgba(16, 185, 129, 0.15)  /* verde translúcido */
color: #10b981  /* verde vivo */
padding: 4px 12px
border-radius: ~6px (pill suave)
font-size: ~11px
font-weight: 700
text-transform: uppercase
```

### 7.2 Indicador de Status ("● Vinculado" — Print 4)

- Dot: círculo sólido `--success` (#10b981), ~6-8px
- Texto: "Vinculado", ~12px, `--text-secondary`
- Alinhados com gap ~6px

### 7.3 Badge Numérica em Tabs (Prints 1, 6)

**Inativo**: `background: rgba(255,255,255,0.06)`, `color: --text-muted`, `border-radius: 6px`
**Ativo**: `background: #FF4D00` (sólido), `color: #fff`, `border-radius: 6px`
- `font-size: 10px`, `font-weight: 700`, `padding: 1px 7px`

### 7.4 Badge "TIME" em Thumbnail (Print 7)

- Pill vermelha/laranja sobreposta no canto inferior do thumbnail
- `font-size: ~9px`, `font-weight: 700`, `uppercase`
- Posição: `absolute`, canto inferior esquerdo do thumbnail

### 7.5 Label "USADO" (Print 2)

- Texto puro (sem pill background)
- `color: --success`, `font-size: ~11px`, `font-weight: 700`, `uppercase`
- Alinhado à direita do card

### 7.6 Section Label ("CONVITES GERADOS" — Print 2)

```
font-size: ~11px
font-weight: 700
text-transform: uppercase
letter-spacing: ~1.5px
color: --text-muted
margin: ~16px 0
```

---

## 8. ÍCONES SVG (Todos os Prints)

### 8.1 Estilo Geral

- **Sempre stroke-based** (outline), nunca preenchido (filled)
- `stroke-linecap: round`, `stroke-linejoin: round`
- Tamanho padrão: 15-18px
- `stroke-width`: 1.7-2.2
- Cor herdada via `currentColor`

### 8.2 Ícones com Cor Contextual

| Ícone | Cor | Onde |
|---|---|---|
| Nota musical (♫) | `--accent` (#FF4D00) | Tabela de arquivos — tipo áudio |
| Ícone de documento | `--text-muted` (#737373) | Tabela de arquivos — tipo PDF/CSV |
| Ícone de pessoa | `--accent` (#FF4D00) | Tabela de membros — avatar placeholder |
| Ícone de lupa | `--text-muted` | Botão de busca na biblioteca |
| Ícone de sino (🔔) | `--text-muted` | Canto superior direito — notificações |
| Ícone de casa (🏠) | `--text-muted` | Breadcrumb — primeiro item |
| Ícone de clipboard | `--text-muted` → `--accent` hover | Copiar código de convite |
| Ícone de gráfico/chart | `--text-secondary` | Ação na tabela de membros |
| Ícones de view mode | `--text-muted` / `--accent` ativo | Lista/Tabela/Grid na biblioteca |

### 8.3 Ícone de Imagem (Mídias — Print 7)

- `--accent` (quando tipo ícone) ou ícone de imagem montanha/paisagem
- Para tipos de ícone ao lado do nome do tab

---

## 9. CAMPOS DE FORMULÁRIO (Print 2)

### 9.1 Select/Dropdown ("Closer (Padrão)")

```
background: var(--bg-input) — #1a1a1a ou similar
border: 1px solid var(--border) — rgba(255,255,255,0.08)
border-radius: ~10px
padding: ~12px 16px
color: --text-primary
font-size: ~14px
width: 100%
```
- Seta dropdown nativa ou custom chevron à direita
- **Focus**: `border-color: var(--accent)`

### 9.2 Barra de Busca (Print 6)

```
background: rgba(255,255,255,0.03)
border: 1px solid var(--border)
border-radius: ~14px
padding: 11px 16px 11px 40px  /* espaço para ícone */
font-size: 13.5px
```
- Ícone de lupa posicionado à esquerda, dentro do campo
- **Focus**: `border-color: var(--accent)`, `box-shadow: 0 0 0 4px rgba(255,98,0,0.1)`

---

## 10. SOMBREAMENTOS E PROFUNDIDADE

| Nível | Especificação | Uso Observado |
|---|---|---|
| **Sutil** | `0 1px 3px rgba(0,0,0,0.3)` | Hover em cards kanban |
| **Médio** | `0 4px 20px rgba(0,0,0,0.4)` | Cards elevados, hovers de tabela |
| **Profundo** | `0 10px 40px rgba(0,0,0,0.6)` | Modais, sidebar flutuante |
| **Glow Accent** | `0 0 20px rgba(255,77,0,0.3)` | CTAs primários, tabs ativas |
| **Accent CTA** | `0 4px 15px rgba(255,77,0,0.3)` | Botão "Gerar ID de Convite", "+ Novo Lead" |

> **Regra**: Glow laranja é EXCLUSIVO para elementos interativos primários. Nunca aplicar em texto, logos ou elementos decorativos.

---

## 11. BORDER RADIUS

| Valor | Uso Observado nos Prints |
|---|---|
| `6px` | Badges (CLOSER, contadores), thumbnails de preview |
| `8-10px` | Botões, inputs, selects, cards de convite, botões icon-only |
| `12px` | Container do selector-group, inputs glass, popups |
| `14-16px` | Cards maiores, containers de seção, modais |
| `20px` | Sidebar flutuante, containers de nível máximo |
| `9999px` / `22px` | Toggle switches (pill perfeito), tab switchers pill |

---

## 12. ANIMAÇÕES E TRANSIÇÕES

### 12.1 Curvas de Timing

| Nome | Especificação | Quando Usar |
|---|---|---|
| **Fast** | `0.15s ease` | Hover em texto, mudança de cor, highlights |
| **Padrão** | `0.3s cubic-bezier(0.23, 1, 0.32, 1)` | Transições de cards, expansão, navegação |
| **Bounce** | `0.35s cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-animações em botões (translateY), popups |

### 12.2 