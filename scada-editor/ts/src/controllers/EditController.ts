import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, selectCell, toggleCell } from '../actions';
import { openBlankMenu, openCellMenu } from '../context-menu';

/**
 * Selecting cells on the canvas: a click selects a cell, a click with Ctrl / Cmd / Shift
 * adds it to the selection (or removes it), a drag with Shift on the blank canvas selects
 * the cells it touches (see `selection.ts`). The right click opens the context menu of a cell or of the blank
 * canvas (see `context-menu.ts`). Active in the edit mode only.
 */
export default class EditController extends Controller {

    startListening(): void {
        const { paper } = this.context;

        this.listenTo(paper, {
            'cell:pointerclick': onCellPointerclick,
            'blank:pointerdown': onBlankPointerdown,
            'cell:contextmenu': onCellContextmenu,
            'blank:contextmenu': onBlankContextmenu
        });
    }
}

/** Whether the event adds to the selection (a cell picked, a region selected). */
export function isSelectionEvent(evt: dia.Event): boolean {
    return Boolean(evt.shiftKey || evt.ctrlKey || evt.metaKey);
}

function onCellPointerclick(app: App, cellView: dia.CellView, evt: dia.Event) {
    if (isSelectionEvent(evt)) {
        toggleCell(app, cellView.model);
    } else {
        selectCell(app, cellView.model);
    }
}

function onBlankPointerdown(app: App, evt: dia.Event) {
    // Otherwise the canvas is panned (see `CanvasController`).
    if (!evt.shiftKey) {
        clearSelection(app);
        return;
    }
    app.selectionView.startSelecting(evt);
}

function onCellContextmenu(app: App, cellView: dia.CellView, evt: dia.Event, x: number, y: number) {
    openCellMenu(app, cellView.model, evt, x, y);
}

function onBlankContextmenu(app: App, evt: dia.Event, x: number, y: number) {
    openBlankMenu(app, evt, x, y);
}
