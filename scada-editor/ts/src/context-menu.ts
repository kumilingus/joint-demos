import { type dia, ui } from '@joint/plus';
import type { App } from './app';
import {
    bringToFront, copySelection, cutSelection, pasteAt, removeSelection, selectCell, sendToBack, splitLink, insertJoin
} from './actions';

/*
 * The context menus of the canvas (`ui.ContextToolbar`, in the edit mode): of a cell - the clipboard,
 * the order in its layer and the removal of the selection (the cell selected first if it is not), the split
 * of a link at the pointer (a join inserted into a pipe there); of the blank canvas - the paste at the pointer.
 */

/** A shortcut shown next to the item: the one of the platform */
const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

interface MenuItem {
    action: string;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    /** A line above the item: the items in groups */
    separated?: boolean;
    run: () => void;
}

function openMenu(app: App, evt: dia.Event, items: MenuItem[]): void {
    ui.ContextToolbar.close();
    const menu = new ui.ContextToolbar({
        target: { x: evt.clientX!, y: evt.clientY! },
        root: app.el,
        vertical: true,
        anchor: 'top-left',
        padding: 0,
        tools: items.map(item => ({
            action: item.action,
            content: `<span>${item.label}</span>${item.shortcut ? `<kbd>${item.shortcut}</kbd>` : ''}`,
            attrs: {
                class: item.separated ? 'tool separated' : 'tool',
                ...(item.disabled ? { disabled: 'disabled' } : {})
            }
        }))
    });
    items.forEach((item) => {
        menu.on(`action:${item.action}`, () => {
            ui.ContextToolbar.close();
            item.run();
        });
    });
    menu.render();
}

/** The menu of a cell: it acts on the selection (the cell only, unless it is selected), a split on the link */
export function openCellMenu(app: App, cell: dia.Cell, evt: dia.Event, x: number, y: number): void {
    if (!app.selection.has(cell)) selectCell(app, cell);
    openMenu(app, evt, [
        { action: 'cut', label: 'Cut', shortcut: `${MOD}X`, run: () => cutSelection(app) },
        { action: 'copy', label: 'Copy', shortcut: `${MOD}C`, run: () => copySelection(app) },
        ...(cell.isLink()
            ? [{ action: 'split', label: 'Split Here', separated: true, run: () => splitLink(app, cell, { x, y }) }]
            : []),
        // A join is a fitting of the pipes.
        ...(cell.get('type') === 'Pipe'
            ? [{ action: 'join', label: 'Insert Join', run: () => insertJoin(app, cell as dia.Link, { x, y }) }]
            : []),
        { action: 'front', label: 'Bring to Front', separated: true, run: () => bringToFront(app) },
        { action: 'back', label: 'Send to Back', run: () => sendToBack(app) },
        { action: 'delete', label: 'Delete', shortcut: 'Del', separated: true, run: () => removeSelection(app) }
    ]);
}

/** The menu of the blank canvas: the copied cells pasted where it was opened */
export function openBlankMenu(app: App, evt: dia.Event, x: number, y: number): void {
    openMenu(app, evt, [
        { action: 'paste', label: 'Paste', shortcut: `${MOD}V`, disabled: app.clipboard.length === 0, run: () => pasteAt(app, { x, y }) }
    ]);
}

export function closeMenu(): void {
    ui.ContextToolbar.close();
}
