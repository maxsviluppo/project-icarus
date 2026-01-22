import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { TerminalComponent } from './components/terminal.component';
import { ViewportComponent } from './components/viewport.component';
import { GameState, LogEntry, PointOfInterest, DialogueOption } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TerminalComponent, ViewportComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private gemini = inject(GeminiService);
  
  // State
  gameState = signal<GameState | null>(null);
  logs = signal<LogEntry[]>([]);
  currentImage = signal<string>('');
  isLoading = signal<boolean>(true);
  
  // Inventory display
  inventory = signal<string[]>([]);
  selectedItem = signal<string | null>(null);
  
  // Custom input
  customInput = signal<string>('');

  ngOnInit() {
    this.addLog('system', 'Inizializzazione Vesper Protocol...');
    this.startNewGame();
  }

  async startNewGame() {
    this.isLoading.set(true);
    try {
      this.addLog('system', 'Connessione al mainframe AI...');
      const initialState = await this.gemini.startGame();
      await this.updateGameState(initialState);
    } catch (err) {
      this.addLog('error', 'Errore critico di connessione. Riprova.');
    } finally {
      this.isLoading.set(false);
    }
  }

  saveGame() {
    const state = this.gameState();
    if (state) {
      this.gemini.saveGame(state);
      this.addLog('system', 'Progress Saved to Local Memory.');
    }
  }

  loadGame() {
    const state = this.gemini.loadGame();
    if (state) {
      this.updateGameState(state);
      this.addLog('system', 'Progress Loaded from Local Memory.');
    } else {
      this.addLog('error', 'No Save File Found.');
    }
  }

  selectItem(item: string) {
    if (this.selectedItem() === item) {
      this.selectedItem.set(null); // Deselect if already selected
    } else {
      this.selectedItem.set(item);
    }
  }

  async handleInteraction(poi: PointOfInterest) {
    if (this.isLoading()) return;
    
    let action = '';
    
    // Inventory Usage Logic (Scripting)
    if (this.selectedItem() && poi.type !== 'exit' && poi.type !== 'pickup') {
      // If we have an item selected and click an interactive object/character
      action = `Usa ${this.selectedItem()} su ${poi.name}`;
      
      // Auto-deselect after attempting use, or keep it? 
      // Generally better to reset to avoid accidental clicks
      this.selectedItem.set(null);
    } else {
      // Default Interaction
      switch (poi.type) {
        case 'exit': action = `Vai verso ${poi.name}`; break;
        case 'pickup': action = `Prendi ${poi.name}`; break;
        case 'character': action = `Parla con ${poi.name}`; break;
        default: action = `Esamina/Usa ${poi.name}`; break;
      }
    }

    this.processAction(action);
  }

  async handleDialogue(option: DialogueOption) {
     if (this.isLoading()) return;
     const action = `Scelgo opzione dialogo: "${option.label}"`;
     this.processAction(action);
  }

  async submitCustomCommand() {
    if (!this.customInput().trim() || this.isLoading()) return;
    const cmd = this.customInput();
    this.customInput.set('');
    this.processAction(cmd);
  }

  private async processAction(actionText: string) {
    this.addLog('action', `> ${actionText}`);
    this.isLoading.set(true);
    
    try {
      const newState = await this.gemini.sendAction(actionText);
      await this.updateGameState(newState);
    } catch (err) {
      this.addLog('error', 'Errore nella trasmissione dati.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async updateGameState(state: GameState) {
    this.gameState.set(state);
    
    // Update Narrative Log
    if (state.narrative) {
      this.addLog('narrative', state.narrative);
    }
    
    // Update Inventory
    if (state.inventory) {
      this.inventory.set(state.inventory);
    }

    // Check for Visual Update
    if (state.visualCue) {
       this.gemini.generateImage(state.visualCue).then(url => {
         if (url) this.currentImage.set(url);
       });
    }

    if (state.gameOver) {
      this.addLog('system', '--- CONNESSIONE TERMINATA ---');
    }
  }

  private addLog(type: LogEntry['type'], text: string) {
    this.logs.update(prev => [...prev, { type, text }]);
  }
}