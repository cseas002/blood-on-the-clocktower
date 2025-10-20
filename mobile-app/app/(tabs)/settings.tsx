import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { gameState, resetGame } = useGame();

  const handleNewGame = () => {
    Alert.alert(
      "New Game",
      "Are you sure you want to start a new game? All current game data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "New Game",
          style: "destructive",
          onPress: () => {
            resetGame();
            Alert.alert("Success", "New game started!");
          }
        }
      ]
    );
  };

  const handleChangeRole = () => {
    Alert.alert(
      "Change Role",
      "Return to role selection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => router.replace("/")
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Storyteller Options</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Game Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Edition:</Text>
              <Text style={styles.infoValue}>Trouble Brewing</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Players:</Text>
              <Text style={styles.infoValue}>{gameState.players.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alive:</Text>
              <Text style={styles.infoValue}>
                {gameState.players.filter(p => !p.isDead).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Game Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Management</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleNewGame}
          >
            <Text style={styles.settingButtonText}>New Game</Text>
            <Text style={styles.settingButtonSubtext}>Clear all data and start fresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.disabledButton]}
            disabled
          >
            <Text style={[styles.settingButtonText, styles.disabledText]}>Export Game</Text>
            <Text style={[styles.settingButtonSubtext, styles.disabledText]}>
              Save game state (Coming soon)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.disabledButton]}
            disabled
          >
            <Text style={[styles.settingButtonText, styles.disabledText]}>Import Game</Text>
            <Text style={[styles.settingButtonSubtext, styles.disabledText]}>
              Load saved game (Coming soon)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Online Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Features</Text>

          <TouchableOpacity
            style={[styles.settingButton, styles.disabledButton]}
            disabled
          >
            <Text style={[styles.settingButtonText, styles.disabledText]}>Create Online Room</Text>
            <Text style={[styles.settingButtonSubtext, styles.disabledText]}>
              Host an online game (Coming soon)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.disabledButton]}
            disabled
          >
            <Text style={[styles.settingButtonText, styles.disabledText]}>Join Online Room</Text>
            <Text style={[styles.settingButtonSubtext, styles.disabledText]}>
              Connect to existing game (Coming soon)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Other */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other</Text>

          <TouchableOpacity
            style={[styles.settingButton, styles.dangerButton]}
            onPress={handleChangeRole}
          >
            <Text style={styles.settingButtonText}>Change Role</Text>
            <Text style={styles.settingButtonSubtext}>
              Return to role selection
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Blood on the Clocktower Grimoire</Text>
          <Text style={styles.appInfoText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  infoLabel: {
    fontSize: 16,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingButton: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 5,
  },
  settingButtonSubtext: {
    fontSize: 13,
    color: '#aaaaaa',
  },
  disabledButton: {
    borderColor: '#667',
    opacity: 0.5,
  },
  disabledText: {
    color: '#667',
  },
  dangerButton: {
    borderColor: '#ff6b6b',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  appInfoText: {
    fontSize: 12,
    color: '#667',
    marginBottom: 5,
  },
});
