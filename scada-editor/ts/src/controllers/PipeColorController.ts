import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { pipeColorAt } from '../canvas/connections';
import { DERIVED } from '../shapes/common/routing';
import { styleChanged } from '../shapes/common/style';

/** The elements showing the pipe they sit on (its color): the control valves (the pipe through the window) */
const SHOWS_PIPE = ['ControlValve'];

/**
 * An element showing its pipe takes the color of the pipe (see `pipeColorAt()`): again when a pipe is
 * recolored, connected or disconnected, added or removed. Derived: not in the history. Active in every mode.
 */
export default class PipeColorController extends Controller {

    startListening(): void {
        const { graph } = this.context;
        updateAll(this.context);
        this.listenTo(graph, {
            'reset': updateAll,
            'add remove': onLinkAddRemove,
            'change:source change:target': onLinkReconnect,
            'change:style': onPipeRecolor
        });
    }
}

function update(app: App, element: dia.Cell | undefined | null) {
    if (!element?.isElement() || !SHOWS_PIPE.includes(element.get('type'))) return;
    const color = pipeColorAt(app.graph, element);
    if (element.attr('liquid/stroke') !== color) element.attr('liquid/stroke', color, DERIVED);
}

/** The elements at the ends of a link (now, and before the change) */
function updateEnds(app: App, ends: Array<dia.Link.EndJSON | null | undefined>) {
    ends.forEach(end => end?.id && update(app, app.graph.getCell(end.id)));
}

function updateAll(app: App) {
    app.graph.getElements().forEach(element => update(app, element));
}

function onLinkAddRemove(app: App, cell: dia.Cell) {
    if (!cell.isLink()) return;
    updateEnds(app, [cell.source(), cell.target()]);
}

function onLinkReconnect(app: App, link: dia.Link) {
    updateEnds(app, [link.source(), link.target(), link.previous('source'), link.previous('target')]);
}

function onPipeRecolor(app: App, cell: dia.Cell) {
    if (!cell.isLink() || cell.get('type') !== 'Pipe') return;
    if (!styleChanged(cell, 'color')) return;
    updateEnds(app, [cell.source(), cell.target()]);
}
