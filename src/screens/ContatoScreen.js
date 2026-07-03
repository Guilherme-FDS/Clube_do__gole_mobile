import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import Campo from '../components/Campo'

const ASSUNTOS = ['Dúvida sobre assinatura', 'Problema com pedido', 'Parceria corporativa', 'Imprensa', 'Outro']

export default function ContatoScreen() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [assunto, setAssunto] = useState(ASSUNTOS[0])
  const [mensagem, setMensagem] = useState('')

  function enviar() {
    if (!nome || !email || !mensagem) {
      Alert.alert('Atenção', 'Preencha nome, email e mensagem.')
      return
    }
    const subject = encodeURIComponent(`[Clube do Gole] ${assunto}`)
    const body = encodeURIComponent(`Nome: ${nome}\nEmail: ${email}\nAssunto: ${assunto}\n\n${mensagem}`)
    Linking.openURL(`mailto:contato@clubedogole.com.br?subject=${subject}&body=${body}`)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Fale com a gente</Text>

      <TouchableOpacity
        style={[styles.canalCard, shadow.card]}
        onPress={() => Linking.openURL('https://api.whatsapp.com/send/?phone=5544998969986')}
      >
        <Text style={styles.canalTitulo}>WhatsApp</Text>
        <Text style={styles.canalSub}>Resposta rápida</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.canalCard, shadow.card]}
        onPress={() => Linking.openURL('mailto:contato@clubedogole.com.br')}
      >
        <Text style={styles.canalTitulo}>E-mail</Text>
        <Text style={styles.canalSub}>contato@clubedogole.com.br</Text>
      </TouchableOpacity>

      <Text style={styles.secao}>Ou envie uma mensagem</Text>
      <View style={[styles.card, shadow.forte]}>
        <Campo label="Nome">
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="E-mail">
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Assunto">
          <View style={styles.assuntoWrap}>
            {ASSUNTOS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.assuntoChip, assunto === a && styles.assuntoChipAtivo]}
                onPress={() => setAssunto(a)}
              >
                <Text style={[styles.assuntoTexto, assunto === a && styles.assuntoTextoAtivo]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Campo>
        <Campo label="Mensagem">
          <TextInput
            style={[styles.input, styles.inputMultilinha]}
            value={mensagem}
            onChangeText={setMensagem}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textoTerciario}
          />
        </Campo>
        <BotaoDourado title="Enviar" onPress={enviar} style={{ marginTop: spacing.sm }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  canalCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  canalTitulo: { color: colors.texto, fontSize: 15, fontWeight: '700' },
  canalSub: { color: colors.textoSecundario, fontSize: 13, marginTop: 2 },
  secao: { color: colors.texto, fontSize: 18, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.bordaCard, padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.fundoCard, color: colors.texto, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  inputMultilinha: { minHeight: 90, textAlignVertical: 'top' },
  assuntoWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assuntoChip: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.bordaCard,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.fundoCard,
  },
  assuntoChipAtivo: { backgroundColor: colors.dourado, borderColor: colors.dourado },
  assuntoTexto: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600' },
  assuntoTextoAtivo: { color: '#1b1a19' },
})
