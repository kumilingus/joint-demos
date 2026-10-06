import { type dia } from '@joint/plus';
import type { App } from '../app';
import Screen from '../shapes/models/diagram/Screen';
import Group, { isGroup } from '../shapes/models/diagram/Group';
import { selectCell, selectCells, parentId } from './selection';
import { DERIVED } from '../history';

/*
 * The groups of elements (see `Group`): grouping, ungrouping, fitting, the group a cell is in.
 */

/** The cell and its groups (see `Group`), from the cell up */
export function withGroups(cell: dia.Cell): dia.Cell[] {
    return [cell, ...cell.getAncestors()];
}

/** The group the cell is in (the outermost one, see `Group`), or the cell itself */
export function topGroup(cell: dia.Cell): dia.Cell {
    const ancestors = cell.getAncestors();
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : cell;
}

/** The elements of the selection that can be grouped (not the screen; the siblings, see `toggleAtLevel()`) */
export function groupable(app: App): dia.Element[] {
    const elements = app.selection.filter(cell => cell.isElement() && !(cell instanceof Screen)) as dia.Element[];
    const level = elements.length > 0 ? parentId(elements[0]) : null;
    return elements.filter(element => parentId(element) === level);
}

/**
 * Fit the group of the cell and the groups above it to their members: derived (not in the history) by default,
 * `recorded` in a step of the history that changes the members (an undo of it gets the size back).
 */
export function fitGroups(cell: dia.Cell, { recorded = false } = {}): void {
    const options = (recorded ? {} : { ...DERIVED });
    withGroups(cell).filter(isGroup).forEach(group => group.fitEmbeds(options));
}

/**
 * A group with one element (or none) left is dissolved: its cells go to the group it is in (if any),
 * it is removed. `true` if it was.
 */
export function dissolveLoneGroup(group: dia.Cell): boolean {
    if (!isGroup(group) || group.getEmbeddedCells().filter(cell => cell.isElement()).length > 1) return false;
    const parent = group.getParentCell();
    const embeds = group.getEmbeddedCells();
    group.unembed(embeds);
    if (parent) parent.embed(embeds);
    group.remove();
    if (parent) fitGroups(parent, { recorded: true });
    return true;
}

/**
 * Group the selected elements (2 at least): they are embedded in a new group (see `Group`) with the links
 * between them (moved with it, their vertices too), the group fitted around them and selected.
 * A selected group nests in the new one. One step of the history.
 */
export function groupSelection(app: App): void {
    const { graph } = app;
    const elements = groupable(app);
    if (elements.length < 2) return;
    const members = new Set<dia.Cell>(elements.flatMap(element => [element, ...element.getEmbeddedCells({ deep: true })]));
    // The group they are in (the new group goes in it)
    const parent = elements[0].getParentCell();
    const links = graph.getLinks().filter((link) => {
        const [source, target] = [link.getSourceCell(), link.getTargetCell()];
        return parentId(link) === (parent?.id ?? null) && source && target && members.has(source) && members.has(target);
    });
    graph.startBatch('group');
    if (parent) parent.unembed([...elements, ...links]);
    const group = new Group();
    graph.addCell(group);
    group.embed([...elements, ...links]);
    group.fitEmbeds();
    if (parent) {
        parent.embed(group);
        // All of its members grouped: the new group in its place
        dissolveLoneGroup(parent);
    }
    graph.stopBatch('group');
    selectCell(app, group);
}

/** Ungroup the selected group: its members free again (and selected), the group removed. One step of the history. */
export function ungroupSelection(app: App): void {
    const { graph } = app;
    const [group] = app.selection.toArray();
    if (app.selection.length !== 1 || !isGroup(group)) return;
    const embeds = group.getEmbeddedCells();
    // The members go to the group it is in (if any).
    const parent = group.getParentCell();
    graph.startBatch('ungroup');
    group.unembed(embeds);
    if (parent) parent.embed(embeds);
    group.remove();
    graph.stopBatch('ungroup');
    selectCells(app, embeds.filter(cell => cell.isElement()));
}
