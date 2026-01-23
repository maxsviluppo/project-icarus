import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { InventoryItem } from '../components/inventory-panel.component';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly MAX_ITEMS = 8; // Griglia 4x2

    private itemsSubject = new BehaviorSubject<InventoryItem[]>([]);
    public items$: Observable<InventoryItem[]> = this.itemsSubject.asObservable();

    private isOpenSubject = new BehaviorSubject<boolean>(false);
    public isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

    constructor() {
        // Inizializza con alcuni oggetti di esempio per testing
        this.initializeTestItems();
    }

    /**
     * Ottiene tutti gli oggetti nell'inventario
     */
    getItems(): InventoryItem[] {
        return this.itemsSubject.value;
    }

    /**
     * Aggiunge un oggetto all'inventario
     */
    addItem(item: InventoryItem): boolean {
        const currentItems = this.itemsSubject.value;

        if (currentItems.length >= this.MAX_ITEMS) {
            console.warn('Inventario pieno!');
            return false;
        }

        // Verifica se l'oggetto esiste già
        if (currentItems.find(i => i.id === item.id)) {
            console.warn('Oggetto già presente nell\'inventario');
            return false;
        }

        this.itemsSubject.next([...currentItems, item]);
        return true;
    }

    /**
     * Rimuove un oggetto dall'inventario
     */
    removeItem(itemId: string): boolean {
        const currentItems = this.itemsSubject.value;
        const newItems = currentItems.filter(item => item.id !== itemId);

        if (newItems.length === currentItems.length) {
            console.warn('Oggetto non trovato nell\'inventario');
            return false;
        }

        this.itemsSubject.next(newItems);
        return true;
    }

    /**
     * Cerca un oggetto per ID
     */
    getItem(itemId: string): InventoryItem | undefined {
        return this.itemsSubject.value.find(item => item.id === itemId);
    }

    /**
     * Verifica se l'inventario contiene un oggetto
     */
    hasItem(itemId: string): boolean {
        return this.itemsSubject.value.some(item => item.id === itemId);
    }

    /**
     * Apre/chiude il pannello inventario
     */
    toggleInventory(): void {
        this.isOpenSubject.next(!this.isOpenSubject.value);
    }

    /**
     * Apre il pannello inventario
     */
    openInventory(): void {
        this.isOpenSubject.next(true);
    }

    /**
     * Chiude il pannello inventario
     */
    closeInventory(): void {
        this.isOpenSubject.next(false);
    }

    /**
     * Svuota l'inventario
     */
    clear(): void {
        this.itemsSubject.next([]);
    }

    /**
     * Conta gli oggetti nell'inventario
     */
    getItemCount(): number {
        return this.itemsSubject.value.length;
    }

    /**
     * Verifica se l'inventario è pieno
     */
    isFull(): boolean {
        return this.itemsSubject.value.length >= this.MAX_ITEMS;
    }

    /**
     * Inizializza alcuni oggetti di test
     * TODO: Rimuovere in produzione
     */
    private initializeTestItems(): void {
        // Oggetti di esempio per testing
        const testItems: InventoryItem[] = [
            {
                id: 'datapad',
                name: 'Datapad',
                icon: '/items/datapad.png',
                description: 'Un dispositivo portatile per accedere ai log della nave.'
            },
            {
                id: 'medkit',
                name: 'Kit Medico',
                icon: '/items/medkit.png',
                description: 'Kit di pronto soccorso standard della Vesper.'
            },
            {
                id: 'keycard',
                name: 'Scheda Accesso',
                icon: '/items/keycard.png',
                description: 'Scheda di accesso per le aree riservate.'
            }
        ];

        // Aggiungi solo in modalità sviluppo
        if (!this.isProduction()) {
            // Non aggiungiamo oggetti di default per ora
            // this.itemsSubject.next(testItems);
        }
    }

    private isProduction(): boolean {
        return false; // TODO: Implementare check ambiente
    }
}
