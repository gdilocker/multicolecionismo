# Checklist: Mudanças de Schema (Database)

Este documento garante que mudanças de schema sejam **sempre versionadas** e **nunca perdidas**.

---

## ⚠️ REGRA DE OURO

**NUNCA adicione campos manualmente no Supabase Dashboard sem criar uma migração!**

Se você fizer isso:
- ❌ O campo funcionará temporariamente
- ❌ Será perdido no próximo reset/redeploy
- ❌ Causará bugs silenciosos
- ❌ Impossível reproduzir em outros ambientes

---

## ✅ Processo Correto para Mudanças de Schema

### **Passo 1: Criar Migração**

```bash
# Nome do arquivo: supabase/migrations/YYYYMMDDHHMMSS_nome_descritivo.sql
# Exemplo: 20251016120000_add_registrar_id.sql
```

**Template da migração:**

```sql
/*
  # [Título Descritivo da Mudança]

  1. Mudanças
    - Lista todas as alterações de tabelas/colunas
    - Seja específico sobre tipos de dados
    - Mencione índices criados

  2. Motivo
    - Por que essa mudança é necessária
    - Qual problema resolve
    - Contexto de negócio

  3. Impacto
    - Quais features dependem disso
    - Riscos se não aplicado
*/

-- Use sempre IF NOT EXISTS para segurança
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sua_tabela' AND column_name = 'seu_campo'
  ) THEN
    ALTER TABLE sua_tabela ADD COLUMN seu_campo tipo_de_dado;
  END IF;
END $$;

-- Criar índices se necessário
CREATE INDEX IF NOT EXISTS idx_nome ON sua_tabela(seu_campo);

-- Documentar o campo
COMMENT ON COLUMN sua_tabela.seu_campo IS 'Descrição clara do propósito';
```

### **Passo 2: Aplicar no Supabase**

**Opção A: MCP Tool (Recomendado)**
```typescript
mcp__supabase__apply_migration({
  filename: "20251016120000_nome",
  content: "... conteúdo SQL ..."
})
```

**Opção B: Dashboard**
1. https://app.supabase.com
2. SQL Editor
3. Cole o conteúdo da migração
4. Execute

**Opção C: CLI (se disponível)**
```bash
supabase db push
```

### **Passo 3: Verificar**

Sempre verifique se o campo foi criado:

```sql
-- Verificar campo existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sua_tabela'
  AND column_name = 'seu_campo';

-- Verificar índice existe (se criou)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'sua_tabela'
  AND indexname = 'idx_nome';
```

### **Passo 4: Testar o Fluxo**

Sempre teste que o campo funciona no código:

```sql
-- Teste de insert/update
DO $$
DECLARE
  test_id uuid;
BEGIN
  -- Insert com o novo campo
  INSERT INTO sua_tabela (campo_existente, seu_campo)
  VALUES ('valor1', 'valor2')
  RETURNING id INTO test_id;

  -- Verificar salvou
  IF EXISTS (
    SELECT 1 FROM sua_tabela
    WHERE id = test_id AND seu_campo = 'valor2'
  ) THEN
    RAISE NOTICE '✅ Campo funciona corretamente';
  ELSE
    RAISE EXCEPTION '❌ Campo não foi salvo';
  END IF;

  -- Cleanup
  DELETE FROM sua_tabela WHERE id = test_id;
END $$;
```

### **Passo 5: Atualizar Código**

Agora sim, use o campo no código das Edge Functions:

```typescript
await supabase
  .from('sua_tabela')
  .update({
    seu_campo: 'valor'  // ✅ Campo existe!
  })
  .select();  // ← Sempre use .select() para verificar dados salvos
```

### **Passo 6: Commit & Deploy**

```bash
git add supabase/migrations/20251016120000_nome.sql
git commit -m "feat: add seu_campo to sua_tabela"
git push

# Redeploy edge functions se necessário
```

---

## 🚨 Sinais de Alerta (Bugs Similares)

Se você vê estes sintomas, **provavelmente tem campo faltando**:

