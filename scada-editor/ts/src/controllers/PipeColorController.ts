import { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { showPipeColors } from '../canvas/connections';

/**
 * The elements showing their pipe take the color of the pipe (see `showPipeColors()`): again when a link is added,
 * removed, reconnected (dragged, disconnected, undone) or recolored. Active in every mode.
 */
export default class PipeColorController extends Controller {

    startListening(): void {
        const { graph } = this.app;
        showPipeColors(graph);
        this.listenTo(graph, {
            'reset': onGraphReset,
            'add remove change:source change:target change:style': onLinkChange
        });
    }
}

function onGraphReset(app: App) {
    showPipeColors(app.graph);
}

/** Of a link (the graph changes its style too: the style of the diagram, see `diagram-style.ts`) */
function onLinkChange(app: App, cell: dia.Cell | dia.Graph) {
    if (!(cell instanceof dia.Link)) return;
    showPipeColors(app.graph);
}
