# 📘 Explicação Detalhada: Botões Ativar/Desativar - Loja e Social

## 🎯 Visão Geral

Os botões de **Ativar/Desativar** para os módulos **Loja** e **Social** funcionam com um sistema de **duplo controle** que garante flexibilidade para usuários e controle total para administradores.

---

## 🔐 Sistema de Duplo Controle

### Como Funciona?

Para que uma funcionalidade esteja **realmente ativa**, são necessárias **DUAS permissões simultâneas**:

```
FUNCIONALIDADE ATIVA = Permissão do Admin (TRUE) + Ativação do Usuário (TRUE)
```

### Colunas no Banco de Dados (Tabela: `user_profiles`)

| Coluna | Tipo | Quem Controla | Descrição |
|--------|------|---------------|-----------|
| `store_enabled` | boolean | **Usuário** | O usuário quer usar a loja? |
| `store_allowed_by_admin` | boolean | **Admin** | O admin permite que o usuário use a loja? |
| `social_enabled` | boolean | **Usuário** | O usuário quer usar a rede social? |
| `social_allowed_by_admin` | boolean | **Admin** | O admin permite que o usuário use a rede social? |

---

## 📊 Estados Possíveis

### Tabela de Combinações

| Admin Permite | Usuário Ativa | Estado Final | Badge Visual | Descrição |
|---------------|---------------|--------------|--------------|-----------|
| ✅ TRUE | ✅ TRUE | **ATIVA** | 🟢 Ativa | Funcionalidade funcionando completamente |
| ✅ TRUE | ❌ FALSE | **Desativada pelo usuário** | ⚠️ Desativada | Usuário desligou, mas pode religar quando quiser |
| ❌ FALSE | ✅ TRUE | **Bloqueada** | 🔴 Bloqueada | Admin bloqueou, usuário não pode usar |
| ❌ FALSE | ❌ FALSE | **Bloqueada** | 🔴 Bloqueada | Ambos desativaram |

---

## 🔄 O Que Acontece Quando o Usuário Desativa?

### 🏪 Ao Desativar a LOJA (`store_enabled = FALSE`):

#### 1. **Menu/Navegação do Painel**
- ❌ Atalho "Loja" no Dashboard Principal fica **desabilitado** (cinza)
- ❌ Item do menu lateral fica **oculto** ou **desabilitado**

#### 2. **Página Pública do Perfil**
- ❌ Botão "🛒 Loja" na página pública **desaparece completamente**
- ❌ Usuários visitantes **não conseguem** acessar `/[subdomain]/loja`
- ❌ Produtos **não aparecem** em lugar nenhum

#### 3. **Acesso Direto**
- ❌ Rota `/panel/loja` fica **bloqueada**
- ✅ Redirecionamento automático para dashboard ou mensagem de erro

#### 4. **Rede Social (se ativa)**
- ❌ Ícone "🛒" nos posts **desaparece**
- ❌ Link "Ver Loja" nos posts **não aparece**

#### 5. **Dados e Produtos**
- ✅ **NENHUM DADO É PERDIDO**
- ✅ Produtos continuam salvos no banco
- ✅ Configurações preservadas
- ✅ Imagens mantidas no storage

---

### 💬 Ao Desativar o SOCIAL (`social_enabled = FALSE`):

#### 1. **Menu/Navegação do Painel**
- ❌ Atalho "Feed Social" no Dashboard Principal fica **desabilitado** (cinza)
- ❌ Item do menu lateral fica **oculto** ou **desabilitado**

#### 2. **Página Pública do Perfil**
- ❌ Aba "Comunidade" **desaparece**
- ❌ Feed de posts **não aparece**
- ✅ Aba "Links" continua visível normalmente

#### 3. **Acesso Direto**
- ❌ Rota `/social` fica **bloqueada** para este usuário
- ❌ Não pode criar novos posts
- ❌ Não pode comentar ou curtir

#### 4. **Posts Existentes**
- ✅ **Posts NÃO são deletados**
- ⚠️ Posts ficam **invisíveis** na timeline pública
- ✅ Dados preservados no banco de dados
- ✅ Curtidas, comentários e interações mantidos

#### 5. **Perfil em Outros Feeds**
- ❌ Posts do usuário **não aparecem** no feed global
- ❌ Perfil **não aparece** em buscas de usuários sociais
- ✅ Outras pessoas ainda podem ver o perfil de links

---

## ✅ O Que Acontece Quando o Usuário Reativa?

### 🔄 Processo de Reativação

