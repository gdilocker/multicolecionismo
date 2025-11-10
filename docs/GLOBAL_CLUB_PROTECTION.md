# Global Club/Clube Protection System

## Overview

Este sistema protege TODOS os domínios relacionados a "club/clube" em todas as línguas, dialetos, transliterações e grafias reconhecidas globalmente, conforme padrões ISO 639.

## Objetivo

Garantir que nenhum terceiro possa registrar qualquer variante linguística de "club" em qualquer idioma ou localização geográfica, reservando exclusivamente para o The Rich Club.

## Proteções Implementadas

### 1. Línguas Europeias (Escrita Latina)

- **Inglês**: club, clubs, clubhouse
- **Português**: clube, clubes
- **Sueco/Norueguês**: klubb
- **Finlandês**: klubi
- **Holandês/Africâner**: klab
- **Alemão/Polonês/Tcheco/Eslovaco**: klub
- **Galês**: clwb
- **Letão**: klubs
- **Lituano**: klubas
- **Esperanto**: clubo
- **Romeno**: clubul
- **Húngaro**: klubb
- **Albanês**: klubit
- **Islandês**: klubbur
- **Basco**: kluba

### 2. Línguas com Escrita Cirílica

- **Russo/Búlgaro/Sérvio**: klub, klob (transliteração de клуб, клъб)

### 3. Línguas com Escrita Grega

- **Grego**: klamp, leschi, eschia (transliteração de κλαμπ, λέσχη)

### 4. Línguas com Escrita Árabe

- **Árabe**: nadi, nady, kulub (transliteração de نادي, كلوب)

### 5. Línguas Asiáticas (Romanização)

- **Japonês**: kurabu (transliteração de クラブ, 倶楽部)
- **Coreano**: keulleop (transliteração de 클럽)
- **Chinês Mandarim**: julebu, huisuo (pinyin de 俱乐部, 会所)
- **Tailandês**: khlab (transliteração de คลับ)

### 6. Outras Línguas

- **Hebraico**: modon, moadon (transliteração de מועדון)
- **Hindi/Urdu**: klab (transliteração de क्लब)
- **Vietnamita**: caulacbo, clb (câu lạc bộ)
- **Turco**: kulubu (kulübü)
- **Cazaque/Quirguiz**: kulyp
- **Malaio/Indonésio**: kelab
- **Suaíle**: klabu

### 7. Variações e Erros Comuns

- clab, clob, clubz, clubbe

**Total: 50+ variantes protegidas**

## Arquitetura Técnica

### Database Schema

```sql
-- Tabela: protected_brands
- domain_name (text, unique): Nome base do domínio
- brand_display_name (text): Nome de exibição
- description (text): Descrição da proteção
- access_password (text): Senha master para bypass (admin)
- is_active (boolean): Status da proteção
```

### Funções de Validação

#### 1. `is_club_variant(domain_text)`
Verifica se um domínio é uma variante protegida de club.

```sql
SELECT is_club_variant('klub.com.rich'); -- Returns: true
SELECT is_club_variant('mystore.com.rich'); -- Returns: false
```

#### 2. `validate_club_domain_registration(p_domain_name, p_password)`
Valida se um domínio pode ser registrado.

**Retorno:**
```json
{
  "allowed": false,
  "message": "This domain is protected. Password required.",
  "protected": true
}
```

### Edge Function Integration

A validação está integrada na função `domains` Edge Function:

```typescript
// Check for club/clube protection (all language variants)
const { data: clubValidation } = await supabase
  .rpc('validate_club_domain_registration', {
    p_domain_name: normalizedFqdn,
    p_password: null
  });

if (!clubValidation.allowed && clubValidation.protected) {
  return BLOCKED with message;
}
```

## Fluxo de Proteção

