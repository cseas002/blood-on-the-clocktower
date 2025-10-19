import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameState, Player, Character, Reminder } from '../types/game';

interface GameContextType {
  gameState: GameState;
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  assignCharacter: (playerId: string, character: Character) => void;
  togglePlayerDeath: (playerId: string) => void;
  addReminder: (playerId: string, reminder: Reminder) => void;
  removeReminder: (playerId: string, reminderId: string) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  players: [],
  edition: 'trouble-brewing',
  demonBluffs: [],
  isNight: false,
  currentNightStep: 0,
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

  const assignCharacter = (playerId: string, character: Character) => {
    updatePlayer(playerId, { character });
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

  return (
    <GameContext.Provider
      value={{
        gameState,
        addPlayer,
        removePlayer,
        updatePlayer,
        assignCharacter,
        togglePlayerDeath,
        addReminder,
        removeReminder,
        resetGame,
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
