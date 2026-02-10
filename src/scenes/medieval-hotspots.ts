
import { HotspotArea } from './bridge-hotspots';

export const MEDIEVAL_HOTSPOTS: HotspotArea[] = [
    {
        id: 'throne',
        name: 'Wooden Throne',
        description: 'A beautifully carved oak throne.',
        type: 'interactable',
        bounds: { x: 45, y: 40, width: 10, height: 15 },
        status: 'unlocked',
        isObstacle: true
    }
];

// Area calpestabile per la stanza medioevale (stanza_vuota.png)
export const MEDIEVAL_WALKABLE_POLYGON = [
    { x: 5, y: 55 },
    { x: 95, y: 55 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
];

export function isPointInMedievalWalkableArea(x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = MEDIEVAL_WALKABLE_POLYGON.length - 1; i < MEDIEVAL_WALKABLE_POLYGON.length; j = i++) {
        const xi = MEDIEVAL_WALKABLE_POLYGON[i].x, yi = MEDIEVAL_WALKABLE_POLYGON[i].y;
        const xj = MEDIEVAL_WALKABLE_POLYGON[j].x, yj = MEDIEVAL_WALKABLE_POLYGON[j].y;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
