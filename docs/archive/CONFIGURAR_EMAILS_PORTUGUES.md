# Configurar E-mails em Português no Supabase

Os e-mails de autenticação do Supabase são configurados no **Dashboard do Supabase**, não no código.

## Como Configurar

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Navegue até Email Templates**
   - No menu lateral, clique em **Authentication**
   - Clique em **Email Templates**

3. **Configure cada template em Português**

---

## Templates em Português

### 1. Confirm Signup (Confirmação de Cadastro)

**Subject:**
```
Confirme seu cadastro na com.rich
```

**Body (HTML):**
```html
<h2>Bem-vindo à com.rich!</h2>
<p>Obrigado por se cadastrar. Por favor, confirme seu endereço de e-mail clicando no link abaixo:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar meu e-mail</a></p>
<p>Se você não se cadastrou na com.rich, por favor ignore este e-mail.</p>
<p>Atenciosamente,<br>Equipe com.rich</p>
```

---

### 2. Invite User (Convidar Usuário)

**Subject:**
```
Você foi convidado para com.rich
```

**Body (HTML):**
```html
<h2>Você foi convidado!</h2>
<p>Você foi convidado para se juntar à com.rich. Clique no link abaixo para aceitar o convite:</p>
<p><a href="{{ .ConfirmationURL }}">Aceitar convite</a></p>
<p>Se você não esperava este convite, por favor ignore este e-mail.</p>
<p>Atenciosamente,<br>Equipe com.rich</p>
```

---

### 3. Magic Link (Link Mágico)

**Subject:**
```
Seu link de acesso à com.rich
```

**Body (HTML):**
```html
<h2>Acesse sua conta</h2>
<p>Clique no link abaixo para fazer login na sua conta com.rich:</p>
<p><a href="{{ .ConfirmationURL }}">Fazer login</a></p>
<p>Se você não solicitou este link, por favor ignore este e-mail.</p>
<p>Atenciosamente,<br>Equipe com.rich</p>
```

---

### 4. Change Email Address (Alterar E-mail)

**Subject:**
```
Confirme a alteração do seu e-mail
```

**Body (HTML):**
```html
<h2>Confirme seu novo e-mail</h2>
<p>Você solicitou a alteração do endereço de e-mail da sua conta. Clique no link abaixo para confirmar:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar novo e-mail</a></p>
<p>Se você não solicitou esta alteração, por favor ignore este e-mail e entre em contato conosco.</p>
<p>Atenciosamente,<br>Equipe com.rich</p>
```

---

### 5. Reset Password (Redefinir Senha)

**Subject:**
```
Redefinir sua senha da com.rich
```

**Body (HTML):**
```html
<h2>Redefinir senha</h2>
<p>Você solicitou a redefinição de senha da sua conta. Clique no link abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir minha senha</a></p>
<p>Se você não solicitou esta redefinição, por favor ignore este e-mail. Sua senha não será alterada.</p>
<p>Atenciosamente,<br>Equipe com.rich</p>
```

---

## Variáveis Disponíveis

O Supabase fornece as seguintes variáveis para usar nos templates:

- `{{ .ConfirmationURL }}` - URL de confirmação/ação
- `{{ .Token }}` - Token de verificação
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do seu site

---

## Configurações Adicionais

### Site URL
Configure o **Site URL** em **Authentication > URL Configuration**:
```
https://com.rich
```

### Redirect URLs
Adicione URLs permitidas para redirect em **Authentication > URL Configuration > Redirect URLs**:
```
https://com.rich/**
http://localhost:5173/**
```

---

## Dicas de Design

Para melhorar o visual dos e-mails, você pode adicionar:

```html
<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #2B2D42;
  }
  h2 {
    color: #2B2D42;
  }
  a {
    display: inline-block;
    padding: 12px 24px;
    background-color: #2B2D42;
    color: white !important;
    text-decoration: none;
    border-radius: 8px;
    margin: 16px 0;
  }
  a:hover {
    background-color: #1a1b2e;
  }
</style>
```

---

## Testando os E-mails

Após configurar os templates:

1. Crie uma nova conta de teste
2. Verifique se o e-mail chega em português
3. Teste todos os fluxos:
   - Cadastro
   - Reset de senha
   - Alteração de e-mail

---

## Notas Importantes

- As alterações nos templates são aplicadas imediatamente
- Você pode usar HTML completo nos templates
- Certifique-se de que os links `{{ .ConfirmationURL }}` estejam corretos
- Teste em diferentes clientes de e-mail (Gmail, Outlook, etc.)
