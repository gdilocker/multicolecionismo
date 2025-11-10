# 🧪 Guia de Testes - Proteção Global "Presidente"

## 🎯 Como Testar

### Pré-requisitos
1. Aplicar a migração `20251105000000_global_president_protection.sql`
2. Fazer build do projeto (`npm run build`)
3. Ter acesso ao sistema de busca de domínios

---

## ✅ Cenários de Teste

### 1️⃣ TESTE: Bloqueio de Termo Principal (Inglês)

**Input:**
```
president
```

**Resultado Esperado:**
```
❌ Domínio Indisponível
president.com.rich

Este domínio faz parte de uma reserva global de segurança
e não está disponível para registro público.

Sugestões:
• president1.com.rich
• presidentapp.com.rich
• presidentonline.com.rich
```

---

### 2️⃣ TESTE: Bloqueio Português/Espanhol/Italiano

**Input:**
```
presidente
```

**Resultado Esperado:**
```
❌ Domínio Indisponível
presidente.com.rich

Este domínio faz parte de uma reserva global de segurança
e não está disponível para registro público.
```

---

### 3️⃣ TESTE: Bloqueio Francês

**Input:**
```
président
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 4️⃣ TESTE: Bloqueio Alemão

**Input:**
```
präsident
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 5️⃣ TESTE: Bloqueio Russo

**Input:**
```
президент
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 6️⃣ TESTE: Bloqueio Árabe

**Input:**
```
رئيس
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 7️⃣ TESTE: Bloqueio Chinês Simplificado

**Input:**
```
总统
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 8️⃣ TESTE: Bloqueio Japonês

**Input:**
```
大統領
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 9️⃣ TESTE: Bloqueio Coreano

**Input:**
```
대통령
```

**Resultado Esperado:**
```
❌ Bloqueado (reserva global)
```

---

### 🔟 TESTE: Variações de Case

**Inputs:**
```
PRESIDENT
President
PrEsIdEnT
```

**Resultado Esperado:**
```
❌ Todos bloqueados (normalizados para lowercase)
```

---

### 1️⃣1️⃣ TESTE: Domínios Similares PERMITIDOS

**Inputs:**
```
president1
presidentapp
mypresident
vicepresidente
expresident
```

**Resultado Esperado:**
```
✅ Disponíveis (não são exatamente os termos protegidos)
```

---

## 🔍 Verificação no Banco de Dados

### Verificar palavras protegidas inseridas:

```sql
SELECT
  keyword,
  category,
  is_global_protection,
  reason
FROM reserved_keywords
WHERE is_global_protection = true
ORDER BY keyword;
```

**Resultado Esperado:**
- 60+ registros
- Todos com `is_global_protection = true`
- Categoria: `government`

---

### Testar função de verificação diretamente:

```sql
-- Teste com termo protegido
SELECT * FROM check_global_protection('president.com.rich');

-- Resultado esperado:
-- is_protected: true
-- message: "Este domínio faz parte de uma reserva global..."

-- Teste com termo não protegido
SELECT * FROM check_global_protection('example.com.rich');

-- Resultado esperado:
-- is_protected: false
-- message: null
```

---

### Verificar domínio do admin:

```sql
SELECT
  d.fqdn,
  d.registrar_status,
  d.expires_at,
  c.email,
  c.role
FROM domains d
JOIN customers c ON d.customer_id = c.id
WHERE d.fqdn = 'president.com.rich';
```

**Resultado Esperado:**
- fqdn: `president.com.rich`
- status: `active`
- expires_at: ~100 anos no futuro
- role: `admin`

---

## 🌐 Teste via API (curl)

### Verificar domínio protegido:

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/domains' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "check",
    "fqdn": "president.com.rich"
  }'
```

**Resposta Esperada:**
```json
{
  "status": "UNAVAILABLE",
  "fqdn": "president.com.rich",
  "isAvailable": false,
  "isPremium": false,
  "planRequired": null,
  "price": null,
  "message": "Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.",
  "suggestions": [
    "president1.com.rich",
    "presidentapp.com.rich",
    "presidentonline.com.rich",
    "presidentpro.com.rich",
    "mypresident.com.rich"
  ]
}
```

---

## 📋 Checklist de Validação

Marque ✅ após testar cada item:

- [ ] Termo em inglês bloqueado (president)
- [ ] Termo em português bloqueado (presidente)
- [ ] Termo em francês bloqueado (président)
- [ ] Termo em alemão bloqueado (präsident)
- [ ] Termo em russo bloqueado (президент)
- [ ] Termo em árabe bloqueado (رئيس)
- [ ] Termo em chinês bloqueado (总统)
- [ ] Termo em japonês bloqueado (大統領)
- [ ] Termo em coreano bloqueado (대통령)
- [ ] Variações de case normalizadas
- [ ] Domínios similares permitidos
- [ ] Mensagem personalizada exibida
- [ ] Sugestões alternativas oferecidas
- [ ] Admin possui president.com.rich
- [ ] Função SQL retorna corretamente
- [ ] Edge Function integrada
- [ ] Build sem erros
- [ ] Performance aceitável (< 100ms adicional)

---

## 🐛 Troubleshooting

### Problema: Termo não está bloqueando

**Solução:**
1. Verificar se migração foi aplicada:
   ```sql
   SELECT EXISTS(
     SELECT 1 FROM reserved_keywords
     WHERE keyword = 'president'
     AND is_global_protection = true
   );
   ```

2. Verificar se função existe:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name = 'check_global_protection';
   ```

3. Verificar logs da Edge Function:
   ```bash
   # Buscar por: "[DOMAIN CHECK] BLOCKED"
   ```

---

### Problema: Admin não consegue acessar president.com.rich

**Solução:**
1. Verificar se domínio foi criado:
   ```sql
   SELECT * FROM domains WHERE fqdn = 'president.com.rich';
   ```

2. Se não existe, executar:
   ```sql
   -- Parte do script de migração que cria o domínio
   -- Ver migration file: 20251105000000_global_president_protection.sql
   ```

---

### Problema: Performance degradada

**Solução:**
1. Verificar índice:
   ```sql
   SELECT * FROM pg_indexes
   WHERE tablename = 'reserved_keywords'
   AND indexname LIKE '%global_protection%';
   ```

2. Analisar query plan:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM check_global_protection('president.com.rich');
   ```

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Status |
|---------|------|--------|
| Taxa de bloqueio correto | 100% | ⏳ Pendente |
| Taxa de falso positivo | 0% | ⏳ Pendente |
| Tempo de resposta adicional | < 50ms | ⏳ Pendente |
| Cobertura de idiomas | 30+ | ✅ 30+ |
| Número de termos protegidos | 50+ | ✅ 60+ |

---

## ✅ Aprovação Final

Após todos os testes:

- [ ] Todos os cenários passaram
- [ ] Checklist completo
- [ ] Performance aceitável
- [ ] Sem falsos positivos
- [ ] Sem falsos negativos
- [ ] Documentação validada
- [ ] Admin confirmou funcionamento

**Assinatura:** ___________________
**Data:** ___________________

---

**Próximo Passo:** Após aprovação, sistema está pronto para produção! 🚀
