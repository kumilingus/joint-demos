import { type dia, util } from '@joint/plus';
import { LABEL_COLOR, Layer } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <text @selector='label' />
`;

/** A text on the canvas (a name of an area, a note), wrapped in its box. Nothing connects to it. */
export default class Label extends Shape {

    get overflow(): Overflow {
        return { bottom: 0 };
    }

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    // The color of the text
    get colorField(): ColorField {
        return { path: ['style', 'color'], part: ['label', 'fill'] };
    }

    get tagPrefix(): string {
        return 'TXT';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Label',
            // Its label (see `text-from`)
            label: { text: 'Label', size: 20, weight: 600 },
            size: {
                width: 120,
                height: 40
            },
            attrs: {
                // The box of the text: it can be grabbed anywhere in it.
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: 'transparent'
                },
                label: {
                    // The text of the label of the model (see `text-from`)
                    textFrom: ['label', 'text'],
                    // In the color of its style (see `style-color.ts`)
                    styleFill: 'color',
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    textWrap: {
                        width: 'calc(w)',
                        height: 'calc(h)',
                        ellipsis: true
                    },
                    // Its size, its weight of the label (see `text-from`)
                    fontFamily: 'sans-serif',
                    fill: LABEL_COLOR
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
