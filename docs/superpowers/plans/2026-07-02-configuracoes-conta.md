# Configurações/Conta Completo (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paridade de "Minha Conta" com o site: editar perfil (com CPF trava-após-preencher), CRUD de endereços, trocar senha, e histórico de pedidos detalhado com status colorido.

**Architecture:** Quatro telas novas em `Stack.Navigator` (mesmo padrão de `Carrinho`/`Checkout`/`EnderecoForm`), acessadas a partir de uma seção nova em `PerfilScreen`. `EnderecosScreen` reaproveita `EnderecoFormScreen` já existente (sub-projeto 2) pra criar/editar. Sem estado global novo.

**Tech Stack:** Expo SDK 54 (PINADO), React Navigation (Stack), reaproveita `@react-native-community/datetimepicker` (já instalado) e `src/utils/datas.js`/`src/utils/validarSenha.js` (já existentes).

**Repo:** `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile` (branch `master`) — todas as tasks.

---

### Task 1: EditarPerfilScreen (tela nova)

**Files:**
- Create: `src/screens/EditarPerfilScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import api from '../services/api'
import { limitesNascimento, dataParaISO, dataParaBR } from '../utils/datas'

export default function EditarPerfilScreen({ navigation }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNasc, setDataNasc] = useState(null)
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cpfOriginal, setCpfOriginal] = useState('')

  const limites = limitesNascimento()

  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [])
  )

  async function carregar() {
    setCarregando(true)
    try {
      const { data } = await api.get('/configuracoes/perfil')
      const u = data.usuario || {}
      setNome(u.nome || '')
      setSobrenome(u.sobrenome || '')
      setEmail(u.email || '')
      setTelefone(u.telefone || '')
      setDataNasc(u.data_nascimento ? new Date(u.data_nascimento) : null)
      setCpf(u.cpf || '')
      setCpfOriginal(u.cpf || '')
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus dados.')
    } finally {
      setCarregando(false)
    }
  }

  async function salvar() {
    if (!nome || !sobrenome || !email || !telefone) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        nome, sobrenome, email, telefone,
        data_nascimento: dataNasc ? dataParaISO(dataNasc) : null,
      }
      if (!cpfOriginal && cpf) {
        payload.cpf = cpf.replace(/\D/g, '')
      }
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

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.card, shadow.forte]}>
        <Campo label="Nome">
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Sobrenome">
          <TextInput style={styles.input} value={sobrenome} onChangeText={setSobrenome} placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="E-mail">
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Telefone">
          <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholderTextColor={colors.textoTerciario} />
        </Campo>
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
        <Campo label="CPF">
          {cpfOriginal ? (
            <>
              <View style={[styles.input, styles.inputTravado]}>
                <Text style={{ color: colors.textoSecundario, fontSize: 15 }}>{cpf}</Text>
              </View>
              <Text style={styles.dica}>Para alterar o CPF já cadastrado, contate o suporte.</Text>
            </>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.textoTerciario}
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              maxLength={14}
            />
          )}
        </Campo>
        <BotaoDourado title="Salvar alterações" onPress={salvar} loading={salvando} style={{ marginTop: spacing.md }} />
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
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
  inputTravado: { justifyContent: 'center', opacity: 0.7 },
  dica: { color: colors.textoTerciario, fontSize: 12, marginTop: 4 },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/EditarPerfilScreen.js
git commit -m "feat: tela de editar perfil com trava de CPF apos preenchido"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 2: EnderecosScreen (tela nova)

**Files:**
- Create: `src/screens/EnderecosScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, radius, shadow } from '../theme'
import api from '../services/api'

