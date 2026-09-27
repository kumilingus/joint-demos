import { type dia, util } from '@joint/plus';
import type { App } from './app';
import { GRID_SIZE, Mode } from './const';
import { fitOptions, runtimeFitOptions } from './config';
import { getImages, IMAGES_ATTRIBUTE, type ImageEntry } from './images';
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

/** Move the other selected cells with the one moved by the user (by the same amount). */
export function moveSelectionWith(app: App, cell: dia.Cell, dx: number, dy: number): void {
    const { selection } = app;
    if (!selection.has(cell)) return;
    selection.each((other) => {
        if (other === cell) return;
        // A pipe between the selected elements moves with them (its vertices).
        (other as dia.Element | dia.Link).translate(dx, dy, { selectionMove: true });
    });
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
    const { selection, graph, clipboard } = app;
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
 */
export function saveDiagram(app: App): void {
    const { layers: _layers, defaultLayer: _defaultLayer, ...diagram } = app.graph.toJSON();
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
    graph.removeCells(graph.getElements().filter(element => element.attr('image/imageId') === imageId));
    graph.set(IMAGES_ATTRIBUTE, rest);
    graph.stopBatch('delete-image');
}

/** Show the whole diagram: on loading, entering the runtime mode (a wider canvas) and with the toolbar button. */
export function zoomToFit(app: App): void {
    app.scroller.zoomToFit(app.mode === Mode.Runtime ? runtimeFitOptions : fitOptions);
}
