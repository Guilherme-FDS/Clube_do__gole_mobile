# Auth Completo (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paridade de autenticação com o site: senha forte, bloqueio <18 via picker nativo, esqueci-senha, OAuth Google/Facebook e AgeGate — tudo rodando no Expo Go SDK 54.

**Architecture:** App consome o backend existente (`https://clube-do-gole-backend.onrender.com/api`) sem endpoints novos. OAuth usa o redirect HTTPS já registrado nos consoles: o app injeta `state=mobile|<returnUrl>` na URL de autorização; a página `OAuthCallback.vue` do site detecta esse state e re-redireciona o `code` para o app via scheme `exp://` (Expo Go) ou `clubedogole://` (build futura), fechando o `openAuthSessionAsync`. Utils puros (senha, datas, OAuth URL) têm testes jest; telas têm verificação manual no Expo Go.

**Tech Stack:** Expo SDK 54 (PINADO — ver AGENTS.md, nunca subir de versão), React Native 0.81, expo-web-browser, expo-linking, @react-native-community/datetimepicker, jest-expo.

**Repos envolvidos:**
- Mobile: `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile` (branch `master`) — Tasks 1–6, 8–12
- Site: `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\site\Clube_do_gole` (branch `main`) — Task 7 apenas (push = deploy automático no Render)

---

### Task 1: Infra de testes (jest-expo)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar jest-expo**

Run (na pasta `mobile`): `npx expo install jest-expo jest`
Expected: adiciona `jest-expo@~54.x` e `jest` em devDependencies sem warnings de peer.

- [ ] **Step 2: Configurar preset e script**

Em `package.json`, adicionar dentro do objeto raiz:

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest"
},
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 3: Smoke test**

Criar `src/utils/__tests__/smoke.test.js`:

```js
test('jest funciona', () => {
  expect(1 + 1).toBe(2)
})
```

Run: `npm test`
Expected: `1 passed`. Depois apagar o arquivo `smoke.test.js`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adiciona jest-expo para testes de utils"
```

---

### Task 2: Util validarSenha (TDD)

Mesma regra do site (`frontend/src/utils/validarSenha.js`) e do backend (`_validar_forca_senha`).

**Files:**
- Create: `src/utils/validarSenha.js`
- Test: `src/utils/__tests__/validarSenha.test.js`

- [ ] **Step 1: Escrever teste que falha**

```js
import { validarSenha } from '../validarSenha'

