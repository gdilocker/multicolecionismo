# Limites REAIS por Plano

## ⚠️ IMPORTANTE: Regras Corretas do Sistema

Este documento reflete as **regras reais implementadas** no banco de dados.

---

## 📊 Limites por Plano

### **Starter (Gratuito)**
- **Domínios**: 1 (incluído no plano)
- **Links**: 5 máximo
- **Produtos**: 3 máximo
- **Imagens**: 10 máximo
- **Vídeos**: 0 (não permitido)
- **CSS Customizado**: ❌ Não
- **Domínio Customizado**: ❌ Não

### **Prime (Pago)**
- **Domínios**: 1 (incluído no plano)
- **Links**: 10 máximo
- **Produtos**: 10 máximo
- **Imagens**: 50 máximo
- **Vídeos**: 2 máximo
- **CSS Customizado**: ❌ Não
- **Domínio Customizado**: ✅ Sim

### **Elite**
- **Domínios**: ∞ Ilimitado (primeiro incluído)
- **Links**: 999,999 (praticamente ilimitado)
- **Produtos**: 999,999 (praticamente ilimitado)
- **Imagens**: 999,999 (praticamente ilimitado)
- **Vídeos**: 999,999 (praticamente ilimitado)
- **CSS Customizado**: ✅ Sim
- **Domínio Customizado**: ✅ Sim

### **Supreme**
- **Domínios**: ∞ Ilimitado (primeiro incluído)
- **Links**: 999,999 (praticamente ilimitado)
- **Produtos**: 999,999 (praticamente ilimitado)
- **Imagens**: 999,999 (praticamente ilimitado)
- **Vídeos**: 999,999 (praticamente ilimitado)
- **CSS Customizado**: ✅ Sim
- **Domínio Customizado**: ✅ Sim

---

## 🔒 Enforcements no Banco de Dados

### 1. **Domínios**
```sql
-- Tabela: subscription_plans
max_domains:
  - starter/prime: 1
  - elite/supreme: NULL (ilimitado)

domain_limit_enforced: true (sempre)
first_domain_included: true (sempre)
```

**Trigger**: `check_domain_limit_on_insert`
- Bloqueia inserção se exceder limite

### 2. **Links**
```sql
-- Tabela: plan_limits
starter: 5
prime: 10
elite: 999999
supreme: 999999
```

**Trigger**: `enforce_link_limit`
- Executa antes de INSERT em `profile_links`
- Chama função `enforce_content_limit()`

### 3. **Produtos**
```sql
-- Tabela: plan_limits
starter: 3
prime: 10
elite: 999999
supreme: 999999
```

**Trigger**: `enforce_product_limit`
- Executa antes de INSERT em `store_products`
- Chama função `enforce_content_limit()`

### 4. **Conteúdo de Texto**
```sql
-- Constraints permanentes:
user_profiles.bio: máx 200 caracteres
user_profiles.display_name: máx 40 caracteres
user_profiles.subdomain: 2-15 caracteres
social_posts.caption: máx 500 caracteres
social_comments.content: máx 250 caracteres
```

**Aplicado via**: `CHECK` constraints no banco

---

## 👑 Status do Admin

### **Admin NÃO tem ilimitado automático!**

**O que admin tem:**
- ✅ Pode visualizar TODAS as subscriptions
- ✅ Pode acessar painel admin
- ✅ Pode moderar conteúdo
- ✅ Pode modificar plan_limits

**O que admin NÃO tem automático:**
- ❌ Domínios ilimitados
- ❌ Produtos ilimitados
- ❌ Links ilimitados

### **Para admin ter benefícios:**

**Opção 1**: Admin deve ter uma subscription ativa
```sql
-- Admin com subscription supreme = limites supreme
SELECT s.*
FROM subscriptions s
JOIN customers c ON c.user_id = s.user_id
WHERE c.role = 'admin' AND s.status = 'active'
```

**Opção 2**: Modificar migration para exceção admin
```sql
-- Alterar triggers para ignorar admin:
IF user_role = 'admin' THEN
  RETURN NEW; -- Bypass limit
END IF;
```

---

## 🔧 Migrações Relevantes

1. **20251110000000_domain_limits_by_plan.sql**
   - Define limites de domínios
   - Cria triggers de validação

2. **20251031030000_add_content_limits.sql**
   - Define limites de texto
   - Cria constraints de comprimento

3. **20251113130000_content_limits_enforcement.sql**
   - Cria tabela `plan_limits`
   - Define triggers para links/produtos

---

## ⚠️ Correção Necessária

Se você quer que **admin tenha tudo ilimitado**, precisa:

1. Atualizar função `check_user_plan_limit()` para ignorar admin
2. Atualizar triggers de domínios para ignorar admin
3. Atualizar função `enforce_content_limit()` para ignorar admin

**Deseja que eu implemente isso agora?**
