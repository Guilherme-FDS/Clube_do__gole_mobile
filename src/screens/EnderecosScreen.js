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
