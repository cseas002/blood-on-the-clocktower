import { StyleSheet, View, TouchableOpacity, Text, Modal, Image, Dimensions, TextInput, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback, useRef, useMemo } from "react";
import { useGame } from "../context/GameContext";
import { Colors } from "../constants/Colors";
import { Character } from "../types/game";

const { width, height } = Dimensions.get('window');

export default function TokenSelectionScreen() {
  const router = useRouter();
  const { gameState, assignCharacter, addPlayer } = useGame();
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [currentToken, setCurrentToken] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");

  // Track assignments to apply them all at once
  const assignmentsRef = useRef<Map<string, any>>(new Map());

  // Randomize the character order once when the component mounts
  const gameCharacters = useMemo(() => {
    const characters = [...gameState.selectedCharacters];
    // Fisher-Yates shuffle algorithm
    for (let i = characters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [characters[i], characters[j]] = [characters[j], characters[i]];
    }
    return characters;
  }, []);

  const handleTokenPress = (tokenNumber: number) => {
    if (selectedTokens.includes(tokenNumber)) {
      return; // Already selected
    }

    setCurrentToken(tokenNumber);
    setShowCharacterModal(true);
  };

  const handleCloseModal = () => {
    Keyboard.dismiss();
    setShowCharacterModal(false);
    setCurrentToken(null);
    setPlayerName("");
  };

  const handleCharacterConfirm = useCallback(() => {
    if (!currentToken || !playerName.trim()) {
      return;
    }

    // Dismiss keyboard first
    Keyboard.dismiss();

    const characterIndex = currentToken - 1;
    if (characterIndex >= gameCharacters.length) {
      return;
    }

    // Store the character to assign (actual character, not what we show)
    const actualCharacter = gameCharacters[characterIndex];
    const nameToAdd = playerName.trim();

    // Add to selected tokens
    const newSelectedTokens = [...selectedTokens, currentToken];
    setSelectedTokens(newSelectedTokens);

    // Add player
    addPlayer(nameToAdd);

    // Store the assignment to be applied later
    assignmentsRef.current.set(nameToAdd, actualCharacter);

    // Check if all tokens are selected
    if (newSelectedTokens.length >= gameCharacters.length) {
      setShowContinueButton(true);
    }

    // Close modal and reset
    setShowCharacterModal(false);
    setCurrentToken(null);
    setPlayerName("");
  }, [currentToken, playerName, gameCharacters, selectedTokens, addPlayer]);

  const handleContinue = useCallback(() => {
    try {
      // Assign all characters to their players before continuing
      const assignments = Array.from(assignmentsRef.current.entries());

      assignments.forEach(([playerName, character]) => {
        const player = gameState.players.find(p => p.name === playerName);
        if (player && !player.character) {
          // If the character is a Drunk, pass the impersonated townsfolk
          if (character.id === 'drunk') {
            const impersonatedCharacter = gameState.drunkImpersonations['drunk'];
            assignCharacter(player.id, character, impersonatedCharacter);
          } else {
            assignCharacter(player.id, character);
          }
        }
      });

      // Navigate to grimoire - use replace to avoid back navigation issues
      router.replace("/(tabs)");
    } catch (error) {
      console.error('Error in handleContinue:', error);
      // Fallback navigation even if there's an error
      router.replace("/(tabs)");
    }
  }, [gameState.players, gameState.drunkImpersonations, assignCharacter, router]);

  // Calculate positions for circular layout
  const getTokenPosition = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;

    // Calculate radius to use FULL screen width
    // Leave margin for token size and screen edges
    const tokenRadius = 35; // Fixed token radius
    const margin = 20; // Margin from screen edge
    const radius = (width / 2) - tokenRadius - margin;

    const centerX = width / 2;
    const centerY = height * 0.4; // Center vertically

    const angle = (index * angleStep) - Math.PI / 2; // Start from top

    return {
      left: centerX + radius * Math.cos(angle) - tokenRadius,
      top: centerY + radius * Math.sin(angle) - tokenRadius,
    };
  };

  // Get the character to display - if it's a Drunk, show the impersonated townsfolk instead
  const currentCharacter = currentToken ? (() => {
    const actualCharacter = gameCharacters[currentToken - 1];
    if (actualCharacter?.id === 'drunk') {
      const impersonatedCharacter = gameState.drunkImpersonations['drunk'];
      return impersonatedCharacter || actualCharacter;
    }
    return actualCharacter;
  })() : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Your Seat</Text>
          <Text style={styles.subtitle}>
            Tap your position to see your character.
          </Text>
        </View>
      </View>

      {/* Token Circle */}
      <View style={styles.circleContainer}>
        {/* Player tokens */}
        {Array.from({ length: gameCharacters.length }, (_, index) => {
          // Map index to token number: we want 1,2,3,4,5,6,7,8
          // but positioned with gap at bottom for storyteller
          const tokenNumber = index + 1;
          const isSelected = selectedTokens.includes(tokenNumber);
          const position = getTokenPosition(index, gameCharacters.length);

          return (
            <TouchableOpacity
              key={tokenNumber}
              style={[
                styles.token,
                position,
                isSelected && styles.tokenSelected
              ]}
              onPress={() => handleTokenPress(tokenNumber)}
              disabled={isSelected}
            >
              <View style={styles.tokenContent}>
                <Text style={styles.tokenNumber}>{tokenNumber}</Text>
                {isSelected && <View style={styles.selectedIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Continue Button */}
      {showContinueButton && (
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Game</Text>
        </TouchableOpacity>
      )}

      {/* Character Reveal Modal */}
      <Modal
        visible={showCharacterModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              if (playerName.trim()) {
                handleCharacterConfirm();
              }
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentWrapper}
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Your Character</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={handleCloseModal}
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {currentCharacter && (
                    <View style={styles.characterReveal}>
                      <Image source={currentCharacter.icon} style={styles.fullCharacterToken} />
                      <View style={styles.characterInfo}>
                        <Text style={styles.characterName}>{currentCharacter.name}</Text>
                        <Text style={styles.characterTeam}>
                          {currentCharacter.team.charAt(0).toUpperCase() + currentCharacter.team.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.characterAbility}>{currentCharacter.ability}</Text>

                      {/* Player Name Input */}
                      <View style={styles.nameInputContainer}>
                        <Text style={styles.nameInputLabel}>Enter Your Name:</Text>
                        <TextInput
                          style={styles.nameInput}
                          placeholder="Your name"
                          placeholderTextColor={Colors.textMuted}
                          value={playerName}
                          onChangeText={setPlayerName}
                          returnKeyType="done"
                          blurOnSubmit
                          onSubmitEditing={() => {
                            Keyboard.dismiss();
                            if (playerName.trim()) {
                              handleCharacterConfirm();
                            }
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          !playerName.trim() && styles.confirmButtonDisabled
                        ]}
                        onPress={handleCharacterConfirm}
                        disabled={!playerName.trim()}
                      >
                        <Text style={styles.confirmButtonText}>Continue</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
    paddingBottom: 10,
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
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  circleContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  token: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  tokenSelected: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.primary,
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
  },
  tokenContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tokenNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
  },
  storytellerSpot: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  storytellerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textMuted,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 15,
    margin: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  characterReveal: {
    padding: 20,
    alignItems: 'center',
  },
  fullCharacterToken: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  characterInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  characterTeam: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
  },
  characterAbility: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nameInputContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nameInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
});
