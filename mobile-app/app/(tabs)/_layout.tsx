import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.primary,
          borderTopWidth: 2,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        // Enable swipe gestures
        swipeEnabled: true,
        lazy: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Grimoire',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={[styles.icon, { color, fontSize: size || 24 }]}>
              🏠
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Characters',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={[styles.icon, { color, fontSize: size || 24 }]}>
              📖
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="night-order"
        options={{
          title: 'Night Order',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={[styles.icon, { color, fontSize: size || 24 }]}>
              🌙
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={[styles.icon, { color, fontSize: size || 24 }]}>
              ⚙️
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});
