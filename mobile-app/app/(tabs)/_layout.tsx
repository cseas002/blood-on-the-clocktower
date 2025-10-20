import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Text, StyleSheet, Pressable } from 'react-native';

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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Grimoire',
          tabBarIcon: () => <Text style={styles.icon}>🏠</Text>,
          tabBarButton: (props) => {
            const { style, ...restProps } = props;
            return (
              <Pressable
                {...(restProps as any)}
                style={[
                  style,
                  { borderRightWidth: 1, borderRightColor: '#333333' },
                  props.accessibilityState?.selected && { backgroundColor: '#e94560' }
                ]}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Characters',
          tabBarIcon: () => <Text style={styles.icon}>📖</Text>,
          tabBarButton: (props) => {
            const { style, ...restProps } = props;
            return (
              <Pressable
                {...(restProps as any)}
                style={[
                  style,
                  { borderRightWidth: 1, borderRightColor: '#333333' },
                  props.accessibilityState?.selected && { backgroundColor: '#e94560' }
                ]}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="night-order"
        options={{
          title: 'Night Order',
          tabBarIcon: () => <Text style={styles.icon}>🌙</Text>,
          tabBarButton: (props) => {
            const { style, ...restProps } = props;
            return (
              <Pressable
                {...(restProps as any)}
                style={[
                  style,
                  { borderRightWidth: 1, borderRightColor: '#333333' },
                  props.accessibilityState?.selected && { backgroundColor: '#e94560' }
                ]}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <Text style={styles.icon}>⚙️</Text>,
          tabBarButton: (props) => {
            const { style, ...restProps } = props;
            return (
              <Pressable
                {...(restProps as any)}
                style={[
                  style,
                  { borderRightWidth: 0 },
                  props.accessibilityState?.selected && { backgroundColor: '#e94560' }
                ]}
              />
            );
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 30,
  },
});
