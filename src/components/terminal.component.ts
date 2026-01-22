import { Component, Input, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogEntry } from '../types';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-slate-900 border-t-2 border-slate-700 shadow-inner font-mono text-sm sm:text-base">
      <div class="bg-slate-800 text-slate-300 px-3 py-1 text-xs uppercase tracking-widest border-b border-slate-700 flex justify-between items-center">
        <span>Comm Log // SSI_Vesper_Link</span>
        <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
      
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        @for (entry of logs(); track $index) {
          <div [class]="getEntryClass(entry.type)">
            <span class="opacity-50 mr-2 text-xs">[{{ getTime($index) }}]</span>
            <span class="whitespace-pre-wrap">{{ entry.text }}</span>
          </div>
        }
        <div class="h-4"></div>
      </div>
    </div>
  `
})
export class TerminalComponent implements AfterViewChecked {
  logs = input.required<LogEntry[]>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getEntryClass(type: string): string {
    switch (type) {
      case 'narrative': return 'text-amber-100 leading-relaxed';
      case 'action': return 'text-cyan-400 font-bold';
      case 'system': return 'text-slate-500 italic';
      case 'error': return 'text-red-500';
      default: return 'text-gray-300';
    }
  }

  getTime(index: number): string {
    // Fake timestamp relative to start
    const base = 2145;
    return `${base + Math.floor(index / 10)}:${10 + (index % 60)}`;
  }
}
