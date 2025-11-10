# Lógica de Exibição de Perfis - com.rich

## 📋 Resumo

Este documento explica como a plataforma decide o que mostrar quando alguém acessa um domínio `.com.rich`.

---

## 🔄 Fluxo de Decisão

```
┌─────────────────────────────────────────────────┐
│ Usuário acessa: eriksonleif.com.rich            │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│ 1️⃣ Domínio está registrado na tabela domains?   │
└─────────────────────────────────────────────────┘
       SIM ✅                           NÃO ❌
        ▼                                ▼
┌──────────────────┐          ┌────────────────────┐
│ Mostrar Perfil   │          │ 2️⃣ Perfil existe?   │
│ do Proprietário  │          └────────────────────┘
└──────────────────┘            SIM ✅      NÃO ❌
                                 ▼           ▼
                    ┌─────────────────┐  ┌──────────────┐
                    │ Mostrar Perfil  │  │ 3️⃣ Verificar │
                    │ (mesmo sem      │  │ API: Premium │
                    │  domínio)       │  │ ou Standard? │
                    └─────────────────┘  └──────────────┘
                                           Premium  Standard
                                              ▼         ▼
                                         ┌────────┐ ┌─────────┐
                                         │Premium │ │Standard │
                                         │Landing │ │Available│
                                         └────────┘ └─────────┘
```

---

## 🎨 Tipos de Páginas Exibidas

### 1. **Perfil Customizado** ✨

**Quando aparece:**
- Usuário já configurou avatar, bio OU adicionou links

**Visual:**
- Avatar/logo do usuário
- Nome de exibição
- Bio personalizada
- Links customizados
- Background customizado (se configurado)

**Exemplo:** perfil completo com foto, descrição e links para redes sociais

---

### 2. **Perfil em Construção** 🏗️ (Página Luxuosa)

**Quando aparece:**
- Domínio/perfil está registrado para o usuário
- MAS ainda não foi customizado (sem avatar, sem bio, sem links)

**Visual:**
```
┌────────────────────────────────────────────┐
│     [Background Premium com Overlay]       │
│                                            │
│          ┌──────────────────┐              │
│          │  [Logo com.rich] │              │
│          │   (em moldura     │              │
│          │    dourada)       │              │
│          └──────────────────┘              │
│                                            │
│        eriksonleif.com.rich                │
│                                            │
│        🟡 Perfil em construção             │
│                                            │
│    ┌─────────────────────────────────┐    │
│    │    | Sobre o .com.rich |        │    │
│    │                                 │    │
│    │  O .com.rich é a plataforma     │    │
│    │  premium para criar sua         │    │
│    │  identidade digital única.      │    │
│    │                                 │    │
│    │  [Grid com 4 Features]          │    │
│    │  - Domínio Personalizado        │    │
│    │  - Temas Customizáveis          │    │
│    │  - Analytics Avançado           │    │
│    │  - Proteção por Senha           │    │
│    └─────────────────────────────────┘    │
│                                            │
│     [Crie seu perfil .com.rich]           │
│                                            │
└────────────────────────────────────────────┘
```

**Características:**
- Background premium com glitter dourado
- Logo com.rich em moldura elegante
- Título grande com o domínio do usuário
- Badge "Perfil em construção" com animação
- Seção "Sobre o .com.rich" com cards animados
- CTA para criar perfil (com código de afiliado se aplicável)

---

### 3. **Premium Landing** 💎

**Quando aparece:**
- Domínio premium está **disponível para venda**
- Exemplo: `luxo.com.rich`, `success.com.rich`

**Visual:**
- Página de vendas premium
- Preço destacado
- Lista de benefícios
- CTA para comprar

---

### 4. **Standard Available** 📝

**Quando aparece:**
- Domínio standard está **disponível para registro**
- Não é premium

