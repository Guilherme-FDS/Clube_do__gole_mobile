import React, { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { colors, gradients, spacing, radius, shadow } from '../theme'
import Campo from '../components/Campo'
import { useAuth } from '../context/AuthContext'
import { validarSenha } from '../utils/validarSenha'
import DateTimePicker from '@react-native-community/datetimepicker'
import { limitesNascimento, dataParaISO, dataParaBR } from '../utils/datas'
import api from '../services/api'
import { buildGoogleAuthUrl, buildFacebookAuthUrl, extrairCode } from '../services/oauth'

export default function LoginScreen({ navigation }) {
  const { login, cadastro, loginOAuth } = useAuth()
  const [modo, setModo] = useState('login')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [linkEnviado, setLinkEnviado] = useState(false)

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

  async function entrarSocial(provider) {
    const returnUrl = Linking.createURL('oauth')
    const authUrl = provider === 'google' ? buildGoogleAuthUrl(returnUrl) : buildFacebookAuthUrl(returnUrl)
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl)
      if (result.type !== 'success') return // usuário cancelou — sem alert
      const code = extrairCode(result.url)
      if (!code) return
      setLoading(true)
      await loginOAuth(code, provider)
      navigation.goBack()
    } catch (e) {
      const msg = e?.response?.data?.detail
      Alert.alert('Erro', String(msg || 'Não foi possível entrar. Tente novamente.'))
    } finally { setLoading(false) }
  }

  async function enviarLinkRecuperacao() {
    if (!emailRecuperacao.trim()) { Alert.alert('Atenção', 'Informe o email.'); return }
    setLoading(true)
    try {
      await api.post('/auth/esqueceu-senha', { email: emailRecuperacao.trim() })
      setLinkEnviado(true)
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar. Tente novamente.')
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
              {modo === 'login' ? 'Bem-vindo de volta' : modo === 'esqueci' ? 'Recuperar senha' : 'Criar conta'}
            </Text>
            <Text style={styles.sub}>
              {modo === 'login'
                ? 'Acesse sua conta para acompanhar sua assinatura.'
                : modo === 'esqueci'
                  ? 'Informe seu email e enviaremos um link de recuperação.'
                  : 'Torne-se membro e descubra experiências exclusivas.'}
            </Text>
          </View>

          {modo === 'esqueci' ? (
            linkEnviado ? (
              <>
                <Text style={styles.sucessoTexto}>
                  Se este email estiver cadastrado, você receberá um link de recuperação.{'\n\n'}
                  O link abre no navegador do celular para criar a nova senha.
                </Text>
                <BotaoGold titulo="Voltar ao login" onPress={() => { setModo('login'); setLinkEnviado(false) }} />
              </>
            ) : (
              <>
                <Campo label="E-mail cadastrado">
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textoTerciario}
                    value={emailRecuperacao}
                    onChangeText={setEmailRecuperacao}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </Campo>
                <BotaoGold titulo="Enviar link" onPress={enviarLinkRecuperacao} loading={loading} />
              </>
            )
          ) : modo === 'login' ? (
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
              <TouchableOpacity onPress={() => setModo('esqueci')} style={{ marginTop: spacing.sm }}>
                <Text style={styles.esqueciLink}>Esqueceu sua senha?</Text>
              </TouchableOpacity>

              <View style={styles.ouRow}>
                <View style={styles.ouLinha} />
                <Text style={styles.ouTexto}>ou</Text>
                <View style={styles.ouLinha} />
              </View>
              <TouchableOpacity style={styles.socialBtn} onPress={() => entrarSocial('google')} disabled={loading}>
                <Text style={styles.socialBtnText}>Entrar com Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => entrarSocial('facebook')} disabled={loading}>
                <Text style={styles.socialBtnText}>Entrar com Facebook</Text>
              </TouchableOpacity>
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
                    themeVariant="light"
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

          {modo !== 'esqueci' && (
            <TouchableOpacity onPress={() => setModo(modo === 'login' ? 'cadastro' : 'login')}>
              <Text style={styles.trocaTexto}>
                {modo === 'login' ? 'Ainda não é membro? ' : 'Já tem conta? '}
                <Text style={styles.trocaLink}>
                  {modo === 'login' ? 'Criar conta' : 'Entrar'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }}>
            <Text style={styles.voltarTexto}>← Voltar</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

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
  esqueciLink: { color: colors.dourado, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  sucessoTexto: { color: colors.textoSecundario, fontSize: 14, lineHeight: 21, marginBottom: spacing.md },
  ouRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: spacing.md },
  ouLinha: { flex: 1, height: 1, backgroundColor: colors.bordaCard },
  ouTexto: { color: colors.textoTerciario, fontSize: 12 },
  socialBtn: {
    borderWidth: 1, borderColor: colors.bordaCard, borderRadius: radius.pill,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.xs,
    backgroundColor: colors.fundoCard,
  },
  socialBtnText: { color: colors.texto, fontSize: 15, fontWeight: '600' },
})
