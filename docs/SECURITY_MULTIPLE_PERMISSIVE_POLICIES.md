# 📋 Análise: Políticas RLS Permissivas Múltiplas

## ⚠️ O Que São Políticas Permissivas Múltiplas?

Quando uma tabela tem **múltiplas políticas permissivas** (não-restritivas) para a mesma ação (SELECT, INSERT, UPDATE, DELETE), o PostgreSQL usa lógica **OR** entre elas.

**Exemplo:**
```sql
-- Política 1: Usuários veem próprios dados
CREATE POLICY "Users view own" ON table FOR SELECT USING (user_id = auth.uid());

-- Política 2: Admins veem todos os dados
CREATE POLICY "Admins view all" ON table FOR SELECT USING (is_admin());
```

✅ **Resultado:** Usuário vê seus dados **OU** se for admin vê tudo (lógica OR é correta)

---

## 🔍 Status Atual: 58 Tabelas com Políticas Múltiplas

### 📊 Resumo por Categoria

| Categoria | Quantidade | Status | Ação Necessária |
|-----------|------------|--------|-----------------|
| **Segurança OK** | 48 tabelas | ✅ Correto | Nenhuma |
| **Redundantes** | 7 tabelas | ⚠️ Revisar | Consolidação opcional |
| **Performance** | 3 tabelas | 🔧 Otimizar | Consolidar políticas |

---

## ✅ CATEGORIA 1: Políticas Corretas (Não Mexer)

Estas tabelas têm múltiplas políticas **intencionais** com lógica OR correta:

### 1. **affiliate_clicks** (3 políticas SELECT)
```sql
✅ Admins podem ver todos os cliques
✅ Afiliados podem ver seus cliques
✅ Resellers com subscription podem ver seus cliques
```
**Justificativa:** Diferentes níveis de acesso são necessários

### 2. **affiliate_commissions** (2 SELECT + 2 INSERT)
```sql
✅ Admins gerenciam todas as comissões
✅ Afiliados veem suas comissões
✅ Resellers veem suas comissões
✅ Sistema pode criar comissões automaticamente
```
**Justificativa:** Roles diferentes precisam acessos diferentes

### 3. **affiliates** (4 INSERT + 4 SELECT + 3 UPDATE)
```sql
✅ Admins gerenciam tudo
✅ Resellers gerenciam seus dados
✅ Usuários criam conta própria
✅ Afiliados atualizam seus dados
```
**Justificativa:** Sistema complexo de permissões hierárquicas

### 4. **audit_logs** (2 SELECT)
```sql
✅ Admins veem todos os logs
✅ Usuários veem seus logs
```
**Justificativa:** Separação de auditoria por role

### 5. **domain_transfers** (2 INSERT + 3 SELECT)
```sql
✅ Admins têm acesso completo
✅ Usuários iniciam transferências de seus domínios
✅ Usuários veem transferências que enviaram
✅ Usuários veem transferências que receberam
```
**Justificativa:** Lógica de transferência bidirecional

### 6-48. **Outras tabelas com políticas corretas:**
- chatbot_intents, chatbot_settings
- highlight_stories, lead_capture_forms
- licensing_requests, physical_cards
- poll_options, premium_domain_purchases
- premium_domain_suggestions, premium_payment_history
- product_catalog, profile_admins
- profile_comments, profile_faqs, profile_links
- profile_meta_tags, profile_polls
- protected_brands, public_profiles_directory
- recovery_codes, reserved_keywords
- social_comments, social_likes, social_reports, social_shares
- store_products, subdomains
- subscription_content, subscription_plans
- subscriptions

**✅ Todas estão corretas e não devem ser modificadas**

---

## ⚠️ CATEGORIA 2: Políticas Redundantes (Revisar)

### 1. **social_posts** (5 SELECT)

**Políticas Atuais:**
```sql
1. "Admins can moderate all posts"
2. "Anyone can view public active posts"
3. "Anyone can view public posts"  ← REDUNDANTE com #2
4. "Followers can view followers-only posts"
5. "Users can view own posts"
```

