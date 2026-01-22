import { Component, input, output, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GameState, PointOfInterest, DialogueOption } from '../types';

@Component({
  selector: 'app-viewport',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full bg-black overflow-hidden border-2 border-slate-800 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      
      <!-- Loading Overlay -->
      @if (loading()) {
        <div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-cyan-500 font-mono">
          <div class="text-4xl animate-spin mb-4">⟳</div>
          <div class="animate-pulse tracking-widest">ELABORAZIONE DATI NEURALI...</div>
        </div>
      }

      <!-- Main Scene Image -->
      <div class="absolute inset-0 flex items-center justify-center bg-slate-900">
        @if (imageSrc()) {
          <img [src]="imageSrc()" alt="Scene" class="w-full h-full object-cover opacity-90 transition-opacity duration-1000">
        } @else {
          <!-- Fallback Text Visualizer -->
           <div class="p-10 text-center text-slate-600">
             <div class="text-6xl mb-4 opacity-20">⚠</div>
             <p class="font-mono text-xs uppercase tracking-widest">Visual Feed Offline</p>
           </div>
        }
        
        <!-- Vignette & Scanlines Effect -->
        <div class="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIC8+Cjwvc3ZnPg==')] opacity-30 pointer-events-none"></div>
      </div>

      <!-- Dialogue Mode Overlay (Higher Z-Index than POIs) -->
      @if (state()?.dialogueOptions?.length) {
        <div class="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-300">
           <h3 class="text-cyan-400 font-bold mb-6 tracking-widest uppercase border-b border-cyan-500/50 pb-2">Opzioni Dialogo</h3>
           <div class="flex flex-col gap-4 w-full max-w-lg">
             @for (option of state()?.dialogueOptions; track option.id) {
               <button 
                  (click)="onDialogue(option)"
                  class="bg-slate-800 hover:bg-cyan-900 text-slate-200 hover:text-white border-l-4 border-cyan-600 hover:border-amber-400 p-4 text-left transition-all duration-200 shadow-lg group"
               >
                 <span class="text-xs text-cyan-500 group-hover:text-amber-400 mr-2">>></span>
                 {{ option.label }}
               </button>
             }
           </div>
        </div>
      }

      <!-- Interactive Points (Hidden during dialogue if preferred, or obscured) -->
      @if (!state()?.dialogueOptions?.length) {
        <div class="absolute inset-0 z-10 p-8">
           <div class="absolute top-4 left-4 bg-black/60 text-amber-500 px-3 py-1 border border-amber-500/30 rounded text-sm font-bold uppercase tracking-widest backdrop-blur-sm">
             {{ state()?.roomName || 'CONNESSIONE...' }}
           </div>

           <div class="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
              @for (poi of state()?.pointsOfInterest; track poi.id) {
                <button 
                  (click)="onInteract(poi)"
                  class="group relative bg-slate-900/80 hover:bg-cyan-900/90 text-cyan-100 border border-slate-600 hover:border-cyan-400 px-4 py-2 rounded transition-all duration-200 backdrop-blur-md shadow-lg flex items-center space-x-2 overflow-hidden"
                >
                  <span class="text-xs opacity-70 group-hover:text-cyan-300">
                    @switch (poi.type) {
                      @case ('exit') { [EXIT] }
                      @case ('pickup') { [GET] }
                      @case ('character') { [TALK] }
                      @default { [USE] }
                    }
                  </span>
                  <span class="font-mono font-bold tracking-tight">{{ poi.name }}</span>
                  @if (poi.status) {
                    <span class="text-[10px] uppercase text-red-400 ml-1 opacity-75">[{{poi.status}}]</span>
                  }
                  
                  <div class="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              }
           </div>
        </div>
      }

    </div>
  `
})
export class ViewportComponent {
  state = input<GameState | null>(null);
  imageSrc = input<string>('');
  loading = input<boolean>(false);
  
  interact = output<PointOfInterest>();
  dialogueChoice = output<DialogueOption>();

  onInteract(poi: PointOfInterest) {
    this.interact.emit(poi);
  }

  onDialogue(option: DialogueOption) {
    this.dialogueChoice.emit(option);
  }
}