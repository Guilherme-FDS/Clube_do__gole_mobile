# Regularização — Achados da Revisão de Código Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 9 achados confirmados (+ 1 melhoria leve) da revisão de código de alto esforço feita sobre as 41 commits do app mobile, antes de gerar o executável.

**Architecture:** Cada task corrige um achado isolado, com arquivo(s) exato(s) e diff completo. Task 1 é a única que toca o repo do **site** (correção de segurança em produção); todas as outras tocam o repo **mobile**.

**Tech Stack:** Vue 3 (site, Task 1), React Native/Expo SDK 54 (mobile, demais tasks).

**Repos:**
- Site: `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\site\Clube_do_gole` (branch `main`) — Task 1 apenas
- Mobile: `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile` (branch `master`) — Tasks 2–8

---

### Task 1: [SITE] Corrige open-redirect / roubo de code OAuth em OAuthCallback.vue

**Contexto:** achado crítico de segurança, já em produção. O callback aceita qualquer `state=mobile|<url>` e redireciona o `code` de autenticação pra essa URL sem validar se é do próprio app — um atacante pode montar link de phishing com `state=mobile|https://atacante.com` e roubar o código de autorização de uma vítima.

**Files:**
- Modify: `frontend/src/views/OAuthCallback.vue`

- [ ] **Step 1: Ler o estado atual do bloco `onMounted`**

Confirme que o arquivo tem exatamente este trecho antes de editar:

```js
onMounted(async () => {
  const code = route.query.code

  // Fluxo mobile: devolve o code pro app (Expo) e não processa aqui.
  // O state chega como "mobile|exp://..." — montado pelo app em src/services/oauth.js.
  const state = route.query.state || ''
  if (code && state.startsWith('mobile|')) {
    const returnUrl = state.slice('mobile|'.length)
    const sep = returnUrl.includes('?') ? '&' : '?'
    window.location.replace(`${returnUrl}${sep}code=${encodeURIComponent(code)}&provider=${provider}`)
    return
  }

  if (!code) {
    erro.value = 'Código de autorização ausente. Tente novamente.'
    return
  }

  try {
    const data = await auth.entrarOAuth(code, provider)
    router.push(data.tipo === 'admin' ? '/admin' : '/')
  } catch (e) {
    const msg = e?.response?.data?.detail
    erro.value = msg || 'Não foi possível completar o login. Tente novamente.'
  }
})
```

- [ ] **Step 2: Adicionar validação de origem antes do redirect**

Substituir o bloco `if (code && state.startsWith('mobile|')) { ... }` por:

```js
  if (code && state.startsWith('mobile|')) {
    const returnUrl = state.slice('mobile|'.length)
    const ORIGENS_PERMITIDAS = ['exp://', 'clubedogole://']
    if (!ORIGENS_PERMITIDAS.some((prefixo) => returnUrl.startsWith(prefixo))) {
      erro.value = 'Retorno inválido. Tente novamente pelo app.'
      return
    }
    const sep = returnUrl.includes('?') ? '&' : '?'
    window.location.replace(`${returnUrl}${sep}code=${encodeURIComponent(code)}&provider=${provider}`)
    return
  }
```

`exp://` cobre o app rodando no Expo Go (desenvolvimento); `clubedogole://` é o scheme customizado já registrado em `mobile/app.json` para builds standalone (APK/IPA) futuros.

- [ ] **Step 2: Verificar manualmente**

Não há suite de testes automatizados no frontend Vue. Verificação: ler o arquivo final e confirmar que qualquer `returnUrl` que não comece com `exp://` ou `clubedogole://` cai no `erro.value = 'Retorno inválido...'` em vez de `window.location.replace(...)`.

- [ ] **Step 3: Commit e push (deploy automático no Render)**

