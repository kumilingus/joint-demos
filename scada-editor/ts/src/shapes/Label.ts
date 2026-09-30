import { type dia, util } from '@joint/plus';
import { LABEL_COLOR, Layer } from '../const';
import type { Overflow } from './footprint';
import Shape from './Shape';

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

    get tagPrefix(): string {
        return 'TXT';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Label',
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
                    text: 'Label',
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    textWrap: {
                        width: 'calc(w)',
                        height: 'calc(h)',
                        ellipsis: true
                    },
                    fontSize: 20,
                    fontFamily: 'sans-serif',
                    fontWeight: 600,
                    fill: LABEL_COLOR
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
