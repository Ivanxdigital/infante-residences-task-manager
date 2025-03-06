import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { isAuthenticated, onAuthStateChange } from '../lib/auth';
import { View, ActivityIndicator, Text } from 'react-native';
import { areNotificationsEnabled, registerForPushNotifications } from '../lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
    };

    // Set up auth state listener
    const { data: authListener } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setIsUserAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsUserAuthenticated(false);
      }
    });

    // Initialize push notifications if enabled
    const initNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      if (enabled) {
        await registerForPushNotifications();
      }
    };

    checkAuth();
    initNotifications();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isUserAuthenticated !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isUserAuthenticated]);

  if (!loaded || isUserAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" redirect={!isUserAuthenticated} />
      <Stack.Screen name="login" redirect={isUserAuthenticated} />
    </Stack>
  );
}