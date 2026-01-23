/**
 * BRIDGE SCENE - HOTSPOT CONFIGURATION
 * Coordinate degli hotspots per il Ponte di Comando della Vesper
 * 
 * Le coordinate sono in percentuale (0-100) rispetto all'immagine della scena.
 * Ogni hotspot ha una posizione (x, y) e dimensioni (width, height).
 */

export interface HotspotArea {
    id: string;
    name: string;
    description: string;
    type: 'interactable' | 'pickup' | 'exit' | 'character';
    // Coordinate in percentuale (0-100)
    bounds: {
        x: number;      // Posizione X (da sinistra)
        y: number;      // Posizione Y (dall'alto)
        width: number;  // Larghezza
        height: number; // Altezza
    };
    status?: string;
    // Flag per identificare se l'hotspot è visibile in base allo stato del gioco
    visibleWhen?: (flags: Record<string, boolean>) => boolean;
    // Immagine opzionale da sovrapporre all'area (es. sedia pilota)
    image?: string;
    // FLAG COLLISIONE: se true, il personaggio non può entrarci
    isObstacle?: boolean;
}

/**
 * MAPPA HOTSPOTS - PONTE DI COMANDO
 * Basata sull'immagine della scena
 */
export const BRIDGE_HOTSPOTS: HotspotArea[] = [
    // 1. CONSOLE PILOTA (Sinistra)
    {
        id: 'pilot_console',
        name: 'Console Pilota',
        description: 'Postazione di controllo principale. Monitor verdi attivi.',
        type: 'interactable',
        bounds: {
            x: 5,
            y: 33,      // Alzata a 33
            width: 25,
            height: 15
        },
        status: 'unlocked',
        isObstacle: true // NON CALPESTABILE
    },

    // 2. COMPUTER NAVIGAZIONE (Centro)
    {
        id: 'nav_computer',
        name: 'Computer Navigazione',
        description: 'Sistema di navigazione stellare. Richiede autenticazione.',
        type: 'interactable',
        bounds: {
            x: 50,      // Spostato per far finire il lato destro a 80
            y: 27,      // Alzato a 27
            width: 30,
            height: 12
        },
        status: 'locked',
        isObstacle: true // NON CALPESTABILE
    },

    // 3. PORTA PRINCIPALE (Sfondo Centro)
    {
        id: 'main_door',
        name: 'Porta Principale',
        description: 'Accesso al corridoio. Attualmente bloccata.',
        type: 'exit',
        bounds: {
            x: 32.4,
            y: 25.0,
            width: 20.6,
            height: 25.7 // 50.7 - 25.0
        },
        status: 'locked'
    },

    // 4. CAPSULA CRIOGENICA (Destra)
    {
        id: 'cryo_pod',
        name: 'Unità Medica',
        description: 'Capsula di ibernazione d\'emergenza.',
        type: 'interactable',
        bounds: {
            x: 84,      // Spostato il bordo sinistro a 84
            y: 25,
            width: 11,  // Ridotta la larghezza (95 - 84)
            height: 23
        },
        status: 'occupied',
        isObstacle: true // NON CALPESTABILE
    },

    // 5. CAVIDI EMERGENZA (Soffitto/Parete Alta)
    {
        id: 'damaged_pipe',
        name: 'Condotto Danneggiato',
        description: 'Cavi esposti che emettono scintille.',
        type: 'interactable',
        bounds: {
            x: 20,
            y: 14,      // Alzato in modo che il fondo (14+10) sia a 24
            width: 60,
            height: 10
        },
        status: 'broken'
    },

    // 6. PANNELLO A TERRA (Calpestabile ma interattivo)
    {
        id: 'floor_panel',
        name: 'Pannello a Terra',
        description: 'Una piastra di metallo leggermente sollevata.',
        type: 'interactable',
        bounds: {
            x: 45,
            y: 75,
            width: 10,
            height: 8
        },
        isObstacle: false // CALPESTABILE
    }
];

/**
 * WALKABLE POLYGON (Delinea l'area bianca disegnata dall'utente)
 */
export const WALKABLE_POLYGON = [
    { x: 25, y: 52 },  // Angolo alto-sx (vicino porta)
    { x: 65, y: 52 },  // Angolo alto-dx
    { x: 82, y: 65 },  // Diagonale vicino Unità Medica
    { x: 97, y: 78 },  // Bordo dx basso
    { x: 97, y: 99 },  // Angolo basso dx
    { x: 2, y: 99 },  // Angolo basso sx
    { x: 2, y: 85 },  // Salita sx
    { x: 18, y: 65 }   // Diagonale Console Pilota
];

/**
 * Funzione Point-in-Polygon (Ray Casting Algorithm)
 * Verifica se un punto (x, y) è dentro l'area calpestabile
 */
export function isPointInWalkableArea(x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = WALKABLE_POLYGON.length - 1; i < WALKABLE_POLYGON.length; j = i++) {
        const xi = WALKABLE_POLYGON[i].x, yi = WALKABLE_POLYGON[i].y;
        const xj = WALKABLE_POLYGON[j].x, yj = WALKABLE_POLYGON[j].y;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Helper function per verificare se un punto (x, y) è dentro un hotspot
 */
export function isPointInHotspot(
    pointX: number,
    pointY: number,
    hotspot: HotspotArea
): boolean {
    const { x, y, width, height } = hotspot.bounds;
    return (
        pointX >= x &&
        pointX <= x + width &&
        pointY >= y &&
        pointY <= y + height
    );
}

/**
 * Filtra gli hotspots visibili in base ai flags del gioco
 */
export function getVisibleHotspots(
    flags: Record<string, boolean> = {}
): HotspotArea[] {
    return BRIDGE_HOTSPOTS.filter(hotspot => {
        if (!hotspot.visibleWhen) return true;
        return hotspot.visibleWhen(flags);
    });
}
