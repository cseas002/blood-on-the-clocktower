import { StyleSheet, View, TouchableOpacity, Text, TextInput, Modal, Pressable, Dimensions, Image, ScrollView, PanResponder } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useGame } from "../../context/GameContext";
import { Player, ReminderToken, Character, DeathType } from "../../types/game";
import { TEAM_COLORS } from "../../constants/Colors";
import { troubleBrewingCharacters } from "../../data/characters";
const { width, height } = Dimensions.get('window');

export default function GrimoireScreen() {
  const router = useRouter();
  const { gameState, togglePlayerDeath, markPlayerDeath, addReminder, removeReminder, removeReminderToken, addReminderToken, reorderCharacters, setDemonBluffs, autoPickDemonBluffs, setGamePhase, startGame } = useGame();
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
  const [showDrunkTokenView, setShowDrunkTokenView] = useState(false);
  const [showNightOrderNumbers, setShowNightOrderNumbers] = useState(true);
  const [rotationOffset, setRotationOffset] = useState(0); // Rotation offset in steps
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [draggedPlayerIndex, setDraggedPlayerIndex] = useState<number | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [selectedBluffs, setSelectedBluffs] = useState<Character[]>([]);
  const [showBluffsModal, setShowBluffsModal] = useState(false);
  const [editingBluffs, setEditingBluffs] = useState<Character[]>([]);
  const [tokenSetupMode, setTokenSetupMode] = useState(false);
  const [currentTokenSetupCharacter, setCurrentTokenSetupCharacter] = useState<Character | null>(null);
  const [tokenSetupSelections, setTokenSetupSelections] = useState<Player[]>([]);
  const [nightFlowActive, setNightFlowActive] = useState(false);
  const [currentNightStep, setCurrentNightStep] = useState(0);
  const [showDemonBluffsInNight, setShowDemonBluffsInNight] = useState(false);
  const [showDemonTokenInNight, setShowDemonTokenInNight] = useState(false);


  const handlePlayerPress = (player: Player, index: number) => {
    // If in token setup mode
    if (tokenSetupMode) {
      // If no character is selected yet, start setup for this player's character
      if (!currentTokenSetupCharacter && player.character) {
        startCharacterTokenSetup(player.character);
      } else {
        // Otherwise, handle token setup selection (tap other players to assign tokens)
        handleTokenSetupPlayerTap(player);
      }
      return;
    }

    // If in drag mode, this is the drop target
    if (draggedPlayerIndex !== null && draggedPlayer) {
      // Reorder characters (which reorders the grimoire display)
      reorderCharacters(draggedPlayerIndex, index);
      // Exit drag mode
      setDraggedPlayer(null);
      setDraggedPlayerIndex(null);
    } else {
      // Show action menu: View or Add Reminder
      setSelectedPlayerForActions(player);
      setShowPlayerActions(true);
    }
  };

  const handlePlayerLongPress = (player: Player, index: number) => {
    // Enter drag mode
    setDraggedPlayer(player);
    setDraggedPlayerIndex(index);
  };

  const startSetup = () => {
    // Open demon bluffs setup only
    setShowSetupWizard(true);
    setSelectedBluffs([]);
  };

  const startCharacterTokenSetup = (character: Character) => {
    // Start setup for a specific character
    if (character.reminders && character.reminders.length > 0) {
      setTokenSetupMode(true);
      setCurrentTokenSetupCharacter(character);
      setTokenSetupSelections([]);
    }
  };

  const exitTokenSetup = () => {
    setTokenSetupMode(false);
    setCurrentTokenSetupCharacter(null);
    setTokenSetupSelections([]);
  };

  const handleAutoPickBluffs = () => {
    autoPickDemonBluffs();
    setSelectedBluffs(gameState.demonBluffs);
  };

  const handleManualBluffSelection = (character: Character) => {
    if (selectedBluffs.some(b => b.id === character.id)) {
      setSelectedBluffs(selectedBluffs.filter(b => b.id !== character.id));
    } else if (selectedBluffs.length < 3) {
      setSelectedBluffs([...selectedBluffs, character]);
    }
  };

  const handleEditBluffSelection = (character: Character) => {
    if (editingBluffs.some(b => b.id === character.id)) {
      setEditingBluffs(editingBluffs.filter(b => b.id !== character.id));
    } else if (editingBluffs.length < 3) {
      setEditingBluffs([...editingBluffs, character]);
    }
  };

  const saveBluffs = () => {
    setDemonBluffs(editingBluffs);
    setShowBluffsModal(false);
  };

  const completeBluffsSelection = () => {
    setDemonBluffs(selectedBluffs);
    setShowSetupWizard(false);
  };

  const getPlayerWithCharacter = (characterId: string) => {
    return gameState.players.find(p => p.character?.id === characterId);
  };

  const isPlayerDrunkOrPoisoned = (player: Player) => {
    if (player.character?.id === 'drunk') return true;
    // Check if player has poisoned token
    return player.reminderTokens.some(token => token.text.toLowerCase() === 'poisoned');
  };

  const handleTokenSetupPlayerTap = (player: Player) => {
    if (!currentTokenSetupCharacter) return;

    const playerWithChar = getPlayerWithCharacter(currentTokenSetupCharacter.id);
    const isDrunkOrPoisoned = playerWithChar ? isPlayerDrunkOrPoisoned(playerWithChar) : false;
    const maxSelections = currentTokenSetupCharacter.reminders?.length || 0;

    // Can't select self
    if (player.id === playerWithChar?.id) return;

    // Check if already selected
    const alreadySelected = tokenSetupSelections.some(p => p.id === player.id);
    if (alreadySelected) {
      // Deselect
      setTokenSetupSelections(tokenSetupSelections.filter(p => p.id !== player.id));
      return;
    }

    // Check if we can add more selections
    if (tokenSetupSelections.length >= maxSelections) return;

    // Validation based on character type (unless drunk/poisoned)
    if (!isDrunkOrPoisoned) {
      if (currentTokenSetupCharacter.id === 'washerwoman') {
        // First selection must be townsfolk (for "Townsfolk" token)
        if (tokenSetupSelections.length === 0) {
          if (player.character?.team !== 'townsfolk') {
            alert('First selection must be a Townsfolk!');
            return;
          }
        }
      } else if (currentTokenSetupCharacter.id === 'librarian') {
        // First selection must be outsider (for "Outsider" token)
        if (tokenSetupSelections.length === 0) {
          if (player.character?.team !== 'outsider') {
            alert('First selection must be an Outsider!');
            return;
          }
        }
      } else if (currentTokenSetupCharacter.id === 'investigator') {
        // First selection must be minion (for "Minion" token)
        if (tokenSetupSelections.length === 0) {
          if (player.character?.team !== 'minion') {
            alert('First selection must be a Minion!');
            return;
          }
        }
      }
    }

    // Add to selections
    setTokenSetupSelections([...tokenSetupSelections, player]);

    // Auto-place token and move to next if complete
    if (tokenSetupSelections.length + 1 === maxSelections) {
      // Place all tokens
      const allSelections = [...tokenSetupSelections, player];
      allSelections.forEach((selectedPlayer, index) => {
        if (currentTokenSetupCharacter.reminders && currentTokenSetupCharacter.reminders[index]) {
          const token: ReminderToken = {
            id: Date.now().toString() + '-' + index + '-' + selectedPlayer.id,
            text: currentTokenSetupCharacter.reminders[index],
            characterId: currentTokenSetupCharacter.id,
            characterIcon: currentTokenSetupCharacter.icon,
          };
          addReminderToken(selectedPlayer.id, token);
        }
      });

      // Exit token setup mode after completion
      exitTokenSetup();
    }
  };

  const getAvailableBluffs = () => {
    return gameState.selectedCharacters.filter(c =>
      (c.team === 'townsfolk' || c.team === 'outsider') &&
      !gameState.selectedCharacters.some(sc => sc.id === c.id)
    );
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

  // Calculate sequential night order positions for characters in play
  const getNightOrderPosition = (character: Character, isFirstNight: boolean) => {
    // Get all characters in play that have the relevant night order
    const charactersWithOrder = gameState.selectedCharacters
      .filter(c => {
        const orderValue = isFirstNight ? c.firstNightOrder : c.otherNightOrder;
        return orderValue !== undefined;
      })
      .sort((a, b) => {
        const orderA = isFirstNight ? (a.firstNightOrder || 999) : (a.otherNightOrder || 999);
        const orderB = isFirstNight ? (b.firstNightOrder || 999) : (b.otherNightOrder || 999);
        return orderA - orderB;
      });

    // Find the position of this character in the sorted list
    const position = charactersWithOrder.findIndex(c => c.id === character.id);
    return position !== -1 ? position + 1 : null;
  };

  // Build first night steps
  const getFirstNightSteps = () => {
    const steps: Array<{ type: string; text: string; character?: Character; action?: string }> = [];

    // Step 1: Tell everyone to sleep
    steps.push({ type: 'instruction', text: 'Tell everyone to close their eyes and go to sleep.' });

    // Step 2: Wake demon and show bluffs
    const demon = gameState.selectedCharacters.find(c => c.team === 'demon');
    if (demon) {
      steps.push({
        type: 'demon-bluffs',
        text: 'Wake up the Demon and show them the three bluffs.',
        character: demon,
        action: 'show-bluffs'
      });
    }

    // Step 3: Wake minions and show demon
    const minions = gameState.selectedCharacters.filter(c => c.team === 'minion');
    if (minions.length > 0) {
      steps.push({
        type: 'minion-reveal',
        text: 'Wake all the Minions. Show them the Demon. Let the Minions make eye contact so they know who each other are.',
        action: 'show-demon-token'
      });
    }

    // Step 4: Put minions and demon to sleep
    steps.push({ type: 'instruction', text: 'Put the Minions and Demon to sleep.' });

    // Step 5+: Night order characters
    const nightOrderCharacters = gameState.selectedCharacters
      .filter(c => c.firstNightOrder !== undefined)
      .sort((a, b) => (a.firstNightOrder || 999) - (b.firstNightOrder || 999));

    nightOrderCharacters.forEach(character => {
      const playerWithChar = gameState.players.find(p => p.character?.id === character.id);
      steps.push({
        type: 'night-action',
        text: `Wake up the ${character.name}. ${character.ability || ''}`,
        character: character,
        action: 'add-reminder'
      });
    });

    return steps;
  };

  const handleStartNightFlow = () => {
    setNightFlowActive(true);
    setCurrentNightStep(0);
  };

  const nextNightStep = () => {
    const steps = getFirstNightSteps();
    if (currentNightStep < steps.length - 1) {
      setCurrentNightStep(currentNightStep + 1);
    } else {
      // End of night flow
      setNightFlowActive(false);
      setCurrentNightStep(0);
    }
  };

  const previousNightStep = () => {
    if (currentNightStep > 0) {
      setCurrentNightStep(currentNightStep - 1);
    }
  };

  const exitNightFlow = () => {
    setNightFlowActive(false);
    setCurrentNightStep(0);
    setShowDemonBluffsInNight(false);
    setShowDemonTokenInNight(false);
  };

  // Calculate position for tokens in a circle (matching assign-character screen)
  const getCirclePosition = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / total;

    // Calculate radius to use FULL screen width (matching assign-character screen)
    const tokenRadius = 55; // Token wrapper is 110px, so radius is 55
    const margin = 20;
    const radius = (width / 2) - tokenRadius - margin;

    const centerX = width / 2;
    const centerY = height * 0.4; // Center vertically (matching assign-character)

    // Apply rotation offset
    const rotatedIndex = (index + rotationOffset) % total;
    const angle = (rotatedIndex * angleStep) - Math.PI / 2; // Start from top

    return {
      left: centerX + radius * Math.cos(angle) - tokenRadius,
      top: centerY + radius * Math.sin(angle) - tokenRadius,
    };
  };

  // Rotate circle clockwise
  const rotateClockwise = () => {
    const totalCharacters = gameState.selectedCharacters.length;
    if (totalCharacters === 0) return;
    setRotationOffset((prev) => (prev + 1) % totalCharacters);
  };

  // Rotate circle counter-clockwise
  const rotateCounterClockwise = () => {
    const totalCharacters = gameState.selectedCharacters.length;
    if (totalCharacters === 0) return;
    setRotationOffset((prev) => (prev - 1 + totalCharacters) % totalCharacters);
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
          <Text style={styles.playerCount}>
            Players Alive: {gameState.players.filter(p => !p.isDead).length}/{gameState.players.length}
          </Text>
          <Text style={styles.votesToBlock}>
            Votes needed: {Math.floor((gameState.players.filter(p => !p.isDead).length + 1) / 2)}
          </Text>
        </View>
      </View>

      {/* Rotation Buttons - Same row as night order toggle, right side */}
      <View style={styles.rotationButtons}>
        <TouchableOpacity
          style={styles.rotateButton}
          onPress={rotateCounterClockwise}
        >
          <Text style={styles.rotateButtonText}>⟲</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rotateButton}
          onPress={rotateClockwise}
        >
          <Text style={styles.rotateButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Drag Mode Indicator */}
      {draggedPlayer && (
        <View style={styles.dragModeIndicator}>
          <Text style={styles.dragModeText}>
            🔄 Reordering: {draggedPlayer.name}
          </Text>
          <Text style={styles.dragModeSubtext}>Tap another player to swap positions</Text>
          <TouchableOpacity
            style={styles.dragModeCancelButton}
            onPress={() => {
              setDraggedPlayer(null);
              setDraggedPlayerIndex(null);
            }}
          >
            <Text style={styles.dragModeCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

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
            {/* Start Game Button - Center of Circle (hide when night flow is active) */}
            {!nightFlowActive && (() => {
              const hasDemon = gameState.selectedCharacters.some(c => c.team === 'demon');
              const hasBluffs = gameState.demonBluffs.length === 3;
              const canStartGame = hasDemon && hasBluffs;

              return (
                <View style={styles.startGameButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.startGameButton,
                      !canStartGame && styles.startGameButtonDisabled
                    ]}
                    onPress={() => {
                      if (canStartGame) {
                        handleStartNightFlow();
                      }
                    }}
                    disabled={!canStartGame}
                  >
                    <Text style={styles.startGameButtonText}>Start Game</Text>
                  </TouchableOpacity>
                  {hasDemon && !hasBluffs && (
                    <Text style={styles.startGameHint}>Setup demon's bluffs first</Text>
                  )}
                </View>
              );
            })()}

            {/* Display selected characters in the order they appear, showing assigned players */}
            {gameState.selectedCharacters.map((character, index) => {
              // Find the player assigned to this character
              const assignedPlayer = gameState.players
                .sort((a, b) => a.playerNumber - b.playerNumber)
                .find(p => p.character?.id === character.id);

              // Check if this character is the drunk
              const isDrunk = character.id === 'drunk';
              const drunkImpersonation = isDrunk ? gameState.drunkImpersonations[character.id] : null;

              // For drunk, show the impersonated character instead
              const displayCharacter = isDrunk && drunkImpersonation ? drunkImpersonation : character;

              // For night order badges, use the actual character (not drunk impersonation)
              // because drunk doesn't wake up at night
              const nightOrderCharacter = character;

              const totalCharacters = gameState.selectedCharacters.length;
              const position = getCirclePosition(index, totalCharacters);

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
                  {/* Night Order Badges - only show if toggle is enabled and NOT drunk */}
                  {showNightOrderNumbers && !isDrunk && nightOrderCharacter.otherNightOrder && (
                    <TouchableOpacity
                      style={[styles.nightOrderBadge, styles.otherNightBadge]}
                      onPress={() => setNightOrderModalData({ character: nightOrderCharacter, isFirstNight: false })}
                    >
                      <Text style={styles.nightOrderText}>{getNightOrderPosition(nightOrderCharacter, false)}</Text>
                    </TouchableOpacity>
                  )}
                  {showNightOrderNumbers && !isDrunk && nightOrderCharacter.firstNightOrder && (
                    <TouchableOpacity
                      style={[styles.nightOrderBadge, styles.firstNightBadge]}
                      onPress={() => setNightOrderModalData({ character: nightOrderCharacter, isFirstNight: true })}
                    >
                      <Text style={styles.nightOrderText}>{getNightOrderPosition(nightOrderCharacter, true)}</Text>
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
                        (setupMode && currentSetupCharacter?.id === character.id) && styles.characterTokenDisabled,
                        // Highlight if this is the dragged token
                        draggedPlayerIndex === index && styles.characterTokenDragging,
                        // Highlight selected players in token setup mode
                        tokenSetupMode && assignedPlayer && tokenSetupSelections.some(p => p.id === assignedPlayer.id) && styles.characterTokenSelected,
                        // Highlight current character in token setup mode
                        tokenSetupMode && currentTokenSetupCharacter?.id === character.id && styles.characterTokenSetupActive,
                      ]}
                      onPress={() => {
                        // In setup mode, can't select the character doing the setup
                        if (setupMode && currentSetupCharacter?.id === character.id) {
                          return;
                        }
                        // Only allow interaction if there's an assigned player
                        if (assignedPlayer) {
                          handlePlayerPress(assignedPlayer, index);
                        }
                      }}
                      onLongPress={() => {
                        if (assignedPlayer && !setupMode && !tokenSetupMode) {
                          handlePlayerLongPress(assignedPlayer, index);
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

                      {/* Dead overlay - smaller, with death type distinction */}
                      {assignedPlayer?.isDead && (
                        <View style={styles.deadOverlayContainer}>
                          <Image
                            source={require('../../assets/images/characters/other/dead.webp')}
                            style={styles.deadImageOverlay}
                            resizeMode="cover"
                          />
                          {/* Death type indicator */}
                          <View style={[
                            styles.deathTypeIndicator,
                            assignedPlayer.deathType === 'executed' && styles.executedIndicator,
                            assignedPlayer.deathType === 'assassinated' && styles.assassinatedIndicator,
                          ]}>
                            <Text style={styles.deathTypeText}>
                              {assignedPlayer.deathType === 'executed' ? '⚖' : '🗡'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Player name overlay - at top */}
                      {assignedPlayer && (
                        <View style={styles.playerNameOverlayTop}>
                          <Text style={styles.playerName} numberOfLines={1}>
                            {assignedPlayer.name}
                          </Text>
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

      {/* Setup Buttons */}
      {!tokenSetupMode && (
        <View style={styles.setupButtonsContainer}>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={startSetup}
          >
            <Text style={styles.setupButtonText}>Setup Bluffs</Text>
          </TouchableOpacity>
        </View>
      )}

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
            {selectedPlayerForActions?.character?.team === 'demon' && (
              <TouchableOpacity
                style={styles.compactActionButton}
                onPress={() => {
                  setShowPlayerActions(false);
                  setEditingBluffs([...gameState.demonBluffs]);
                  setShowBluffsModal(true);
                }}
              >
                <Text style={styles.compactActionText}>Show Bluffs</Text>
              </TouchableOpacity>
            )}
            {selectedPlayerForActions?.character?.reminders &&
             selectedPlayerForActions.character.reminders.length > 0 && (
              <TouchableOpacity
                style={styles.compactActionButton}
                onPress={() => {
                  setShowPlayerActions(false);
                  if (selectedPlayerForActions?.character) {
                    startCharacterTokenSetup(selectedPlayerForActions.character);
                  }
                }}
              >
                <Text style={styles.compactActionText}>Setup Tokens</Text>
              </TouchableOpacity>
            )}
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
            {selectedPlayerForActions?.isDead ? (
              <TouchableOpacity
                style={styles.compactActionButton}
                onPress={() => {
                  if (selectedPlayerForActions) {
                    markPlayerDeath(selectedPlayerForActions.id, null);
                  }
                  setShowPlayerActions(false);
                  setSelectedPlayerForActions(null);
                }}
              >
                <Text style={styles.compactActionText}>Mark Alive</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.compactActionButton}
                onPress={() => {
                  if (selectedPlayerForActions) {
                    markPlayerDeath(selectedPlayerForActions.id, 'executed');
                  }
                  setShowPlayerActions(false);
                  setSelectedPlayerForActions(null);
                }}
              >
                <Text style={styles.compactActionText}>Mark Dead</Text>
              </TouchableOpacity>
            )}
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

      {/* Setup Wizard Modal - Demon Bluffs */}
      <Modal
        visible={showSetupWizard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSetupWizard(false)}
      >
        <View style={styles.setupWizardOverlay}>
          <View style={styles.setupWizardContent}>
            <Text style={styles.setupWizardTitle}>Demon Bluffs</Text>
            <Text style={styles.setupWizardSubtitle}>
              Select 3 good characters NOT in play for the Demon to bluff as
            </Text>
            <Text style={styles.setupWizardHint}>
              Recommended: 2 Townsfolk + 1 Outsider
            </Text>

            <View style={styles.setupWizardButtons}>
              <TouchableOpacity
                style={styles.autoPickButton}
                onPress={handleAutoPickBluffs}
              >
                <Text style={styles.autoPickButtonText}>Auto Pick (2T + 1O)</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bluffsList} contentContainerStyle={styles.bluffsListContent}>
              {troubleBrewingCharacters
                .filter(c =>
                  (c.team === 'townsfolk' || c.team === 'outsider') &&
                  !gameState.selectedCharacters.some(sc => sc.id === c.id)
                )
                .map(character => (
                  <TouchableOpacity
                    key={character.id}
                    style={[
                      styles.bluffCard,
                      selectedBluffs.some(b => b.id === character.id) && styles.bluffCardSelected
                    ]}
                    onPress={() => handleManualBluffSelection(character)}
                  >
                    <Image source={character.icon} style={styles.bluffIcon} />
                    <Text style={styles.bluffName}>{character.name}</Text>
                    <View style={[
                      styles.bluffTeamBadge,
                      { backgroundColor: TEAM_COLORS[character.team] }
                    ]}>
                      <Text style={styles.bluffTeamText}>{character.team[0].toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.selectedBluffsContainer}>
              <Text style={styles.selectedBluffsLabel}>
                Selected: {selectedBluffs.length}/3
              </Text>
              <View style={styles.selectedBluffsList}>
                {selectedBluffs.map(bluff => (
                  <View key={bluff.id} style={styles.selectedBluffChip}>
                    <Text style={styles.selectedBluffText}>{bluff.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.setupWizardFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowSetupWizard(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.assignButton,
                  selectedBluffs.length !== 3 && styles.buttonDisabled
                ]}
                onPress={completeBluffsSelection}
                disabled={selectedBluffs.length !== 3}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Demon Bluffs Viewer/Editor Modal */}
      <Modal
        visible={showBluffsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBluffsModal(false)}
      >
        <View style={styles.setupWizardOverlay}>
          <View style={styles.setupWizardContent}>
            <Text style={styles.setupWizardTitle}>Demon Bluffs</Text>
            <Text style={styles.setupWizardSubtitle}>
              These are the bluffs shown to the Demon
            </Text>
            <Text style={styles.setupWizardHint}>
              Edit by selecting different characters (max 3)
            </Text>

            <ScrollView style={styles.bluffsList} contentContainerStyle={styles.bluffsListContent}>
              {troubleBrewingCharacters
                .filter(c =>
                  (c.team === 'townsfolk' || c.team === 'outsider') &&
                  !gameState.selectedCharacters.some(sc => sc.id === c.id)
                )
                .map(character => (
                  <TouchableOpacity
                    key={character.id}
                    style={[
                      styles.bluffCard,
                      editingBluffs.some(b => b.id === character.id) && styles.bluffCardSelected
                    ]}
                    onPress={() => handleEditBluffSelection(character)}
                  >
                    <Image source={character.icon} style={styles.bluffIcon} />
                    <Text style={styles.bluffName}>{character.name}</Text>
                    <View style={[
                      styles.bluffTeamBadge,
                      { backgroundColor: TEAM_COLORS[character.team] }
                    ]}>
                      <Text style={styles.bluffTeamText}>{character.team[0].toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.selectedBluffsContainer}>
              <Text style={styles.selectedBluffsLabel}>
                Current Bluffs: {editingBluffs.length}/3
              </Text>
              <View style={styles.selectedBluffsList}>
                {editingBluffs.map(bluff => (
                  <View key={bluff.id} style={styles.selectedBluffChip}>
                    <Image source={bluff.icon} style={styles.selectedBluffChipIcon} />
                    <Text style={styles.selectedBluffText}>{bluff.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.setupWizardFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowBluffsModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.assignButton,
                  editingBluffs.length !== 3 && styles.buttonDisabled
                ]}
                onPress={saveBluffs}
                disabled={editingBluffs.length !== 3}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Token Setup Overlay - Shows instructions at top, tap tokens to select */}
      {tokenSetupMode && (
        <View style={styles.tokenSetupOverlay}>
          <View style={styles.tokenSetupInstructionBox}>
            {currentTokenSetupCharacter ? (
              (() => {
                const playerWithChar = getPlayerWithCharacter(currentTokenSetupCharacter.id);
                const isDrunkOrPoisoned = playerWithChar ? isPlayerDrunkOrPoisoned(playerWithChar) : false;
                const maxSelections = currentTokenSetupCharacter.reminders?.length || 0;

                return (
                  <>
                    <View style={styles.tokenSetupCharacterRow}>
                      <Image source={currentTokenSetupCharacter.icon} style={styles.tokenSetupCharacterIcon} />
                      <View style={styles.tokenSetupCharacterInfo}>
                        <Text style={styles.tokenSetupCharacterName}>{currentTokenSetupCharacter.name}</Text>
                        {isDrunkOrPoisoned && (
                          <Text style={styles.tokenSetupDrunkWarning}>⚠ DRUNK/POISONED - No restrictions</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.tokenSetupCancelButton}
                        onPress={exitTokenSetup}
                      >
                        <Text style={styles.tokenSetupCancelText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.tokenSetupInstruction}>
                      Tap {maxSelections - tokenSetupSelections.length} more player{maxSelections - tokenSetupSelections.length !== 1 ? 's' : ''}:
                      {currentTokenSetupCharacter.reminders?.map((reminder, idx) => (
                        <Text key={idx} style={[
                          styles.tokenSetupReminderText,
                          idx < tokenSetupSelections.length && styles.tokenSetupReminderComplete
                        ]}>
                          {' '}{idx + 1}. "{reminder}"{idx < tokenSetupSelections.length ? ' ✓' : ''}
                        </Text>
                      ))}
                    </Text>

                    {tokenSetupSelections.length > 0 && (
                      <View style={styles.tokenSetupSelectedContainer}>
                        <Text style={styles.tokenSetupSelectedLabel}>Selected:</Text>
                        {tokenSetupSelections.map((player, idx) => (
                          <Text key={player.id} style={styles.tokenSetupSelectedPlayer}>
                            {idx + 1}. {player.name}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                <View style={styles.tokenSetupCharacterRow}>
                  <Text style={[styles.tokenSetupInstruction, { flex: 1 }]}>
                    Tap a character token to reveal their setup information
                  </Text>
                  <TouchableOpacity
                    style={styles.tokenSetupCancelButton}
                    onPress={exitTokenSetup}
                  >
                    <Text style={styles.tokenSetupCancelText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Night Flow Overlay */}
      {nightFlowActive && (() => {
        const steps = getFirstNightSteps();
        const currentStep = steps[currentNightStep];
        const demon = gameState.selectedCharacters.find(c => c.team === 'demon');
        const demonPlayer = gameState.players.find(p => p.character?.team === 'demon');

        return (
          <View style={styles.nightFlowOverlay}>
            <View style={styles.nightFlowContent}>
              {/* Step indicator and close button */}
              <View style={styles.nightFlowHeader}>
                <Text style={styles.nightFlowStepIndicator}>
                  Step {currentNightStep + 1} of {steps.length}
                </Text>
                <TouchableOpacity
                  style={styles.nightFlowCloseButton}
                  onPress={exitNightFlow}
                >
                  <Text style={styles.nightFlowCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Instruction text */}
              <Text style={styles.nightFlowInstruction}>{currentStep.text}</Text>

              {/* Action buttons based on step type */}
              {currentStep.action === 'show-bluffs' && (
                <TouchableOpacity
                  style={styles.nightFlowActionButton}
                  onPress={() => setShowDemonBluffsInNight(true)}
                >
                  <Text style={styles.nightFlowActionButtonText}>Show Demon Bluffs</Text>
                </TouchableOpacity>
              )}

              {currentStep.action === 'show-demon-token' && demon && (
                <TouchableOpacity
                  style={styles.nightFlowActionButton}
                  onPress={() => setShowDemonTokenInNight(true)}
                >
                  <Text style={styles.nightFlowActionButtonText}>Show Demon Token ({demon.name})</Text>
                </TouchableOpacity>
              )}

              {currentStep.action === 'add-reminder' && currentStep.character && (
                <TouchableOpacity
                  style={styles.nightFlowActionButton}
                  onPress={() => {
                    if (currentStep.character) {
                      startCharacterTokenSetup(currentStep.character);
                    }
                  }}
                >
                  <Text style={styles.nightFlowActionButtonText}>Add Reminder Tokens</Text>
                </TouchableOpacity>
              )}

              {/* Navigation buttons */}
              <View style={styles.nightFlowNavigation}>
                <TouchableOpacity
                  style={[styles.nightFlowNavButton, currentNightStep === 0 && styles.nightFlowNavButtonDisabled]}
                  onPress={previousNightStep}
                  disabled={currentNightStep === 0}
                >
                  <Text style={styles.nightFlowNavButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nightFlowNavButton}
                  onPress={nextNightStep}
                >
                  <Text style={styles.nightFlowNavButtonText}>
                    {currentNightStep === steps.length - 1 ? 'Finish' : 'Next →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Demon Bluffs Display Modal (for night flow) */}
      <Modal
        visible={showDemonBluffsInNight}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDemonBluffsInNight(false)}
      >
        <Pressable
          style={styles.tokenViewOverlay}
          onPress={() => setShowDemonBluffsInNight(false)}
        >
          <View style={styles.demonBluffsNightContainer}>
            <Text style={styles.demonBluffsNightTitle}>Demon Bluffs</Text>
            <View style={styles.demonBluffsNightList}>
              {gameState.demonBluffs.map((bluff, index) => (
                <View key={bluff.id} style={styles.demonBluffNightItem}>
                  <Image source={bluff.icon} style={styles.demonBluffNightIcon} />
                  <Text style={styles.demonBluffNightName}>{bluff.name}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.demonBluffsNightCloseButton}
              onPress={() => setShowDemonBluffsInNight(false)}
            >
              <Text style={styles.demonBluffsNightCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Demon Token Display Modal (for night flow) */}
      <Modal
        visible={showDemonTokenInNight}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDemonTokenInNight(false)}
      >
        <Pressable
          style={styles.tokenViewOverlay}
          onPress={() => setShowDemonTokenInNight(false)}
        >
          {(() => {
            const demon = gameState.selectedCharacters.find(c => c.team === 'demon');
            if (!demon) return null;

            return (
              <View style={styles.demonTokenNightContainer}>
                <Image source={demon.icon} style={styles.demonTokenNightIcon} />
                <Text style={styles.demonTokenNightName}>{demon.name}</Text>
              </View>
            );
          })()}
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
  rotationButtons: {
    position: 'absolute',
    top: 160,
    right: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 100,
  },
  rotateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 45, 45, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  rotateButtonText: {
    fontSize: 20,
    color: '#4ecca3',
    fontWeight: 'bold',
  },
  dragModeIndicator: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: '#ffa502',
    borderRadius: 12,
    padding: 15,
    zIndex: 1000,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  dragModeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  dragModeSubtext: {
    fontSize: 12,
    color: '#1a1a1a',
    marginBottom: 10,
  },
  dragModeCancelButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dragModeCancelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
    height: height - 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenWrapper: {
    width: 110,
    height: 130,
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
    width: 85,
    height: 85,
    backgroundColor: '#2d2d2d',
    borderRadius: 42.5,
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
  characterTokenDragging: {
    borderColor: '#ffa502',
    borderWidth: 6,
    shadowColor: '#ffa502',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 20,
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
  deadOverlayContainer: {
    position: 'absolute',
    top: 25,
    left: 20,
    width: 50,
    height: 50,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadImageOverlay: {
    width: '100%',
    height: '100%',
  },
  deathTypeIndicator: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  executedIndicator: {
    backgroundColor: '#e94560',
  },
  assassinatedIndicator: {
    backgroundColor: '#8b5cf6',
  },
  deathTypeText: {
    fontSize: 16,
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
    justifyContent: 'center',
    minHeight: 50,
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
    textAlign: 'center',
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
  setupButtonsContainer: {
    position: 'absolute',
    top: 205,
    right: 10,
    flexDirection: 'column',
    gap: 8,
    zIndex: 100,
  },
  setupButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#4ecca3',
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  tokenSetupButton: {
    backgroundColor: '#e94560',
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reminderTokensContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
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
    right: 5,
    top: 5,
  },
  otherNightBadge: {
    backgroundColor: '#3b82f6',
    left: 5,
    top: 5,
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
    width: 40,
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
  setupWizardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupWizardContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  setupWizardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 10,
  },
  setupWizardSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  setupWizardHint: {
    fontSize: 12,
    color: '#4ecca3',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  setupWizardButtons: {
    marginBottom: 15,
  },
  autoPickButton: {
    backgroundColor: '#4ecca3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  autoPickButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bluffsList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  bluffsListContent: {
    gap: 10,
  },
  bluffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3d3d3d',
  },
  bluffCardSelected: {
    borderColor: '#4ecca3',
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
  },
  bluffIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  bluffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  bluffTeamBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bluffTeamText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectedBluffsContainer: {
    marginBottom: 15,
  },
  selectedBluffsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  selectedBluffsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedBluffChip: {
    backgroundColor: '#4ecca3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedBluffChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  selectedBluffText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  setupWizardFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  setupProgressHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  setupProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ecca3',
  },
  characterSetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
  },
  setupCharacterIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  characterSetupInfo: {
    flex: 1,
  },
  drunkWarning: {
    fontSize: 12,
    color: '#ffa502',
    fontWeight: 'bold',
    marginTop: 5,
  },
  setupInstructions: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 10,
    lineHeight: 20,
  },
  reminderInstruction: {
    color: '#4ecca3',
    fontWeight: 'bold',
  },
  playerSelectionList: {
    maxHeight: 250,
    marginBottom: 15,
  },
  playerSelectionListContent: {
    gap: 10,
  },
  playerSelectionCard: {
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3d3d3d',
    position: 'relative',
  },
  playerSelectionCardSelected: {
    borderColor: '#4ecca3',
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
  },
  selectionOrderBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ecca3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2d2d2d',
    zIndex: 10,
  },
  selectionOrderText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerSelectionInfo: {
    flex: 1,
  },
  playerSelectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  playerCharacterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerCharacterIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  playerCharacterName: {
    fontSize: 13,
    color: '#cccccc',
    flex: 1,
  },
  playerTeamBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerTeamText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedPlayersContainer: {
    marginBottom: 15,
  },
  selectedPlayersLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  selectedPlayersList: {
    flexDirection: 'column',
    gap: 6,
  },
  selectedPlayerChip: {
    backgroundColor: '#1d1d1d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ecca3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPlayerNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ecca3',
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  selectedPlayerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  selectedPlayerReminder: {
    color: '#4ecca3',
    fontSize: 12,
    fontStyle: 'italic',
  },
  tokenSetupOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  tokenSetupInstructionBox: {
    backgroundColor: 'rgba(233, 69, 96, 0.95)',
    padding: 15,
    paddingTop: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#ffffff',
    pointerEvents: 'auto',
  },
  tokenSetupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenSetupProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tokenSetupCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenSetupCancelText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tokenSetupCharacterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tokenSetupCharacterIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  tokenSetupCharacterInfo: {
    flex: 1,
  },
  tokenSetupCharacterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tokenSetupDrunkWarning: {
    fontSize: 12,
    color: '#ffa502',
    fontWeight: 'bold',
    marginTop: 2,
  },
  tokenSetupInstruction: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  tokenSetupReminderText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tokenSetupReminderComplete: {
    color: '#4ecca3',
    textDecorationLine: 'line-through',
  },
  tokenSetupSelectedContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  tokenSetupSelectedLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  tokenSetupSelectedPlayer: {
    fontSize: 13,
    color: '#4ecca3',
    fontWeight: '600',
  },
  characterTokenSelected: {
    borderWidth: 4,
    borderColor: '#4ecca3',
    backgroundColor: 'rgba(78, 204, 163, 0.3)',
  },
  characterTokenSetupActive: {
    borderWidth: 4,
    borderColor: '#e94560',
    opacity: 0.7,
  },
  startGameButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  startGameButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#4ecca3',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: 3,
    borderColor: '#ffffff',
    minWidth: 150,
    alignItems: 'center',
  },
  startGameButtonDisabled: {
    backgroundColor: '#667',
    opacity: 0.5,
  },
  startGameButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  startGameHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#ffa502',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nightFlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  nightFlowContent: {
    backgroundColor: 'rgba(78, 204, 163, 0.95)',
    padding: 20,
    marginTop: 60,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#ffffff',
  },
  nightFlowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  nightFlowStepIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  nightFlowCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nightFlowCloseText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nightFlowInstruction: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 15,
    fontWeight: '600',
  },
  nightFlowActionButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nightFlowActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nightFlowNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  nightFlowNavButton: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nightFlowNavButtonDisabled: {
    backgroundColor: '#667',
    opacity: 0.5,
  },
  nightFlowNavButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demonBluffsNightContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
  },
  demonBluffsNightTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 20,
  },
  demonBluffsNightList: {
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  demonBluffNightItem: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1d1d1d',
    borderRadius: 15,
    minWidth: 200,
  },
  demonBluffNightIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  demonBluffNightName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  demonBluffsNightCloseButton: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  demonBluffsNightCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demonTokenNightContainer: {
    alignItems: 'center',
  },
  demonTokenNightIcon: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 5,
    borderColor: '#ffffff',
  },
  demonTokenNightName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
});
