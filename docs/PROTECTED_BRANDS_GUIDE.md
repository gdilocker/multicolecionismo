# Sistema de Marcas Protegidas

## Visão Geral

Sistema completo para proteger marcas de alto valor (Tesla, Ferrari, etc.) com acesso controlado por senha.

## Como Funciona

### 1. Quando alguém acessa uma marca protegida (ex: `tesla.com.rich`):

1. O sistema verifica PRIMEIRO se é uma marca protegida
2. Se for, exibe tela luxuosa solicitando senha
3. Após senha correta, libera acesso ao conteúdo

### 2. Tela de Proteção Inclui:

- Design premium com gradientes escuros e dourados
- Ícone de coroa e estrelas
- Badge "Marca Protegida"
- Mensagem explicativa sobre marca de alto valor
- Campo de senha elegante
- Validação em tempo real

### 3. Senha Padrão

**Senha atual:** `Leif1975..`

Esta senha pode ser alterada individualmente para cada marca no painel admin.

## Gerenciamento via Admin

### Acesso ao Painel

1. Login como admin
2. Dashboard Admin → "Marcas Protegidas"
3. URL direta: `/admin/protected-brands`

### Adicionar Nova Marca

1. Clicar em "Adicionar Marca"
2. Preencher:
   - **Nome do Domínio**: apenas o nome (ex: `apple`, `google`)
   - **Nome de Exibição**: Nome completo (ex: `Apple Inc.`)
   - **Descrição**: Texto explicativo sobre a marca
   - **Senha de Acesso**: Senha específica (padrão: `Leif1975..`)
   - **Marca Ativa**: Toggle on/off

### Editar Marca Existente

1. Clicar no ícone de editar (lápis)
2. Modificar informações desejadas
3. Salvar alterações

### Desativar/Ativar Marca

- Clicar no status (Ativa/Inativa) para alternar
- Marcas inativas não exibem proteção

### Excluir Marca

1. Clicar no ícone de lixeira
2. Confirmar exclusão
3. Marca será removida da proteção

## Marcas Atualmente Protegidas

1. **Tesla** - `tesla.com.rich`
   - Tesla, Inc. - Electric vehicles and clean energy

2. **Ferrari** - `ferrari.com.rich`
   - Ferrari S.p.A. - Luxury sports cars

## Fluxo de Acesso

```
Usuário acessa tesla.com.rich
         ↓
Sistema verifica: É marca protegida?
         ↓
    [SIM] → Exibe tela de proteção
              ↓
         Usuário digita senha
              ↓
         Senha correta?
              ↓
         [SIM] → Libera acesso ao conteúdo
         [NÃO] → Mensagem de erro
```

## Estrutura do Banco de Dados

### Tabela: `protected_brands`

```sql
- id (uuid)
- domain_name (text, unique)       -- Ex: 'tesla'
- brand_display_name (text)        -- Ex: 'Tesla'
- description (text, nullable)
- access_password (text)           -- Senha de acesso
- logo_url (text, nullable)        -- Futuro: Logo da marca
- is_active (boolean)              -- Ativa ou não
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Campo Adicional: `premium_domains`

- `is_protected_brand` (boolean) - Marca se domínio premium é protegido

## Segurança

### RLS Policies

1. **Admin**: Acesso total (CRUD)
2. **Público**: Pode ler informações (exceto senha)

### Armazenamento de Senha

- Atualmente: Texto plano no banco
- Validação: Comparação direta
- **Nota**: Em produção, considere hashing

## Casos de Uso

### Adicionar Marca Famosa

Quando identificar uma marca famosa:

1. Acesse `/admin/protected-brands`
2. Clique "Adicionar Marca"
3. Preencha dados:
   - Nome: nome da marca em lowercase
   - Display: Nome oficial da empresa
   - Descrição: Breve descrição da marca
   - Senha: Use padrão ou personalize

### Contato com Proprietário da Marca

No futuro, quando entrar em contato com Tesla, Ferrari, etc.:

1. Forneça a senha de acesso personalizada
2. Eles podem acessar e configurar o perfil
3. Você pode adicionar logo e informações pela admin

## Rotas

- **Proteção**: `/:slug` (ex: `/tesla`)
- **Admin**: `/admin/protected-brands`
- **Componente**: `ProtectedBrandAccess`

## Próximos Passos (Futuro)

- [ ] Sistema de logos personalizados
- [ ] Múltiplas senhas por marca
- [ ] Histórico de acessos
- [ ] Email de notificação ao admin
- [ ] Hashing de senhas
- [ ] Expiração de senhas temporárias
