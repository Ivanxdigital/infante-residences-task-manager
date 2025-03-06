import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { isAuthenticated, onAuthStateChange } from '../lib/auth';
import { View, ActivityIndicator, Text } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsLoggedIn(authenticated);
        setAuthError(null);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoggedIn(false);
        setAuthError('Failed to check authentication status');
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      setIsLoggedIn(!!session);
      
      // Navigate based on auth state
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (authChecked && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
      
      // Initial navigation based on auth state
      if (!isLoggedIn) {
        router.replace('/login');
      }
    }
  }, [fontsLoaded, fontError, authChecked, isLoggedIn]);

  if (!fontsLoaded && !fontError || !authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0891b2" />
        {authError && (
          <Text style={{ marginTop: 10, color: 'red' }}>
            {authError}
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}