export default function EnderecosScreen({ navigation }) {
  const [enderecos, setEnderecos] = useState([])
  const [carregando, setCarregando] = useState(true)

  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [])
  )

  async function carregar() {
    setCarregando(true)
    try {
      const { data } = await api.get('/configuracoes/enderecos')
      setEnderecos(data || [])
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus endereços.')
    } finally {
      setCarregando(false)
    }
  }

  async function tornarPrincipal(id) {
    try {
      await api.patch(`/configuracoes/enderecos/${id}/principal`)
      carregar()
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível definir como principal.'))
    }
  }

  function confirmarExclusao(end) {
    Alert.alert('Excluir endereço', 'Tem certeza que deseja excluir este endereço?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => excluir(end.id) },
    ])
  }

  async function excluir(id) {
    try {
      await api.delete(`/configuracoes/enderecos/${id}`)
      carregar()
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível excluir.'))
    }
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {enderecos.length === 0 ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.textoVazio}>Nenhum endereço cadastrado ainda.</Text>
        </View>
      ) : (
        enderecos.map((end) => (
          <View key={end.id} style={[styles.card, shadow.card]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.enderecoTexto}>{end.endereco}, {end.numero}{end.complemento ? ` — ${end.complemento}` : ''}</Text>
              {end.principal && (
                <View style={styles.badgePrincipal}>
                  <Text style={styles.badgePrincipalTexto}>Principal</Text>
                </View>
              )}
            </View>
            <Text style={styles.enderecoSub}>{end.bairro} — {end.cidade}/{end.estado}</Text>
            <Text style={styles.enderecoSub}>CEP: {end.cep}</Text>
            <View style={styles.acoesRow}>
              <TouchableOpacity onPress={() => navigation.navigate('EnderecoForm', { endereco: end })}>
                <Text style={styles.linkAcao}>Editar</Text>
              </TouchableOpacity>
              {!end.principal && (
                <TouchableOpacity onPress={() => tornarPrincipal(end.id)}>
                  <Text style={styles.linkAcao}>Tornar principal</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => confirmarExclusao(end)}>
                <Text style={styles.linkExcluir}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.addCard, shadow.card]}
        onPress={() => navigation.navigate('EnderecoForm')}
      >
        <Text style={styles.addTexto}>+ Adicionar novo endereço</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  textoVazio: { color: colors.textoSecundario, fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  enderecoTexto: { color: colors.texto, fontSize: 15, fontWeight: '600', flex: 1 },
  enderecoSub: { color: colors.textoSecundario, fontSize: 13, marginTop: 2 },
  badgePrincipal: { backgroundColor: colors.dourado, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgePrincipalTexto: { color: '#1b1a19', fontSize: 11, fontWeight: '700' },
  acoesRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  linkAcao: { color: colors.dourado, fontSize: 13, fontWeight: '600' },
  linkExcluir: { color: colors.erro, fontSize: 13, fontWeight: '600' },
  addCard: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.bordaCard,
    borderStyle: 'dashed', alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.xl,
  },
  addTexto: { color: colors.dourado, fontWeight: '700', fontSize: 14 },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/EnderecosScreen.js
git commit -m "feat: tela de listagem de enderecos com editar/excluir/tornar principal"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 3: SegurancaScreen (tela nova — trocar senha)

**Files:**
- Create: `src/screens/SegurancaScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import api from '../services/api'
import { validarSenha } from '../utils/validarSenha'

export default function SegurancaScreen() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)

  const erroNovaSenha = novaSenha ? validarSenha(novaSenha) : null

  async function trocarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    if (erroNovaSenha) {
      Alert.alert('Atenção', erroNovaSenha)
      return
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.')
      return
    }
    setSalvando(true)
    try {
      await api.put('/configuracoes/senha', { senha_atual: senhaAtual, nova_senha: novaSenha })
      Alert.alert('Sucesso', 'Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível alterar a senha.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.card, shadow.forte]}>
        <Campo label="Senha atual">
          <TextInput
            style={styles.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            placeholderTextColor={colors.textoTerciario}
          />
        </Campo>
        <Campo label="Nova senha">
          <TextInput
            style={styles.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
            placeholder="8+ caracteres, com maiúscula, minúscula e número"
            placeholderTextColor={colors.textoTerciario}
          />
          {erroNovaSenha ? <Text style={styles.erroCampo}>{erroNovaSenha}</Text> : null}
        </Campo>
        <Campo label="Confirmar nova senha">
          <TextInput
            style={styles.input}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            placeholderTextColor={colors.textoTerciario}
          />
        </Campo>
        <BotaoDourado title="Alterar senha" onPress={trocarSenha} loading={salvando} style={{ marginTop: spacing.md }} />
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
  erroCampo: { color: colors.erro, fontSize: 12, marginTop: 6 },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/SegurancaScreen.js
git commit -m "feat: tela de troca de senha com validacao forte em tempo real"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 4: MeusPedidosScreen (tela nova)

**Files:**
- Create: `src/screens/MeusPedidosScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, radius, shadow } from '../theme'
import api from '../services/api'
import { formatarMoeda } from '../utils/format'

const STATUS_INFO = {
  pago: { label: 'Pago', cor: '#4CAF50', fundo: 'rgba(76,175,80,0.15)' },
  pendente: { label: 'Pendente', cor: '#B7791F', fundo: 'rgba(255,193,7,0.18)' },
  cancelado: { label: 'Cancelado', cor: '#f44336', fundo: 'rgba(244,67,54,0.15)' },
  estornado: { label: 'Estornado', cor: '#2196F3', fundo: 'rgba(33,150,243,0.15)' },
}

export default function MeusPedidosScreen() {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(null)

  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [])
  )

  async function carregar() {
    setCarregando(true)
    try {
      const { data } = await api.get('/configuracoes/perfil')
      setPedidos(data.pedidos || [])
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus pedidos.')
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {pedidos.length === 0 ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.textoVazio}>Nenhum pedido por aqui ainda.</Text>
        </View>
      ) : (
        pedidos.map((p) => {
          const info = STATUS_INFO[p.status] || { label: p.status || '—', cor: colors.textoSecundario, fundo: colors.fundoCard }
          const expandido = aberto === p.id
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, shadow.card]}
              onPress={() => setAberto(expandido ? null : p.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitulo}>Pedido #{p.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: info.fundo }]}>
                  <Text style={[styles.statusText, { color: info.cor }]}>{info.label}</Text>
                </View>
              </View>
              <Text style={styles.cardPreco}>{formatarMoeda(p.valor_total)}</Text>

              {expandido && (
                <View style={styles.detalhes}>
                  {(p.itens || []).map((item, i) => (
                    <View key={i} style={styles.itemLinha}>
                      <Text style={styles.itemTexto}>{item.nome_produto} ({item.plano}) x{item.quantidade}</Text>
                      <Text style={styles.itemPreco}>{formatarMoeda(item.valor_total)}</Text>
                    </View>
                  ))}
                  {p.cupom_aplicado && (
                    <Text style={styles.cupomTexto}>
                      Cupom "{p.cupom_aplicado}" — economia de {formatarMoeda(p.economia)}
                    </Text>
                  )}
                </View>
              )}
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
  textoVazio: { color: colors.textoSecundario, fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { color: colors.texto, fontSize: 16, fontWeight: '600' },
  cardPreco: { color: colors.dourado, fontSize: 15, fontWeight: '700', marginTop: 4 },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  detalhes: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.bordaCard, paddingTop: spacing.sm, gap: 6 },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTexto: { color: colors.textoSecundario, fontSize: 13, flex: 1, marginRight: spacing.sm },
  itemPreco: { color: colors.texto, fontSize: 13, fontWeight: '600' },
  cupomTexto: { color: colors.sucesso, fontSize: 12, marginTop: 4 },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/MeusPedidosScreen.js
git commit -m "feat: tela de pedidos detalhada com status colorido e itens expansiveis"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 5: Ligar navegação + atualizar PerfilScreen

**Files:**
- Modify: `App.js`
- Modify: `src/screens/PerfilScreen.js`

- [ ] **Step 1: Adicionar telas no Stack.Navigator (App.js)**

Adicionar os imports:

```js
import EditarPerfilScreen from './src/screens/EditarPerfilScreen'
import EnderecosScreen from './src/screens/EnderecosScreen'
import SegurancaScreen from './src/screens/SegurancaScreen'
import MeusPedidosScreen from './src/screens/MeusPedidosScreen'
```

Adicionar 4 novos `Stack.Screen` como irmãos dos já existentes (`Tabs`, `Login`, `Carrinho`, `Checkout`, `EnderecoForm`), dentro do mesmo `<Stack.Navigator>`, sem tocar em nenhum dos existentes:

```jsx
          <Stack.Screen
            name="EditarPerfil"
            component={EditarPerfilScreen}
            options={{
              title: 'Editar perfil',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Enderecos"
            component={EnderecosScreen}
            options={{
              title: 'Meus endereços',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Seguranca"
            component={SegurancaScreen}
            options={{
              title: 'Segurança',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="MeusPedidos"
            component={MeusPedidosScreen}
            options={{
              title: 'Meus pedidos',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
```

- [ ] **Step 2: Atualizar `PerfilScreen.js`**

Substituir o conteúdo do arquivo inteiro por:

```jsx
import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function PerfilScreen({ navigation }) {
  const { user, logout } = useAuth()
  const [assinaturas, setAssinaturas] = useState([])

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      api.get('/assinaturas/minhas').then(({ data }) => setAssinaturas(data || [])).catch(() => {})
    }, [user])
  )

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.titulo}>Seja membro 🥂</Text>
        <Text style={styles.sub}>Entre na sua conta para acompanhar sua assinatura e pedidos.</Text>
        <BotaoDourado
          title="Entrar / Cadastrar"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
        />
      </View>
    )
  }

  function confirmarSaida() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ])
  }

  const iniciais = [user.nome?.[0], user.sobrenome?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>

      {/* Avatar + dados */}
      <View style={[styles.perfilCard, shadow.forte]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>
        <Text style={styles.titulo}>{user.nome} {user.sobrenome}</Text>
        <Text style={styles.sub}>{user.email}</Text>
      </View>

      {/* Assinaturas */}
      <Text style={styles.secao}>Minhas assinaturas</Text>
      {assinaturas.length === 0 ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTexto}>Você ainda não tem uma assinatura ativa.</Text>
          <BotaoDourado
            title="Conhecer planos"
            onPress={() => navigation.navigate('Assinatura')}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : (
        assinaturas.map((a, i) => (
          <View key={i} style={[styles.card, shadow.card]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitulo}>Plano {a.plano || a.tipo_plano || '—'}</Text>
              <View style={[styles.statusBadge, a.status === 'ativa' && styles.statusAtivo]}>
                <Text style={styles.statusText}>{a.status || 'ativa'}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Configurações */}
      <Text style={styles.secao}>Configurações</Text>
      <View style={[styles.card, shadow.card, { paddingVertical: 0 }]}>
        <ItemMenu titulo="Editar perfil" onPress={() => navigation.navigate('EditarPerfil')} />
        <Divisor />
        <ItemMenu titulo="Meus endereços" onPress={() => navigation.navigate('Enderecos')} />
        <Divisor />
        <ItemMenu titulo="Segurança" onPress={() => navigation.navigate('Seguranca')} />
        <Divisor />
        <ItemMenu titulo="Meus pedidos" onPress={() => navigation.navigate('MeusPedidos')} ultimo />
      </View>

      <BotaoDourado
        title="Sair da conta"
        outline
        onPress={confirmarSaida}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />
    </ScrollView>
  )
}

function ItemMenu({ titulo, onPress, ultimo }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.itemMenu, ultimo && { marginBottom: 0 }]}>
      <Text style={styles.itemMenuTexto}>{titulo}</Text>
      <Text style={styles.itemMenuSeta}>→</Text>
    </TouchableOpacity>
  )
}

function Divisor() {
  return <View style={styles.divisor} />
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.fundo },
  perfilCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.bordaCard, alignItems: 'center', marginBottom: spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.dourado,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: '#1b1a19', fontSize: 22, fontWeight: '700' },
  titulo: { color: colors.texto, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textoSecundario, fontSize: 14, marginTop: 4 },
  secao: { color: colors.texto, fontSize: 18, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { color: colors.texto, fontSize: 16, fontWeight: '600' },
  cardTexto: { color: colors.textoSecundario, fontSize: 14, marginTop: 4 },
  statusBadge: {
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: colors.fundoCard,
  },
  statusAtivo: { backgroundColor: '#e6f4ed' },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.sucesso },
  itemMenu: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md,
  },
  itemMenuTexto: { color: colors.texto, fontSize: 15, fontWeight: '500' },
  itemMenuSeta: { color: colors.dourado, fontSize: 16, fontWeight: '700' },
  divisor: { height: 1, backgroundColor: colors.bordaCard },
})
```

- [ ] **Step 3: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 4: Commit**

```bash
git add App.js src/screens/PerfilScreen.js
git commit -m "feat: liga telas de conta na navegacao e adiciona secao Configuracoes no Perfil"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 6: Verificação final

- [ ] **Step 1: Rodar suite completa**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 2: Checklist manual no Expo Go (pendente — só o usuário pode fazer)**

1. Perfil → "Editar perfil" → editar nome/telefone/data nascimento, salvar → volta e reflete mudança
2. Perfil → "Editar perfil" com CPF vazio → preencher → salvar → campo trava (some o input, aparece texto travado)
3. Perfil → "Meus endereços" → editar um existente, adicionar novo, tornar principal, excluir
4. Perfil → "Segurança" → trocar senha (testar senha atual errada, senha fraca, senhas não coincidem, sucesso)
5. Perfil → "Meus pedidos" → ver lista com status colorido, expandir pra ver itens

- [ ] **Step 3: Push**

```bash
git push origin master
```
