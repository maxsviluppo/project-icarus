import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionType } from './action-bar.component';

interface ActionIcon {
  type: ActionType;
  label: string;
  iconPath: string;
}

@Component({
  selector: 'app-medieval-action-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="medieval-bar-container">
      <!-- Shield Trigger (Bottom Right) -->
      <button class="shield-trigger" (click)="toggleBar()" [class.open]="isOpen()">
        <img src="/scudomenu.png" alt="Actions Shield" class="shield-img">
      </button>

      <!-- Horizontal Action Menu (Sliding to Left) -->
      <div class="action-menu" [class.open]="isOpen()">
        <div class="action-inner">
          @for (action of actions; track action.type) {
            <button
              class="medieval-action-btn"
              (click)="selectAction(action.type)"
              [title]="action.label"
            >
              <img [src]="action.iconPath" [alt]="action.label" class="action-icon">
            </button>
          }
        </div>
      </div>
    </div>

    <!-- Separated Inventory Bag (Bottom Left) -->
    <button class="inventory-bag-btn" (click)="toggleInventory()" [class.open]="isInventoryOpen()">
      <img src="/borsa.png" alt="Inventory" class="bag-img">
    </button>

    <!-- Inventory Drawer (Sliding from Left to Right) -->
    <div class="inventory-drawer" [class.open]="isInventoryOpen()">
      <div class="drawer-inner">
        @if (items.length === 0) {
          <span class="empty-msg">Vuoto</span>
        } @else {
          @for (item of items; track item) {
             <div class="inventory-item" [title]="item">
               <div class="item-icon-placeholder">📦</div> <!-- Placeholder, idealmente icone specifiche -->
               <span class="item-name">{{ item }}</span>
             </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .inventory-drawer {
      position: fixed;
      bottom: 25px;
      left: 20px;
      z-index: 190;
      pointer-events: none;
      opacity: 0;
      transform: translateX(-30px) scale(0.9);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
    }

    .inventory-drawer.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(70px) scale(1); /* Sposta a destra della borsa */
    }

    .drawer-inner {
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 40px;
      padding: 10px 25px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      min-width: 120px;
      min-height: 60px;
    }

    .inventory-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: #fbbf24;
      font-size: 10px;
      font-weight: bold;
      transition: transform 0.2s;
    }

    .inventory-item:hover {
      transform: scale(1.1);
      color: white;
    }

    .item-icon-placeholder {
      font-size: 20px;
    }

    .empty-msg {
      color: rgba(255,255,255,0.4);
      font-style: italic;
      font-size: 12px;
    }

    .medieval-bar-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 15px;
      pointer-events: auto;
    }

    .shield-trigger {
      width: 80px;
      height: 80px;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 210;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
      order: 2; /* Keep shield on the right */
    }

    .shield-trigger:hover {
      transform: scale(1.1) rotate(5deg);
    }

    .shield-trigger.open {
      transform: scale(0.9) rotate(-10deg);
      filter: sepia(0.3) drop-shadow(0 0 15px rgba(251, 191, 36, 0.5));
    }

    .shield-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .action-menu {
      opacity: 0;
      pointer-events: none;
      transform: translateX(30px) scale(0.9);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      order: 1; /* Place menu to the left of the shield */
    }

    .action-menu.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(0) scale(1);
    }

    .action-inner {
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 40px;
      padding: 8px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .medieval-action-btn {
      background: transparent;
      border: none;
      padding: 5px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .medieval-action-btn:hover {
      transform: translateY(-5px) scale(1.2);
      filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
    }

    .action-icon {
      width: 32px;
      height: 32px;
      object-fit: contain;
      image-rendering: pixelated;
    }

    /* Mobile adjustments */
    @media (max-width: 600px) {
      .medieval-bar-container { bottom: 15px; right: 15px; gap: 10px; }
      .shield-trigger { width: 70px; height: 70px; }
      .action-inner { padding: 6px 15px; gap: 15px; }
      .action-icon { width: 32px; height: 32px; }
      .inventory-bag-btn { bottom: 15px; left: 15px; width: 70px; height: 70px; }
    }

    .inventory-bag-btn {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 200;
      width: 80px;
      height: 80px;
      background: transparent;
      border: none;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
    }

    .inventory-bag-btn:hover {
      transform: scale(1.1) rotate(5deg);
      filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
    }

    .inventory-bag-btn.open {
       transform: scale(0.9) rotate(-5deg);
       filter: sepia(0.3) drop-shadow(0 0 15px rgba(251, 191, 36, 0.5));
    }

    .bag-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `]
})
export class MedievalActionBarComponent {
  @Input() items: string[] = [];
  @Output() actionSelected = new EventEmitter<ActionType>();
  @Output() inventoryToggled = new EventEmitter<void>();

  isOpen = signal(false);
  isInventoryOpen = signal(false);

  actions: ActionIcon[] = [
    { type: ActionType.EXAMINE, label: 'Esamina', iconPath: '/esamina.png' },
    { type: ActionType.TAKE, label: 'Prendi', iconPath: '/prendi.png' },
    { type: ActionType.USE, label: 'Usa', iconPath: '/usa.png' }
  ];

  toggleBar() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) this.isInventoryOpen.set(false);
  }

  toggleInventory() {
    this.isInventoryOpen.update(v => !v);
    if (this.isInventoryOpen()) this.isOpen.set(false);
  }

  selectAction(type: ActionType) {
    if (type === ActionType.INVENTORY) {
      this.inventoryToggled.emit();
    } else {
      this.actionSelected.emit(type);
    }
    this.isOpen.set(false);
  }
}
