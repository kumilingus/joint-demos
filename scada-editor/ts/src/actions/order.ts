import { type dia, g, util } from '@joint/plus';
import type { App } from '../app';
import { Layer } from '../const';
import Screen from '../shapes/models/diagram/Screen';
import Group from '../shapes/models/diagram/Group';
import { PIPE_HALF_WIDTH } from '../shapes/common/footprint';
import { withGroups, topGroup } from './groups';

/*
 * The order of the drawing: to the front or the back of a layer, into the layer of what covers the cells (or what
 * they cover); the cell under another one at a point.
 */

/** The cells drawn: a group as its members (it has no z of its own to speak of, see `Group`) */
function drawnCells(cells: dia.Cell[]): dia.Cell[] {
    return cells.flatMap((cell) => {
        return Group.isGroup(cell) ? cell.getEmbeddedCells({ deep: true }).filter(member => !Group.isGroup(member)) : [cell];
    });
}

/**
 * Bring the selected cells to the front of their layers (over the others of the layer, never over
 * a layer above it, see `layers.ts`), in their order: one step of the history.
 */
export function bringToFront(app: App): void {
    const { graph } = app;
    const cells = util.sortBy(drawnCells(app.selection.toArray()), cell => cell.z());
    if (cells.length === 0) return;
    graph.startBatch('to-front');
    cells.forEach(cell => cell.toFront());
    graph.stopBatch('to-front');
}

/** Send the selected cells to the back of their layers, in their order: one step of the history. */
export function sendToBack(app: App): void {
    const { graph } = app;
    const cells = util.sortBy(drawnCells(app.selection.toArray()), cell => -cell.z());
    if (cells.length === 0) return;
    graph.startBatch('to-back');
    cells.forEach(cell => cell.toBack());
    graph.stopBatch('to-back');
}

/**
 * The layer of the elements over the selected ones: overlapping them, in a layer above (which `bringToFront()` can't
 * bring them over) - the top one of those layers, `null` if nothing of a layer above overlaps them
 */
export function layerOver(app: App): Layer | null {
    return farthestLayer(app, 1);
}

/** The layer of the elements under the selected ones (see `layerOver()`, `sendToBack()`): the bottom one of those layers */
export function layerUnder(app: App): Layer | null {
    return farthestLayer(app, -1);
}

/** Of the layers of the elements overlapping the selected cells, the farthest one up (1) or down (-1) from theirs */
function farthestLayer(app: App, direction: 1 | -1): Layer | null {
    const { graph } = app;
    const layers = Object.values(Layer);
    const indexOf = (cell: dia.Cell) => layers.indexOf(graph.getCellLayerId(cell) as Layer);
    const cells = drawnCells(app.selection.toArray());
    const beyond = cells.flatMap(cell => overlapping(app, cell)
        .filter(other => !Group.isGroup(other) && !Screen.isScreen(other) && !cells.includes(other))
        .map(indexOf)
        .filter(index => (index - indexOf(cell)) * direction > 0));
    if (beyond.length === 0) return null;
    return layers[direction > 0 ? Math.max(...beyond) : Math.min(...beyond)];
}

/**
 * The elements overlapping the cell: of an element its bounding box, of a link its connection (a part of it through
 * the element - as wide as a pipe: not its bounding box, much larger than what it covers), not its ends (it's connected
 * to them, not covered by them)
 */
function overlapping(app: App, cell: dia.Cell): dia.Element[] {
    const { graph, paper } = app;
    if (cell.isElement()) return graph.findElementsUnderElement(cell);
    const view = paper.requireView<dia.LinkView>(cell);
    const connection = view?.getConnection();
    if (!connection) return [];
    // Curved too: the path as straight segments (of its polylines, one of each of its subpaths)
    const segments = (connection.toPolylines() ?? []).flatMap(({ points }) => {
        return points.slice(1).map((point, index) => new g.Line(points[index], point));
    });
    const link = cell as dia.Link;
    const ends = [link.getSourceElement(), link.getTargetElement()];
    // The area of the connection as drawn (a curve reaches out of the bounding box of the link)
    const area = connection.bbox();
    if (!area) return [];
    return graph.findElementsInArea(area.inflate(PIPE_HALF_WIDTH)).filter((element) => {
        if (ends.includes(element)) return false;
        const box = element.getBBox().inflate(PIPE_HALF_WIDTH);
        return segments.some(segment => box.containsPoint(segment.start) || segment.intersect(box) !== null);
    });
}

