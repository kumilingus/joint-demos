import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, clickTarget, duplicate, selectAtLevel, selectCell, toggleAtLevel } from '../actions';
import { delegateDrag, getDragDelegate } from '../canvas/drag';
import { openBlankMenu, openCellMenu } from '../canvas/context-menu';
import { preventSelectionInteraction, showHover } from '../canvas/selection';

/**
 * Selecting cells on the canvas: a click selects a cell (the group it is in, a level further in when
 * that is selected, see `selectAtLevel()`), a click with Ctrl / Cmd / Shift adds it to the selection
 * (or removes it, of the same level only), a hovered cell is framed faintly with what the click selects,
 * a drag with Shift on the blank canvas selects the cells it touches (see `selection.ts`). The right click opens the context menu of a cell or of the blank
 * canvas (see `context-menu.ts`). A drag with Cmd / Ctrl or Alt / Option moves a copy (the original stays, connected);
 * a click with Cmd / Ctrl is still a click (it adds to the selection).
 * Active in the edit mode only.
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
            'blank:contextmenu': onBlankContextmenu,
            // A drag with Cmd / Ctrl or Alt / Option: a copy dragged
            'element:pointerdown': onElementPointerdown,
            'element:pointermove': onElementPointermove,
            'element:pointerup': onElementPointerup
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

const DUPLICATE_BATCH = 'duplicate';

/** Whether the press drags a copy: with Cmd / Ctrl (as PowerPoint, Visio) or Alt / Option (as Figma, Illustrator) */
function isDuplicateEvent(evt: dia.Event): boolean {
    return Boolean(evt.metaKey || evt.ctrlKey || evt.altKey);
}

/**
 * Cmd / Ctrl or Alt / Option pressed on an element: not moved (see `onElementPointermove()`), the point of the press
 * kept - a click with it is a click
 */
function onElementPointerdown(app: App, view: dia.ElementView, evt: dia.Event, x: number, y: number) {
    if (!isDuplicateEvent(evt)) return;
    view.preventDefaultInteraction(evt);
    view.eventData(evt, { duplicatePressed: { x, y }});
    // Nor moved with the other selected cells (the selection moves them)
    preventSelectionInteraction(app.selectionView, evt);
}

/**
 * The first move of the press with the key: the element it moves (the element, its group) copied in place, the copy
 * moved from now on (see `drag.ts`) and selected; the original stays, with its connections
 */
function onElementPointermove(app: App, view: dia.ElementView, evt: dia.Event, x: number, y: number) {
    const { duplicatePressed } = view.eventData(evt);
    if (!duplicatePressed || getDragDelegate(view, evt)) return;
    const moved = view.getDelegatedView() as dia.ElementView | null;
    if (!moved) return;
    app.graph.startBatch(DUPLICATE_BATCH);
    const copy = duplicate(app, moved.model as dia.Element);
    const copyView = copy.findView(app.paper) as dia.ElementView | undefined;
    if (!copyView) {
        app.graph.stopBatch(DUPLICATE_BATCH);
        return;
    }
    // The copy alone selected (the selection doesn't move the others with it)
    selectCell(app, copy);
    view.eventData(evt, { duplicated: true });
    delegateDrag(view, evt, copyView, duplicatePressed, x, y);
}

/** The copy dropped: the copy and its move one step of the history */
function onElementPointerup(app: App, view: dia.ElementView, evt: dia.Event) {
    if (view.eventData(evt).duplicated) app.graph.stopBatch(DUPLICATE_BATCH);
}