#### Para LOJA:
1. ✅ Botão de toggle fica **laranja** (ativo)
2. ✅ Menu lateral mostra item "Gerenciar Loja"
3. ✅ Dashboard mostra atalho "Loja" **habilitado**
4. ✅ Botão "🛒 Loja" **reaparece** na página pública
5. ✅ Rota `/panel/loja` fica **acessível**
6. ✅ Todos os produtos salvos **reaparecem** instantaneamente
7. ✅ Configurações anteriores são **restauradas**
8. ✅ Ícone da loja volta a aparecer nos posts sociais (se social ativo)

#### Para SOCIAL:
1. ✅ Botão de toggle fica **azul** (ativo)
2. ✅ Menu lateral mostra item "Meu Feed Social"
3. ✅ Dashboard mostra atalho "Feed Social" **habilitado**
4. ✅ Aba "Comunidade" **reaparece** na página pública
5. ✅ Rota `/social` fica **acessível**
6. ✅ Posts antigos **reaparecem** no feed
7. ✅ Usuário pode criar novos posts
8. ✅ Perfil volta a aparecer em buscas sociais

### ⚡ Tempo de Ativação
- **Instantâneo** - Não há processamento em background
- **Sem perda de dados** - Tudo volta exatamente como estava
- **Sem configuração adicional** - Apenas liga/desliga

---

## 🛡️ Bloqueio pelo Admin

### O Que Admin Pode Fazer?

Administradores podem **bloquear** o acesso de qualquer usuário aos módulos através do painel `/admin/profiles`.

#### Quando Admin Desativa (`store_allowed_by_admin = FALSE`):

1. ❌ **Usuário perde acesso total à funcionalidade**
2. 🔒 Toggle do usuário fica **travado** (não pode mais clicar)
3. 🔴 Badge "Bloqueado pelo admin" aparece
4. ⚠️ Mensagem: "Esta funcionalidade foi desativada pelo administrador"
5. ❌ Mesmo que `store_enabled = TRUE`, funcionalidade **não funciona**

#### Quando Admin Reativa (`store_allowed_by_admin = TRUE`):

1. ✅ Toggle do usuário fica **desbloqueado**
2. ✅ Usuário **pode decidir** se quer ativar ou não
3. ⚠️ **Estado do usuário é preservado** (se estava desativado, continua desativado)
4. ✅ Badge volta ao normal (Ativa/Desativada conforme escolha do usuário)

---

## 🎨 Interface Visual

### Componente `FeatureControls.tsx`

Este é o componente usado no painel do usuário em `/minha-pagina`.

#### Visual quando ATIVA:
```
┌────────────────────────────────────────────────┐
│ 🏪  Loja                    ✓ Ativa    ●──────┤ 🟠
│                                                 │
│ Adiciona uma loja virtual à sua página         │
│ com produtos, carrinho e checkout.              │
└────────────────────────────────────────────────┘
```

#### Visual quando DESATIVADA pelo Usuário:
```
┌────────────────────────────────────────────────┐
│ 🏪  Loja                              ──────●  │ ⚪
│                                                 │
│ Adiciona uma loja virtual à sua página         │
│ com produtos, carrinho e checkout.              │
└────────────────────────────────────────────────┘
```

#### Visual quando BLOQUEADA pelo Admin:
```
┌────────────────────────────────────────────────┐
│ 🔒  Loja      🔴 Bloqueado pelo admin ──────●  │ ⚪
│                                                 │
│ Adiciona uma loja virtual à sua página         │
│ com produtos, carrinho e checkout.              │
│                                                 │
│ ⚠️ Esta funcionalidade foi desativada pelo      │
│    administrador.                               │
└────────────────────────────────────────────────┘
```

---

## 🚀 Fluxo Técnico de Ativação/Desativação

### Código: Função `toggleFeature`

```typescript
const toggleFeature = async (feature: 'store' | 'social', currentValue: boolean) => {
  // 1. Verifica se admin permite
  const allowedByAdmin = feature === 'store'
    ? features.store_allowed_by_admin
    : features.social_allowed_by_admin;

  if (!allowedByAdmin) {
    // Bloqueado! Mostra alerta
    alert(`A funcionalidade foi bloqueada pelo administrador.`);
    return;
  }

  // 2. Inverte o valor atual
  const newValue = !currentValue;

  // 3. Atualiza no banco
  const { error } = await supabase
    .from('user_profiles')
    .update({ [`${feature}_enabled`]: newValue })
    .eq('id', profileId);

  // 4. Atualiza estado local
  setFeatures(prev => ({
    ...prev,
    [`${feature}_enabled`]: newValue
  }));

  // 5. Mostra toast de confirmação
  showToast(`Função ${featureName} ${newValue ? 'ativada' : 'desativada'} com sucesso`);

  // 6. Recarrega dados (opcional)
  if (onUpdate) onUpdate();
};
```

