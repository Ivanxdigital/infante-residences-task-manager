import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { CircleCheck as CheckCircle2, ListTodo, Settings, ShieldCheck, Home } from 'lucide-react-native';
import { isAdmin } from '../../lib/profiles';

export default function TabLayout() {
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdmin();
        setUserIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
        },
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
          fontSize: 18,
          color: '#000000',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          headerTitle: 'Infante Residences',
          tabBarIcon: ({ color, size }) => <CheckCircle2 size={size} color={color} />,
        }}
      />
      {userIsAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            headerTitle: 'Infante Residences',
            tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          headerTitle: 'Infante Residences',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          headerTitle: 'Infante Residences',
          tabBarIcon: ({ color, size }) => <ListTodo size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Infante Residences',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}