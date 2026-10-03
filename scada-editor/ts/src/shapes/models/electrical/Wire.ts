import { dia, util } from '@joint/plus';
import { Layer } from '../../../const';
import { followRouting, routingAttributes } from '../../common/routing';
import { type ColorField, LINE_COLOR_FIELD } from '../../common/Shape';

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

    // The color of its line (see `ColorField`)
    get colorField(): ColorField {
        return LINE_COLOR_FIELD;
    }

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'Wire',
            layer: Layer.Pipes,
            routing: 'orthogonal',
            ...routingAttributes('orthogonal'),
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
                    connection: true,
                    stroke: 'var(--shape-wire)',
                    strokeWidth: 3,
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

    initialize(...args: Parameters<dia.Link['initialize']>): void {
        super.initialize(...args);
        followRouting(this);
    }
}
