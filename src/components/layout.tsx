// app/_layout.tsx
import { AuthProvider } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

// Evita que o splash screen se esconda automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'GeistSans': require('../assets/fonts/GeistSans.ttf'),
    'GeistMono': require('../assets/fonts/GeistMono.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Mostra o splash screen enquanto as fontes carregam
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontFamily: 'GeistSans',
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Controla+ - Início'
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            title: 'Login'
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            headerShown: false,
            title: 'Cadastro'
          }} 
        />
        <Stack.Screen 
          name="dashboard" 
          options={{ 
            headerShown: false,
            title: 'Dashboard'
          }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{ 
            title: 'Página Não Encontrada'
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}