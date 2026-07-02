# Checkout Completo (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paridade de checkout com o site: carrinho revisável, seleção/cadastro de endereço com CEP automático, gate de CPF, cupom, resumo com desconto, e finalização via Mercado Pago (ou modo dev) — tudo no Expo Go SDK 54.

**Architecture:** Sem estado global novo — cada tela busca dados via `api` direto (mesmo padrão de `AssinaturaScreen`/`PerfilScreen`). Fluxo: `AssinaturaScreen` (assinar) → adiciona ao carrinho → `CarrinhoScreen` (revisar/selecionar) → `CheckoutScreen` (endereço + CPF + cupom + resumo) → `EnderecoFormScreen` (modal, CEP automático via viaCEP) quando precisa cadastrar endereço novo.

**Tech Stack:** Expo SDK 54 (PINADO — nunca subir de versão), React Navigation (Stack), `expo-linking` (já instalado) para abrir URL do Mercado Pago, viaCEP (fetch público, sem dependência nova).

**Repo:** `C:\Users\Guilherme Silva\Desktop\Projetos\Clube_do_gole\mobile` (branch `master`) — todas as tasks.

---

### Task 1: Util CEP (TDD)

**Files:**
- Create: `src/utils/cep.js`
- Test: `src/utils/__tests__/cep.test.js`

- [ ] **Step 1: Escrever teste que falha**

```js
import { formatarCEP, buscarCEP } from '../cep'

describe('formatarCEP', () => {
  test('formata com hifen depois de 5 digitos', () => {
    expect(formatarCEP('87013000')).toBe('87013-000')
  })
  test('nao adiciona hifen antes de 5 digitos', () => {
    expect(formatarCEP('8701')).toBe('8701')
  })
  test('ignora caracteres nao numericos e limita a 8 digitos', () => {
    expect(formatarCEP('87.013-000extra')).toBe('87013-000')
  })
})

describe('buscarCEP', () => {
  afterEach(() => {
    global.fetch = undefined
  })

  test('retorna endereco em caso de sucesso', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({
        logradouro: 'Rua Tal', bairro: 'Centro', localidade: 'Maringá', uf: 'PR',
      }),
    })
    const r = await buscarCEP('87013-000')
    expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/87013000/json/')
    expect(r).toEqual({ endereco: 'Rua Tal', bairro: 'Centro', cidade: 'Maringá', estado: 'PR' })
  })

  test('retorna null quando CEP nao existe (viaCEP retorna erro:true)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ erro: true }),
    })
    const r = await buscarCEP('00000000')
    expect(r).toBeNull()
  })

  test('retorna null sem chamar fetch se CEP incompleto', async () => {
    global.fetch = jest.fn()
    const r = await buscarCEP('123')
    expect(r).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- cep`
Expected: FAIL — "Cannot find module '../cep'"

- [ ] **Step 3: Implementar**

`src/utils/cep.js`:

