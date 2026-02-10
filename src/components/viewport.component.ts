import { Component, input, output, ChangeDetectionStrategy, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GameState, PointOfInterest, DialogueOption, GameCharacter } from '../types';
import { HotspotOverlayComponent } from './hotspot-overlay.component';
import { HotspotArea, BRIDGE_HOTSPOTS, isPointInWalkableArea } from '../scenes/bridge-hotspots';
import { CALIBRATION_HOTSPOTS, isPointInCalibrationWalkableArea } from '../scenes/calibration-hotspots';
import { MEDIEVAL_HOTSPOTS, isPointInMedievalWalkableArea } from '../scenes/medieval-hotspots';

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
          
          <!-- Background Layer (Space Covering) - ALWAYS ON -->
          <div class="absolute inset-0 z-[-1] overflow-hidden bg-black">
            <img src="/sfondo.png" alt="Full Background" class="w-full h-full object-cover opacity-80 animate-slowPulse">
          </div>

          <!-- Scene Background Image - Centered and Scaled -->
          @if (imageSrc()) {
            <img [src]="imageSrc()" alt="Scene" class="absolute inset-0 w-full h-full object-contain pixel-sprite z-0" [class.room-centered]="isMedieval()">
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
          @if (!loading() && imageSrc() && !isMedieval()) {
            <app-hotspot-overlay
              class="absolute inset-0 z-30"
              [gameFlags]="state()?.flags || {}"
              [debugMode]="false"
              [customHotspots]="currentHotspots()"
              (hotspotClicked)="onHotspotInteract($event)"
            ></app-hotspot-overlay>
          }

        <!-- Character Sprites Layer -->
        @if (!loading() && renderCharacters()) {
          <div class="absolute inset-0 z-20 pointer-events-none">
            @for (char of state()?.characters; track char.id) {
                <div 
                  class="absolute"
                  [style.left.%]="char.position?.x || 50"
                  [style.top.%]="char.position?.y || 50"
                  [ngStyle]="getCharacterContainerStyle(char)"
                >
                  <div class="relative w-full h-full group pointer-events-auto cursor-pointer" (click)="onInteractCharacter(char)">
                    <!-- Shadow: Più chiara (bg-black/30) -->
                    <div class="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[28%] h-[5%] bg-black/30 blur-[1px] rounded-[100%] z-0"></div>
                    
                    @if (isSpriteSheet(char)) {
                       <div class="pixel-sprite relative w-full h-full z-10" [ngStyle]="getSpriteStyle(char)"></div>
                    } @else if (getCharacterSprite(char.name)) {
                       <img 
                         [src]="getCharacterSprite(char.name)" 
                         [alt]="char.name"
                         class="w-full h-full object-contain pixel-sprite drop-shadow-2xl relative z-10"
                         [class.animate-bounce]="char.status === 'panic'"
                         [style.transform]="getFlipTransform(char)"
                       >
                    }
                  </div>

                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-20">
                    <span class="text-[8px] text-cyan-400 font-bold uppercase tracking-widest">{{char.name}}</span>
                  </div>
                </div>
            }
          </div>
        }

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

    .room-centered {
      transform: scale(1.25);
      transform-origin: center center;
    }

    @keyframes slowPulse {
      0%, 100% { transform: scale(1.0); opacity: 0.8; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    .animate-slowPulse {
      animation: slowPulse 10s ease-in-out infinite;
    }
  `]
})
export class ViewportComponent {
  state = input<GameState | null>(null);
  imageSrc = input<string>('');
  loading = input<boolean>(false);
  renderCharacters = input<boolean>(true);

  interact = output<PointOfInterest>();
  dialogueChoice = output<DialogueOption>();

  private animFrame = signal<number>(0);
  private animationLoop: any;
  private cdr = inject(ChangeDetectorRef);
  private tickCount = 0;

  isMedieval = computed(() => {
    const s = this.state();
    return s?.flags?.['medieval_mode'] === true;
  });

  currentHotspots = computed(() => {
    const s = this.state();
    if (s?.roomName === 'Test Room 01' || s?.flags?.['calibration_mode']) {
      return CALIBRATION_HOTSPOTS;
    }
    if (s?.roomName === 'Medieval Chamber' || s?.flags?.['medieval_mode']) {
      return MEDIEVAL_HOTSPOTS;
    }
    return BRIDGE_HOTSPOTS;
  });

  constructor() {
    // Start Animation Loop (RAF)
    this.animate();
  }

  animate() {
    this.tickCount++;
    this.updateCharacterPositions();
    this.cdr.markForCheck();
    this.animationLoop = requestAnimationFrame(() => this.animate());
  }

  ngOnDestroy() {
    if (this.animationLoop) cancelAnimationFrame(this.animationLoop);
  }

  onInteract(poi: PointOfInterest) {
    this.interact.emit(poi);
  }

  onSceneClick(event: MouseEvent) {
    if (this.state()?.dialogueOptions?.length) return;
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;
    const isCalibration = this.state()?.flags?.['calibration_mode'];
    const isMedieval = this.state()?.flags?.['medieval_mode'];

    if (isCalibration) {
      if (!isPointInCalibrationWalkableArea(x, y)) return;
    } else if (isMedieval) {
      if (!isPointInMedievalWalkableArea(x, y)) return;
    } else {
      if (!isPointInWalkableArea(x, y)) return;
    }

    const hotspots = isCalibration ? CALIBRATION_HOTSPOTS : (isMedieval ? MEDIEVAL_HOTSPOTS : BRIDGE_HOTSPOTS);
    const isObstacle = hotspots.some(h =>
      h.isObstacle && (
        x >= h.bounds.x && x <= h.bounds.x + h.bounds.width &&
        y >= h.bounds.y && y <= h.bounds.y + h.bounds.height
      )
    );
    if (isObstacle) return;

    const player = this.state()?.characters.find(c => c.isPlayer);
    if (player) {
      player.targetPosition = { x, y };
    }
  }

  updateCharacterPositions() {
    const characters = this.state()?.characters;
    if (!characters) return;

    characters.forEach(char => {
      if (char.walkDistance === undefined) char.walkDistance = 0;
      if (char.targetPosition) {
        const dx = char.targetPosition.x - (char.position?.x || 50);
        const dy = char.targetPosition.y - (char.position?.y || 50);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.3) {
          if (char.position) {
            char.position.x = char.targetPosition.x;
            char.position.y = char.targetPosition.y;
            char.targetPosition = undefined;
            char.isMoving = false;
            char.walkDistance = 0;
          }
        } else {
          const isLeo = (char.name || '').toLowerCase() === 'leo' || (char.id || '').toLowerCase() === 'leo';

          const speed = isLeo ? 0.08 : 0.22;
          const moveDist = Math.min(dist, speed);
          const ratio = moveDist / dist;
          let moveX = dx * ratio;
          let moveY = dy * ratio;

          if (!char.position) char.position = { x: 50, y: 50 };
          char.position.x += moveX;
          char.position.y += moveY;
          char.isMoving = true;

          const visualDist = Math.sqrt(moveX * moveX + (moveY * 1.6) * (moveY * 1.6));
          char.walkDistance += visualDist;

          if (Math.abs(dy) > Math.abs(dx) * 0.8) {
            if (dy > 0) char.facing = 'down'; else char.facing = 'up';
            char.direction = dx > 0 ? 'right' : 'left';
          } else {
            if (dx > 0) { char.facing = 'right'; char.direction = 'right'; }
            else { char.facing = 'left'; char.direction = 'left'; }
          }
        }
      } else {
        char.isMoving = false;
      }
    });

    if (this.tickCount % 4 === 0) {
      this.animFrame.update(f => f + 1);
    }
  }

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

  getCharacterContainerStyle(char: GameCharacter): { [key: string]: any } {
    const isLeo = (char.name || '').toLowerCase() === 'leo' || (char.id === 'leo');

    let baseWidthPerc = 8.5;
    let aspectRatio = 1.0;

    if (isLeo) {
      baseWidthPerc = 14.5; // Dimensione bilanciata
      aspectRatio = 1.0;
    } else {
      baseWidthPerc = 8.0;
      aspectRatio = 2.0;
    }

    const y = char.position?.y || 50;
    const progress = Math.max(0, Math.min(1, (y - 40) / 60));
    const depthScale = 0.9 + (progress * 0.35);

    const finalWidth = baseWidthPerc * (char.scale || 1) * depthScale;
    const finalHeight = finalWidth * aspectRatio * 1.7778;

    return {
      'width': finalWidth + '%',
      'height': finalHeight + '%',
      'transform': 'translate(-50%, -100%)',
      'z-index': '20'
    };
  }

  getFlipTransform(char: GameCharacter): string {
    return char.direction === 'left' ? 'scaleX(-1)' : 'none';
  }

  onInteractCharacter(char: GameCharacter) {
    if (char.isPlayer) return;
    const poi: PointOfInterest = { id: char.id, name: char.name, description: char.name, type: 'character', status: 'unlocked' };
    this.interact.emit(poi);
  }

  isSpriteSheet(char: GameCharacter): boolean {
    const name = (char.name || '').toLowerCase();
    const id = (char.id || '').toLowerCase();
    return name === 'elias' || id === 'elias' || name === 'lisa' || id === 'lisa' || name === 'leo' || id === 'leo';
  }

  getSpriteSheet(char: GameCharacter): string {
    const name = (char.name || '').toLowerCase();
    const id = (char.id || '').toLowerCase();
    if (name === 'lisa' || id === 'lisa') return '/lisa.png';
    if (name === 'sarah' || id === 'sarah') return '/sarah-sheet.png';
    if (name === 'leo' || id === 'leo') return '/walkok.png';
    return '/medico2.png';
  }

  getSpriteStyle(char: GameCharacter): { [klass: string]: any } {
    if (!this.isSpriteSheet(char)) return {};

    const name = (char.name || '').toLowerCase();
    const isLisa = name === 'lisa' || char.id === 'lisa';
    const isLeo = name === 'leo' || char.id === 'leo';

    // Animation Configs
    const config = {
      baseWidth: 100, // Larghezza riferimento per scala (%)
      frameSize: 128,
      rowHeight: 256,
      framesPerRow: 8,
      sheetWidth: 1024,
      verticalOffset: 20
    };

    if (isLeo) {
      config.frameSize = 1024 / 7;
      config.rowHeight = config.frameSize;
      config.framesPerRow = 7;
      config.sheetWidth = 1024;
      config.verticalOffset = 0;
    }

    const spriteAspect = config.rowHeight / config.frameSize;

    let row = 0;
    let col = 0;
    let transformMultiplier = 'none';

    if (char.isMoving) {
      // Stride leggermente accelerato (da 0.25 a 0.22)
      const stride = isLeo ? 0.22 : 2.2;

      const walkDist = char.walkDistance || 0;

      if (isLeo) {
        // SBLOCCO TUTTI I FRAME (7x7 = 49 frame)
        // Il primo ciclo parte da 0, i successivi ripartono dalla seconda riga (frame 7)
        const strideVal = Math.floor(walkDist / stride);
        const loopStartFrame = 7; // Seconda riga
        const totalFramesInSheet = 49;
        const loopFramesCount = totalFramesInSheet - loopStartFrame; // 42

        let currentFrameIndex;
        if (strideVal < totalFramesInSheet) {
          currentFrameIndex = strideVal;
        } else {
          currentFrameIndex = loopStartFrame + ((strideVal - totalFramesInSheet) % loopFramesCount);
        }

        row = Math.floor(currentFrameIndex / 7);
        col = currentFrameIndex % 7;

        // Reset offset e flip basato sulla direzione di movimento
        config.verticalOffset = 0;
        if (char.direction === 'right') transformMultiplier = 'scaleX(-1)';

      } else {
        // LOGICA STANDARD (Elias/Lisa)
        col = Math.floor(walkDist / stride) % config.framesPerRow;

        if (isLisa) {
          row = 0;
          config.verticalOffset = 20;
          if (char.direction === 'left') transformMultiplier = 'scaleX(-1)';
        } else {
          // Elias & Sarah Logic (4-Row Sheets)
          config.verticalOffset = 20;
          switch (char.facing) {
            case 'right': row = 0; break;
            case 'left': row = 0; transformMultiplier = 'scaleX(-1)'; break;
            case 'down': row = 1; break;
            case 'up': row = 2; config.verticalOffset = 90; break;
            default: row = 1;
          }
        }
      }
    } else {
      if (isLisa) {
        const globalFrame = this.animFrame();
        col = Math.floor(globalFrame / 4) % 8;
        config.verticalOffset = 90;
      } else if (isLeo) {
        // Leo Idle: Primo frame assoluto per test (Row 0, Col 0)
        row = 0;
        col = 0;
        // Mantiene l'orientamento anche da fermo
        if (char.direction === 'right') transformMultiplier = 'scaleX(-1)';
      } else {
        row = 3;
        config.verticalOffset = 90;
        const globalFrame = this.animFrame();
        const cycleLength = 300;
        const animLength = 8;
        const cyclePos = globalFrame % cycleLength;
        col = cyclePos < animLength ? cyclePos : 0;
      }
    }

    const totalRows = isLeo ? 7 : 4;

    return {
      'width': '100%',
      'height': '100%',
      'background-image': `url("${this.getSpriteSheet(char)}")`,
      'background-size': `${config.framesPerRow * 100}% auto`,
      'background-position': `${(col / (config.framesPerRow - 1)) * 100}% ${(row / (totalRows - 1)) * 100}%`,
      'background-repeat': 'no-repeat',
      'transform': transformMultiplier !== 'none' ? transformMultiplier : 'none',
      'transform-origin': 'bottom center',
      'image-rendering': 'pixelated'
    };
  }

  getCharacterSprite(characterName: string): string | null {
    const sprites: { [key: string]: string } = { 'Kael': '/character-kael.png', 'Mina': '/character-mina.png' };
    return sprites[characterName] || null;
  }

  onDialogue(option: DialogueOption) {
    this.dialogueChoice.emit(option);
  }
}
