import type { dia } from '@joint/plus';
import { V } from '@joint/plus';

/*
 * The images of the user (uploaded, see `CustomImage`) are stored on the graph: `graph.get('images')`
 * maps an image id to the image. The elements refer to an image by its id, so the image is saved
 * with the diagram once (`graph.toJSON()`), however many elements show it.
 *
 * An image is in the DOM once per paper too: it is defined in the `<defs>` of the paper
 * (a `<symbol>` of its natural size) and each element shows it with a `<use>` of its own size.
 */

/** An image of the user: a data URL, its natural size and its name (the name of the file). */
export interface ImageEntry {
    href: string;
    width: number;
    height: number;
    name: string;
}

export type ImageLibrary = Record<string, ImageEntry>;

/** The attribute of the graph with its images */
export const IMAGES_ATTRIBUTE = 'images';

/**
 * The paper option telling where the images of its elements are: the images of the diagram,
 * for the canvas and the palette papers alike (the graphs of the palette have no images).
 */
export interface ImagesPaperOptions {
    getImages?: () => ImageLibrary;
}

export function getImages(graph: dia.Graph): ImageLibrary {
    return graph.get(IMAGES_ATTRIBUTE) || {};
}

/** The image of the element, from its paper (see `ImagesPaperOptions`); `null` for a paper without images. */
export function findImage(elementView: dia.ElementView, imageId: string): ImageEntry | null {
    const options = elementView.paper!.options as ImagesPaperOptions;
    return options.getImages?.()[imageId] ?? null;
}

/** The ids of the definitions in each paper (by the image ids). */
const definitions = new WeakMap<dia.Paper, Map<string, string>>();

// The ids are unique in the document: every paper (the canvas, the palette, ...) has its own definitions.
let counter = 0;

/** The id of the definition of the image in the paper (defined now if it is not yet). */
export function defineImage(paper: dia.Paper, imageId: string, { href, width, height }: ImageEntry): string {
    let images = definitions.get(paper);
    if (!images) {
        images = new Map();
        definitions.set(paper, images);
    }
    let id = images.get(imageId);
    if (id) return id;
    id = `scada-image-${++counter}`;
    // Shown whole in the size of the element (its aspect ratio is kept by the resizing).
    V('symbol', { id, viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'xMidYMid meet' })
        .append(V('image', { href, width, height }))
        .appendTo(paper.defs);
    images.set(imageId, id);
    return id;
}

/** The placeholder of an image that is not in the diagram (e.g. a pasted element of another diagram) */
const PLACEHOLDER_ID = '';

/**
 * The id of the definition of the placeholder in the paper: a dashed frame with an icon of a missing image
 * (in the colors of the element label, see `styles.css`).
 */
export function definePlaceholder(paper: dia.Paper): string {
    let images = definitions.get(paper);
    if (!images) {
        images = new Map();
        definitions.set(paper, images);
    }
    let id = images.get(PLACEHOLDER_ID);
    if (id) return id;
    id = `scada-image-${++counter}`;
    V('symbol', { id, class: 'missing-image', viewBox: '0 0 48 48', preserveAspectRatio: 'xMidYMid meet' })
        .append([
            V('rect', { x: 1, y: 1, width: 46, height: 46, rx: 4, fill: 'none', strokeDasharray: '4 3' }),
            // An image crossed out
            V('path', { d: 'M 14 14 H 34 V 34 H 14 Z M 14 30 L 21 23 L 27 29 M 26 22 A 2 2 0 1 0 26.1 22 M 12 12 L 36 36', fill: 'none' })
        ])
        .appendTo(paper.defs);
    images.set(PLACEHOLDER_ID, id);
    return id;
}

/** A file name without its extension */
function baseName(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, '');
}

/** The image of a file (a data URL, its natural size and its name), or `null` if it's not an image. */
export function readImageFile(file: File): Promise<ImageEntry | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const href = reader.result as string;
            const img = new Image();
            img.onload = () => resolve({ href, width: img.naturalWidth, height: img.naturalHeight, name: baseName(file.name) });
            img.onerror = () => resolve(null);
            img.src = href;
        });
        reader.addEventListener('error', () => resolve(null));
        reader.readAsDataURL(file);
    });
}
