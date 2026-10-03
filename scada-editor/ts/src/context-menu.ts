import { type dia, ui } from '@joint/plus';
import type { App } from './app';
import {
    bringToFront, copySelection, cutSelection, elementBelow, groupable, groupSelection, layerOver, layerUnder, menuCell, moveToLayer, pasteAt, ungroupSelection, removeSelection, selectCell, sendToBack, splitLink, insertJoin
} from './actions';
import { LAYER_NAMES } from './layers';
import { isGroup } from './shapes/Group';
import type { Layer } from './const';

/*
 * The context menus of the canvas (`ui.ContextToolbar`, in the edit mode): of a cell - the clipboard,
 * the order in its layer and the removal of the selection (the cell selected first if it is not), the split
 * of a link at the pointer (a join inserted into a pipe there), the selection of the element below at the pointer;
 * of the blank canvas - the paste at the pointer.
 */

/** A shortcut shown next to the item: the one of the platform */
const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

interface MenuItem {
    action: string;
    label: string;
    shortcut?: string;
    /** A note on the right instead of a shortcut (the layer the order is within) */
    hint?: string;
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
            content: `<span>${item.label}</span>${item.shortcut ? `<kbd>${item.shortcut}</kbd>` : ''}${item.hint ? `<span class="hint">${item.hint}</span>` : ''}`,
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
export function openCellMenu(app: App, clicked: dia.Cell, evt: dia.Event, x: number, y: number): void {
    // The element selected below the clicked one keeps the menu (going on down, see `menuCell()`).
    const cell = menuCell(app, clicked, { x, y });
    if (!app.selection.has(cell)) selectCell(app, cell);
    // The front and the back are those of the layer of the cell (see `layers.ts`): named in the menu
    const layers = new Set(app.selection.map(selected => app.graph.getCellLayerId(selected)));
    const [layer] = layers;
    const layerHint = `in ${layers.size === 1 ? LAYER_NAMES[layer as Layer] ?? layer : 'their layers'}`;
    // Under an element of a layer above (out of the reach of the front), over one of a layer below (of the back):
    // moved into that layer instead
    const over = layerOver(app);
    const under = layerUnder(app);
    const below = elementBelow(app, cell, { x, y });
    openMenu(app, evt, [
        { action: 'cut', label: 'Cut', shortcut: `${MOD}X`, run: () => cutSelection(app) },
        { action: 'copy', label: 'Copy', shortcut: `${MOD}C`, run: () => copySelection(app) },
        // Several elements (groups too) into a group, a single group back into its members (see `Group`)
        ...(isGroup(cell) && app.selection.length === 1
            ? [{ action: 'ungroup', label: 'Ungroup', shortcut: `${MOD}⇧G`, separated: true, run: () => ungroupSelection(app) }]
            : [{
                action: 'group',
                label: 'Group',
                shortcut: `${MOD}G`,
                disabled: groupable(app).length < 2,
                separated: true,
                run: () => groupSelection(app)
            }]),
        ...(cell.isLink()
            ? [{ action: 'split', label: 'Split Here', separated: true, run: () => splitLink(app, cell, { x, y }) }]
            : []),
        // A join is a fitting of the pipes.
        ...(cell.get('type') === 'Pipe'
            ? [{ action: 'join', label: 'Insert Join', run: () => insertJoin(app, cell as dia.Link, { x, y }) }]
            : []),
        // The element under this one at the pointer (hard to click otherwise): named by its ID
        {
            action: 'below',
            label: 'Select Below',
            hint: below ? String(below.get('tag') ?? '') : undefined,
            disabled: !below,
            separated: true,
            run: () => below && selectCell(app, below)
        },
        { action: 'front', label: 'Bring to Front', hint: layerHint, separated: true, run: () => bringToFront(app) },
        { action: 'back', label: 'Send to Back', hint: layerHint, run: () => sendToBack(app) },
        ...(over
            ? [{ action: 'layer', label: `Move to ${LAYER_NAMES[over]}`, hint: 'over what covers it', run: () => moveToLayer(app, over) }]
            : []),
        ...(under
            ? [{ action: 'layer-down', label: `Move to ${LAYER_NAMES[under]}`, hint: 'under what it covers', run: () => moveToLayer(app, under, { back: true }) }]
            : []),
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
