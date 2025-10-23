import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { GameState, Player, Character, Reminder, ReminderToken, DeathType, GamePhase } from '../types/game';
import { troubleBrewingCharacters } from '../data/characters';

// Character distribution based on player count (Trouble Brewing)
const CHARACTER_DISTRIBUTION: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
};

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  assignCharacter: (playerId: string, character: Character, drunkImpersonation?: Character) => void;
  togglePlayerDeath: (playerId: string) => void;
  markPlayerDeath: (playerId: string, deathType: DeathType) => void;
  addReminder: (playerId: string, reminder: Reminder) => void;
  removeReminder: (playerId: string, reminderId: string) => void;
  addReminderToken: (playerId: string, token: ReminderToken) => void;
  removeReminderToken: (playerId: string, tokenId: string) => void;
  resetGame: () => void;
  setPlayerCount: (count: number) => void;
  addSelectedCharacter: (character: Character) => void;
  removeSelectedCharacter: (characterId: string) => void;
  clearSelectedCharacters: () => void;
  setDrunkImpersonation: (drunkCharacterId: string, impersonatedCharacter: Character) => void;
  quickSetup: (characters: Character[], playerNames: string[]) => void;
  reorderPlayers: (fromIndex: number, toIndex: number) => void;
  reorderCharacters: (fromIndex: number, toIndex: number) => void;
  setDemonBluffs: (bluffs: Character[]) => void;
  autoPickDemonBluffs: () => void;
  setGamePhase: (phase: GamePhase) => void;
  startGame: () => void;
  advanceNight: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  players: [],
  edition: 'trouble-brewing',
  demonBluffs: [],
  isNight: false,
  currentNightStep: 0,
  nightNumber: 0,
  gamePhase: 'not-started',
  selectedCharacters: [],
  playerCount: 7,
  characterDistribution: {
    townsfolk: 5,
    outsider: 0,
    minion: 1,
    demon: 1,
  },
  drunkImpersonations: {},
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const addPlayer = (name: string) => {
    setGameState(prev => {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name,
        playerNumber: prev.players.length + 1,
        isDead: false,
        deathType: null,
        isVoteless: false,
        hasUsedDeadVote: false,
        reminders: [],
        reminderTokens: [],
        notes: '',
      };
      return {
        ...prev,
        players: [...prev.players, newPlayer],
      };
    });
  };

  const removePlayer = (playerId: string) => {
    setGameState(prev => {
      const filteredPlayers = prev.players.filter(p => p.id !== playerId);
      // Re-number players sequentially
      const renumberedPlayers = filteredPlayers.map((p, index) => ({
        ...p,
        playerNumber: index + 1,
      }));
      return {
        ...prev,
        players: renumberedPlayers,
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    }));
  };

  const assignCharacter = (playerId: string, character: Character, drunkImpersonation?: Character) => {
    updatePlayer(playerId, { character, drunkImpersonation });

    // Auto-add drunk reminder if character is drunk
    if (character.id === 'drunk') {
      const drunkToken: ReminderToken = {
        id: Date.now().toString(),
        text: 'Drunk',
        characterId: 'drunk',
        characterIcon: character.icon,
      };
      // Add reminder token after a small delay to ensure player is updated
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId
              ? { ...p, reminderTokens: [...p.reminderTokens, drunkToken] }
              : p
          ),
        }));
      }, 100);
    }
  };

  const togglePlayerDeath = (playerId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, isDead: !p.isDead, deathType: p.isDead ? null : p.deathType } : p
      ),
    }));
  };

  const markPlayerDeath = (playerId: string, deathType: DeathType) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId
          ? { ...p, isDead: deathType !== null, deathType }
          : p
      ),
    }));
  };

  const addReminder = (playerId: string, reminder: Reminder) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId
          ? { ...p, reminders: [...p.reminders, reminder] }
          : p
      ),
    }));
  };

  const removeReminder = (playerId: string, reminderId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId
          ? { ...p, reminders: p.reminders.filter(r => r.id !== reminderId) }
          : p
      ),
    }));
  };

  const addReminderToken = (playerId: string, token: ReminderToken) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId
          ? { ...p, reminderTokens: [...p.reminderTokens, token] }
          : p
      ),
    }));
  };

  const removeReminderToken = (playerId: string, tokenId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId
          ? { ...p, reminderTokens: p.reminderTokens.filter(t => t.id !== tokenId) }
          : p
      ),
    }));
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  const setPlayerCount = (count: number) => {
    const distribution = CHARACTER_DISTRIBUTION[count] || CHARACTER_DISTRIBUTION[7];
    setGameState(prev => ({
      ...prev,
      playerCount: count,
      characterDistribution: distribution,
    }));
  };

  const addSelectedCharacter = (character: Character) => {
    setGameState(prev => ({
      ...prev,
      selectedCharacters: [...prev.selectedCharacters, character],
    }));
  };

  const removeSelectedCharacter = (characterId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedCharacters: prev.selectedCharacters.filter(c => c.id !== characterId),
    }));
  };

  const clearSelectedCharacters = () => {
    setGameState(prev => ({
      ...prev,
      selectedCharacters: [],
      drunkImpersonations: {},
    }));
  };

  const quickSetup = (characters: Character[], playerNames: string[]) => {
    // Find drunk character and available townsfolk for impersonation
    const drunkCharacter = characters.find(c => c.id === 'drunk');
    const drunkImpersonations: Record<string, Character> = {};

    // If drunk is selected, select a townsfolk NOT in play for impersonation
    if (drunkCharacter) {
      // Get all townsfolk from the edition
      const allTownsfolk = troubleBrewingCharacters.filter(c => c.team === 'townsfolk');
      // Get townsfolk that are already in play
      const townsfolkInPlay = characters.filter(c => c.team === 'townsfolk');
      // Find townsfolk NOT in the current game
      const townsfolkNotInPlay = allTownsfolk.filter(tf =>
        !townsfolkInPlay.some(inPlay => inPlay.id === tf.id)
      );

      // Select a random townsfolk NOT in play for the drunk to impersonate
      if (townsfolkNotInPlay.length > 0) {
        const randomTownsfolk = townsfolkNotInPlay[Math.floor(Math.random() * townsfolkNotInPlay.length)];
        drunkImpersonations[drunkCharacter.id] = randomTownsfolk;
      }
    }

    // Create players with characters assigned
    const newPlayers: Player[] = playerNames.map((name, index) => {
      const character = characters[index];
      const isDrunk = character?.id === 'drunk';

      // Add drunk reminder token if character is drunk
      const reminderTokens: ReminderToken[] = [];
      if (isDrunk && character) {
        reminderTokens.push({
          id: Date.now().toString() + '-drunk-' + index,
          text: 'Drunk',
          characterId: 'drunk',
          characterIcon: character.icon,
        });
      }

      return {
        id: Date.now().toString() + index,
        name,
        playerNumber: index + 1,
        character: character,
        drunkImpersonation: isDrunk && drunkImpersonations[character.id] ? drunkImpersonations[character.id] : undefined,
        isDead: false,
        deathType: null,
        isVoteless: false,
        hasUsedDeadVote: false,
        reminders: [],
        reminderTokens,
        notes: '',
      };
    });

    // Update state atomically
    setGameState(prev => ({
      ...prev,
      selectedCharacters: characters,
      players: newPlayers,
      drunkImpersonations,
    }));
  };

  const setDrunkImpersonation = (drunkCharacterId: string, impersonatedCharacter: Character) => {
    setGameState(prev => ({
      ...prev,
      drunkImpersonations: {
        ...prev.drunkImpersonations,
        [drunkCharacterId]: impersonatedCharacter,
      },
    }));
  };

  const reorderPlayers = (fromIndex: number, toIndex: number) => {
    setGameState(prev => {
      const sortedPlayers = [...prev.players].sort((a, b) => a.playerNumber - b.playerNumber);
      const [movedPlayer] = sortedPlayers.splice(fromIndex, 1);
      sortedPlayers.splice(toIndex, 0, movedPlayer);

      // Re-number all players sequentially
      const renumberedPlayers = sortedPlayers.map((player, index) => ({
        ...player,
        playerNumber: index + 1,
      }));

      return {
        ...prev,
        players: renumberedPlayers,
      };
    });
  };

  const reorderCharacters = (fromIndex: number, toIndex: number) => {
    setGameState(prev => {
      const characters = [...prev.selectedCharacters];
      const [movedCharacter] = characters.splice(fromIndex, 1);
      characters.splice(toIndex, 0, movedCharacter);

      return {
        ...prev,
        selectedCharacters: characters,
      };
    });
  };

  const setDemonBluffs = (bluffs: Character[]) => {
    setGameState(prev => ({
      ...prev,
      demonBluffs: bluffs,
    }));
  };

  const autoPickDemonBluffs = () => {
    // Get all good characters NOT in play
    const goodCharactersNotInPlay = troubleBrewingCharacters.filter(c =>
      (c.team === 'townsfolk' || c.team === 'outsider') &&
      !gameState.selectedCharacters.some(sc => sc.id === c.id)
    );

    // Separate townsfolk and outsiders
    const townsfolkNotInPlay = goodCharactersNotInPlay.filter(c => c.team === 'townsfolk');
    const outsidersNotInPlay = goodCharactersNotInPlay.filter(c => c.team === 'outsider');

    // Pick 2 random townsfolk
    const bluffs: Character[] = [];
    const shuffledTownsfolk = [...townsfolkNotInPlay].sort(() => Math.random() - 0.5);
    bluffs.push(...shuffledTownsfolk.slice(0, 2));

    // Pick 1 random outsider (or another townsfolk if no outsiders available)
    if (outsidersNotInPlay.length > 0) {
      const randomOutsider = outsidersNotInPlay[Math.floor(Math.random() * outsidersNotInPlay.length)];
      bluffs.push(randomOutsider);
    } else if (shuffledTownsfolk.length > 2) {
      bluffs.push(shuffledTownsfolk[2]);
    }

    setDemonBluffs(bluffs);
  };

  const setGamePhase = (phase: GamePhase) => {
    setGameState(prev => ({
      ...prev,
      gamePhase: phase,
    }));
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'first-night',
      nightNumber: 1,
      isNight: true,
    }));
  };

  const advanceNight = () => {
    setGameState(prev => ({
      ...prev,
      nightNumber: prev.nightNumber + 1,
      isNight: true,
      gamePhase: 'night',
    }));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        addPlayer,
        removePlayer,
        updatePlayer,
        assignCharacter,
        togglePlayerDeath,
        markPlayerDeath,
        addReminder,
        removeReminder,
        addReminderToken,
        removeReminderToken,
        resetGame,
        setPlayerCount,
        addSelectedCharacter,
        removeSelectedCharacter,
        clearSelectedCharacters,
        setDrunkImpersonation,
        quickSetup,
        reorderPlayers,
        reorderCharacters,
        setDemonBluffs,
        autoPickDemonBluffs,
        setGamePhase,
        startGame,
        advanceNight,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
