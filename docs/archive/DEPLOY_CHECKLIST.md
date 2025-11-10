# ✅ Checklist de Deploy - Imagens Corrigidas

## 🎯 Problema Resolvido

As imagens quebravam após deploy porque:
- ❌ Nomes tinham espaços: `"Logo-removebg-preview copy.png"`
- ❌ URL encoding inconsistente em produção
- ❌ Servidores Linux são case-sensitive

## ✅ Solução Implementada

1. **Arquivos renomeados (SEM espaços):**
   - `logo-comrich.png` (123KB)
   - `background-gala.png` (1.8MB)

2. **Componentes atualizados (5 arquivos):**
   - ✅ `src/components/Header.tsx`
   - ✅ `src/components/Footer.tsx`
   - ✅ `src/components/PanelSidebar.tsx`
   - ✅ `src/pages/ResellerDashboard.tsx`
   - ✅ `src/pages/Home.tsx`

3. **Headers de cache configurados:**
   - ✅ `_headers` atualizado com cache imutável

4. **Arquivos antigos removidos:**
   - ✅ Sem duplicatas no projeto

## 🚀 Antes de Fazer Deploy

```bash
# 1. Build local
npm run build

# 2. Verificar arquivos
ls -lh dist/*.png

# Você DEVE ver:
# - logo-comrich.png (123KB)
# - background-gala.png (1.8MB)

# 3. Se ver arquivos com espaços, algo está errado!
```

## 📋 Checklist de Deploy no Netlify

- [ ] Build local funcionando (`npm run build`)
- [ ] Apenas 2 imagens PNG em `/public/`: `logo-comrich.png` e `background-gala.png`
- [ ] Verificar que não há arquivos antigos com espaços
- [ ] Commit e push para repositório
- [ ] Deploy no Netlify
- [ ] Limpar cache do Netlify após deploy
- [ ] Testar site em produção
- [ ] Abrir DevTools e verificar que imagens carregam (Network tab)
- [ ] Testar em navegador anônimo (sem cache)

## 🔍 Como Verificar em Produção

1. **Abrir DevTools (F12)**
2. **Aba Network**
3. **Filtrar por "Img"**
4. **Atualizar página (F5)**
5. **Verificar:**
   - `logo-comrich.png` → Status 200 ✅
   - `background-gala.png` → Status 200 ✅

## 🆘 Se Ainda Quebrar

### Passo 1: Verificar Build
```bash
npm run build
ls dist/*.png
```
Se não aparecer as 2 imagens, o problema é local.

### Passo 2: Verificar Netlify Build Log
1. Acesse Netlify Dashboard
2. Vá em "Deploys"
3. Clique no último deploy
4. Verifique o log de build
5. Procure por erros relacionados a arquivos

### Passo 3: Limpar Cache Netlify
1. Netlify Dashboard → Site Settings
2. Build & Deploy → Post processing
3. Asset optimization → Clear cache and retry deploy

### Passo 4: Verificar Configuração Netlify
Arquivo `netlify.toml` deve ter:
```toml
[build]
  publish = "dist"
  command = "npm run build"
```

## 📝 Regras Para Sempre

**NUNCA MAIS:**
- ❌ Usar espaços em nomes de arquivos
- ❌ Usar acentos ou caracteres especiais
- ❌ Usar letras maiúsculas (use lowercase)
- ❌ Salvar arquivos como "copy", "backup", etc.

**SEMPRE:**
- ✅ Use kebab-case: `my-image.png`
- ✅ Use lowercase: `logo.png` não `Logo.png`
- ✅ Nomes descritivos: `background-gala.png`
- ✅ Teste local antes de deploy

## 🎓 Aprendizado

**Por que funcionava localmente mas quebrava em produção?**

| Ambiente | Sistema | Espaços em Arquivos | Case Sensitive |
|----------|---------|---------------------|----------------|
| Local (Windows/Mac) | Permissivo | ✅ Funciona | ❌ Não |
| Produção (Linux/Netlify) | Estrito | ❌ Pode quebrar | ✅ Sim |

**Conclusão:** Sempre desenvolva pensando nas limitações do servidor Linux!

## 📚 Documentação

Para mais detalhes, veja: `IMAGE_ASSETS_DOCUMENTATION.md`
