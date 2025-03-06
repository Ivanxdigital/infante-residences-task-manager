import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { UserRole } from './profiles';

// Constants
const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Check if notifications are enabled
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return false;
  }
};

// Toggle notifications
export const toggleNotifications = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
    
    if (enabled) {
      await registerForPushNotifications();
    } else {
      // We don't unregister the token, just stop sending notifications
      // This way we don't need to re-request permissions
    }
  } catch (error) {
    console.error('Error toggling notifications:', error);
    throw error;
  }
};

// Register for push notifications
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If no existing permission, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If permission not granted, exit
    if (finalStatus !== 'granted') {
      console.log('Permission for notifications not granted!');
      return null;
    }
    
    // Get push token with projectId
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '4b17448b-8624-4f2c-9878-1b18076dc56b'
    })).data;
    
    // Store token in user's profile
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userData.user.id);
    }
    
    // Configure notifications for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0891b2',
      });
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Send notification to specific users
export const sendNotificationToUsers = async (
  userIds: string[],
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    // Get push tokens for the specified users
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);
    
    if (error) {
      console.error('Error fetching user push tokens:', error);
      return;
    }
    
    // Send notifications to each user with a push token
    for (const profile of profiles) {
      if (profile.push_token) {
        await sendPushNotification(profile.push_token, title, body, data);
      }
    }
  } catch (error) {
    console.error('Error sending notifications to users:', error);
  }
};

// Send notification to users with specific roles
export const sendNotificationToRoles = async (
  roles: UserRole[],
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    // Get push tokens for users with the specified roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('role', roles)
      .not('push_token', 'is', null);
    
    if (error) {
      console.error('Error fetching role push tokens:', error);
      return;
    }
    
    // Send notifications to each user with a push token
    for (const profile of profiles) {
      if (profile.push_token) {
        await sendPushNotification(profile.push_token, title, body, data);
      }
    }
  } catch (error) {
    console.error('Error sending notifications to roles:', error);
  }
};

// Send a push notification
const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}; 