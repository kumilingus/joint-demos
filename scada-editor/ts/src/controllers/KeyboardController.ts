import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { copySelection, cutSelection, flipSelection, groupSelection, paste, redo, removeSelection, selectAll, selectElements, selectUp, undo, ungroupSelection } from '../actions';
import { closeMenu } from '../canvas/context-menu';
import { isTyping } from '../events';

/**
 * Keyboard shortcuts of the editor: delete, undo / redo, the clipboard, select all, group / ungroup, flip, `Escape` one level
 * up (the group of the selected member, then nothing). Active in the edit mode only.
 */
export default class KeyboardController extends Controller {

    startListening(): void {
        const { keyboard } = this.context;

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
            'shift+v': onFlipVertically
        });
    }
}

function onDelete(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    removeSelection(app);
}

function onEscape(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    closeMenu();
    // One level up: the group of the selected member (see `Group`)
    selectUp(app);
}

function onUndo(app: App, evt: dia.Event) {
    // Typing has an undo of its own.
    if (isTyping(evt)) return;
    evt.preventDefault();
    undo(app);
}

function onRedo(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    redo(app);
}

// Typing has a clipboard of its own.

function onCopy(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    copySelection(app);
}

function onCut(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    cutSelection(app);
}

function onPaste(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    paste(app);
}

function onSelectAll(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    selectAll(app);
}

function onSelectElements(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    selectElements(app);
}

// A group of the selected elements, its members back (see `Group`)

function onGroup(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    groupSelection(app);
}

function onUngroup(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    ungroupSelection(app);
}

function onFlipHorizontally(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    flipSelection(app, 'x');
}

function onFlipVertically(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    flipSelection(app, 'y');
}
