/**
 * DEMO HOTSPOTS - Test senza API Key
 * 
 * Questo file permette di testare il sistema hotspots usando un'immagine statica
 * invece di generarla tramite l'API Gemini.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotspotOverlayComponent } from './hotspot-overlay.component';
import { BRIDGE_HOTSPOTS } from '../scenes/bridge-hotspots';

@Component({
    selector: 'app-hotspot-demo',
    standalone: true,
    imports: [CommonModule, HotspotOverlayComponent],
    template: `
    <div class="w-full h-screen bg-black p-8">
      <h1 class="text-cyan-400 text-2xl font-mono mb-4">DEMO SISTEMA HOTSPOTS</h1>
      
      <div class="flex gap-4 mb-4">
        <button 
          (click)="toggleDebug()"
          class="px-4 py-2 bg-slate-800 hover:bg-cyan-900 text-cyan-400 rounded font-mono"
        >
          Debug Mode: {{ debugMode() ? 'ON' : 'OFF' }}
        </button>
        
        <button 
          (click)="togglePipeFixed()"
          class="px-4 py-2 bg-slate-800 hover:bg-amber-900 text-amber-400 rounded font-mono"
        >
          Tubo Riparato: {{ flags().pipe_fixed ? 'SI' : 'NO' }}
        </button>
      </div>

      <!-- Viewport con immagine statica -->
      <div class="relative w-full max-w-4xl h-[600px] bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden">
        <!-- Immagine della scena (placeholder o caricata manualmente) -->
        <img 
          [src]="sceneImage()" 
          alt="Bridge Scene"
          class="w-full h-full object-contain"
        >
        
        <!-- Overlay Hotspots -->
        <app-hotspot-overlay
          class="absolute inset-0"
          [gameFlags]="flags()"
          [debugMode]="debugMode()"
          (hotspotClicked)="onHotspotClick($event)"
        ></app-hotspot-overlay>
      </div>

      <!-- Log delle interazioni -->
      <div class="mt-4 bg-slate-900 border border-slate-700 rounded p-4 max-w-4xl">
        <h2 class="text-amber-500 font-mono mb-2">LOG INTERAZIONI:</h2>
        <div class="space-y-1 max-h-40 overflow-y-auto">
          @for (log of interactionLog(); track $index) {
            <div class="text-cyan-300 text-sm font-mono">
              [{{ log.time }}] {{ log.message }}
            </div>
          }
        </div>
      </div>

      <!-- Info Hotspots -->
      <div class="mt-4 bg-slate-900 border border-slate-700 rounded p-4 max-w-4xl">
        <h2 class="text-green-500 font-mono mb-2">HOTSPOTS ATTIVI ({{ visibleCount() }}/{{ totalCount() }}):</h2>
        <div class="grid grid-cols-2 gap-2 text-xs">
          @for (hotspot of BRIDGE_HOTSPOTS; track hotspot.id) {
            <div 
              class="p-2 rounded"
              [class.bg-green-900/30]="isVisible(hotspot)"
              [class.bg-slate-800/30]="!isVisible(hotspot)"
              [class.text-green-400]="isVisible(hotspot)"
              [class.text-slate-600]="!isVisible(hotspot)"
            >
              {{ hotspot.name }} 
              <span class="text-[10px]">({{ hotspot.type }})</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class HotspotDemoComponent {
    BRIDGE_HOTSPOTS = BRIDGE_HOTSPOTS;

    debugMode = signal(false);
    flags = signal<Record<string, boolean>>({
        pipe_fixed: false,
        emergency_active: true
    });

    // Usa l'immagine caricata dall'utente o un placeholder
    sceneImage = signal('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23111"/><text x="400" y="300" text-anchor="middle" fill="%2306b6d4" font-family="monospace" font-size="20">Carica immagine ponte di comando</text></svg>');

    interactionLog = signal<Array<{ time: string, message: string }>>([
        { time: '00:00', message: 'Sistema hotspots inizializzato' }
    ]);

    toggleDebug() {
        this.debugMode.update(v => !v);
        this.addLog(`Modalità debug ${this.debugMode() ? 'attivata' : 'disattivata'}`);
    }

    togglePipeFixed() {
        this.flags.update(f => ({ ...f, pipe_fixed: !f.pipe_fixed }));
        this.addLog(`Tubo ${this.flags().pipe_fixed ? 'riparato' : 'danneggiato'}`);
    }

    onHotspotClick(hotspot: any) {
        this.addLog(`Click su: ${hotspot.name} [${hotspot.type}]`);
    }

    isVisible(hotspot: any): boolean {
        if (!hotspot.visibleWhen) return true;
        return hotspot.visibleWhen(this.flags());
    }

    visibleCount() {
        return BRIDGE_HOTSPOTS.filter(h => this.isVisible(h)).length;
    }

    totalCount() {
        return BRIDGE_HOTSPOTS.length;
    }

    private addLog(message: string) {
        const time = new Date().toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        this.interactionLog.update(logs => [...logs, { time, message }]);
    }
}
