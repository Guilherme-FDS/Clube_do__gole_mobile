import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoreSession()
  }, [])

  async function restoreSession() {
    try {
      const token = await AsyncStorage.getItem('token')
      if (token) {
        const { data } = await api.get('/auth/me')
        setUser(data)
      }
    } catch {
      await AsyncStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha, guest_carrinho: [] })
    const token = data.access_token || data.token
    await AsyncStorage.setItem('token', token)
    const me = await api.get('/auth/me')
    setUser(me.data)
    return me.data
  }

  // cadastro espera o schema completo do backend:
  // { cpf, nome, sobrenome, data_nascimento, email, senha, telefone }
  async function cadastro(campos) {
    await api.post('/auth/cadastro', campos)
    return login(campos.email, campos.senha)
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch {}
    await AsyncStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, cadastro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
