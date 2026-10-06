import type { dia } from '@joint/plus';
import boilerHouse from './diagrams/boiler-house.json';
import cementPlant from './diagrams/cement-plant.json';
import microgrid from './diagrams/microgrid.json';

/*
 * The example diagrams (saved with the Save button): offered in the empty inspector panel (see `App`).
 */

export interface Example {
    name: string;
    description: string;
    json: dia.Graph.JSON;
}

export const EXAMPLES: Example[] = [
    {
        name: 'Boiler House',
        description: 'Steam: the boilers, the feedwater, the charts of the plant',
        json: boilerHouse
    },
    {
        name: 'Microgrid',
        description: 'Power: the wind, the sun, a diesel backup and a battery on a bus',
        json: microgrid
    },
    {
        name: 'Cement Plant',
        description: 'Solids: the limestone up a belt, the raw meal through the preheater, the gas to the stack',
        json: cementPlant
    }
];
