import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'
import { extrairTextoStrapi } from '../utils/extrairTextoStrapi'

export default function ConteudoStrapi({ blocos }) {
  if (!blocos || blocos.length === 0) {
    return <Text style={styles.paragrafo}>Conteúdo em breve.</Text>
  }
  return (
    <View>
      {blocos.map((bloco, i) => {
        const texto = extrairTextoStrapi(bloco.children)
        if (bloco.type === 'heading' && bloco.level === 2) {
          return <Text key={i} style={styles.h2}>{texto}</Text>
        }
        if (bloco.type === 'heading' && bloco.level === 3) {
          return <Text key={i} style={styles.h3}>{texto}</Text>
        }
        if (bloco.type === 'quote') {
          return <Text key={i} style={styles.citacao}>{texto}</Text>
        }
        if (bloco.type === 'list') {
          return (
            <View key={i} style={styles.lista}>
              {(bloco.children || []).map((item, j) => (
                <Text key={j} style={styles.itemLista}>
                  {bloco.format === 'ordered' ? `${j + 1}. ` : '• '}{extrairTextoStrapi(item.children)}
                </Text>
              ))}
            </View>
          )
        }
        return <Text key={i} style={styles.paragrafo}>{texto}</Text>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  paragrafo: { color: colors.textoSecundario, fontSize: 15, lineHeight: 24, marginBottom: spacing.sm },
  h2: { color: colors.texto, fontSize: 20, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  h3: { color: colors.texto, fontSize: 17, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.xs },
  citacao: {
    color: colors.textoSecundario, fontSize: 15, fontStyle: 'italic', lineHeight: 24,
    borderLeftWidth: 3, borderLeftColor: colors.dourado, paddingLeft: spacing.sm, marginBottom: spacing.sm,
  },
  lista: { marginBottom: spacing.sm },
  itemLista: { color: colors.textoSecundario, fontSize: 15, lineHeight: 24, marginBottom: 4 },
})
