import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'

const BENEFICIOS = [
  { titulo: 'Curadoria personalizada', texto: 'Seleção de rótulos alinhada à identidade da sua empresa.' },
  { titulo: 'Box premium', texto: 'Embalagem exclusiva para presentear com estilo.' },
  { titulo: 'Notas de degustação', texto: 'Material acompanha cada garrafa da seleção.' },
  { titulo: 'Entrega coordenada', texto: 'Logística para grandes volumes e datas especiais.' },
]

export default function CorporativoScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Presentes Corporativos</Text>
      <Text style={styles.sub}>
        Surpreenda clientes, parceiros e colaboradores com uma experiência de bebidas premium.
      </Text>

      {BENEFICIOS.map((b) => (
        <View key={b.titulo} style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>{b.titulo}</Text>
          <Text style={styles.cardTexto}>{b.texto}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.ctaWhats}
        onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=5544998969986')}
      >
        <Text style={styles.ctaWhatsTexto}>Falar no WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Contato')} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
        <Text style={styles.linkDourado}>Ou envie uma mensagem →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700' },
  sub: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardTitulo: { color: colors.texto, fontSize: 15, fontWeight: '700' },
  cardTexto: { color: colors.textoSecundario, fontSize: 13, marginTop: 4, lineHeight: 20 },
  ctaWhats: {
    backgroundColor: '#25D366', borderRadius: radius.pill, paddingVertical: 15,
    alignItems: 'center', marginTop: spacing.md,
  },
  ctaWhatsTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  linkDourado: { color: colors.dourado, fontWeight: '700', fontSize: 14 },
})
