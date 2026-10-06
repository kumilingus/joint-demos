import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { ensureTag } from '../plant/tags';
import Screen from '../shapes/models/diagram/Screen';

/**
 * Every element has a tag (an ID, see `tags.ts`): an element added without one
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
    const { graph } = app;
    if (!cell.isElement() || Screen.isScreen(cell)) return;
    // In the same batch as the adding (undone together)
    ensureTag(graph, cell, options);
}

function onGraphReset(app: App) {
    const { graph } = app;
    graph.getElements().filter(element => !Screen.isScreen(element)).forEach(element => ensureTag(graph, element));
}

/** A tag must not be empty or taken by another element: such a change is reverted. */
function onTagChange(app: App, element: dia.Element, tag: string) {
    const { graph } = app;
    const taken = graph.getElements().some(other => other !== element && other.get('tag') === tag);
    if (tag && !taken) return;
    element.set('tag', element.previous('tag'));
}
