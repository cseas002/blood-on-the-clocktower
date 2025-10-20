// Game types and interfaces

export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';

export type Edition = 'trouble-brewing' | 'bad-moon-rising' | 'sects-and-violets' | 'custom';

export interface Character {
  id: string;
  name: string;
  team: Team;
  edition: Edition;
  ability: string;
  icon: any; // require() path to character icon image
  token: any; // require() path to character token image
  firstNightReminder?: string;
  otherNightReminder?: string;
  firstNightOrder?: number;
  otherNightOrder?: number;
  reminders?: string[];
  setup?: boolean;
}

export interface Player {
  id: string;
  name: string;
  character?: Character;
  isDead: boolean;
  isVoteless: boolean;
  hasUsedDeadVote: boolean;
  reminders: Reminder[];
  reminderTokens: ReminderToken[]; // Small visual tokens from characters (Washerwoman, Poisoner, etc.)
  notes: string;
  drunkImpersonation?: Character; // For drunk characters, which townsfolk they think they are
}

export interface Reminder {
  id: string;
  text: string;
  character?: string;
}

export interface ReminderToken {
  id: string;
  text: string; // e.g., "Townsfolk", "Wrong", "Poisoned", "Protected"
  characterId: string; // Which character placed this token
  characterIcon?: any; // Optional: icon of the character for visual reference
}

export interface GameState {
  players: Player[];
  edition: Edition;
  demonBluffs: Character[];
  isNight: boolean;
  currentNightStep: number;
  selectedCharacters: Character[];
  playerCount: number;
  characterDistribution: {
    townsfolk: number;
    outsider: number;
    minion: number;
    demon: number;
  };
  drunkImpersonations: Record<string, Character>; // Maps drunk character IDs to the townsfolk they impersonate
}
