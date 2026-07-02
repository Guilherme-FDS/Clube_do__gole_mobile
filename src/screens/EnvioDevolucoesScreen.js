import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPagina } from '../services/strapi'

export default function EnvioDevolucoesScreen() {
  const [conteudo, setConteudo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPagina('envio-devolucoes')
      .then((data) => setConteudo(data?.[0]?.conteudo || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>Envio e Devoluções</Text>
      {carregando ? (
        <ActivityIndicator color={colors.dourado} style={{ marginVertical: spacing.md }} />
      ) : (
        <ConteudoStrapi blocos={conteudo} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
})