```bash
git add frontend/src/views/OAuthCallback.vue
git commit -m "fix: valida origem do returnUrl na ponte OAuth mobile (evita open redirect)"
git push origin main
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha do corpo do commit.

⚠️ Isso é produção — confirmar com o usuário antes do push se ele não tiver deixado autorização prévia para este plano especificamente.

---

### Task 2: [MOBILE] Corrige reset de seleção no carrinho ao ajustar quantidade

**Contexto:** `carregar()` reseta `selecionados` pra todos os itens toda vez que roda — incluindo quando `alterarQuantidade()` chama `carregar()` de novo após ajustar quantidade de um item. Usuário desmarca itens, ajusta quantidade de outro, e a desmarcação é apagada silenciosamente. Também causa um spinner de tela cheia numa ação que deveria ser局local.

**Files:**
- Modify: `src/screens/CarrinhoScreen.js`

- [ ] **Step 1: Substituir `alterarQuantidade` pra não recarregar o carrinho inteiro**

A API `/carrinho/quantidade` já retorna `novo_total_item` — usa a resposta pra atualizar só o item local, sem re-fetch nem reset de seleção:

```js
  async function alterarQuantidade(item, delta) {
    const novaQtd = item.quantidade + delta
    if (novaQtd < 1) return
    setAtualizandoId(item.id)
    try {
      const { data } = await api.post('/carrinho/quantidade', { item_id: item.id, quantidade: novaQtd })
      setItens(prev => prev.map(i => i.id === item.id ? { ...i, quantidade: novaQtd, valor_total: data.novo_total_item } : i))
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a quantidade.')
    } finally {
      setAtualizandoId(null)
    }
  }
```

Isso corrige os dois problemas de uma vez: `carregar()` não roda mais aqui, então `selecionados` não é mais tocado, e não há mais spinner de tela cheia — só o número do item atualiza.

- [ ] **Step 2: Verificar regressão**

Run: `cd "C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile" && npm test`
Expected: 25 passed, 5 suites (este arquivo não tem teste próprio — é UI).

- [ ] **Step 3: Commit**

```bash
git add src/screens/CarrinhoScreen.js
git commit -m "fix: alterarQuantidade nao reseta mais a selecao do carrinho"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 3: [MOBILE] Limpa a pilha de navegação após pagamento

**Contexto:** `navigation.navigate('Tabs', {screen:'Perfil'})` empilha uma tela nova em vez de limpar a pilha. Depois de pagar, apertar voltar reentra na tela de Checkout já finalizada, com os itens já comprados ainda visíveis.

**Files:**
- Modify: `src/screens/CheckoutScreen.js`

- [ ] **Step 1: Trocar `navigate` por `reset` em `finalizarCompra()`**

Encontrar a linha `navigation.navigate('Tabs', { screen: 'Perfil' })` dentro de `finalizarCompra()` e substituir por:

```js
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'Perfil' } }],
      })
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/CheckoutScreen.js
git commit -m "fix: reseta a pilha de navegacao apos finalizar compra"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 4: [MOBILE] Restaura verificação de carrinho vazio após assinar

**Contexto:** `assinar()` não verifica mais se o item realmente entrou no carrinho após o POST — navega direto pro Carrinho mesmo se o backend retornar 200 sem adicionar nada, deixando o usuário confuso num carrinho vazio.

**Files:**
- Modify: `src/screens/AssinaturaScreen.js`

- [ ] **Step 1: Adicionar verificação em `assinar()`**

Substituir o corpo da função `assinar()` por:

```js
  async function assinar() {
    if (!user) { navigation.navigate('Login'); return }
    if (!selecionado || !produto) return
    setAssinando(true)
    try {
      await api.post('/carrinho/adicionar', {
        produto_id: produto.id,
        plano_id: selecionado,
        quantidade: 1,
      })
      const { data: carrinho } = await api.get('/carrinho/')
      if (!carrinho.itens?.length) {
        Alert.alert('Ops', 'Não foi possível adicionar ao carrinho. Tente novamente.')
        return
      }
      navigation.navigate('Carrinho')
    } catch (e) {
      const detail = e?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || d).join('\n')
        : (detail || 'Não foi possível processar. Tente novamente.')
      Alert.alert('Ops', String(msg))
    } finally {
      setAssinando(false)
    }
  }
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/AssinaturaScreen.js
git commit -m "fix: restaura verificacao de carrinho vazio apos assinar"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 5: [MOBILE] AgeGate — try/catch no AsyncStorage e escape hatch no "Não"

**Contexto:** dois achados no mesmo componente: (a) `AsyncStorage.setItem` sem try/catch pode travar o usuário na tela de idade sem erro nem retry; (b) tocar "Não" é beco sem saída, sem botão de voltar.

**Files:**
- Modify: `App.js`
- Modify: `src/components/AgeGate.js`

