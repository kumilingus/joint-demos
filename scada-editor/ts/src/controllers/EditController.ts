import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, clickTarget, selectAtLevel, toggleAtLevel } from '../actions';
import { openBlankMenu, openCellMenu } from '../context-menu';
import { showHover } from '../selection';

/**
 * Selecting cells on the canvas: a click selects a cell (the group it is in, a level further in when
 * that is selected, see `selectAtLevel()`), a click with Ctrl / Cmd / Shift adds it to the selection
 * (or removes it, of the same level only), a hovered cell is framed faintly with what the click selects,
 * a drag with Shift on the blank canvas selects the cells it touches (see `selection.ts`). The right click opens the context menu of a cell or of the blank
 * canvas (see `context-menu.ts`). Active in the edit mode only.
 */
export default class EditController extends Controller {

    startListening(): void {
        const { paper } = this.context;

        this.listenTo(paper, {
            'cell:pointerclick': onCellPointerclick,
            'blank:pointerdown': onBlankPointerdown,
            'cell:contextmenu': onCellContextmenu,
            // A hovered cell shows what a click on it selects (the cell, its group, a member of the selected group).
            'cell:mouseenter': onCellMouseenter,
            'cell:mouseleave': onCellMouseleave,
            'blank:contextmenu': onBlankContextmenu
        });
    }
}

/** Whether the event adds to the selection (a cell picked, a region selected). */
export function isSelectionEvent(evt: dia.Event): boolean {
    return Boolean(evt.shiftKey || evt.ctrlKey || evt.metaKey);
}

function onCellPointerclick(app: App, cellView: dia.CellView, evt: dia.Event) {
    // A member of a group selects the group, and its member when the group is selected (see `Group`).
    const { model } = cellView;
    showHover(app.paper, null);
    if (isSelectionEvent(evt)) {
        toggleAtLevel(app, model);
    } else {
        selectAtLevel(app, model);
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

function onCellMouseenter(app: App, cellView: dia.CellView) {
    showHover(app.paper, clickTarget(app, cellView.model));
}

function onCellMouseleave(app: App) {
    showHover(app.paper, null);
}
