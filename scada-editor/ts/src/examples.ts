import type { dia } from '@joint/plus';
import boilerHouse from './diagram/boiler-house.json';
import microgrid from './diagram/microgrid.json';

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
        json: boilerHouse as dia.Graph.JSON
    },
    {
        name: 'Microgrid',
        description: 'Power: the wind, the sun, a diesel backup and a battery on a bus',
        json: microgrid as dia.Graph.JSON
    }
];