- [ ] **Step 1: Adicionar try/catch no `onConfirmar` (App.js)**

Adicionar `Alert` ao import de `react-native` no topo do arquivo — trocar:
```js
import { Text } from 'react-native'
```
por:
```js
import { Text, Alert } from 'react-native'
```

Substituir o bloco do `AgeGate`:
```jsx
      <AgeGate onConfirmar={async () => {
        await AsyncStorage.setItem('age_verified', 'true')
        setIdadeVerificada(true)
      }} />
```
por:
```jsx
      <AgeGate onConfirmar={async () => {
        try {
          await AsyncStorage.setItem('age_verified', 'true')
          setIdadeVerificada(true)
        } catch {
          Alert.alert('Erro', 'Não foi possível salvar sua confirmação. Tente novamente.')
        }
      }} />
```

- [ ] **Step 2: Adicionar link de volta no `AgeGate.js`**

Substituir o bloco `recusado` por:

```jsx
        {recusado ? (
          <>
            <Text style={styles.titulo}>Conteúdo para maiores de 18 anos</Text>
            <Text style={styles.sub}>
              Este aplicativo contém conteúdo sobre bebidas alcoólicas e é destinado apenas a maiores de idade.
            </Text>
            <TouchableOpacity onPress={() => setRecusado(false)} style={{ marginTop: spacing.lg }}>
              <Text style={styles.linkVoltar}>← Voltar</Text>
            </TouchableOpacity>
          </>
        ) : (
```

Adicionar ao `StyleSheet.create` do final do arquivo:
```js
  linkVoltar: { color: colors.dourado, fontSize: 14, fontWeight: '600' },
```

- [ ] **Step 3: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 4: Commit**

```bash
git add App.js src/components/AgeGate.js
git commit -m "fix: trata erro do AsyncStorage e adiciona volta no AgeGate"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 6: [MOBILE] Remove código morto do modo manual de data no LoginScreen

**Contexto:** `modoManualData`/`dataNascTexto` e as funções `formatarDataTexto`/`parseDataBR` ficaram no arquivo sem nenhum botão que os acione — o link que ativava esse modo foi removido a pedido do usuário numa correção anterior, mas o código ficou pra trás.

**Files:**
- Modify: `src/screens/LoginScreen.js`

- [ ] **Step 1: Remover estado não usado**

Remover as linhas:
```js
  const [modoManualData, setModoManualData] = useState(false)
  const [dataNascTexto, setDataNascTexto] = useState('')
```
(mantém `dataNasc`, `mostrarPicker`, `limites` — esses continuam em uso).

- [ ] **Step 2: Simplificar o campo de data de nascimento**

Substituir todo o bloco `<Campo label="Data de nascimento">...</Campo>` (que hoje tem o ternário `modoManualData ? (...) : (...)`) por:

```jsx
              <Campo label="Data de nascimento">
                <TouchableOpacity style={styles.input} onPress={() => setMostrarPicker(!mostrarPicker)}>
                  <Text style={{ color: dataNasc ? colors.texto : colors.textoTerciario, fontSize: 15 }}>
                    {dataNasc ? dataParaBR(dataNasc) : 'Selecionar data'}
                  </Text>
                </TouchableOpacity>
                {mostrarPicker && (
                  <DateTimePicker
                    value={dataNasc || limites.max}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="light"
                    minimumDate={limites.min}
                    maximumDate={limites.max}
                    onChange={(event, d) => {
                      if (Platform.OS === 'android') setMostrarPicker(false)
                      if (d) setDataNasc(d)
                    }}
                  />
                )}
              </Campo>
