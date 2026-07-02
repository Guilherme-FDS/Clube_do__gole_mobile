import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPagina } from '../services/strapi'

const VALORES = [
  { titulo: 'Curadoria', texto: 'Cada rótulo é selecionado a dedo por especialistas.' },
  { titulo: 'Comunidade', texto: 'Mais que assinatura, um clube de apreciadores.' },
  { titulo: 'Transparência', texto: 'Sem letras miúdas, sem pegadinhas.' },
]

export default function SobreScreen() {
  const [conteudo, setConteudo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPagina('sobre')
      .then((data) => setConteudo(data?.[0]?.conteudo || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Sobre o Clube do Gole</Text>

      {carregando ? (
        <ActivityIndicator color={colors.dourado} style={{ marginVertical: spacing.md }} />
      ) : (
        <ConteudoStrapi blocos={conteudo} />
      )}

      <Text style={styles.secao}>Nossos valores</Text>
      {VALORES.map((v) => (
        <View key={v.titulo} style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>{v.titulo}</Text>
          <Text style={styles.cardTexto}>{v.texto}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  secao: { color: colors.texto, fontSize: 18, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardTitulo: { color: colors.texto, fontSize: 15, fontWeight: '700' },
  cardTexto: { color: colors.textoSecundario, fontSize: 13, marginTop: 4, lineHeight: 20 },
})
