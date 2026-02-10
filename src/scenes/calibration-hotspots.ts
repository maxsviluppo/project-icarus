
import { HotspotArea } from './bridge-hotspots';

export const CALIBRATION_HOTSPOTS: HotspotArea[] = [
    {
        id: 'test_cube',
        name: 'Calibration Cube',
        description: 'A floating cube for height and depth testing.',
        type: 'interactable',
        bounds: {
            x: 70,
            y: 50,
            width: 10,
            height: 10
        },
        status: 'unlocked',
        isObstacle: true
    },
    {
        id: 'exit_calibration',
        name: 'Exit Simulation',
        description: 'Return to reality.',
        type: 'exit',
        bounds: {
            x: 45,
            y: 35,
            width: 10,
            height: 15
        },
        status: 'unlocked'
    }
];

export const CALIBRATION_WALKABLE_POLYGON = [
    { x: 5, y: 55 },
    { x: 95, y: 55 },
    { x: 95, y: 95 },
    { x: 5, y: 95 }
];

export function isPointInCalibrationWalkableArea(x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = CALIBRATION_WALKABLE_POLYGON.length - 1; i < CALIBRATION_WALKABLE_POLYGON.length; j = i++) {
        const xi = CALIBRATION_WALKABLE_POLYGON[i].x, yi = CALIBRATION_WALKABLE_POLYGON[i].y;
        const xj = CALIBRATION_WALKABLE_POLYGON[j].x, yj = CALIBRATION_WALKABLE_POLYGON[j].y;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
