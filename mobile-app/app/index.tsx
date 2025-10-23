import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import { useGame } from "../context/GameContext";
import { troubleBrewingCharacters } from "../data/characters";

const DEV_MODE = true; // Set to false in production

export default function Index() {
  const router = useRouter();
  const { quickSetup } = useGame();

  // Dev mode: Quick setup with random 8 characters and players
  const quickDevSetup = () => {
    const playerCount = 8;

    // Character distribution for 8 players: 5 townsfolk, 1 outsider, 1 minion, 1 demon
    // If Baron is picked, add 2 more outsiders (reducing townsfolk by 2)

    // Separate characters by team
    const townsfolk = troubleBrewingCharacters.filter(c => c.team === 'townsfolk');
    const outsiders = troubleBrewingCharacters.filter(c => c.team === 'outsider');
    const minions = troubleBrewingCharacters.filter(c => c.team === 'minion');
    const demons = troubleBrewingCharacters.filter(c => c.team === 'demon');

    // Randomly pick 1 demon
    const selectedDemon = demons[Math.floor(Math.random() * demons.length)];

    // Randomly pick 1 minion
    const selectedMinion = minions[Math.floor(Math.random() * minions.length)];

    // Check if Baron is selected
    const isBaron = selectedMinion.id === 'baron';

    // Calculate how many of each type we need
    let townsfolkCount = isBaron ? 3 : 5; // 5 normally, 3 if Baron
    let outsiderCount = isBaron ? 3 : 1;  // 1 normally, 3 if Baron (drunk + 2 others)

    // Always include Drunk as one of the outsiders
    const drunk = outsiders.find(c => c.id === 'drunk')!;
    const otherOutsiders = outsiders.filter(c => c.id !== 'drunk');

    // Randomly select remaining outsiders
    const shuffledOtherOutsiders = [...otherOutsiders].sort(() => Math.random() - 0.5);
    const selectedOutsiders = [drunk, ...shuffledOtherOutsiders.slice(0, outsiderCount - 1)];

    // Randomly select townsfolk
    const shuffledTownsfolk = [...townsfolk].sort(() => Math.random() - 0.5);
    const selectedTownsfolk = shuffledTownsfolk.slice(0, townsfolkCount);

    // Combine all selected characters
    const selected = [...selectedTownsfolk, ...selectedOutsiders, selectedMinion, selectedDemon];

    // Create 8 random player names
    const playerNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

    // Setup everything atomically
    quickSetup(selected, playerNames);

    // Navigate to grimoire
    setTimeout(() => {
      router.push("/(tabs)");
    }, 100);
  };

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

        {/* Dev Mode Quick Setup */}
        {DEV_MODE && (
          <TouchableOpacity
            style={styles.devButton}
            onPress={quickDevSetup}
          >
            <Text style={styles.devButtonText}>⚡ Quick Setup (Dev)</Text>
            <Text style={styles.devButtonSubtext}>Skip to grimoire with 8 random characters</Text>
          </TouchableOpacity>
        )}
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
  devButton: {
    backgroundColor: '#4ecca3',
    borderRadius: 15,
    padding: 25,
    marginTop: 30,
    width: '100%',
    maxWidth: 300,
    borderWidth: 2,
    borderColor: '#3dbb91',
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  devButtonSubtext: {
    fontSize: 13,
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
