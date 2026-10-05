import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

// The legs around the equator (relative x positions)
const LEGS = [0.12, 0.38, 0.62, 0.88]
    .map(x => `M calc(${x} * w) calc(0.5 * h) V calc(h + 14)`)
    .join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <ellipse @selector='body' />
    <path @selector='equator' />
    <ellipse @selector='manhole' />
    <text @selector='label' />
`;

/** A pressure sphere for liquefied gas, standing on legs. */
export default class SphericalTank extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get overflow(): Overflow {
        return { bottom: 38 };
    }

    get tagPrefix(): string {
        return 'TK';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'SphericalTank',
            // Its label (see `text-from`)
            label: { text: 'Sphere' },
            size: {
                width: 140,
                height: 140
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    d: LEGS,
                    stroke: 'var(--shape-legs)',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    rx: 'calc(w / 2)',
                    ry: 'calc(h / 2)',
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'sphere'
                },
                equator: {
                    d: 'M 0 calc(0.5 * h) Q calc(0.5 * w) calc(0.62 * h) calc(w) calc(0.5 * h)',
                    fill: 'none',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                manhole: {
                    cx: 'calc(w / 2)',
                    cy: 4,
                    rx: 12,
                    ry: 5,
                    surfaceFill: 'mid',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    y: 'calc(h + 20)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
