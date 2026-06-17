import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { formatarMoeda } from '../utils/format'

export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [produto, setProduto] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    try {
      const { data } = await api.get('/produtos/')
      if (data?.length) setProduto(data[0])
    } catch {}
  }

  useEffect(() => { carregar() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.dourado} />}
    >
      {/* HERO — fundo escuro como no site */}
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>● CURADORIA EXCLUSIVA DE DESTILADOS</Text>
        </View>
        <Text style={styles.heroTitulo}>
          {user ? `Olá, ${user.nome?.split(' ')[0]}.` : 'Bem-vindo ao Clube'}
        </Text>
        <Text style={styles.heroSub}>
          Descubra novos sabores todo mês. Bebidas premium selecionadas por especialistas, entregues na sua porta.
        </Text>
        <BotaoDourado
          title="Conheça a Assinatura"
          onPress={() => navigation.navigate('Assinatura')}
          style={{ marginTop: spacing.md }}
        />
        <View style={styles.stats}>
          <Stat numero="+500" label="Rótulos" />
          <View style={styles.statDivider} />
          <Stat numero="+3 mil" label="Membros" />
          <View style={styles.statDivider} />
          <Stat numero="100%" label="Premium" />
        </View>
      </LinearGradient>

      {/* CORPO — fundo claro */}
      <View style={styles.corpo}>

        {/* BOX DO MÊS */}
        <View style={styles.section}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>● A BOX</Text>
          </View>
          <Text style={styles.sectionTitulo}>
            Sua experiência <Text style={styles.dourado}>mensal</Text>
          </Text>
          <View style={[styles.boxCard, shadow.forte]}>
            {produto?.imagem ? (
              <Image source={{ uri: produto.imagem }} style={styles.boxImagem} resizeMode="contain" />
            ) : (
              <View style={[styles.boxImagem, styles.boxPlaceholder]}>
                <Text style={{ fontSize: 64 }}>🥃</Text>
              </View>
            )}
            <Text style={styles.boxNome}>{produto?.nome || 'Box Clube do Gole'}</Text>
            <Text style={styles.boxDescricao}>
              {produto?.descricao || 'Garrafas premium selecionadas pela nossa curadoria, entregues na sua porta com segurança.'}
            </Text>
            <Text style={styles.boxPreco}>
              {formatarMoeda(produto?.preco ?? 649)}
              <Text style={styles.boxPeriodo}>/mês</Text>
            </Text>
            <BotaoDourado title="Quero Assinar" onPress={() => navigation.navigate('Assinatura')} />
          </View>
        </View>

        {/* COMO FUNCIONA */}
        <View style={styles.section}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>● PROCESSO SIMPLES</Text>
          </View>
          <Text style={styles.sectionTitulo}>
            Como <Text style={styles.dourado}>funciona</Text>
          </Text>
          <Passo n="01" titulo="Escolha seu plano" desc="Mensal, semestral ou anual — você decide o compromisso." />
          <Passo n="02" titulo="Nós cuidamos da seleção" desc="Curadoria especializada de bebidas premium feita para você." />
          <Passo n="03" titulo="Receba em casa" desc="Sua box chega todo mês com segurança e discrição." />
          <Passo n="04" titulo="Viva a experiência" desc="Deguste, compartilhe e participe da comunidade exclusiva." />
        </View>

        {/* COMUNIDADE CTA */}
        <View style={[styles.section, { paddingBottom: spacing.xl }]}>
          <View style={[styles.comunidadeCard, shadow.card]}>
            <Text style={styles.comunidadeTitulo}>Você faz parte do Clube</Text>
            <Text style={styles.comunidadeSub}>
              Mais que uma assinatura: uma comunidade de apreciadores que descobrem juntos novos sabores e histórias.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Comunidade')} style={{ marginTop: spacing.sm }}>
              <Text style={styles.linkDourado}>Entrar na comunidade →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  )
}

function Stat({ numero, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNumero}>{numero}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function Passo({ n, titulo, desc }) {
  return (
    <View style={styles.passo}>
      <Text style={styles.passoNum}>{n}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.passoTitulo}>{titulo}</Text>
        <Text style={styles.passoDesc}>{desc}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },

  // Hero escuro
  hero: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg + 8 },
  heroBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.md,
  },
  heroBadgeText: { color: colors.dourado, fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  heroTitulo: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginBottom: spacing.sm, letterSpacing: 0.3 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 23 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  statItem: { alignItems: 'center', flex: 1 },
  statNumero: { color: colors.dourado, fontSize: 20, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(201,168,76,0.25)' },

  // Corpo claro
  corpo: { backgroundColor: colors.fundo },
  section: { padding: spacing.lg, paddingBottom: 0 },
  badgePill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.roxo,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm,
  },
  badgePillText: { color: colors.roxo, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  sectionTitulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  dourado: { color: colors.dourado },

  boxCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  boxImagem: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.sm },
  boxPlaceholder: { backgroundColor: colors.fundoCard, alignItems: 'center', justifyContent: 'center' },
  boxNome: { color: colors.texto, fontSize: 20, fontWeight: '700' },
  boxDescricao: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginVertical: spacing.xs },
  boxPreco: { color: colors.dourado, fontSize: 28, fontWeight: '700', marginBottom: spacing.sm },
  boxPeriodo: { fontSize: 14, color: colors.textoSecundario },

  passo: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  passoNum: {
    color: colors.dourado, fontSize: 13, fontWeight: '700',
    width: 28, paddingTop: 2, letterSpacing: 0.5,
  },
  passoTitulo: { color: colors.texto, fontSize: 16, fontWeight: '600' },
  passoDesc: { color: colors.textoSecundario, fontSize: 13, marginTop: 2, lineHeight: 19 },

  comunidadeCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  comunidadeTitulo: { color: colors.texto, fontSize: 20, fontWeight: '700' },
  comunidadeSub: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginTop: 6 },
  linkDourado: { color: colors.dourado, fontWeight: '700', fontSize: 14 },
})
