import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import Campo from '../components/Campo'
import api from '../services/api'
import { validarSenha } from '../utils/validarSenha'

export default function SegurancaScreen() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)

  const erroNovaSenha = novaSenha ? validarSenha(novaSenha) : null

  async function trocarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    if (erroNovaSenha) {
      Alert.alert('Atenção', erroNovaSenha)
      return
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.')
      return
    }
    setSalvando(true)
    try {
      await api.put('/configuracoes/senha', { senha_atual: senhaAtual, nova_senha: novaSenha })
      Alert.alert('Sucesso', 'Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível alterar a senha.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.card, shadow.forte]}>
        <Campo label="Senha atual">
          <TextInput
            style={styles.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            placeholderTextColor={colors.textoTerciario}
          />
        </Campo>
        <Campo label="Nova senha">
          <TextInput
            style={styles.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
            placeholder="8+ caracteres, com maiúscula, minúscula e número"
            placeholderTextColor={colors.textoTerciario}
          />
          {erroNovaSenha ? <Text style={styles.erroCampo}>{erroNovaSenha}</Text> : null}
        </Campo>
        <Campo label="Confirmar nova senha">
          <TextInput
            style={styles.input}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            placeholderTextColor={colors.textoTerciario}
          />
        </Campo>
        <BotaoDourado title="Alterar senha" onPress={trocarSenha} loading={salvando} style={{ marginTop: spacing.md }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.bordaCard, padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.fundoCard, color: colors.texto, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  erroCampo: { color: colors.erro, fontSize: 12, marginTop: 6 },
})
