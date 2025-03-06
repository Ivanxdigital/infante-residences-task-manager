import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Bell, Moon, LogOut, Info, FileText, Shield } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { signOut } from '../../lib/auth';
import { router } from 'expo-router';
import { areNotificationsEnabled, toggleNotifications } from '../../lib/notifications';

export default function SettingsScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load notification settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const enabled = await areNotificationsEnabled();
        setNotificationsEnabled(enabled);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle toggling push notifications
  const handleToggleNotifications = async (value: boolean) => {
    try {
      setIsLoading(true);
      await toggleNotifications(value);
      setNotificationsEnabled(value);
      
      if (value) {
        Alert.alert(
          'Notifications Enabled',
          'You will now receive notifications when new tasks are added.'
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
      // Revert the switch state on error
      setNotificationsEnabled(!value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              // Navigation will be handled by the auth state listener in _layout.tsx
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize Infante Residences preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Bell size={20} color="#64748b" />
            <Text style={styles.settingText}>Push Notifications</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0891b2" />
          ) : (
            <Switch
              trackColor={{ false: '#cbd5e1', true: '#0891b2' }}
              thumbColor="#ffffff"
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
            />
          )}
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Moon size={20} color="#64748b" />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            trackColor={{ false: '#cbd5e1', true: '#0891b2' }}
            thumbColor="#ffffff"
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Pressable style={styles.aboutItem}>
          <View style={styles.settingInfo}>
            <Info size={20} color="#64748b" />
            <Text style={styles.aboutText}>Version 1.0.0</Text>
          </View>
        </Pressable>
        <Pressable style={styles.aboutItem}>
          <View style={styles.settingInfo}>
            <FileText size={20} color="#64748b" />
            <Text style={styles.aboutText}>Terms of Service</Text>
          </View>
        </Pressable>
        <Pressable style={styles.aboutItem}>
          <View style={styles.settingInfo}>
            <Shield size={20} color="#64748b" />
            <Text style={styles.aboutText}>Privacy Policy</Text>
          </View>
        </Pressable>
      </View>

      <Animatable.View 
        animation="fadeIn" 
        duration={800} 
        style={styles.signOutSection}
      >
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.7}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <LogOut size={20} color="#ffffff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
  },
  aboutItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  aboutText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
  },
  signOutSection: {
    padding: 16,
    marginTop: 32,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});