describe('validarSenha', () => {
  test('rejeita senha curta', () => {
    expect(validarSenha('Ab1')).toBe('A senha deve ter no mínimo 8 caracteres.')
  })
  test('rejeita sem maiúscula', () => {
    expect(validarSenha('abcdefg1')).toBe('A senha deve conter ao menos uma letra maiúscula.')
  })
  test('rejeita sem minúscula', () => {
    expect(validarSenha('ABCDEFG1')).toBe('A senha deve conter ao menos uma letra minúscula.')
  })
  test('rejeita sem número', () => {
    expect(validarSenha('Abcdefgh')).toBe('A senha deve conter ao menos um número.')
  })
  test('aceita senha forte', () => {
    expect(validarSenha('Abcdefg1')).toBeNull()
  })
  test('rejeita vazio/null', () => {
    expect(validarSenha('')).toBe('A senha deve ter no mínimo 8 caracteres.')
    expect(validarSenha(null)).toBe('A senha deve ter no mínimo 8 caracteres.')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- validarSenha`
Expected: FAIL — "Cannot find module '../validarSenha'"

- [ ] **Step 3: Implementar**

`src/utils/validarSenha.js`:

```js
export function validarSenha(s) {
  if (!s || s.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (!/[A-Z]/.test(s)) return 'A senha deve conter ao menos uma letra maiúscula.'
  if (!/[a-z]/.test(s)) return 'A senha deve conter ao menos uma letra minúscula.'
  if (!/[0-9]/.test(s)) return 'A senha deve conter ao menos um número.'
  return null
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- validarSenha`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add src/utils/validarSenha.js src/utils/__tests__/validarSenha.test.js
git commit -m "feat: util validarSenha com regra de senha forte (paridade site/backend)"
```

---

### Task 3: Util de datas de nascimento (TDD)

Limites do picker (18–120 anos) e conversões Date↔string.

**Files:**
- Create: `src/utils/datas.js`
- Test: `src/utils/__tests__/datas.test.js`

- [ ] **Step 1: Escrever teste que falha**

```js
import { limitesNascimento, dataParaISO, dataParaBR } from '../datas'

describe('limitesNascimento', () => {
  test('max é hoje menos 18 anos, min é hoje menos 120', () => {
    const hoje = new Date()
    const { min, max } = limitesNascimento()
    expect(max.getFullYear()).toBe(hoje.getFullYear() - 18)
    expect(max.getMonth()).toBe(hoje.getMonth())
    expect(min.getFullYear()).toBe(hoje.getFullYear() - 120)
  })
})

describe('conversões', () => {
  const d = new Date(1990, 4, 7) // 7 de maio de 1990 (mês 4 = maio)
  test('dataParaISO', () => {
    expect(dataParaISO(d)).toBe('1990-05-07')
  })
  test('dataParaBR', () => {
    expect(dataParaBR(d)).toBe('07/05/1990')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- datas`
Expected: FAIL — "Cannot find module '../datas'"

- [ ] **Step 3: Implementar**

`src/utils/datas.js`:

```js
export function limitesNascimento() {
  const hoje = new Date()
  return {
    min: new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate()),
    max: new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate()),
  }
}

const pad = (n) => String(n).padStart(2, '0')

export function dataParaISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dataParaBR(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- datas`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/utils/datas.js src/utils/__tests__/datas.test.js
git commit -m "feat: util de datas com limites de nascimento 18-120 anos"
```

---

### Task 4: Service OAuth — URLs e extração de code (TDD)

Valores de client_id/app_id são públicos por natureza (visíveis no bundle do site); o secret fica só no backend. Query string montada manualmente (não usar `URLSearchParams` — suporte incompleto no Hermes).

**Files:**
- Create: `src/services/oauth.js`
- Test: `src/services/__tests__/oauth.test.js`

- [ ] **Step 1: Escrever teste que falha**

```js
import { buildGoogleAuthUrl, buildFacebookAuthUrl, extrairCode } from '../oauth'

const RETURN_URL = 'exp://192.168.0.10:8081/--/oauth'

describe('buildGoogleAuthUrl', () => {
  const url = buildGoogleAuthUrl(RETURN_URL)
  test('aponta pro endpoint do Google com client_id e redirect do site', () => {
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth?')
    expect(url).toContain('client_id=465037215980-thmlbjcja9f3eob73b305kfv3q0a8om1.apps.googleusercontent.com')
    expect(url).toContain(encodeURIComponent('https://clube-do-gole-frontend.onrender.com/auth/google/callback'))
    expect(url).toContain('response_type=code')
  })
  test('inclui state mobile com returnUrl embutido', () => {
    expect(url).toContain(`state=${encodeURIComponent('mobile|' + RETURN_URL)}`)
  })
})

describe('buildFacebookAuthUrl', () => {
  const url = buildFacebookAuthUrl(RETURN_URL)
  test('aponta pro dialog do Facebook com app_id e redirect do site', () => {
    expect(url).toContain('https://www.facebook.com/v19.0/dialog/oauth?')
    expect(url).toContain('client_id=1400421088511853')
    expect(url).toContain(encodeURIComponent('https://clube-do-gole-frontend.onrender.com/auth/facebook/callback'))
    expect(url).toContain(`state=${encodeURIComponent('mobile|' + RETURN_URL)}`)
  })
})

describe('extrairCode', () => {
  test('extrai code de URL de retorno', () => {
    expect(extrairCode('exp://192.168.0.10:8081/--/oauth?code=abc123&provider=google')).toBe('abc123')
  })
  test('decodifica code percent-encoded', () => {
    expect(extrairCode('exp://x/--/oauth?code=4%2F0AbC')).toBe('4/0AbC')
  })
  test('retorna null sem code', () => {
    expect(extrairCode('exp://x/--/oauth?error=access_denied')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- oauth`
Expected: FAIL — "Cannot find module '../oauth'"

- [ ] **Step 3: Implementar**

`src/services/oauth.js`:

```js
// IDs públicos (mesmos do site — visíveis em qualquer bundle web). O secret fica só no backend.
const GOOGLE_CLIENT_ID = '465037215980-thmlbjcja9f3eob73b305kfv3q0a8om1.apps.googleusercontent.com'
const GOOGLE_REDIRECT_URI = 'https://clube-do-gole-frontend.onrender.com/auth/google/callback'
const FACEBOOK_APP_ID = '1400421088511853'
const FACEBOOK_REDIRECT_URI = 'https://clube-do-gole-frontend.onrender.com/auth/facebook/callback'

// Monta query manualmente: URLSearchParams tem suporte incompleto no Hermes.
function query(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
}

// O state "mobile|<returnUrl>" faz o OAuthCallback.vue do site devolver o code pro app
// em vez de processar o login no navegador.
export function buildGoogleAuthUrl(returnUrl) {
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + query({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: `mobile|${returnUrl}`,
  })
}

export function buildFacebookAuthUrl(returnUrl) {
  return 'https://www.facebook.com/v19.0/dialog/oauth?' + query({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    response_type: 'code',
    scope: 'email,public_profile',
    state: `mobile|${returnUrl}`,
  })
}

export function extrairCode(url) {
  const m = /[?&]code=([^&#]+)/.exec(url || '')
  return m ? decodeURIComponent(m[1]) : null
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- oauth`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add src/services/oauth.js src/services/__tests__/oauth.test.js
git commit -m "feat: service oauth com URLs Google/Facebook e state mobile"
```

---

### Task 5: Dependências nativas + scheme

**Files:**
- Modify: `package.json`, `app.json`

- [ ] **Step 1: Instalar com expo install (resolve versões do SDK 54)**

Run: `npx expo install expo-web-browser expo-linking @react-native-community/datetimepicker`
Expected: instala versões compatíveis com SDK 54 (expo-web-browser ~15.x, expo-linking ~8.x, datetimepicker 8.x) sem warnings.

- [ ] **Step 2: Adicionar scheme no app.json (futuro build standalone; inócuo no Expo Go)**

Em `app.json`, dentro de `"expo"`, adicionar:

```json
"scheme": "clubedogole",
```

- [ ] **Step 3: Verificar que o Metro sobe**

Run: `npx expo start -c` (deixar subir, Ctrl+C depois)
Expected: Metro inicia sem erro de resolução de módulo.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: adiciona expo-web-browser, expo-linking, datetimepicker e scheme"
```

---

### Task 6: AuthContext.loginOAuth

**Files:**
- Modify: `src/context/AuthContext.js`

- [ ] **Step 1: Adicionar método loginOAuth**

Em `src/context/AuthContext.js`, depois da função `login` e antes de `cadastro`, adicionar:

```js
  async function loginOAuth(code, provider) {
    const { data } = await api.post('/auth/oauth/callback', { code, provider, guest_carrinho: [] })
    const token = data.access_token || data.token
    await AsyncStorage.setItem('token', token)
    const me = await api.get('/auth/me')
    setUser(me.data)
    return me.data
  }
```

E no Provider, expor:

```js
    <AuthContext.Provider value={{ user, loading, login, loginOAuth, cadastro, logout }}>
```

- [ ] **Step 2: Rodar testes existentes (regressão)**

Run: `npm test`
Expected: todos passam (utils não tocados).

- [ ] **Step 3: Commit**

```bash
git add src/context/AuthContext.js
git commit -m "feat: loginOAuth no AuthContext usando /auth/oauth/callback"
```

---

### Task 7: Ponte mobile no site — OAuthCallback.vue (REPO DO SITE)

⚠️ Este task é no repo do **site** (`site\Clube_do_gole`, branch `main`). Push dispara deploy automático no Render — necessário antes do teste ponta a ponta do Task 11.

Quando o OAuth redireciona com `state=mobile|<returnUrl>`, a página devolve o `code` pro app em vez de logar no navegador.

**Files:**
- Modify: `frontend/src/views/OAuthCallback.vue` (bloco `onMounted`)

- [ ] **Step 1: Alterar onMounted**

Substituir o bloco `onMounted` atual por:

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

- [ ] **Step 2: Verificar que o fluxo web não regrediu (sem state, comportamento idêntico)**

Conferir por leitura: sem `state` mobile, o código cai direto no fluxo original. Login social pelo site continua igual.

- [ ] **Step 3: Commit e push (deploy automático)**

```bash
git add frontend/src/views/OAuthCallback.vue
git commit -m "feat: ponte OAuth mobile — devolve code pro app via state mobile|returnUrl"
git push origin main
```

---

### Task 8: LoginScreen — validação de senha em tempo real

**Files:**
- Modify: `src/screens/LoginScreen.js`

- [ ] **Step 1: Importar util e criar erro derivado**

No topo do arquivo:

```js
import { validarSenha } from '../utils/validarSenha'
```

Dentro do componente, após os `useState`:

```js
  const erroSenhaCad = senhaCad ? validarSenha(senhaCad) : null
```

- [ ] **Step 2: Feedback visual no campo de senha do cadastro**

Substituir o `Campo label="Senha"` do modo cadastro por:

```jsx
              <Campo label="Senha">
                <TextInput
                  style={styles.input}
                  placeholder="8+ caracteres, com maiúscula, minúscula e número"
                  placeholderTextColor={colors.textoTerciario}
                  value={senhaCad}
                  onChangeText={setSenhaCad}
                  secureTextEntry
                />
                {erroSenhaCad ? <Text style={styles.erroCampo}>{erroSenhaCad}</Text> : null}
              </Campo>
```

E no `StyleSheet.create` do final do arquivo, adicionar:

```js
  erroCampo: { color: colors.erro, fontSize: 12, marginTop: 6 },
```

- [ ] **Step 3: Bloquear submit com senha fraca**

Na função `criar()`, logo após a checagem de campos vazios, adicionar:

```js
    const erroSenha = validarSenha(senhaCad)
    if (erroSenha) { Alert.alert('Atenção', erroSenha); return }
```

- [ ] **Step 4: Verificação manual**

Run: `npx expo start` → abrir no Expo Go → Perfil → Entrar/Cadastrar → Criar conta.
Expected: digitar "abc" mostra erro vermelho em tempo real; submit com senha fraca mostra alert; senha "Teste123" não mostra erro.

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.js
git commit -m "feat: validacao de senha forte em tempo real no cadastro"
```

---

### Task 9: LoginScreen — DateTimePicker de nascimento (18–120 por design)

**Files:**
- Modify: `src/screens/LoginScreen.js`

- [ ] **Step 1: Imports e estado**

Adicionar imports:

```js
import DateTimePicker from '@react-native-community/datetimepicker'
import { limitesNascimento, dataParaISO, dataParaBR } from '../utils/datas'
```

Substituir o estado `dataNasc` (string) por:

```js
  const [dataNasc, setDataNasc] = useState(null) // Date | null
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const limites = limitesNascimento()
```

Remover as funções `formatarData` e `dataParaApi` do topo do arquivo (substituídas pelos utils).

- [ ] **Step 2: Trocar o input de texto pelo picker**

Substituir o `Campo label="Data de nascimento"` por:

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

- [ ] **Step 3: Ajustar validação e payload no criar()**

Na função `criar()`:
- Trocar a checagem `if (dataNasc.replace(...)...)` por: `if (!dataNasc) { Alert.alert('Atenção', 'Selecione sua data de nascimento.'); return }`
- A checagem de campos vazios deixa de incluir `!dataNasc` na primeira condição (já coberta acima) — ajustar para: `if (!nome || !sobrenome || !cpf || !telefone || !emailCad || !senhaCad)`.
- No payload do `cadastro`, trocar `data_nascimento: dataParaApi(dataNasc)` por `data_nascimento: dataParaISO(dataNasc)`.

- [ ] **Step 4: Verificação manual**

Expected no Expo Go: tocar no campo abre o picker; impossível rolar pra data com menos de 18 anos (máximo é hoje−18); data aparece formatada DD/MM/AAAA.

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.js
git commit -m "feat: picker nativo de nascimento com limite 18-120 anos por design"
```

---

### Task 10: LoginScreen — modo "esqueci minha senha"

**Files:**
- Modify: `src/screens/LoginScreen.js`

- [ ] **Step 1: Importar api e estados**

```js
import api from '../services/api'
```

Estados novos (o `modo` existente ganha um terceiro valor `'esqueci'`):

```js
  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [linkEnviado, setLinkEnviado] = useState(false)
```

- [ ] **Step 2: Função de envio**

```js
  async function enviarLinkRecuperacao() {
    if (!emailRecuperacao.trim()) { Alert.alert('Atenção', 'Informe o email.'); return }
    setLoading(true)
    try {
      await api.post('/auth/esqueceu-senha', { email: emailRecuperacao.trim() })
      setLinkEnviado(true)
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar. Tente novamente.')
    } finally { setLoading(false) }
  }
```

- [ ] **Step 3: UI do modo esqueci**

No JSX, adicionar um terceiro ramo. Estrutura do ternário vira:

```jsx
          {modo === 'esqueci' ? (
            linkEnviado ? (
              <>
                <Text style={styles.sucessoTexto}>
                  Se este email estiver cadastrado, você receberá um link de recuperação.{'\n\n'}
                  O link abre no navegador do celular para criar a nova senha.
                </Text>
                <BotaoGold titulo="Voltar ao login" onPress={() => { setModo('login'); setLinkEnviado(false) }} />
              </>
            ) : (
              <>
                <Campo label="E-mail cadastrado">
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textoTerciario}
                    value={emailRecuperacao}
                    onChangeText={setEmailRecuperacao}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </Campo>
                <BotaoGold titulo="Enviar link" onPress={enviarLinkRecuperacao} loading={loading} />
              </>
            )
          ) : modo === 'login' ? (
            /* ...bloco login existente... */
          ) : (
            /* ...bloco cadastro existente... */
          )}
```

Título/subtítulo do header do card também respeitam o modo:

```jsx
            <Text style={styles.titulo}>
              {modo === 'login' ? 'Bem-vindo de volta' : modo === 'esqueci' ? 'Recuperar senha' : 'Criar conta'}
            </Text>
            <Text style={styles.sub}>
              {modo === 'login'
                ? 'Acesse sua conta para acompanhar sua assinatura.'
                : modo === 'esqueci'
                  ? 'Informe seu email e enviaremos um link de recuperação.'
                  : 'Torne-se membro e descubra experiências exclusivas.'}
            </Text>
```

Link de entrada no modo login, logo abaixo do `BotaoGold` de Entrar:

```jsx
              <TouchableOpacity onPress={() => setModo('esqueci')} style={{ marginTop: spacing.sm }}>
                <Text style={styles.esqueciLink}>Esqueceu sua senha?</Text>
              </TouchableOpacity>
```

Estilos novos:

```js
  esqueciLink: { color: colors.dourado, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  sucessoTexto: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginBottom: spacing.md },
```

O toggle login↔cadastro existente no rodapé continua igual (só alterna entre 'login' e 'cadastro').

- [ ] **Step 4: Verificação manual**

Expected: "Esqueceu sua senha?" abre o modo; enviar mostra mensagem neutra; "Voltar ao login" retorna.
(Nota: email real só chega quando a migração pra Brevo acontecer no backend — a tela deve funcionar mesmo assim, resposta 200.)

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.js
git commit -m "feat: modo esqueci-senha no LoginScreen"
```

---

### Task 11: LoginScreen — botões OAuth Google/Facebook

**Files:**
- Modify: `src/screens/LoginScreen.js`

- [ ] **Step 1: Imports**

```js
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { buildGoogleAuthUrl, buildFacebookAuthUrl, extrairCode } from '../services/oauth'
```

E pegar `loginOAuth` do contexto: `const { login, cadastro, loginOAuth } = useAuth()`

- [ ] **Step 2: Função de fluxo**

```js
  async function entrarSocial(provider) {
    const returnUrl = Linking.createURL('oauth')
    const authUrl = provider === 'google' ? buildGoogleAuthUrl(returnUrl) : buildFacebookAuthUrl(returnUrl)
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl)
      if (result.type !== 'success') return // usuário cancelou — sem alert
      const code = extrairCode(result.url)
      if (!code) return
      setLoading(true)
      await loginOAuth(code, provider)
      navigation.goBack()
    } catch (e) {
      const msg = e?.response?.data?.detail
      Alert.alert('Erro', String(msg || 'Não foi possível entrar. Tente novamente.'))
    } finally { setLoading(false) }
  }
```

- [ ] **Step 3: UI — divisor "ou" + botões, no modo login, após o link "Esqueceu sua senha?"**

```jsx
              <View style={styles.ouRow}>
                <View style={styles.ouLinha} />
                <Text style={styles.ouTexto}>ou</Text>
                <View style={styles.ouLinha} />
              </View>
              <TouchableOpacity style={styles.socialBtn} onPress={() => entrarSocial('google')} disabled={loading}>
                <Text style={styles.socialBtnText}>Entrar com Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => entrarSocial('facebook')} disabled={loading}>
                <Text style={styles.socialBtnText}>Entrar com Facebook</Text>
              </TouchableOpacity>
```

Estilos:

```js
  ouRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: spacing.md },
  ouLinha: { flex: 1, height: 1, backgroundColor: colors.bordaCard },
  ouTexto: { color: colors.textoTerciario, fontSize: 12 },
  socialBtn: {
    borderWidth: 1, borderColor: colors.bordaCard, borderRadius: radius.pill,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.xs,
    backgroundColor: colors.fundoCard,
  },
  socialBtnText: { color: colors.texto, fontSize: 15, fontWeight: '600' },
```

- [ ] **Step 4: Verificação manual ponta a ponta (exige Task 7 deployado)**

Expected no Expo Go (iPhone): tocar "Entrar com Google" → browser in-app abre → escolher conta → browser fecha sozinho → Perfil aparece logado. Fechar o browser no meio → volta pro login sem alert. Repetir com Facebook.

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.js
git commit -m "feat: login social Google/Facebook via openAuthSessionAsync + ponte do site"
```

---

### Task 12: AgeGate no primeiro launch

**Files:**
- Create: `src/components/AgeGate.js`
- Modify: `App.js`

- [ ] **Step 1: Criar componente**

`src/components/AgeGate.js`:

```jsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, spacing, radius } from '../theme'

export default function AgeGate({ onConfirmar }) {
  const [recusado, setRecusado] = useState(false)

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>● CLUBE DO GOLE</Text>
        </View>
        {recusado ? (
          <>
            <Text style={styles.titulo}>Conteúdo para maiores de 18 anos</Text>
            <Text style={styles.sub}>
              Este aplicativo contém conteúdo sobre bebidas alcoólicas e é destinado apenas a maiores de idade.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.titulo}>Você é maior de 18 anos?</Text>
            <Text style={styles.sub}>
              Este aplicativo contém conteúdo sobre bebidas alcoólicas e é destinado apenas a maiores de idade.
            </Text>
            <View style={styles.botoes}>
              <TouchableOpacity style={{ flex: 1 }} onPress={onConfirmar} activeOpacity={0.85}>
                <LinearGradient colors={gradients.dourado} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnSim}>
                  <Text style={styles.btnSimText}>Sim</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnNao} onPress={() => setRecusado(true)}>
                <Text style={styles.btnNaoText}>Não</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#0d0d0d',
    alignItems: 'center', justifyContent: 'center', padding: spacing.md,
  },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: '#141311',
    borderWidth: 1, borderColor: colors.dourado, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  chip: {
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.md,
  },
  chipText: { color: colors.dourado, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  titulo: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub: { color: '#aaaaaa', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  botoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
  btnSim: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  btnSimText: { color: '#0d0d0d', fontWeight: '700', fontSize: 15 },
  btnNao: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.dourado,
  },
  btnNaoText: { color: colors.dourado, fontWeight: '700', fontSize: 15 },
})
```

- [ ] **Step 2: Integrar no App.js**

Imports novos:

```js
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AgeGate from './src/components/AgeGate'
```

Substituir o corpo do `export default function App()`:

```jsx
export default function App() {
  const [idadeVerificada, setIdadeVerificada] = useState(null) // null = carregando

  useEffect(() => {
    AsyncStorage.getItem('age_verified').then(v => setIdadeVerificada(v === 'true'))
  }, [])

  if (idadeVerificada === null) return null

  if (!idadeVerificada) {
    return (
      <AgeGate onConfirmar={async () => {
        await AsyncStorage.setItem('age_verified', 'true')
        setIdadeVerificada(true)
      }} />
    )
  }

  return (
    <AuthProvider>
      <NavigationContainer theme={tema}>
        <StatusBar style="dark" />
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              presentation: 'modal',
              title: 'Entrar',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}
```

- [ ] **Step 3: Verificação manual**

Expected: primeiro launch mostra AgeGate escuro; "Sim" entra no app e não pergunta de novo (mesmo matando o app); "Não" mostra tela de bloqueio permanente.

- [ ] **Step 4: Commit**

```bash
git add src/components/AgeGate.js App.js
git commit -m "feat: AgeGate 18+ no primeiro launch com persistencia em AsyncStorage"
```

---

### Task 13: Verificação final (critérios de aceite da spec)

- [ ] **Step 1: Rodar suite completa**

Run: `npm test`
Expected: todos os testes de utils passam.

- [ ] **Step 2: Checklist manual no Expo Go (iPhone)**

1. Cadastro rejeita senha fraca em tempo real e no submit ✓
2. Picker não permite <18 nem >120 anos ✓
3. Esqueci-senha envia e mostra confirmação neutra ✓
4. Google: browser abre, autoriza, volta logado ✓
5. Facebook: idem ✓
6. AgeGate só no primeiro launch, persiste ✓
7. Tudo no Expo Go SDK 54, sem ejetar ✓

- [ ] **Step 3: Push final do repo mobile**

```bash
git push origin master
```