### Sequência de Eventos:

1. **Usuário clica no toggle**
2. ✅ Verifica permissão do admin
3. ✅ Atualiza banco de dados (`user_profiles`)
4. ✅ Atualiza estado React local
5. ✅ Mostra notificação toast
6. ✅ Callback `onUpdate()` é chamado (recarrega dados se necessário)
7. ✅ Interface atualiza instantaneamente

---

## 🔍 Verificações no Código

### Em `PublicProfileView.tsx`:

```typescript
// Verifica se loja está realmente ativa
const isStoreActive = () => {
  const userEnabled = profile?.store_enabled !== false;
  const adminAllowed = profile?.store_allowed_by_admin !== false;
  const showButton = profile?.show_store_button_on_profile !== false;
  return userEnabled && adminAllowed && showButton;
};

// Verifica se social está realmente ativo
const isSocialActive = () => {
  const userEnabled = profile?.social_enabled !== false;
  const adminAllowed = profile?.social_allowed_by_admin !== false;
  return userEnabled && adminAllowed;
};
```

### Em `PanelDashboard.tsx`:

```typescript
// Atalhos rápidos são desabilitados se funcionalidade estiver inativa
{
  icon: ShoppingBag,
  label: 'Loja',
  action: () => navigate('/panel/loja'),
  disabled: !storeEnabled || !userSubdomain,  // Desabilita se store_enabled = false
}

{
  icon: MessageSquare,
  label: 'Feed Social',
  action: () => navigate('/social'),
  disabled: !socialEnabled || !userSubdomain,  // Desabilita se social_enabled = false
}
```

---

## 📋 Checklist: O Que É Afetado?

### Quando LOJA é Desativada:

- [ ] ❌ Botão "Loja" no perfil público
- [ ] ❌ Rota `/panel/loja`
- [ ] ❌ Atalho no Dashboard
- [ ] ❌ Item do menu lateral
- [ ] ❌ Ícone 🛒 nos posts sociais
- [ ] ❌ Página `/[subdomain]/loja`
- [ ] ✅ Dados de produtos (preservados)
- [ ] ✅ Imagens (preservadas)

### Quando SOCIAL é Desativada:

- [ ] ❌ Aba "Comunidade" no perfil
- [ ] ❌ Rota `/social`
- [ ] ❌ Atalho no Dashboard
- [ ] ❌ Item do menu lateral
- [ ] ❌ Posts no feed global
- [ ] ❌ Criação de novos posts
- [ ] ❌ Comentários e curtidas
- [ ] ✅ Posts existentes (preservados)
- [ ] ✅ Interações antigas (preservadas)

---

## 🆘 Perguntas Frequentes

### 1. Se eu desativar, perco meus produtos/posts?
**Não!** Todos os dados são preservados no banco de dados. Ao reativar, tudo volta exatamente como estava.

### 2. Posso reativar a qualquer momento?
**Sim!** Basta clicar no toggle novamente (desde que o admin não tenha bloqueado).

### 3. O que acontece se o admin bloquear?
O toggle fica travado e você não consegue mais ativar/desativar. Apenas o admin pode desbloquear.

### 4. Desativar afeta meu plano/assinatura?
**Não.** Desativar funcionalidades não altera seu plano nem gera cobranças/créditos.

### 5. Outras pessoas veem que desativei?
**Sim.** Visitantes não verão o botão da loja nem a aba social na sua página pública.

### 6. Há algum delay para ativar/desativar?
**Não.** A mudança é instantânea após clicar no toggle e confirmar.

### 7. Posso desativar uma e manter a outra ativa?
**Sim!** Loja e Social são completamente independentes.

---

## 🎯 Resumo Executivo

| Aspecto | Comportamento |
|---------|--------------|
| **Controle** | Duplo (Admin + Usuário) |
| **Perda de Dados** | ❌ Nunca |
| **Tempo de Ativação** | ⚡ Instantâneo |
| **Reversibilidade** | ✅ Total |
| **Independência** | ✅ Loja e Social separados |
| **Bloqueio Admin** | 🔒 Sobrescreve usuário |
| **Notificação** | ✅ Toast de confirmação |
| **Atualização** | 🔄 Automática |

---

✅ **Sistema completamente implementado e funcionando!**
