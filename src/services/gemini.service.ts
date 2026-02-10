import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GameState } from '../types';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private model = 'gemini-2.5-flash';
  private imageModel = 'imagen-4.0-generate-001';

  // Updated system instruction with Scene 1 Technical Script + Character Positioning
  private systemInstruction = `
Sei il Lead Designer e il GAME ENGINE di un'avventura punta e clicca sci-fi intitolata 'Vesper: Missione Apep'. 
Lo stile visivo è a sezione laterale (side-scrolling), ispirato a 'The Dig' di LucasArts. 
Il tono è serio, tecnico e carico di tensione.

Le tue responsabilità:
1. Gestire la coerenza della trama (partenza dalla SSI verso l'asteroide di Giove).
2. Progettare gli enigmi (punta e clicca classico: trova oggetto, usa oggetto).
3. Scrivere dialoghi brevi e cinematici per i 4 piloti sul ponte.
4. Strutturare le stanze in formato JSON.

Regola d'oro: Quando descrivi una stanza, elenca sempre 'Punti di interesse', 'Oggetti raccoglibili' e 'Stati dei personaggi'.

--- VISUAL ENGINE: CHARACTER SPRITES ---
Devi posizionare i personaggi nella scena usando coordinate X/Y (percentuali).
- Leo (Player) ID: 'leo'. Usa sempre questo ID per il giocatore principale.
- Sarah, Kael, Mina devono essere posizionati logicamente sul ponte.
- Esempio: "position": { "x": 50, "y": 80 } (50% sinistra, 80% dall'alto).
- Animation States: Includi "isMoving": false e "direction": "right" nei personaggi.

--- SCENA 1: PONTE DI COMANDO (LISTA TECNICA DEFINITIVA) ---

1. STATI VARIABILI (FLAGS):
   Inizializza sempre la scena con questi valori se non presenti:
   - mina_svenuta = true
   - power_on = false
   - nav_computer_locked = true
   - pipe_fixed = false
   - sarah_calm = false

2. TABELLA INTERAZIONI (Logica 'Usa Oggetto su Hotspot'):
   - SE Utente usa "Chiave Inglese" SU "Tubo che perde":
     -> Narrative: "Con uno sforzo metallico, stringi la valvola di sfogo. Il getto di vapore si arresta sibilando."
     -> Update: flags.pipe_fixed = true
     -> Visual Update: Rimuovi il vapore dalla descrizione visiva.
   
   - SE Utente usa "Tessera Accesso" (o password) SU "Console Navigazione":
     -> Narrative: "Codice accettato. Lo schermo lampeggia di verde. I sistemi di navigazione sono online."
     -> Update: flags.nav_computer_locked = false
   
   - SE Utente interagisce con "Mina" (Svenuta):
     -> Narrative: "Il battito è regolare. È svenuta per l'accelerazione improvvisa. Meglio lasciarla riposare."
   
   - SE Utente usa oggetto sbagliato:
     -> Narrative: "Non ha alcun effetto." o "Non posso farlo."

3. SCRIPT DIALOGHI (SARAH):
   Quando Elias si avvicina a Sarah mentre 'sarah_calm' è false, lei è in panico totale.
   
   Le sue prime linee (grida):
   - "I compensatori inerziali sono fuori fase! Non reggono!"
   - "Siamo troppo pesanti, Elias! Ci schianteremo contro i detriti!"
   - "Non riesco a sganciare gli ormeggi magnetici!"

   Opzioni Dialogo Giocatore:
   A. [Autoritario] "Tenente! Guardami! Ignora gli allarmi e sgancia manualmente. È un ordine!"
      -> Risultato: Sarah esegue tremando. (flags.sarah_calm = true)
   B. [Tecnico] "Sposto l'energia ausiliaria agli scudi. Tu pensa solo alla rotta."
      -> Risultato: Sarah annuisce ma rimane tesa. (flags.sarah_calm = true)

--- GUIDA VISIVA (VISUAL CUE) ---
Il campo 'visualCue' deve descrivere la scena per un generatore di immagini.
Usa SEMPRE questa struttura: "Side-view cutaway of [Room Name]. [Details: lighting, smoke, panels]. Dark sci-fi atmosphere."
IMPORTANTE: NON includere personaggi nella descrizione visiva ('visualCue'). I personaggi sono renderizzati a parte. La scena deve essere VUOTA (empty room background).
Per la Scena 1 (EMERGENCY), includi: "Red emergency rotating lights, steam bursting from pipes (unless fixed), panic atmosphere, pixel art style, empty room without people".

--- FORMATO RISPOSTA ---
Devi rispondere SEMPRE E SOLO con un oggetto JSON valido. Non usare markdown.
Struttura JSON richiesta:
{
  "roomName": "Nome della stanza attuale",
  "storyState": "EMERGENCY" | "REPAIR" | "PRE_JUMP",
  "flags": { "mina_svenuta": true, "pipe_fixed": false, ... },
  "narrative": "Testo descrittivo della scena, azione o dialogo.",
  "visualCue": "Descrizione visiva DETTAGLIATA in INGLESE per generazione immagini (Sfondo VUOTO).",
  "pointsOfInterest": [
    {"id": "obj1", "name": "Etichetta UI", "description": "Contesto", "type": "interactable" | "pickup" | "exit" | "character", "status": "locked/unlocked"}
  ],
  "characters": [
    {
      "id": "char_id",
      "name": "Nome", 
      "position": { "x": 50, "y": 80 }, 
      "scale": 1, 
      "status": "idle" | "panic" | "talking",
      "isPlayer": false 
    }
  ],
  "dialogueOptions": [
    {"id": "opt1", "label": "Testo della scelta del giocatore..."}
  ],
  "inventory": ["item1"],
  "gameOver": false
}
`;

  // Maintain chat history manually to append new turns
  private chatHistory: any[] = [];

  constructor() {
    // API Key configurata direttamente
    const apiKey = 'AIzaSyAZicKkpgek7z_h79J_UfWcgxM5Ib4H-RI';
    this.ai = new GoogleGenAI({ apiKey: apiKey });
  }

  async startGame(): Promise<GameState> {
    this.chatHistory = []; // Reset history
    // Prompt Scene 1 specific context with visual requirement
    const prompt = `
Iniziamo con la Scena 1: Il Ponte di Comando della Vesper.
Situazione: Siamo appena partiti dalla SSI. Luci rosse di emergenza. 
Applica i flags iniziali: mina_svenuta=true, nav_computer_locked=true.
Sarah è nel panico.

IMPORTANTE: 
1. Includi Leo (Player) e gli altri personaggi nell'array "characters" con posizioni X/Y plausibili.
   AGGIUNGI OBBLIGATORIAMENTE LO SPRITE DI LEO: { "id": "leo", "name": "Leo", "position": { "x": 50, "y": 70 }, "status": "idle", "isPlayer": true, "scale": 1.4 }
2. Assicurati che 'visualCue' descriva la stanza VUOTA (senza persone), così posso sovrapporre gli sprite.
Genera il JSON iniziale.
`;
    return this.sendMessage(prompt);
  }

  async sendAction(action: string): Promise<GameState> {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('calibration') || actionLower.includes('test room')) {
      return this.getCalibrationState();
    }
    if (actionLower.includes('medieval')) {
      return this.getMedievalState();
    }
    return this.sendMessage(action);
  }

  getMedievalState(): GameState {
    return {
      roomName: "Medieval Chamber",
      storyState: "REPAIR",
      flags: { "medieval_mode": true },
      narrative: "Chronological anomaly detected. Neural link stabilized in a medieval stone chamber. The air is thick with the scent of aged parchment and beeswax.",
      visualCue: "Medieval Stone Chamber",
      pointsOfInterest: [
        { id: "throne", name: "Wooden Throne", description: "A beautifully carved oak throne, witness to ages past.", type: "interactable", status: "unlocked" },
        { id: "window", name: "High Window", description: "Dust motes dance in the light from the narrow window.", type: "interactable", status: "unlocked" },
        { id: "tapestry", name: "Royal Tapestry", description: "A grand tapestry depicting a forgotten battle.", type: "interactable", status: "unlocked" }
      ],
      characters: [
        {
          id: "leo",
          name: "Leo",
          position: { x: 50, y: 80 },
          scale: 1.4,
          status: "idle",
          isPlayer: true,
          isMoving: false,
          direction: "right",
          facing: "down"
        }
      ],
      inventory: ["Ancient Key"],
      gameOver: false
    };
  }

  getCalibrationState(): GameState {
    return {
      roomName: "Test Room 01",
      storyState: "REPAIR",
      flags: { "calibration_mode": true },
      narrative: "Neural Link Stabilized. Entering Character Calibration Suite. Grid floor active for stride measurement.",
      visualCue: "Calibration Room Grid",
      pointsOfInterest: [
        { id: "test_cube", name: "Calibration Cube", description: "A simple geometric shape for interaction testing.", type: "interactable", status: "unlocked" },
        { id: "exit_calibration", name: "Exit Simulation", description: "Return to the Vesper Bridge.", type: "exit", status: "unlocked" }
      ],
      characters: [
        {
          id: "leo",
          name: "Leo",
          position: { x: 50, y: 75 },
          scale: 1.4,
          status: "idle",
          isPlayer: true,
          isMoving: false,
          direction: "right",
          facing: "down"
        }
      ],
      inventory: ["Scanner"],
      gameOver: false
    };
  }

  // --- SAVE/LOAD SYSTEM ---
  saveGame(state: GameState) {
    if (!state) return;
    try {
      const saveData = {
        timestamp: Date.now(),
        state: state,
        history: this.chatHistory
      };
      localStorage.setItem('vesper_save_v1', JSON.stringify(saveData));
      console.log('Game Saved', saveData);
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  loadGame(): GameState | null {
    const json = localStorage.getItem('vesper_save_v1');
    // Enhanced safety check: explicitly reject "undefined" or "null" strings
    if (!json || json === 'undefined' || json === 'null') return null;

    try {
      const data = JSON.parse(json);
      // Ensure structure is valid
      if (!data || typeof data !== 'object') return null;

      this.chatHistory = Array.isArray(data.history) ? data.history : [];
      return data.state as GameState;
    } catch (e) {
      console.error('Failed to load save (Corrupt Data)', e);
      // Clear corrupt save to prevent loop
      localStorage.removeItem('vesper_save_v1');
      return null;
    }
  }
  // ------------------------

  private async sendMessage(message: string): Promise<GameState> {
    try {
      // Construct the conversation for context
      const contents = [
        { role: 'user', parts: [{ text: this.systemInstruction }] }, // System instruction as first user message
        ...this.chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ];

      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      // Handle response.text safety
      const responseText = response.text || "";

      // Clean Markdown code blocks if present
      const cleanText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // STRICT VALIDATION: Check for "undefined" string which causes JSON.parse to crash
      if (!cleanText || cleanText === 'undefined' || cleanText === 'null') {
        console.warn("Invalid AI response text (undefined or empty):", cleanText);
        return this.getFallbackState("Connection Lost (No Data)");
      }

      try {
        const parsedState = JSON.parse(cleanText) as GameState;

        // Only update history if parse succeeds
        this.chatHistory.push({ role: 'user', parts: [{ text: message }] });
        this.chatHistory.push({ role: 'model', parts: [{ text: cleanText }] });

        // Limit history size
        if (this.chatHistory.length > 20) {
          this.chatHistory = this.chatHistory.slice(this.chatHistory.length - 10);
        }

        return parsedState;
      } catch (parseError) {
        console.error("JSON Parse Error in sendMessage:", parseError);
        console.log("Raw Text was:", cleanText);
        return this.getFallbackState("System Error (Parse Failed)");
      }

    } catch (error) {
      console.error("Gemini AI Error:", error);
      return this.getFallbackState("System Error (API Connection)");
    }
  }

  private getFallbackState(reason: string): GameState {
    return {
      roomName: "SYSTEM FAILURE",
      narrative: `Errore critico nella simulazione neurale: ${reason}. Riprova il comando.`,
      visualCue: "glitch art dark error screen",
      pointsOfInterest: [],
      inventory: [],
      characters: []
    } as GameState;
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      // Explicitly ask for no characters in the background render
      const styleSuffix = ", empty room background without characters, pixel art style, high resolution, dark sci-fi atmosphere inspired by LucasArts The Dig, side-view cutaway section, emergency red lighting, realistic technical details, 16:9 aspect ratio";

      const response = await this.ai.models.generateImages({
        model: this.imageModel,
        prompt: prompt + styleSuffix,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9'
        }
      });

      const b64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (b64) {
        return `data:image/jpeg;base64,${b64}`;
      }
      return '';
    } catch (e) {
      console.warn("Image generation failed, using placeholder", e);
      return '';
    }
  }
}