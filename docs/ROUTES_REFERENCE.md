# Referência de Rotas do Sistema

**IMPORTANTE:** Este arquivo documenta TODAS as rotas disponíveis no sistema. Sempre consulte este arquivo antes de criar novos links ou referências a páginas.

## 🎯 Rotas Principais do Feed Social

| Rota | Destino | Descrição |
|------|---------|-----------|
| `/` | SocialFeed | Página principal - Feed público |
| `/feed` | SocialFeed | **Alias para o feed** (use este no dashboard) |
| `/social` | SocialFeed | Alias alternativo do feed |
| `/pt` | SocialFeed | Feed em português |
| `/en` | SocialFeed | Feed em inglês |
| `/es` | SocialFeed | Feed em espanhol |

**✅ RECOMENDADO:** Use `/feed` para links de navegação interna e menus.

---

## 📱 Rotas do Usuário (Social)

| Rota | Componente | Requer Login | Descrição |
|------|------------|--------------|-----------|
| `/meu-perfil` | MyProfile | ✅ Sim | Perfil do usuário logado |
| `/minha-pagina` | ProfilePreview | ✅ Sim | Preview da página pública |
| `/salvos` | SavedPosts | ✅ Sim | Posts salvos do usuário |
| `/social/:subdomain` | SocialFeed | ❌ Não | Feed de um subdomínio específico |

---

## 🏢 Rotas do Painel (Dashboard)

| Rota | Componente | Tipo de Usuário | Descrição |
|------|------------|-----------------|-----------|
| `/panel/dashboard` | PanelDashboard | Member/Admin | Dashboard principal |
| `/panel/domains` | DomainsPage | Todos | Gerenciar domínios |
| `/panel/billing` | Billing | Todos | Faturamento |
| `/panel/settings` | AccountSettings | Todos | Configurações da conta |
| `/panel/support` | Support | Todos | Suporte ao cliente |
| `/panel/revendedor` | ResellerDashboard | Revendedor | Dashboard de afiliado |
| `/panel/profile` | ProfileManager | Member/Admin | Editar perfil público |
| `/panel/loja` | StoreManager | Member/Admin | Gerenciar loja |
| `/panel/dns` | DNSManagement | Member/Admin | Gerenciar DNS |

---

## 👑 Rotas Admin

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/admin` | AdminDashboard | Dashboard admin |
| `/admin/dashboard` | AdminDashboard | Alias do dashboard admin |
| `/admin/users` | AdminUsers | Gerenciar usuários |
| `/admin/orders` | AdminOrders | Gerenciar pedidos |
| `/admin/settings` | AdminSettings | Configurações globais |
| `/admin/revendedores` | AdminResellers | Gerenciar revendedores |
| `/admin/suggestions` | AdminSuggestions | Sugestões de domínios |
| `/admin/sugestoes` | AdminSuggestions | Alias em português |
| `/admin/reserved-keywords` | AdminReservedKeywords | Palavras reservadas |
| `/admin/protected-brands` | AdminProtectedBrands | Marcas protegidas |
| `/admin/link-moderation` | AdminLinkModeration | Moderar links |
| `/admin/social-moderation` | AdminSocialModeration | Moderar posts sociais |
| `/admin/profiles` | AdminProfiles | Gerenciar perfis |
| `/admin/logs` | AdminLogs | Logs do sistema |
| `/admin/chatbot` | AdminChatbot | Configurar chatbot |
| `/admin/email` | AdminEmail | Gerenciar emails |

---

## 🛒 Rotas de Marketplace e Lojas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/marketplace` | MarketplaceNew | Marketplace de domínios premium |
| `/premium` | Marketplace | Alias do marketplace |
| `/lojas` | StoresDirectory | Diretório de lojas |
| `/:subdomain/loja` | PublicStore | Loja pública de um usuário |

---

## 🔐 Rotas de Autenticação

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/login` | Login | Página de login |
| `/register` | Register | Página de registro |
| `/iniciar` | Register | Alias do registro |
| `/auth/callback` | AuthCallback | Callback OAuth |
| `/select-user-type` | SelectUserType | Seleção de tipo de usuário |
| `/panel/settings/2fa` | TwoFactorSetup | Configurar 2FA |

---

## 💳 Rotas de Pagamento

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/registrar-dominio` | RegisterDomain | Registrar novo domínio |
| `/checkout` | Checkout | Finalizar compra |
| `/sucesso` | Success | Pagamento aprovado |
| `/falha` | Failure | Pagamento falhou |
| `/paypal/return` | PayPalReturn | Retorno PayPal |
| `/paypal/cancel` | PayPalCancel | Cancelamento PayPal |

