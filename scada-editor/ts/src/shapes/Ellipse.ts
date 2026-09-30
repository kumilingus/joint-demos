import { type dia, util } from '@joint/plus';
import { BACKGROUND_FILL, Layer } from '../const';
import type { Overflow } from './footprint';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <ellipse @selector='body' />
`;

/**
 * A ellipse of the background: under the plant (an area, a zone of the building, a highlight), in its color and
 * its opacity (see the inspector); resized and rotated freely. Nothing connects to it.
 */
export default class Ellipse extends Shape {

    get graphLayer(): Layer {
        return Layer.Background;
    }

    // No label
    get overflow(): Overflow {
        return { bottom: 0 };
    }

    get tagPrefix(): string {
        return 'BG';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Ellipse',
            size: {
                width: 160,
                height: 100
            },
            attrs: {
                body: {
                    cx: 'calc(0.5 * w)',
                    cy: 'calc(0.5 * h)',
                    rx: 'calc(0.5 * w)',
                    ry: 'calc(0.5 * h)',
                    fill: BACKGROUND_FILL,
                    fillOpacity: 0.3,
                    stroke: 'none'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
