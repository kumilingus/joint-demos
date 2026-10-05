import { type dia, ui } from '@joint/plus';
import type { App } from '../app';
import {
    bringToFront, copySelection, cutSelection, elementBelow, groupable, groupSelection, layerOver, layerUnder, menuCell, moveToLayer, pasteAt, ungroupSelection, removeSelection, selectCell, sendToBack, splitLink, insertJoin, connectedEnds, disconnectSelection, sameTypeCells, selectAll, selectConnections, selectedTypes, selectElements, selectSameType
} from '../actions';
import { LAYER_NAMES } from './layers';
import { descriptions } from '../palette/descriptions';
import { isGroup } from '../shapes/models/diagram/Group';
import type { Layer } from '../const';

/*
 * The context menus of the canvas (`ui.ContextToolbar`, in the edit mode): of a cell - the clipboard,
 * the order in its layer and the removal of the selection (the cell selected first if it is not), the split
 * of a link at the pointer (a join inserted into a pipe there), the disconnection of the elements from their links, the selection of the element below at the pointer;
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
    keepInWindow(menu.el, evt);
}

// How far the menu keeps from the edges of the window (px)
const WINDOW_MARGIN = 8;

/**
 * The menu in the window: opened up from the pointer if it doesn't fit below it, to the left if it doesn't fit on
 * the right (as the menus of the system); shifted in if it doesn't fit either way
 */
function keepInWindow(el: HTMLElement, evt: dia.Event): void {
    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    const [x, y] = [evt.clientX!, evt.clientY!];
    let dx = 0;
    let dy = 0;
    if (rect.bottom > innerHeight - WINDOW_MARGIN) {
        const up = y - rect.height;
        dy = (up >= WINDOW_MARGIN ? up : Math.max(WINDOW_MARGIN, innerHeight - WINDOW_MARGIN - rect.height)) - rect.top;
    }
    if (rect.right > innerWidth - WINDOW_MARGIN) {
        const left = x - rect.width;
        dx = (left >= WINDOW_MARGIN ? left : Math.max(WINDOW_MARGIN, innerWidth - WINDOW_MARGIN - rect.width)) - rect.left;
    }
    if (dx === 0 && dy === 0) return;
    const style = getComputedStyle(el);
    el.style.left = `${parseFloat(style.left) + dx}px`;
    el.style.top = `${parseFloat(style.top) + dy}px`;
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
            : [disconnectItem(app)]),
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
        // All the cells of the types of the selection (all the pumps, all the wires): the type and how many
        {
            action: 'same-type',
            label: 'Select Same Type',
            hint: sameTypeHint(app),
            disabled: selectedTypes(app).length === 0,
            run: () => selectSameType(app)
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
    const cells = app.graph.getCells();
    openMenu(app, evt, [
        { action: 'paste', label: 'Paste', shortcut: `${MOD}V`, disabled: app.clipboard.length === 0, run: () => pasteAt(app, { x, y }) },
        // Everything, the elements only, the connections only (the links of any kind: pipes, wires, ...)
        { action: 'select-all', label: 'Select All', shortcut: `${MOD}A`, separated: true, disabled: cells.length === 0, run: () => selectAll(app) },
        { action: 'select-elements', label: 'Select Elements', shortcut: `${MOD}⇧A`, disabled: !cells.some(cell => cell.isElement()), run: () => selectElements(app) },
        { action: 'select-connections', label: 'Select Connections', disabled: !cells.some(cell => cell.isLink()), run: () => selectConnections(app) }
    ]);
}

/** Disconnect: the links of the selected elements freed at their ends (how many), none - disabled */
function disconnectItem(app: App): MenuItem {
    const count = connectedEnds(app).length;
    return {
        action: 'disconnect',
        label: 'Disconnect',
        hint: count > 0 ? `${count} ${count === 1 ? 'connection' : 'connections'}` : undefined,
        disabled: count === 0,
        separated: true,
        run: () => disconnectSelection(app)
    };
}

/** The hint of Select Same Type: the type (its name in the palette) or how many types, and how many cells */
function sameTypeHint(app: App): string | undefined {
    const types = selectedTypes(app);
    if (types.length === 0) return undefined;
    const name = types.length === 1 ? descriptions[types[0]]?.title ?? types[0] : `${types.length} types`;
    return `${name} · ${sameTypeCells(app).length}`;
}

export function closeMenu(): void {
    ui.ContextToolbar.close();
}
