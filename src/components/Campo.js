import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

export default function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
})
