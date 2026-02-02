import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-inventory-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inventory-overlay" *ngIf="isOpen" (click)="close()">
      <div class="inventory-panel" (click)="$event.stopPropagation()">
        <!-- Header con titolo -->
        <div class="inventory-header">
          <h2>INVENTORY</h2>
          <button class="close-button" (click)="close()">✕</button>
        </div>

        <!-- Sfondo zaino aperto -->
        <div class="inventory-background">
          <img src="/borsa.png" alt="Inventory" class="backpack-image">
        </div>

        <!-- Griglia oggetti (4x2 = 8 slot) -->
        <div class="inventory-grid">
          <div
            *ngFor="let slot of slots; let i = index"
            class="inventory-slot"
            [class.filled]="slot !== null"
            [class.empty]="slot === null"
            (click)="selectItem(slot)"
            [title]="slot?.name || 'Slot vuoto'"
          >
            <img
              *ngIf="slot"
              [src]="slot.icon"
              [alt]="slot.name"
              class="item-icon"
            >
            <div *ngIf="!slot" class="empty-slot-indicator"></div>
          </div>
        </div>

        <!-- Descrizione oggetto selezionato -->
        <div class="item-description" *ngIf="selectedItem">
          <h3>{{ selectedItem.name }}</h3>
          <p>{{ selectedItem.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .inventory-panel {
      position: relative;
      width: 600px;
      max-width: 90vw;
      background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(10, 10, 30, 0.98));
      border: 3px solid #ffb000;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 176, 0, 0.3);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .inventory-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ffb000;
    }

    .inventory-header h2 {
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: bold;
      color: #ffb000;
      margin: 0;
      letter-spacing: 3px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    }

    .close-button {
      background: rgba(255, 0, 0, 0.2);
      border: 2px solid #ff4444;
      color: #ff4444;
      font-size: 24px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .close-button:hover {
      background: rgba(255, 0, 0, 0.4);
      transform: scale(1.1);
    }

    .inventory-background {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.15;
      pointer-events: none;
      z-index: 0;
    }

    .backpack-image {
      width: 400px;
      height: 400px;
      image-rendering: pixelated;
      filter: blur(1px);
    }

    .inventory-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 20px 0;
    }

    .inventory-slot {
      aspect-ratio: 1;
      background: rgba(40, 40, 60, 0.6);
      border: 2px solid #555;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .inventory-slot:hover {
      background: rgba(60, 60, 80, 0.8);
      border-color: #ffb000;
      transform: scale(1.05);
    }

    .inventory-slot.filled {
      background: rgba(60, 80, 60, 0.6);
      border-color: #00ff00;
    }

    .inventory-slot.filled:hover {
      box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
    }

    .item-icon {
      width: 80%;
      height: 80%;
      object-fit: contain;
      image-rendering: pixelated;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    .empty-slot-indicator {
      width: 20px;
      height: 20px;
      border: 2px dashed #666;
      border-radius: 50%;
      opacity: 0.3;
    }

    .item-description {
      position: relative;
      z-index: 1;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #ffb000;
      border-radius: 8px;
      padding: 15px;
      margin-top: 15px;
    }

    .item-description h3 {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      color: #ffb000;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .item-description p {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #ccc;
      margin: 0;
      line-height: 1.5;
    }
  `]
})
export class InventoryPanelComponent {
  @Input() isOpen = false;
  @Input() items: InventoryItem[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() itemSelected = new EventEmitter<InventoryItem>();

  selectedItem: InventoryItem | null = null;

  // Griglia 4x2 = 8 slot
  get slots(): (InventoryItem | null)[] {
    const slots: (InventoryItem | null)[] = new Array(8).fill(null);
    this.items.forEach((item, index) => {
      if (index < 8) {
        slots[index] = item;
      }
    });
    return slots;
  }

  close(): void {
    this.closed.emit();
  }

  selectItem(item: InventoryItem | null): void {
    if (item) {
      this.selectedItem = item;
      this.itemSelected.emit(item);
    }
  }
}
