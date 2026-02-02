
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
  id: string;
  name: string;
  dialogue?: string;
  // Visual properties
  position?: { x: number; y: number }; // Percentage 0-100
  scale?: number; // 1.0 = normal
  status?: 'idle' | 'talking' | 'panic' | 'unconscious';
  isPlayer?: boolean;
  // Animation props
  isMoving?: boolean;
  direction?: 'left' | 'right';
  facing?: 'up' | 'down' | 'left' | 'right';
  walkDistance?: number; // Accumulated distance for animation frames
  spriteSheet?: string; // Overrides default sprite if present
  targetPosition?: { x: number; y: number };
}

export interface GameState {
  roomName: string;
  narrative: string;
  transitionVideo?: string; // Video filename for level transition
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