```

- [ ] **Step 3: Remover as funções `formatarDataTexto` e `parseDataBR`**

Deletar as duas funções inteiras (ficam logo abaixo do fechamento do componente `LoginScreen`, antes de `function Campo`):
```js
function formatarDataTexto(text) {
  const nums = text.replace(/\D/g, '').slice(0, 8)
  if (nums.length <= 2) return nums
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`
}

function parseDataBR(texto, limites) {
  const nums = texto.replace(/\D/g, '')
  if (nums.length !== 8) return null
  const dia = parseInt(nums.slice(0, 2), 10)
  const mes = parseInt(nums.slice(2, 4), 10)
  const ano = parseInt(nums.slice(4, 8), 10)
  const d = new Date(ano, mes - 1, dia)
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null
  if (limites && (d < limites.min || d > limites.max)) return null
  return d
}
```

- [ ] **Step 4: Remover o estilo `linkModoData` agora não usado**

Remover a linha `linkModoData: { color: colors.dourado, fontSize: 12, fontWeight: '600' },` do `StyleSheet.create` no final do arquivo. Manter `erroCampo` (ainda usado pelo erro de senha do cadastro).

- [ ] **Step 5: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 6: Commit**

```bash
git add src/screens/LoginScreen.js
git commit -m "refactor: remove codigo morto do modo manual de data (sem entrada visivel)"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 7: [MOBILE] Extrai componente `Campo` compartilhado

**Contexto:** `function Campo({label, children})` (label + children, ~6 linhas) está copiado literalmente em 5 arquivos: `LoginScreen.js`, `EnderecoFormScreen.js`, `EditarPerfilScreen.js`, `SegurancaScreen.js`, `ContatoScreen.js`.

**Files:**
- Create: `src/components/Campo.js`
- Modify: `src/screens/LoginScreen.js`
- Modify: `src/screens/EnderecoFormScreen.js`
- Modify: `src/screens/EditarPerfilScreen.js`
- Modify: `src/screens/SegurancaScreen.js`
- Modify: `src/screens/ContatoScreen.js`

- [ ] **Step 1: Criar o componente compartilhado**

`src/components/Campo.js`:

```jsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

export default function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
})
```

- [ ] **Step 2: Atualizar `LoginScreen.js`**

Adicionar import (junto aos outros imports do topo):
```js
import Campo from '../components/Campo'
```

Remover do final do arquivo:
```js
function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={campoStyles.label}>{label}</Text>
      {children}
    </View>
  )
}

const campoStyles = StyleSheet.create({
  label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
})
```

- [ ] **Step 3: Atualizar `EnderecoFormScreen.js`**

Adicionar import:
```js
import Campo from '../components/Campo'
```

Remover a função local:
```js
function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}
```

Remover a linha `label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },` de dentro do `StyleSheet.create` (é usada só pelo Campo local que foi removido).

- [ ] **Step 4: Atualizar `EditarPerfilScreen.js`**

Mesmo padrão do Step 3: adicionar `import Campo from '../components/Campo'`, remover a função local `Campo` e a linha `label:` do `StyleSheet.create`.

- [ ] **Step 5: Atualizar `SegurancaScreen.js`**

Mesmo padrão: adicionar `import Campo from '../components/Campo'`, remover a função local `Campo` e a linha `label:` do `StyleSheet.create`.

- [ ] **Step 6: Atualizar `ContatoScreen.js`**

Mesmo padrão: adicionar `import Campo from '../components/Campo'`, remover a função local `Campo` e a linha `label:` do `StyleSheet.create`.

- [ ] **Step 7: Verificar regressão**

Run: `npm test`
Expected: 25 passed, 5 suites

- [ ] **Step 8: Commit**

```bash
git add src/components/Campo.js src/screens/LoginScreen.js src/screens/EnderecoFormScreen.js src/screens/EditarPerfilScreen.js src/screens/SegurancaScreen.js src/screens/ContatoScreen.js
git commit -m "refactor: extrai componente Campo compartilhado (era duplicado em 5 telas)"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 8: [MOBILE] Extrai regra de "CPF só grava se ainda vazio" compartilhada

**Contexto:** `CheckoutScreen.js` e `EditarPerfilScreen.js` implementam a mesma regra de negócio ("só inclui `cpf` no payload se ainda não tinha sido preenchido") de forma independente. Se a regra mudar, dá pra corrigir só uma tela por engano.

**Files:**
- Create: `src/utils/perfil.js`
- Test: `src/utils/__tests__/perfil.test.js`
- Modify: `src/screens/CheckoutScreen.js`
- Modify: `src/screens/EditarPerfilScreen.js`

- [ ] **Step 1: Escrever teste que falha**

`src/utils/__tests__/perfil.test.js`:

```js
import { payloadComCpf } from '../perfil'

describe('payloadComCpf', () => {
  const base = { nome: 'Ana', sobrenome: 'Silva', email: 'ana@x.com', telefone: '44999999999' }

  test('inclui cpf limpo quando cpfOriginal esta vazio e cpfNovo foi informado', () => {
    expect(payloadComCpf(base, '', '123.456.789-09')).toEqual({ ...base, cpf: '12345678909' })
  })

  test('nao inclui cpf quando cpfOriginal ja existe', () => {
    expect(payloadComCpf(base, '12345678909', '999.999.999-99')).toEqual(base)
  })

  test('nao inclui cpf quando cpfNovo esta vazio', () => {
    expect(payloadComCpf(base, '', '')).toEqual(base)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- perfil`
Expected: FAIL — "Cannot find module '../perfil'"

- [ ] **Step 3: Implementar**

`src/utils/perfil.js`:

```js
export function payloadComCpf(payloadBase, cpfOriginal, cpfNovo) {
  if (cpfOriginal || !cpfNovo) return payloadBase
  return { ...payloadBase, cpf: cpfNovo.replace(/\D/g, '') }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- perfil`
Expected: 3 passed

- [ ] **Step 5: Usar em `EditarPerfilScreen.js`**

Adicionar import:
```js
import { payloadComCpf } from '../utils/perfil'
```

Substituir o corpo de `salvar()`:
```js
  async function salvar() {
    if (!nome || !sobrenome || !email || !telefone) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.')
      return
    }
    setSalvando(true)
    try {
      const payloadBase = {
        nome, sobrenome, email, telefone,
        data_nascimento: dataNasc ? dataParaISO(dataNasc) : null,
      }
      const payload = payloadComCpf(payloadBase, cpfOriginal, cpf)
      const { data } = await api.put('/configuracoes/perfil', payload)
      setCpf(data.cpf || '')
      setCpfOriginal(data.cpf || '')
      Alert.alert('Sucesso', 'Perfil atualizado.')
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível salvar.'))
    } finally {
      setSalvando(false)
    }
  }
```

- [ ] **Step 6: Usar em `CheckoutScreen.js`**

Adicionar import:
```js
import { payloadComCpf } from '../utils/perfil'
```

Substituir o corpo de `salvarCpf()`:
```js
  async function salvarCpf() {
    const digitos = cpfInput.replace(/\D/g, '')
    if (digitos.length !== 11) {
      Alert.alert('Atenção', 'Informe um CPF válido.')
      return
    }
    setSalvandoCpf(true)
    try {
      const payloadBase = {
        nome: perfilBase.nome,
        sobrenome: perfilBase.sobrenome,
        email: perfilBase.email,
        telefone: perfilBase.telefone,
        data_nascimento: perfilBase.data_nascimento || null,
      }
      const payload = payloadComCpf(payloadBase, '', cpfInput)
      const { data } = await api.put('/configuracoes/perfil', payload)
      setCpf(data.cpf)
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível salvar o CPF.'))
    } finally {
      setSalvandoCpf(false)
    }
  }
```

(O gate do CPF em `CheckoutScreen` só aparece quando `!cpf`, então o "original" já é sempre vazio nesse ponto — passar `''` explicitamente deixa a regra visível e simétrica com `EditarPerfilScreen`.)

- [ ] **Step 7: Verificar suite completa**

Run: `npm test`
Expected: 28 passed, 6 suites (25 anteriores + 3 novos de `perfil.test.js`)

- [ ] **Step 8: Commit**

```bash
git add src/utils/perfil.js src/utils/__tests__/perfil.test.js src/screens/CheckoutScreen.js src/screens/EditarPerfilScreen.js
git commit -m "refactor: extrai regra compartilhada de CPF trava-apos-preenchido"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 9: Verificação final

- [ ] **Step 1: Rodar suite completa (mobile)**

Run: `cd "C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile" && npm test`
Expected: 28 passed, 6 suites

- [ ] **Step 2: Checklist manual (pendente — só o usuário pode fazer)**

1. Carrinho: desmarcar um item, ajustar quantidade de outro → desmarcação permanece
2. Finalizar compra → voltar (gesto/botão) não reentra na tela de checkout antiga
3. Assinar um plano → se der erro no meio do caminho, mensagem clara (não carrinho vazio silencioso)
4. AgeGate: tocar "Não" → aparece botão "← Voltar"
5. Cadastro: campo de data de nascimento continua funcionando normalmente (só o calendário, sem opção de texto)

- [ ] **Step 3: Push**

```bash
git push origin master
```
