# Exemplos Práticos - Premium Landing

## Exemplo 1: Domínio VIP

### Configuração no Banco

```sql
-- 1. Adicionar à lista premium
INSERT INTO premium_domains (fqdn, is_active)
VALUES ('vip.com.rich', true);

-- 2. Adicionar ao catálogo (disponível)
INSERT INTO domain_catalog (fqdn, is_available, is_premium)
VALUES ('vip.com.rich', true, true)
ON CONFLICT (fqdn) DO UPDATE
SET is_available = true, is_premium = true;
```

### Fluxo do Usuário

**Cenário A: Busca na Home**
```
1. Usuário na home (com.rich)
2. Digite "vip" na busca
3. Clica "Buscar"
4. Sistema detecta: AVAILABLE + isPremium + isAvailable
5. Navega automaticamente para /vip
6. Exibe Premium Landing
```

**Cenário B: URL Direta**
```
1. Usuário digita: com.rich/vip
2. DomainSlugPage carrega
3. Consulta API
4. Recebe: AVAILABLE + isPremium + isAvailable
5. Renderiza Premium Landing
```

**Cenário C: Subdomínio**
```
1. Usuário digita: vip.com.rich
2. Cloudflare intercepta
3. Redirect 301 → com.rich/vip
4. (continua como Cenário B)
```

### Visual da Página

```
╔══════════════════════════════════════════╗
║         [👑 Domínio Premium]           ║
║                                          ║
║           vip .com.rich                  ║
║         (dourado) (branco/60%)           ║
║                                          ║
║  Disponível apenas para o Plano Elite   ║
║                                          ║
║  [📧 Falar com Especialista]            ║
║  [👑 Ver Plano Elite]                   ║
║                                          ║
║  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ║
║  │ 👑   │ │ ⚡   │ │ 📈   │ │ 🏆   │  ║
║  │Exclu │ │Memor │ │Autor │ │Rarid │  ║
║  │sivo  │ │ável  │ │idade │ │ade   │  ║
║  └──────┘ └──────┘ └──────┘ └──────┘  ║
║                                          ║
║  ╔════════════════════════════════╗    ║
║  ║ 🔒 Acesso Exclusivo            ║    ║
║  ║ Plano Elite                     ║    ║
║  ║                                 ║    ║
║  ║ US$ 70/mês                     ║    ║
║  ╚════════════════════════════════╝    ║
╚══════════════════════════════════════════╝
```

---

## Exemplo 2: Domínio CEO

### Configuração

```sql
INSERT INTO premium_domains (fqdn, is_active)
VALUES ('ceo.com.rich', true);

INSERT INTO domain_catalog (fqdn, is_available, is_premium)
VALUES ('ceo.com.rich', true, true);
```

### Response da API

```json
{
  "status": "AVAILABLE",
  "fqdn": "ceo.com.rich",
  "isAvailable": true,
  "isPremium": true,
  "planRequired": "ELITE",
  "price": null,
  "message": "💎 Domínio Premium — disponível apenas para o plano Elite (US$ 70/mês)."
}
```

### Analytics

```javascript
// Quando página carrega
gtag('event', 'premium_view', {
  domain: 'ceo.com.rich',
  slug: 'ceo'
});

// Quando clica "Falar com Especialista"
gtag('event', 'premium_contact_click', {
  domain: 'ceo.com.rich',
  slug: 'ceo'
});
```

---

## Exemplo 3: Domínio Premium JÁ REGISTRADO

### Configuração

```sql
-- Maria comprou o domínio premium "elite"
INSERT INTO premium_domains (fqdn, is_active)
VALUES ('elite.com.rich', true);

-- Marcar como INDISPONÍVEL
INSERT INTO domain_catalog (fqdn, is_available, is_premium)
VALUES ('elite.com.rich', false, true);

-- Registro real
INSERT INTO domains (fqdn, customer_id, status)
VALUES ('elite.com.rich', 'uuid-maria', 'active');
```

