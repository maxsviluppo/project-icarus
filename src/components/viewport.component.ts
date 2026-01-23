import { Component, input, output, ChangeDetectionStrategy, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GameState, PointOfInterest, DialogueOption, GameCharacter } from '../types';
import { HotspotOverlayComponent } from './hotspot-overlay.component';
import { HotspotArea } from '../scenes/bridge-hotspots';

@Component({
  selector: 'app-viewport',
  standalone: true,
  imports: [CommonModule, HotspotOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full bg-black select-none flex flex-col overflow-hidden">
      
      <!-- Loading Overlay -->
      @if (loading()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm text-amber-500">
          <div class="text-5xl animate-spin mb-4">⟳</div>
          <div class="animate-pulse tracking-widest text-lg">Loading...</div>
        </div>
      }

      <!-- Main Scene Area (Full Height) - LucasArts Style -->
      <div class="flex-1 bg-black flex items-center justify-center overflow-hidden">
        
        <!-- Scene Container Forced to 9:16 Aspect Ratio (Smartphone Mode) -->
        <div class="relative w-full aspect-[9/16] max-h-full max-w-full shadow-2xl transition-transform duration-500" style="transform: translateY(-180px)" (click)="onSceneClick($event)">
          
          <!-- Scene Background Image -->
          @if (imageSrc()) {
            <img [src]="imageSrc()" alt="Scene" class="absolute inset-0 w-full h-full object-contain">
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
              [debugMode]="false"
              (hotspotClicked)="onHotspotInteract($event)"
            ></app-hotspot-overlay>
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
                       <div class="pixel-sprite w-32 h-32" [ngStyle]="getSpriteStyle(char)"></div>
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

      // Update global animation frame (used for walking)
      if (this.tickCount % 4 === 0) {
        this.animFrame.update(f => f + 1);
      }

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
    // Only allow movement if no dialogue is active
    if (this.state()?.dialogueOptions?.length) return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Calculate percentage coordinates
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Find player (Elias/Elisa)
    const player = this.state()?.characters.find(c => c.id === 'elias' || c.isPlayer);
    if (player) {
      // Clamp Y to "floor" area (e.g. 40% to 98%) to prevent walking on walls/ceiling
      const clampedY = Math.max(40, Math.min(98, y));
      player.targetPosition = { x, y: clampedY };
    }
  }

  updateCharacterPositions() {
    const characters = this.state()?.characters;
    if (!characters) return;

    characters.forEach(char => {
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
        } else {
          // Move
          const speed = 0.1; // Faster speed (was 0.05)
          const moveDist = Math.min(dist, speed);
          const ratio = moveDist / dist;

          if (!char.position) char.position = { x: 50, y: 50 };
          char.position.x += dx * ratio;
          char.position.y += dy * ratio;

          char.isMoving = true;
          // FLIP Direction
          if (dx > 0) char.direction = 'right';
          else if (dx < 0) char.direction = 'left';
        }
      } else {
        char.isMoving = false;
      }
    });
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
    const baseScale = (char.scale || 1) * 1.2;
    // Depth scaling: Starts increasing from y=40 up to y=100
    // Max increase 20% (multiplier 1.2) at the bottom of the screen
    const depthFactor = 1 + Math.max(0, (y - 40) / 60) * 0.2;

    // Anchor at -90% Y so the coordinate represents the feet, not the center
    return `translate(-50%, -90%) scale(${baseScale * depthFactor})`;
  }

  getFlipTransform(char: GameCharacter): string {
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

    const frameSize = 128; // 128x128
    const framesPerRow = 8; // Updated to 8 frames as per specs

    // Row selection based on user specs:
    // Row 0 (1st row): Walk (dx/sx)
    // Row 1 (2nd row): Idle (Fermo)
    // Row 2,3: Walk retro (ignored for now)

    let row = 1; // Default to Idle (Index 1)

    if (char.isMoving) {
      row = 0; // Walk (Index 0)
    }

    let currentFrame = 0;

    if (char.isMoving) {
      // Walk (Row 0): CICLO DI 8 FRAME (1024px totali)
      currentFrame = this.animFrame() % framesPerRow;
    } else {
      // Idle (Row 1): 8 frames cycle for "breathing" effect
      // Update frame every ~300ms (10 ticks)
      currentFrame = Math.floor(this.tickCount / 10) % framesPerRow;
    }

    // Offset manuale
    // Centriamo 80px in 128px: (128-80)/2 = 24px di taglio per lato
    const xOffset = -34;
    const yOffset = 0;

    const xPos = -(currentFrame * frameSize) + xOffset;
    const yPos = -(row * frameSize) + yOffset;

    return {
      'width.px': 60, // Slimmer width (60px)
      'height.px': frameSize,
      'background-image': `url(${this.getSpriteSheet(char)})`,
      'background-size': '1024px 256px', // 8 cols x 2 rows
      'background-position': `${xPos}px ${yPos}px`,
      'background-repeat': 'no-repeat',
      'transform': char.direction === 'left' ? 'scaleX(-1)' : 'none',
      'overflow': 'hidden'
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
