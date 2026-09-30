import { type dia, g, util } from '@joint/plus';
import type { App } from './app';
import { GRID_SIZE, Layer, Mode } from './const';
import { fitOptions, runtimeFitOptions } from './config';
import { getImages, IMAGES_ATTRIBUTE, type ImageEntry } from './images';
import { getScreen, isScreenShown } from './screen';
import Screen from './shapes/Screen';
import Join from './shapes/Join';
import { DerivedGroup, keysInUse, loadCustomShapes, loadDerivedGroup } from './stencil';
import { getFavorites, removeFavorite } from './favorites';

export function selectCell(app: App, cell: dia.Cell): void {
    app.selection.reset([cell]);
}

export function selectCells(app: App, cells: dia.Cell[]): void {
    app.selection.reset(cells);
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

export function clearSelection(app: App): void {
    app.selection.reset();
}

export function removeSelection(app: App): void {
    const { selection, graph } = app;
    if (selection.length === 0) return;
    graph.removeCells(selection.toArray());
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
        clipboard.copyElements(elements, graph);
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
    graph.removeCells(selection.toArray());
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
    selectCells(app, cells);
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
    selectCells(app, cells);
}

/**
 * Bring the selected cells to the front of their layers (over the others of the layer, never over
 * a layer above it, see `layers.ts`), in their order: one step of the history.
 */
export function bringToFront(app: App): void {
    const { graph } = app;
    const cells = util.sortBy(app.selection.toArray(), cell => cell.z());
    if (cells.length === 0) return;
    graph.startBatch('to-front');
    cells.forEach(cell => cell.toFront());
    graph.stopBatch('to-front');
}

/** Send the selected cells to the back of their layers, in their order: one step of the history. */
export function sendToBack(app: App): void {
    const { graph } = app;
    const cells = util.sortBy(app.selection.toArray(), cell => -cell.z());
    if (cells.length === 0) return;
    graph.startBatch('to-back');
    cells.forEach(cell => cell.toBack());
    graph.stopBatch('to-back');
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
        anchor: { name: side, args: { useModelGeometry: true }},
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

/**
 * The cell the context menu at the point is for: the clicked one, or the selected element under it there
 * (selected with the menu, see `elementBelow()`) - the next menu goes on down from it.
 */
export function menuCell(app: App, clicked: dia.Cell, point: dia.Point): dia.Cell {
    const { graph, selection } = app;
    const [selected] = selection.length === 1 ? selection.toArray() : [];
    if (!selected || selected === clicked || !selected.isElement()) return clicked;
    const atPoint = graph.findElementsAtPoint(point).includes(selected as dia.Element);
    return atPoint && isDrawnBelow(graph, selected, clicked) ? selected : clicked;
}

/**
 * The element under the cell at the point: of the elements there drawn below it, the top one
 * (a panel of the background under the instruments, ...); `null` if there is none. Not the screen
 * (a frame edited in the settings, see `settings.ts`).
 */
export function elementBelow(app: App, cell: dia.Cell, point: dia.Point): dia.Element | null {
    const { graph } = app;
    const below = graph.findElementsAtPoint(point)
        .filter(element => element !== cell && !(element instanceof Screen) && isDrawnBelow(graph, element, cell))
        .map(element => ({ element, order: drawingOrder(graph, element) }));
    if (below.length === 0) return null;
    below.sort((a, b) => (b.order[0] - a.order[0]) || (b.order[1] - a.order[1]));
    return below[0].element;
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

/** Let the user pick a JSON file of a diagram and load it. */
export function openDiagram(app: App): void {
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

/** The groups of the palette made of the diagram: the shapes in use, the favorites, the images of the user. */
export function refreshPalette(app: App): void {
    const { stencil, graph } = app;
    if (!stencil) return;
    const images = getImages(graph);
    loadCustomShapes(stencil, images);
    loadDerivedGroup(stencil, DerivedGroup.InUse, keysInUse(graph), images);
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
