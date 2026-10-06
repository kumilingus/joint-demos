import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { ensureTag, isTaggable } from '../plant/tags';

/**
 * Every cell of a shape with tags has one (an ID, see `tags.ts`): a cell added without one
 * (dropped from the palette) gets the next free one. Active in every mode.
 */
export default class TagsController extends Controller {

    startListening(): void {
        const { graph } = this.app;

        this.listenTo(graph, {
            'add': onCellAdd,
            'reset': onGraphReset,
            // Edited in the inspector
            'change:tag': onTagChange
        });
    }
}

function onCellAdd(app: App, cell: dia.Cell, _collection: unknown, options: dia.Cell.Options) {
    const { tags } = app;
    if (!isTaggable(cell)) return;
    // In the same batch as the adding (undone together)
    ensureTag(tags, cell, options);
}

function onGraphReset(app: App) {
    const { graph, tags } = app;
    graph.getCells().filter(isTaggable).forEach(cell => ensureTag(tags, cell));
}

/** A tag must not be empty or taken by another element: such a change is reverted. */
function onTagChange(app: App, cell: dia.Cell, tag: string) {
    const { tags } = app;
    if (tag && !tags.isTaken(tag, cell)) return;
    cell.set('tag', cell.previous('tag'));
}
