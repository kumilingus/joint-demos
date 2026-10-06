import type { dia } from '@joint/plus';

/*
 * The history of the app (undo and redo, see `actions/history.ts`): it records the editing of the diagram (the images
 * of the user included) - not the changes flagged by one of these, a flag in the options of the change (`cell.set(..., DERIVED)`).
 */

/**
 * A change made in the runtime mode (by operating the equipment or by the plant, see `plant/mock/`), not by editing
 * the diagram
 */
export const RUNTIME = { runtime: true };

/** A change derived from another one: it follows it on undo and redo too */
export const DERIVED = { derived: true };

/** A change of a preference of the user (the favorite shapes) */
export const PREFERENCE = { preference: true };

/** The flags in the options of a change (see above) */
export type ChangeFlags = Partial<typeof RUNTIME & typeof DERIVED & typeof PREFERENCE>;

/** The options of a change of a cell, with its flags */
export type ChangeOptions = dia.Cell.Options & ChangeFlags;

/** The history records the changes not flagged (see above). */
export const historyOptions: Partial<dia.CommandManager.Options> = {
    cmdBeforeAdd: (_eventName: string, ...eventArgs: unknown[]) => {
        // The options are the last argument of every graph event.
        const options = eventArgs[eventArgs.length - 1] as ChangeFlags | undefined;
        return !options?.runtime && !options?.derived && !options?.preference;
    }
};
