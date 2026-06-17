import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'

const DESTAQUES = [
  {
    emoji: '🥃',
    titulo: 'Drop do mês: Whisky single malt',
    texto: 'A curadoria deste mês traz um single malt envelhecido em barril de carvalho. Membros já estão compartilhando suas notas de degustação.',
  },
  {
    emoji: '🍸',
    titulo: 'Receita da comunidade',
    texto: 'O membro João compartilhou um negroni com o gin da box passada. Experimente e conte como ficou.',
  },
  {
    emoji: '🎉',
    titulo: 'Encontro de membros',
    texto: 'Degustação ao vivo no Instagram dia 25. Traga sua garrafa da box e participe com a gente.',
  },
]

const DEPOIMENTOS = [
  { nome: 'Marina S.', texto: 'Cada box é uma surpresa. Já descobri 3 rótulos que viraram favoritos.' },
  { nome: 'Carlos P.', texto: 'O que mais gosto é sentir que faço parte de algo — a comunidade é incrível.' },
  { nome: 'Renata L.', texto: 'A curadoria é impecável. Vale cada centavo.' },
]

export default function ComunidadeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>

      <View style={styles.badgePill}>
        <Text style={styles.badgePillText}>● NOSSA COMUNIDADE</Text>
      </View>
      <Text style={styles.titulo}>
        Você pertence ao <Text style={styles.dourado}>Clube</Text>
      </Text>
      <Text style={styles.sub}>
        Apreciadores que descobrem juntos novos sabores, trocam experiências e celebram cada gole.
      </Text>

      {DESTAQUES.map((d) => (
        <View key={d.titulo} style={[styles.card, shadow.card]}>
          <Text style={styles.cardEmoji}>{d.emoji}</Text>
          <Text style={styles.cardTitulo}>{d.titulo}</Text>
          <Text style={styles.cardTexto}>{d.texto}</Text>
        </View>
      ))}

      <Text style={styles.secao}>O que dizem os membros</Text>
      {DEPOIMENTOS.map((d) => (
        <View key={d.nome} style={styles.depoimento}>
          <Text style={styles.depoimentoTexto}>"{d.texto}"</Text>
          <Text style={styles.depoimentoNome}>— {d.nome}</Text>
        </View>
      ))}

      <Text style={styles.secao}>Participe</Text>
      <TouchableOpacity
        style={[styles.social, shadow.card]}
        onPress={() => Linking.openURL('https://www.instagram.com/clubegole/')}
      >
        <Text style={styles.socialEmoji}>📸</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>Instagram</Text>
          <Text style={styles.socialSub}>@clubegole</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.social, { marginBottom: spacing.xl }, shadow.card]}
        onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=5544998969986')}
      >
        <Text style={styles.socialEmoji}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.socialTitulo}>WhatsApp</Text>
          <Text style={styles.socialSub}>Fale com a gente</Text>
        </View>
        <Text style={styles.socialArrow}>→</Text>
      </TouchableOpacity>

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
  sub: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardEmoji: { fontSize: 26, marginBottom: 8 },
  cardTitulo: { color: colors.texto, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardTexto: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21 },
  secao: { color: colors.texto, fontSize: 20, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  depoimento: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.dourado, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  depoimentoTexto: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  depoimentoNome: { color: colors.dourado, fontSize: 13, fontWeight: '600', marginTop: 8 },
  social: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  socialEmoji: { fontSize: 22 },
  socialTitulo: { color: colors.texto, fontSize: 15, fontWeight: '600' },
  socialSub: { color: colors.textoSecundario, fontSize: 12, marginTop: 1 },
  socialArrow: { color: colors.dourado, fontSize: 18, fontWeight: '700' },
})
