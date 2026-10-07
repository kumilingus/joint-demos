import { type dia, util } from '@joint/plus';
import { BACKGROUND_FILL, Layer } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
`;

/**
 * A rectangle of the background: under the plant (an area, a zone of the building, a highlight), in its color and
 * its opacity (see the inspector); resized and rotated freely. Nothing connects to it.
 */
export default class Rectangle extends Shape {

    get graphLayer(): Layer {
        return Layer.Background;
    }

    // No label
    get overflow(): Overflow {
        return { bottom: 0 };
    }

    get colorField(): ColorField {
        return { path: ['style', 'color'], part: ['body', 'fill'] };
    }

    // An outline of its own (a border of the area): none by default
    get outlineField(): ColorField {
        return { path: ['style', 'outline'], part: ['body', 'stroke'] };
    }

    get tagPrefix(): string {
        return 'BG';
    }

    // A background shape: an ID only when asked (it can stand for a part of the plant, see `Shape.autoTag`)
    get autoTag(): boolean {
        return false;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Rectangle',
            size: {
                width: 160,
                height: 100
            },
            attrs: {
                body: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'outline', fill: 'color', fillOpacity: 'opacity' },
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 8,
                    ry: 8,
                    fill: BACKGROUND_FILL,
                    fillOpacity: 0.3,
                    stroke: 'none',
                    strokeWidth: 2
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
