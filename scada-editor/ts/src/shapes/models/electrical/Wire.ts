import { dia, util } from '@joint/plus';
import { Layer } from '../../../const';
import { type ColorField, LINE_COLOR_FIELD } from '../../common/Shape';
import { lineWidthAttributes, type StrokeWidths } from '../../common/line-width';
import { fromStyleAttributes } from '../../attributes/from-style';

// The width of its line (normal, see `lineWidth`)
const STROKE_WIDTHS: StrokeWidths = { line: 3 };

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='line' fill='none' />
`;

/**
 * A wire: connects the terminals of the electrical shapes (see `terminalPorts()`).
 * In the runtime mode it shows whether it is live (see `electrical.ts`).
 */
export default class Wire extends dia.Link {

    // Its color and its thickness (see `style.ts`)
    static attributes: typeof dia.Link.attributes = { ...fromStyleAttributes, ...lineWidthAttributes };

    // The color of its line (see `ColorField`)
    get colorField(): ColorField {
        return LINE_COLOR_FIELD;
    }

    // Thin, normal or thick (see `line-width.ts`)
    get strokeWidths(): StrokeWidths {
        return STROKE_WIDTHS;
    }

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'Wire',
            layer: Layer.Pipes,
            routing: 'orthogonal',
            attrs: {
                // An invisible wide stroke that makes the thin line easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 20,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                line: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'color' },
                    connection: true,
                    stroke: 'var(--shape-wire)',
                    strokeWidthBase: STROKE_WIDTHS.line,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    pointerEvents: 'none'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
