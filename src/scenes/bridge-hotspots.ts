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
    // 1. CONSOLE PILOTA (Sinistra - Monitor verde con tastiera)
    {
        id: 'pilot_console',
        name: 'Console Pilota',
        description: 'Postazione di controllo principale con monitor verde e tastiera. Gestisce i sistemi di volo.',
        type: 'interactable',
        bounds: {
            x: 4,
            y: 35,
            width: 18,
            height: 35
        },
        status: 'unlocked'
    },

    // 2. SEDIA PILOTA (DISABLED FOR NOW)
    {
        id: 'pilot_chair',
        name: 'Sedia Pilota',
        description: 'Sedia ergonomica della postazione di pilotaggio.',
        type: 'interactable',
        bounds: {
            x: 24.1,
            y: 48,
            width: 12,
            height: 20.2
        },
        image: '/sedia pilota.png'
    },

    // 3. PANNELLO CONTROLLO CENTRALE SUPERIORE
    {
        id: 'central_upper_panel',
        name: 'Pannello Controllo Centrale',
        description: 'Console centrale con display di navigazione e sistemi principali.',
        type: 'interactable',
        bounds: {
            x: 27,
            y: 25,
            width: 15,
            height: 20
        },
        status: 'locked'
    },

    // 4. CONSOLE NAVIGAZIONE (Display verde centrale)
    {
        id: 'nav_computer',
        name: 'Computer Navigazione',
        description: 'Sistema di navigazione stellare. Richiede autenticazione.',
        type: 'interactable',
        bounds: {
            x: 27,
            y: 45,
            width: 15,
            height: 15
        },
        status: 'locked'
    },

    // 5. PORTA DI USCITA (Centro)
    {
        id: 'main_door',
        name: 'Porta Principale',
        description: 'Porta di accesso al corridoio principale della nave.',
        type: 'exit',
        bounds: {
            x: 38,
            y: 48,
            width: 16,
            height: 50
        },
        status: 'locked'
    },

    // 6. TUBO CHE PERDE / CAVI EMERGENZA (Alto - rossi)
    {
        id: 'damaged_pipe',
        name: 'Tubo che Perde',
        description: 'Condotto danneggiato che emette vapore. Necessita riparazione.',
        type: 'interactable',
        bounds: {
            x: 30,
            y: 15,
            width: 20,
            height: 12
        },
        status: 'broken',
        visibleWhen: (flags) => !flags['pipe_fixed']
    },

    // 7. PANNELLO DESTRO (Console con luci rosse/verdi)
    {
        id: 'right_panel',
        name: 'Pannello Sistemi',
        description: 'Console di monitoraggio dei sistemi vitali e energetici.',
        type: 'interactable',
        bounds: {
            x: 68,
            y: 30,
            width: 18,
            height: 35
        }
    },

    // 8. CAPSULA CRIOGENICA (Destra - struttura verde)
    {
        id: 'cryo_pod',
        name: 'Capsula Criogenica',
        description: 'Unità medica di emergenza. Qualcuno è all\'interno.',
        type: 'interactable',
        bounds: {
            x: 75,
            y: 50,
            width: 18,
            height: 35
        },
        status: 'occupied'
    },

    // 9. LUCI EMERGENZA (Alto - rosse lampeggianti)
    {
        id: 'emergency_lights',
        name: 'Luci Emergenza',
        description: 'Sistema di allarme attivo. Luci rosse rotanti.',
        type: 'interactable',
        bounds: {
            x: 15,
            y: 8,
            width: 70,
            height: 8
        },
        visibleWhen: (flags) => flags['emergency_active'] !== false
    },

    // 10. PANNELLI INFERIORI (Console basse)
    {
        id: 'lower_panels',
        name: 'Pannelli Inferiori',
        description: 'Console di controllo secondarie e sistemi di supporto.',
        type: 'interactable',
        bounds: {
            x: 25,
            y: 75,
            width: 50,
            height: 15
        }
    }
];

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
