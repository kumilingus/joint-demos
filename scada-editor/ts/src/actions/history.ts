import type { App } from '../app';

/*
 * Undo and redo (what the history records: see `history.ts`).
 */

export function undo(app: App): void {
    app.history.undo();
}

export function redo(app: App): void {
    app.history.redo();
}
