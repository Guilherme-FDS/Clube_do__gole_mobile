# Sub-projeto 2: Checkout completo no app mobile

Data: 2026-07-02 (madrugada, execução autônoma sem check-in — ver nota abaixo)
Status: escrito e implementado sem aprovação prévia do usuário (dormindo). **Revisar antes de considerar definitivo.**

> **Nota sobre este documento**: o usuário autorizou execução autônoma noturna do projeto mobile, aceitando que decisões de design ambíguas fossem tomadas sem perguntar (documentando o porquê) em vez de bloquear esperando resposta. Este spec segue esse acordo. Qualquer decisão aqui pode ser revertida/ajustada — não foi validada por diálogo, foi inferida do site (fonte da verdade) + bom senso de produto.

## Contexto

Sub-projeto 1 (Auth completo) — feito, revisado, pushado (`mobile` branch master, commit `2b851e4`).

Ordem macro aprovada pelo usuário: Auth → **Checkout (este)** → Configurações/Conta → Conteúdo institucional (Strapi).

Hoje, `AssinaturaScreen.js` faz: seleciona plano → adiciona ao carrinho → busca carrinho → **finaliza compra na hora** → abre URL do Mercado Pago. Isso pula inteiramente: revisão de carrinho, seleção de endereço, CEP, cupom, e o gate de CPF que o site tem. É o maior buraco de paridade encontrado (mapeado na conversa com o usuário mais cedo).

## Contratos de API confirmados (fonte: backend, não suposição do frontend)

- `GET /api/carrinho` → `{itens: ItemCarrinhoOut[], total: float}`
- `POST /api/carrinho/adicionar` `{produto_id, plano_id, quantidade}` → `{message, count}`
- `POST /api/carrinho/quantidade` `{item_id, quantidade}` → `{message, novo_total_item, total_carrinho}`
- `POST /api/carrinho/remover` `{ids: [...]}` → `{removidos, total}`
- `POST /api/carrinho/finalizar` `{ids: [...], cupom: str|null, desconto_cupom: float(pct), desconto_fixo_cupom: float|null}` → `{message, checkout_url: str|null}` (null = modo dev, aprovação automática)
- `GET /api/configuracoes/enderecos` → `EnderecoOut[]`
- `POST /api/configuracoes/enderecos` `EnderecoIn` → `EnderecoOut` (201)
- `PUT /api/configuracoes/enderecos/{id}` `EnderecoIn` → `EnderecoOut`
- `PATCH /api/configuracoes/enderecos/{id}/principal` → `{message}`
- `EnderecoIn`: `{tipo, cep, endereco, numero, complemento?, bairro, cidade, estado, pais="Brasil", principal}`
- `POST /api/cupons/validar` `{codigo}` → `{valido, mensagem, desconto: float(pct), desconto_tipo: "percentual"|"fixo", desconto_fixo?: float}`
- `GET /api/configuracoes/perfil` → `{usuario: {..., cpf}, enderecos: [...], pedidos: [...]}` (já usado pelo PerfilScreen)
- `PUT /api/configuracoes/perfil` `{nome, sobrenome, email, telefone, data_nascimento?, cpf?}` → `UsuarioOut` (CPF só grava se ainda vazio — trava já existe no backend)

## Decisões de design (autônomas, documentadas)

### 1. Fluxo de navegação: Assinatura → Carrinho → Checkout (não mais direto)
**Decisão:** `AssinaturaScreen` para de finalizar sozinha. Ao "assinar", adiciona ao carrinho e navega pra nova tela `CarrinhoScreen`. De lá, "Finalizar Compra" navega pra `CheckoutScreen`.
**Por quê:** É exatamente o fluxo do site (ProdutosDetalhe → Carrinho → Checkout). Pular carrinho/endereço/cupom foi o maior gap mapeado. SDT-autonomia: dá pro usuário revisar/ajustar antes de comprometer.

### 2. Carrinho com multi-seleção (como o site) mesmo sendo uso majoritariamente single-item
**Decisão:** implementar seleção múltipla via checkbox por item, igual ao site, mesmo que o uso típico do Clube do Gole seja um item só (a assinatura mensal/semestral/anual).
**Por quê:** instrução explícita foi "tudo que tem no site precisa estar no app". Custo de implementar é baixo (mesma lógica, só UI). Se no futuro quiser simplificar pra single-item, é um corte, não uma adição.

