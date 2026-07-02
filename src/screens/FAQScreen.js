import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import { getFaqs } from '../services/strapi'

export default function FAQScreen() {
  const [faqs, setFaqs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    getFaqs()
      .then((data) => setFaqs(data || []))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Perguntas frequentes</Text>
      {faqs.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhuma pergunta cadastrada ainda.</Text>
      ) : (
        faqs.map((faq, i) => {
          const expandido = aberto === i
          return (
            <TouchableOpacity
              key={faq.id ?? i}
              style={[styles.card, shadow.card]}
              onPress={() => setAberto(expandido ? null : i)}
              activeOpacity={0.85}
            >
              <View style={styles.perguntaRow}>
                <Text style={styles.pergunta}>{faq.pergunta}</Text>
                <Text style={styles.seta}>{expandido ? '−' : '+'}</Text>
              </View>
              {expandido && <Text style={styles.resposta}>{faq.resposta}</Text>}
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
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  textoVazio: { color: colors.textoSecundario, fontSize: 14 },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  perguntaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pergunta: { color: colors.texto, fontSize: 15, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  seta: { color: colors.dourado, fontSize: 18, fontWeight: '700' },
  resposta: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
})
