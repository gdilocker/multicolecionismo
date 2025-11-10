# ✅ CHECKLIST: Vite Image Imports (Solução Definitiva)

## SEMPRE seguir estes passos para imagens no Vite:

### 1. Estrutura de arquivos
```
src/
  assets/
    ├── logo.png
    └── background.png
```

### 2. Declarações de tipos (OBRIGATÓRIO)

**src/vite-env.d.ts:**
```typescript
/// <reference types="vite/client" />

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}
```

### 3. Dependências necessárias

**package.json:**
```json
{
  "devDependencies": {
    "@types/node": "^24.9.1"
  }
}
```

### 4. Configuração Vite

**vite.config.ts:**
```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
```

### 5. Imports nos componentes

```typescript
import logoUrl from '../assets/logo.png';
import bgUrl from '../assets/background.png';

// Uso:
<img src={logoUrl} alt="Logo" />
<div style={{ backgroundImage: `url(${bgUrl})` }} />
```

### 6. Proteção Git

**.gitattributes:**
```
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.webp binary
*.svg binary
*.ico binary
```

### 7. Carregar binários (IMPORTANTE no Bolt/Claude)

```bash
# Sempre que ver "[DUMMY FILE CONTENT]" ou imagens de 20 bytes
mcp__binary_files__load_binary_file
```

## RESULTADO ESPERADO

Build deve gerar:
```
✓ dist/assets/logo-[hash].png (tamanho real)
✓ dist/assets/background-[hash].png (tamanho real)
```

## ❌ NUNCA FAZER

1. ❌ Usar `/public/` para imagens importadas no código
2. ❌ Esquecer declarações de tipos em vite-env.d.ts
3. ❌ Esquecer @types/node quando usar `path`
4. ❌ Usar base64 inline (desnecessário com Vite)
5. ❌ Scripts customizados de geração de assets

## ✅ SEMPRE FAZER

1. ✅ Imagens em `src/assets/`
2. ✅ Imports nativos do Vite
3. ✅ Declarações de tipos
4. ✅ @types/node instalado
5. ✅ .gitattributes com binary
6. ✅ Verificar tamanho real após build (não dummy files)

## VERIFICAÇÃO FINAL

```bash
# Build
npm run build

# Verificar imagens geradas
ls -lh dist/assets/*.png

# Deve mostrar tamanhos reais (KB/MB), não 20 bytes
```

---

**Esta é a solução CORRETA e DEFINITIVA para imagens no Vite!**