1. **Código parece funcionar, mas dados não salvam**
   ```typescript
   await supabase.from('table').update({ campo: 'valor' })
   // Retorna success, mas campo fica NULL
   ```

2. **Funcionou antes, parou de funcionar depois**
   - Provável: campo adicionado manualmente foi perdido em reset

3. **Update silenciosamente ignora alguns campos**
   - Supabase não retorna erro para campos inexistentes

4. **Funciona em um ambiente, falha em outro**
   - Campo existe em um banco, não existe em outro

---

## 🔍 Como Diagnosticar

### **1. Verificar se campo existe:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'sua_tabela'
ORDER BY ordinal_position;
```

### **2. Verificar todas as migrações aplicadas:**

```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### **3. Comparar schema entre ambientes:**

```bash
# Ambiente A (funcionando)
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'domains' ORDER BY column_name;

# Ambiente B (quebrado)
# Rode o mesmo query e compare
```

---

## 📋 Checklist Antes de Deploy

Antes de fazer deploy de qualquer código que usa novos campos:

- [ ] Migração SQL criada e versionada
- [ ] Migração aplicada no Supabase
- [ ] Campo verificado (query information_schema)
- [ ] Teste SQL passou (insert/update funciona)
- [ ] Código atualizado para usar o campo
- [ ] Edge Functions redeployadas (se aplicável)
- [ ] Teste end-to-end realizado
- [ ] Documentação atualizada

---

## 🎓 Lições Aprendidas

### **Caso: registrar_id (Outubro 2025)**

**O que aconteceu:**
1. Campo `registrar_id` foi adicionado manualmente no Dashboard
2. Sistema funcionou (registrou `cooperativa.email`)
3. Banco foi resetado/recriado sem o campo
4. Novos registros falhavam silenciosamente
5. `registrar_id` ficava NULL, mas status era `active`

**Por que foi difícil detectar:**
- Supabase não retorna erro ao atualizar campo inexistente
- Outros campos (como `registrar_status`) eram salvos normalmente
- Sistema parecia funcionar, mas dados críticos eram perdidos

**Solução:**
- Criada migração 014 versionando o campo
- Adicionados logs detalhados no webhook
- Implementada validação com `.select()` após updates

**Prevenção:**
- ✅ SEMPRE criar migração antes de usar campo
- ✅ SEMPRE verificar que migração foi aplicada
- ✅ SEMPRE testar com `.select()` após updates
- ✅ SEMPRE versionar mudanças de schema

---

## 🛠️ Ferramentas Úteis

### **Gerar Tipos TypeScript do Schema**

```bash
supabase gen types typescript \
  --project-id wnfuesmdcdsgplkvgdva \
  > src/types/database.types.ts
```

Isso permite detectar campos inexistentes em **compile time**!

### **Diff de Schemas**

```bash
# Exportar schema atual
pg_dump --schema-only --no-owner \
  "postgresql://..." > schema_atual.sql

# Comparar com versão anterior
diff schema_anterior.sql schema_atual.sql
```

---

## 📞 Em Caso de Dúvida

**Antes de adicionar campo:**
1. Crie a migração primeiro
2. Teste a migração
3. Depois use no código

**Se já adicionou manualmente:**
1. Extraia o SQL do campo (SHOW CREATE TABLE)
2. Crie migração com esse SQL
3. Aplique em todos os ambientes
4. Nunca mais adicione manualmente!

---

## ✅ Resumo: Como Evitar Este Problema

| ❌ NUNCA Faça | ✅ SEMPRE Faça |
|--------------|---------------|
| Adicionar campo no Dashboard | Criar migração SQL versionada |
| Assumir que campo existe | Verificar com information_schema |
| Deployar sem testar schema | Testar campo antes de usar no código |
| Usar campo sem `.select()` | Validar dados com `.select()` após update |
| Esquecer de documentar | Documentar mudança na migração |

---

**Última atualização:** 16 de Outubro de 2025
**Autor:** Sistema de Prevenção de Bugs de Schema
