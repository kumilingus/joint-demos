import type { dia } from '@joint/plus';
import { util } from '@joint/plus';
import { GRID_SIZE } from '../../../const';
import { defineImage, definePlaceholder, findImage, type ImageEntry } from '../../../palette/images';
import { labelAttributes } from '../../attributes/label';
import Shape, { type Resizable } from '../../common/Shape';

// The largest default size of an uploaded image (it keeps its aspect ratio)
// The default size of an image: as much area as a square of this side (a wide image is wider, not smaller)...
const SIZE = 100;
// ...with its longer side at most this long
const MAX_SIDE = 240;

// The size changes in two steps of the grid (see `Shape`).
const SIZE_STEP = 2 * GRID_SIZE;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <use @selector='image' />
    <text @selector='label' />
`;

/**
 * A shape of the user: an uploaded image. It refers to the image by its id (its `imageId`):
 * the image is stored on the graph and in the DOM once per paper (see `images.ts`).
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
            // Its label (see `text-from`)
            label: { text: 'Image', position: 'bottom' },
            size: {
                width: SIZE,
                height: SIZE
            },
            attrs: {
                image: {
                    // The image of its `imageId`, its opacity of its style (see `image-ref` below, `style-color.ts`)
                    imageRef: true,
                    styleOpacity: 'opacity',
                    width: 'calc(w)',
                    height: 'calc(h)',
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
