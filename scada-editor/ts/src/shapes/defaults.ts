import { dia } from '@joint/plus';
import { cellNamespace } from './index';

/** A graph of the shapes of the app, of none of its diagrams: it knows the defaults of their types (see below) */
let typesGraph: dia.Graph | null = null;

/**
 * The defaults of the type of the cell (`graph.getTypeDefaults()`: computed once for each type, frozen) - of any cell,
 * in a graph or not (the cell of the settings). The graph is created on the first call: this module is imported by the
 * shapes too, before the namespace is complete.
 */
export function getCellDefaults(cell: dia.Cell): dia.Cell.Attributes {
    typesGraph ??= new dia.Graph({}, { cellNamespace });
    return typesGraph.getTypeDefaults(cell.get('type'));
}
