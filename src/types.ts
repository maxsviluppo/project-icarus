export interface PointOfInterest {
  id: string;
  name: string;
  description: string; // Internal description for the AI context
  type: 'interactable' | 'pickup' | 'exit' | 'character';
  status?: string; // e.g. 'locked', 'unlocked', 'broken'
}

export interface DialogueOption {
  id: string;
  label: string; // The text shown to the user
}

export interface GameCharacter {
  name: string;
  dialogue?: string;
}

export interface GameState {
  roomName: string;
  narrative: string;
  visualCue: string;
  pointsOfInterest: PointOfInterest[];
  inventory: string[];
  characters: GameCharacter[];
  dialogueOptions?: DialogueOption[]; // If present, the game enters "Conversation Mode"
  gameOver?: boolean;
  storyState?: string; // Tracks the high-level phase: 'EMERGENCY', 'REPAIR', 'PRE_JUMP', 'JUMP'
  flags?: Record<string, boolean>; // Game variables: { 'pipe_fixed': true, 'sarah_calm': true }
}

export interface LogEntry {
  type: 'narrative' | 'action' | 'system' | 'error';
  text: string;
}