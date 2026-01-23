import { Component, input, output, ChangeDetectionStrategy, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GameState, PointOfInterest, DialogueOption, GameCharacter } from '../types';
import { HotspotOverlayComponent } from './hotspot-overlay.component';
import { HotspotArea, WALKABLE_AREA } from '../scenes/bridge-hotspots';

@Component({
  selector: 'app-viewport',
  standalone: true,
  imports: [CommonModule, HotspotOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full bg-black select-none flex flex-col">
      
      <!-- Loading Overlay -->
      @if (loading()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm text-amber-500">
          <div class="text-5xl animate-spin mb-4">⟳</div>
          <div class="animate-pulse tracking-widest text-lg">Loading...</div>
        </div>
      }

      <div class="flex-1 bg-black flex items-center justify-center h-full">
        <!-- Scene Container - Full Screen Mobile -->
        <div class="relative w-full h-full max-h-full max-w-full shadow-2xl transition-transform duration-500" (click)="onSceneClick($event)">
          
          <!-- Scene Background Image -->
          @if (imageSrc()) {
            <img [src]="imageSrc()" alt="Scene" class="absolute inset-0 w-full h-full object-cover">
          } @else {
             <div class="absolute inset-0 flex items-center justify-center p-10 text-center text-slate-700 bg-slate-900">
              <div>
                <div class="text-6xl mb-4 opacity-30">🎬</div>
                <p class="font-serif text-sm italic">Scene Loading...</p>
              </div>
            </div>
          }
          
          <!-- Subtle Vignette (less aggressive) -->
          <div class="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-10"></div>

          <!-- Hotspot Overlay Layer -->
          @if (!loading() && imageSrc()) {
            <app-hotspot-overlay
              class="absolute inset-0 z-15"
              [gameFlags]="state()?.flags || {}"
              [debugMode]="true"
              (hotspotClicked)="onHotspotInteract($event)"
            ></app-hotspot-overlay>
          }

          <!-- Walkable Area Visualizer (Debug Only) -->
          @if (!loading()) {
            <div class="absolute border-2 border-green-500/30 bg-green-500/5 pointer-events-none z-10"
                 style="left: 5%; top: 60%; width: 90%; height: 35%;">
                 <span class="absolute top-0 left-0 bg-green-500 text-white text-[8px] px-1 uppercase px-1">Walkable Area</span>
            </div>
          }


        <!-- Character Sprites Layer - REAL PIXEL ART SPRITES -->
        @if (!loading()) {
          <div class="absolute inset-0 z-20 pointer-events-none">
            @for (char of state()?.characters; track char.id) {
               <div 
                 class="absolute flex flex-col items-center"
                 [style.left.%]="char.position?.x || 50"
                 [style.top.%]="char.position?.y || 50"
                 [style.transform]="getCharacterTransform(char)"
               >
                  <!-- Sprite - Real Pixel Art or Fallback -->
                  <div class="relative group pointer-events-auto cursor-pointer" (click)="onInteractCharacter(char)">
                    <!-- Shadow -->
                    <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/50 blur-lg rounded-[100%]"></div>
                    
                    <!-- Character Sprite Rendering -->
                    @if (isSpriteSheet(char)) {
                       <!-- ANIMATED SPRITE SHEET -->
                       <div class="pixel-sprite" [ngStyle]="getSpriteStyle(char)"></div>
                    } @else if (getCharacterSprite(char.name)) {
                      <!-- STATIC SPRITE IMAGE -->
                      <img 
                        [src]="getCharacterSprite(char.name)" 
                        [alt]="char.name"
                        class="w-auto h-32 sm:h-40 object-contain pixel-sprite drop-shadow-2xl"
                        [class.animate-bounce]="char.status === 'panic'"
                        [style.transform]="getFlipTransform(char)"
                      >
                    } @else {
                      <!-- Fallback Placeholder for characters without sprites -->
                      <div 
                        class="w-16 h-32 sm:w-20 sm:h-40 bg-gradient-to-b rounded-lg border-3 border-black/30 shadow-2xl relative overflow-hidden"
                        [class.from-cyan-600]="char.isPlayer"
                        [class.to-cyan-800]="char.isPlayer"
                        [class.from-orange-600]="!char.isPlayer"
                        [class.to-orange-800]="!char.isPlayer"
                        [class.animate-bounce]="char.status === 'panic'"
                        [style.transform]="getFlipTransform(char)"
                      >
                        <!-- Head (Bigger) -->
                        <div class="w-full h-1/3 bg-gradient-to-b from-white/30 to-white/10 top-0 absolute rounded-t-lg"></div>
                        <!-- Face/Visor -->
                        <div class="w-3/4 h-1/6 bg-black/50 top-4 left-1/2 -translate-x-1/2 absolute rounded-full"></div>
                        <!-- Body Details -->
                        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-white/10 rounded"></div>
                      </div>
                    }

                  </div>
               </div>
            }
          </div>
        }


        <!-- Room Label - Top Left -->

        <!-- Dialogue Options Overlay (Centered on Scene) -->
        @if (state()?.dialogueOptions?.length) {
          <div class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
             <h3 class="text-amber-400 font-bold mb-4 tracking-widest uppercase text-lg border-b-2 border-amber-500/50 pb-2">Choose Response</h3>
             <div class="flex flex-col gap-3 w-full max-w-2xl">
               @for (option of state()?.dialogueOptions; track option.id) {
                 <button 
                    (click)="onDialogue(option)"
                    class="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-amber-900 hover:to-amber-900 text-slate-200 hover:text-white border-l-4 border-amber-600 hover:border-amber-400 p-4 text-left transition-all duration-200 shadow-lg group rounded-r-lg"
                 >
                   <span class="text-sm text-amber-500 group-hover:text-amber-300 mr-2 font-bold">▶</span>
                   <span class="font-serif text-base">{{ option.label }}</span>
                 </button>
               }
             </div>
          </div>
        }
      </div>
    </div>
  </div>
  `,
  styles: [`
    .pixel-sprite {
      image-rendering: pixelated;
    }
    
    /* Custom Scrollbar - LucasArts Style */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(245, 158, 11, 0.5);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(245, 158, 11, 0.7);
    }
  `]
})
export class ViewportComponent {
  state = input<GameState | null>(null);
  imageSrc = input<string>('');
  loading = input<boolean>(false);

  interact = output<PointOfInterest>();
  dialogueChoice = output<DialogueOption>();

  // Animation System
  // Globale clock per sincronizzare le animazioni
  private animFrame = signal<number>(0);
  private animationLoop: any;
  private cdr = inject(ChangeDetectorRef);

  private tickCount = 0;

  constructor() {
    // 30ms loop for ~30fps movement
    this.animationLoop = setInterval(() => {
      this.tickCount++;

      // Update character logic
      this.updateCharacterPositions();

      this.cdr.markForCheck();
    }, 30);
  }

  ngOnDestroy() {
    if (this.animationLoop) clearInterval(this.animationLoop);
  }

  onInteract(poi: PointOfInterest) {
    this.interact.emit(poi);
  }

  onSceneClick(event: MouseEvent) {
    // Solo se non c'è un dialogo attivo
    if (this.state()?.dialogueOptions?.length) return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Coordinate in percentuale (0-100)
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;

    // LIMITAZIONI AREA CAMMINABILE (WALKABLE AREA)
    // Elias non può camminare oltre la console (Y < 60%) o fuori dalle mura (X < 5% o X > 95%)
    x = Math.max(WALKABLE_AREA.minX, Math.min(WALKABLE_AREA.maxX, x));
    y = Math.max(WALKABLE_AREA.minY, Math.min(WALKABLE_AREA.maxY, y));

    const player = this.state()?.characters.find(c => c.id === 'elias' || c.isPlayer);
    if (player) {
      player.targetPosition = { x, y };
    }
  }

  updateCharacterPositions() {
    const characters = this.state()?.characters;
    if (!characters) return;

    characters.forEach(char => {
      // Initialize walk distance if undefined
      if (char.walkDistance === undefined) char.walkDistance = 0;

      if (char.targetPosition) {
        const dx = char.targetPosition.x - (char.position?.x || 50);
        const dy = char.targetPosition.y - (char.position?.y || 50);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) {
          // Arrived
          if (char.position) {
            char.position.x = char.targetPosition.x;
            char.position.y = char.targetPosition.y;
          }
          char.targetPosition = undefined;
          char.isMoving = false;
          char.walkDistance = 0; // Reset stride on stop
        } else {
          // Move
          const speed = 0.4; // Significantly Increased speed (was 0.1)
          const moveDist = Math.min(dist, speed);
          const ratio = moveDist / dist;

          if (!char.position) char.position = { x: 50, y: 50 };
          char.position.x += dx * ratio;
          char.position.y += dy * ratio;

          char.isMoving = true;

          // Weighted distance: Y moves further in pixels than X for the same % unit (mobile aspect ratio)
          const visualDist = Math.sqrt(Math.pow(dx * ratio, 2) + Math.pow(dy * ratio * 1.6, 2));
          char.walkDistance += visualDist;

          // DETERMINATE FACING (4-Way) with vertical priority
          if (Math.abs(dy) > Math.abs(dx) * 0.8) {
            // Vertical movement (biased slightly to trigger sooner)
            if (dy > 0) char.facing = 'down';
            else char.facing = 'up';
            char.direction = dx > 0 ? 'right' : 'left';
          } else {
            // Horizontal dominant
            if (dx > 0) {
              char.facing = 'right';
              char.direction = 'right';
            } else {
              char.facing = 'left';
              char.direction = 'left';
            }
          }
        }
      } else {
        char.isMoving = false;
      }
    });

    // Update global animation frame based on time as fallback
    if (this.tickCount % 4 === 0) {
      this.animFrame.update(f => f + 1);
    }
  }

  // Gestisce i click sugli hotspots dell'immagine
  onHotspotInteract(hotspot: HotspotArea) {
    const poi: PointOfInterest = {
      id: hotspot.id,
      name: hotspot.name,
      description: hotspot.description,
      type: hotspot.type,
      status: hotspot.status
    };
    this.interact.emit(poi);
  }

  getCharacterTransform(char: GameCharacter): string {
    const y = char.position?.y || 50;
    // Scala progressiva: 0.8 (lontano) -> 1.3 (vicino)
    const progress = Math.max(0, Math.min(1, (y - 15) / 80));
    const totalScale = (char.scale || 1) * (0.8 + progress * 0.5);

    // Ancoraggio all'88% Y: calibrato per far coincidere il punto del click
    // esattamente con la base dei piedi nel frame da 256px di medico.png
    return `translate(-50%, -88%) scale(${totalScale})`;
  }

  getFlipTransform(char: GameCharacter): string {
    // Only flip if using Left/Right specific assets that need mirroring
    return char.direction === 'left' ? 'scaleX(-1)' : 'none';
  }

  onInteractCharacter(char: GameCharacter) {
    if (char.isPlayer) return;
    const poi: PointOfInterest = {
      id: char.id,
      name: char.name,
      description: char.name,
      type: 'character',
      status: 'unlocked'
    };
    this.interact.emit(poi);
  }

  // Determine if we should use sprite sheet rendering
  isSpriteSheet(char: GameCharacter): boolean {
    // Abilitiamo lo sprite sheet per Elias
    if (char.name === 'Elias' || char.id === 'elias') return true;
    return false;
  }

  getSpriteSheet(char: GameCharacter): string {
    if (char.name === 'Elias' || char.id === 'elias') return '/medico.png';
    return '';
  }

  // Calcola la posizione background-position per mostrare il frame giusto
  getSpriteStyle(char: GameCharacter): { [klass: string]: any } {
    if (!this.isSpriteSheet(char)) return {};

    const frameSize = 128; // Assuming 128x128 grid
    const framesPerRow = 8;

    // Row Mapping for medico.png:
    // Row 0: Horizontal Walk (Mirror for Left)
    // Row 1: Walk Down (as specified: "seconda riga e il camminata verso il basso")
    // Row ?: Walk Up (Assuming Row 2 until further notice)
    // Idle uses the first image (Row 1, Frame 0 based on "la prima immagine e la posizione ferma" in the context of walk down)
    // Actually, usually Row 1 is Walk Down. "prima immagine" might mean Row 1 Frame 0 when idle.

    // MAPPING CORRETTO PER medico.png:
    // Riga 0 (indice 0): Camminata Laterale (e fallback per UP)
    // Riga 1 (indice 1): Camminata Frontale (DOWN)

    let row = 1; // Default alla riga frontale
    if (char.isMoving) {
      switch (char.facing) {
        case 'up': row = 0; break;    // Uso la riga side (0) come fallback per 'up'
        case 'down': row = 1; break;  // La riga frontale è la 1
        case 'left': row = 0; break;
        case 'right': row = 0; break;
        default: row = 1;
      }
    } else {
      row = 1; // Idle front
    }

    let currentFrame = 0;
    if (char.isMoving) {
      const stride = 2.8;
      const walkDist = char.walkDistance || 0;
      currentFrame = Math.floor(walkDist / stride) % framesPerRow;
    } else {
      currentFrame = 0;
    }

    // Calcolo posizione: Usiamo 256px come altezza dello slot (rowHeight)
    const frameWidth = 128;
    const rowHeight = 256;

    const xPos = -(currentFrame * frameWidth);
    const yPos = -(row * rowHeight);

    // Determine transform for flipping (Solo riga 0)
    let transform = 'none';
    if (char.isMoving && char.facing === 'left' && row === 0) {
      transform = 'scaleX(-1)';
    }

    return {
      'width.px': frameWidth,
      'height.px': rowHeight,
      'background-image': `url(${this.getSpriteSheet(char)})`,
      'background-size': '1024px auto',
      'background-position': `${xPos}px ${yPos}px`,
      'padding-bottom.px': 0,
      'background-repeat': 'no-repeat',
      'transform': transform,
      'transform-origin': 'bottom center',
      'overflow': 'visible',
      'image-rendering': 'pixelated'
    };
  }

  // Fallback old sprite getter
  getCharacterSprite(characterName: string): string | null {
    const sprites: { [key: string]: string } = {
      'Sarah': '/character-sarah.png',
      'Elias': '/character-elias.png', // Fallback se non usa sheet
      'Kael': '/character-kael.png',
      'Mina': '/character-mina.png'
    };
    return sprites[characterName] || null;
  }

  onDialogue(option: DialogueOption) {
    this.dialogueChoice.emit(option);
  }
}
