import type { dia } from '@joint/plus';
import { util, V } from '@joint/plus';
import { GRID_SIZE } from '../../../const';
import type { ImageEntry, ImagesPaperOptions } from '../../../palette/images';
import { labelAttributes } from '../../attributes/label';
import Shape, { type Resizable } from '../../common/Shape';

// The largest default size of an uploaded image (it keeps its aspect ratio)
// The default size of an image: as much area as a square of this side (a wide image is wider, not smaller)...
const SIZE = 100;
// ...with its longer side at most this long
const MAX_SIDE = 240;

// The size changes in two steps of the grid (see `Shape`).
const SIZE_STEP = 2 * GRID_SIZE;

/*
 * An image is in the DOM once per paper: it is defined in the `<defs>` of the paper (a `<symbol>` of its natural
 * size) and each element shows it with a `<use>` of its own size.
 */

/** The image of the element, from its paper (see `ImagesPaperOptions`); `null` for a paper without images. */
function findImage(elementView: dia.ElementView, imageId: string): ImageEntry | null {
    const options = elementView.paper!.options as ImagesPaperOptions;
    return options.getImages?.()[imageId] ?? null;
}

/** The ids of the definitions in each paper (by the image ids). */
const definitions = new WeakMap<dia.Paper, Map<string, string>>();

// The ids are unique in the document: every paper (the canvas, the palette, ...) has its own definitions.
let counter = 0;

/** The id of the definition of the image in the paper (defined now if it is not yet). */
function defineImage(paper: dia.Paper, imageId: string, { href, width, height }: ImageEntry): string {
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
 * (in the colors of the element label, see `palette.css`).
 */
function definePlaceholder(paper: dia.Paper): string {
    let images = definitions.get(paper);
    if (!images) {
        images = new Map();
        definitions.set(paper, images);
    }
    let id = images.get(PLACEHOLDER_ID);
    if (id) return id;
    id = `scada-image-${++counter}`;
    V('symbol', { id, class: 'scada-missing-image', viewBox: '0 0 48 48', preserveAspectRatio: 'xMidYMid meet' })
        .append([
            V('rect', { x: 1, y: 1, width: 46, height: 46, rx: 4, fill: 'none', strokeDasharray: '4 3' }),
            // An image crossed out
            V('path', { d: 'M 14 14 H 34 V 34 H 14 Z M 14 30 L 21 23 L 27 29 M 26 22 A 2 2 0 1 0 26.1 22 M 12 12 L 36 36', fill: 'none' })
        ])
        .appendTo(paper.defs);
    images.set(PLACEHOLDER_ID, id);
    return id;
}

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <use @selector='image' />
    <text @selector='label' />
`;

/**
 * A shape of the user: an uploaded image. It refers to the image by its id (its `imageId`):
 * the image is stored on the graph (see `images.ts`) and in the DOM once per paper (see `defineImage()`).
 */
export default class CustomImage extends Shape {

    // Resized freely: the image keeps its aspect ratio in any size (centered, see `defineImage()`).
    // The smallest size is a step (not a part of the default size: an image can be dropped narrower).
    get resizable(): Resizable {
        return { minWidth: SIZE_STEP, minHeight: SIZE_STEP };
    }

    get tagPrefix(): string {
        return 'IMG';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'CustomImage',
            // Its label (see `from-model`)
            label: { text: 'Image', position: 'bottom' },
            size: {
                width: SIZE,
                height: SIZE
            },
            attrs: {
                image: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { opacity: 'opacity' },
                    // The image of its `imageId`, its opacity of its style (see `image-ref` below, `from-style.ts`)
                    imageRef: true,
                    width: 'calc(w)',
                    height: 'calc(h)'
                },
                label: {
                    ...labelAttributes
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    /** The shape of an image: in its aspect ratio, as much area as the default size (see `SIZE`), in the steps of the size. */
    static fromImage(imageId: string, image: ImageEntry): CustomImage {
        const areaScale = SIZE / Math.sqrt(image.width * image.height);
        const scale = Math.min(areaScale, MAX_SIDE / Math.max(image.width, image.height));
        const step = (value: number) => Math.max(SIZE_STEP, Math.round(value * scale / SIZE_STEP) * SIZE_STEP);
        return new CustomImage({
            size: { width: step(image.width), height: step(image.height) },
            label: { text: image.name },
            imageId
        });
    }

    static attributes = {
        ...Shape.attributes,
        // The image (`imageId` of the model) shown by the `<use>` (`imageRef: true` on it): a reference to its
        // definition in the paper
        'image-ref': {
            set(this: dia.ElementView, _ref: boolean, _refBBox: unknown, _node: unknown, _attrs: unknown, elementView: dia.ElementView) {
                const { paper } = elementView;
                const imageId = String(this.model.get('imageId') ?? '');
                if (!paper) return {};
                const image = imageId ? findImage(elementView, imageId) : null;
                // An image that is not in the diagram (an element pasted from another one): a placeholder
                if (!image) return { href: `#${definePlaceholder(paper)}` };
                return { href: `#${defineImage(paper, imageId, image)}` };
            },
            unset: 'href'
        }
    };
}
