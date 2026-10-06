import { util } from '@joint/plus';
import type { App } from '../app';
import { getImages, IMAGES_ATTRIBUTE, type ImageEntry } from '../palette/images';
import { DerivedGroup, keysInUse, loadCustomShapes, loadDerivedGroup } from '../palette/stencil';
import { getFavorites, removeFavorite } from '../palette/favorites';
import { clearSelection } from './selection';

/*
 * The groups of the palette made of the diagram (the shapes in use, the favorites) and the images of the user.
 */

/** Add the uploaded images to the diagram (they are saved with it, shown in the palette; an undo removes them). */
export function addImages(app: App, images: ImageEntry[]): void {
    const { graph } = app;
    let library = getImages(graph);
    images.forEach((image) => {
        library = { ...library, [`image-${util.uuid()}`]: image };
    });
    graph.set(IMAGES_ATTRIBUTE, library);
}

/** The groups of the palette made of the diagram: the shapes in use (unless hidden, empty), the favorites, the images of the user. */
export function refreshPalette(app: App): void {
    const { stencil, graph } = app;
    if (!stencil) return;
    const images = getImages(graph);
    loadCustomShapes(stencil, images);
    loadDerivedGroup(stencil, DerivedGroup.InUse, app.inUseShown ? keysInUse(graph) : new Set(), images);
    refreshFavorites(app);
}

/** The favorites group of the palette (the favorites changed) */
export function refreshFavorites(app: App): void {
    const { stencil, graph } = app;
    if (!stencil) return;
    loadDerivedGroup(stencil, DerivedGroup.Favorites, getFavorites(graph), getImages(graph));
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
    graph.removeCells(graph.getElements().filter(element => element.get('imageId') === imageId));
    graph.set(IMAGES_ATTRIBUTE, rest);
    graph.stopBatch('delete-image');
}
