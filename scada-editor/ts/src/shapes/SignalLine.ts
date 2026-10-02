import { dia, util } from '@joint/plus';
import { Layer } from '../const';
import { followRouting, routingAttributes } from './routing';
import { type ColorField, LINE_COLOR_FIELD } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='line' fill='none' />
`;

/** A signal line: an instrument (a transmitter) connected to what it measures or controls. */
export default class SignalLine extends dia.Link {

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
            ...routingAttributes('straight'),
            attrs: {
                // An invisible wide stroke that makes the thin line easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 20,
                    strokeLinecap: 'round'
                },
                line: {
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

    initialize(...args: Parameters<dia.Link['initialize']>): void {
        super.initialize(...args);
        followRouting(this);
    }
}
