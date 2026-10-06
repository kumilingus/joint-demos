import type { dia } from '@joint/plus';
import type { App } from '../app';
import type { DERIVED } from '../const';
import type { RUNTIME } from '../runtime/controls';
import type { PREFERENCE } from '../palette/favorites';

/*
 * The history of the app: what it records, undo and redo.
 */

/**
 * The history records the editing of the diagram (the images of the user included), not the changes
 * in the runtime mode, nor the changes derived from other ones (they follow them on undo and redo),
 * nor the preferences of the user (the favorite shapes).
 */
export const historyOptions: Partial<dia.CommandManager.Options> = {
    cmdBeforeAdd: (_eventName: string, ...eventArgs: unknown[]) => {
        // The options are the last argument of every graph event.
        const options = eventArgs[eventArgs.length - 1] as Partial<typeof RUNTIME & typeof DERIVED & typeof PREFERENCE> | undefined;
        return !options?.runtime && !options?.derived && !options?.preference;
    }
};

export function undo(app: App): void {
    app.history.undo();
}

export function redo(app: App): void {
    app.history.redo();
}
