# Documentação de Assets de Imagem

## ⚠️ IMPORTANTE: NÃO RENOMEAR ESTES ARQUIVOS!

Este documento explica por que as imagens foram renomeadas e como evitar problemas futuros.

## 📁 Arquivos de Imagem

### Logo Principal
- **Arquivo:** `logo-comrich.png`
- **Tamanho:** 123KB
- **Uso:** Header, Footer, Sidebar, Páginas de Afiliado
- **Descrição:** Logo dourada com diamante e coroa de louros

### Background da Home
- **Arquivo:** `background-gala.png`
- **Tamanho:** 1.8MB
- **Uso:** Página inicial (Home.tsx)
- **Descrição:** Imagem de evento de gala com opacity 15%

## 🔧 Problema Original e Solução

### O Problema
Os arquivos originais tinham nomes com **espaços e caracteres especiais**:
- `Logo-removebg-preview copy.png` ❌
- `esperiencia1 - Copia copy.png` ❌

### Por que isso causava problemas:
1. **URL Encoding inconsistente**: Navegadores codificam espaços como `%20`, mas nem sempre funciona em produção
2. **Servidores web diferentes**: Netlify, Vercel, etc. tratam nomes de arquivos de forma diferente
3. **Cache issues**: Headers de cache não funcionam bem com nomes especiais
4. **Case sensitivity**: Linux (produção) é case-sensitive, Windows/Mac não são

### A Solução ✅
Arquivos renomeados seguindo **convenções web padrão**:
- Apenas letras minúsculas
- Sem espaços (use hífens `-`)
- Sem caracteres especiais
- Nomes descritivos e simples

## 📍 Onde as Imagens São Usadas

### Logo (`logo-comrich.png`)
```tsx
// src/components/Header.tsx
<img src="/logo-comrich.png" alt="com.rich" />

// src/components/Footer.tsx
<img src="/logo-comrich.png" alt="com.rich" />

// src/components/PanelSidebar.tsx
<img src="/logo-comrich.png" alt="com.rich" />

// src/pages/ResellerDashboard.tsx (3 locais)
<img src="/logo-comrich.png" alt="Com.rich Logo" />
```

### Background (`background-gala.png`)
```tsx
// src/pages/Home.tsx
<div
  style={{
    backgroundImage: 'url(/background-gala.png)',
    backgroundPosition: 'center center',
    backgroundSize: 'cover'
  }}
/>
```

## 🔐 Configuração de Cache

Headers configurados em `_headers`:
```
/logo-comrich.png
  Cache-Control: public, max-age=31536000, immutable

/background-gala.png
  Cache-Control: public, max-age=31536000, immutable
```

## ⚡ Como Adicionar Novas Imagens

Sempre siga estas regras:

1. **Nomes de arquivo:**
   - ✅ `logo-comrich.png`
   - ✅ `background-gala.png`
   - ✅ `icon-user-profile.png`
   - ❌ `Logo comrich.png`
   - ❌ `background gala (1).png`
   - ❌ `Ícone-Usuário.png`

2. **Salvando arquivos:**
   - Coloque em `/public/`
   - Nunca use espaços ou acentos
   - Use kebab-case (palavras separadas por hífen)
   - Mantenha minúsculas

3. **Referenciando no código:**
   ```tsx
   // ✅ Correto
   <img src="/logo-comrich.png" alt="Logo" />

   // ❌ Errado
   <img src="/Logo comrich.png" alt="Logo" />
   <img src="/logo%20comrich.png" alt="Logo" />
   ```

## 🚀 Build e Deploy

Ao fazer build com `npm run build`:
1. Vite copia todos os arquivos de `/public/` para `/dist/`
2. Os arquivos mantêm os mesmos nomes
3. Netlify serve os arquivos exatamente como estão

**IMPORTANTE:** Se você renomear os arquivos:
- Você DEVE atualizar TODAS as referências no código
- Você DEVE atualizar o arquivo `_headers`
- Você DEVE fazer um novo build

## 🔍 Verificando Build

Para verificar se as imagens foram copiadas corretamente:
```bash
npm run build
ls -lh dist/*.png
```

Você deve ver:
- `logo-comrich.png` (123KB)
- `background-gala.png` (1.8MB)

## 📝 Histórico de Mudanças

**2025-10-22:** Renomeação definitiva dos arquivos de imagem
- Removidos arquivos com espaços no nome
- Criados `logo-comrich.png` e `background-gala.png`
- Atualizados 5 arquivos de componentes
- Configurados headers de cache específicos
- Build testado e validado

## 🆘 Solução de Problemas

### Imagem não aparece em produção
1. Verifique o nome do arquivo em `/public/`
2. Verifique a referência no código (case-sensitive!)
3. Limpe o cache do Netlify e faça redeploy
4. Verifique os logs de build do Netlify

### Imagem aparece local mas não em produção
- Provavelmente é problema de case sensitivity
- Linux (produção) diferencia `Logo.png` de `logo.png`
- Sempre use minúsculas

### Mudei a imagem mas não atualiza
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique se você fez novo build
3. Verifique os headers de cache em `_headers`

## 📚 Referências

- [Netlify Headers](https://docs.netlify.com/routing/headers/)
- [Vite Static Assets](https://vitejs.dev/guide/assets.html)
- [Web File Naming Best Practices](https://www.w3.org/Provider/Style/URI)
