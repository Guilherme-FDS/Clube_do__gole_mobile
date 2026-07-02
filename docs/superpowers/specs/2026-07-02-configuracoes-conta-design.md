# Sub-projeto 3: Configurações/Conta completo no app mobile

Data: 2026-07-02 (madrugada, execução autônoma sem check-in — ver nota no spec do sub-projeto 2, mesmo acordo vale aqui)
Status: escrito e implementado sem aprovação prévia do usuário (dormindo). **Revisar antes de considerar definitivo.**

## Contexto

Sub-projetos 1 (Auth) e 2 (Checkout) — feitos, revisados, pushados.

Hoje `PerfilScreen.js` mostra: avatar+nome+email, lista simples de assinaturas, lista simples de pedidos (sem status, sem detalhe), botão sair. Não dá pra editar nada, não tem CRUD de endereço fora do checkout, não tem trocar senha.

## Contratos de API confirmados

- `PUT /api/configuracoes/senha` `{senha_atual, nova_senha}` → `{message}`. `nova_senha` exige 8+/maiúscula/minúscula/número (já reforçado no backend). Erros: 400 "Senha atual incorreta.", 400 "Esta conta usa login social...", 400 validação.
- `GET /api/configuracoes/perfil` → `{usuario: UsuarioOut, enderecos: EnderecoOut[], pedidos: PedidoOut[]}` (mesmo endpoint já usado no Checkout)
- `PUT /api/configuracoes/perfil` `{nome, sobrenome, email, telefone, data_nascimento?, cpf?}` → `UsuarioOut` (CPF só grava se ainda vazio — trava no backend)
- `DELETE /api/configuracoes/enderecos/{id}` → `{message}` (200) ou `{detail}` (400)
- `PATCH /api/configuracoes/enderecos/{id}/principal` → `{message}` (200) ou `{detail}` (404)
- `PedidoOut`: `{id, status: "pendente"|"pago"|"cancelado"|"estornado", data, valor_total, valor_sem_desconto, desconto_aplicado, cupom_aplicado, economia, itens: ItemVendaOut[]}`
- `ItemVendaOut`: `{id_produto, id_plano, nome_produto, quantidade, plano, valor_unitario, valor_total, imagem, desconto_recorrencia}`

## Decisões de design (autônomas, documentadas)

### 1. Quatro telas novas, acessadas a partir do `PerfilScreen`
`EditarPerfilScreen`, `EnderecosScreen`, `SegurancaScreen`, `MeusPedidosScreen` — todas `Stack.Screen` (mesmo padrão de `Carrinho`/`Checkout`/`EnderecoForm`), acessadas por links/cards dentro de `PerfilScreen`.
**Por quê:** consistente com a arquitetura já estabelecida (telas empilhadas, sem tab extra).

### 2. `EnderecosScreen` reaproveita `EnderecoFormScreen` já existente
Lista endereços com "Editar" (navega pro form já construído no sub-projeto 2, passando `endereco` como param), "Excluir" (confirma + `DELETE`), "Tornar principal" (`PATCH`).
**Por quê:** `EnderecoFormScreen` já faz create E edit — zero trabalho duplicado.

### 3. CPF: mesma lógica trava-após-preencher já usada no gate do Checkout
`EditarPerfilScreen` mostra CPF como campo travado (cinza, `editable={false}`) se já preenchido, com aviso "Para alterar, contate o suporte" (mesma cópia do site). Se vazio, campo editável — igual ao gate que já existe em `CheckoutScreen`.
**Por quê:** paridade exata com o site (`Configuracoes.vue`).

### 4. Status de pagamento via query param (`?pagamento=sucesso/...`) FICA DE FORA
O site recebe esse retorno porque o Mercado Pago redireciona de volta pra URL do site depois do pagamento. No app, o pagamento abre no navegador externo (`Linking.openURL`) e não há mecanismo de deep-link configurado pra trazer esse retorno de volta pro app (mesma limitação identificada no fluxo OAuth — corrigir exigiria configurar scheme customizado e mudar o backend, fora de escopo hoje).
**Por quê:** decisão consciente de escopo, documentada — não é bug, é gap conhecido. Efeito prático: usuário não vê o banner verde/amarelo/vermelho ao voltar do pagamento; o status do pedido em si (pendente/pago) ainda aparece corretamente em `MeusPedidosScreen` assim que o backend confirmar via webhook do Mercado Pago.

### 5. `MeusPedidosScreen` busca dados do MESMO endpoint que já usamos no Checkout
`GET /configuracoes/perfil` já retorna `pedidos[]` — não precisa de endpoint novo, só uma tela nova pra exibir com mais detalhe (status badge colorido, itens expandidos, cupom aplicado).
**Por quê:** reaproveita chamada já implementada, zero mudança de backend.

### 6. `PerfilScreen` ganha uma seção "Configurações" com 4 links, e a lista simples de pedidos vira um link pra `MeusPedidosScreen`
Mantém a seção de assinaturas como está (já é adequada). Substitui a lista inline de pedidos por um botão "Ver meus pedidos →".
**Por quê:** evita duplicar lógica de exibição de pedido em dois lugares; `PerfilScreen` fica mais enxuta.

## Fora de escopo
- Banner de status de pagamento pós-retorno do MP (item 4 acima)
- Multi-sessão / logout de todos os dispositivos
- Excluir conta

## Critérios de aceite
1. `PerfilScreen` tem seção com links: Editar perfil, Meus endereços, Segurança, Ver meus pedidos
2. `EditarPerfilScreen`: edita nome/sobrenome/email/telefone/data-nascimento (picker nativo); CPF trava se já preenchido, editável se vazio; salva via `PUT /configuracoes/perfil`
3. `EnderecosScreen`: lista, edita (reaproveitando `EnderecoFormScreen`), exclui (com confirmação), define principal
4. `SegurancaScreen`: troca senha com validação forte em tempo real (reaproveitando `validarSenha`), erro claro se senha atual errada
5. `MeusPedidosScreen`: lista pedidos com status colorido (pago=verde, pendente=amarelo, cancelado=vermelho, estornado=azul), expande pra ver itens e cupom aplicado
6. Tudo roda no Expo Go SDK 54, sem dependência nova
