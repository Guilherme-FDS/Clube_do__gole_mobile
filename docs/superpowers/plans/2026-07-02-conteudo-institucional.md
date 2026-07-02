# Conteúdo Institucional (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paridade de conteúdo institucional com o site via Strapi: Sobre, FAQ, Blog, Contato, Presentes Corporativos, Política de Reembolso, Envio e Devoluções — só o carrossel do hero fica de fora (decisão já tomada).

**Architecture:** Um service `src/services/strapi.js` (cache 5min, mesmos endpoints do site) + um componente compartilhado `ConteudoStrapi.js` que renderiza blocos de rich-text do Strapi (parágrafo/h2/h3/citação/lista) — usado por 4 das 7 telas. Novas telas surgem via uma seção "Institucional" adicionada em `ComunidadeScreen`.

**Tech Stack:** Expo SDK 54 (PINADO), axios (já usado), sem dependência nova.

**Repo:** `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile` (branch `master`) — todas as tasks.

---

### Task 1: Service Strapi + util extrairTextoStrapi (TDD)

**Files:**
- Create: `src/utils/extrairTextoStrapi.js`
- Test: `src/utils/__tests__/extrairTextoStrapi.test.js`
- Create: `src/services/strapi.js`

- [ ] **Step 1: Escrever teste que falha** (`src/utils/__tests__/extrairTextoStrapi.test.js`):

```js
import { extrairTextoStrapi } from '../extrairTextoStrapi'

describe('extrairTextoStrapi', () => {
  test('concatena texto de children simples', () => {
    expect(extrairTextoStrapi([{ text: 'Olá ' }, { text: 'mundo' }])).toBe('Olá mundo')
  })
  test('retorna string vazia para array vazio', () => {
    expect(extrairTextoStrapi([])).toBe('')
  })
  test('retorna string vazia para undefined', () => {
    expect(extrairTextoStrapi(undefined)).toBe('')
  })
  test('ignora children sem propriedade text', () => {
    expect(extrairTextoStrapi([{ text: 'a' }, {}, { text: 'b' }])).toBe('ab')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- extrairTextoStrapi`
Expected: FAIL — "Cannot find module '../extrairTextoStrapi'"

- [ ] **Step 3: Implementar** (`src/utils/extrairTextoStrapi.js`):

```js
export function extrairTextoStrapi(children = []) {
  return children.map((c) => c.text || '').join('')
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- extrairTextoStrapi`
Expected: 4 passed

- [ ] **Step 5: Implementar o service** (`src/services/strapi.js`):

```js
import axios from 'axios'

export const STRAPI_URL = 'https://clube-do-gole-strapi.onrender.com'

const strapiApi = axios.create({ baseURL: `${STRAPI_URL}/api` })

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map()

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

async function get(path, params = {}) {
  const key = path + JSON.stringify(params)
  const cached = getCached(key)
  if (cached) return cached
  const { data } = await strapiApi.get(path, { params: { populate: '*', ...params } })
  const resultado = data?.data ?? []
  cache.set(key, { data: resultado, timestamp: Date.now() })
  return resultado
}

export const getFaqs = () => get('/faqs', { filters: { ativo: true }, sort: 'ordem:asc' })
export const getPosts = (params = {}) => get('/posts', { sort: 'publicado_em:desc', ...params })
export const getPost = (slug) => get('/posts', { filters: { slug } })
export const getPagina = (slug) => get('/paginas', { filters: { slug } })
```

- [ ] **Step 6: Verificar suite completa**

Run: `npm test`
Expected: 25 passed, 5 suites (21 anteriores + 4 novos)

- [ ] **Step 7: Commit**

```bash
git add src/utils/extrairTextoStrapi.js src/utils/__tests__/extrairTextoStrapi.test.js src/services/strapi.js
git commit -m "feat: service strapi com cache 5min e util de extracao de texto de blocos"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 2: Componente ConteudoStrapi (renderer compartilhado)

**Files:**
- Create: `src/components/ConteudoStrapi.js`

- [ ] **Step 1: Implementar**

```jsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'
import { extrairTextoStrapi } from '../utils/extrairTextoStrapi'

