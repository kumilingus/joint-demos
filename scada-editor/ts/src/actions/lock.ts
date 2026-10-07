import type { dia } from '@joint/plus';
import type { App } from '../app';
import Screen from '../shapes/models/diagram/Screen';
import Group from '../shapes/models/diagram/Group';
import { isLocked, lockOwner } from '../canvas/lock';
import { clearSelection, selectCells } from './selection';
import { drawingOrder } from './order';

/*
 * Locking: a locked element is as if it weren't there while editing (an image in the background, a frame) - the
 * pointer on what is below it, not selected (by a click, a region, Select All); unlocked from the menu of the blank
 * canvas (see `context-menu.ts`). One step of the history each.
 */

/** The selected elements that can be locked (a group: with its members): not the screen */
export function lockable(app: App): dia.Element[] {
    return app.selection.toArray().filter((cell): cell is dia.Element => cell.isElement() && !Screen.isScreen(cell));
}

/** Lock the selected elements (see `lockable()`): out of the selection */
export function lockSelection(app: App): void {
    const { graph } = app;
    const elements = lockable(app);
    if (elements.length === 0) return;
    clearSelection(app);
    graph.startBatch('lock');
    elements.forEach(element => element.set('locked', true));
    graph.stopBatch('lock');
}

/** The elements locked of the diagram: themselves (a group for its members) */
export function lockedElements(app: App): dia.Element[] {
    return app.graph.getElements().filter(element => element.get('locked'));
}

/**
 * What is locked at the point (of the canvas), if anything: the locked element drawn on top there (not a group: it
 * draws nothing), unlocked as a whole - itself, or the locked group it is in (see `lockOwner()`)
 */
export function lockedAt(app: App, point: dia.Point): dia.Element | null {
    const { graph } = app;
    const locked = graph.findElementsAtPoint(point).filter(element => !Group.isGroup(element) && isLocked(element));
    const order = (element: dia.Element) => drawingOrder(graph, element);
    const [top] = locked.sort((a, b) => order(b)[0] - order(a)[0] || order(b)[1] - order(a)[1]);
    const owner = top ? lockOwner(top) : null;
    return owner?.isElement() ? owner : null;
}

/** Unlock the elements: selected (to be moved, to see which) */
export function unlockElements(app: App, elements: dia.Element[]): void {
    const { graph } = app;
    if (elements.length === 0) return;
    graph.startBatch('unlock');
    elements.forEach(element => element.removeProp('locked'));
    graph.stopBatch('unlock');
    selectCells(app, elements);
}
