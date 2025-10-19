import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function PlayerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Player Mode</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.comingSoonText}>Coming Soon!</Text>
        <Text style={styles.descriptionText}>
          Player mode will allow you to:
        </Text>
        <Text style={styles.featureText}>• View character reference</Text>
        <Text style={styles.featureText}>• See your assigned role</Text>
        <Text style={styles.featureText}>• Take personal notes</Text>
        <Text style={styles.featureText}>• Connect to online games</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 32,
    color: '#e94560',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
  },
  content: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 30,
  },
  descriptionText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 10,
  },
});