---

## 📄 Rotas de Políticas e Legal

| Rota | Componente |
|------|------------|
| `/termos` | Terms |
| `/politica` | Privacy |
| `/cookies` | Cookies |
| `/politica-reembolso` | RefundPolicy |
| `/politica-suspensao` | SuspensionPolicy |
| `/politica-uso-aceitavel` | AcceptableUsePolicy |
| `/politica-padroes-comunidade` | CommunityStandards |
| `/politica-seguranca` | SecurityPolicy |
| `/politica-transferencia-dominio` | DomainTransferPolicy |
| `/politica-conteudo-usuario` | UserContentPolicy |
| `/aviso-direitos-autorais` | CopyrightNotice |
| `/conformidade-legal` | LegalCompliance |
| `/adendo-processamento-dados` | DataProcessingAddendum |
| `/politica-acessibilidade` | AccessibilityPolicy |
| `/politica-exclusao` | DeletionPolicy |
| `/politica-solicitacao-dados` | DataRequestPolicy |
| `/policies/store-terms` | StoreTerms |
| `/policies/social-terms` | SocialTerms |

---

## 🤝 Rotas de Afiliados

| Rota | Componente | Requer Login | Descrição |
|------|------------|--------------|-----------|
| `/afiliados` | AffiliateDashboard | ✅ Sim | Dashboard do afiliado |
| `/afiliados/termos` | AffiliateTerms | ❌ Não | Termos do programa |
| `/afiliados/sobre` | AffiliateAbout | ❌ Não | Sobre o programa |
| `/r/:code` | RefRedirect | ❌ Não | Redirect de afiliado |

---

## ℹ️ Rotas Informativas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/home` | Home | Homepage alternativa |
| `/valores` | Pricing | Página de preços |
| `/faq` | FAQ | Perguntas frequentes |
| `/club` | RichClub | Rich Club |
| `/contato` | Contact | Página de contato |
| `/contact` | Contact | Alias em inglês |
| `/transferencia` | Transfer | Transferir domínios |
| `/suporte` | SupportNew | Central de suporte |
| `/suporte/abrir-chamado` | OpenTicket | Abrir ticket |
| `/suporte/:slug` | SupportArticle | Artigo de suporte |

---

## 🔧 Rotas Especiais

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/diagnostic` | DiagnosticTest | Teste de diagnóstico |
| `/:slug` | DomainSlugPage | Rota dinâmica - captura subdomínios/slugs |

---

## ⚠️ Regras Importantes

### 1. **Rotas Sem Header/Footer**
As seguintes rotas NÃO exibem Header/Footer:
- Qualquer rota começando com `/panel/`
- Qualquer rota começando com `/admin/`
- `/feed`
- `/social` e `/social/*`
- `/meu-perfil`
- `/minha-pagina`
- `/salvos`
- Rotas dinâmicas (`:slug`, `:subdomain`)
- Rotas com `/loja`

### 2. **Ordem de Definição**
**CRÍTICO:** A rota `/:slug` (DomainSlugPage) deve ser sempre a ÚLTIMA rota definida, pois captura qualquer caminho não correspondente.

### 3. **Criando Novas Rotas**

Ao adicionar uma nova rota:

1. ✅ **SEMPRE adicione a rota em `App.tsx`**
2. ✅ **Atualize este arquivo (`ROUTES_REFERENCE.md`)**
3. ✅ **Se a rota não deve ter Header/Footer, adicione em `hideLayout`**
4. ✅ **Se é uma rota pública, adicione em `publicRoutes`**
5. ✅ **Teste a navegação antes de commitar**

### 4. **Aliases de Rotas**

Quando criar aliases (múltiplas rotas para o mesmo componente):
- Documente todos os aliases neste arquivo
- Use comentários claros no `App.tsx`
- Prefira usar o alias principal nos menus/navegação

---

## 🎨 Exemplo de Uso no Código

```tsx
// ✅ CORRETO - Usa rota documentada
<Link to="/feed">Ir para Feed</Link>

// ✅ CORRETO - Usa alias documentado
<Link to="/social">Ir para Feed</Link>

// ❌ ERRADO - Rota não existe
<Link to="/feedgeral">Ir para Feed</Link>
```

---

## 📝 Notas

- Este arquivo deve ser atualizado sempre que uma nova rota for adicionada ou removida
- Verifique este arquivo ANTES de criar links em componentes
- Em caso de dúvida, consulte `src/App.tsx` para a implementação atual
- Rotas protegidas requerem autenticação válida
- Rotas admin requerem role de administrador

---

**Última atualização:** 2025-11-12
**Versão:** 1.0
