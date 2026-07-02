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
