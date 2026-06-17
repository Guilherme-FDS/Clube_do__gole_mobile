import React from 'react'
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, radius, spacing } from '../theme'

export default function BotaoDourado({ title, onPress, outline, loading, style }) {
  if (outline) {
    return (
      <TouchableOpacity style={[styles.outline, style]} onPress={onPress} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.dourado} />
          : <Text style={styles.outlineText}>{title}</Text>}
      </TouchableOpacity>
    )
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} style={style} activeOpacity={0.85}>
      <LinearGradient colors={gradients.dourado} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        {loading
          ? <ActivityIndicator color="#1b1a19" />
          : <Text style={styles.text}>{title}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  text: { color: '#1b1a19', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  outline: {
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.dourado,
  },
  outlineText: { color: colors.dourado, fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
})
