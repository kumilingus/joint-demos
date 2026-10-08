import { dia, g } from '@joint/plus';
import type { App } from '../app';
import { GRID_SIZE } from '../const';
import Screen from '../shapes/models/diagram/Screen';
import { selectCell, selectCells, removeCells } from './selection';
import { delegateDrag } from '../canvas/drag';
import { rememberEndDirections, type LinkEnd } from '../shapes/common/routing';

/*
 * Copy, cut and paste (`ui.Clipboard`).
 */

/** A copy is pasted this far from the original (in two grid steps: the centers stay on the grid). */
const PASTE_OFFSET = { dx: 2 * GRID_SIZE, dy: 2 * GRID_SIZE };

/** Whether the end of a link is connected to a copied element */
const isCopied = (end: dia.Link.EndJSON, copied: Set<dia.Cell.ID>) => end.id !== undefined && copied.has(end.id);

/**
 * A copy of the link (not in the graph): connected at its ends to the copied elements (`copied`, by their ids), the
 * other ends where they are now, but not connected (the clipboard would copy the elements they are connected to) - in
 * the directions they had (see `rememberEndDirections()`: the route keeps its shape).
 */
function detachedCopy(app: App, link: dia.Link, copied: Set<dia.Cell.ID>): dia.Link {
    const copy = link.clone();
    // Rendered now if it isn't (out of the viewport: selected, scrolled away): its ends as drawn
    const linkView = app.paper.requireView<dia.LinkView>(link);
    const ends: LinkEnd[] = ['source', 'target'];
    const disconnected = ends.filter(end => !isCopied(link.prop(end), copied));
    disconnected.forEach(end => copy.prop(end, (end === 'source' ? linkView.sourcePoint : linkView.targetPoint).toJSON(), { rewrite: true }));
    rememberEndDirections(link, linkView, disconnected, copy);
    return copy;
}

/**
 * Copy the selected cells: the elements (a group with its members) with the links between them, and the selected
 * links - one to an element not copied detached from it (see `detachedCopy()`).
 */
export function copySelection(app: App): void {
    const { graph, clipboard } = app;
    // A diagram has one screen.
    const selection = app.selection.filter(cell => !Screen.isScreen(cell));
    if (selection.length === 0) return;
    const elements = selection.filter(cell => cell.isElement());
    const copied = new Set(elements.flatMap(element => [element, ...element.getEmbeddedCells({ deep: true })]).map(cell => cell.id));
    // The links between the copied elements are copied with them (as they are).
    const links = selection.filter((cell): cell is dia.Link => cell.isLink())
        .filter(link => !isCopied(link.source(), copied) || !isCopied(link.target(), copied))
        .map(link => detachedCopy(app, link, copied));
    clipboard.copyElements([...elements, ...links], graph, { deep: true });
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
export function duplicate(app: App, element: dia.Element): dia.Cell {
    const { graph } = app;
    const clones = graph.cloneSubgraph(graph.getSubgraph([element], { deep: true }), { deep: true });
    graph.addCells(Object.values(clones));
    return clones[element.id];
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
    const copyView = copy.findView(app.paper);
    if (!(copyView instanceof dia.ElementView)) {
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

/**
 * A copy of the link dragged (`Cmd` / `Ctrl` + a drag of it, see `EditController`): detached at both ends where they
 * are (see `detachedCopy()`), added and selected alone - the original stays, with its connections. Moved with the
 * pointer by `EditController`, dropped by `dropCopy()` (one step of the history).
 */
export function dragLinkCopy(app: App, link: dia.Link): dia.Link {
    const { graph } = app;
    graph.startBatch(DUPLICATE_BATCH);
    const copy = detachedCopy(app, link, new Set());
    graph.addCell(copy);
    selectCell(app, copy);
    return copy;
}
