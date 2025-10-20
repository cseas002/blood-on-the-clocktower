import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { GameState, Player, Character, Reminder } from '../types/game';

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
  resetGame: () => void;
  setPlayerCount: (count: number) => void;
  addSelectedCharacter: (character: Character) => void;
  removeSelectedCharacter: (characterId: string) => void;
  clearSelectedCharacters: () => void;
  setDrunkImpersonation: (drunkCharacterId: string, impersonatedCharacter: Character) => void;
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
        resetGame,
        setPlayerCount,
        addSelectedCharacter,
        removeSelectedCharacter,
        clearSelectedCharacters,
        setDrunkImpersonation,
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
