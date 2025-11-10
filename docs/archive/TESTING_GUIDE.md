# Guia de Testes - Sistema de Pagamento PayPal

Este guia explica como testar o sistema de pagamento do Registro.email.

## Modos de Teste Disponíveis

### 1. Modo DESENVOLVIMENTO (Simulação)

**Recomendado para**: Desenvolvimento rápido, testes de UI, debug

**Como ativar**:
1. Abra o arquivo `.env`
2. Altere `VITE_DEV_MODE=false` para `VITE_DEV_MODE=true`
3. Reinicie o servidor de desenvolvimento

**Comportamento**:
- ✅ Simula pagamento instantaneamente (sem PayPal real)
- ✅ Cria ordem diretamente no banco de dados
- ✅ Redireciona para dashboard imediatamente
- ✅ Banner amarelo no topo indica modo ativo
- ❌ Não testa integração PayPal real
- ❌ Não testa webhooks

---

### 2. Modo SANDBOX (PayPal Real)

**Recomendado para**: Testes completos de integração, validação pre-produção

**Como ativar**:
1. Abra o arquivo `.env`
2. Certifique-se que `VITE_DEV_MODE=false`
3. Reinicie o servidor de desenvolvimento

**Como obter credenciais de teste PayPal**:

#### Passo 1: Acesse PayPal Developer Dashboard
- Visite: https://developer.paypal.com/dashboard/
- Faça login com sua conta PayPal **pessoal** (não precisa ser business)

#### Passo 2: Vá para Sandbox Accounts
- No menu lateral, clique em "Sandbox" → "Accounts"
- Você verá 2 contas de teste pré-criadas:
  - **Personal Account** (Comprador) - Use esta para testar
  - **Business Account** (Vendedor) - Já configurada no sistema

#### Passo 3: Obter Credenciais
- Clique nos "..." ao lado da conta "Personal"
- Selecione "View/Edit Account"
- Copie o **Email** e **Password**
- **IMPORTANTE**: Essas credenciais só funcionam no sandbox!

#### Passo 4: Testar o Fluxo
1. Na aplicação, busque um domínio disponível
2. Clique em "Registrar com PayPal"
3. Janela popup do PayPal será aberta
4. Use as credenciais sandbox que você copiou
5. Complete o "pagamento" (é fake, sem dinheiro real)
6. Janela fecha automaticamente
7. Aplicação detecta pagamento e redireciona

**Comportamento**:
- ✅ Testa integração PayPal completa
- ✅ Testa webhooks e callbacks
- ✅ Simula experiência real do usuário
- ✅ Valida todo o fluxo end-to-end
- ❌ Requer conta PayPal Developer
- ❌ Mais lento que modo DEV

---

## Credenciais PayPal Sandbox de Exemplo

Se você não conseguir acessar o PayPal Developer Dashboard, tente estas credenciais genéricas (podem não funcionar):

```
Email: sb-buyer@personal.example.com
Senha: [Você precisa criar no dashboard]
```

**IMPORTANTE**: As credenciais acima são exemplos. Você **deve** criar suas próprias contas sandbox.

---

## Problemas Comuns

### "Popup bloqueado"
- **Solução**: Permita popups para o site no seu navegador
- O sistema tentará fazer redirect direto se popup falhar

### "Janela PayPal não fecha"
- **Solução**: Feche manualmente e volte para a aba principal
- O sistema detectará e verificará o status do pagamento

### "Credenciais sandbox não funcionam"
- **Solução**: Verifique se está usando conta do tipo "Personal"
- Tente resetar a senha no PayPal Developer Dashboard

### "Erro ao criar ordem"
- **Solução**: Verifique se as Edge Functions estão deployadas
- Verifique os logs no console do navegador

---

## Recomendação de Fluxo de Teste

**Durante Desenvolvimento Inicial**:
1. Use `VITE_DEV_MODE=true`
2. Teste UI e fluxos básicos rapidamente
3. Valide criação de ordens no banco

**Antes de Deploy para Produção**:
1. Mude para `VITE_DEV_MODE=false`
2. Crie conta sandbox no PayPal Developer
3. Teste fluxo completo 3-5 vezes
4. Valide webhooks funcionando
5. Teste cenários de erro (cancelamento, timeout, etc)

---

## Links Úteis

- PayPal Developer Dashboard: https://developer.paypal.com/dashboard/
- PayPal Sandbox Accounts: https://developer.paypal.com/dashboard/accounts
- PayPal REST API Docs: https://developer.paypal.com/docs/api/overview/

---

## Suporte

Se encontrar problemas, verifique:
1. Console do navegador (F12) para erros JavaScript
2. Logs das Edge Functions no Supabase Dashboard
3. Status das credenciais PayPal no arquivo `.env` (não committar!)
