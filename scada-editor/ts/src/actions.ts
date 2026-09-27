import type { dia } from '@joint/plus';
import type { App } from './app';
import { GRID_SIZE } from './const';

export function selectCell(app: App, cell: dia.Cell): void {
    app.selection.reset([cell]);
}

export function selectCells(app: App, cells: dia.Cell[]): void {
    app.selection.reset(cells);
}

/** Add the cell to the selection, or remove it if it is selected (cherry-picking). */
export function toggleCell(app: App, cell: dia.Cell): void {
    const { selection } = app;
    if (selection.has(cell)) {
        selection.remove(cell);
    } else {
        selection.add(cell);
    }
}

/** Move the other selected cells with the one moved by the user (by the same amount). */
export function moveSelectionWith(app: App, cell: dia.Cell, dx: number, dy: number): void {
    const { selection } = app;
    if (!selection.has(cell)) return;
    selection.each((other) => {
        if (other === cell) return;
        // A pipe between the selected elements moves with them (its vertices).
        (other as dia.Element | dia.Link).translate(dx, dy, { selectionMove: true });
    });
}

export function clearSelection(app: App): void {
    app.selection.reset();
}

export function removeSelection(app: App): void {
    const { selection, graph } = app;
    if (selection.length === 0) return;
    graph.removeCells(selection.toArray());
}

export function undo(app: App): void {
    app.history.undo();
}

export function redo(app: App): void {
    app.history.redo();
}

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
    const { selection, graph, clipboard } = app;
    if (selection.length === 0) return;
    const elements = selection.filter(cell => cell.isElement());
    if (elements.length > 0) {
        clipboard.copyElements(elements, graph);
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
    graph.removeCells(selection.toArray());
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
    selectCells(app, cells);
}
