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
            y: 45,
            width: 25,
            height: 15
        },
        status: 'unlocked'
    },

    // 2. COMPUTER NAVIGAZIONE (Centro)
    {
        id: 'nav_computer',
        name: 'Computer Navigazione',
        description: 'Sistema di navigazione stellare. Richiede autenticazione.',
        type: 'interactable',
        bounds: {
            x: 35,
            y: 42,
            width: 30,
            height: 12
        },
        status: 'locked'
    },

    // 3. PORTA PRINCIPALE (Sfondo Centro)
    {
        id: 'main_door',
        name: 'Porta Principale',
        description: 'Accesso al corridoio. Attualmente bloccata.',
        type: 'exit',
        bounds: {
            x: 38,
            y: 45,
            width: 24,
            height: 35
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
            x: 70,
            y: 48,
            width: 25,
            height: 25
        },
        status: 'occupied'
    },

    // 5. CAVIDI EMERGENZA (Soffitto/Parete Alta)
    {
        id: 'damaged_pipe',
        name: 'Condotto Danneggiato',
        description: 'Cavi esposti che emettono scintille.',
        type: 'interactable',
        bounds: {
            x: 20,
            y: 25,
            width: 60,
            height: 10
        },
        status: 'broken'
    }
];

/**
 * WALKABLE AREA (Delinea dove il personaggio può camminare)
 * Definisce un poligono o una serie di rettangoli sicuri.
 */
export const WALKABLE_AREA = {
    minY: 60, // Elias non può salire oltre le console (sfondo)
    maxY: 95, // Limite inferiore dello schermo
    minX: 5,  // Muro sinistro
    maxX: 95  // Muro destro
};


/**
 * POSIZIONI INIZIALI DEI PERSONAGGI
 * Coordinate per il posizionamento degli sprite
 */
export const BRIDGE_CHARACTER_POSITIONS = {
    // Elias (Player) - Vicino all'ingresso, centro-destra
    elias: { x: 60, y: 70 },

    // Sarah (Pilota) - Alla console di pilotaggio, in panico
    sarah: { x: 20, y: 65 },

    // Kael (Ingegnere) - Vicino ai pannelli destri
    kael: { x: 75, y: 60 },

    // Mina (Medico) - Svenuta nella capsula criogenica o a terra
    mina: { x: 82, y: 75 }
};

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
