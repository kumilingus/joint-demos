import { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, clickTarget, dragCopy, dropCopy, selectAtLevel, toggleAtLevel } from '../actions';
import { getDragDelegate } from '../canvas/drag';
import { isDuplicateEvent, isSelectionEvent } from '../events';
import { openBlankMenu, openCellMenu } from '../canvas/context-menu';
import { preventSelectionInteraction, showHover } from '../canvas/selection';

/**
 * Selecting cells on the canvas: a click selects a cell (the group it is in, a level further in when
 * that is selected, see `selectAtLevel()`), a click with Ctrl / Cmd / Shift adds it to the selection
 * (or removes it, of the same level only), a hovered cell is framed faintly with what the click selects,
 * a drag with Shift on the blank canvas selects the cells it touches (see `selection.ts`). The right click opens the
 * context menu of a cell or of the blank
 * canvas (see `context-menu.ts`). A drag with Cmd / Ctrl or Alt / Option moves a copy (the original stays, connected);
 * a click with Cmd / Ctrl is still a click (it adds to the selection). With *Move selected shapes only* (the settings,
 * on by default on a tablet) a drag moves a selected cell only: on any other it pans the canvas (as the drag of the
 * blank canvas) - a click selects it first.
 * Active in the edit mode only.
 */
export default class EditController extends Controller {

    startListening(): void {
        const { paper } = this.app;

        this.listenTo(paper, {
            'cell:pointerclick': onCellPointerclick,
            'cell:pointerdown': onCellPointerdown,
            'blank:pointerdown': onBlankPointerdown,
            'cell:contextmenu': onCellContextmenu,
            // A hovered cell shows what a click on it selects (the cell, its group, a member of the selected group).
            'cell:mouseenter': onCellMouseenter,
            'cell:mouseleave': onCellMouseleave,
            'blank:contextmenu': onBlankContextmenu,
            // A drag with Cmd / Ctrl or Alt / Option: a copy dragged
            'element:pointerdown': onElementPointerdown,
            'element:pointermove': onElementPointermove,
            'element:pointerup': onElementPointerup
        });
    }
}

function onCellPointerclick(app: App, cellView: dia.CellView, evt: dia.Event) {
    const { paper } = app;
    // A member of a group selects the group, and its member when the group is selected (see `Group`).
    const { model } = cellView;
    showHover(paper, null);
    if (isSelectionEvent(evt)) {
        toggleAtLevel(app, model);
    } else {
        selectAtLevel(app, model);
    }
}

/**
 * Moving the selected cells only (see `App.moveSelectedOnly`): a press on a cell that is not selected (nor the group it
 * would move) pans the canvas, the cell not moved - as Keynote, Pages on a tablet
 */
function onCellPointerdown(app: App, view: dia.CellView, evt: dia.Event) {
    const { scroller, selection, moveSelectedOnly } = app;
    if (!moveSelectedOnly) return;
    // What the drag would move: the element or the group it is in (see `App.interactivityOf()`), the link
    const moved = view instanceof dia.ElementView ? view.getDelegatedView() : view;
    if (moved && selection.has(moved.model)) return;
    view.preventDefaultInteraction(evt);
    scroller.startPanning(evt);
}

function onBlankPointerdown(app: App, evt: dia.Event) {
    const { selectionView } = app;
    // Otherwise the canvas is panned (see `CanvasController`).
    if (!evt.shiftKey) {
        clearSelection(app);
        return;
    }
    selectionView.startSelecting(evt);
}

function onCellContextmenu(app: App, cellView: dia.CellView, evt: dia.Event, x: number, y: number) {
    openCellMenu(app, cellView.model, evt, x, y);
}

function onBlankContextmenu(app: App, evt: dia.Event, x: number, y: number) {
    openBlankMenu(app, evt, x, y);
}

function onCellMouseenter(app: App, cellView: dia.CellView) {
    const { paper } = app;
    showHover(paper, clickTarget(app, cellView.model));
}

function onCellMouseleave(app: App) {
    const { paper } = app;
    showHover(paper, null);
}

/**
 * Cmd / Ctrl or Alt / Option pressed on an element: not moved (see `onElementPointermove()`), the point of the press
 * kept - a click with it is a click
 */
function onElementPointerdown(app: App, view: dia.ElementView, evt: dia.Event, x: number, y: number) {
    const { selectionView } = app;
    if (!isDuplicateEvent(evt)) return;
    view.preventDefaultInteraction(evt);
    view.eventData(evt, { duplicatePressed: { x, y }});
    // Nor moved with the other selected cells (the selection moves them)
    preventSelectionInteraction(selectionView, evt);
}

/**
 * The first move of the press with the key: the element it moves (the element, its group) copied in place, the copy
 * moved from now on (see `drag.ts`) and selected; the original stays, with its connections
 */
function onElementPointermove(app: App, view: dia.ElementView, evt: dia.Event, x: number, y: number) {
    const { duplicatePressed } = view.eventData(evt);
    if (!duplicatePressed || getDragDelegate(view, evt)) return;
    const moved = view.getDelegatedView();
    if (moved && dragCopy(app, view, evt, moved, duplicatePressed, x, y)) view.eventData(evt, { duplicated: true });
}

/** The copy dropped: the copy and its move one step of the history */
function onElementPointerup(app: App, view: dia.ElementView, evt: dia.Event) {
    if (view.eventData(evt).duplicated) dropCopy(app);
}
