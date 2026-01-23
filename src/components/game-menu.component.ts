import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Menu Toggle Button (Floating) -->
    <div class="menu-trigger" (click)="toggleMenu()">
      <div class="trigger-icon" [class.open]="isOpen()">
        <img src="/terminal.png" alt="Terminal Menu" class="menu-icon-img">
      </div>
    </div>

    <!-- Backdrop Overlay -->
    @if (isOpen()) {
      <div class="menu-backdrop" (click)="toggleMenu()"></div>
    }

    <!-- Collapsible Menu Panel -->
    <div class="menu-panel" [class.open]="isOpen()">
      <div class="menu-header">
        <div class="header-line"></div>
        <h2>VESPER MAIN CONTROL</h2>
        <div class="header-line"></div>
      </div>

      <div class="menu-content">
        <!-- Top Section: Data Management -->
        <div class="menu-section">
          <h3 class="section-title">Data Storage</h3>
          <div class="action-grid">
            <button class="menu-button save" (click)="onSave()">
              <div class="btn-icon">
                <img src="/save.png" alt="Save">
              </div>
              <span>SAVE STATE</span>
            </button>

            <button class="menu-button load" (click)="onLoad()">
              <div class="btn-icon">
                <img src="/load.png" alt="Load" style="transform: rotate(180deg)">
              </div>
              <span>LOAD STATE</span>
            </button>
          </div>
        </div>

        <!-- Middle Section: System -->
        <div class="menu-section">
          <h3 class="section-title">System</h3>
          <button class="menu-button exit" (click)="onExit()">
            <div class="btn-icon">
              <span class="exit-glyph">⏻</span>
            </div>
            <span>TERMINATE SESSION</span>
          </button>
        </div>

        <!-- Utility Section for future puzzles/tools -->
        <div class="menu-section utility">
          <h3 class="section-title">Future Modules</h3>
          <div class="vague-display">
            <div class="scan-line"></div>
            <p>ENIGMA MODULE: OFFLINE</p>
            <p>DCRYPT.SYS: STANDBY</p>
          </div>
        </div>
      </div>

      <div class="menu-footer">
        <p>BUILD V.0.4.2 // ICARUS PROTOCOL</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Toggle Button */
    .menu-trigger {
      position: fixed;
      top: 12px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: transparent; /* Rimosso sfondo */
      border: none;            /* Rimosso bordo */
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1000;
      pointer-events: auto;
    }

    .trigger-icon {
      width: 45px;
      height: 45px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .menu-icon-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.5));
      opacity: 0.7;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Effetto Illuminazione quando aperto */
    .trigger-icon.open .menu-icon-img {
      opacity: 1;
      filter: drop-shadow(0 0 15px rgba(34, 211, 238, 1)) 
              drop-shadow(0 0 30px rgba(34, 211, 238, 0.6));
      transform: scale(1.1);
    }

    .menu-trigger:hover .menu-icon-img {
      opacity: 1;
      filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.8));
    }

    /* Backdrop */
    .menu-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 900;
      animation: fadeIn 0.3s ease-out;
    }

    /* Menu Panel */
    .menu-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
      border-left: 1px solid rgba(34, 211, 238, 0.2);
      z-index: 950;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
    }

    .menu-panel.open {
      transform: translateX(0);
    }

    .menu-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .menu-header h2 {
      color: #22d3ee;
      font-size: 14px;
      letter-spacing: 4px;
      margin: 10px 0;
      font-weight: 800;
    }

    .header-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent);
    }

    .menu-section {
      margin-bottom: 30px;
    }

    .section-title {
      color: rgba(255, 255, 255, 0.4);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 5px;
    }

    .action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .menu-button {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 15px;
      color: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      transition: all 0.2s ease;
    }

    .menu-button:hover {
      background: rgba(34, 211, 238, 0.1);
      border-color: #22d3ee;
      transform: translateY(-2px);
    }

    .menu-button span {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon img {
      width: 24px;
      height: 24px;
      object-contain: contain;
      filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.5));
    }

    .exit {
      width: 100%;
      flex-direction: row;
      justify-content: center;
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .exit:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
      color: white;
    }

    .exit-glyph {
      font-size: 20px;
    }

    .vague-display {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      padding: 15px;
      position: relative;
      overflow: hidden;
      font-size: 10px;
      font-family: monospace;
      color: #4ade80;
      line-height: 2;
    }

    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: rgba(74, 222, 128, 0.2);
      animation: scan 3s linear infinite;
    }

    .menu-footer {
      margin-top: auto;
      text-align: center;
      opacity: 0.3;
      font-size: 9px;
      letter-spacing: 1px;
    }

    @keyframes scan {
      0% { top: 0; }
      100% { top: 100%; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class GameMenuComponent {
  isOpen = signal(false);

  save = output<void>();
  load = output<void>();
  exit = output<void>();

  toggleMenu() {
    this.isOpen.update(v => !v);
  }

  onSave() {
    this.save.emit();
    this.toggleMenu();
  }

  onLoad() {
    this.load.emit();
    this.toggleMenu();
  }

  onExit() {
    this.exit.emit();
    this.toggleMenu();
  }
}
