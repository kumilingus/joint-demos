import type { dia } from '@joint/plus';

/*
 * The images of the user (uploaded, see `CustomImage`) are stored on the graph: `graph.get('images')`
 * maps an image id to the image. The elements refer to an image by its id, so the image is saved
 * with the diagram once (`graph.toJSON()`), however many elements show it (see `CustomImage`).
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

/** A file name without its extension */
function baseName(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, '');
}

/** The image of a file (a data URL, its natural size and its name), or `null` if it's not an image. */
export function readImageFile(file: File): Promise<ImageEntry | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const href = reader.result;
            // Read as a data URL: a string
            if (typeof href !== 'string') {
                resolve(null);
                return;
            }
            const img = new Image();
            img.onload = () => resolve({ href, width: img.naturalWidth, height: img.naturalHeight, name: baseName(file.name) });
            img.onerror = () => resolve(null);
            img.src = href;
        });
        reader.addEventListener('error', () => resolve(null));
        reader.readAsDataURL(file);
    });
}
