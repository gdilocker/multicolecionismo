# Estrutura de Preços - Registro.Email

## Domínios .email

### Preços Padrão
- **Registro**: $25.00 USD por ano
- **Renovação**: $50.00 USD por ano

### Domínios Premium
- Preços personalizados baseados no valor de mercado
- Entre em contato para cotação

## Planos de Email (Opcional)

Os planos de email são **opcionais** e cobrados mensalmente, separados do domínio:

### Básico - Grátis
- Apenas domínio .email
- DNS gratuito
- Proteção WHOIS
- Redirecionamento de email
- Suporte por email
- Painel de controle

### Profissional - $79.99/mês
- Tudo do plano Básico
- 5 caixas de email (5GB cada)
- 50 aliases de email
- Webmail moderno
- Proteção anti-spam
- Suporte prioritário
- DNS avançado
- Backup automático

### Empresarial - $149.99/mês
- Tudo do plano Profissional
- 25 caixas de email (10GB cada)
- Aliases ilimitados
- Webmail + IMAP/SMTP
- API de email
- Proteção avançada anti-spam
- Suporte 24/7
- DNS avançado com API
- SLA garantido
- Backup automático diário

## Notas Importantes

1. **Domínio e Email são separados**:
   - O domínio é cobrado anualmente ($25/ano, renovação $50/ano)
   - Os planos de email são opcionais e cobrados mensalmente

2. **Proteção WHOIS**:
   - Incluída gratuitamente em todos os domínios

3. **Forma de Pagamento**:
   - PayPal (cartões de crédito e débito através do PayPal)

4. **Primeira Cobrança**:
   - Domínio: $25.00 (1 ano)
   - Plano de email (se selecionado): Primeiro mês incluído no checkout

## Onde os Preços São Aplicados

### Banco de Dados
- Tabela `pricing_plans`: Preços em centavos (2500 = $25.00)
- Tabela `domain_suggestions`: Preços em USD para marketplace
- Migration: `20251019200000_024_update_domain_pricing_25usd.sql`

### Edge Functions
- `/supabase/functions/domains/index.ts`:
  - `STANDARD_PRICE_USD = 25.00`
  - `STANDARD_RENEWAL_USD = 50.00`

### Frontend
- `src/pages/Checkout.tsx`: Preço padrão $25.00
- `src/pages/Home.tsx`: Exibe preços do banco de dados
- `src/pages/Pricing.tsx`: Exibe preços do banco de dados
- `src/components/DomainSearch.tsx`: Usa API para obter preços

## Atualização de Preços

Para atualizar os preços no futuro:

1. **Banco de Dados**:
   - Criar nova migration SQL
   - Atualizar `pricing_plans.price_cents`
   - Atualizar `domain_suggestions.price_override` se necessário

2. **Edge Functions**:
   - Atualizar constantes em `/supabase/functions/domains/index.ts`

3. **Frontend**:
   - Atualizar valores padrão em `Checkout.tsx`
   - Os demais componentes buscam do banco de dados automaticamente

4. **Deploy**:
   - Aplicar migration no Supabase
   - Fazer deploy das edge functions
   - Fazer deploy do frontend
