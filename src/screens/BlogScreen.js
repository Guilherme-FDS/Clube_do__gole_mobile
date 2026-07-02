import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import { getPosts } from '../services/strapi'

function formatarData(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BlogScreen({ navigation }) {
  const [posts, setPosts] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getPosts()
      .then((data) => setPosts(data || []))
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
      <Text style={styles.titulo}>Blog</Text>
      {posts.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhum post publicado ainda.</Text>
      ) : (
        posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[styles.card, shadow.card]}
            onPress={() => navigation.navigate('BlogPost', { slug: post.slug, titulo: post.titulo })}
            activeOpacity={0.85}
          >
            <Text style={styles.data}>{formatarData(post.publicado_em || post.createdAt)}</Text>
            <Text style={styles.postTitulo}>{post.titulo}</Text>
            <Text style={styles.resumo} numberOfLines={3}>{post.resumo}</Text>
            <Text style={styles.linkDourado}>Ler mais →</Text>
          </TouchableOpacity>
        ))
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
  data: { color: colors.textoTerciario, fontSize: 12 },
  postTitulo: { color: colors.texto, fontSize: 17, fontWeight: '700', marginTop: 4 },
  resumo: { color: colors.textoSecundario, fontSize: 14, lineHeight: 20, marginTop: 6 },
  linkDourado: { color: colors.dourado, fontWeight: '700', fontSize: 13, marginTop: spacing.sm },
})
