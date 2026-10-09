import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import {
    copySelection, cutSelection, flipSelection, groupSelection, moveSelection, paste, redo, removeSelection, selectAll,
    selectElements, selectUp, toggleSidePanels, undo, ungroupSelection
} from '../actions';
import { closeMenu } from '../canvas/context-menu';
import { isTyping } from '../events';
import { isListOpen } from '../list/FilterListView';

/**
 * Keyboard shortcuts of the editor: delete, undo / redo, the clipboard, select all, group / ungroup, flip, the arrows moving
 * the selection, the side panels shown or hidden, `Escape` - the menu or the list open closed, else one level up (the group
 * of the selected member, then nothing).
 * Active in the edit mode only.
 */
export default class KeyboardController extends Controller {

    startListening(): void {
        const { keyboard } = this.app;

        this.listenTo(keyboard, {
            'delete backspace': onDelete,
            'escape': onEscape,
            'ctrl+z meta+z': onUndo,
            'ctrl+y meta+y ctrl+shift+z meta+shift+z': onRedo,
            'ctrl+c meta+c': onCopy,
            'ctrl+x meta+x': onCut,
            'ctrl+v meta+v': onPaste,
            'ctrl+a meta+a': onSelectAll,
            // The elements only (no connections)
            'ctrl+shift+a meta+shift+a': onSelectElements,
            'ctrl+g meta+g': onGroup,
            'ctrl+shift+g meta+shift+g': onUngroup,
            // Flipped horizontally, vertically (see `flipSelection()`)
            'shift+h': onFlipHorizontally,
            'shift+v': onFlipVertically,
            // A grid step, a few with Shift (see `moveSelection()`)
            'left right up down shift+left shift+right shift+up shift+down': onArrow,
            // Both side panels (see `toggleSidePanels()`)
            'ctrl+\\ meta+\\': onToggleSidePanels
        });
    }
}

function onDelete(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    removeSelection(app);
}

function onEscape(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    // A menu, a list (Find: see `FindController`) closed first - one thing a press
    if (closeMenu() || isListOpen(app.el)) {
        return;
    }
    // One level up: the group of the selected member (see `Group`)
    selectUp(app);
}

function onUndo(app: App, evt: dia.Event) {
    // Typing has an undo of its own.
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    undo(app);
}

function onRedo(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    redo(app);
}

// Typing has a clipboard of its own.

function onCopy(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    copySelection(app);
}

function onCut(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    cutSelection(app);
}

function onPaste(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    paste(app);
}

function onSelectAll(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    selectAll(app);
}

function onSelectElements(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    selectElements(app);
}

// A group of the selected elements, its members back (see `Group`)

function onGroup(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    groupSelection(app);
}

function onUngroup(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    ungroupSelection(app);
}

function onFlipHorizontally(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    flipSelection(app, 'x');
}

function onFlipVertically(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    flipSelection(app, 'y');
}

function onArrow(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    const direction = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const)[evt.key ?? ''];
    if (!direction) {
        return;
    }
    // Nothing selected: the canvas scrolls
    if (moveSelection(app, direction, evt.shiftKey)) {
        evt.preventDefault();
    }
}

function onToggleSidePanels(app: App, evt: dia.Event) {
    if (isTyping(evt)) {
        return;
    }
    evt.preventDefault();
    toggleSidePanels(app);
}
