import { type dia, g } from '@joint/plus';
import type { App } from '../app';
import { GRID_SIZE } from '../const';
import Screen from '../shapes/models/diagram/Screen';
import { selectCell, selectCells, removeCells } from './selection';
import { delegateDrag } from '../canvas/drag';

/*
 * Copy, cut and paste (`ui.Clipboard`).
 */

/** A copy is pasted this far from the original (in two grid steps: the centers stay on the grid). */
const PASTE_OFFSET = { dx: 2 * GRID_SIZE, dy: 2 * GRID_SIZE };

/**
 * A copy of the pipe on its own: its ends are where they are now, but not connected
 * (the clipboard would copy the elements it is connected to with it).
 */
function detachedCopy(app: App, link: dia.Link): dia.Link {
    const copy = link.clone();
    const linkView = link.findView(app.paper) as dia.LinkView | undefined;
    copy.source(linkView ? linkView.sourcePoint.toJSON() : link.getSourcePoint().toJSON());
    copy.target(linkView ? linkView.targetPoint.toJSON() : link.getTargetPoint().toJSON());
    return copy;
}

/** Copy the selected cells: the elements (with the pipes between them), or a pipe on its own. */
export function copySelection(app: App): void {
    const { graph, clipboard } = app;
    // A diagram has one screen.
    const selection = app.selection.filter(cell => !(cell instanceof Screen));
    if (selection.length === 0) return;
    const elements = selection.filter(cell => cell.isElement());
    if (elements.length > 0) {
        // A group with its members (and the links between them)
        clipboard.copyElements(elements, graph, { deep: true });
    } else {
        // Free copies (not in the graph): nothing else is copied with them.
        clipboard.copyElements(selection.map(link => detachedCopy(app, link as dia.Link)), graph);
    }
}

/** Copy the selected cells and remove them (in one step of the history). */
export function cutSelection(app: App): void {
    const { selection, graph } = app;
    if (selection.length === 0) return;
    copySelection(app);
    graph.startBatch('cut');
    removeCells(app, selection.toArray());
    graph.stopBatch('cut');
}

/**
 * Paste the copied cells next to where they were copied from (each paste a step further)
 * and select them. The pasted elements get tags of their own (see `TagsController`).
 */
export function paste(app: App): void {
    const { graph, clipboard } = app;
    if (clipboard.length === 0) return;
    graph.startBatch('paste');
    const cells = clipboard.pasteCells(graph, { translate: PASTE_OFFSET });
    graph.stopBatch('paste');
    // A pasted group, not its members (see `Group`)
    selectCells(app, cells.filter(cell => !cell.isEmbedded()));
}

/**
 * Paste the copied cells centered at the point (of the canvas, snapped to the grid) and select them:
 * the paste of the context menu of the blank canvas (see `context-menu.ts`).
 */
export function pasteAt(app: App, point: dia.Point): void {
    const { graph, clipboard } = app;
    if (clipboard.length === 0) return;
    graph.startBatch('paste');
    const cells = clipboard.pasteCellsAtPoint(graph, new g.Point(point).snapToGrid(GRID_SIZE));
    graph.stopBatch('paste');
    // A pasted group, not its members (see `Group`)
    selectCells(app, cells.filter(cell => !cell.isEmbedded()));
}

/**
 * A copy of the element in place (in the graph): a group with its members and the links between them; the copies
 * get tags of their own (see `TagsController`). In the batch of the caller (one step of the history with the move).
 */
export function duplicate(app: App, element: dia.Element): dia.Element {
    const { graph } = app;
    const clones = graph.cloneSubgraph(graph.getSubgraph([element], { deep: true }), { deep: true });
    graph.addCells(Object.values(clones));
    return clones[element.id] as dia.Element;
}

/** The batch of a drag of a copy (see `dragCopy()`): the copy and its move one step of the history */
const DUPLICATE_BATCH = 'duplicate';

/**
 * The element moved by the press of the view (the element, its group) copied in place: the copy moved by the press
 * from now on (see `drag.ts`) and selected alone (the selection doesn't move the others with it) - the original stays,
 * with its connections. `false` if there is no copy to move.
 */
export function dragCopy(
    app: App,
    view: dia.ElementView,
    evt: dia.Event,
    moved: dia.ElementView,
    pressed: dia.Point,
    x: number,
    y: number
): boolean {
    app.graph.startBatch(DUPLICATE_BATCH);
    const copy = duplicate(app, moved.model);
    const copyView = copy.findView(app.paper) as dia.ElementView | undefined;
    if (!copyView) {
        app.graph.stopBatch(DUPLICATE_BATCH);
        return false;
    }
    selectCell(app, copy);
    delegateDrag(view, evt, copyView, pressed, x, y);
    return true;
}

/** The copy dropped (see `dragCopy()`): the copy and its move one step of the history */
export function dropCopy(app: App): void {
    app.graph.stopBatch(DUPLICATE_BATCH);
}
