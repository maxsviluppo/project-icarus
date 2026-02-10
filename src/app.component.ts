import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { DialogueService } from './services/dialogue.service';
import { InventoryService } from './services/inventory.service';
import { TerminalComponent } from './components/terminal.component';
import { ViewportComponent } from './components/viewport.component';
import { ActionBarComponent, ActionType } from './components/action-bar.component';
import { MedievalActionBarComponent } from './components/medieval-action-bar.component';
import { InventoryPanelComponent } from './components/inventory-panel.component';
import { GameMenuComponent } from './components/game-menu.component';
import { MedievalMenuComponent } from './components/medieval-menu.component';
import { GameState, LogEntry, PointOfInterest, DialogueOption } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TerminalComponent, ViewportComponent, ActionBarComponent, MedievalActionBarComponent, InventoryPanelComponent, GameMenuComponent, MedievalMenuComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private gemini = inject(GeminiService);
  private dialogueService = inject(DialogueService);
  inventoryService = inject(InventoryService); // Public per template binding

  // State
  gameState = signal<GameState | null>(null);
  logs = signal<LogEntry[]>([]);
  currentImage = signal<string>('');
  isLoading = signal<boolean>(true);

  // Video Playback State
  isVideoPlaying = signal<boolean>(false);
  currentVideoSrc = signal<string>('');

  // Inventory display
  inventory = signal<string[]>([]);
  selectedItem = signal<string | null>(null);

  // Custom input
  customInput = signal<string>('');

  // UI State
  isSidebarOpen = signal<boolean>(false); // Default chiusa per full immersion
  activePlayerId = signal<string | 'none'>('leo'); // Impostato Leo come pilota principale per calibrazione
  renderCharacters = signal<boolean>(true); // Attivato di default per vedere Leo

  isMedievalEnvironment = computed(() => {
    const s = this.gameState();
    return s?.flags?.['medieval_mode'] === true || s?.visualCue === 'Medieval Stone Chamber';
  });

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  ngOnInit() {
    // Caricamento diretto ambiente medioevale per calibrazione Leo
    this.currentImage.set('/stanza_vuota.png');
    this.renderCharacters.set(true);
    this.addLog('system', 'MODALITÀ CALIBRAZIONE: Accesso Archivio Storico (Leo)...');
    this.changeEnvironment('medieval');
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

  async startCalibration() {
    this.isLoading.set(true);
    try {
      this.addLog('system', 'Initializing Neural Calibration Suite...');
      const calibrationState = await this.gemini.sendAction('calibration');
      await this.updateGameState(calibrationState);
    } catch (err) {
      this.addLog('error', 'Calibration initialization failed.');
    } finally {
      this.isLoading.set(false);
    }
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
    if (!state.characters) state.characters = [];
    const currentPlayerId = this.activePlayerId();

    // Sincronizza i flag isPlayer basandosi sulla selezione dell'utente
    state.characters.forEach(c => {
      const normalizedId = (c.id || c.name).toLowerCase();
      c.isPlayer = normalizedId === currentPlayerId;
      if (c.isPlayer) {
        c.scale = c.scale || 1.25;
      }
    });

    // Se il personaggio scelto è 'none' o non esiste nella stanza, gestiamo l'aggiunta
    if (currentPlayerId === 'none') {
      this.renderCharacters.set(false);
      this.gameState.set({ ...state, characters: [...state.characters] });
      return;
    }

    const playerInScene = state.characters.find(c => c.isPlayer);
    if (!playerInScene) {
      let name = 'Elias';
      if (currentPlayerId === 'lisa') name = 'Lisa';
      if (currentPlayerId === 'sarah') name = 'Sarah';

      state.characters.push({
        id: currentPlayerId,
        name: name,
        position: { x: 50, y: 75 },
        scale: 1.25,
        status: 'idle',
        isPlayer: true,
        isMoving: false,
        direction: 'right'
      });
    }

    // Stabilizza altri personaggi e assicura ID corretti
    state.characters.forEach(c => {
      const name = c.name.toLowerCase();
      if (name === 'lisa') { c.id = 'lisa'; c.scale = c.scale || 1.25; }
      if (name === 'elias' || name === 'medico') { c.id = 'elias'; c.scale = c.scale || 1.25; }
      if (name === 'sarah') { c.id = 'sarah'; c.scale = c.scale || 1.25; }
      if (name === 'kael') { c.id = 'kael'; c.scale = c.scale || 1.35; }
      if (name === 'mina') { c.id = 'mina'; c.scale = c.scale || 1.15; }
    });

    this.gameState.set({ ...state, characters: [...state.characters] });

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
      if (state.visualCue === 'Calibration Room Grid' || state.flags?.['calibration_mode']) {
        this.currentImage.set('/calibration-room.png');
      } else if (state.visualCue === 'Medieval Stone Chamber' || state.flags?.['medieval_mode']) {
        this.currentImage.set('/stanza_vuota.png');
      } else if (state.roomName === 'Ponte di Comando' || state.roomName === 'Bridge') {
        this.currentImage.set('/bridge-command-room.png');
      } else {
        this.gemini.generateImage(state.visualCue).then(url => {
          if (url) this.currentImage.set(url);
        });
      }
    }

    if (state.gameOver) {
      this.addLog('system', '--- CONNESSIONE TERMINATA ---');
    }

    // Check for Level Transition Video
    if (state.transitionVideo) {
      this.playVideoTransition(state.transitionVideo);
    }
  }

  /**
   * Riproduce una cutscene video a schermo intero
   * @param videoName Nome del file video in /public (es. 'win.mp4')
   */
  playVideoTransition(videoName: string) {
    this.currentVideoSrc.set(`/${videoName}`);
    this.isVideoPlaying.set(true);

    // Il video gestirà autonomamente la fine tramite l'evento (ended) nel template
  }

  onVideoEnded() {
    this.isVideoPlaying.set(false);
    this.currentVideoSrc.set('');
    // Qui si potrebbe triggerare il caricamento del livello successivo
    this.addLog('system', 'Transizione completata. Caricamento sequenza successiva...');
  }

  private addLog(type: LogEntry['type'], text: string) {
    this.logs.update(prev => [...prev, { type, text }]);
  }

  // ========== NUOVI METODI LUCASARTS ==========

  /**
   * Gestisce la selezione di un'azione dalla Action Bar
   */
  onActionSelected(action: ActionType) {
    this.addLog('system', `Azione selezionata: ${action}`);
    // TODO: Implementare logica per cambiare cursore/modalità interazione
  }

  /**
   * Gestisce il toggle dell'inventario
   */
  onInventoryToggled() {
    this.inventoryService.toggleInventory();
  }

  /**
   * Cambia l'ambiente di gioco
   */
  async changeEnvironment(envId: string) {
    this.isLoading.set(true);
    try {
      this.addLog('system', `Accesso all'ambiente: ${envId.toUpperCase()}...`);
      let action = 'start';
      if (envId === 'test') action = 'calibration';
      if (envId === 'medieval') action = 'medieval';

      const newState = await this.gemini.sendAction(action);
      await this.updateGameState(newState);
    } catch (err) {
      this.addLog('error', 'Cambio ambiente fallito.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cambia il personaggio attivo (Giocatore)
   * @param charId ID del personaggio da attivare (es. 'elias', 'sarah')
   */
  handleCharacterChange(charId: string) {
    const id = charId.toLowerCase();
    this.activePlayerId.set(id);
    this.renderCharacters.set(id !== 'none');

    const state = this.gameState();
    if (state) {
      if (id === 'none') {
        this.addLog('system', 'Neural Link Severed. Ghost Mode Active.');
      } else {
        this.addLog('system', `Cambio pilota: Attivazione sistema neurale per ${charId.toUpperCase()}...`);
      }
      this.updateGameState(state);
    }
  }

  /**
   * Toggle visibilità personaggi
   */
  toggleCharacters() {
    this.renderCharacters.update(v => !v);
    this.addLog('system', `Visualizzazione personaggi: ${this.renderCharacters() ? 'ATTIVA' : 'DISATTIVATA'}`);
  }

  /**
   * Termina la sessione (Exit)
   */
  terminateSession() {
    if (confirm('TERMINARE LA SESSIONE? Tutti i dati non salvati andranno persi.')) {
      window.close(); // Nota: spesso i browser bloccano window.close() se non aperta da script
      this.addLog('system', 'SESSIONE TERMINATA.');
      // Fallback: reset game
      location.reload();
    }
  }
}