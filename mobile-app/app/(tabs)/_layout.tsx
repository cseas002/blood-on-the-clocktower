import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.primary,
          borderTopWidth: 2,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIconStyle: { display: "none" },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Grimoire',
          tabBarLabel: '🏠 Grimoire',
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Characters',
          tabBarLabel: '📖 Characters',
        }}
      />
      <Tabs.Screen
        name="night-order"
        options={{
          title: 'Night Order',
          tabBarLabel: '🌙 Night',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: '⚙️ Settings',
        }}
      />
    </Tabs>
  );
}