### Fluxo do Usuário

```
1. João busca "elite"
2. API retorna: UNAVAILABLE (is_available=false)
3. DomainSlugPage detecta: status === 'UNAVAILABLE'
4. Tenta carregar PublicProfile
5. Se Maria configurou perfil público → mostra perfil
6. Se não → mostra página "já registrado" + sugestões
```

### ❌ O Que NÃO Acontece

- NÃO exibe Premium Landing
- NÃO mostra CTAs de venda
- NÃO sugere "Falar com Especialista"
- NÃO mostra preço US$ 70

### ✅ O Que Acontece

```
╔══════════════════════════════════════════╗
║         ❌ Domínio Indisponível          ║
║                                          ║
║           elite.com.rich                 ║
║                                          ║
║  Este domínio já foi registrado.        ║
║                                          ║
║  Sugestões:                             ║
║  • elite1.com.rich    [Verificar]      ║
║  • eliteapp.com.rich  [Verificar]      ║
║  • myelite.com.rich   [Verificar]      ║
║                                          ║
║  [🔍 Buscar Outro Domínio]              ║
╚══════════════════════════════════════════╝
```

---

## Exemplo 4: Domínio Standard (NÃO Premium)

### Configuração

```sql
-- "hello" é standard (não está em premium_domains)
-- Catálogo vai marcar como disponível + não premium
```

### Response da API

```json
{
  "status": "AVAILABLE",
  "fqdn": "hello.com.rich",
  "isAvailable": true,
  "isPremium": false,
  "planRequired": "STANDARD_OR_ELITE",
  "price": {
    "monthly": 50,
    "currency": "USD"
  },
  "message": "✅ Domínio disponível para registro.\nVocê pode adquiri-lo com o plano Standard (US$ 50/mês) ou com o plano Elite (US$ 70/mês)."
}
```

### Fluxo

```
1. Usuário busca "hello"
2. API: AVAILABLE + isPremium=false
3. DomainSlugPage renderiza página padrão (NÃO Premium Landing)
```

### Visual

```
╔══════════════════════════════════════════╗
║         ✅ Domínio Disponível            ║
║                                          ║
║          hello.com.rich                  ║
║                                          ║
║  Domínio disponível para registro.      ║
║                                          ║
║  ┌────────────────────────────────┐    ║
║  │  A partir de:                  │    ║
║  │  US$ 50 /mês                   │    ║
║  └────────────────────────────────┘    ║
║                                          ║
║  [Ver Planos e Registrar]               ║
║  [Buscar Outro Domínio]                 ║
╚══════════════════════════════════════════╝
```

---

## Exemplo 5: Converter Premium em Standard

### Cenário

Admin decide que "nice" não é mais premium.

### Processo

```sql
-- 1. Remover da lista premium
DELETE FROM premium_domains WHERE fqdn = 'nice.com.rich';

-- 2. Atualizar catálogo
UPDATE domain_catalog
SET is_premium = false
WHERE fqdn = 'nice.com.rich';
```

### Resultado

Próxima busca por "nice":
- API retorna: `isPremium: false`
- Exibe página Standard (US$ 50)
- NÃO exibe Premium Landing

---

## Exemplo 6: Formulário de Contato Pré-Preenchido

### Fluxo

```
1. Usuário em Premium Landing de "vip"
2. Clica "Falar com Especialista"
3. Navega para: /contact?domain=vip.com.rich&type=premium
```

### Página de Contato

```jsx
// Contact.tsx deve ler query params
const query = new URLSearchParams(location.search);
const domain = query.get('domain'); // "vip.com.rich"
const type = query.get('type');     // "premium"

// Pré-preencher campo "Assunto"
const defaultSubject = domain
  ? `Interesse em domínio premium: ${domain}`
  : '';
```

### Email Enviado

