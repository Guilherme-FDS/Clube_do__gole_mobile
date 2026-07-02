# Sub-projeto 1: Auth completo no app mobile

Data: 2026-07-02
Status: aprovado pelo usuário

## Contexto

O app mobile (Expo SDK 54 — **pinado, não fazer upgrade**; ver AGENTS.md) cobre ~20% do site. Plano macro aprovado em 4 sub-projetos, nesta ordem:

1. **Auth completo** (este documento)
2. Checkout completo (carrinho, endereço+CEP, cupom, CPF gate)
3. Configurações/Conta (perfil, CPF trava-após-preencher, endereços CRUD, trocar senha, pedidos detalhado)
4. Conteúdo institucional via Strapi (Sobre, FAQ, Blog, Contato, políticas — só o carrossel hero fica de fora)

Admin fica só no site. HEART (Google) e SDT (Deci & Ryan) são lentes de design em todos os sub-projetos: feedback claro de progresso/erro (Happiness/Task Success), reduzir fricção em cadastro/login (Adoption), mensagens que reforçam autonomia e pertencimento ao clube (Relatedness/Autonomy).

O app consome o MESMO backend do site (`https://clube-do-gole-backend.onrender.com/api`) e banco existente. Nada de endpoint novo neste sub-projeto.

## Escopo

### 1. Validações de cadastro (LoginScreen, modo cadastro)
- **Senha forte**: 8+ chars, 1 maiúscula, 1 minúscula, 1 número. Nova util `src/utils/validarSenha.js` — cópia da regra do site (`frontend/src/utils/validarSenha.js`) e do backend (`_validar_forca_senha` em `schemas/__init__.py`). Feedback em tempo real abaixo do campo (texto vermelho), não só no submit.
- **Data de nascimento**: substituir input de texto DD/MM/AAAA por `@react-native-community/datetimepicker` nativo com `maximumDate` = hoje−18 anos e `minimumDate` = hoje−120 anos. Isso torna impossível selecionar menor de 18 — validação por design, não por mensagem de erro.
- Erros do backend (409 CPF/email duplicado, 422 validação) exibidos como mensagem legível — backend já formata `detail` como string (handler global em `app.py`).

### 2. Esqueci minha senha
- Link "Esqueceu sua senha?" no modo login do LoginScreen.
- Nova tela `EsqueciSenhaScreen` (ou modo dentro do LoginScreen, seguindo o padrão do site que usa modo no mesmo card): campo email → `POST /auth/esqueceu-senha` → mensagem de sucesso "Se este email estiver cadastrado, você receberá as instruções" + aviso de que o link abre no navegador.
- Redefinição acontece na página web existente (`/reset-password?token=...`) aberta pelo link do email. Sem deep link nesta fase.
- **Atenção**: envio de email em produção está quebrado (SMTP bloqueado no Render — ver memória do projeto site). A tela deve ser construída mesmo assim; quando o site migrar pra Brevo, o app funciona sem mudança.

### 3. OAuth Google/Facebook
- Botões "Entrar com Google" / "Entrar com Facebook" no modo login, abaixo do form, com divisor "ou" (mesma hierarquia do site).
- Fluxo: app monta a MESMA URL de autorização que o site (`client_id`/`app_id` são públicos; `redirect_uri` = URL do site já autorizada nos consoles) → `WebBrowser.openAuthSessionAsync(url, redirectUrl)` → intercepta o retorno pro `redirect_uri`, extrai `?code=` da URL → `POST /auth/oauth/callback { code, provider }` (mesmo endpoint do site) → salva token no AsyncStorage via AuthContext.
- Zero configuração nova no Google Cloud Console / Facebook Developers. Zero deep link.
- Cancelamento/erro: retorna silenciosamente pro login (sem alert de erro se o usuário só fechou o browser).
- Constantes `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, redirect URIs: hardcoded em `src/services/oauth.js` (são valores públicos por natureza; o secret fica só no backend).

### 4. AgeGate (18+)
- Modal fullscreen no primeiro launch: "Você é maior de 18 anos?" com Sim/Não — mesma lógica do site (`AgeGate.vue`).
- Sim → grava `age_verified=true` no AsyncStorage, nunca mais mostra. Não → mensagem de bloqueio (app não tem "voltar pro Google" como no site; mostra tela estática "conteúdo para maiores de 18 anos").
- Renderizado no `App.js` acima do NavigationContainer enquanto não verificado.

## Dependências novas
- `expo-web-browser` (~15.x, compatível SDK 54)
- `@react-native-community/datetimepicker` (versão do SDK 54 — instalar com `npx expo install` para resolver versão correta)

## Fora de escopo (fica pros próximos sub-projetos)
- Carrinho/checkout/endereços/cupom (sub-projeto 2)
- Editar perfil, CPF, trocar senha (sub-projeto 3)
- Conteúdo Strapi (sub-projeto 4)
- Deep linking / notificações push
- Logout de todas as sessões

## Critérios de aceite
1. Cadastro rejeita senha fraca com feedback em tempo real ANTES do submit; backend rejeita também se burlado.
2. Picker de nascimento não permite selecionar data que resulte em <18 ou >120 anos.
3. "Esqueceu sua senha?" envia o request e mostra confirmação neutra (não revela se email existe).
4. Login com Google funciona de ponta a ponta no Expo Go (iPhone): browser abre, usuário autoriza, app recebe sessão e mostra o Perfil logado.
5. Login com Facebook idem.
6. AgeGate aparece só no primeiro launch; "Sim" persiste entre sessões.
7. Tudo roda no Expo Go SDK 54 sem ejetar e sem config externa nova.
