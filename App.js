import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthProvider } from './src/context/AuthContext'
import { colors } from './src/theme'
import AgeGate from './src/components/AgeGate'
import HomeScreen from './src/screens/HomeScreen'
import AssinaturaScreen from './src/screens/AssinaturaScreen'
import ComunidadeScreen from './src/screens/ComunidadeScreen'
import PerfilScreen from './src/screens/PerfilScreen'
import LoginScreen from './src/screens/LoginScreen'
import CarrinhoScreen from './src/screens/CarrinhoScreen'
import CheckoutScreen from './src/screens/CheckoutScreen'
import EnderecoFormScreen from './src/screens/EnderecoFormScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.fundo,
    card: colors.fundoSecundario,
    text: colors.texto,
    primary: colors.dourado,
    border: colors.bordaCard,
    notification: colors.dourado,
  },
}

const ICONES = { Home: '🏠', Assinatura: '🥃', Comunidade: '🥂', Perfil: '👤' }

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitle: 'Clube do Gole',
        headerTitleStyle: { color: colors.dourado, fontWeight: '700', fontSize: 17 },
        headerStyle: { backgroundColor: colors.fundoSecundario },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.dourado,
        tabBarInactiveTintColor: colors.textoTerciario,
        tabBarStyle: {
          backgroundColor: colors.fundoSecundario,
          borderTopColor: colors.bordaCard,
          borderTopWidth: 1,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.45 }}>{ICONES[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Assinatura" component={AssinaturaScreen} />
      <Tab.Screen name="Comunidade" component={ComunidadeScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [idadeVerificada, setIdadeVerificada] = useState(null) // null = carregando

  useEffect(() => {
    AsyncStorage.getItem('age_verified').then(v => setIdadeVerificada(v === 'true'))
  }, [])

  if (idadeVerificada === null) return null

  if (!idadeVerificada) {
    return (
      <AgeGate onConfirmar={async () => {
        await AsyncStorage.setItem('age_verified', 'true')
        setIdadeVerificada(true)
      }} />
    )
  }

  return (
    <AuthProvider>
      <NavigationContainer theme={tema}>
        <StatusBar style="dark" />
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              presentation: 'modal',
              title: 'Entrar',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Carrinho"
            component={CarrinhoScreen}
            options={{
              title: 'Carrinho',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              title: 'Finalizar compra',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="EnderecoForm"
            component={EnderecoFormScreen}
            options={{
              presentation: 'modal',
              title: 'Endereço',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}
