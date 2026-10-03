import type { App } from '../app';

/*
 * Undo and redo (the history of the app).
 */

export function undo(app: App): void {
    app.history.undo();
}

export function redo(app: App): void {
    app.history.redo();
}
