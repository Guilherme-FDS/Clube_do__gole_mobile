# Sub-projeto 4: Conteúdo institucional (Strapi) no app mobile

Data: 2026-07-02 (madrugada, execução autônoma — mesmo acordo dos specs anteriores)
Status: escrito e implementado sem aprovação prévia do usuário (dormindo). **Revisar antes de considerar definitivo.**

## Contexto

Sub-projetos 1 (Auth), 2 (Checkout) e 3 (Configurações/Conta) — feitos, revisados, pushados. Este é o último sub-projeto do plano macro aprovado.

Escopo: Sobre, FAQ, Blog (+ post individual), Contato, Presentes Corporativos, Política de Reembolso, Envio e Devoluções — tudo via Strapi, **exceto o carrossel de imagens do hero** (decisão já confirmada pelo usuário anteriormente).

## Contratos confirmados (fonte: `frontend/src/services/strapi.js`)

- Base: `https://clube-do-gole-strapi.onrender.com` (mesma URL de produção do site), sempre `populate: '*'`
- Cache: Map em memória, TTL 5 min por rota — replico igual
- `getFaqs()` → `GET /api/faqs?filters[ativo]=true&sort=ordem:asc` → `[{id, pergunta, resposta}]`
- `getPosts(params)` → `GET /api/posts?sort=publicado_em:desc` → `[{id, slug, titulo, resumo, publicado_em|createdAt}]`
- `getPost(slug)` → `GET /api/posts?filters[slug]=...` → post único com `titulo`, `conteudo` (blocos)
- `getPagina(slug)` → `GET /api/paginas?filters[slug]=...` → `{titulo, conteudo}` (blocos ricos)
- Formato de bloco rico do Strapi (confirmado via engenharia reversa do renderer do site):
  ```
  {type: 'paragraph'|'heading'|'quote'|'list', level?: 2|3, format?: 'unordered'|'ordered', children: [{text}] | [{children:[{text}]}]}
  ```
  Extração de texto: concatena `children[].text`.

## Decisões de design (autônomas, documentadas)

### 1. Renderer de blocos compartilhado (`ConteudoStrapi.js` + `extrairTextoStrapi.js`)
O site duplica a MESMA lógica de renderização em 4 arquivos (sem componente compartilhado). No mobile, faço diferente: um componente `src/components/ConteudoStrapi.js` reutilizável (usado por Sobre, BlogPost, EnvioDevolucoes, PoliticaReembolso) + util puro `extrairTextoStrapi.js` (testável via TDD).
**Por quê:** zero motivo pra duplicar 4x num app novo; reduz superfície de bug. Suporta os mesmos 5 tipos de bloco que o site (parágrafo, h2, h3, citação, lista ordenada/não-ordenada) — nada além disso (sem imagem/embed, mesma limitação do site).

### 2. Onde essas telas aparecem na navegação
O site tem menu/rodapé com esses links; o app mobile só tem 4 abas (Home, Assinatura, Comunidade, Perfil), sem rodapé equivalente. **Decisão:** adiciono uma seção "Institucional" no final da aba `ComunidadeScreen` (já tem links externos tipo Instagram/WhatsApp — mesma família de conteúdo "sobre o clube/contato"), com 7 links: Sobre, FAQ, Blog, Contato, Presentes Corporativos, Política de Reembolso, Envio e Devoluções.
**Por quê:** `PerfilScreen` já tem uma seção "Configurações" (conta/dados pessoais) — misturar conteúdo institucional lá seria confuso categoricamente. `ComunidadeScreen` é o lugar mais parecido com "sobre o clube" que já existe.

### 3. Contato: mailto + WhatsApp, sem POST de backend (igual ao site)
Site não tem endpoint de contato — abre cliente de email nativo (`mailto:`) com assunto/corpo pré-preenchidos. Mobile replica com `Linking.openURL('mailto:...')`.

### 4. Sobre: híbrido (texto do Strapi + cards fixos), igual ao site
Site mistura texto de história vindo do CMS com cards de missão/valores hardcoded na página. Replico exatamente essa mistura (não é gap, é como o site já funciona).

### 5. Corporativo: sem Strapi, conteúdo estático
Confirmado no site — zero chamada de API. Replico como tela estática com CTAs pra WhatsApp/Contato.

## Fora de escopo
- Imagens/embeds em blocos de conteúdo (site também não suporta)
- Formulário de contato com POST pro backend (não existe no site — mailto é o padrão real)
- Banner/carrossel do hero (decisão já tomada antes)

## Critérios de aceite
1. `ComunidadeScreen` ganha seção "Institucional" com 7 links navegáveis
2. `FAQScreen`: lista accordion (pergunta expande resposta, um de cada vez)
3. `BlogScreen` → `BlogPostScreen`: lista de posts com data formatada pt-BR → post individual renderizado via `ConteudoStrapi`
4. `SobreScreen`: história do Strapi + cards de missão/valores fixos
5. `ContatoScreen`: form nome/email/assunto/mensagem → abre `mailto:` pré-preenchido; links diretos WhatsApp/email
6. `CorporativoScreen`: conteúdo estático com CTAs
7. `EnvioDevolucoesScreen`/`PoliticaReembolsoScreen`: conteúdo do Strapi via `ConteudoStrapi`
8. Cache de 5 min por rota implementado igual ao site
9. Tudo roda no Expo Go SDK 54, sem dependência nova
