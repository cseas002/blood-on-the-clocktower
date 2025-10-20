import { StyleSheet, View, TouchableOpacity, Text, TextInput, Modal, Pressable, Dimensions, Image, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { Player, ReminderToken, Character } from "../../types/game";
import { TEAM_COLORS } from "../../constants/Colors";
const { width, height } = Dimensions.get('window');

export default function GrimoireScreen() {
  const router = useRouter();
  const { gameState, togglePlayerDeath, addReminder, removeReminder, removeReminderToken, addReminderToken } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddReminderModalVisible, setIsAddReminderModalVisible] = useState(false);
  const [newReminderText, setNewReminderText] = useState("");
  const [nightOrderModalData, setNightOrderModalData] = useState<{ character: any; isFirstNight: boolean } | null>(null);
  const [showReminderTokenSelector, setShowReminderTokenSelector] = useState(false);
  const [selectedPlayerForReminder, setSelectedPlayerForReminder] = useState<Player | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [currentSetupCharacter, setCurrentSetupCharacter] = useState<Character | null>(null);
  const [showPlayerActions, setShowPlayerActions] = useState(false);
  const [selectedPlayerForActions, setSelectedPlayerForActions] = useState<Player | null>(null);
  const [showTokenView, setShowTokenView] = useState(false);
  const [showNightOrderNumbers, setShowNightOrderNumbers] = useState(true);


  const handlePlayerPress = (player: Player) => {
    // Show action menu: View or Add Reminder
    setSelectedPlayerForActions(player);
    setShowPlayerActions(true);
  };

  const startSetup = () => {
    // Start setup mode with first character that has reminders
    const charactersWithReminders = gameState.selectedCharacters.filter(c => c.reminders && c.reminders.length > 0);
    if (charactersWithReminders.length > 0) {
      setSetupMode(true);
      setCurrentSetupCharacter(charactersWithReminders[0]);
    }
  };

  const nextSetupCharacter = () => {
    const charactersWithReminders = gameState.selectedCharacters.filter(c => c.reminders && c.reminders.length > 0);
    const currentIndex = charactersWithReminders.findIndex(c => c.id === currentSetupCharacter?.id);

    if (currentIndex < charactersWithReminders.length - 1) {
      setCurrentSetupCharacter(charactersWithReminders[currentIndex + 1]);
    } else {
      // Setup complete
      setSetupMode(false);
      setCurrentSetupCharacter(null);
    }
  };

  const exitSetup = () => {
    setSetupMode(false);
    setCurrentSetupCharacter(null);
  };

  // Get all available reminder tokens from selected characters
  const getAvailableReminderTokens = () => {
    const tokens: Array<{ characterId: string; characterName: string; characterIcon: any; reminderText: string }> = [];

    if (setupMode && currentSetupCharacter) {
      // In setup mode, only show reminders for current character
      if (currentSetupCharacter.reminders && currentSetupCharacter.reminders.length > 0) {
        currentSetupCharacter.reminders.forEach(reminderText => {
          tokens.push({
            characterId: currentSetupCharacter.id,
            characterName: currentSetupCharacter.name,
            characterIcon: currentSetupCharacter.icon,
            reminderText,
          });
        });
      }
    } else {
      // Normal mode: show all reminders
      gameState.selectedCharacters.forEach(character => {
        if (character.reminders && character.reminders.length > 0) {
          character.reminders.forEach(reminderText => {
            tokens.push({
              characterId: character.id,
              characterName: character.name,
              characterIcon: character.icon,
              reminderText,
            });
          });
        }
      });
    }

    return tokens;
  };

  const handleAddReminderToken = (characterId: string, characterName: string, characterIcon: any, reminderText: string) => {
    if (!selectedPlayerForReminder) return;

    // Validation for Washerwoman
    if (setupMode && currentSetupCharacter?.id === 'washerwoman') {
      const player = selectedPlayerForReminder;
      const playerCharacter = player.character;

      // Check if player is the Washerwoman herself - not allowed
      if (playerCharacter?.id === 'washerwoman') {
        alert("Cannot place Washerwoman's reminder on the Washerwoman herself!");
        return;
      }

      // Check team restrictions
      if (reminderText === 'Townsfolk') {
        // Townsfolk token can only go on Townsfolk
        if (playerCharacter?.team !== 'townsfolk') {
          alert("Townsfolk reminder can only be placed on Townsfolk characters!");
          return;
        }
      } else if (reminderText === 'Wrong') {
        // Wrong token cannot go on Townsfolk (or demon/minion/outsider is valid)
        if (playerCharacter?.team === 'townsfolk') {
          alert("Wrong reminder cannot be placed on Townsfolk characters!");
          return;
        }
      }

      // Check if Washerwoman already has 2 tokens placed
      const washerwomanTokensCount = gameState.players.reduce((count, p) => {
        const tokens = p.reminderTokens.filter(t => t.characterId === 'washerwoman');
        return count + tokens.length;
      }, 0);

      if (washerwomanTokensCount >= 2) {
        alert("Washerwoman can only have 2 reminder tokens! Remove one first.");
        return;
      }

      // Check if this specific token already exists
      const existingToken = gameState.players.find(p =>
        p.reminderTokens.some(t => t.characterId === 'washerwoman' && t.text === reminderText)
      );
      if (existingToken) {
        alert(`${reminderText} reminder already placed! Tap it to remove.`);
        return;
      }
    }

    const newToken: ReminderToken = {
      id: Date.now().toString(),
      text: reminderText,
      characterId,
      characterIcon,
    };

    addReminderToken(selectedPlayerForReminder.id, newToken);
    setShowReminderTokenSelector(false);
    setSelectedPlayerForReminder(null);
  };

  // Calculate position for reminder tokens around a player token
  const getReminderTokenPosition = (playerIndex: number, totalPlayers: number, reminderIndex: number, totalReminders: number) => {
    // Position reminders directly around their player token in a small circle
    // The reminders should orbit the player token, not be positioned relative to the grimoire center

    const tokenRadius = 50; // Distance from player token center (100px token diameter / 2 + some spacing)
    const angleOffset = 45; // Start at 45 degrees (top-right)
    const angleStep = totalReminders > 1 ? 90 / (totalReminders - 1) : 0; // Spread across 90 degrees

    const angle = (angleOffset + (angleStep * reminderIndex)) * (Math.PI / 180);

    // Position relative to the player token (which is 100x100, so center is at 50,50)
    return {
      left: 50 + tokenRadius * Math.cos(angle) - 17.5, // Center the 35px token
      top: 50 + tokenRadius * Math.sin(angle) - 17.5,
    };
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
    const centerY = (height - 350) / 2; // Adjusted to push circle up slightly

    // Start from top (270 degrees) and go clockwise
    const angle = (270 + (360 / total) * index) * (Math.PI / 180);

    return {
      left: centerX + radius * Math.cos(angle) - 60, // -60 to center the token wrapper (includes name)
      top: centerY + radius * Math.sin(angle) - 60, // -60 to center the token wrapper
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Grimoire</Text>
        <Text style={styles.subtitle}>Storyteller&apos;s Board</Text>

        {/* Player Count & Votes to Block - Top Right */}
        <View style={styles.playerStatsTopRight}>
          <Text style={styles.playerCount}>{gameState.players.length} Players</Text>
          <Text style={styles.votesToBlock}>
            Votes: {Math.floor(gameState.players.filter(p => !p.isDead).length / 2) + 1}
          </Text>
        </View>
      </View>

      {/* Night Order Numbers Toggle - Top Left */}
      <TouchableOpacity
        style={styles.nightOrderToggle}
        onPress={() => setShowNightOrderNumbers(!showNightOrderNumbers)}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendBadge, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.legendBadgeText}>B</Text>
          </View>
          <Text style={styles.legendText}>Every Night</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBadge, { backgroundColor: '#e94560' }]}>
            <Text style={styles.legendBadgeText}>R</Text>
          </View>
          <Text style={styles.legendText}>First Night</Text>
        </View>
        <Text style={styles.legendHint}>
          {showNightOrderNumbers ? 'Tap to hide numbers' : 'Tap to show numbers'}
        </Text>
      </TouchableOpacity>

      {/* Grimoire Board - Show characters with assigned players */}
      <View style={styles.grimoire}>
        {gameState.selectedCharacters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No characters selected</Text>
            <Text style={styles.emptyStateSubtext}>Set up your game first</Text>
          </View>
        ) : (
          <View style={styles.circleContainer}>
            {gameState.selectedCharacters.map((character, index) => {
              const assignedPlayer = gameState.players.find(p => p.character?.id === character.id);

              // Check if this character is the drunk
              const isDrunk = character.id === 'drunk';
              const drunkImpersonation = isDrunk ? gameState.drunkImpersonations[character.id] : null;

              // For drunk, show the impersonated character instead
              const displayCharacter = isDrunk && drunkImpersonation ? drunkImpersonation : character;

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
                  {/* Night Order Badges - only show if toggle is enabled */}
                  {showNightOrderNumbers && displayCharacter.otherNightOrder && (
                    <TouchableOpacity
                      style={[styles.nightOrderBadge, styles.otherNightBadge]}
                      onPress={() => setNightOrderModalData({ character: displayCharacter, isFirstNight: false })}
                    >
                      <Text style={styles.nightOrderText}>{displayCharacter.otherNightOrder}</Text>
                    </TouchableOpacity>
                  )}
                  {showNightOrderNumbers && displayCharacter.firstNightOrder && (
                    <TouchableOpacity
                      style={[styles.nightOrderBadge, styles.firstNightBadge]}
                      onPress={() => setNightOrderModalData({ character: displayCharacter, isFirstNight: true })}
                    >
                      <Text style={styles.nightOrderText}>{displayCharacter.firstNightOrder}</Text>
                    </TouchableOpacity>
                  )}

                  <View>
                    <TouchableOpacity
                      style={[
                        styles.characterToken,
                        {
                          borderColor: TEAM_COLORS[displayCharacter.team],
                          backgroundColor: assignedPlayer ? '#f5f5dc' : '#2d2d2d',
                        },
                        assignedPlayer?.isDead && styles.characterTokenDead,
                        // Disable if in setup mode and this is the character being set up
                        (setupMode && currentSetupCharacter?.id === character.id) && styles.characterTokenDisabled
                      ]}
                      onPress={() => {
                        // In setup mode, can't select the character doing the setup
                        if (setupMode && currentSetupCharacter?.id === character.id) {
                          return;
                        }
                        // Only allow interaction if there's an assigned player
                        if (assignedPlayer) {
                          handlePlayerPress(assignedPlayer);
                        }
                      }}
                      onLongPress={() => {
                        if (assignedPlayer) {
                          setSelectedPlayer(assignedPlayer);
                        }
                      }}
                      disabled={!assignedPlayer || (setupMode && currentSetupCharacter?.id === character.id)}
                    >
                      {/* Character token (full token image) */}
                      <Image
                        source={displayCharacter.token}
                        style={styles.characterTokenImage}
                        resizeMode="contain"
                      />

                      {/* Dead overlay - covers the character icon */}
                      {assignedPlayer?.isDead && (
                        <Image
                          source={require('../../assets/images/characters/other/dead.webp')}
                          style={styles.deadImageOverlay}
                          resizeMode="cover"
                        />
                      )}

                      {/* Player name overlay - at top */}
                      {assignedPlayer && (
                        <View style={styles.playerNameOverlayTop}>
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

                  {/* Reminder Tokens - positioned around the player token */}
                  {assignedPlayer && assignedPlayer.reminderTokens && assignedPlayer.reminderTokens.length > 0 && (
                    <>
                      {assignedPlayer.reminderTokens.map((token: ReminderToken, tokenIndex: number) => {
                        const tokenPosition = getReminderTokenPosition(0, 0, tokenIndex, assignedPlayer.reminderTokens.length);
                        return (
                          <View
                            key={token.id}
                            style={[
                              styles.reminderTokenWrapper,
                              {
                                position: 'absolute',
                                ...tokenPosition
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.reminderTokenAbsolute}
                              onLongPress={() => removeReminderToken(assignedPlayer.id, token.id)}
                            >
                              <View style={styles.reminderTokenContent}>
                                {token.characterIcon && (
                                  <Image
                                    source={token.characterIcon}
                                    style={styles.reminderTokenIconSmall}
                                    resizeMode="contain"
                                  />
                                )}
                              </View>
                            </TouchableOpacity>
                            <Text style={styles.reminderTokenLabel} numberOfLines={1}>
                              {token.text}
                            </Text>
                          </View>
                        );
                      })}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Setup Mode Character Info Overlay */}
      {setupMode && currentSetupCharacter && (
        <View style={styles.setupOverlay}>
          <View style={styles.setupCharacterCard}>
            <View style={styles.setupCharacterHeader}>
              <Image
                source={currentSetupCharacter.icon}
                style={styles.setupCharacterIcon}
                resizeMode="contain"
              />
              <View style={styles.setupCharacterInfo}>
                <Text style={styles.setupCharacterName}>{currentSetupCharacter.name}</Text>
                <Text style={styles.setupCharacterAbility}>{currentSetupCharacter.ability}</Text>
              </View>
            </View>
            <View style={styles.setupActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={exitSetup}
              >
                <Text style={styles.buttonText}>Exit Setup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.assignButton]}
                onPress={nextSetupCharacter}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Setup Button */}
      <TouchableOpacity
        style={styles.setupButton}
        onPress={setupMode ? exitSetup : startSetup}
      >
        <Text style={styles.setupButtonText}>{setupMode ? "Exit Setup" : "Setup"}</Text>
      </TouchableOpacity>

      {/* Player Actions Modal - Compact */}
      <Modal
        visible={showPlayerActions}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPlayerActions(false);
          setSelectedPlayerForActions(null);
        }}
      >
        <Pressable
          style={styles.compactModalOverlay}
          onPress={() => {
            setShowPlayerActions(false);
            setSelectedPlayerForActions(null);
          }}
        >
          <Pressable style={styles.compactModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.compactModalHeader}>
              <Text style={styles.compactModalTitle}>
                {selectedPlayerForActions?.name}
              </Text>
              <TouchableOpacity
                style={styles.compactCloseButton}
                onPress={() => {
                  setShowPlayerActions(false);
                  setSelectedPlayerForActions(null);
                }}
              >
                <Text style={styles.compactCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                setShowPlayerActions(false);
                if (selectedPlayerForActions?.character) {
                  setShowTokenView(true);
                }
              }}
            >
              <Text style={styles.compactActionText}>View Token</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                setShowPlayerActions(false);
                if (selectedPlayerForActions) {
                  setSelectedPlayerForReminder(selectedPlayerForActions);
                  setShowReminderTokenSelector(true);
                }
              }}
            >
              <Text style={styles.compactActionText}>Add Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                if (selectedPlayerForActions) {
                  togglePlayerDeath(selectedPlayerForActions.id);
                }
                setShowPlayerActions(false);
                setSelectedPlayerForActions(null);
              }}
            >
              <Text style={styles.compactActionText}>
                {selectedPlayerForActions?.isDead ? 'Mark Alive' : 'Mark Dead'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Token View Modal - Full Screen Character Token */}
      <Modal
        visible={showTokenView}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowTokenView(false);
          setSelectedPlayerForActions(null);
        }}
      >
        <Pressable
          style={styles.tokenViewOverlay}
          onPress={() => {
            setShowTokenView(false);
            setSelectedPlayerForActions(null);
          }}
        >
          <View style={styles.tokenViewContainer}>
            {selectedPlayerForActions?.character && (
              <Image
                source={selectedPlayerForActions.character.token}
                style={styles.tokenViewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Reminder Token Selector Modal */}
      <Modal
        visible={showReminderTokenSelector}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowReminderTokenSelector(false);
          setSelectedPlayerForReminder(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowReminderTokenSelector(false);
            setSelectedPlayerForReminder(null);
          }}
        >
          <Pressable style={styles.reminderSelectorContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Add Reminder to {selectedPlayerForReminder?.name}
            </Text>
            <Text style={styles.reminderSelectorSubtitle}>
              Select a reminder token
            </Text>
            <ScrollView style={styles.reminderTokenList} contentContainerStyle={styles.reminderTokenListContent}>
              {getAvailableReminderTokens().map((token, idx) => (
                <TouchableOpacity
                  key={`${token.characterId}-${token.reminderText}-${idx}`}
                  style={styles.reminderTokenSelector}
                  onPress={() => handleAddReminderToken(token.characterId, token.characterName, token.characterIcon, token.reminderText)}
                >
                  <Image
                    source={token.characterIcon}
                    style={styles.reminderTokenSelectorIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.reminderTokenSelectorTextContainer}>
                    <Text style={styles.reminderTokenSelectorText}>{token.reminderText}</Text>
                    <Text style={styles.reminderTokenSelectorCharacter}>{token.characterName}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowReminderTokenSelector(false);
                setSelectedPlayerForReminder(null);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
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

      {/* Night Order Detail Modal */}
      <Modal
        visible={nightOrderModalData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setNightOrderModalData(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNightOrderModalData(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {nightOrderModalData && (
              <>
                <View style={styles.nightOrderModalHeader}>
                  <Image
                    source={nightOrderModalData.character.icon}
                    style={styles.nightOrderCharacterIcon}
                  />
                  <Text style={styles.modalTitle}>{nightOrderModalData.character.name}</Text>
                </View>
                <View style={styles.nightOrderInfo}>
                  <Text style={styles.nightOrderLabel}>
                    {nightOrderModalData.isFirstNight ? 'First Night' : 'Other Nights'}
                  </Text>
                  <Text style={styles.nightOrderPosition}>
                    Wakes up{' '}
                    <Text style={[
                      styles.nightOrderNumber,
                      nightOrderModalData.isFirstNight ? styles.firstNightColor : styles.otherNightColor
                    ]}>
                      {nightOrderModalData.isFirstNight
                        ? nightOrderModalData.character.firstNightOrder
                        : nightOrderModalData.character.otherNightOrder}
                      {nightOrderModalData.isFirstNight
                        ? ['st', 'nd', 'rd'][
                        (nightOrderModalData.character.firstNightOrder - 1) % 10 < 3
                          ? (nightOrderModalData.character.firstNightOrder - 1) % 10
                          : 3
                        ] || 'th'
                        : ['st', 'nd', 'rd'][
                        (nightOrderModalData.character.otherNightOrder - 1) % 10 < 3
                          ? (nightOrderModalData.character.otherNightOrder - 1) % 10
                          : 3
                        ] || 'th'}
                    </Text>
                  </Text>
                  <Text style={styles.nightOrderReminder}>
                    {nightOrderModalData.isFirstNight
                      ? nightOrderModalData.character.firstNightReminder
                      : nightOrderModalData.character.otherNightReminder}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setNightOrderModalData(null)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
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
    position: 'relative',
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
  playerStatsTopRight: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
  },
  playerCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  votesToBlock: {
    fontSize: 13,
    color: '#4ecca3',
    fontWeight: '600',
  },
  nightOrderToggle: {
    position: 'absolute',
    top: 160,
    left: 10,
    backgroundColor: 'rgba(45, 45, 45, 0.95)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3d3d3d',
    zIndex: 100,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  legendBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  legendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  legendHint: {
    color: '#888888',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  showLegendButton: {
    position: 'absolute',
    top: 160,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d3d3d',
    zIndex: 100,
  },
  showLegendText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  grimoire: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: height - 300,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenWrapper: {
    width: 120,
    height: 140,
    alignItems: 'center',
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
  characterTokenImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  characterIcon: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playerNameOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 3,
    paddingHorizontal: 4,
    zIndex: 3,
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
  characterTokenDisabled: {
    opacity: 0.3,
    borderColor: '#666',
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
  deadImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    zIndex: 2,
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
  setupButton: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    paddingHorizontal: 25,
    paddingVertical: 15,
    backgroundColor: '#4ecca3',
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderTokensContainer: {
    position: 'absolute',
    top: -15,
    right: -15,
    flexDirection: 'column',
    gap: 5,
    alignItems: 'flex-end',
  },
  reminderTokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 2, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    maxWidth: 80,
  },
  reminderTokenIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    borderRadius: 8,
  },
  reminderTokenText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  characterNameLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
  },
  nightOrderBadge: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  firstNightBadge: {
    backgroundColor: '#e94560',
    right: 0,
    top: 0,
  },
  otherNightBadge: {
    backgroundColor: '#3b82f6',
    left: 0,
    top: 0,
  },
  nightOrderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nightOrderModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nightOrderCharacterIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  nightOrderInfo: {
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  nightOrderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cccccc',
    marginBottom: 8,
  },
  nightOrderPosition: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 12,
  },
  nightOrderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  firstNightColor: {
    color: '#e94560',
  },
  otherNightColor: {
    color: '#3b82f6',
  },
  nightOrderReminder: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  reminderTokenWrapper: {
    alignItems: 'center',
    width: 60,
  },
  reminderTokenAbsolute: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  reminderTokenContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTokenIconSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  reminderTokenLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    backgroundColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  reminderSelectorContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 450,
    maxHeight: '70%',
  },
  reminderSelectorSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 15,
  },
  reminderTokenList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  reminderTokenListContent: {
    gap: 10,
  },
  reminderTokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  reminderTokenSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reminderTokenSelectorTextContainer: {
    flex: 1,
  },
  reminderTokenSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  reminderTokenSelectorCharacter: {
    fontSize: 12,
    color: '#888888',
  },
  setupOverlay: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  setupCharacterCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  setupCharacterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  setupCharacterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  setupCharacterInfo: {
    flex: 1,
  },
  setupCharacterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 5,
  },
  setupCharacterAbility: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
  },
  setupActions: {
    flexDirection: 'row',
    gap: 10,
  },
  compactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactModalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 15,
    width: 200,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  compactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  compactModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    flex: 1,
  },
  compactCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3d3d3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactActionButton: {
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    alignItems: 'center',
  },
  compactActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tokenViewOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenViewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenViewImage: {
    width: width * 0.8,
    height: width * 0.8,
    maxWidth: 400,
    maxHeight: 400,
  },
});
