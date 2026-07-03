import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors, spacing, radius, shadow } from '../theme'
import BotaoDourado from '../components/BotaoDourado'
import Campo from '../components/Campo'
import api from '../services/api'
import { limitesNascimento, dataParaISO, dataParaBR } from '../utils/datas'

export default function EditarPerfilScreen({ navigation }) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNasc, setDataNasc] = useState(null)
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cpfOriginal, setCpfOriginal] = useState('')

  const limites = limitesNascimento()

  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [])
  )

  async function carregar() {
    setCarregando(true)
    try {
      const { data } = await api.get('/configuracoes/perfil')
      const u = data.usuario || {}
      setNome(u.nome || '')
      setSobrenome(u.sobrenome || '')
      setEmail(u.email || '')
      setTelefone(u.telefone || '')
      setDataNasc(u.data_nascimento ? new Date(u.data_nascimento) : null)
      setCpf(u.cpf || '')
      setCpfOriginal(u.cpf || '')
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus dados.')
    } finally {
      setCarregando(false)
    }
  }

  async function salvar() {
    if (!nome || !sobrenome || !email || !telefone) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        nome, sobrenome, email, telefone,
        data_nascimento: dataNasc ? dataParaISO(dataNasc) : null,
      }
      if (!cpfOriginal && cpf) {
        payload.cpf = cpf.replace(/\D/g, '')
      }
      const { data } = await api.put('/configuracoes/perfil', payload)
      setCpf(data.cpf || '')
      setCpfOriginal(data.cpf || '')
      Alert.alert('Sucesso', 'Perfil atualizado.')
    } catch (e) {
      const detail = e?.response?.data?.detail
      Alert.alert('Erro', String(detail || 'Não foi possível salvar.'))
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.dourado} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.card, shadow.forte]}>
        <Campo label="Nome">
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Sobrenome">
          <TextInput style={styles.input} value={sobrenome} onChangeText={setSobrenome} placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="E-mail">
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Telefone">
          <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholderTextColor={colors.textoTerciario} />
        </Campo>
        <Campo label="Data de nascimento">
          <TouchableOpacity style={styles.input} onPress={() => setMostrarPicker(!mostrarPicker)}>
            <Text style={{ color: dataNasc ? colors.texto : colors.textoTerciario, fontSize: 15 }}>
              {dataNasc ? dataParaBR(dataNasc) : 'Selecionar data'}
            </Text>
          </TouchableOpacity>
          {mostrarPicker && (
            <DateTimePicker
              value={dataNasc || limites.max}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={limites.min}
              maximumDate={limites.max}
              onChange={(event, d) => {
                if (Platform.OS === 'android') setMostrarPicker(false)
                if (d) setDataNasc(d)
              }}
            />
          )}
        </Campo>
        <Campo label="CPF">
          {cpfOriginal ? (
            <>
              <View style={[styles.input, styles.inputTravado]}>
                <Text style={{ color: colors.textoSecundario, fontSize: 15 }}>{cpf}</Text>
              </View>
              <Text style={styles.dica}>Para alterar o CPF já cadastrado, contate o suporte.</Text>
            </>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.textoTerciario}
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              maxLength={14}
            />
          )}
        </Campo>
        <BotaoDourado title="Salvar alterações" onPress={salvar} loading={salvando} style={{ marginTop: spacing.md }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.fundo },
  card: {
    backgroundColor: colors.fundoSecundario, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.bordaCard, padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.fundoCard, color: colors.texto, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: colors.bordaCard,
  },
  inputTravado: { justifyContent: 'center', opacity: 0.7 },
  dica: { color: colors.textoTerciario, fontSize: 12, marginTop: 4 },
})
