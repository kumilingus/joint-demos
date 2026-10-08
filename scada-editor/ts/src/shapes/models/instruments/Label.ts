import { type dia, util } from '@joint/plus';
import { LABEL_COLOR, Layer } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../Shape';

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

    // A text: never a part of the plant - no ID (see `plant/tags.ts`)
    get tagPrefix(): string | null {
        return null;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Label',
            // Its label (see `from-model`)
            label: { text: 'Label', size: 20, weight: 600, align: 'middle' },
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
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'color' },
                    // The text of the label of the model (see `from-model`)
                    fromModel: { text: ['label', 'text'] },
                    // Its x, its anchor of the alignment of the label (see `from-model`); from the top: the lines added below
                    y: 0,
                    textVerticalAnchor: 'top',
                    // Its lines too (the new lines of the text kept)
                    textWrap: {
                        width: 'calc(w)',
                        height: 'calc(h)',
                        ellipsis: true
                    },
                    // Its size, its weight of the label (see `from-model`)
                    fontFamily: 'sans-serif',
                    fill: LABEL_COLOR
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    /** Whether the cell is a label */
    static isLabel(cell: unknown): cell is Label {
        return cell instanceof Label;
    }
}
