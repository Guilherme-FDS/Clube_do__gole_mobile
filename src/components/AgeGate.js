import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, spacing, radius } from '../theme'

export default function AgeGate({ onConfirmar }) {
  const [recusado, setRecusado] = useState(false)

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>● CLUBE DO GOLE</Text>
        </View>
        {recusado ? (
          <>
            <Text style={styles.titulo}>Conteúdo para maiores de 18 anos</Text>
            <Text style={styles.sub}>
              Este aplicativo contém conteúdo sobre bebidas alcoólicas e é destinado apenas a maiores de idade.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.titulo}>Você é maior de 18 anos?</Text>
            <Text style={styles.sub}>
              Este aplicativo contém conteúdo sobre bebidas alcoólicas e é destinado apenas a maiores de idade.
            </Text>
            <View style={styles.botoes}>
              <TouchableOpacity style={{ flex: 1 }} onPress={onConfirmar} activeOpacity={0.85}>
                <LinearGradient colors={gradients.dourado} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnSim}>
                  <Text style={styles.btnSimText}>Sim</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnNao} onPress={() => setRecusado(true)}>
                <Text style={styles.btnNaoText}>Não</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#0d0d0d',
    alignItems: 'center', justifyContent: 'center', padding: spacing.md,
  },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: '#141311',
    borderWidth: 1, borderColor: colors.dourado, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  chip: {
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.md,
  },
  chipText: { color: colors.dourado, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  titulo: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub: { color: '#aaaaaa', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  botoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
  btnSim: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  btnSimText: { color: '#0d0d0d', fontWeight: '700', fontSize: 15 },
  btnNao: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.dourado,
  },
  btnNaoText: { color: colors.dourado, fontWeight: '700', fontSize: 15 },
})
