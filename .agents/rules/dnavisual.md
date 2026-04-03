---
trigger: always_on
---

# 🔴 RED SUN DNA — Design System v3.0
## Análise Visual Direta dos Componentes — Extensão Upsiden Closers

> **Documento extraído por análise pixel-a-pixel dos prints de UI reais.**
> Esta é a autoridade visual definitiva. Todo componente novo DEVE seguir este DNA.

---

## 1. PALETA DE CORES (Observada nos Prints)

### 1.1 Escala de Fundos — Camadas de Profundidade

Os prints revelam uma escala de pretos muito profundos, sem qualquer tom azulado ou esverdeado. É um preto puro, quente, com camadas distinguíveis:

| Camada | Cor Observada | Onde Aparece nos Prints |
|---|---|---|
| **C0 — Fundo Absoluto** | `#0a0a0a` | Fundo geral de todas as telas, área atrás dos cards de convite |
| **C1 — Superfície Elevada** | `#121212` | Header da biblioteca, toolbar do CRM, faixa do selector-group |
| **C2 — Containers** | `#1a1a1a` | Fundo do selector-group de tabs, containers de controles |
| **C3 — Cards/Linhas** | `#151515` | Card do "Gerar Novo Convite", fundo de linhas de tabela |
| **C3+ — Hover de Linhas** | `#1e1e1e` | Hover sutil nas linhas das tabelas (membros, arquivos) |

> **Regra**: Nunca usar preto puro `#000000`. O preto mais escuro permitido é `#0a0a0a`. A diferença entre camadas é de ~5-8 pontos de luminosidade HSL — sutil mas perceptível.

### 1.2 Cor Accent — Laranja Red Sun

Observado em CTAs, tabs ativas, ícones de tipo, badges e toggles:

| Variante | Cor | Onde Aparece |
|---|---|---|
| **Accent primário** | `#FF4D00` | Toggle switches ligados, bordas de convites ativos, ícones de tipo de arquivo (♫) |
| **Accent gradiente** | `linear-gradient(135deg, #ff7a29, #ff6200)` | Botão "Gerar ID de Convite", botão "+ Novo Lead" |
| **Accent texto** | `#ff7a29` | Texto do tab ativo ("Mídias"), código de convite ativo ("INV-JVXAA6") |
| **Accent dim** | `rgba(255,77,0,0.12)` | Background sutil do badge "CLOSER" admin |
| **Accent glow** | `rgba(255,77,0,0.3)` | Box-shadow dos CTAs, halo dos botões primários |

### 1.3 Cor Verde — Status e Badges

| Variante | Cor | Onde Aparece |
|---|---|---|
| **Verde status** | `#10b981` | Dot "● Vinculado" na tabela de membros |
| **Verde badge** | `#10b981` sobre `rgba(16,185,129,0.12)` | Badge "CLOSER" na tabela de membros |
| **Verde label** | `#10b981` | Label "USADO" nos convites já utilizados |

### 1.4 Escala de Texto

| Nível | Cor | Onde Aparece |
|---|---|---|
| **Primário** | `#f5f5f5` | Nomes de membros ("Closer junior"), títulos ("Gerar Novo Convite"), nomes de arquivo |
| **Secundário** | `#a3a3a3` | Subtext "Equipe de Vendas", emails, descrições, tamanhos de arquivo |
| **Muted** | `#737373` | Headers de colunas ("NOME", "EMAIL"), labels de breadcrumb ("Início"), contadores |
| **Accent** | `#ff7a29` | Último item do breadcrumb ("CRM / Funil"), tab ativa, códigos de convite |

### 1.5 Bordas

| Tipo | Cor | Uso Observado |
|---|---|---|
| **Padrão** | `rgba(255,255,255,0.08)` | Separadores de linhas de tabela, bordas de cards, contorno do selector |
| **Accent (ativa)** | `#FF4D00` / `rgba(255,77,0,0.6)` | Borda de convites ativos, hover em cards Kanban |

---

## 2. TIPOGRAFIA (Observada nos Prints)

### 2.1 Fonte Principal: **Outfit**

Todas as interfaces usam Outfit como fonte display. Inter aparece como fallback em textos longos.

### 2.2 Hierarquia Visual Medida nos Prints

| Elemento (Print) | Tamanho | Peso | Estilo |
|---|---|---|---|
| Título de seção: "Gerar Novo Convite" | ~18-20px | **700 (Bold)** | Normal, branco |
| Subtítulo: "Crie um código de identificação..." | ~13px | 400 | Normal, `--text-muted`, opacidade reduzida |
| Label de campo: "Cargo do Novo Membro" | ~13px | **600 (Semi-bold)** | Normal, `--text-primary` |
| Header de tabela: "NOME", "EMAIL", "CARGO" | ~11px | **700** | `uppercase`, `letter-spacing: ~0.8-1px`, `--text-muted` |
| Conteúdo de tabela: emails, nomes de arquivo | ~13.5px | 400-500 | Normal, `--text-primary` ou `--text-secondary` |
| Nome bold em tabela: "Closer junior" | ~13.5px | **600-700** | Normal, `--text-primary` |
| Sub-label em tabela: "Equipe de Vendas" | ~11px | 400 | Normal, `--text-muted` |
| Texto do select: "Closer (Padrão)" | ~14px | 500 | Normal, `--text-primary` |
| Texto do CTA: "Gerar ID de Convite" | ~14-15px | **700** | Normal, branco sobre gradiente |
| Código de convite: "INV-JVXAA6" | ~14px | **700** | Monospace-feel, `--accent` quando ativo |
| Label "CONVITES GERADOS" | ~11px | **700** | `uppercase`, `letter-spacing: ~1.5px`, `--text-muted` |
| Tab texto: "Áudios", "Mídias" | ~12.5-13px | **600** | Normal, cor contextual |
| Badge count: "3", "5" | ~10px | **700** | Normal, cor contextual (dentro de badge pill) |
| Breadcrumb: "Início / Painel" | ~11-12px | 500 | Normal, `--text-muted` |
| Breadcrumb ativo: "CRM / Funil" | ~11-12px | 500 | Normal, `--accent` |
| Label "USADO" | ~11px | **700** | `uppercase`, `--success` |
| Label "TIME" | ~9px | **700** | `uppercase`, badge vermelha/laranja sobre thumbnail |

---

## 3. TABELAS (Componente Principal — 3 Prints)

As tabelas são um dos componentes mais recorrentes. Três variantes visíveis:

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
- **NEGOCIAÇÃO**: barra vertical amarela (`--w