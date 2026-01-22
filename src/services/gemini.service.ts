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
  
  // Initial system instruction from the user prompt
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

--- ENGINE LOGIC: MACCHINA A STATI ---
Devi gestire la progressione della storia attraverso questi stati ("storyState"):
1. "EMERGENCY" (Inizio): Luci rosse, panico.
   - Obiettivi: Calmare Sarah (Dialogo), Riparare il tubo (Usa Chiave Inglese su Tubo).
2. "REPAIR": Calma ristabilita, fumo diradato.
   - Obiettivi: Usare la console di navigazione per tracciare la rotta.
3. "PRE_JUMP": Rotta calcolata, sistemi verdi.
   - Obiettivi: Tirare la leva dell'iperguida.
4. "JUMP": Cutscene finale del salto (GameOver = true).

--- ENGINE LOGIC: OGGETTI (OnItemUsed) ---
Valida rigorosamente l'uso degli oggetti:
- Se l'utente usa "Chiave Inglese" (Wrench) su "Tubo che perde" (Leaking Pipe):
  -> Successo: narrative="Hai stretto il bullone. Il fumo cessa.", flags.pipe_fixed=true.
- Se l'utente usa un oggetto sbagliato:
  -> Fallimento: narrative="Non funzionerà.", non cambiare stato.

PROTOCOLLO DIALOGHI (SCELTA MULTIPLA):
Quando il giocatore interagisce con un personaggio importante, PUOI attivare la "Modalità Dialogo".
Invece di una semplice risposta narrativa, fornisci un array "dialogueOptions".

SCRIPT PERSONAGGI (SCENA 1 - SARAH):
Se l'utente parla con Sarah (Navigatrice), offri queste scelte iniziali:
1. [Approccio Calmo] "Sarah, respira. Dammi solo i dati essenziali." 
   -> Risultato: Sarah si calma (flags.sarah_calm=true). Fornisce coordinate precise.
2. [Approccio Autoritario] "Tenente! Rapporto immediato! Non abbiamo tempo per il panico."
   -> Risultato: Sarah esegue velocemente ma con terrore (flags.sarah_stressed=true).

FORMATO RISPOSTA:
Devi rispondere SEMPRE E SOLO con un oggetto JSON valido. Non usare markdown.
Struttura JSON richiesta:
{
  "roomName": "Nome della stanza attuale",
  "storyState": "EMERGENCY",
  "flags": { "pipe_fixed": false, "sarah_calm": false },
  "narrative": "Testo descrittivo della scena, azione o dialogo.",
  "visualCue": "Descrizione visiva DETTAGLIATA in INGLESE.",
  "pointsOfInterest": [
    {"id": "obj1", "name": "Etichetta UI", "description": "Contesto", "type": "interactable" | "pickup" | "exit" | "character", "status": "locked/unlocked"}
  ],
  "dialogueOptions": [
    {"id": "opt1", "label": "Testo della scelta del giocatore..."}
  ],
  "inventory": ["item1"],
  "characters": [{"name": "Pilot A", "dialogue": "..."}],
  "gameOver": false
}
`;

  // Maintain chat history manually to append new turns
  private chatHistory: any[] = [];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  async startGame(): Promise<GameState> {
    this.chatHistory = []; // Reset history
    // Prompt Scene 1 specific context
    const prompt = `
Iniziamo con la Scena 1: Il Ponte di Comando della Vesper.
Situazione: Siamo appena partiti dalla SSI. Luci rosse di emergenza. Sarah (navigatrice) è in panico, Kael (ingegnere) sta riparando un tubo che perde fumo, Mina (specialista) è svenuta. Io sono Elias.

Genera il JSON iniziale per questa stanza. Imposta storyState="EMERGENCY".
`;
    return this.sendMessage(prompt);
  }

  async sendAction(action: string): Promise<GameState> {
    return this.sendMessage(action);
  }

  // --- SAVE/LOAD SYSTEM ---
  saveGame(state: GameState) {
    const saveData = {
      timestamp: Date.now(),
      state: state,
      history: this.chatHistory
    };
    localStorage.setItem('vesper_save_v1', JSON.stringify(saveData));
    console.log('Game Saved', saveData);
  }

  loadGame(): GameState | null {
    const json = localStorage.getItem('vesper_save_v1');
    if (!json || json === 'undefined') return null; // Added check for 'undefined' string
    
    try {
      const data = JSON.parse(json);
      this.chatHistory = data.history || [];
      return data.state as GameState;
    } catch (e) {
      console.error('Failed to load save', e);
      // Clear corrupt save
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

      // Defensive text extraction
      let responseText: string | undefined = "";
      
      try {
        responseText = response.text;
      } catch (e) {
        console.warn("Error accessing response.text (possibly blocked content):", e);
      }
      
      // Normalize
      if (typeof responseText !== 'string') {
        responseText = "";
      }

      // Clean Markdown code blocks if present
      let cleanText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // STRICT VALIDATION: Check for "undefined" string which causes JSON.parse to crash with specific error
      if (!cleanText || cleanText === 'undefined' || cleanText === 'null') {
         console.warn("Invalid AI response text:", cleanText);
         return this.getFallbackState("Connection Lost (Invalid Data)");
      }

      // Store history only on potential success
      this.chatHistory.push({ role: 'user', parts: [{ text: message }] });
      this.chatHistory.push({ role: 'model', parts: [{ text: cleanText }] });

      // Keep history manageable
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(this.chatHistory.length - 10);
      }

      try {
        return JSON.parse(cleanText) as GameState;
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
      const response = await this.ai.models.generateImages({
        model: this.imageModel,
        prompt: prompt + ", retro sci-fi adventure game style, atmospheric, cinematic lighting, 16:9 aspect ratio, high detail, digital art",
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