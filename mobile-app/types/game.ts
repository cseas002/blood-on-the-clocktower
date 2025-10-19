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
  notes: string;
}

export interface Reminder {
  id: string;
  text: string;
  character?: string;
}

export interface GameState {
  players: Player[];
  edition: Edition;
  demonBluffs: Character[];
  isNight: boolean;
  currentNightStep: number;
}
