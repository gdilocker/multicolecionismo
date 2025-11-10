# 📸 Como Adicionar as Imagens Hero

## ⚠️ IMPORTANTE: O Bolt não salva imagens automaticamente

Você precisa fazer o upload manual das duas imagens:

## 📁 Arquivos Necessários:

### 1. **Home Hero Background**
- **Nome:** `home-hero-bg.jpg`
- **Local:** `src/assets/home-hero-bg.jpg`
- **Dimensões recomendadas:** 1920x1080px ou maior
- **Formato:** JPG/JPEG
- **Otimização:** Comprimir para ~200-500KB

### 2. **Marketplace Hero Background**
- **Nome:** `marketplace-hero-bg.jpg`
- **Local:** `src/assets/marketplace-hero-bg.jpg`
- **Dimensões recomendadas:** 1920x1080px ou maior
- **Formato:** JPG/JPEG
- **Otimização:** Comprimir para ~200-500KB

---

## 🎨 Sugestões de Estilo:

### **Home (`/`):**
- Tema: Luxo, colecionismo, redes sociais premium
- Cores: Azul, dourado, preto elegante
- Elementos: Itens de coleção, comunidade, conexões

### **Marketplace (`/marketplace`):**
- Tema: Premium, exclusivo, galeria de arte
- Cores: Âmbar, dourado, amarelo premium
- Elementos: Domínios premium, exclusividade, estrelas/coroas

---

## 🚀 Como Fazer Upload no Bolt:

### Opção 1: Via Interface Web
1. No painel lateral esquerdo do Bolt, clique no ícone de pasta
2. Navegue até `src/assets/`
3. Clique com botão direito → "Upload Files"
4. Selecione suas imagens (garantir que os nomes estejam corretos!)

### Opção 2: Via GitHub (Depois do Deploy)
1. Faça commit do projeto no GitHub
2. No repositório, navegue até `src/assets/`
3. Clique em "Add file" → "Upload files"
4. Faça upload das duas imagens
5. Faça commit das mudanças

---

## ✅ Verificação:

Depois de fazer upload, execute:

```bash
ls -lh src/assets/
file src/assets/*.jpg
```

Você deve ver algo como:
```
-rw-r--r-- 1 user user 350K Nov 10 17:00 home-hero-bg.jpg
-rw-r--r-- 1 user user 420K Nov 10 17:00 marketplace-hero-bg.jpg
```

---

## 🎨 Ferramentas Recomendadas:

### Para Criar/Editar:
- **Unsplash** - Fotos gratuitas de alta qualidade
- **Pexels** - Banco de imagens gratuito
- **Canva** - Design gráfico online
- **Photopea** - Editor de imagens online (tipo Photoshop)

### Para Otimizar:
- **TinyJPG** - Comprimir JPG online
- **Squoosh** - Otimizador do Google
- **ImageOptim** - Compressor Mac
- **GIMP** - Editor gratuito

---

## 💡 Dica Pro:

Se você tem dificuldade em encontrar/criar as imagens, pode usar:

1. **Gradientes CSS** (sem imagem):
   - Home: `from-blue-900 via-gray-900 to-indigo-900`
   - Marketplace: `from-amber-100 via-white to-yellow-100`

2. **Unsplash Source** (imagem aleatória):
   ```
   https://source.unsplash.com/1920x1080/?luxury,collection
   https://source.unsplash.com/1920x1080/?premium,gold
   ```

---

## 📋 Status Atual:

✅ **Código está pronto** - imports configurados
✅ **Build está funcionando** - sem erros
⏳ **Faltam as imagens reais** - arquivos são placeholders vazios

**Assim que você fizer upload das imagens reais, elas aparecerão automaticamente!**
