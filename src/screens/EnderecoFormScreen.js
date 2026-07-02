import React, { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import api from '../services/api'
import { formatarCEP, buscarCEP } from '../utils/cep'

export default function EnderecoFormScreen({ navigation, route }) {
  const endereco = route.params?.endereco ?? null
  const editando = !!endereco

  const [cep, setCep] = useState(endereco?.cep ?? '')
  const [logradouro, setLogradouro] = useState(endereco?.endereco ?? '')
  const [numero, setNumero] = useState(endereco?.numero ?? '')
  const [complemento, setComplemento] = useState(endereco?.complemento ?? '')
  const [bairro, setBairro] = useState(endereco?.bairro ?? '')
  const [cidade, setCidade] = useState(endereco?.cidade ?? '')
  const [estado, setEstado] = useState(endereco?.estado ?? '')
  const [principal, setPrincipal] = useState(endereco?.principal ?? false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function aoSairDoCep() {
    if (cep.replace(/\D/g, '').length !== 8) return
    setBuscandoCep(true)
    try {
      const dados = await buscarCEP(cep)
      if (!dados) {
        Alert.alert('CEP não encontrado', 'Verifique o CEP informado.')
        return
      }
      setLogradouro(dados.endereco || '')
      setBairro(dados.bairro || '')
      setCidade(dados.cidade || '')
      setEstado(dados.estado || '')
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP agora.')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function salvar() {
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.')
      return
    }
    setSalvando(true)
    const payload = {
      tipo: 'residencial',
      cep: cep.replace(/\D/g, ''),
      endereco: logradouro,
      numero,
      complemento: complemento || null,
      bairro,
      cidade,
      estado: estado.toUpperCase(),
      pais: 'Brasil',
      principal,
    }
    try {
      if (editando) {
        await api.put(`/configuracoes/enderecos/${endereco.id}`, payload)
      } else {
        await api.post('/configuracoes/enderecos', payload)
      }
      navigation.goBack()
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível salvar o endereço.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadow.forte]}>
          <Campo label="CEP">
            <TextInput
              style={styles.input}
              placeholder="00000-000"
              placeholderTextColor={colors.textoTerciario}
              value={cep}
              onChangeText={(t) => setCep(formatarCEP(t))}
              onBlur={aoSairDoCep}
              keyboardType="numeric"
              maxLength={9}
            />
            {buscandoCep ? <Text style={styles.dica}>Buscando endereço...</Text> : null}
          </Campo>
          <Campo label="Endereço">
            <TextInput style={styles.input} value={logradouro} onChangeText={setLogradouro} placeholderTextColor={colors.textoTerciario} placeholder="Rua, avenida..." />
          </Campo>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Campo label="Número">
                <TextInput style={styles.input} value={numero} onChangeText={setNumero} keyboardType="numeric" placeholderTextColor={colors.textoTerciario} placeholder="123" />
              </Campo>
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Campo label="Complemento">
                <TextInput style={styles.input} value={complemento} onChangeText={setComplemento} placeholderTextColor={colors.textoTerciario} placeholder="Apto, bloco..." />
              </Campo>
            </View>
          </View>
          <Campo label="Bairro">
            <TextInput style={styles.input} value={bairro} onChangeText={setBairro} placeholderTextColor={colors.textoTerciario} />
          </Campo>
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Campo label="Cidade">
                <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholderTextColor={colors.textoTerciario} />
              </Campo>
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Campo label="UF">
                <TextInput style={styles.input} value={estado} onChangeText={(t) => setEstado(t.toUpperCase().slice(0, 2))} maxLength={2} autoCapitalize="characters" placeholderTextColor={colors.textoTerciario} />
              </Campo>
            </View>
          </View>
          <View style={styles.principalRow}>
            <Text style={styles.principalLabel}>Definir como endereço principal</Text>
            <Switch value={principal} onValueChange={setPrincipal} trackColor={{ true: colors.dourado }} />
          </View>
          <BotaoDourado title={editando ? 'Salvar alterações' : 'Adicionar endereço'} onPress={salvar} loading={salvando} style={{ marginTop: spacing.md }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  scroll: { padding: spacing.md, paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.bordaCard, padding: spacing.lg,
  },
  label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.fundoCard, color: colors.texto, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  dica: { color: colors.textoTerciario, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row' },
  principalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs, marginBottom: spacing.xs,
  },
  principalLabel: { color: colors.texto, fontSize: 14 },
})
