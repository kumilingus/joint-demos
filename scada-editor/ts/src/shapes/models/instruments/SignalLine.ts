import { dia, util } from '@joint/plus';
import { Layer } from '../../../const';
import { type ColorField, LINE_COLOR_FIELD } from '../../common/Shape';
import { fromStyleAttributes } from '../../attributes/from-style';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='line' fill='none' />
`;

/** A signal line: an instrument (a transmitter) connected to what it measures or controls. */
export default class SignalLine extends dia.Link {

    // Its color (see `style.ts`)
    static attributes: typeof dia.Link.attributes = { ...fromStyleAttributes };

    // The color of its line (see `ColorField`)
    get colorField(): ColorField {
        return LINE_COLOR_FIELD;
    }

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'SignalLine',
            layer: Layer.Instruments,
            routing: 'straight',
            attrs: {
                // An invisible wide stroke that makes the thin line easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 20,
                    strokeLinecap: 'round'
                },
                line: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'color' },
                    connection: true,
                    stroke: 'var(--shape-signal-line)',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 3',
                    pointerEvents: 'none'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    /** Whether the cell is a signal line */
    static isSignalLine(cell: unknown): cell is SignalLine {
        return cell instanceof SignalLine;
    }
}
