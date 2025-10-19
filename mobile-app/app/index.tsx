import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Blood on the Clocktower</Text>
        <Text style={styles.subtitle}>Choose your role</Text>
      </View>

      {/* Role Selection */}
      <View style={styles.content}>
        <Text style={styles.questionText}>I am ...</Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => router.push("/setup")}
        >
          <Text style={styles.roleButtonText}>Storyteller</Text>
          <Text style={styles.roleButtonSubtext}>Run the game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => router.push("/player")}
        >
          <Text style={styles.roleButtonText}>Player</Text>
          <Text style={styles.roleButtonSubtext}>Join a game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.accent,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionText: {
    fontSize: 24,
    color: Colors.text,
    marginBottom: 40,
    fontWeight: '600',
  },
  roleButton: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 8,
  },
  roleButtonSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
