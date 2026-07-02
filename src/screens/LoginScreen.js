import React, { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, spacing, radius, shadow } from '../theme'
import { useAuth } from '../context/AuthContext'
import { validarSenha } from '../utils/validarSenha'
import DateTimePicker from '@react-native-community/datetimepicker'
import { limitesNascimento, dataParaISO, dataParaBR } from '../utils/datas'

export default function LoginScreen({ navigation }) {
  const { login, cadastro } = useAuth()
  const [modo, setModo] = useState('login')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNasc, setDataNasc] = useState(null) // Date | null
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const limites = limitesNascimento()
  const [emailCad, setEmailCad] = useState('')
  const [senhaCad, setSenhaCad] = useState('')

  const erroSenhaCad = senhaCad ? validarSenha(senhaCad) : null

  async function entrar() {
    if (!email || !senha) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return }
    setLoading(true)
    try {
      await login(email.trim(), senha)
      navigation.goBack()
    } catch (e) {
      const msg = e?.response?.data?.detail || 'E-mail ou senha inválidos.'
      Alert.alert('Erro', String(Array.isArray(msg) ? msg[0]?.msg || JSON.stringify(msg) : msg))
    } finally { setLoading(false) }
  }

  async function criar() {
    if (!nome || !sobrenome || !cpf || !telefone || !emailCad || !senhaCad) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    const erroSenha = validarSenha(senhaCad)
    if (erroSenha) { Alert.alert('Atenção', erroSenha); return }
    if (!dataNasc) { Alert.alert('Atenção', 'Selecione sua data de nascimento.'); return }
    setLoading(true)
    try {
      await cadastro({
        nome, sobrenome,
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, ''),
        data_nascimento: dataParaISO(dataNasc),
        email: emailCad.trim(),
        senha: senhaCad,
      })
      navigation.goBack()
    } catch (e) {
      const detail = e?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || d).join('\n')
        : (detail || 'Erro ao criar conta. Verifique os dados.')
      Alert.alert('Erro', String(msg))
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadow.forte]}>

          <View style={styles.headerCard}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>✦ CLUBE DO GOLE</Text>
            </View>
            <Text style={styles.titulo}>
              {modo === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
            </Text>
            <Text style={styles.sub}>
              {modo === 'login'
                ? 'Acesse sua conta para acompanhar sua assinatura.'
                : 'Torne-se membro e descubra experiências exclusivas.'}
            </Text>
          </View>

          {modo === 'login' ? (
            <>
              <Campo label="E-mail">
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textoTerciario}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </Campo>
              <Campo label="Senha">
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textoTerciario}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />
              </Campo>
              <BotaoGold titulo="Entrar" onPress={entrar} loading={loading} />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Campo label="Nome">
                    <TextInput
                      style={styles.input}
                      placeholder="João"
                      placeholderTextColor={colors.textoTerciario}
                      value={nome}
                      onChangeText={setNome}
                    />
                  </Campo>
                </View>
                <View style={{ width: spacing.sm }} />
                <View style={{ flex: 1 }}>
                  <Campo label="Sobrenome">
                    <TextInput
                      style={styles.input}
                      placeholder="Silva"
                      placeholderTextColor={colors.textoTerciario}
                      value={sobrenome}
                      onChangeText={setSobrenome}
                    />
                  </Campo>
                </View>
              </View>
              <Campo label="CPF">
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.textoTerciario}
                  value={cpf}
                  onChangeText={setCpf}
                  keyboardType="numeric"
                />
              </Campo>
              <Campo label="Telefone">
                <TextInput
                  style={styles.input}
                  placeholder="(44) 99999-9999"
                  placeholderTextColor={colors.textoTerciario}
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                />
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
              <Campo label="E-mail">
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textoTerciario}
                  value={emailCad}
                  onChangeText={setEmailCad}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </Campo>
              <Campo label="Senha">
                <TextInput
                  style={styles.input}
                  placeholder="8+ caracteres, com maiúscula, minúscula e número"
                  placeholderTextColor={colors.textoTerciario}
                  value={senhaCad}
                  onChangeText={setSenhaCad}
                  secureTextEntry
                />
                {erroSenhaCad ? <Text style={styles.erroCampo}>{erroSenhaCad}</Text> : null}
              </Campo>
              <BotaoGold titulo="Criar conta" onPress={criar} loading={loading} />
            </>
          )}

          <View style={styles.divisor} />

          <TouchableOpacity onPress={() => setModo(modo === 'login' ? 'cadastro' : 'login')}>
            <Text style={styles.trocaTexto}>
              {modo === 'login' ? 'Ainda não é membro? ' : 'Já tem conta? '}
              <Text style={styles.trocaLink}>
                {modo === 'login' ? 'Criar conta' : 'Entrar'}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }}>
            <Text style={styles.voltarTexto}>← Voltar</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Campo({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={campoStyles.label}>{label}</Text>
      {children}
    </View>
  )
}

const campoStyles = StyleSheet.create({
  label: { color: colors.textoSecundario, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
})

function BotaoGold({ titulo, onPress, loading }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} style={{ marginTop: spacing.xs }} activeOpacity={0.85}>
      <LinearGradient
        colors={gradients.dourado}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center' }}
      >
        {loading
          ? <ActivityIndicator color="#1b1a19" />
          : <Text style={{ color: '#1b1a19', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }}>{titulo}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fundo },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.md, paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.fundoSecundario,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bordaCard,
    padding: spacing.lg,
  },
  headerCard: { marginBottom: spacing.md },
  badgePill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borda,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.sm,
  },
  badgePillText: { color: colors.dourado, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  titulo: { color: colors.texto, fontSize: 26, fontWeight: '700', marginBottom: 6 },
  sub: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: 'row' },
  input: {
    backgroundColor: colors.fundoCard,
    color: colors.texto,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.bordaCard,
  },
  divisor: {
    height: 1, backgroundColor: colors.bordaCard,
    marginVertical: spacing.md,
  },
  trocaTexto: { color: colors.textoSecundario, fontSize: 14, textAlign: 'center' },
  trocaLink: { color: colors.dourado, fontWeight: '700' },
  voltarTexto: { color: colors.textoTerciario, fontSize: 14, textAlign: 'center' },
  erroCampo: { color: colors.erro, fontSize: 12, marginTop: 6 },
})
