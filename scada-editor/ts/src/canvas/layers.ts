import { dia } from '@joint/plus';
import { cellNamespace } from '../shapes';
import { Layer } from '../const';

/*
 * The graph has a layer for each kind of cell (see `Layer`): the pipes are drawn under the equipment
 * they connect, the instruments (a gauge on a tank) over it - whatever the order of adding.
 * A shape says in which layer it is (`Shape.graphLayer`), a pipe is in the pipes layer.
 */

/** What the user calls the layers (the inspector, the context menu), from the top one down */
export const LAYER_NAMES: Record<Layer, string> = {
    [Layer.Foreground]: 'Foreground',
    [Layer.Instruments]: 'Instruments',
    [Layer.Equipment]: 'Equipment',
    [Layer.Pipes]: 'Pipes',
    [Layer.Background]: 'Background'
};

/** An empty graph with the layers (the equipment layer by default). */
export function createGraph(): dia.Graph {
    const graph = new dia.Graph({}, { cellNamespace });
    graph.fromJSON({
        cells: [],
        layers: Object.values(Layer).map(id => ({ id })),
        defaultLayer: Layer.Equipment
    });
    return graph;
}