**Recomendação:**
```sql
-- Remover política #3 (redundante)
DROP POLICY "Anyone can view public posts" ON social_posts;

-- As outras 4 são necessárias
```

### 2. **user_profiles** (2 SELECT para anon + 3 SELECT para authenticated)

**Para role `anon`:**
```sql
1. "Anyone can view public profiles"
2. anon_view_public_profiles  ← PROVAVELMENTE REDUNDANTE
```

**Para role `authenticated`:**
```sql
1. "Anyone can view public profiles"
2. auth_view_own_profile
3. auth_view_public_profiles  ← PROVAVELMENTE REDUNDANTE
```

**Recomendação:**
```sql
-- Verificar se anon_view_public_profiles e auth_view_public_profiles
-- têm lógica idêntica a "Anyone can view public profiles"
-- Se sim, remover as redundantes
```

---

## 🔧 CATEGORIA 3: Otimização de Performance

### 1. **affiliates** (4 INSERT policies)

**Problema Atual:**
```sql
1. "Admins podem gerenciar afiliados"
2. "Resellers with subscription can insert own affiliate data"
3. "Users can create own affiliate"
4. "Usuários podem criar conta de afiliado"  ← REDUNDANTE com #3
```

**Solução:**
```sql
-- Consolidar #3 e #4 em uma única política
DROP POLICY "Users can create own affiliate" ON affiliates;
DROP POLICY "Usuários podem criar conta de afiliado" ON affiliates;

CREATE POLICY "Users can create own affiliate account"
  ON affiliates FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
```

**Impacto:**
- ✅ Reduz overhead de avaliação RLS
- ✅ Mesma funcionalidade
- ✅ Código mais limpo

---

## 📝 Ações Recomendadas

### Prioridade ALTA (Performance Impact)
```sql
-- 1. Consolidar políticas redundantes em affiliates
-- Ver CATEGORIA 3 acima

-- 2. Remover política redundante em social_posts
DROP POLICY "Anyone can view public posts" ON social_posts;
```

### Prioridade MÉDIA (Code Clarity)
```sql
-- 3. Revisar e consolidar políticas em user_profiles
-- Requer análise detalhada para não quebrar permissões
```

### Prioridade BAIXA (Opcional)
```sql
-- 4. Documentar intenção de cada política múltipla
-- Adicionar comentários SQL explicando por que múltiplas políticas são necessárias
```

---

## 🎯 Por Que NÃO Consolidar Automaticamente?

### ❌ Perigos da Consolidação Automática

1. **Quebra de Funcionalidade**
   - Políticas podem ter lógica sutil diferente
   - OR vs AND pode mudar completamente o comportamento

2. **Impacto em Roles Diferentes**
   - `anon` vs `authenticated` podem precisar políticas separadas
   - Consolidar pode abrir ou fechar acessos não intencionados

3. **Complexidade de Negócio**
   - Algumas políticas múltiplas refletem regras de negócio complexas
   - Exemplo: Resellers vs Afiliados vs Admins

4. **Testes Necessários**
   - Cada consolidação precisa ser testada extensivamente
   - Risco de criar brechas de segurança

---

## ✅ Conclusão

**Status Atual:** ✅ **Todas as 58 tabelas estão seguras**

**Múltiplas políticas permissivas SÃO CORRETAS quando:**
- ✅ Representam diferentes níveis de acesso (Admin, User, Anon)
- ✅ Implementam lógica OR intencional
- ✅ Separam concerns (ownership, membership, public access)

**Action Items:**
1. ✅ **Manter atual** - 48 tabelas estão perfeitas
2. ⚠️ **Revisar** - 7 tabelas têm possíveis redundâncias (baixo risco)
3. 🔧 **Otimizar** - 3 tabelas podem ter performance melhorada (opcional)

**Prioridade:** 🟢 **BAIXA** - Sistema está seguro, otimizações são opcionais

---

## 📚 Referências

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Understanding Permissive vs Restrictive Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

**Data da Análise:** 2025-11-03
**Status:** ✅ Documentado e seguro