export default function ConteudoStrapi({ blocos }) {
  if (!blocos || blocos.length === 0) {
    return <Text style={styles.paragrafo}>Conteúdo em breve.</Text>
  }
  return (
    <View>
      {blocos.map((bloco, i) => {
        const texto = extrairTextoStrapi(bloco.children)
        if (bloco.type === 'heading' && bloco.level === 2) {
          return <Text key={i} style={styles.h2}>{texto}</Text>
        }
        if (bloco.type === 'heading' && bloco.level === 3) {
          return <Text key={i} style={styles.h3}>{texto}</Text>
        }
        if (bloco.type === 'quote') {
          return <Text key={i} style={styles.citacao}>{texto}</Text>
        }
        if (bloco.type === 'list') {
          return (
            <View key={i} style={styles.lista}>
              {(bloco.children || []).map((item, j) => (
                <Text key={j} style={styles.itemLista}>
                  {bloco.format === 'ordered' ? `${j + 1}. ` : '• '}{extrairTextoStrapi(item.children)}
                </Text>
              ))}
            </View>
          )
        }
        return <Text key={i} style={styles.paragrafo}>{texto}</Text>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  paragrafo: { color: colors.textoSecundario, fontSize: 15, lineHeight: 24, marginBottom: spacing.sm },
  h2: { color: colors.texto, fontSize: 20, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  h3: { color: colors.texto, fontSize: 17, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.xs },
  citacao: {
    color: colors.textoSecundario, fontSize: 15, fontStyle: 'italic', lineHeight: 24,
    borderLeftWidth: 3, borderLeftColor: colors.dourado, paddingLeft: spacing.sm, marginBottom: spacing.sm,
  },
  lista: { marginBottom: spacing.sm },
  itemLista: { color: colors.textoSecundario, fontSize: 15, lineHeight: 24, marginBottom: 4 },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/components/ConteudoStrapi.js
git commit -m "feat: componente ConteudoStrapi para renderizar blocos de rich-text"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 3: SobreScreen

**Files:**
- Create: `src/screens/SobreScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPagina } from '../services/strapi'

const VALORES = [
  { titulo: 'Curadoria', texto: 'Cada rótulo é selecionado a dedo por especialistas.' },
  { titulo: 'Comunidade', texto: 'Mais que assinatura, um clube de apreciadores.' },
  { titulo: 'Transparência', texto: 'Sem letras miúdas, sem pegadinhas.' },
]

export default function SobreScreen() {
  const [conteudo, setConteudo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPagina('sobre')
      .then((data) => setConteudo(data?.[0]?.conteudo || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Sobre o Clube do Gole</Text>

      {carregando ? (
        <ActivityIndicator color={colors.dourado} style={{ marginVertical: spacing.md }} />
      ) : (
        <ConteudoStrapi blocos={conteudo} />
      )}

      <Text style={styles.secao}>Nossos valores</Text>
      {VALORES.map((v) => (
        <View key={v.titulo} style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>{v.titulo}</Text>
          <Text style={styles.cardTexto}>{v.texto}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  secao: { color: colors.texto, fontSize: 18, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardTitulo: { color: colors.texto, fontSize: 15, fontWeight: '700' },
  cardTexto: { color: colors.textoSecundario, fontSize: 13, marginTop: 4, lineHeight: 20 },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/SobreScreen.js
git commit -m "feat: tela Sobre com historia do Strapi e cards de valores"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 4: FAQScreen

**Files:**
- Create: `src/screens/FAQScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import { getFaqs } from '../services/strapi'

export default function FAQScreen() {
  const [faqs, setFaqs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    getFaqs()
      .then((data) => setFaqs(data || []))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Perguntas frequentes</Text>
      {faqs.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhuma pergunta cadastrada ainda.</Text>
      ) : (
        faqs.map((faq, i) => {
          const expandido = aberto === i
          return (
            <TouchableOpacity
              key={faq.id ?? i}
              style={[styles.card, shadow.card]}
              onPress={() => setAberto(expandido ? null : i)}
              activeOpacity={0.85}
            >
              <View style={styles.perguntaRow}>
                <Text style={styles.pergunta}>{faq.pergunta}</Text>
                <Text style={styles.seta}>{expandido ? '−' : '+'}</Text>
              </View>
              {expandido && <Text style={styles.resposta}>{faq.resposta}</Text>}
            </TouchableOpacity>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  textoVazio: { color: colors.textoSecundario, fontSize: 14 },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  perguntaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pergunta: { color: colors.texto, fontSize: 15, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  seta: { color: colors.dourado, fontSize: 18, fontWeight: '700' },
  resposta: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/FAQScreen.js
git commit -m "feat: tela FAQ com accordion"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 5: BlogScreen + BlogPostScreen

**Files:**
- Create: `src/screens/BlogScreen.js`
- Create: `src/screens/BlogPostScreen.js`

- [ ] **Step 1: Implementar `BlogScreen.js`**

```jsx
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import { getPosts } from '../services/strapi'

function formatarData(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BlogScreen({ navigation }) {
  const [posts, setPosts] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPosts()
      .then((data) => setPosts(data || []))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Blog</Text>
      {posts.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhum post publicado ainda.</Text>
      ) : (
        posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[styles.card, shadow.card]}
            onPress={() => navigation.navigate('BlogPost', { slug: post.slug, titulo: post.titulo })}
            activeOpacity={0.85}
          >
            <Text style={styles.data}>{formatarData(post.publicado_em || post.createdAt)}</Text>
            <Text style={styles.postTitulo}>{post.titulo}</Text>
            <Text style={styles.resumo} numberOfLines={3}>{post.resumo}</Text>
            <Text style={styles.linkDourado}>Ler mais →</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  textoVazio: { color: colors.textoSecundario, fontSize: 14 },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  data: { color: colors.textoTerciario, fontSize: 12 },
  postTitulo: { color: colors.texto, fontSize: 17, fontWeight: '700', marginTop: 4 },
  resumo: { color: colors.textoSecundario, fontSize: 14, lineHeight: 20, marginTop: 6 },
  linkDourado: { color: colors.dourado, fontWeight: '700', fontSize: 13, marginTop: spacing.sm },
})
```

- [ ] **Step 2: Implementar `BlogPostScreen.js`**

```jsx
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPost } from '../services/strapi'

export default function BlogPostScreen({ route }) {
  const { slug, titulo } = route.params || {}
  const [post, setPost] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPost(slug)
      .then((data) => setPost(data?.[0] || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [slug])

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>{post?.titulo || titulo}</Text>
      <ConteudoStrapi blocos={post?.conteudo} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
})
```

- [ ] **Step 3: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 4: Commit**

```bash
git add src/screens/BlogScreen.js src/screens/BlogPostScreen.js
git commit -m "feat: telas de blog (lista e post individual)"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 6: ContatoScreen

**Files:**
- Create: `src/screens/ContatoScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'

const ASSUNTOS = ['Dúvida sobre assinatura', 'Problema com pedido', 'Parceria corporativa', 'Imprensa', 'Outro']

export default function ContatoScreen() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [assunto, setAssunto] = useState(ASSUNTOS[0])
  const [mensagem, setMensagem] = useState('')

  function enviar() {
    if (!nome || !email || !mensagem) {
      Alert.alert('Atenção', 'Preencha nome, email e mensagem.')
      return
    }
    const subject = encodeURIComponent(`[Clube do Gole] ${assunto}`)
    const body = encodeURIComponent(`Nome: ${nome}\nEmail: ${email}\nAssunto: ${assunto}\n\n${mensagem}`)
    Linking.openURL(`mailto:contato@clubedogole.com.br?subject=${subject}&body=${body}`)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Fale com a gente</Text>

      <TouchableOpacity
        style={[styles.canalCard, shadow.card]}
        onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=5544998969986')}
      >
        <Text style={styles.canalTitulo}>WhatsApp</Text>
        <Text style={styles.canalSub}>Resposta rápida</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.canalCard, shadow.card]}
        onPress={() => Linking.openURL('mailto:contato@clubedogole.com.br')}
      >
        <Text style={styles.canalTitulo}>E-mail</Text>
        <Text style={styles.canalSub}>contato@clubedogole.com.br</Text>
      </TouchableOpacity>

      <Text style={styles.secao}>Ou envie uma mensagem</Text>
      <View style={[styles.card, shadow.forte]}>
        <Campo label="Nome">
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="E-mail">
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Assunto">
          <View style={styles.assuntoWrap}>
            {ASSUNTOS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.assuntoChip, assunto === a && styles.assuntoChipAtivo]}
                onPress={() => setAssunto(a)}
              >
                <Text style={[styles.assuntoTexto, assunto === a && styles.assuntoTextoAtivo]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Campo>
        <Campo label="Mensagem">
          <TextInput
            style={[styles.input, styles.inputMultilinha]}
            value={mensagem}
            onChangeText={setMensagem}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textoTerciario}
          />
        </Campo>
        <BotaoDourado title="Enviar" onPress={enviar} style={{ marginTop: spacing.sm }} />
      </View>
    </ScrollView>
  )
}

function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  canalCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  canalTitulo: { color: colors.texto, fontSize: 15, fontWeight: '700' },
  canalSub: { color: colors.textoSecundario, fontSize: 13, marginTop: 2 },
  secao: { color: colors.texto, fontSize: 18, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.bordaCard, padding: spacing.lg,
  },
  label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.fundoCard, color: colors.texto, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  inputMultilinha: { minHeight: 90, textAlignVertical: 'top' },
  assuntoWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assuntoChip: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.bordaCard,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.fundoCard,
  },
  assuntoChipAtivo: { backgroundColor: colors.dourado, borderColor: colors.dourado },
  assuntoTexto: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600' },
  assuntoTextoAtivo: { color: '#1b1a19' },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/ContatoScreen.js
git commit -m "feat: tela de contato com mailto e canais diretos"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 7: CorporativoScreen

**Files:**
- Create: `src/screens/CorporativoScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'

const BENEFICIOS = [
  { titulo: 'Curadoria personalizada', texto: 'Seleção de rótulos alinhada à identidade da sua empresa.' },
  { titulo: 'Box premium', texto: 'Embalagem exclusiva para presentear com estilo.' },
  { titulo: 'Notas de degustação', texto: 'Material acompanha cada garrafa da seleção.' },
  { titulo: 'Entrega coordenada', texto: 'Logística para grandes volumes e datas especiais.' },
]

export default function CorporativoScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Presentes Corporativos</Text>
      <Text style={styles.sub}>
        Surpreenda clientes, parceiros e colaboradores com uma experiência de bebidas premium.
      </Text>

      {BENEFICIOS.map((b) => (
        <View key={b.titulo} style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>{b.titulo}</Text>
          <Text style={styles.cardTexto}>{b.texto}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.ctaWhats}
        onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=5544998969986')}
      >
        <Text style={styles.ctaWhatsTexto}>Falar no WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Contato')} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
        <Text style={styles.linkDourado}>Ou envie uma mensagem →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700' },
  sub: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardTitulo: { color: colors.texto, fontSize: 15, fontWeight: '700' },
  cardTexto: { color: colors.textoSecundario, fontSize: 13, marginTop: 4, lineHeight: 20 },
  ctaWhats: {
    backgroundColor: '#25D366', borderRadius: radius.pill, paddingVertical: 15,
    alignItems: 'center', marginTop: spacing.md,
  },
  ctaWhatsTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  linkDourado: { color: colors.dourado, fontWeight: '700', fontSize: 14 },
})
```

Nota: este arquivo referencia `navigation.navigate('Contato')` — a tela `Contato` já existe (Task 6) mas só é registrada no navigator na Task 9. Isso é esperado e correto (mesmo padrão usado nas tasks anteriores do sub-projeto 2).

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/CorporativoScreen.js
git commit -m "feat: tela de presentes corporativos (estatica)"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 8: EnvioDevolucoesScreen + PoliticaReembolsoScreen

**Files:**
- Create: `src/screens/EnvioDevolucoesScreen.js`
- Create: `src/screens/PoliticaReembolsoScreen.js`

- [ ] **Step 1: Implementar `EnvioDevolucoesScreen.js`**

```jsx
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPagina } from '../services/strapi'

export default function EnvioDevolucoesScreen() {
  const [conteudo, setConteudo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPagina('envio-devolucoes')
      .then((data) => setConteudo(data?.[0]?.conteudo || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Envio e Devoluções</Text>
      {carregando ? (
        <ActivityIndicator color={colors.dourado} style={{ marginVertical: spacing.md }} />
      ) : (
        <ConteudoStrapi blocos={conteudo} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
})
```

- [ ] **Step 2: Implementar `PoliticaReembolsoScreen.js`**

```jsx
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPagina } from '../services/strapi'

export default function PoliticaReembolsoScreen() {
  const [conteudo, setConteudo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPagina('politica-reembolso')
      .then((data) => setConteudo(data?.[0]?.conteudo || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Política de Reembolso</Text>
      {carregando ? (
        <ActivityIndicator color={colors.dourado} style={{ marginVertical: spacing.md }} />
      ) : (
        <ConteudoStrapi blocos={conteudo} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
})
```

- [ ] **Step 3: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 4: Commit**

```bash
git add src/screens/EnvioDevolucoesScreen.js src/screens/PoliticaReembolsoScreen.js
git commit -m "feat: telas de envio/devolucoes e politica de reembolso via Strapi"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 9: Ligar navegação + seção Institucional em ComunidadeScreen

**Files:**
- Modify: `App.js`
- Modify: `src/screens/ComunidadeScreen.js`

- [ ] **Step 1: Adicionar 7 telas no Stack.Navigator (App.js)**

Adicionar os imports:

```js
import SobreScreen from './src/screens/SobreScreen'
import FAQScreen from './src/screens/FAQScreen'
import BlogScreen from './src/screens/BlogScreen'
import BlogPostScreen from './src/screens/BlogPostScreen'
import ContatoScreen from './src/screens/ContatoScreen'
import CorporativoScreen from './src/screens/CorporativoScreen'
import EnvioDevolucoesScreen from './src/screens/EnvioDevolucoesScreen'
import PoliticaReembolsoScreen from './src/screens/PoliticaReembolsoScreen'
```

Adicionar 7 novos `Stack.Screen` como irmãos dos já existentes, dentro do mesmo `<Stack.Navigator>`, sem tocar em nenhum dos existentes:

```jsx
          <Stack.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'FAQ', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="Blog" component={BlogScreen} options={{ title: 'Blog', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="BlogPost" component={BlogPostScreen} options={{ title: 'Post', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="Contato" component={ContatoScreen} options={{ title: 'Contato', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="Corporativo" component={CorporativoScreen} options={{ title: 'Corporativo', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="EnvioDevolucoes" component={EnvioDevolucoesScreen} options={{ title: 'Envio e Devoluções', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="PoliticaReembolso" component={PoliticaReembolsoScreen} options={{ title: 'Política de Reembolso', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
```

- [ ] **Step 2: Adicionar seção "Institucional" em `ComunidadeScreen.js`**

Ler o arquivo atual (`src/screens/ComunidadeScreen.js`) antes de editar. Ele termina com uma seção "Participe" contendo dois `TouchableOpacity` de link social (Instagram, WhatsApp), dentro de um `ScrollView`. Adicionar, logo ANTES do WhatsApp TouchableOpacity que tem `{ marginBottom: spacing.xl }` (o último item do ScrollView), uma nova seção:

```jsx
      <Text style={styles.secao}>Institucional</Text>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('Sobre')}>
        <Text style={styles.socialEmoji}>🥂</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Sobre o Clube</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('FAQ')}>
        <Text style={styles.socialEmoji}>❓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Perguntas frequentes</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('Blog')}>
        <Text style={styles.socialEmoji}>📝</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Blog</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('Contato')}>
        <Text style={styles.socialEmoji}>✉️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Fale conosco</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('Corporativo')}>
        <Text style={styles.socialEmoji}>🎁</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Presentes Corporativos</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('EnvioDevolucoes')}>
        <Text style={styles.socialEmoji}>📦</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Envio e Devoluções</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.social, shadow.card]} onPress={() => navigation.navigate('PoliticaReembolso')}>
        <Text style={styles.socialEmoji}>💳</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Política de Reembolso</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>

```

E adicionar `navigation` como prop recebida no componente — trocar a assinatura de `export default function ComunidadeScreen() {` para `export default function ComunidadeScreen({ navigation }) {` (o arquivo atual não recebe `navigation` porque não navegava antes; agora precisa).

Manter o `{ marginBottom: spacing.xl }` no ÚLTIMO elemento do ScrollView (que antes era o card do WhatsApp — agora vira o novo card "Política de Reembolso" acima, então mover esse estilo de margem pro último item real).

- [ ] **Step 3: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 4: Commit**

```bash
git add App.js src/screens/ComunidadeScreen.js
git commit -m "feat: liga telas institucionais na navegacao e adiciona secao em Comunidade"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 10: Verificação final

- [ ] **Step 1: Rodar suite completa**

Run: `npm test`
Expected: 25 passed, 5 suites (6 validarSenha + 3 datas + 6 oauth + 6 cep + 4 extrairTextoStrapi)

- [ ] **Step 2: Checklist manual no Expo Go (pendente — só o usuário pode fazer)**

1. Comunidade → seção Institucional → cada link abre a tela certa
2. Sobre: mostra texto do Strapi + cards de valores
3. FAQ: accordion expande/colapsa uma pergunta por vez
4. Blog → lista de posts → clicar abre post individual renderizado
5. Contato: preencher form → "Enviar" abre app de email com assunto/corpo preenchidos
6. Corporativo: CTAs funcionam (WhatsApp, navegação pro Contato)
7. Envio/Devoluções e Política de Reembolso: mostram conteúdo do Strapi

- [ ] **Step 3: Push**

```bash
git push origin master
```
