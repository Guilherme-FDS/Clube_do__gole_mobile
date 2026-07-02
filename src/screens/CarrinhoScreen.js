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
      const { data } = await api.get('/carrinho/')
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
