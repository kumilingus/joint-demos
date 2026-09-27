import { dia } from '@joint/plus';
import { cellNamespace } from './shapes';
import { Layer } from './const';

/*
 * The graph has a layer for each kind of cell (see `Layer`): the pipes are drawn under the equipment
 * they connect, the instruments (a gauge on a tank) over it - whatever the order of adding.
 * A shape says in which layer it is (`Shape.graphLayer`), a pipe is in the pipes layer.
 */

/** An empty graph with the layers (the equipment layer by default). */
export function createGraph(): dia.Graph {
    const graph = new dia.Graph({}, { cellNamespace });
    graph.fromJSON({
        cells: [],
        layers: [{ id: Layer.Pipes }, { id: Layer.Equipment }, { id: Layer.Instruments }],
        defaultLayer: Layer.Equipment
    });
    return graph;
}