```js
export function formatarCEP(text) {
  const nums = text.replace(/\D/g, '').slice(0, 8)
  if (nums.length <= 5) return nums
  return `${nums.slice(0, 5)}-${nums.slice(5)}`
}

export async function buscarCEP(cep) {
  const nums = cep.replace(/\D/g, '')
  if (nums.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`)
  const data = await res.json()
  if (data.erro) return null
  return {
    endereco: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- cep`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add src/utils/cep.js src/utils/__tests__/cep.test.js
git commit -m "feat: util de CEP (formatar + buscar via viaCEP)"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha do corpo do commit.

---

### Task 2: EnderecoFormScreen (tela nova, modal)

**Files:**
- Create: `src/screens/EnderecoFormScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import api from '../services/api'
import { formatarCEP, buscarCEP } from '../utils/cep'

export default function EnderecoFormScreen({ navigation, route }) {
  const endereco = route.params?.endereco ?? null
  const editando = !!endereco

  const [cep, setCep] = useState(endereco?.cep ?? '')
  const [logradouro, setLogradouro] = useState(endereco?.endereco ?? '')
  const [numero, setNumero] = useState(endereco?.numero ?? '')
  const [complemento, setComplemento] = useState(endereco?.complemento ?? '')
  const [bairro, setBairro] = useState(endereco?.bairro ?? '')
  const [cidade, setCidade] = useState(endereco?.cidade ?? '')
  const [estado, setEstado] = useState(endereco?.estado ?? '')
  const [principal, setPrincipal] = useState(endereco?.principal ?? false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function aoSairDoCep() {
    if (cep.replace(/\D/g, '').length !== 8) return
    setBuscandoCep(true)
    try {
      const dados = await buscarCEP(cep)
      if (!dados) {
        Alert.alert('CEP não encontrado', 'Verifique o CEP informado.')
        return
      }
      setLogradouro(dados.endereco || '')
      setBairro(dados.bairro || '')
      setCidade(dados.cidade || '')
      setEstado(dados.estado || '')
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP agora.')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function salvar() {
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.')
      return
    }
    setSalvando(true)
    const payload = {
      tipo: 'residencial',
      cep: cep.replace(/\D/g, ''),
      endereco: logradouro,
      numero,
      complemento: complemento || null,
      bairro,
      cidade,
      estado: estado.toUpperCase(),
      pais: 'Brasil',
      principal,
    }
    try {
      if (editando) {
        await api.put(`/configuracoes/enderecos/${endereco.id}`, payload)
      } else {
        await api.post('/configuracoes/enderecos', payload)
      }
      navigation.goBack()
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível salvar o endereço.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadow.forte]}>
          <Campo label="CEP">
            <TextInput
              style={styles.input}
              placeholder="00000-000"
              placeholderTextColor={colors.textoTerciario}
              value={cep}
              onChangeText={(t) => setCep(formatarCEP(t))}
              onBlur={aoSairDoCep}
              keyboardType="numeric"
              maxLength={9}
            />
            {buscandoCep ? <Text style={styles.dica}>Buscando endereço...</Text> : null}
          </Campo>
          <Campo label="Endereço">
            <TextInput style={styles.input} value={logradouro} onChangeText={setLogradouro} placeholderTextColor={colors.textoTerciario} placeholder="Rua, avenida..." />
          </Campo>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Campo label="Número">
                <TextInput style={styles.input} value={numero} onChangeText={setNumero} keyboardType="numeric" placeholderTextColor={colors.textoTerciario} placeholder="123" />
              </Campo>
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Campo label="Complemento">
                <TextInput style={styles.input} value={complemento} onChangeText={setComplemento} placeholderTextColor={colors.textoTerciario} placeholder="Apto, bloco..." />
              </Campo>
            </View>
          </View>
          <Campo label="Bairro">
            <TextInput style={styles.input} value={bairro} onChangeText={setBairro} placeholderTextColor={colors.textoTerciario} />
          </Campo>
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Campo label="Cidade">
                <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholderTextColor={colors.textoTerciario} />
              </Campo>
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Campo label="UF">
                <TextInput style={styles.input} value={estado} onChangeText={(t) => setEstado(t.toUpperCase().slice(0, 2))} maxLength={2} autoCapitalize="characters" placeholderTextColor={colors.textoTerciario} />
              </Campo>
            </View>
          </View>
          <View style={styles.principalRow}>
            <Text style={styles.principalLabel}>Definir como endereço principal</Text>
            <Switch value={principal} onValueChange={setPrincipal} trackColor={{ true: colors.dourado }} />
          </View>
          <BotaoDourado title={editando ? 'Salvar alterações' : 'Adicionar endereço'} onPress={salvar} loading={salvando} style={{ marginTop: spacing.md }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: { padding: spacing.md, paddingVertical: spacing.lg },
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
  dica: { color: colors.textoTerciario, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row' },
  principalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs, marginBottom: spacing.xs,
  },
  principalLabel: { color: colors.texto, fontSize: 14 },
})
```

- [ ] **Step 2: Verificar sintaxe**

Run: `npm test`
Expected: 21 passed, 4 suites (regressão — este arquivo não tem teste próprio, é tela de UI; só confirma que nada quebrou)

- [ ] **Step 3: Commit**

```bash
git add src/screens/EnderecoFormScreen.js
git commit -m "feat: tela de cadastro/edicao de endereco com autofill de CEP"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 3: CarrinhoScreen (tela nova)

**Files:**
- Create: `src/screens/CarrinhoScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import api from '../services/api'
import { formatarMoeda } from '../utils/format'

export default function CarrinhoScreen({ navigation }) {
  const [itens, setItens] = useState([])
  const [selecionados, setSelecionados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [atualizandoId, setAtualizandoId] = useState(null)

  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [])
  )

  async function carregar() {
    setCarregando(true)
    try {
      const { data } = await api.get('/carrinho')
      setItens(data.itens || [])
      setSelecionados((data.itens || []).map(i => i.id))
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o carrinho.')
    } finally {
      setCarregando(false)
    }
  }

  function alternarSelecao(id) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function alterarQuantidade(item, delta) {
    const novaQtd = item.quantidade + delta
    if (novaQtd < 1) return
    setAtualizandoId(item.id)
    try {
      await api.post('/carrinho/quantidade', { item_id: item.id, quantidade: novaQtd })
      await carregar()
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a quantidade.')
    } finally {
      setAtualizandoId(null)
    }
  }

  const itensSelecionados = itens.filter(i => selecionados.includes(i.id))
  const subtotal = itensSelecionados.reduce((soma, i) => soma + Number(i.valor_total), 0)

  function irParaCheckout() {
    if (selecionados.length === 0) {
      Alert.alert('Atenção', 'Selecione ao menos um item para continuar.')
      return
    }
    navigation.navigate('Checkout', { itemIds: selecionados })
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
      <Text style={styles.titulo}>Seu carrinho</Text>

      {itens.length === 0 ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.textoVazio}>Seu carrinho está vazio.</Text>
        </View>
      ) : (
        itens.map((item) => {
          const selecionado = selecionados.includes(item.id)
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, shadow.card, selecionado && styles.cardSelecionado]}
              onPress={() => alternarSelecao(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.checkbox, selecionado && styles.checkboxAtivo]}>
                  {selecionado && <Text style={styles.checkboxMarca}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNome}>{item.nome_produto}</Text>
                  <Text style={styles.itemPlano}>{item.plano}</Text>
                </View>
                <Text style={styles.itemPreco}>{formatarMoeda(item.valor_total)}</Text>
              </View>

              <View style={styles.qtdRow}>
                <TouchableOpacity
                  style={styles.qtdBtn}
                  onPress={() => alterarQuantidade(item, -1)}
                  disabled={atualizandoId === item.id || item.quantidade <= 1}
                >
                  <Text style={styles.qtdBtnTexto}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtdValor}>{item.quantidade}</Text>
                <TouchableOpacity
                  style={styles.qtdBtn}
                  onPress={() => alterarQuantidade(item, 1)}
                  disabled={atualizandoId === item.id}
                >
                  <Text style={styles.qtdBtnTexto}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        })
      )}

      {itens.length > 0 && (
        <>
          <View style={[styles.resumoCard, shadow.forte]}>
            <View style={styles.resumoLinha}>
              <Text style={styles.resumoLabel}>Subtotal ({itensSelecionados.length} {itensSelecionados.length === 1 ? 'item' : 'itens'})</Text>
              <Text style={styles.resumoValor}>{formatarMoeda(subtotal)}</Text>
            </View>
          </View>
          <BotaoDourado title="Finalizar Compra" onPress={irParaCheckout} style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  textoVazio: { color: colors.textoSecundario, fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardSelecionado: { borderColor: colors.dourado },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.bordaCard,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxAtivo: { backgroundColor: colors.dourado, borderColor: colors.dourado },
  checkboxMarca: { color: '#1b1a19', fontWeight: '700', fontSize: 13 },
  itemNome: { color: colors.texto, fontSize: 16, fontWeight: '600' },
  itemPlano: { color: colors.textoSecundario, fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  itemPreco: { color: colors.dourado, fontSize: 16, fontWeight: '700' },
  qtdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, alignSelf: 'flex-end' },
  qtdBtn: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.bordaCard,
    alignItems: 'center', justifyContent: 'center',
  },
  qtdBtnTexto: { color: colors.texto, fontSize: 16, fontWeight: '700' },
  qtdValor: { color: colors.texto, fontSize: 15, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  resumoCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginTop: spacing.sm,
  },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  resumoLabel: { color: colors.textoSecundario, fontSize: 14 },
  resumoValor: { color: colors.texto, fontSize: 16, fontWeight: '700' },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/CarrinhoScreen.js
git commit -m "feat: tela de carrinho com selecao multipla e ajuste de quantidade"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 4: CheckoutScreen (tela nova — a mais importante)

**Files:**
- Create: `src/screens/CheckoutScreen.js`

- [ ] **Step 1: Implementar**

```jsx
import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import api from '../services/api'
import { formatarMoeda } from '../utils/format'

export default function CheckoutScreen({ navigation, route }) {
  const itemIds = route.params?.itemIds ?? []

  const [carregando, setCarregando] = useState(true)
  const [itens, setItens] = useState([])
  const [enderecos, setEnderecos] = useState([])
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null)
  const [cpf, setCpf] = useState(null)
  const [cpfInput, setCpfInput] = useState('')
  const [salvandoCpf, setSalvandoCpf] = useState(false)
  const [perfilBase, setPerfilBase] = useState(null)

  const [cupom, setCupom] = useState('')
  const [descontoPct, setDescontoPct] = useState(0)
  const [descontoFixo, setDescontoFixo] = useState(0)
  const [cupomAplicado, setCupomAplicado] = useState(false)
  const [validandoCupom, setValidandoCupom] = useState(false)

  const [finalizando, setFinalizando] = useState(false)

  useFocusEffect(
    useCallback(() => {
      carregarTudo()
    }, [])
  )

  async function carregarTudo() {
    setCarregando(true)
    try {
      const [{ data: carrinho }, { data: perfilData }] = await Promise.all([
        api.get('/carrinho'),
        api.get('/configuracoes/perfil'),
      ])
      setItens((carrinho.itens || []).filter(i => itemIds.includes(i.id)))
      setEnderecos(perfilData.enderecos || [])
      const principal = (perfilData.enderecos || []).find(e => e.principal) || (perfilData.enderecos || [])[0] || null
      setEnderecoSelecionado(principal)
      setCpf(perfilData.usuario?.cpf || null)
      setPerfilBase(perfilData.usuario)
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados do checkout.')
    } finally {
      setCarregando(false)
    }
  }

  async function salvarCpf() {
    const digitos = cpfInput.replace(/\D/g, '')
    if (digitos.length !== 11) {
      Alert.alert('Atenção', 'Informe um CPF válido.')
      return
    }
    setSalvandoCpf(true)
    try {
      const { data } = await api.put('/configuracoes/perfil', {
        nome: perfilBase.nome,
        sobrenome: perfilBase.sobrenome,
        email: perfilBase.email,
        telefone: perfilBase.telefone,
        data_nascimento: perfilBase.data_nascimento || null,
        cpf: digitos,
      })
      setCpf(data.cpf)
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível salvar o CPF.'))
    } finally {
      setSalvandoCpf(false)
    }
  }

  async function aplicarCupom() {
    if (!cupom.trim()) return
    setValidandoCupom(true)
    try {
      const { data } = await api.post('/cupons/validar', { codigo: cupom.trim().toUpperCase() })
      if (!data.valido) {
        Alert.alert('Cupom inválido', data.mensagem || 'Não foi possível aplicar este cupom.')
        setDescontoPct(0)
        setDescontoFixo(0)
        setCupomAplicado(false)
        return
      }
      if (data.desconto_tipo === 'fixo') {
        setDescontoFixo(Number(data.desconto_fixo) || 0)
        setDescontoPct(0)
      } else {
        setDescontoPct(Number(data.desconto) || 0)
        setDescontoFixo(0)
      }
      setCupomAplicado(true)
    } catch {
      Alert.alert('Erro', 'Não foi possível validar o cupom agora.')
    } finally {
      setValidandoCupom(false)
    }
  }

  function removerCupom() {
    setCupom('')
    setDescontoPct(0)
    setDescontoFixo(0)
    setCupomAplicado(false)
  }

  const subtotal = itens.reduce((soma, i) => soma + Number(i.valor_total), 0)
  const desconto = descontoFixo > 0 ? Math.min(descontoFixo, subtotal) : subtotal * (descontoPct / 100)
  const totalFinal = Math.max(0, subtotal - desconto)

  async function finalizarCompra() {
    if (!cpf) {
      Alert.alert('Atenção', 'Cadastre seu CPF antes de finalizar.')
      return
    }
    if (!enderecoSelecionado) {
      Alert.alert('Atenção', 'Selecione um endereço de entrega.')
      return
    }
    setFinalizando(true)
    try {
      const { data } = await api.post('/carrinho/finalizar', {
        ids: itemIds,
        cupom: cupomAplicado ? cupom.trim().toUpperCase() : null,
        desconto_cupom: descontoPct,
        desconto_fixo_cupom: descontoFixo || null,
      })
      if (data.checkout_url) {
        await Linking.openURL(data.checkout_url)
        Alert.alert('Pagamento iniciado 🥂', 'Complete o pagamento no MercadoPago. Seu pedido será confirmado automaticamente.')
      } else {
        Alert.alert('Pedido confirmado! 🥂', 'Seu pedido foi registrado com sucesso.')
      }
      navigation.navigate('Tabs', { screen: 'Perfil' })
    } catch (e) {
      const detail = e?.response?.data?.detail
      const msg = Array.isArray(detail) ? detail.map(d => d.msg || d).join('\n') : (detail || 'Não foi possível finalizar. Tente novamente.')
      Alert.alert('Ops', String(msg))
    } finally {
      setFinalizando(false)
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
      <Text style={styles.titulo}>Finalizar compra</Text>

      <Text style={styles.secao}>Itens</Text>
      {itens.map((item) => (
        <View key={item.id} style={[styles.card, shadow.card]}>
          <View style={styles.linhaEntre}>
            <Text style={styles.itemNome}>{item.nome_produto} — {item.plano}</Text>
            <Text style={styles.itemPreco}>{formatarMoeda(item.valor_total)}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.secao}>Endereço de entrega</Text>
      {enderecos.length === 0 ? (
        <Text style={styles.aviso}>Nenhum endereço cadastrado.</Text>
      ) : (
        enderecos.map((end) => (
          <TouchableOpacity
            key={end.id}
            style={[styles.card, shadow.card, enderecoSelecionado?.id === end.id && styles.cardSelecionado]}
            onPress={() => setEnderecoSelecionado(end)}
            activeOpacity={0.85}
          >
            <Text style={styles.enderecoTexto}>{end.endereco}, {end.numero}{end.complemento ? ` — ${end.complemento}` : ''}</Text>
            <Text style={styles.enderecoSub}>{end.bairro} — {end.cidade}/{end.estado}</Text>
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity onPress={() => navigation.navigate('EnderecoForm')} style={{ marginBottom: spacing.sm }}>
        <Text style={styles.linkDourado}>+ Adicionar novo endereço</Text>
      </TouchableOpacity>

      {!cpf && (
        <>
          <Text style={styles.secao}>CPF necessário</Text>
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.aviso}>Cadastre seu CPF para continuar com a compra.</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.textoTerciario}
              value={cpfInput}
              onChangeText={setCpfInput}
              keyboardType="numeric"
              maxLength={14}
            />
            <BotaoDourado title="Salvar CPF" onPress={salvarCpf} loading={salvandoCpf} style={{ marginTop: spacing.sm }} />
          </View>
        </>
      )}

      <Text style={styles.secao}>Cupom de desconto</Text>
      <View style={[styles.card, shadow.card]}>
        {cupomAplicado ? (
          <View style={styles.linhaEntre}>
            <Text style={styles.cupomAtivo}>Cupom "{cupom.toUpperCase()}" aplicado</Text>
            <TouchableOpacity onPress={removerCupom}>
              <Text style={styles.linkRemover}>Remover</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Código do cupom"
              placeholderTextColor={colors.textoTerciario}
              value={cupom}
              onChangeText={setCupom}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.btnAplicar} onPress={aplicarCupom} disabled={validandoCupom}>
              {validandoCupom ? <ActivityIndicator color={colors.dourado} /> : <Text style={styles.btnAplicarTexto}>Aplicar</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.resumoCard, shadow.forte]}>
        <View style={styles.linhaEntre}>
          <Text style={styles.resumoLabel}>Subtotal</Text>
          <Text style={styles.resumoValor}>{formatarMoeda(subtotal)}</Text>
        </View>
        {desconto > 0 && (
          <View style={styles.linhaEntre}>
            <Text style={styles.resumoLabelDesconto}>Desconto</Text>
            <Text style={styles.resumoValorDesconto}>−{formatarMoeda(desconto)}</Text>
          </View>
        )}
        <View style={[styles.linhaEntre, styles.linhaTotal]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>{formatarMoeda(totalFinal)}</Text>
        </View>
      </View>

      <BotaoDourado
        title="Ir para pagamento"
        onPress={finalizarCompra}
        loading={finalizando}
        style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.sm },
  secao: { color: colors.texto, fontSize: 16, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardSelecionado: { borderColor: colors.dourado },
  linhaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemNome: { color: colors.texto, fontSize: 14, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  itemPreco: { color: colors.dourado, fontSize: 14, fontWeight: '700' },
  enderecoTexto: { color: colors.texto, fontSize: 14, fontWeight: '600' },
  enderecoSub: { color: colors.textoSecundario, fontSize: 13, marginTop: 2 },
  linkDourado: { color: colors.dourado, fontWeight: '700', fontSize: 14 },
  aviso: { color: colors.textoSecundario, fontSize: 13, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.fundoCard, color: colors.texto, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  btnAplicar: {
    paddingHorizontal: spacing.md, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.dourado,
  },
  btnAplicarTexto: { color: colors.dourado, fontWeight: '700', fontSize: 14 },
  cupomAtivo: { color: colors.sucesso, fontSize: 14, fontWeight: '600' },
  linkRemover: { color: colors.erro, fontSize: 13, fontWeight: '600' },
  resumoCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginTop: spacing.md, gap: 8,
  },
  resumoLabel: { color: colors.textoSecundario, fontSize: 14 },
  resumoValor: { color: colors.texto, fontSize: 15, fontWeight: '600' },
  resumoLabelDesconto: { color: colors.sucesso, fontSize: 14 },
  resumoValorDesconto: { color: colors.sucesso, fontSize: 15, fontWeight: '600' },
  linhaTotal: { borderTopWidth: 1, borderTopColor: colors.bordaCard, paddingTop: 8, marginTop: 4 },
  totalLabel: { color: colors.texto, fontSize: 17, fontWeight: '700' },
  totalValor: { color: colors.dourado, fontSize: 20, fontWeight: '700' },
})
```

- [ ] **Step 2: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 3: Commit**

```bash
git add src/screens/CheckoutScreen.js
git commit -m "feat: tela de checkout com endereco, gate de CPF, cupom e resumo"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 5: Ligar navegação (App.js) e ajustar AssinaturaScreen

**Files:**
- Modify: `App.js`
- Modify: `src/screens/AssinaturaScreen.js`

- [ ] **Step 1: Adicionar telas no Stack.Navigator**

Em `App.js`, adicionar os imports:

```js
import CarrinhoScreen from './src/screens/CarrinhoScreen'
import CheckoutScreen from './src/screens/CheckoutScreen'
import EnderecoFormScreen from './src/screens/EnderecoFormScreen'
```

Dentro do `<Stack.Navigator>` (mesmo nível dos `Stack.Screen` existentes `Tabs` e `Login`), adicionar três novos `Stack.Screen`, mantendo `Tabs` e `Login` exatamente como estão:

```jsx
          <Stack.Screen
            name="Carrinho"
            component={CarrinhoScreen}
            options={{
              title: 'Carrinho',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              title: 'Finalizar compra',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="EnderecoForm"
            component={EnderecoFormScreen}
            options={{
              presentation: 'modal',
              title: 'Endereço',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerShadowVisible: false,
            }}
          />
```

**Step 2: Ajustar `AssinaturaScreen.js` — parar de finalizar sozinha**

Na função `assinar()` de `src/screens/AssinaturaScreen.js`, ela hoje faz: adiciona ao carrinho → busca carrinho → finaliza (`/carrinho/finalizar`) → abre URL. Substituir para que ela só adicione ao carrinho e navegue pro `Carrinho`:

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

Remover o `import { Linking } from 'react-native'` se `Linking` não for mais usado em nenhum outro lugar do arquivo (verificar antes de remover — se sobrar outro uso, manter o import).

Atualizar o texto do rodapé (que hoje diz algo como "Você será redirecionado ao MercadoPago para concluir o pagamento com segurança.") para refletir o novo fluxo, já que agora o próximo passo é o carrinho, não o pagamento direto:

```jsx
      <Text style={styles.rodape}>
        Você poderá revisar seu pedido e escolher o endereço de entrega antes de pagar.
      </Text>
```

- [ ] **Step 3: Verificar regressão**

Run: `npm test`
Expected: 21 passed, 4 suites

- [ ] **Step 4: Commit**

```bash
git add App.js src/screens/AssinaturaScreen.js
git commit -m "feat: liga Carrinho/Checkout/EnderecoForm na navegacao e ajusta fluxo de assinatura"
```
Adicionar `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` como última linha.

---

### Task 6: Verificação final

- [ ] **Step 1: Rodar suite completa**

Run: `npm test`
Expected: todos os testes passam (21 esperados: 6 validarSenha + 3 datas + 6 oauth + 6 cep).

- [ ] **Step 2: Checklist manual no Expo Go (pendente — só o usuário pode fazer)**

1. Assinar um plano → deve ir pro Carrinho (não pagamento direto)
2. Carrinho: ajustar quantidade, desmarcar/marcar item, "Finalizar Compra" → vai pro Checkout com os itens certos
3. Checkout: selecionar endereço existente ou cadastrar novo (CEP autofill funcionando)
4. Se CPF vazio: campo aparece, salva, some depois de salvo
5. Cupom válido aplica desconto no resumo; cupom inválido mostra erro
6. "Ir para pagamento" abre MercadoPago (produção) ou confirma pedido (modo dev)

- [ ] **Step 3: Push**

```bash
git push origin master
```
