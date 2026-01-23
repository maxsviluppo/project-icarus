import { Component, input, output, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotspotArea, getVisibleHotspots } from '../scenes/bridge-hotspots';

/**
 * HOTSPOT OVERLAY COMPONENT
 * Renderizza le zone cliccabili sopra l'immagine della scena
 * Gestisce il cursore e il tooltip (fumetto) che segue il mouse
 */
@Component({
  selector: 'app-hotspot-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="absolute inset-0 w-full h-full" (mousemove)="onMouseMove($event)">
      
      <!-- DEBUG LAYER: Invisibile ma cattura i movimenti -->
      <div class="absolute inset-0 pointer-events-auto z-0"></div>

      @for (hotspot of visibleHotspots(); track hotspot.id) {
        <div
          class="absolute group cursor-pointer pointer-events-auto z-10"
          [style.left.%]="hotspot.bounds.x"
          [style.top.%]="hotspot.bounds.y"
          [style.width.%]="hotspot.bounds.width"
          [style.height.%]="hotspot.bounds.height"
          (click)="onHotspotClick(hotspot)"
          (mouseenter)="onHotspotEnter(hotspot)"
          (mouseleave)="onHotspotLeave()"
        >
          <!-- Optional Image Overlay (e.g. Chair) -->
          @if (hotspot.image) {
            <!-- Image scaled up relative to the hotspot area as requested -->
            <img [src]="hotspot.image" [alt]="hotspot.name" 
                 class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[240%] min-h-[240%] object-contain pointer-events-none drop-shadow-md z-20">
            <!-- DEBUG BORDER FOR IMAGE HOTSPOTS -->
            <!-- DEBUG BORDER REMOVED -->
            <!-- <div class="absolute inset-0 border-2 border-red-500/50 pointer-events-none"></div> -->
          }

          <!-- Area Cliccabile (Invisibile per richiesta utente, visibile solo in debug) -->
          <div 
            class="w-full h-full transition-all duration-200"
            [class.bg-cyan-500/30]="debugMode()"
            [class.border-2]="debugMode()"
            [class.border-cyan-400]="debugMode()"
          >
          </div>

          <!-- Indicatore visivo rimosso su richiesta utente -->
          @if (false) {
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div class="w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
              <div class="absolute inset-0 w-3 h-3 bg-cyan-400 rounded-full"></div>
            </div>
          }
        </div>
      }

      <!-- Floating Tooltip (Fumetto che segue il mouse) -->
      @if (hoveredHotspot()) {
        <div 
          class="fixed pointer-events-none z-50 transition-opacity duration-150"
          [style.left.px]="cursorPos().x + 20"
          [style.top.px]="cursorPos().y + 20"
          style="transform: translate(0, 0);" 
        >
          <div class="bg-black/80 text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/50 whitespace-nowrap text-sm font-mono shadow-[0_0_15px_rgba(34,211,238,0.3)] backdrop-blur-md">
            <div class="flex items-center gap-2">
              <span class="text-[10px] opacity-70 uppercase tracking-wider">
                @switch (hoveredHotspot()?.type) {
                  @case ('exit') { [EXIT] }
                  @case ('pickup') { [GET] }
                  @case ('character') { [TALK] }
                  @default { [USE] }
                }
              </span>
              <span class="font-bold text-white tracking-wide">{{ hoveredHotspot()?.name }}</span>
            </div>
            <!-- Debug Info in tooltip -->
             <div class="text-[10px] text-yellow-500 mt-1 border-t border-gray-700 pt-1">
               ID: {{ hoveredHotspot()?.id }} | Bounds: {{ hoveredHotspot()?.bounds?.x }}%, {{ hoveredHotspot()?.bounds?.y }}%
             </div>
          </div>
        </div>
      }

      <!-- DEBUG COORDINATES (Always visible temporarily as requested) -->
      <div 
        class="fixed pointer-events-none z-[100] text-xs font-mono font-bold text-yellow-400 bg-black/80 px-2 py-1 rounded border border-yellow-500/50 shadow-lg"
        [style.left.px]="cursorPos().x + 20"
        [style.top.px]="cursorPos().y - 30"
      >
        X: {{ debugCoords().x | number:'1.1-1' }}%
        Y: {{ debugCoords().y | number:'1.1-1' }}%
      </div>
    </div>
  `,
  styles: []
})
export class HotspotOverlayComponent {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;

  // Input: flags del gioco per determinare quali hotspots mostrare
  gameFlags = input<Record<string, boolean>>({});

  // Input: modalità debug per visualizzare tutte le aree
  debugMode = input<boolean>(false);

  // Input: hotspots personalizzati (opzionale, altrimenti usa quelli della scena)
  customHotspots = input<HotspotArea[] | null>(null);

  // Output: emette l'hotspot cliccato
  hotspotClicked = output<HotspotArea>();

  // State per tooltip dinamico
  hoveredHotspot = signal<HotspotArea | null>(null);
  cursorPos = signal<{ x: number, y: number }>({ x: 0, y: 0 });

  // DEBUG: Coordinate mouse in percentuale
  debugCoords = signal<{ x: number, y: number }>({ x: 0, y: 0 });

  // Computed: hotspots visibili in base ai flags
  visibleHotspots = computed(() => {
    const custom = this.customHotspots();
    if (custom) {
      return custom.filter(h => {
        if (!h.visibleWhen) return true;
        return h.visibleWhen(this.gameFlags());
      });
    }
    return getVisibleHotspots(this.gameFlags());
  });

  onHotspotClick(hotspot: HotspotArea) {
    this.hotspotClicked.emit(hotspot);
  }

  onHotspotEnter(hotspot: HotspotArea) {
    this.hoveredHotspot.set(hotspot);
  }

  onHotspotLeave() {
    this.hoveredHotspot.set(null);
  }

  onMouseMove(event: MouseEvent) {
    this.cursorPos.set({ x: event.clientX, y: event.clientY });

    // Calcola coordinate relative al contenitore #container
    if (this.containerRef?.nativeElement) {
      const rect = this.containerRef.nativeElement.getBoundingClientRect();
      const xPct = ((event.clientX - rect.left) / rect.width) * 100;
      const yPct = ((event.clientY - rect.top) / rect.height) * 100;

      this.debugCoords.set({
        x: Math.max(0, Math.min(100, xPct)),
        y: Math.max(0, Math.min(100, yPct))
      });
    }
  }

  /**
   * Determina se mostrare l'indicatore pulsante per un hotspot
   * (es. per oggetti raccoglibili o azioni critiche)
   */
  shouldShowIndicator(hotspot: HotspotArea): boolean {
    // Mostra indicatore per oggetti raccoglibili o hotspots con status "broken"
    return hotspot.type === 'pickup' || hotspot.status === 'broken';
  }
}
