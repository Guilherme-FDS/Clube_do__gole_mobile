import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { formatarMoeda } from '../utils/format'

const PLANOS = [
  {
    id: 'mensal', nome: 'Mensal', meses: 1, desconto: 0,
    badge: 'MAIS POPULAR', badgeRoxo: false,
    beneficios: ['Flexibilidade total', 'Renovação mensal', 'Sem compromisso'],
  },
  {
    id: 'semestral', nome: 'Semestral', meses: 6, desconto: 0.05,
    badge: 'ECONOMIZE 5%', badgeRoxo: true,
    beneficios: ['5% de desconto', '6 meses de acesso', 'Custo-benefício superior'],
  },
  {
    id: 'anual', nome: 'Anual', meses: 12, desconto: 0.10,
    badge: 'MELHOR OFERTA', badgeRoxo: true,
    beneficios: ['10% de desconto', '12 meses de acesso', 'Maior economia'],
  },
]

export default function AssinaturaScreen({ navigation }) {
  const { user } = useAuth()
  const [produto, setProduto] = useState(null)
  const [selecionado, setSelecionado] = useState('mensal')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get('/produtos/').then(({ data }) => {
      if (data?.length) setProduto(data[0])
    }).catch(() => {})
  }, [])

  const precoBase = Number(produto?.preco ?? 649)

  function precoPlano(plano) {
    return precoBase * plano.meses * (1 - plano.desconto)
  }

  function precoMensal(plano) {
    return precoBase * (1 - plano.desconto)
  }

  async function assinar() {
    if (!user) { navigation.navigate('Login'); return }
    if (!produto) { Alert.alert('Aguarde', 'Carregando informações da box...'); return }
    setEnviando(true)
    try {
      await api.post('/carrinho/adicionar', { produto_id: produto.id, plano: selecionado, quantidade: 1 })
      Alert.alert('Adicionado! 🥂', 'Sua assinatura foi adicionada ao carrinho. Finalize a compra pelo site para concluir o pagamento.')
    } catch {
      Alert.alert('Ops', 'Não foi possível adicionar. Tente novamente.')
    } finally { setEnviando(false) }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.badgePill}>
        <Text style={styles.badgePillText}>● NOSSA ASSINATURA</Text>
      </View>
      <Text style={styles.titulo}>
        Escolha seu <Text style={styles.dourado}>plano</Text>
      </Text>
      <Text style={styles.sub}>
        Uma box premium de {formatarMoeda(precoBase)}/mês. Economize nos planos longos.
      </Text>

      {PLANOS.map((plano) => {
        const ativo = selecionado === plano.id
        return (
          <TouchableOpacity
            key={plano.id}
            style={[styles.card, ativo && styles.cardAtivo, shadow.card]}
            onPress={() => setSelecionado(plano.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardNome}>{plano.nome}</Text>
              <View style={[styles.cardBadge, plano.badgeRoxo && styles.cardBadgeRoxo]}>
                <Text style={styles.cardBadgeText}>{plano.badge}</Text>
              </View>
            </View>
            <Text style={styles.cardPreco}>
              {formatarMoeda(precoPlano(plano))}
              <Text style={styles.cardPeriodo}>
                {plano.meses === 1 ? '/mês' : plano.meses === 6 ? '/semestre' : '/ano'}
              </Text>
            </Text>
            {plano.meses > 1 && (
              <Text style={styles.cardMensal}>
                {formatarMoeda(precoMensal(plano))}/mês por membro
              </Text>
            )}
            {plano.desconto > 0 && (
              <Text style={styles.economia}>
                ✓ Economize {formatarMoeda(precoBase * plano.meses * plano.desconto)}
              </Text>
            )}
            <View style={styles.beneficioWrap}>
              {plano.beneficios.map((b) => (
                <Text key={b} style={styles.beneficio}>· {b}</Text>
              ))}
            </View>
            {ativo && <View style={styles.selecionadoIndicador} />}
          </TouchableOpacity>
        )
      })}

      <BotaoDourado
        title={user ? 'Assinar agora' : 'Entrar para assinar'}
        onPress={assinar}
        loading={enviando}
        style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  badgePill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.roxo,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm,
  },
  badgePillText: { color: colors.roxo, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  titulo: { color: colors.texto, fontSize: 28, fontWeight: '700' },
  dourado: { color: colors.dourado },
  sub: { color: colors.textoSecundario, fontSize: 14, marginTop: 6, marginBottom: spacing.md, lineHeight: 21 },
  card: {
    backgroundColor: colors.fundoSecundario,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.bordaCard,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardAtivo: { borderColor: colors.dourado },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNome: { color: colors.texto, fontSize: 20, fontWeight: '700' },
  cardBadge: {
    backgroundColor: colors.dourado,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeRoxo: { backgroundColor: colors.roxo },
  cardBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardPreco: { color: colors.dourado, fontSize: 26, fontWeight: '700', marginTop: spacing.xs },
  cardPeriodo: { fontSize: 13, color: colors.textoSecundario },
  cardMensal: { color: colors.textoSecundario, fontSize: 12, marginTop: 2 },
  economia: { color: colors.sucesso, fontSize: 13, fontWeight: '600', marginTop: 6 },
  beneficioWrap: { marginTop: spacing.sm, gap: 4 },
  beneficio: { color: colors.textoSecundario, fontSize: 14 },
  selecionadoIndicador: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 3, backgroundColor: colors.dourado,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
})
