import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function PerfilScreen({ navigation }) {
  const { user, logout } = useAuth()
  const [assinaturas, setAssinaturas] = useState([])

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      api.get('/assinaturas/minhas').then(({ data }) => setAssinaturas(data || [])).catch(() => {})
    }, [user])
  )

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.titulo}>Seja membro 🥂</Text>
        <Text style={styles.sub}>Entre na sua conta para acompanhar sua assinatura e pedidos.</Text>
        <BotaoDourado
          title="Entrar / Cadastrar"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
        />
      </View>
    )
  }

  function confirmarSaida() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ])
  }

  const iniciais = [user.nome?.[0], user.sobrenome?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>

      {/* Avatar + dados */}
      <View style={[styles.perfilCard, shadow.forte]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>
        <Text style={styles.titulo}>{user.nome} {user.sobrenome}</Text>
        <Text style={styles.sub}>{user.email}</Text>
      </View>

      {/* Assinaturas */}
      <Text style={styles.secao}>Minhas assinaturas</Text>
      {assinaturas.length === 0 ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTexto}>Você ainda não tem uma assinatura ativa.</Text>
          <BotaoDourado
            title="Conhecer planos"
            onPress={() => navigation.navigate('Assinatura')}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : (
        assinaturas.map((a, i) => (
          <View key={i} style={[styles.card, shadow.card]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitulo}>Plano {a.plano || a.tipo_plano || '—'}</Text>
              <View style={[styles.statusBadge, a.status === 'ativa' && styles.statusAtivo]}>
                <Text style={styles.statusText}>{a.status || 'ativa'}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Configurações */}
      <Text style={styles.secao}>Configurações</Text>
      <View style={[styles.card, shadow.card, { paddingVertical: 0 }]}>
        <ItemMenu titulo="Editar perfil" onPress={() => navigation.navigate('EditarPerfil')} />
        <Divisor />
        <ItemMenu titulo="Meus endereços" onPress={() => navigation.navigate('Enderecos')} />
        <Divisor />
        <ItemMenu titulo="Segurança" onPress={() => navigation.navigate('Seguranca')} />
        <Divisor />
        <ItemMenu titulo="Meus pedidos" onPress={() => navigation.navigate('MeusPedidos')} ultimo />
      </View>

      <BotaoDourado
        title="Sair da conta"
        outline
        onPress={confirmarSaida}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />
    </ScrollView>
  )
}

function ItemMenu({ titulo, onPress, ultimo }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.itemMenu, ultimo && { marginBottom: 0 }]}>
      <Text style={styles.itemMenuTexto}>{titulo}</Text>
      <Text style={styles.itemMenuSeta}>→</Text>
    </TouchableOpacity>
  )
}

function Divisor() {
  return <View style={styles.divisor} />
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.fundo },
  perfilCard: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.bordaCard, alignItems: 'center', marginBottom: spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.dourado,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: '#1b1a19', fontSize: 22, fontWeight: '700' },
  titulo: { color: colors.texto, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textoSecundario, fontSize: 14, marginTop: 4 },
  secao: { color: colors.texto, fontSize: 18, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.bordaCard, marginBottom: spacing.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { color: colors.texto, fontSize: 16, fontWeight: '600' },
  cardTexto: { color: colors.textoSecundario, fontSize: 14, marginTop: 4 },
  statusBadge: {
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: colors.fundoCard,
  },
  statusAtivo: { backgroundColor: '#e6f4ed' },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.sucesso },
  itemMenu: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md,
  },
  itemMenuTexto: { color: colors.texto, fontSize: 15, fontWeight: '500' },
  itemMenuSeta: { color: colors.dourado, fontSize: 16, fontWeight: '700' },
  divisor: { height: 1, backgroundColor: colors.bordaCard },
})
