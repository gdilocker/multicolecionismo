# 🔐 Modelo de Licenciamento .com.rich

**Data de Implementação:** 26 de outubro de 2025
**Versão:** 1.0

---

## 📋 **SUMÁRIO EXECUTIVO**

A partir desta data, **todos os domínios .com.rich** operam sob o **modelo de licenciamento exclusivo de uso**, e não mais sob venda direta de propriedade.

### **Controladora Global:**
**Global Digital Identity LTD**

### **Modelo Jurídico:**
- ❌ **Não é venda** de domínio
- ✅ **É licença exclusiva** de uso
- ✅ Titularidade permanece com Global Digital Identity LTD
- ✅ Cliente recebe direitos exclusivos de uso mediante contrato

---

## 🎯 **MUDANÇAS PRINCIPAIS**

### **1. Titularidade**
```
ANTES: Cliente "compra" e é "proprietário" do domínio
AGORA: Cliente recebe licença exclusiva de uso do domínio
```

- Global Digital Identity LTD mantém titularidade de TODOS os domínios
- Cliente não é proprietário, é **licenciado exclusivo**
- Licença pode ser revogada conforme termos contratuais

### **2. Terminologia Atualizada**

| ❌ Termo Antigo | ✅ Termo Novo |
|----------------|--------------|
| Comprar domínio | Adquirir licença exclusiva |
| Proprietário | Licenciado / Titular da licença |
| Domínios comprados | Licenças ativas |
| Venda de domínio | Concessão de licença |
| Transferência de propriedade | Transferência de licença |
| Seu domínio | Domínio licenciado para você |

### **3. Banco de Dados**

**Nova estrutura na tabela `domains`:**
- `license_status` - Status da licença (active, suspended, revoked, expired)
- `license_type` - Tipo de licença (exclusive_personal, exclusive_business)
- `license_start_date` - Início da licença
- `license_end_date` - Término (NULL = renovação contínua)
- `is_revocable` - Se pode ser revogada
- `revocation_reason` - Motivo de revogação
- `revoked_at` - Data/hora da revogação
- `revoked_by` - Admin que revogou

**Nova tabela:** `domain_license_history`
- Registro completo de todas as mudanças de status

---

## 📜 **TERMOS DO LICENCIAMENTO**

### **Direitos do Licenciado:**
- ✅ Uso exclusivo do domínio durante vigência da licença
- ✅ Configurar DNS, criar perfis, personalizar conteúdo
- ✅ Renovação automática enquanto pagamento em dia
- ✅ Solicitar transferência de licença para terceiros

### **Restrições:**
- ❌ NÃO é proprietário do domínio
- ❌ NÃO pode vender ou transferir sem autorização
- ❌ Licença pode ser revogada por violação de termos
- ❌ Titular final é sempre Global Digital Identity LTD

### **Causas de Revogação:**
1. Não pagamento de mensalidades/anuidades
2. Violação dos Termos de Uso
3. Uso ilícito ou fraudulento
4. Violação de direitos de terceiros (marcas, direitos autorais)
5. Spam, phishing, malware
6. Ordem judicial

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **APIs e Funções:**
- `revoke_domain_license(domain_id, reason, admin_id)` - Revogar licença
- `suspend_domain_license(domain_id, reason, admin_id)` - Suspender licença
- `reactivate_domain_license(domain_id, admin_id)` - Reativar licença

### **Views do Banco:**
- `active_domain_licenses` - Licenças ativas
- `revoked_domain_licenses` - Licenças revogadas/suspensas

---

## 📱 **INTERFACE DO USUÁRIO**

### **Dashboard do Usuário:**
- "Minhas Licenças" (não "Meus Domínios")
- "Licenças Ativas" / "Licenças Expiradas"
- Badge de status: "Licença Ativa" / "Licença Suspensa"

### **Painel Admin:**
- Controle centralizado de licenças
- Botões: "Revogar Licença", "Suspender", "Reativar"
- Histórico completo de ações

---

## 💡 **COMUNICAÇÃO COM CLIENTES**

### **Mensagens-Chave:**

**Para Clientes Existentes:**
> "Seu domínio .com.rich continua 100% funcional. A partir de agora, opera sob modelo de licenciamento exclusivo, garantindo seus direitos de uso enquanto a assinatura estiver ativa."

**Para Novos Clientes:**
> "Ao adquirir um domínio .com.rich, você recebe uma licença exclusiva de uso. Isso significa que você tem direitos totais de uso e personalização, renovável mensalmente, mantendo sua identidade digital protegida."

### **FAQ Essencial:**

**Q: Ainda sou "dono" do meu domínio?**
A: Você é o licenciado exclusivo. Tem todos os direitos de uso, mas a titularidade permanece com Global Digital Identity LTD.

**Q: Posso perder meu domínio?**
A: Sua licença é garantida enquanto você mantiver os pagamentos em dia e seguir os Termos de Uso.

**Q: Posso transferir meu domínio?**
A: Sim, você pode transferir sua licença para outro usuário, sujeito à aprovação.

**Q: O que acontece se eu cancelar?**
A: Sua licença expira e o domínio volta ao pool da Global Digital Identity LTD após período de carência.

---

## ⚖️ **ASPECTOS LEGAIS**

### **Jurisdição:**
- Inglaterra e País de Gales
- Tribunais de Londres, Reino Unido

### **Conformidade:**
- UK GDPR
- Data Protection Act 2018
- Companies Act 2006

### **Proteção ao Consumidor:**
- Direitos do consumidor local mantidos quando aplicáveis
- Transparência total sobre modelo de licenciamento
- Sem práticas enganosas

---

## 📞 **CONTATOS**

**Suporte Técnico:** support@com.rich
**Jurídico:** legal@com.rich
**Emergências de Segurança:** security@com.rich

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

### **Fase 1: Banco de Dados** ✅
- [x] Migration 055 criada
- [x] Campos de licenciamento adicionados
- [x] Tabela de histórico criada
- [x] Funções admin criadas
- [x] Triggers de logging implementados

### **Fase 2: Documentos Legais** 🔄
- [ ] Termos de Uso atualizados
- [ ] Política de Privacidade atualizada
- [ ] Termos de Afiliados atualizados
- [ ] FAQ atualizada

### **Fase 3: Interface** 🔄
- [ ] Home page (textos comerciais)
- [ ] Pricing page
- [ ] Marketplace
- [ ] User Dashboard
- [ ] Admin Panel

### **Fase 4: Tipos e APIs** ⏳
- [ ] TypeScript interfaces
- [ ] API endpoints
- [ ] Edge functions

### **Fase 5: Testes** ⏳
- [ ] Testes de revogação
- [ ] Testes de suspensão
- [ ] Testes de reativação
- [ ] Testes de histórico

---

**Documento criado por:** Sistema de Migração .com.rich
**Última atualização:** 26 de outubro de 2025
**Versão:** 1.0
