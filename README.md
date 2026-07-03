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

## Testando pagamentos

O checkout do app usa o mesmo backend do site, então para testar pagamentos em modo sandbox, o backend (Render ou local) precisa estar configurado com credenciais de TESTE do Mercado Pago (prefixo `TEST-` em `MP_ACCESS_TOKEN`/`MP_PUBLIC_KEY` — configuração feita no repositório do site, não no app). Com credenciais de teste, o Mercado Pago aceita apenas os dados fictícios abaixo — nenhum cartão, PIX ou boleto real é cobrado.

### Conta de teste (comprador)

Na hora de pagar no checkout do Mercado Pago (tela do próprio MP, fora do app), use a conta de teste "comprador" abaixo para logar quando solicitado:

| Papel | Usuário | Senha |
|---|---|---|
| Comprador | `TESTUSER6108724104764143400` | `Zw3MoG9dw1` |

(Contas de teste do Mercado Pago são fictícias — não usam dados reais e não movimentam dinheiro real.)

### Cartões de crédito de teste

| Bandeira | Número | CVV | Validade | Resultado |
|---|---|---|---|---|
| Mastercard | 5031 4332 1540 6351 | 123 | 11/30 | Aprovado |
| Visa | 4235 6477 2802 5682 | 123 | 11/30 | Aprovado |
| Visa (recusado) | 4013 5406 8274 6260 | 123 | 11/30 | Recusado (fundos insuficientes) |

Nome do titular: `APRO` (aprova automaticamente) ou `OTHE` (recusa) — convenção oficial de sandbox do Mercado Pago.
CPF de teste: qualquer CPF válido gerado, ou `123.456.789-09`.

### PIX e boleto de teste

No sandbox, o QR code do PIX e o boleto gerados são fictícios. O painel de testes do Mercado Pago (conta de teste "vendedor") permite simular a confirmação do pagamento manualmente.

### Referência oficial

Para números de cartão atualizados, consulte a [documentação oficial de cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing).

## Identidade visual

Mesma paleta do site: fundo escuro `#1b1a19`, dourado `#C9A84C`, detalhes em roxo `#7B2FE0` (ver `src/theme.js`).
