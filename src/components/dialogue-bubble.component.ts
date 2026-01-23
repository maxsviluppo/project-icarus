import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogueConfig {
    characterId: string;
    text: string;
    duration?: number; // millisecondi, default 3000
    position?: { x: number; y: number }; // posizione custom
}

// Colori per personaggio (stile Monkey Island)
const CHARACTER_COLORS: Record<string, string> = {
    'elias': '#FFFFFF',    // Bianco (Comandante)
    'sarah': '#FF69B4',    // Rosa (Pilota)
    'kael': '#00FF00',     // Verde (Ingegnere)
    'mina': '#9370DB'      // Viola (Medico)
};

@Component({
    selector: 'app-dialogue-bubble',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div
      class="dialogue-bubble"
      [class.visible]="isVisible"
      [style.left.px]="position.x"
      [style.top.px]="position.y"
      [style.color]="textColor"
      [style.border-color]="textColor"
      (click)="dismiss()"
    >
      <div class="bubble-text">{{ text }}</div>
      <div class="bubble-tail" [style.border-top-color]="textColor"></div>
    </div>
  `,
    styles: [`
    .dialogue-bubble {
      position: fixed;
      max-width: 300px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid;
      border-radius: 8px;
      padding: 10px 15px;
      font-family: 'Press Start 2P', 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.6;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
      z-index: 150;
      cursor: pointer;
      transform: translate(-50%, -100%) translateY(-20px);
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: auto;
    }

    .dialogue-bubble.visible {
      opacity: 1;
      transform: translate(-50%, -100%) translateY(-10px);
    }

    .bubble-text {
      word-wrap: break-word;
      image-rendering: pixelated;
    }

    .bubble-tail {
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid;
    }

    @media (max-width: 768px) {
      .dialogue-bubble {
        max-width: 250px;
        font-size: 9px;
        padding: 8px 12px;
      }
    }
  `]
})
export class DialogueBubbleComponent implements OnInit, OnDestroy {
    @Input() config!: DialogueConfig;

    isVisible = false;
    text = '';
    position = { x: 0, y: 0 };
    textColor = '#FFFFFF';

    private dismissTimer?: number;

    ngOnInit(): void {
        if (!this.config) {
            console.error('DialogueBubbleComponent: config is required');
            return;
        }

        this.text = this.config.text;
        this.textColor = CHARACTER_COLORS[this.config.characterId] || '#FFFFFF';

        // Calcola posizione se non fornita
        if (this.config.position) {
            this.position = this.config.position;
        } else {
            this.position = this.calculateHeadPosition(this.config.characterId);
        }

        // Mostra il fumetto con animazione
        setTimeout(() => {
            this.isVisible = true;
        }, 50);

        // Auto-dismiss dopo durata specificata (default 3 secondi)
        const duration = this.config.duration || 3000;
        this.dismissTimer = window.setTimeout(() => {
            this.dismiss();
        }, duration);
    }

    ngOnDestroy(): void {
        if (this.dismissTimer) {
            clearTimeout(this.dismissTimer);
        }
    }

    dismiss(): void {
        this.isVisible = false;
        // Rimuovi il componente dopo l'animazione
        setTimeout(() => {
            // Emetti evento di chiusura o rimuovi dal DOM
            // Questo sarà gestito dal servizio DialogueService
        }, 300);
    }

    /**
     * Calcola la posizione della testa del personaggio
     * Questa è una implementazione base - andrà raffinata con le posizioni reali degli sprite
     */
    private calculateHeadPosition(characterId: string): { x: number; y: number } {
        // TODO: Implementare logica per ottenere la posizione reale dello sprite
        // Per ora usiamo posizioni fisse di esempio

        const characterPositions: Record<string, { x: number; y: number }> = {
            'elias': { x: window.innerWidth * 0.25, y: window.innerHeight * 0.4 },
            'sarah': { x: window.innerWidth * 0.40, y: window.innerHeight * 0.4 },
            'kael': { x: window.innerWidth * 0.55, y: window.innerHeight * 0.4 },
            'mina': { x: window.innerWidth * 0.70, y: window.innerHeight * 0.4 }
        };

        return characterPositions[characterId] || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
}
