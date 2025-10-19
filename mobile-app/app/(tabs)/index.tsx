import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput, Modal, Pressable, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { Player } from "../../types/game";

export default function GrimoireScreen() {
  const router = useRouter();
  const { gameState, addPlayer, removePlayer, togglePlayerDeath, addReminder, removeReminder } = useGame();
  const [isAddPlayerModalVisible, setIsAddPlayerModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddReminderModalVisible, setIsAddReminderModalVisible] = useState(false);
  const [newReminderText, setNewReminderText] = useState("");

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());
      setNewPlayerName("");
      setIsAddPlayerModalVisible(false);
    }
  };

  const handlePlayerPress = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleRemovePlayer = (playerId: string) => {
    Alert.alert(
      "Remove Player",
      "Are you sure you want to remove this player?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removePlayer(playerId) }
      ]
    );
  };

  const handleAddReminder = () => {
    if (selectedPlayer && newReminderText.trim()) {
      addReminder(selectedPlayer.id, {
        id: Date.now().toString(),
        text: newReminderText.trim(),
      });
      setNewReminderText("");
      setIsAddReminderModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Grimoire</Text>
        <Text style={styles.subtitle}>Storyteller's Board</Text>
      </View>

      {/* Player Count */}
      <View style={styles.playerCount}>
        <Text style={styles.playerCountText}>
          Players: {gameState.players.length}
        </Text>
        <Text style={styles.aliveCountText}>
          Alive: {gameState.players.filter(p => !p.isDead).length}
        </Text>
      </View>

      {/* Grimoire Board */}
      <ScrollView style={styles.grimoire} contentContainerStyle={styles.grimoireContent}>
        {gameState.players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No players yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap the + button to add players</Text>
          </View>
        ) : (
          <View style={styles.playerGrid}>
            {gameState.players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerToken,
                  player.isDead && styles.playerTokenDead
                ]}
                onPress={() => handlePlayerPress(player)}
                onLongPress={() => handleRemovePlayer(player.id)}
              >
                <View style={styles.playerTokenContent}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  {player.character && (
                    <Text style={styles.characterName}>{player.character.name}</Text>
                  )}
                  {player.reminders.length > 0 && (
                    <View style={styles.reminderBadge}>
                      <Text style={styles.reminderBadgeText}>{player.reminders.length}</Text>
                    </View>
                  )}
                </View>
                {player.isDead && (
                  <View style={styles.deathOverlay}>
                    <Text style={styles.deathText}>☠</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Player Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddPlayerModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Player Modal */}
      <Modal
        visible={isAddPlayerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddPlayerModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsAddPlayerModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add Player</Text>
            <TextInput
              style={styles.input}
              placeholder="Player name"
              placeholderTextColor="#888"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus
              onSubmitEditing={handleAddPlayer}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsAddPlayerModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButtonModal]}
                onPress={handleAddPlayer}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Player Detail Modal */}
      <Modal
        visible={selectedPlayer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedPlayer(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedPlayer && (
              <>
                <Text style={styles.modalTitle}>{selectedPlayer.name}</Text>
                {selectedPlayer.character && (
                  <>
                    <Text style={styles.characterDetailName}>{selectedPlayer.character.name}</Text>
                    <Text style={styles.characterAbility}>{selectedPlayer.character.ability}</Text>
                  </>
                )}
                {/* Reminders Section */}
                {selectedPlayer.reminders.length > 0 && (
                  <View style={styles.remindersSection}>
                    <Text style={styles.remindersSectionTitle}>Reminders:</Text>
                    {selectedPlayer.reminders.map(reminder => (
                      <View key={reminder.id} style={styles.reminderItem}>
                        <Text style={styles.reminderItemText}>{reminder.text}</Text>
                        <TouchableOpacity
                          onPress={() => removeReminder(selectedPlayer.id, reminder.id)}
                        >
                          <Text style={styles.removeReminderText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.assignButton]}
                    onPress={() => {
                      router.push({
                        pathname: "/storyteller/assign-character",
                        params: { playerId: selectedPlayer.id }
                      });
                      setSelectedPlayer(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Assign Role</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.reminderButton]}
                    onPress={() => setIsAddReminderModalVisible(true)}
                  >
                    <Text style={styles.buttonText}>Add Reminder</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, selectedPlayer.isDead ? styles.aliveButton : styles.deadButton]}
                    onPress={() => {
                      togglePlayerDeath(selectedPlayer.id);
                      setSelectedPlayer(null);
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {selectedPlayer.isDead ? "Mark Alive" : "Mark Dead"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setSelectedPlayer(null)}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal
        visible={isAddReminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddReminderModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsAddReminderModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TextInput
              style={styles.input}
              placeholder="Reminder text"
              placeholderTextColor="#888"
              value={newReminderText}
              onChangeText={setNewReminderText}
              autoFocus
              onSubmitEditing={handleAddReminder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsAddReminderModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButtonModal]}
                onPress={handleAddReminder}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 5,
  },
  playerCount: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#0f3460',
  },
  playerCountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  aliveCountText: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: '600',
  },
  grimoire: {
    flex: 1,
  },
  grimoireContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#888',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  playerToken: {
    width: 100,
    height: 100,
    backgroundColor: '#16213e',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  playerTokenDead: {
    borderColor: '#666',
    opacity: 0.6,
  },
  playerTokenContent: {
    alignItems: 'center',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  characterName: {
    color: '#e94560',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  reminderBadge: {
    position: 'absolute',
    top: -30,
    right: -30,
    backgroundColor: '#4ecca3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deathOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deathText: {
    fontSize: 40,
    color: '#ffffff',
  },
  addButton: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#e94560',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  addButtonModal: {
    backgroundColor: '#e94560',
  },
  deadButton: {
    backgroundColor: '#666',
  },
  aliveButton: {
    backgroundColor: '#4ecca3',
  },
  assignButton: {
    backgroundColor: '#4ecca3',
  },
  reminderButton: {
    backgroundColor: '#ffa502',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remindersSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#0f3460',
    borderRadius: 10,
  },
  remindersSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffa502',
    marginBottom: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 5,
    marginBottom: 5,
  },
  reminderItemText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  removeReminderText: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  characterDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ecca3',
    textAlign: 'center',
    marginBottom: 10,
  },
  characterAbility: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});
