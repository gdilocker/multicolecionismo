# 🔒 Password Leak Protection - Instruções de Ativação

## ⚠️ IMPORTANTE: Configuração Manual Necessária

A proteção contra senhas vazadas é configurada no **Supabase Dashboard** e não pode ser ativada via código ou migrations.

---

## 📋 PASSO A PASSO

### 1. Acesse o Supabase Dashboard
```
https://app.supabase.com
```

### 2. Selecione seu Projeto
- Escolha o projeto **COM.RICH** na lista

### 3. Navegue até Authentication
- No menu lateral esquerdo, clique em **Authentication**
- Depois clique em **Settings**

### 4. Configure Password Protection
Procure pela seção: **"Password Protection"** ou **"Password Requirements"**

Ative as seguintes opções:

#### ✅ Opção 1: Minimum Password Length
```
Valor recomendado: 8 caracteres
Status: Provavelmente já ativado
```

#### ✅ Opção 2: Check for Compromised Passwords
```
Nome: "Prevent signup with compromised passwords"
Descrição: "Check passwords against HaveIBeenPwned database"
Status: ATIVAR ESTA OPÇÃO ⚠️
```

### 5. Salvar Configurações
- Clique em **"Save"** ou **"Update Settings"**
- Aguarde confirmação de sucesso

---

## 🔍 COMO FUNCIONA

### HaveIBeenPwned Integration

Quando ativado, o Supabase:

1. **No Signup/Registro:**
   - Verifica se a senha escolhida está na base de dados de senhas vazadas
   - Se estiver comprometida, **bloqueia o cadastro**
   - Exibe mensagem: "Esta senha foi encontrada em vazamentos de dados"

2. **No Reset de Senha:**
   - Aplica a mesma verificação
   - Protege usuários de escolherem senhas comprometidas

3. **Performance:**
   - Usa k-Anonymity model (não envia senha completa)
   - Envia apenas hash parcial da senha
   - Privacidade 100% preservada

---

## ✅ VERIFICAÇÃO

### Como confirmar que está ativado:

#### Teste 1: Tentar cadastro com senha comum
```
Email: teste@example.com
Senha: password123
```

**Resultado Esperado:**
- ❌ Cadastro bloqueado
- ⚠️ Mensagem: "Senha comprometida detectada"

#### Teste 2: Dashboard Supabase
```
Authentication > Settings > Password Protection
```

**Resultado Esperado:**
- ✅ Checkbox marcado: "Check for compromised passwords"
- ✅ Status: Enabled

---

## 📊 IMPACTO DA ATIVAÇÃO

### Segurança
- ✅ Bloqueia 1M+ senhas comprometidas conhecidas
- ✅ Previne takeover de contas
- ✅ Reduz risco de credential stuffing attacks
- ✅ Conformidade com NIST guidelines

### Performance
- ⚡ Latência adicional: ~50-100ms
- ⚡ Não afeta login de usuários existentes
- ⚡ Usa cache para senhas já verificadas

### Experiência do Usuário
- ✅ Usuários são forçados a escolher senhas mais seguras
- ⚠️ Pode causar frustração se senha favorita estiver comprometida
- 💡 Mensagem de erro deve ser clara e educativa

---

## 🎨 CUSTOMIZAÇÃO DA MENSAGEM DE ERRO

Se quiser customizar a mensagem exibida ao usuário quando a senha é rejeitada, você pode fazer isso no frontend:

### Arquivo: `src/pages/Register.tsx`

```typescript
// No catch do signup
if (error?.message?.includes('compromised') ||
    error?.message?.includes('leaked') ||
    error?.message?.includes('pwned')) {
  setError('Esta senha foi encontrada em vazamentos de dados públicos. ' +
           'Por favor, escolha uma senha diferente e mais segura.');
}
```

---

## 📈 MONITORAMENTO

### Métricas para Acompanhar

1. **Taxa de Rejeição**
   - Quantos usuários tentam usar senhas comprometidas
   - Meta: < 5% dos cadastros

2. **Tempo de Resposta**
   - Latência adicional na verificação
   - Meta: < 200ms p95

3. **Conversão de Signup**
   - Impacto na taxa de conversão
   - Meta: < 1% de redução

---

## 🔧 TROUBLESHOOTING

### Problema: Não encontro a opção no Dashboard

**Solução 1:** Verifique a versão do Supabase
```
Settings > General > Project Settings
Versão mínima: Supabase v2.0+
```

**Solução 2:** Verifique permissões
```
Você precisa ser Owner ou Admin do projeto
```

**Solução 3:** Supabase pode ter mudado o local
```
Procure por: "Password", "Security", "HIBP", "HaveIBeenPwned"
Localização alternativa: Settings > Security
```

### Problema: Opção está desabilitada (grayed out)

**Causa:** Pode ser uma feature do plano pago

**Solução:**
```
1. Verifique seu plano no Supabase
2. Password leak protection pode ser Pro/Enterprise only
3. Upgrade para Pro se necessário (recomendado para produção)
```

### Problema: API rate limit errors

**Causa:** HaveIBeenPwned tem rate limits

**Solução:**
```
Supabase gerencia isso automaticamente
Se persistir, contate suporte Supabase
```

---

## 💰 CUSTO

### Supabase Free Tier
- ❓ Pode não estar disponível
- Verificar documentação atualizada

### Supabase Pro ($25/mês)
- ✅ Incluído
- ✅ Sem custo adicional

### Supabase Enterprise
- ✅ Incluído
- ✅ SLA garantido

---

## 📚 REFERÊNCIAS

### Documentação Oficial
- [Supabase Password Protection](https://supabase.com/docs/guides/auth/auth-password-protection)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### Artigos Relacionados
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Troy Hunt on Password Security](https://www.troyhunt.com/passwords-evolved-authentication-guidance-for-the-modern-era/)

---

## ✅ CHECKLIST FINAL

Após ativação, confirme:

- [ ] Opção "Check for compromised passwords" está **ENABLED**
- [ ] Teste com senha comum (ex: "password123") **BLOQUEIA** cadastro
- [ ] Teste com senha forte **PERMITE** cadastro normalmente
- [ ] Documentação interna atualizada
- [ ] Time de suporte informado sobre novo comportamento
- [ ] Mensagens de erro customizadas (opcional)

---

## 🎉 PRÓXIMOS PASSOS

Após ativar Password Leak Protection:

1. ✅ Monitorar logs de rejeições por 1 semana
2. ✅ Ajustar mensagens de erro se necessário
3. ✅ Educar usuários sobre segurança de senhas
4. ✅ Considerar adicionar indicador de força de senha no frontend
5. ✅ Documentar na política de segurança

---

**Última Atualização:** 07/11/2025
**Status:** Aguardando ativação manual no Supabase Dashboard
**Prioridade:** ALTA 🔴
