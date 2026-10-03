import { type dia, g, util } from '@joint/plus';
import type { App } from './app';
import { GRID_SIZE, Layer, Mode } from './const';
import { fitOptions, runtimeFitOptions } from './config';
import { getImages, IMAGES_ATTRIBUTE, type ImageEntry } from './images';
import { getScreen, isScreenShown } from './screen';
import Screen from './shapes/Screen';
import Join from './shapes/Join';
import Group, { isGroup } from './shapes/Group';
import { DERIVED } from './shapes/routing';
import { PIPE_HALF_WIDTH } from './shapes/footprint';
import { DerivedGroup, keysInUse, loadCustomShapes, loadDerivedGroup } from './stencil';
import { getFavorites, removeFavorite } from './favorites';

export function selectCell(app: App, cell: dia.Cell): void {
    app.selection.reset([cell]);
}

export function selectCells(app: App, cells: dia.Cell[]): void {
    app.selection.reset(cells);
}

/** Select all the cells: as a region selects them - not the screen, a group for its members (see `Group`) */
export function selectAll(app: App): void {
    selectCells(app, app.graph.getCells().filter(cell => !(cell instanceof Screen) && !cell.isEmbedded()));
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

/** The cell and its groups (see `Group`), from the cell up */
function withGroups(cell: dia.Cell): dia.Cell[] {
    return [cell, ...cell.getAncestors()];
}

const parentId = (cell: dia.Cell) => cell.getParentCell()?.id ?? null;

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
function removeCells(app: App, cells: dia.Cell[]): void {
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

export function undo(app: App): void {
    app.history.undo();
}

export function redo(app: App): void {
    app.history.redo();
}

/** A copy is pasted this far from the original (in two grid steps: the centers stay on the grid). */
const PASTE_OFFSET = { dx: 2 * GRID_SIZE, dy: 2 * GRID_SIZE };

/**
 * A copy of the pipe on its own: its ends are where they are now, but not connected
 * (the clipboard would copy the elements it is connected to with it).
 */
function detachedCopy(app: App, link: dia.Link): dia.Link {
    const copy = link.clone();
    const linkView = link.findView(app.paper) as dia.LinkView | undefined;
    copy.source(linkView ? linkView.sourcePoint.toJSON() : link.getSourcePoint().toJSON());
    copy.target(linkView ? linkView.targetPoint.toJSON() : link.getTargetPoint().toJSON());
    return copy;
}

/** Copy the selected cells: the elements (with the pipes between them), or a pipe on its own. */
export function copySelection(app: App): void {
    const { graph, clipboard } = app;
    // A diagram has one screen.
    const selection = app.selection.filter(cell => !(cell instanceof Screen));
    if (selection.length === 0) return;
    const elements = selection.filter(cell => cell.isElement());
    if (elements.length > 0) {
        // A group with its members (and the links between them)
        clipboard.copyElements(elements, graph, { deep: true });
    } else {
        // Free copies (not in the graph): nothing else is copied with them.
        clipboard.copyElements(selection.map(link => detachedCopy(app, link as dia.Link)), graph);
    }
}

/** Copy the selected cells and remove them (in one step of the history). */
export function cutSelection(app: App): void {
    const { selection, graph } = app;
    if (selection.length === 0) return;
    copySelection(app);
    graph.startBatch('cut');
    removeCells(app, selection.toArray());
    graph.stopBatch('cut');
}

/**
 * Paste the copied cells next to where they were copied from (each paste a step further)
 * and select them. The pasted elements get tags of their own (see `TagsController`).
 */
export function paste(app: App): void {
    const { graph, clipboard } = app;
    if (clipboard.length === 0) return;
    graph.startBatch('paste');
    const cells = clipboard.pasteCells(graph, { translate: PASTE_OFFSET });
    graph.stopBatch('paste');
    // A pasted group, not its members (see `Group`)
    selectCells(app, cells.filter(cell => !cell.isEmbedded()));
}

/**
 * Paste the copied cells centered at the point (of the canvas, snapped to the grid) and select them:
 * the paste of the context menu of the blank canvas (see `context-menu.ts`).
 */
export function pasteAt(app: App, point: dia.Point): void {
    const { graph, clipboard } = app;
    if (clipboard.length === 0) return;
    graph.startBatch('paste');
    const cells = clipboard.pasteCellsAtPoint(graph, new g.Point(point).snapToGrid(GRID_SIZE));
    graph.stopBatch('paste');
    // A pasted group, not its members (see `Group`)
    selectCells(app, cells.filter(cell => !cell.isEmbedded()));
}

/** The cells drawn: a group as its members (it has no z of its own to speak of, see `Group`) */
function drawnCells(cells: dia.Cell[]): dia.Cell[] {
    return cells.flatMap(cell => (isGroup(cell) ? cell.getEmbeddedCells({ deep: true }).filter(member => !isGroup(member)) : [cell]));
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
    const { graph } = app;
    const layers = Object.values(Layer);
    const cells = drawnCells(app.selection.toArray());
    let top = -1;
    cells.forEach((cell) => {
        const index = layers.indexOf(graph.getCellLayerId(cell) as Layer);
        overlapping(app, cell)
            .filter(other => !isGroup(other) && !(other instanceof Screen) && !cells.includes(other))
            .forEach((other) => {
                const otherIndex = layers.indexOf(graph.getCellLayerId(other) as Layer);
                if (otherIndex > index) top = Math.max(top, otherIndex);
            });
    });
    return top < 0 ? null : layers[top];
}

/**
 * The elements overlapping the cell: of an element its bounding box, of a link its connection (a part of it through
 * the element - as wide as a pipe: not its bounding box, much larger than what it covers), not its ends (it's connected
 * to them, not covered by them)
 */
function overlapping(app: App, cell: dia.Cell): dia.Element[] {
    const { graph, paper } = app;
    if (cell.isElement()) return graph.findElementsUnderElement(cell);
    const view = cell.findView(paper) as dia.LinkView | undefined;
    const connection = view?.getConnection();
    if (!connection) return [];
    // Curved too: the path as straight segments (of its polylines, one of each of its subpaths)
    const segments = (connection.toPolylines() ?? []).flatMap(({ points }) => points.slice(1).map((point, index) => new g.Line(points[index], point)));
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

/** Move the selected cells into the layer, to its front (over the elements there): one step of the history. */
export function moveToLayer(app: App, layer: Layer): void {
    const { graph } = app;
    // In their drawing order: kept over each other in the layer
    const cells = drawnCells(app.selection.toArray())
        .map(cell => ({ cell, order: drawingOrder(graph, cell) }))
        .sort((a, b) => (a.order[0] - b.order[0]) || (a.order[1] - b.order[1]))
        .map(({ cell }) => cell);
    if (cells.length === 0) return;
    graph.startBatch('to-layer');
    cells.forEach((cell) => {
        cell.set('layer', layer);
        cell.toFront();
    });
    graph.stopBatch('to-layer');
}

/** A link split at a point (see `splitLink()`, `insertJoin()`): its halves, not in the graph yet */
interface SplitLink {
    point: g.Point;
    first: dia.Link;
    second: dia.Link;
    /** The direction of the route at the point: from the first half to the second one */
    direction: g.Point;
}

/**
 * The link split at the point of its route nearest to the point (snapped to the grid) into two links with free
 * ends there: the first one from the source, the second one to the target, each with the vertices on its side.
 * The route is the rendered one (the link is under the pointer, its view rendered): the vertices before the point
 * along it go to the first half, the direction of the route there says from where the halves come.
 */
function splitAt(app: App, link: dia.Link, point: dia.Point): SplitLink {
    const view = link.findView(app.paper) as dia.LinkView;
    const length = view.getClosestPointLength(point);
    const split = view.getPointAtLength(length).snapToGrid(GRID_SIZE);
    const tangent = view.getTangentAtLength(length);
    const direction = tangent ? tangent.end.difference(tangent.start) : new g.Point(1, 0);
    const vertices = link.vertices();
    const isBefore = (vertex: dia.Point) => view.getClosestPointLength(vertex) < length;
    const first = link.clone();
    first.set({ target: split.toJSON(), vertices: vertices.filter(isBefore) });
    const second = link.clone();
    second.set({ source: split.toJSON(), vertices: vertices.filter(vertex => !isBefore(vertex)) });
    return { point: split, first, second, direction };
}

/** Split the link at the point into two links with free ends there: the first one selected, one step of the history. */
export function splitLink(app: App, link: dia.Link, point: dia.Point): void {
    const { graph } = app;
    const { first, second } = splitAt(app, link, point);
    graph.startBatch('split-link');
    link.remove();
    graph.addCells([first, second]);
    graph.stopBatch('split-link');
    selectCell(app, first);
}

/** The side of an element the direction points to (of the axis it goes along the most) */
function sideOf(direction: g.Point): 'left' | 'right' | 'top' | 'bottom' {
    if (Math.abs(direction.x) >= Math.abs(direction.y)) return direction.x < 0 ? 'left' : 'right';
    return direction.y < 0 ? 'top' : 'bottom';
}

/**
 * Insert a join into the pipe at the point: the pipe split there (see `splitAt()`), both halves connected
 * to the join centered at the point, each to the side it comes from along the route. The join selected
 * (a branch can be added to it), one step of the history.
 */
export function insertJoin(app: App, link: dia.Link, point: dia.Point): void {
    const { graph } = app;
    const { point: center, first, second, direction } = splitAt(app, link, point);
    const join = new Join();
    join.position(center.x - join.size().width / 2, center.y - join.size().height / 2);
    const end = (side: string) => ({
        id: join.id,
        anchor: { name: side, args: { useModelGeometry: true, rotate: true }},
        connectionPoint: { name: 'anchor' }
    });
    // The first half comes in against the direction of the route, the second one goes on in it.
    first.set({ target: end(sideOf(direction.clone().scale(-1, -1))) });
    second.set({ source: end(sideOf(direction)) });
    graph.startBatch('insert-join');
    link.remove();
    graph.addCells([join, first, second]);
    graph.stopBatch('insert-join');
    selectCell(app, join);
}

/** Where the cell is drawn: its layer (from the bottom one up, see `Layer`), then its place in the layer (by z) */
function drawingOrder(graph: dia.Graph, cell: dia.Cell): [number, number] {
    const layerId = graph.getCellLayerId(cell);
    return [Object.values(Layer).indexOf(layerId as Layer), graph.getLayer(layerId).cellCollection.toArray().indexOf(cell)];
}

/** Whether the cell is drawn below the other one */
function isDrawnBelow(graph: dia.Graph, cell: dia.Cell, other: dia.Cell): boolean {
    const [layer, index] = drawingOrder(graph, cell);
    const [otherLayer, otherIndex] = drawingOrder(graph, other);
    return layer < otherLayer || (layer === otherLayer && index < otherIndex);
}

/** The group the cell is in (the outermost one, see `Group`), or the cell itself */
export function topGroup(cell: dia.Cell): dia.Cell {
    const ancestors = cell.getAncestors();
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : cell;
}

/**
 * The element drawn for the cell at the point: the cell itself, or for a group the top one of its members
 * there (a group draws nothing); `null` if none of its members is there.
 */
function drawnAt(graph: dia.Graph, cell: dia.Cell, point: dia.Point): dia.Cell | null {
    if (!isGroup(cell)) return cell;
    const members = graph.findElementsAtPoint(point).filter(element => !isGroup(element) && element.isEmbeddedIn(cell, { deep: true }));
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
        .filter(element => element !== cell && !isGroup(element) && !(element instanceof Screen))
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
    const options = (recorded ? {} : { ...DERIVED }) as dia.Element.FitToChildrenOptions;
    withGroups(cell).filter(isGroup).forEach(group => group.fitEmbeds(options));
}

/**
 * A group with one element (or none) left is dissolved: its cells go to the group it is in (if any),
 * it is removed. `true` if it was.
 */
function dissolveLoneGroup(group: dia.Cell): boolean {
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

/** Add the uploaded images to the diagram (they are saved with it, shown in the palette; an undo removes them). */
export function addImages(app: App, images: ImageEntry[]): void {
    const { graph } = app;
    let library = getImages(graph);
    images.forEach((image) => {
        library = { ...library, [`image-${util.uuid()}`]: image };
    });
    graph.set(IMAGES_ATTRIBUTE, library);
}

const DIAGRAM_FILE_NAME = 'scada-diagram.json';

/**
 * Download the diagram as JSON: the cells, the images and the favorites. Not the layers:
 * they are those of the app (see `layers.ts`), a cell says in which one it is.
 * Without the attributes left empty (e.g. a gradient as the default one: the difference is an empty object).
 */
export function saveDiagram(app: App): void {
    const { layers: _layers, defaultLayer: _defaultLayer, ...diagram } = app.graph.toJSON({
        cellAttributes: { ignoreEmptyAttributes: () => true }
    });
    const json = JSON.stringify(diagram, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = DIAGRAM_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
}

/** Whether the diagram may be replaced (by a new one, a file, an example): asked first if it was changed */
export function confirmReplace(app: App, question: string): boolean {
    return !app.history.hasUndo() || window.confirm(`${question} The changes of the diagram will be lost.`);
}

/** A new diagram instead of this one: an empty screen; `false` if the user keeps this one */
export function newDiagram(app: App): boolean {
    if (!confirmReplace(app, 'Start a new diagram?')) return false;
    app.loadJSON({ cells: [new Screen().toJSON()] });
    return true;
}

/** Let the user pick a JSON file of a diagram and load it (asked first if the diagram was changed). */
export function openDiagram(app: App): void {
    if (!confirmReplace(app, 'Open a diagram?')) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async() => {
        const [file] = Array.from(input.files || []);
        if (!file) return;
        try {
            const json = JSON.parse(await file.text());
            if (!Array.isArray(json?.cells)) throw new Error('no cells');
            // Throws before anything changes if the file can't be loaded.
            app.loadJSON(json);
        } catch (error) {
            window.alert(`"${file.name}" is not a diagram (${(error as Error).message}).`);
        }
    });
    input.click();
}

/** The groups of the palette made of the diagram: the shapes in use (unless hidden, empty), the favorites, the images of the user. */
export function refreshPalette(app: App): void {
    const { stencil, graph } = app;
    if (!stencil) return;
    const images = getImages(graph);
    loadCustomShapes(stencil, images);
    loadDerivedGroup(stencil, DerivedGroup.InUse, app.inUseShown ? keysInUse(graph) : new Set(), images);
    loadDerivedGroup(stencil, DerivedGroup.Favorites, getFavorites(graph), images);
}

/**
 * Delete an image of the user: from the palette, and every element showing it from the diagram.
 * One step of the history (the images are a part of the diagram): an undo brings back both.
 */
export function deleteImage(app: App, imageId: string): void {
    const { graph } = app;
    const { [imageId]: image, ...rest } = getImages(graph);
    if (!image) return;
    clearSelection(app);
    // Not a favorite anymore (the favorites are not in the history: an undo doesn't make it one again)
    removeFavorite(graph, `CustomImage:${imageId}`);
    graph.startBatch('delete-image');
    // The elements first: an undo brings back the image before them (they are not rendered with the placeholder).
    graph.removeCells(graph.getElements().filter(element => element.attr('image/imageId') === imageId));
    graph.set(IMAGES_ATTRIBUTE, rest);
    graph.stopBatch('delete-image');
}

/** Show the whole diagram: on loading, entering the runtime mode (a wider canvas) and with the toolbar button. */
export function zoomToFit(app: App): void {
    // The runtime mode with a screen: the screen fills the canvas (see `screen.ts`).
    const screen = isScreenShown(app) ? getScreen(app.graph) : undefined;
    if (screen) {
        app.scroller.zoomToRect(screen.getBBox(), { padding: 0, minScale: 0.01, maxScale: 100 });
        return;
    }
    app.scroller.zoomToFit(app.mode === Mode.Runtime ? runtimeFitOptions : fitOptions);
}
