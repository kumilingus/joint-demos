import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, copySelection, cutSelection, paste, redo, removeSelection, undo } from '../actions';

/**
 * Keyboard shortcuts of the editor. Active in the edit mode only.
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
            'ctrl+v meta+v': onPaste
        });
    }
}

/** Whether the key was pressed while typing (e.g. into the inspector). */
function isTyping(evt: dia.Event): boolean {
    return evt.target instanceof Element && evt.target.closest('input, textarea, select, [contenteditable]') !== null;
}

function onDelete(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    evt.preventDefault();
    removeSelection(app);
}

function onEscape(app: App, evt: dia.Event) {
    if (isTyping(evt)) return;
    clearSelection(app);
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
