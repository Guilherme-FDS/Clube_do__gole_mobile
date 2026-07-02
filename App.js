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
import EditarPerfilScreen from './src/screens/EditarPerfilScreen'
import EnderecosScreen from './src/screens/EnderecosScreen'
import SegurancaScreen from './src/screens/SegurancaScreen'
import MeusPedidosScreen from './src/screens/MeusPedidosScreen'
import SobreScreen from './src/screens/SobreScreen'
import FAQScreen from './src/screens/FAQScreen'
import BlogScreen from './src/screens/BlogScreen'
import BlogPostScreen from './src/screens/BlogPostScreen'
import ContatoScreen from './src/screens/ContatoScreen'
import CorporativoScreen from './src/screens/CorporativoScreen'
import EnvioDevolucoesScreen from './src/screens/EnvioDevolucoesScreen'
import PoliticaReembolsoScreen from './src/screens/PoliticaReembolsoScreen'

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
          <Stack.Screen
            name="EditarPerfil"
            component={EditarPerfilScreen}
            options={{
              title: 'Editar perfil',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Enderecos"
            component={EnderecosScreen}
            options={{
              title: 'Meus endereços',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Seguranca"
            component={SegurancaScreen}
            options={{
              title: 'Segurança',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="MeusPedidos"
            component={MeusPedidosScreen}
            options={{
              title: 'Meus pedidos',
              headerStyle: { backgroundColor: colors.fundoSecundario },
              headerTintColor: colors.dourado,
              headerTitleStyle: { color: colors.texto },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'FAQ', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="Blog" component={BlogScreen} options={{ title: 'Blog', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="BlogPost" component={BlogPostScreen} options={{ title: 'Post', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="Contato" component={ContatoScreen} options={{ title: 'Contato', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="Corporativo" component={CorporativoScreen} options={{ title: 'Corporativo', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="EnvioDevolucoes" component={EnvioDevolucoesScreen} options={{ title: 'Envio e Devoluções', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
          <Stack.Screen name="PoliticaReembolso" component={PoliticaReembolsoScreen} options={{ title: 'Política de Reembolso', headerStyle: { backgroundColor: colors.fundoSecundario }, headerTintColor: colors.dourado, headerTitleStyle: { color: colors.texto }, headerShadowVisible: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}
