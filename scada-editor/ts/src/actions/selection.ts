import { type dia } from '@joint/plus';
import type { App } from '../app';
import Screen from '../shapes/models/diagram/Screen';
import Group from '../shapes/models/diagram/Group';
import { withGroups, topGroup, fitGroups, dissolveLoneGroup } from './groups';
import { isLocked } from '../canvas/lock';

/*
 * The selection: a cell, the cells, all of them, the level of the groups clicked, the removal of the selected cells.
 */

export function selectCell(app: App, cell: dia.Cell): void {
    app.selection.reset([cell]);
}

export function selectCells(app: App, cells: dia.Cell[]): void {
    app.selection.reset(cells);
}

/** Select all the cells: as a region selects them - not the screen, a group for its members (see `Group`) */
export function selectAll(app: App): void {
    selectCells(app, app.graph.getCells().filter(cell => !Screen.isScreen(cell) && !cell.isEmbedded() && !isLocked(cell)));
}

/** Select all the elements (a group for its members): as `selectAll()`, without the links */
export function selectElements(app: App): void {
    selectCells(app, app.graph.getCells()
        .filter(cell => cell.isElement() && !Screen.isScreen(cell) && !cell.isEmbedded() && !isLocked(cell)));
}

/** Select all the connections (the links: pipes, wires, conveyors, signal lines, arrows), as `selectAll()` */
export function selectConnections(app: App): void {
    selectCells(app, app.graph.getCells().filter(cell => cell.isLink() && !cell.isEmbedded()));
}

/** The cells of a type the selection has (see `selectSameType()`): not the groups, not the screen */
function typedCells(app: App): dia.Cell[] {
    return app.selection.toArray().filter(cell => !Group.isGroup(cell) && !Screen.isScreen(cell));
}

/**
 * The cells of the types of the selected cells, each at the level of a selected one of its type (the members of the
 * same group, or the cells out of any group): what `selectSameType()` selects
 */
export function sameTypeCells(app: App): dia.Cell[] {
    const levels = new Set(typedCells(app).map(cell => `${cell.get('type')}|${parentId(cell)}`));
    return app.graph.getCells().filter(cell => levels.has(`${cell.get('type')}|${parentId(cell)}`) && !isLocked(cell));
}

/** The types of the selected cells (see `selectSameType()`) */
export function selectedTypes(app: App): string[] {
    return [...new Set(typedCells(app).map(cell => String(cell.get('type'))))];
}

/** Select all the cells of the types of the selected ones (all the pumps, all the wires) */
export function selectSameType(app: App): void {
    const cells = sameTypeCells(app);
    if (cells.length > 0) selectCells(app, cells);
}

/** Add the cell to the selection, or remove it if it is selected (cherry-picking). */
export function toggleCell(app: App, cell: dia.Cell): void {
    const { selection } = app;
    if (selection.has(cell)) {
        selection.remove(cell);
    } else {
        selection.add(cell);
    }
}

export const parentId = (cell: dia.Cell) => cell.getParentCell()?.id ?? null;

/**
 * A click on a cell: the top group it is in, or one level further in when that group (or a group
 * in it, or the cell itself) is selected - the member of the selected group the cell is in; with
 * a member of a group selected, the cell (or its group) at the same level in that group.
 */
export function selectAtLevel(app: App, clicked: dia.Cell): void {
    const target = clickTarget(app, clicked);
    if (target) selectCell(app, target);
}

/**
 * What a click on the cell selects (see `selectAtLevel()`): its top group, or one level further in; `null`
 * if it is selected already (the frame on hover shows it, see `EditController`).
 */
export function clickTarget(app: App, clicked: dia.Cell): dia.Cell | null {
    const levels = withGroups(clicked);
    const [selected] = app.selection.length === 1 ? app.selection.toArray() : [];
    const index = selected ? levels.indexOf(selected) : -1;
    if (index === 0) return null;
    const target = index > 0
        ? levels[index - 1]
        // A sibling of the selected cell (another member of its group), else the top group
        : (selected && levels.find(level => parentId(level) === parentId(selected))) || topGroup(clicked);
    return app.selection.has(target) ? null : target;
}

/**
 * A click with Shift / Ctrl / Cmd: the cell of the level of the selection (a sibling of the selected cells:
 * the cell, or the group of it in the same group as them) toggled - not one of another level. A click
 * in the only selected group keeps it (it would leave nothing selected; `Escape` does that).
 */
export function toggleAtLevel(app: App, clicked: dia.Cell): void {
    const { selection } = app;
    if (selection.length === 0) {
        toggleCell(app, topGroup(clicked));
        return;
    }
    const level = parentId(selection.at(0));
    const sibling = withGroups(clicked).find(cell => parentId(cell) === level);
    if (!sibling) return;
    if (sibling !== clicked && selection.length === 1 && selection.has(sibling)) return;
    toggleCell(app, sibling);
}

/** Escape: the group of the selected member (one level up), or nothing selected */
export function selectUp(app: App): void {
    const [selected] = app.selection.length === 1 ? app.selection.toArray() : [];
    const parent = selected?.getParentCell();
    if (parent) {
        selectCell(app, parent);
    } else {
        clearSelection(app);
    }
}

export function clearSelection(app: App): void {
    app.selection.reset();
}

export function removeSelection(app: App): void {
    const { selection } = app;
    if (selection.length === 0) return;
    removeCells(app, selection.toArray());
}

/**
 * Remove the cells (one step of the history): a group they were in is fitted to the members left, and
 * dissolved if one is left only (see `dissolveLoneGroup()`).
 */
export function removeCells(app: App, cells: dia.Cell[]): void {
    const { graph } = app;
    const parents = new Set(cells.map(cell => cell.getParentCell()).filter((parent): parent is dia.Cell => Boolean(parent)));
    graph.startBatch('remove');
    graph.removeCells(cells);
    parents.forEach((parent) => {
        if (!parent.graph) return;
        if (!dissolveLoneGroup(parent)) fitGroups(parent, { recorded: true });
    });
    graph.stopBatch('remove');
}