```
De: joao@example.com
Para: contact@com.rich
Assunto: Interesse em domínio premium: vip.com.rich

Olá,

Gostaria de mais informações sobre o domínio premium vip.com.rich.
Estou interessado no Plano Elite.

[...]
```

---

## Exemplo 7: A/B Testing (Futuro)

### Variação A: CTA Escassez
```
"Apenas 3 pessoas visualizaram este domínio hoje"
[Garantir Agora]
```

### Variação B: CTA Benefício
```
"Domínios premium valorizam 40% ao ano"
[Falar com Especialista]
```

### Implementação

```typescript
// PremiumLanding.tsx
const variant = Math.random() > 0.5 ? 'A' : 'B';

useEffect(() => {
  gtag('event', 'premium_view', {
    domain,
    slug,
    variant // <-- rastrear variação
  });
}, []);
```

---

## Exemplo 8: Multi-idioma (Futuro)

### Detectar Idioma

```typescript
const lang = navigator.language.startsWith('pt') ? 'pt' : 'en';
```

### Textos

```typescript
const messages = {
  pt: {
    badge: 'Domínio Premium',
    cta: 'Falar com Especialista',
    features: {
      exclusive: 'Exclusividade',
      memorable: 'Memorabilidade',
      authority: 'Autoridade',
      rarity: 'Raridade'
    }
  },
  en: {
    badge: 'Premium Domain',
    cta: 'Talk to a Specialist',
    features: {
      exclusive: 'Exclusivity',
      memorable: 'Memorability',
      authority: 'Authority',
      rarity: 'Rarity'
    }
  }
};

const t = messages[lang];
```

---

## Exemplo 9: Chatbot Integrado (Futuro)

### Trigger

```typescript
// Após 10 segundos na Premium Landing
setTimeout(() => {
  showChatBot({
    message: `Olá! Vi que você está interessado em ${slug}.com.rich. Posso ajudar?`,
    options: [
      'Quero saber mais sobre o Plano Elite',
      'Como funciona o registro?',
      'Qual a diferença entre Standard e Elite?'
    ]
  });
}, 10000);
```

---

## Exemplo 10: Social Proof (Futuro)

### Dados Reais do Banco

```sql
SELECT COUNT(*)
FROM domains
WHERE created_at > NOW() - INTERVAL '7 days'
  AND fqdn IN (SELECT fqdn FROM premium_domains);

-- Resultado: 12 domínios premium vendidos esta semana
```

### Exibir na Landing

```jsx
<div className="text-center mb-8">
  <p className="text-yellow-400">
    🔥 12 domínios premium foram registrados esta semana
  </p>
</div>
```

---

## Comandos Rápidos

### Adicionar Domínio Premium

```sql
-- Sempre executar os 2 comandos juntos
INSERT INTO premium_domains (fqdn, is_active) VALUES ('novo.com.rich', true);
INSERT INTO domain_catalog (fqdn, is_available, is_premium)
VALUES ('novo.com.rich', true, true)
ON CONFLICT (fqdn) DO UPDATE SET is_premium = true;
```

### Marcar Premium como Vendido

```sql
-- Após venda bem-sucedida
UPDATE domain_catalog
SET is_available = false
WHERE fqdn = 'vip.com.rich';
```

### Remover do Premium

```sql
DELETE FROM premium_domains WHERE fqdn = 'antigo.com.rich';
UPDATE domain_catalog SET is_premium = false WHERE fqdn = 'antigo.com.rich';
```

### Listar Todos os Premium Disponíveis

```sql
SELECT fqdn
FROM domain_catalog
WHERE is_premium = true
  AND is_available = true
ORDER BY fqdn;
```

---

## Suporte

Dúvidas sobre os exemplos?
- Consulte: `PREMIUM_LANDING_IMPLEMENTATION.md`
- Teste com: `TESTING_PREMIUM_LANDING.md`
- Email: support@com.rich
