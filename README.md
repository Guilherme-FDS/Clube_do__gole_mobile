# Clube do Gole — App Mobile 🥃

Aplicativo mobile do Clube do Gole, feito com **Expo / React Native**. Traz a experiência do clube para o celular com foco em **assinatura** e, principalmente, **comunidade e pertencimento**.

## Como rodar (Expo Go)

1. Instale o app **Expo Go** no seu celular (Android/iOS)
2. No terminal:

```bash
cd mobile
npm install
npx expo start
```

3. Escaneie o QR code com o Expo Go (Android) ou com a câmera (iOS)

## Telas

- **Início** — boas-vindas com a identidade da marca, box do mês e como funciona
- **Assinatura** — box única (R$ 649,00/mês) com planos Mensal, Semestral (−5%) e Anual (−10%)
- **Comunidade** — drops do mês, receitas de membros, depoimentos e canais (Instagram/WhatsApp)
- **Perfil** — login/cadastro, minhas assinaturas e pedidos

## API

Consome o mesmo backend do site: `https://clube-do-gole-backend.onrender.com/api`

Endpoints usados: `/auth/login`, `/auth/cadastro`, `/auth/me`, `/produtos/`, `/carrinho/adicionar`, `/assinaturas/minhas`, `/carrinho/meus_pedidos`.

## Identidade visual

Mesma paleta do site: fundo escuro `#1b1a19`, dourado `#C9A84C`, detalhes em roxo `#7B2FE0` (ver `src/theme.js`).
