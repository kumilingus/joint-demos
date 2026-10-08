import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { ensureUniqueTag } from '../plant/tags';
import { getTag } from '../shapes/common/tag';

/**
 * The tags are unique (the IDs, see `tags.ts`): a cell added with a tag of another one (a copy) gets the next free one of
 * its series, a tag edited to one of another cell is reverted; an empty one is no tag. Active in every mode.
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
    // In the same batch as the adding (undone together)
    ensureUniqueTag(tags, cell, options);
}

function onGraphReset(app: App) {
    const { graph, tags } = app;
    graph.getCells().forEach(cell => ensureUniqueTag(tags, cell));
}

/** A tag taken by another cell: the change reverted; an empty one: no tag (the attribute removed) */
function onTagChange(app: App, cell: dia.Cell, tag: unknown, options: dia.Cell.Options) {
    const { tags } = app;
    if (tag === '') {
        cell.unset('tag', options);
        return;
    }
    const current = getTag(cell);
    if (current && tags.isTaken(current, cell)) {
        cell.set('tag', cell.previous('tag'), options);
    }
}
