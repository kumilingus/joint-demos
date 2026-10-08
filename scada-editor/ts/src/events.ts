import type { dia } from '@joint/plus';

/*
 * What an event of the user means to the editor: a pick added to the selection, a drag of a copy, a key typed into a field.
 */

/** Whether the event adds to the selection (a cell picked, a region selected). */
export function isSelectionEvent(evt: dia.Event): boolean {
    return Boolean(evt.shiftKey || evt.ctrlKey || evt.metaKey);
}

/** Whether the press drags a copy: with Cmd / Ctrl (as PowerPoint, Visio; Alt shows the IDs, see `TagBadgesController`) */
export function isDuplicateEvent(evt: dia.Event): boolean {
    return Boolean(evt.metaKey || evt.ctrlKey);
}

/** Whether the key was pressed while typing (e.g. into the inspector). */
export function isTyping(evt: dia.Event | Event): boolean {
    return evt.target instanceof Element && evt.target.closest('input, textarea, select, [contenteditable]') !== null;
}
