import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput, Modal, Pressable, Alert, Dimensions, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { Player } from "../../types/game";
import { TEAM_COLORS } from "../../constants/Colors";

const { width, height } = Dimensions.get('window');

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

  // Calculate position for tokens in a circle
  const getCirclePosition = (index: number, total: number) => {
    const radius = Math.min(width, height - 300) * 0.35; // Circle radius
    const centerX = width / 2;
    const centerY = (height - 200) / 2; // Adjusted for header and stats

    // Start from top (270 degrees) and go clockwise
    const angle = (270 + (360 / total) * index) * (Math.PI / 180);

    return {
      left: centerX + radius * Math.cos(angle) - 50, // -50 to center the token (token width/2)
      top: centerY + radius * Math.sin(angle) - 50, // -50 to center the token (token height/2)
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Grimoire</Text>
        <Text style={styles.subtitle}>Storyteller&apos;s Board</Text>
      </View>

      {/* Game Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Players</Text>
          <Text style={styles.statValue}>{gameState.players.length}/{gameState.selectedCharacters.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Alive</Text>
          <Text style={styles.statValue}>{gameState.players.filter(p => !p.isDead).length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Characters</Text>
          <Text style={styles.statValue}>{gameState.selectedCharacters.length}</Text>
        </View>
      </View>

      {/* Grimoire Board - Show characters with assigned players */}
      <ScrollView style={styles.grimoire} contentContainerStyle={styles.grimoireContent}>
        {gameState.selectedCharacters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No characters selected</Text>
            <Text style={styles.emptyStateSubtext}>Set up your game first</Text>
          </View>
        ) : (
          <View style={styles.circleContainer}>
            {gameState.selectedCharacters.map((character, index) => {
              const assignedPlayer = gameState.players.find(p => p.character?.id === character.id);

              // Check if this character is being impersonated by a drunk
              const isImpersonatedByDrunk = Object.values(gameState.drunkImpersonations).some(impersonated =>
                impersonated.id === character.id
              );

              // Check if this character is the drunk
              const isDrunk = character.id === 'drunk';
              const drunkImpersonation = isDrunk ? gameState.drunkImpersonations[character.id] : null;

              // Determine if this character should have a remove button
              const shouldShowRemoveButton = !isImpersonatedByDrunk && assignedPlayer;

              const position = getCirclePosition(index, gameState.selectedCharacters.length);

              return (
                <View
                  key={character.id}
                  style={[
                    styles.tokenWrapper,
                    {
                      position: 'absolute',
                      ...position
                    }
                  ]}
                >
                  {/* Player number badge */}
                  {assignedPlayer && (
                    <View style={[
                      styles.playerNumberBadge,
                      { backgroundColor: assignedPlayer.isDead ? '#666' : '#3b82f6' }
                    ]}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.characterToken,
                      {
                        borderColor: TEAM_COLORS[character.team],
                        backgroundColor: assignedPlayer ? '#f5f5dc' : '#2d2d2d',
                      },
                      assignedPlayer?.isDead && styles.characterTokenDead
                    ]}
                    onPress={() => assignedPlayer && handlePlayerPress(assignedPlayer)}
                    onLongPress={() => shouldShowRemoveButton && handleRemovePlayer(assignedPlayer.id)}
                  >
                    {/* Character icon */}
                    <Image
                      source={character.icon}
                      style={styles.characterIcon}
                      resizeMode="contain"
                    />

                    {/* Player name overlay */}
                    {assignedPlayer && (
                      <View style={styles.playerNameOverlay}>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {assignedPlayer.name}
                        </Text>
                      </View>
                    )}

                    {assignedPlayer?.isDead && (
                      <View style={styles.deathOverlay}>
                        <Text style={styles.deathText}>✕</Text>
                      </View>
                    )}
                    {assignedPlayer?.reminders && assignedPlayer.reminders.length > 0 && (
                      <View style={styles.reminderBadge}>
                        <Text style={styles.reminderBadgeText}>{assignedPlayer.reminders.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
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
                        pathname: "/assign-character",
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
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2d2d2d',
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
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#1d1d1d',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  grimoire: {
    flex: 1,
  },
  grimoireContent: {
    padding: 20,
    paddingBottom: 100,
    minHeight: height - 200,
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
    color: '#667',
  },
  circleContainer: {
    width: width,
    height: height - 200,
    position: 'relative',
  },
  tokenWrapper: {
    width: 100,
    height: 100,
  },
  playerNumberBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  playerNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  characterToken: {
    width: 100,
    height: 100,
    backgroundColor: '#2d2d2d',
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  characterIcon: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playerNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  characterTokenDead: {
    opacity: 0.6,
  },
  characterTokenContent: {
    alignItems: 'center',
    width: '100%',
  },
  characterName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 12,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  unassignedText: {
    color: '#999999',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  drunkNote: {
    color: '#ffa502',
    fontSize: 12,
    fontStyle: 'italic',
  },
  drunkThinks: {
    color: '#4ecca3',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  reminderBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ffa502',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  reminderBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deathOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deathText: {
    fontSize: 60,
    color: '#e94560',
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
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
    backgroundColor: '#3d3d3d',
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
    backgroundColor: '#667',
  },
  addButtonModal: {
    backgroundColor: '#e94560',
  },
  deadButton: {
    backgroundColor: '#667',
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
    backgroundColor: '#1d1d1d',
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
    backgroundColor: '#000000',
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
