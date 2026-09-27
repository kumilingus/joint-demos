import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, cylinderGradient } from './gradients';
import type { Overflow } from './footprint';
import Shape from './Shape';

// The trays inside the column, alternating from the left and the right wall
const TRAYS = Array.from({ length: 8 }, (_, i) => {
    const y = (0.15 + i * 0.1).toFixed(2);
    return i % 2 === 0
        ? `M 4 calc(${y} * h) H calc(0.7 * w)`
        : `M calc(0.3 * w) calc(${y} * h) H calc(w - 4)`;
}).join(' ');

const nozzle = (y: string) => ({
    x: -12,
    y,
    width: 14,
    height: 12,
    fill: 'var(--shape-metal-flat-2)',
    stroke: METAL_STROKE,
    strokeWidth: 2
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='feed' />
    <rect @selector='topOutlet' />
    <path @selector='skirt' />
    <rect @selector='body' />
    <path @selector='trays' />
    <text @selector='label' />
`;

/** A tall column separating a mixture on its trays. */
export default class DistillationColumn extends Shape {

    get overflow(): Overflow {
        return { top: 12, bottom: 36, left: 12 };
    }

    get tagPrefix(): string {
        return 'COL';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'DistillationColumn',
            size: {
                width: 60,
                height: 260
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The feed enters on the side, the vapour leaves at the top.
                feed: nozzle('calc(0.5 * h - 6)'),
                topOutlet: {
                    x: 'calc(w / 2 - 7)',
                    y: -12,
                    width: 14,
                    height: 14,
                    fill: 'var(--shape-metal-flat-2)',
                    stroke: METAL_STROKE,
                    strokeWidth: 2
                },
                skirt: {
                    d: 'M calc(0.1 * w) calc(h - 10) L 0 calc(h + 12) H calc(w) L calc(0.9 * w) calc(h - 10) Z',
                    fill: '#999',
                    stroke: '#555',
                    strokeWidth: 2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.5 * w)',
                    ry: 16,
                    stroke: METAL_STROKE,
                    strokeWidth: 3,
                    fill: cylinderGradient
                },
                trays: {
                    d: TRAYS,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    strokeDasharray: '4,2'
                },
                label: {
                    ...labelAttributes,
                    text: 'Column',
                    y: 'calc(h + 18)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
