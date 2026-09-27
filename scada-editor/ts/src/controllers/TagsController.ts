import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { ensureTag } from '../tags';

/**
 * Every element has a tag (an ID, see `tags.ts`): an element added without one
 * (dropped from the palette) gets the next free one. Active in every mode.
 */
export default class TagsController extends Controller {

    startListening(): void {
        const { graph } = this.context;

        this.listenTo(graph, {
            'add': onCellAdd,
            'reset': onGraphReset,
            // Edited in the inspector
            'change:tag': onTagChange
        });
    }
}

function onCellAdd(app: App, cell: dia.Cell, _collection: unknown, options: dia.Cell.Options) {
    if (!cell.isElement()) return;
    // In the same batch as the adding (undone together)
    ensureTag(app.graph, cell, options);
}

function onGraphReset(app: App) {
    app.graph.getElements().forEach(element => ensureTag(app.graph, element));
}

/** A tag must not be empty or taken by another element: such a change is reverted. */
function onTagChange(app: App, element: dia.Element, tag: string) {
    const taken = app.graph.getElements().some(other => other !== element && other.get('tag') === tag);
    if (tag && !taken) return;
    element.set('tag', element.previous('tag'));
}
