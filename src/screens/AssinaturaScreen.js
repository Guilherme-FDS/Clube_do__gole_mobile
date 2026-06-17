import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
} from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const LABEL_RECORRENCIA = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
}

const BADGE_RECORRENCIA = {
  mensal: { texto: 'MAIS POPULAR', roxo: false },
  semestral: { texto: 'ECONOMIZE 5%', roxo: true },
  anual: { texto: 'MELHOR OFERTA', roxo: true },
}

const BENEFICIOS = {
  mensal: ['Flexibilidade total', 'Renovação mensal', 'Sem compromisso'],
  semestral: ['5% de desconto', '6 meses de acesso', 'Custo-benefício superior'],
  anual: ['10% de desconto', '12 meses de acesso', 'Maior economia'],
}

function moeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AssinaturaScreen({ navigation }) {
  const { user } = useAuth()
  const [produto, setProduto] = useState(null)
  const [planos, setPlanos] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [assinando, setAssinando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    try {
      const { data: lista } = await api.get('/produtos/')
      if (!lista?.length) return
      const prod = lista[0]
      setProduto(prod)
      const { data: planosData } = await api.get(`/produtos/${prod.id}/planos`)
      const ativos = planosData.filter(p => p.ativo)
      setPlanos(ativos)
      const mensal = ativos.find(p => p.recorrencia === 'mensal')
      setSelecionado(mensal?.id ?? ativos[0]?.id ?? null)
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os planos. Verifique sua conexão.')
    } finally {
      setCarregando(false)
    }
  }

  async function assinar() {
    if (!user) { navigation.navigate('Login'); return }
    if (!selecionado || !produto) return
    setAssinando(true)
    try {
      // 1. Adicionar ao carrinho
      await api.post('/carrinho/adicionar', {
        produto_id: produto.id,
        plano_id: selecionado,
        quantidade: 1,
      })

      // 2. Buscar itens do carrinho para obter os IDs
      const { data: carrinho } = await api.get('/carrinho/')
      const ids = carrinho.itens.map(i => i.id)
      if (!ids.length) throw new Error('Carrinho vazio após adicionar.')

      // 3. Finalizar e obter URL do MercadoPago
      const { data } = await api.post('/carrinho/finalizar', {
        ids,
        cupom: null,
        desconto_cupom: 0,
      })

      if (data.checkout_url) {
        await Linking.openURL(data.checkout_url)
        Alert.alert(
          'Pagamento iniciado 🥂',
          'Complete o pagamento no MercadoPago. Sua assinatura será ativada automaticamente assim que confirmado.',
          [{ text: 'OK' }]
        )
      } else {
        // Modo desenvolvimento — aprovação imediata
        Alert.alert('Assinatura ativada! 🥂', 'Bem-vindo ao Clube do Gole!')
        navigation.navigate('Perfil')
      }
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

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  const planoAtivo = planos.find(p => p.id === selecionado)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>

      <View style={styles.badgePill}>
        <Text style={styles.badgePillText}>● NOSSA ASSINATURA</Text>
      </View>
      <Text style={styles.titulo}>
        Escolha seu <Text style={styles.dourado}>plano</Text>
      </Text>
      <Text style={styles.sub}>
        Duas garrafas premium por mês. Curadoria especializada entregue na sua porta.
      </Text>

      {planos.map((plano) => {
        const ativo = selecionado === plano.id
        const badge = BADGE_RECORRENCIA[plano.recorrencia] ?? { texto: '', roxo: false }
        const beneficios = BENEFICIOS[plano.recorrencia] ?? []
        const precoMensal = plano.recorrencia === 'mensal'
          ? Number(plano.preco_total)
          : Number(plano.preco_total) / (plano.recorrencia === 'semestral' ? 6 : 12)

        return (
          <TouchableOpacity
            key={plano.id}
            style={[styles.card, ativo && styles.cardAtivo, shadow.card]}
            onPress={() => setSelecionado(plano.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardNome}>{LABEL_RECORRENCIA[plano.recorrencia] ?? plano.recorrencia}</Text>
              {badge.texto ? (
                <View style={[styles.cardBadge, badge.roxo && styles.cardBadgeRoxo]}>
                  <Text style={styles.cardBadgeText}>{badge.texto}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.cardPreco}>
              {moeda(plano.preco_total)}
              <Text style={styles.cardPeriodo}>
                {plano.recorrencia === 'mensal' ? '/mês' : plano.recorrencia === 'semestral' ? '/semestre' : '/ano'}
              </Text>
            </Text>

            {plano.recorrencia !== 'mensal' && (
              <Text style={styles.cardMensal}>{moeda(precoMensal)}/mês por membro</Text>
            )}

            {Number(plano.economia) > 0 && (
              <Text style={styles.economia}>✓ Você economiza {moeda(plano.economia)}</Text>
            )}

            <View style={styles.beneficioWrap}>
              {beneficios.map(b => (
                <Text key={b} style={styles.beneficio}>· {b}</Text>
              ))}
            </View>

            {ativo && <View style={styles.indicador} />}
          </TouchableOpacity>
        )
      })}

      {planos.length === 0 && (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.sub}>Nenhum plano disponível no momento.</Text>
        </View>
      )}

      <BotaoDourado
        title={user ? 'Assinar agora' : 'Entrar para assinar'}
        onPress={assinar}
        loading={assinando}
        style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}
      />

      <Text style={styles.rodape}>
        Você será redirecionado ao MercadoPago para concluir o pagamento com segurança.
      </Text>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  badgePill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.roxo,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm,
  },
  badgePillText: { color: colors.roxo, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  titulo: { color: colors.texto, fontSize: 28, fontWeight: '700' },
  dourado: { color: colors.dourado },
  sub: { color: colors.textoSecundario, fontSize: 14, marginTop: 6, marginBottom: spacing.md, lineHeight: 21 },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.bordaCard, marginBottom: spacing.sm, overflow: 'hidden',
  },
  cardAtivo: { borderColor: colors.dourado },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNome: { color: colors.texto, fontSize: 20, fontWeight: '700' },
  cardBadge: {
    backgroundColor: colors.dourado, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4,
  },
  cardBadgeRoxo: { backgroundColor: colors.roxo },
  cardBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardPreco: { color: colors.dourado, fontSize: 26, fontWeight: '700', marginTop: spacing.xs },
  cardPeriodo: { fontSize: 13, color: colors.textoSecundario },
  cardMensal: { color: colors.textoSecundario, fontSize: 12, marginTop: 2 },
  economia: { color: colors.sucesso, fontSize: 13, fontWeight: '600', marginTop: 6 },
  beneficioWrap: { marginTop: spacing.sm, gap: 4 },
  beneficio: { color: colors.textoSecundario, fontSize: 14 },
  indicador: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: 3,
    backgroundColor: colors.dourado,
    borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg,
  },
  rodape: {
    color: colors.textoTerciario, fontSize: 12, textAlign: 'center',
    marginBottom: spacing.xl, marginTop: spacing.xs, lineHeight: 18,
  },
})