### 3. Gate de CPF resolvido inline no Checkout, sem esperar a tela de Configurações (sub-projeto 3)
**Decisão:** se o perfil não tiver CPF, `CheckoutScreen` mostra um campo de CPF inline (não navega pra lugar nenhum) e salva via `PUT /configuracoes/perfil` reenviando os campos atuais (nome/sobrenome/email/telefone já carregados do `GET /configuracoes/perfil`) + o CPF novo.
**Por quê:** sub-projeto 3 (Configurações/Conta completo, onde CPF "deveria" morar) ainda não foi implementado — é o PRÓXIMO sub-projeto, não este. Bloquear Checkout nisso empataria o projeto. A trava real (CPF só grava uma vez) já existe no backend — aqui só preciso de UM campo de formulário, não a tela inteira de perfil. Quando o sub-projeto 3 rodar, o mesmo campo/lógica pode ser reaproveitado ou a tela de Configurações fica com o campo já bloqueado se o CPF já tiver sido preenchido aqui.

### 4. CEP: busca automática via viaCEP, direto do app (sem endpoint backend)
**Decisão:** replicar exatamente o que o site faz — `fetch('https://viacep.com.br/ws/{cep}/json/')` direto do cliente, preenche `endereco/bairro/cidade/estado`.
**Por quê:** viaCEP é API pública sem necessidade de chave/CORS problemático em app nativo. Zero mudança de backend necessária.

### 5. Endereço: tela modal de formulário separada (`EnderecoFormScreen`), não modal customizado inline
**Decisão:** seguir o padrão já existente no app (Login é um `Stack.Screen` com `presentation: 'modal'`) em vez de construir um componente de modal do zero.
**Por quê:** consistência arquitetural com o que já existe; menos código novo.

### 6. Pagamento: abre `checkout_url` do Mercado Pago no navegador (mesma técnica já usada em `AssinaturaScreen`)
**Decisão:** mantém `Linking.openURL(checkout_url)` já implementado; se `checkout_url` for `null` (modo dev), mostra sucesso e navega pro Perfil — mesma lógica que já existe em `AssinaturaScreen` hoje, só que agora acontece em `CheckoutScreen` no fim do fluxo completo, não mais em `AssinaturaScreen`.

### 7. Sem carrinho global (Context/Store) — segue padrão já existente no app
**Decisão:** carrinho e endereços são buscados via `api.get/post` direto dentro das telas (`useState` local), sem criar um `CarrinhoContext` novo.
**Por quê:** é exatamente como `AssinaturaScreen`/`PerfilScreen` já funcionam hoje (só `AuthContext` é global). Adicionar um store novo seria inconsistente com o padrão estabelecido e não foi pedido.

## Fora de escopo (mantém pra depois)
- Editar CPF depois de já preenchido (trava é do backend, não mexe aqui)
- Tela de Configurações/Perfil completa (sub-projeto 3)
- Meus Pedidos detalhado com status de pagamento (sub-projeto 3)
- Remover item do carrinho (existe endpoint `/carrinho/remover`, mas não é essencial pro fluxo de compra — se sobrar tempo, adiciono; senão fica pro próximo passe)

## Critérios de aceite
1. `AssinaturaScreen` → "Assinar agora" adiciona ao carrinho e abre `CarrinhoScreen` (não finaliza mais sozinha)
2. `CarrinhoScreen` lista itens, permite ajustar quantidade (chama `/carrinho/quantidade`), seleção múltipla, botão "Finalizar Compra" navega pro `CheckoutScreen` com os IDs selecionados
3. `CheckoutScreen` carrega endereços existentes, permite selecionar um, ou abrir `EnderecoFormScreen` pra cadastrar novo (com autofill de CEP)
4. Se CPF ausente, campo inline aparece e bloqueia "Ir para pagamento" até preencher
5. Cupom: campo + botão "Aplicar", mostra desconto calculado (percentual ou fixo) no resumo
6. Resumo mostra subtotal, desconto, total corretamente calculado (mesma fórmula do site: `max(0, subtotal - desconto)`)
7. "Ir para pagamento" chama `/carrinho/finalizar` com os IDs certos + dados do cupom; abre MP ou mostra sucesso em modo dev
8. Tudo roda no Expo Go SDK 54, sem dependência nativa nova além do que já existe
