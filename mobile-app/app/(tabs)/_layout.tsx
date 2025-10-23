import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Text, View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#e94560',
          borderTopWidth: 3,
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#666666',
        tabBarShowLabel: false,
        tabBarItemStyle: {
          borderRightWidth: 1,
          borderRightColor: '#333333',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Grimoire',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeTab]}>
              <Text style={styles.icon}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Characters',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeTab]}>
              <Text style={styles.icon}>📖</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="night-order"
        options={{
          title: 'Night Order',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeTab]}>
              <Text style={styles.icon}>🌙</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, styles.lastIcon, focused && styles.activeTab]}>
              <Text style={styles.icon}>⚙️</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    gap: 5,
  },
  lastIcon: {
    borderRightWidth: 0,
  },
  icon: {
    fontSize: 30,
    marginBottom: -10,
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
  },
  activeIndicator: {
    width: 35,
    height: 1,
    backgroundColor: '#e94560',
    borderRadius: 2,
  },
});
