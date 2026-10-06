import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { showPipeColors, showPipeColorsAtEnds } from '../canvas/connections';

/**
 * An element showing its pipe takes the color of the pipe (see `showPipeColor()`): again when a pipe is
 * recolored, connected or disconnected, added or removed. Active in every mode.
 */
export default class PipeColorController extends Controller {

    startListening(): void {
        const { graph } = this.context;
        showPipeColors(graph);
        this.listenTo(graph, {
            'reset': onGraphReset,
            'add remove': onLinkAddRemove,
            'change:source change:target': onLinkReconnect,
            'change:style': onPipeRecolor
        });
    }
}

function onGraphReset(app: App) {
    showPipeColors(app.graph);
}

function onLinkAddRemove(app: App, cell: dia.Cell) {
    if (!cell.isLink()) return;
    showPipeColorsAtEnds(app.graph, [cell.source(), cell.target()]);
}

function onLinkReconnect(app: App, link: dia.Link) {
    showPipeColorsAtEnds(app.graph, [link.source(), link.target(), link.previous('source'), link.previous('target')]);
}

function onPipeRecolor(app: App, cell: dia.Cell) {
    if (!cell.isLink() || cell.get('type') !== 'Pipe') return;
    showPipeColorsAtEnds(app.graph, [cell.source(), cell.target()]);
}