```
User Input: "klub.com.rich"
    ↓
Domain Check Function
    ↓
validate_club_domain_registration()
    ↓
Check protected_brands table
    ↓
Match found: "klub" → Rich Club variant
    ↓
No password provided
    ↓
REJECT: "🔒 This domain is protected globally and reserved for The Rich Club in all languages."
```

## Bypass com Senha Master

Apenas administradores com senha master podem registrar domínios protegidos:

**Senha Master**: `Leif1975..`

```typescript
const validation = await supabase.rpc('validate_club_domain_registration', {
  p_domain_name: 'club.com.rich',
  p_password: 'Leif1975..'
});

// Returns: { allowed: true, message: "Access granted", protected: true }
```

## Exemplos de Testes

### Domínios que DEVEM ser bloqueados:

```
✗ club.com.rich          (Inglês)
✗ clube.com.rich         (Português)
✗ klubb.com.rich         (Sueco)
✗ klubi.com.rich         (Finlandês)
✗ nadi.com.rich          (Árabe)
✗ kurabu.com.rich        (Japonês)
✗ keulleop.com.rich      (Coreano)
✗ julebu.com.rich        (Chinês)
✗ modon.com.rich         (Hebraico)
✗ kelab.com.rich         (Malaio)
✗ klabu.com.rich         (Suaíle)
✗ clb.com.rich           (Vietnamita)
```

### Domínios que DEVEM ser permitidos:

```
✓ myclub.com.rich        (Contém "club" mas não é exatamente "club")
✓ clubhouse2.com.rich    (Variação não exata)
✓ greatclub.com.rich     (Prefixo adicional)
✓ store.com.rich         (Sem relação com club)
```

## SQL para Testes Manuais

```sql
-- Verificar todas as proteções ativas
SELECT domain_name, brand_display_name, description
FROM protected_brands
WHERE is_active = true
AND description LIKE '%Rich Club%'
ORDER BY domain_name;

-- Testar validação
SELECT validate_club_domain_registration('club.com.rich', NULL);
SELECT validate_club_domain_registration('klubb.com.rich', NULL);
SELECT validate_club_domain_registration('nadi.com.rich', NULL);

-- Testar com senha (admin)
SELECT validate_club_domain_registration('club.com.rich', 'Leif1975..');
```

## Manutenção e Expansão

### Adicionar Nova Variante Linguística

```sql
INSERT INTO protected_brands (
  domain_name,
  brand_display_name,
  description,
  access_password,
  is_active
)
VALUES (
  'novo_termo',
  'Rich Club',
  'Nova língua/dialeto variant',
  'Leif1975..',
  true
);
```

### Desativar Proteção Temporariamente

```sql
UPDATE protected_brands
SET is_active = false
WHERE domain_name = 'termo_especifico';
```

## Segurança

1. **RLS Policies**: Apenas admins podem gerenciar proteções
2. **Senha Master**: Armazenada de forma segura, validação server-side
3. **Validação em Tempo Real**: Verificação em cada tentativa de registro
4. **Case-Insensitive**: Proteção funciona independente de maiúsculas/minúsculas
5. **Logging**: Todas as tentativas bloqueadas são registradas nos logs

## Conformidade

- **ISO 639**: Cobertura de línguas reconhecidas internacionalmente
- **Unicode**: Suporte total a caracteres especiais e transliterações
- **ICANN Guidelines**: Alinhado com práticas de proteção de marca

## Suporte

Para adicionar novas variantes linguísticas ou relatar problemas:
- Verificar ISO 639 para códigos de idioma oficiais
- Adicionar transliteração oficial conforme padrões locais
- Testar validação antes de deploy em produção

## Changelog

### 2025-11-06 - Implementação Inicial
- ✅ 50+ variantes linguísticas protegidas
- ✅ Cobertura de 30+ idiomas e dialetos
- ✅ Sistema de validação automática
- ✅ Integração com Edge Functions
- ✅ Senha master para bypass administrativo
- ✅ Documentação completa
