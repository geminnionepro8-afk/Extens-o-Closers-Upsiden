# MÓDULO 09: AUTOMAÇÃO DE BUILD E INTERNACIONALIZAÇÃO (O ROLLOUT)
> **Validado com dados oficiais em 21/03/2026**
> **Status:** DEFINITIVO | SSOT (Single Source of Truth) | DENSIDADE MÁXIMA

Este módulo define a infraestrutura de engenharia necessária para transformar o código de desenvolvimento em um artefato de produção global, resiliente e otimizado para o ecossistema Chrome 140+.

---

## 1. ARQUITETURA DE BUNDLING (VITE / ROLLUP)

Em 2026, o uso de bundlers modernos não é apenas para minificação, mas para gerenciar a complexidade da separação de contextos do Manifesto V3.

### 1.1 Configuração Mestra (Vite + MV3)
Você **DEVE** utilizar uma configuração que trate o Service Worker como um entry point isolado para evitar o vazamento de dependências da UI (React/Vue) para o background, o que causaria erros de "Window is not defined".

```typescript
// vite.config.ts - PADRÃO SSOT 2026
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }), // Plugin que sincroniza o manifest com os assets
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Separação de Chunks: Garante que o SW seja leve
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: '[name].js',
      },
    },
  },
  server: {
    // HMR (Hot Module Replacement) para Extensões
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
});
```

### 1.2 Hot Module Replacement (HMR)
O HMR em extensões permite atualizar o Popup e o Side Panel sem que você precise recarregar a extensão manualmente no `chrome://extensions`. O plugin `@crxjs/vite-plugin` injeta um cliente de HMR que recarrega os componentes automaticamente ao salvar o arquivo.

---

## 2. i18n AVANÇADO (SISTEMA GLOBAL)

Internacionalização em 2026 exige suporte a pluralização, placeholders dinâmicos e suporte a idiomas RTL (Right-to-Left).

### 2.1 Pluralização e Placeholders
O Chrome não suporta pluralização nativa no `messages.json`. Você **DEVE** implementar uma lógica de sufixo ou usar uma biblioteca auxiliar.

```json
// _locales/pt_BR/messages.json
{
  "items_found_one": { "message": "1 item encontrado." },
  "items_found_other": { "message": "$COUNT$ itens encontrados.", 
    "placeholders": { "count": { "content": "$1" } } 
  }
}
```

### 2.2 Função Wrapper SSOT (Segurança de Tradução)
**Imperativo:** Nunca use `chrome.i18n.getMessage` diretamente na UI sem um wrapper que trate chaves inexistentes.

```javascript
/**
 * Função de Tradução Segura (t)
 * @param {string} key - ID da mensagem
 * @param {Array} args - Argumentos para placeholders
 * @returns {string} - Mensagem traduzida ou chave original (em fallback)
 */
export function t(key, args = []) {
  const message = chrome.i18n.getMessage(key, args);
  if (!message) {
    console.warn(`[i18n] Chave ausente: ${key}`);
    return `[[${key}]]`; // Fallback visual para debug
  }
  return message;
}
```

### 2.3 Suporte a RTL (Árabe, Hebraico)
Para suportar RTL, você deve detectar a direção do idioma no carregamento da UI:
```javascript
// No popup.js ou sidepanel.js
const dir = chrome.i18n.getMessage("@@bidi_dir"); // Retorna "rtl" ou "ltr"
document.documentElement.dir = dir;
```

---

## 3. SEGURANÇA NO BUILD (ENVIRONMENT VARIABLES)

**REGRA DE OURO:** Arquivos `.env` **NÃO DEVEM** ser incluídos no pacote final. Eles são apenas para o ambiente de build.

### 3.1 Protocolo de Injeção (Compiler Define)
Use a funcionalidade de `define` do Vite para injetar chaves de API em tempo de compilação.

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'process.env.SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY),
    'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
  }
});
```

---

## 4. PIPELINE DE QUALIDADE E OTIMIZAÇÃO

### 4.1 Linting e Formatting
A conformidade SSOT exige que o código passe pelo **ESLint** e **Prettier** antes de qualquer build.
```bash
# Comando obrigatório no pipeline
npm run lint && npm run format
```

### 4.2 Otimização Extrema de Ativos
Ícones pesados aumentam o tempo de carregamento e o tamanho do pacote. Use ferramentas de CLI para compressão.
```bash
# Exemplo de otimização de ícones via terminal
npx imagemin-cli src/assets/icons/* --out-dir=dist/assets/icons
```

---

## 5. AUTOMATED STORE RELEASE (CI/CD)

Em 2026, o upload manual é considerado um risco de erro humano. Utilize a **Chrome Web Store API** para automatizar o processo.

### 5.1 Script de Upload Automático (Node.js)
```javascript
import { chromeWebStore } from 'chrome-webstore-upload';

const store = chromeWebStore({
  extensionId: process.env.EXTENSION_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN,
});

async function upload() {
  const zipFile = fs.createReadStream('./extension.zip');
  const token = await store.fetchToken();
  const uploadResult = await store.uploadExisting(zipFile, token);
  console.log('Upload concluído:', uploadResult);
  
  // Opcional: Publicar automaticamente para revisores
  // await store.publish('default', token);
}
```

---

## PECADO CAPITAL: HARDCODING

Escrever strings fixas como `alert("Erro ao salvar")` é um erro fatal. 
- **Consequência:** Impede a expansão para novos mercados e exige refatoração massiva no futuro.
- **Padrão SSOT:** Toda e qualquer string visível deve residir no `messages.json`.

---

## CHECKLIST DE ROLLOUT DE ALTA DENSIDADE

- [ ] O Service Worker está em um chunk isolado de dependências da UI?
- [ ] O `messages.json` possui descrições para todos os IDs?
- [ ] A direção `RTL` é aplicada dinamicamente via `@@bidi_dir`?
- [ ] As chaves de API foram injetadas via `define` e o arquivo `.env` foi excluído?
- [ ] O ícone de 128x128 foi otimizado para menos de 20KB?
- [ ] O script de build gera um `.zip` contendo apenas a pasta `/dist`?

---
**Pesquisador-Arquiteto SSOT**
*Documentação técnica de engenharia senior.*
*Data de Validação: 21 de Março de 2026.*
