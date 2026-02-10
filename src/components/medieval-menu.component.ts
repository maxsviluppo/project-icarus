import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-medieval-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Medieval Trigger Button -->
    <div class="menu-trigger" (click)="toggleMenu()">
      <div class="trigger-icon" [class.open]="isOpen()">
        <span class="manuscript-glyph">📜</span>
      </div>
    </div>

    <!-- Backdrop -->
    @if (isOpen()) {
      <div class="menu-backdrop" (click)="toggleMenu()"></div>
    }

    <!-- Parchment Menu Panel -->
    <div class="menu-panel" [class.open]="isOpen()">
      <div class="parchment-top"></div>
      
      <div class="menu-header">
        <h2 class="serif-title">ANTICO CODICE</h2>
        <div class="ornament">❧ ════════ ❧</div>
      </div>

      <div class="menu-content overflow-y-auto">
        <!-- Environments Section -->
        <div class="menu-section">
          <h3 class="section-title">Portale Dimensionale</h3>
          <div class="grid grid-cols-1 gap-2">
            <button class="medieval-button" (click)="onChangeEnvironment('space')">
              <span class="icon">🌌</span>
              <span>RITORNO ALLE STELLE</span>
            </button>
            <button class="medieval-button active" (click)="onChangeEnvironment('medieval')">
              <span class="icon">🏰</span>
              <span>DIMORA ANTICA</span>
            </button>
          </div>
        </div>

        <!-- Pilots Section -->
        <div class="menu-section">
          <h3 class="section-title">Figurazione dello Spirito</h3>
          <button class="medieval-button-full mb-3" (click)="onToggleCharacters()">
            <span class="icon">👁️</span>
            <span>VELO DELLA PRESENZA</span>
          </button>
          
          <div class="pilot-grid">
            <button class="pilot-btn" (click)="onChangeCharacter('elias')">
              <div class="avatar"><img src="/character-elias.png"></div>
              <span>ELIAS</span>
            </button>
            <button class="pilot-btn" (click)="onChangeCharacter('lisa')">
              <div class="avatar"><img src="/lisa.png"></div>
              <span>LISA</span>
            </button>
            <button class="pilot-btn" (click)="onChangeCharacter('sarah')">
              <div class="avatar"><img src="/character-sarah.png"></div>
              <span>SARAH</span>
            </button>
            <button class="pilot-btn" (click)="onChangeCharacter('leo')">
              <div class="avatar"><img src="/walkok.png"></div>
              <span>LEO</span>
            </button>
            <button class="pilot-btn ghost" (click)="onChangeCharacter('none')">
              <div class="avatar">Ø</div>
              <span>GHOST</span>
            </button>
          </div>
        </div>

        <!-- Data Section -->
        <div class="menu-section">
          <h3 class="section-title">Memoria del Cammino</h3>
          <div class="grid grid-cols-2 gap-3">
            <button class="medieval-button center" (click)="onSave()">
              <span>SIGILLA</span>
            </button>
            <button class="medieval-button center" (click)="onLoad()">
              <span>RICHIAMA</span>
            </button>
          </div>
        </div>

        <div class="menu-section">
           <button class="medieval-button-full exit" (click)="onExit()">
            <span>ABBANDONA IL MONDO</span>
          </button>
        </div>
      </div>

      <div class="parchment-bottom"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .menu-trigger {
      position: fixed;
      top: 15px;
      right: 25px;
      z-index: 1000;
      cursor: pointer;
    }

    .manuscript-glyph {
      font-size: 35px;
      filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
      transition: all 0.3s ease;
    }

    .trigger-icon.open .manuscript-glyph {
      transform: rotate(-15deg) scale(1.1);
      filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8));
    }

    .menu-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(45, 26, 12, 0.7);
      backdrop-filter: blur(2px);
      z-index: 900;
    }

    .menu-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background: #f4e4bc; /* Parchment color */
      color: #4a2c1d;
      z-index: 950;
      padding: 60px 25px;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
      box-shadow: -15px 0 50px rgba(0,0,0,0.6);
      font-family: 'Georgia', serif;
      border-left: 8px solid #8b4513;
    }

    .menu-panel.open { transform: translateX(0); }

    .serif-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-bottom: 5px;
      text-align: center;
    }

    .ornament {
      text-align: center;
      margin-bottom: 30px;
      opacity: 0.6;
    }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1px solid rgba(74, 44, 29, 0.2);
      margin-bottom: 15px;
      padding-bottom: 5px;
      font-weight: bold;
    }

    .menu-section { margin-bottom: 35px; }

    .medieval-button {
      background: rgba(139, 69, 19, 0.05);
      border: 1px solid #8b4513;
      padding: 10px;
      font-size: 10px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s;
    }

    .medieval-button:hover {
      background: #8b4513;
      color: #f4e4bc;
    }

    .medieval-button.active {
      background: #4a2c1d;
      color: #f4e4bc;
    }

    .medieval-button-full {
      width: 100%;
      background: rgba(139, 69, 19, 0.1);
      border: 1px solid #8b4513;
      padding: 12px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .medieval-button-full:hover {
      background: #8b4513;
      color: #f4e4bc;
    }

    .exit {
      border-color: #7f1d1d;
      color: #7f1d1d;
    }

    .exit:hover {
      background: #7f1d1d;
      color: white;
    }

    .pilot-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .pilot-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 5px;
    }

    .avatar {
      width: 45px;
      height: 45px;
      border: 2px solid #8b4513;
      border-radius: 50%;
      overflow: hidden;
      background: #e3cfa0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pilot-btn span {
      font-size: 9px;
      font-weight: bold;
      opacity: 0.8;
    }

    .pilot-btn:hover .avatar {
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba(139, 69, 19, 0.3);
    }
  `]
})
export class MedievalMenuComponent {
  isOpen = signal(false);

  save = output<void>();
  load = output<void>();
  exit = output<void>();
  changeCharacter = output<string>();
  changeEnvironment = output<string>();
  toggleCharacters = output<void>();

  toggleMenu() {
    this.isOpen.update(v => !v);
  }

  onChangeEnvironment(envId: string) {
    this.changeEnvironment.emit(envId);
    this.toggleMenu();
  }

  onChangeCharacter(charId: string) {
    this.changeCharacter.emit(charId);
    this.toggleMenu();
  }

  onToggleCharacters() {
    this.toggleCharacters.emit();
  }

  onSave() { this.save.emit(); this.toggleMenu(); }
  onLoad() { this.load.emit(); this.toggleMenu(); }
  onExit() { this.exit.emit(); this.toggleMenu(); }
}
