import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { GameState, Player, Character, Reminder, ReminderToken } from '../types/game';

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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  players: [],
  edition: 'trouble-brewing',
  demonBluffs: [],
  isNight: false,
  currentNightStep: 0,
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
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      isDead: false,
      isVoteless: false,
      hasUsedDeadVote: false,
      reminders: [],
      reminderTokens: [],
      notes: '',
    };
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));
  };

  const removePlayer = (playerId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId),
    }));
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
        p.id === playerId ? { ...p, isDead: !p.isDead } : p
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
    // Create players with characters assigned
    const newPlayers: Player[] = playerNames.map((name, index) => ({
      id: Date.now().toString() + index,
      name,
      character: characters[index],
      isDead: false,
      isVoteless: false,
      hasUsedDeadVote: false,
      reminders: [],
      reminderTokens: [],
      notes: '',
    }));

    // Update state atomically
    setGameState(prev => ({
      ...prev,
      selectedCharacters: characters,
      players: newPlayers,
      drunkImpersonations: {},
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
