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
