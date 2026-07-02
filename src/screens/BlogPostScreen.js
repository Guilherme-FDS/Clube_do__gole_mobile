import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing } from '../theme'
import ConteudoStrapi from '../components/ConteudoStrapi'
import { getPost } from '../services/strapi'

export default function BlogPostScreen({ route }) {
  const { slug, titulo } = route.params || {}
  const [post, setPost] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPost(slug)
      .then((data) => setPost(data?.[0] || null))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [slug])

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.titulo}>{post?.titulo || titulo}</Text>
      <ConteudoStrapi blocos={post?.conteudo} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  titulo: { color: colors.texto, fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
})