/**
 * Move the selected cells into the layer, to its front (over the elements there) or to its `back` (under them):
 * one step of the history.
 */
export function moveToLayer(app: App, layer: Layer, { back = false } = {}): void {
    const { graph } = app;
    // In their drawing order (to the back the top one first): kept over each other in the layer
    const cells = drawnCells(app.selection.toArray())
        .map(cell => ({ cell, order: drawingOrder(graph, cell) }))
        .sort((a, b) => ((a.order[0] - b.order[0]) || (a.order[1] - b.order[1])) * (back ? -1 : 1))
        .map(({ cell }) => cell);
    if (cells.length === 0) return;
    graph.startBatch('to-layer');
    cells.forEach((cell) => {
        cell.set('layer', layer);
        if (back) {
            cell.toBack();
        } else {
            cell.toFront();
        }
    });
    graph.stopBatch('to-layer');
}

/** Where the cell is drawn: its layer (from the bottom one up, see `Layer`), then its place in the layer (by z) */
export function drawingOrder(graph: dia.Graph, cell: dia.Cell): [number, number] {
    const layerId = graph.getCellLayerId(cell);
    return [Object.values(Layer).indexOf(layerId as Layer), graph.getLayer(layerId).cellCollection.toArray().indexOf(cell)];
}

/** Whether the cell is drawn below the other one */
function isDrawnBelow(graph: dia.Graph, cell: dia.Cell, other: dia.Cell): boolean {
    const [layer, index] = drawingOrder(graph, cell);
    const [otherLayer, otherIndex] = drawingOrder(graph, other);
    return layer < otherLayer || (layer === otherLayer && index < otherIndex);
}

/**
 * The element drawn for the cell at the point: the cell itself, or for a group the top one of its members
 * there (a group draws nothing); `null` if none of its members is there.
 */
function drawnAt(graph: dia.Graph, cell: dia.Cell, point: dia.Point): dia.Cell | null {
    if (!Group.isGroup(cell)) return cell;
    const members = graph.findElementsAtPoint(point)
        .filter(element => !Group.isGroup(element) && element.isEmbeddedIn(cell, { deep: true }));
    if (members.length === 0) return null;
    return members.reduce((top, member) => (isDrawnBelow(graph, top, member) ? member : top));
}

/**
 * The cell the context menu at the point is for: the clicked one (its group), or the selected element
 * under it there (selected with the menu, see `elementBelow()`) - the next menu goes on down from it.
 */
export function menuCell(app: App, clicked: dia.Cell, point: dia.Point): dia.Cell {
    const { graph, selection } = app;
    // The selected one of the clicked cell and its groups, else the top group
    const cell = withGroups(clicked).find(level => selection.has(level)) ?? topGroup(clicked);
    const [selected] = selection.length === 1 ? selection.toArray() : [];
    if (!selected || selected === cell || !selected.isElement()) return cell;
    const drawn = drawnAt(graph, selected, point);
    const atPoint = drawn !== null && graph.findElementsAtPoint(point).includes(drawn as dia.Element);
    return atPoint && isDrawnBelow(graph, drawn, clicked) ? selected : cell;
}

/**
 * The element under the cell at the point: of the elements there drawn below it, the top one
 * (a panel of the background under the instruments, ...); `null` if there is none. Never a member of
 * a group: of the cell's own group skipped, of another one that group - not a group the cell is in itself
 * (a member: its sibling below it, see `levelBelow()`). Not the screen (a frame edited in the settings, see `settings.ts`).
 */
export function elementBelow(app: App, cell: dia.Cell, point: dia.Point): dia.Element | null {
    const { graph } = app;
    const reference = drawnAt(graph, cell, point) ?? cell;
    const below = graph.findElementsAtPoint(point)
        .filter(element => element !== cell && !Group.isGroup(element) && !Screen.isScreen(element))
        .filter(element => !element.isEmbeddedIn(cell, { deep: true }) && isDrawnBelow(graph, element, reference))
        .map(element => ({ element, order: drawingOrder(graph, element) }));
    if (below.length === 0) return null;
    below.sort((a, b) => (b.order[0] - a.order[0]) || (b.order[1] - a.order[1]));
    return levelBelow(below[0].element, cell) as dia.Element;
}

/** The element as seen from the cell: its top group that the cell is not in (the element itself if none) */
function levelBelow(element: dia.Element, cell: dia.Cell): dia.Cell {
    const groupsOfCell = new Set(cell.getAncestors());
    const levels = withGroups(element).filter(level => !groupsOfCell.has(level));
    return levels[levels.length - 1];
}
