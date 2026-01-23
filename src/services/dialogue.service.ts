import { Injectable, ComponentRef, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { DialogueBubbleComponent, DialogueConfig } from '../components/dialogue-bubble.component';

@Injectable({
    providedIn: 'root'
})
export class DialogueService {
    private activeDialogues: ComponentRef<DialogueBubbleComponent>[] = [];

    constructor(
        private appRef: ApplicationRef,
        private injector: EnvironmentInjector
    ) { }

    /**
     * Mostra un dialogo sopra la testa del personaggio
     */
    showDialogue(config: DialogueConfig): void {
        // Rimuovi eventuali dialoghi precedenti dello stesso personaggio
        this.dismissDialogue(config.characterId);

        // Crea il componente dinamicamente
        const componentRef = createComponent(DialogueBubbleComponent, {
            environmentInjector: this.injector
        });

        // Imposta la configurazione
        componentRef.instance.config = config;

        // Aggiungi alla view
        this.appRef.attachView(componentRef.hostView);
        const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
        document.body.appendChild(domElem);

        // Salva il riferimento
        this.activeDialogues.push(componentRef);

        // Auto-rimozione dopo la durata
        const duration = config.duration || 3000;
        setTimeout(() => {
            this.removeDialogue(componentRef);
        }, duration + 500); // +500ms per l'animazione di fade-out
    }

    /**
     * Rimuove un dialogo specifico di un personaggio
     */
    dismissDialogue(characterId: string): void {
        const dialogue = this.activeDialogues.find(
            d => d.instance.config.characterId === characterId
        );

        if (dialogue) {
            this.removeDialogue(dialogue);
        }
    }

    /**
     * Rimuove tutti i dialoghi attivi
     */
    dismissAll(): void {
        this.activeDialogues.forEach(dialogue => {
            this.removeDialogue(dialogue);
        });
    }

    /**
     * Rimuove un dialogo dal DOM
     */
    private removeDialogue(componentRef: ComponentRef<DialogueBubbleComponent>): void {
        const index = this.activeDialogues.indexOf(componentRef);
        if (index > -1) {
            this.activeDialogues.splice(index, 1);
        }

        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
    }

    /**
     * Mostra una sequenza di dialoghi
     */
    async showSequence(dialogues: DialogueConfig[]): Promise<void> {
        for (const config of dialogues) {
            this.showDialogue(config);
            const duration = config.duration || 3000;
            await this.delay(duration);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
