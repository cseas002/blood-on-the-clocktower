import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { useGame } from "../context/GameContext";
import { Colors } from "../constants/Colors";
import { Character, Player, ReminderToken } from "../types/game";

interface SetupStep {
  character: Character;
  instruction: string;
  reminderTokens: string[]; // The reminder tokens this character needs to place
  requiresPlayerSelection: boolean;
  multiSelect?: boolean; // For characters that need to select 2 players
  selectCount?: number; // Number of players to select
}

export default function SetupGuideScreen() {
  const router = useRouter();
  const { gameState, addReminderToken } = useGame();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Generate setup steps based on characters that need first night setup
  const setupSteps: SetupStep[] = useMemo(() => {
    const steps: SetupStep[] = [];

    // Sort characters by first night order
    const sortedCharacters = [...gameState.selectedCharacters]
      .filter(char => char.firstNightOrder !== undefined)
      .sort((a, b) => (a.firstNightOrder || 0) - (b.firstNightOrder || 0));

    sortedCharacters.forEach(character => {
      if (character.firstNightReminder && character.reminders && character.reminders.length > 0) {
        steps.push({
          character,
          instruction: character.firstNightReminder,
          reminderTokens: character.reminders,
          requiresPlayerSelection: true,
          multiSelect: character.id === 'washerwoman' || character.id === 'librarian' || character.id === 'investigator',
          selectCount: character.id === 'washerwoman' || character.id === 'librarian' || character.id === 'investigator' ? 2 : 1,
        });
      }
    });

    return steps;
  }, [gameState.selectedCharacters]);

  const currentStep = setupSteps[currentStepIndex];
  const isLastStep = currentStepIndex === setupSteps.length - 1;

  const handlePlayerSelect = (playerId: string) => {
    if (!currentStep.multiSelect) {
      setSelectedPlayers([playerId]);
      return;
    }

    const selectCount = currentStep.selectCount || 2;
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < selectCount) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleSelfSelect = () => {
    // Find the player who has this character
    const player = gameState.players.find(p => p.character?.id === currentStep.character.id);
    if (!player) return;

    // Automatically place tokens based on character type
    if (currentStep.character.id === 'washerwoman' ||
        currentStep.character.id === 'librarian' ||
        currentStep.character.id === 'investigator') {
      // These characters need to select 2 players
      // For demo purposes, we'll just complete the step
      // In a real game, the storyteller would have already selected players
      handleNextStep();
    } else {
      // Single-select characters
      handlePlayerSelect(player.id);
    }
  };

  const handleNextStep = () => {
    // Apply the tokens to the selected players
    if (selectedPlayers.length > 0 && currentStep.reminderTokens.length > 0) {
      selectedPlayers.forEach((playerId, index) => {
        const tokenText = currentStep.reminderTokens[index] || currentStep.reminderTokens[0];
        const token: ReminderToken = {
          id: Date.now().toString() + index,
          text: tokenText,
          characterId: currentStep.character.id,
          characterIcon: currentStep.character.icon,
        };
        addReminderToken(playerId, token);
      });
    }

    setSelectedPlayers([]);

    if (isLastStep) {
      setShowCompletionModal(true);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleSkipStep = () => {
    setSelectedPlayers([]);
    if (isLastStep) {
      setShowCompletionModal(true);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleComplete = () => {
    setShowCompletionModal(false);
    router.replace("/(tabs)");
  };

  if (setupSteps.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>First Night Setup</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No setup required</Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.continueButtonText}>Go to Grimoire</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>First Night Setup</Text>
          <Text style={styles.subtitle}>
            Step {currentStepIndex + 1} of {setupSteps.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Character */}
        <View style={styles.characterSection}>
          <Image source={currentStep.character.icon} style={styles.characterIcon} />
          <Text style={styles.characterName}>{currentStep.character.name}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionSection}>
          <Text style={styles.instructionTitle}>Storyteller Instructions:</Text>
          <Text style={styles.instructionText}>{currentStep.instruction}</Text>
        </View>

        {/* Reminder Tokens to Place */}
        {currentStep.reminderTokens.length > 0 && (
          <View style={styles.tokensSection}>
            <Text style={styles.tokensSectionTitle}>Tokens to place:</Text>
            <View style={styles.tokensList}>
              {currentStep.reminderTokens.map((token, index) => (
                <View key={index} style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>{token}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Player Selection */}
        {currentStep.requiresPlayerSelection && (
          <View style={styles.playerSelectionSection}>
            <Text style={styles.playerSelectionTitle}>
              Select {currentStep.multiSelect ? `${currentStep.selectCount || 2} players` : 'a player'}:
            </Text>
            <View style={styles.playerList}>
              {gameState.players.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerItem,
                    selectedPlayers.includes(player.id) && styles.playerItemSelected
                  ]}
                  onPress={() => handlePlayerSelect(player.id)}
                >
                  {player.character && (
                    <Image source={player.character.icon} style={styles.playerIcon} />
                  )}
                  <Text style={styles.playerName}>{player.name}</Text>
                  {player.character && (
                    <Text style={styles.playerCharacter}>({player.character.name})</Text>
                  )}
                  {selectedPlayers.includes(player.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Action: Select for myself */}
        <TouchableOpacity style={styles.selfSelectButton} onPress={handleSelfSelect}>
          <Text style={styles.selfSelectButtonText}>Select for Myself</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipStep}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedPlayers.length === 0 && styles.nextButtonDisabled
          ]}
          onPress={handleNextStep}
          disabled={selectedPlayers.length === 0}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? "Complete Setup" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={handleComplete}
      >
        <Pressable style={styles.modalOverlay} onPress={handleComplete}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Setup Complete!</Text>
            <Text style={styles.modalText}>
              First night setup is complete. You can now proceed to the game.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleComplete}>
              <Text style={styles.modalButtonText}>Go to Grimoire</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 32,
    color: Colors.accent,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.accent,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  characterSection: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 15,
  },
  characterIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  instructionSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  tokensSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 10,
  },
  tokensSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  tokensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tokenBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tokenBadgeText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  playerSelectionSection: {
    marginBottom: 20,
  },
  playerSelectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 15,
  },
  playerList: {
    gap: 10,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  playerItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  playerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  playerCharacter: {
    fontSize: 13,
    color: Colors.textMuted,
    marginRight: 10,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  selfSelectButton: {
    backgroundColor: Colors.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  selfSelectButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipButton: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  modalButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
