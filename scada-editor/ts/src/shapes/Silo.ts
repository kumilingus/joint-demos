import { type dia, util } from '@joint/plus';
import { labelAttributes } from './attributes/label';
import type { Overflow } from './footprint';
import Shape from './Shape';

// The body of the silo between the roof and the hopper (relative heights)
const BODY_TOP = 0.1;
const BODY_BOTTOM = 0.72;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <path @selector='hopper' />
    <rect @selector='outlet' />
    <rect @selector='body' />
    <path @selector='ribs' />
    <path @selector='roof' />
    <text @selector='label' />
`;

/** A silo for bulk solids: a conical roof, a cylindrical body and a hopper on legs. */
export default class Silo extends Shape {

    get overflow(): Overflow {
        return { right: 4, bottom: 34, left: 4 };
    }

    get tagPrefix(): string {
        return 'SL';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Silo',
            size: {
                width: 100,
                height: 220
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    d: `M 8 calc(${BODY_BOTTOM} * h) V calc(h + 8) M calc(w - 8) calc(${BODY_BOTTOM} * h) V calc(h + 8)`,
                    stroke: 'var(--shape-legs)',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                hopper: {
                    d: `M 0 calc(${BODY_BOTTOM} * h) H calc(w) L calc(0.6 * w) calc(h - 8) H calc(0.4 * w) Z`,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cone'
                },
                outlet: {
                    x: 'calc(0.42 * w)',
                    y: 'calc(h - 10)',
                    width: 'calc(0.16 * w)',
                    height: 12,
                    surfaceFill: 'mid',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1.5
                },
                body: {
                    y: `calc(${BODY_TOP} * h)`,
                    width: 'calc(w)',
                    height: `calc(${BODY_BOTTOM - BODY_TOP} * h)`,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'cylinder'
                },
                // The ribs of the corrugated sheets
                ribs: {
                    d: [0.25, 0.4, 0.55].map(y => `M 0 calc(${y} * h) H calc(w)`).join(' '),
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.5,
                    strokeWidth: 1.5
                },
                roof: {
                    d: `M -4 calc(${BODY_TOP} * h) L calc(0.5 * w) 0 L calc(w + 4) calc(${BODY_TOP} * h) Z`,
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cone'
                },
                label: {
                    ...labelAttributes,
                    text: 'Silo',
                    y: 'calc(h + 14)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