**Visual:**
- Card simples
- Checkmark verde
- "✅ Domínio Disponível"
- Preço a partir de US$ 50/mês
- Botões: "Ver Planos" e "Buscar Outro"

---

## 🧪 Testes de Cenários

### Cenário 1: Usuário Acabou de Registrar
```
Domínio: eriksonleif.com.rich
Status: Registrado (tabela domains)
Perfil: Vazio (sem customização)

Resultado: ✅ Página Luxuosa "Perfil em Construção"
```

### Cenário 2: Usuário Customizou o Perfil
```
Domínio: eriksonleif.com.rich
Status: Registrado
Perfil: Com foto, bio e links

Resultado: ✅ Perfil Customizado
```

### Cenário 3: Domínio Não Registrado
```
Domínio: novousuario.com.rich
Status: Não existe na tabela domains
Perfil: Não existe

Resultado: ✅ Página "Domínio Disponível" (ou Premium Landing)
```

### Cenário 4: Perfil sem Domínio
```
Domínio: testuser.com.rich
Status: Não registrado na tabela domains
Perfil: Existe na tabela user_profiles

Resultado: ✅ Mostra o perfil (mesmo sem domínio comprado)
```

---

## 🔑 Regras Importantes

### ✅ SEMPRE Mostrar Perfil Quando:
1. Domínio está registrado (tabela `domains`)
2. OU perfil existe (tabela `user_profiles`)

### 🏗️ Mostrar "Em Construção" Quando:
1. Perfil existe
2. E não tem customização:
   - Sem avatar personalizado
   - Sem bio customizada
   - Sem links adicionados

### 💎 Mostrar "À Venda" Quando:
1. Domínio NÃO está registrado
2. E NÃO existe perfil
3. E é premium (tabela `premium_domains`)

---

## 🎯 Código Relevante

### DomainSlugPage.tsx
```typescript
// Prioridade de verificação:
1. Tabela domains (domínios registrados)
2. Tabela user_profiles (perfis existentes)
3. API de verificação (disponibilidade)
```

### PublicProfile.tsx
```typescript
// Detecção de perfil vazio:
const isEmptyProfile =
  !hasCustomAvatar &&
  !hasCustomBio &&
  !hasCustomLinks;

if (isEmptyProfile) {
  // Mostrar página luxuosa "em construção"
}
```

---

## 📊 Fluxo Visual Resumido

```
Acesso ao domínio
       ↓
┌──────────────┐
│ Registrado?  │
└──────────────┘
   SIM    NÃO
    ↓      ↓
┌─────┐ ┌────────┐
│Perfil│ │Premium?│
└─────┘ └────────┘
   ↓     SIM  NÃO
┌─────┐  ↓    ↓
│Vazio?│ [💎] [📝]
└─────┘
SIM NÃO
 ↓   ↓
[🏗️][✨]

Legenda:
🏗️ = Perfil em Construção (Luxuoso)
✨ = Perfil Customizado
💎 = Premium Landing
📝 = Standard Available
```

---

## 🛠️ Manutenção

### Como Testar

1. **Perfil Vazio:**
   - Criar novo usuário
   - Não adicionar nada
   - Acessar `seunome.com.rich`
   - Deve ver página luxuosa "em construção"

2. **Perfil Customizado:**
   - Adicionar avatar OU bio OU links
   - Acessar perfil
   - Deve ver perfil normal com conteúdo

3. **Domínio Disponível:**
   - Acessar domínio não registrado
   - Deve ver "Domínio Disponível" ou "Premium Landing"

---

## 📝 Notas Técnicas

- A página "em construção" é **sempre luxuosa** (mesmo para perfis vazios)
- Não depende de `is_public` para mostrar a página bonita
- Background premium automático com glitter dourado
- CTA automático com código de afiliado (se o usuário for afiliado)
- Cards animados com hover effects
- Responsive design (mobile-first)

---

**Última Atualização:** 2025-10-25
**Status:** ✅ Funcionando Corretamente
