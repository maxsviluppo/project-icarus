import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export enum ActionType {
  EXAMINE = 'EXAMINE',
  TAKE = 'TAKE',
  USE = 'USE',
  INVENTORY = 'INVENTORY'
}

interface ActionIcon {
  type: ActionType;
  label: string;
  iconPath: string;
  tooltip: string;
}

@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="action-bar-container">
      <div class="action-bar-inner">
        <button
          *ngFor="let action of actions"
          class="action-button"
          [class.active]="currentAction === action.type"
          (click)="selectAction(action.type)"
          (mouseenter)="hoveredLabel = action.label"
          (mouseleave)="hoveredLabel = null"
        >
          <div class="icon-wrapper">
            <img [src]="action.iconPath" [alt]="action.label" class="action-icon-img">
          </div>
          
          <!-- Custom Tooltip (Fumetto stile LucasArts) -->
          @if (hoveredLabel === action.label) {
            <div class="tooltip-bubble">
              {{ action.label }}
            </div>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .action-bar-container {
      position: fixed;
      top: 85.9%;
      left: 23%;
      z-index: 100;
      pointer-events: none; /* Lascia passare i click sopra la barra sfumata */
    }

    .action-bar-inner {
      display: flex;
      gap: 30px;
      pointer-events: auto; /* Riattiva i click sui bottoni */
      background: rgba(0,0,0,0.4); /* Leggero sfondo per contrasto */
      padding: 5px 20px;
      border-radius: 50px;
      border-top: 2px solid #000; /* Richiesta utente: linea nera (o anche invisibile se preferisce) */
      backdrop-filter: blur(2px);
    }

    .action-button {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      outline: none;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-icon-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.9));
      transition: all 0.2s ease;
      opacity: 0.8;
    }

    /* Hover Effects */
    .action-button:hover {
      transform: translateY(-10px) scale(1.1);
    }

    .action-button:hover .action-icon-img {
      opacity: 1;
      filter: drop-shadow(0 0 15px rgba(255, 176, 0, 0.6));
    }

    /* Active State */
    .action-button.active .action-icon-img {
      opacity: 1;
      filter: drop-shadow(0 0 20px rgba(255, 176, 0, 1));
      transform: scale(1.1);
    }

    /* Tooltip Bubble Style */
    .tooltip-bubble {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 15px;
      
      background-color: #000;
      color: #ffb000;
      font-family: 'Press Start 2P', monospace; /* Se disponibile, altrimenti fallback */
      font-size: 12px;
      padding: 8px 12px;
      border: 2px solid #ffb000;
      border-radius: 4px;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.8);
      z-index: 1000;
      
      /* Animazione comparsa */
      animation: popIn 0.2s ease-out forwards;
    }

    /* Freccetta del fumetto */
    .tooltip-bubble::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 6px;
      border-style: solid;
      border-color: #ffb000 transparent transparent transparent;
    }

    @keyframes popIn {
      from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
      to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }

    /* Mobile adjustments */
    @media (max-width: 600px) {
      .action-bar-inner { gap: 15px; padding: 10px 20px; }
      .icon-wrapper { width: 48px; height: 48px; }
      .tooltip-bubble { font-size: 10px; margin-bottom: 10px; }
    }
  `]
})
export class ActionBarComponent {
  @Output() actionSelected = new EventEmitter<ActionType>();
  @Output() inventoryToggled = new EventEmitter<void>();

  currentAction: ActionType = ActionType.EXAMINE;
  hoveredLabel: string | null = null;

  actions: ActionIcon[] = [
    {
      type: ActionType.EXAMINE,
      label: 'Esamina',
      iconPath: '/esamina.png',
      tooltip: 'Esamina'
    },
    {
      type: ActionType.TAKE,
      label: 'Prendi',
      iconPath: '/prendi.png',
      tooltip: 'Prendi'
    },
    {
      type: ActionType.USE,
      label: 'Usa',
      iconPath: '/usa.png',
      tooltip: 'Usa'
    },
    {
      type: ActionType.INVENTORY,
      label: 'Borsa',
      iconPath: '/borsa.png',
      tooltip: 'Inventario'
    }
  ];

  selectAction(actionType: ActionType): void {
    if (actionType === ActionType.INVENTORY) {
      this.inventoryToggled.emit();
    } else {
      this.currentAction = actionType;
      this.actionSelected.emit(actionType);
    }
  }
}
