import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';

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
    surfaceFill: 'flat-2',
    surfaceStroke: 'edge',
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

    // The accent: the skirt
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['skirt', 'fill'] };
    }

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
                    surfaceFill: 'flat-2',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                skirt: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    d: 'M calc(0.1 * w) calc(h - 10) L 0 calc(h + 12) H calc(w) L calc(0.9 * w) calc(h - 10) Z',
                    fill: 'var(--shape-skirt)',
                    stroke: '#555',
                    strokeWidth: 2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.5 * w)',
                    ry: 16,
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'cylinder'
                },
                trays: {
                    d: TRAYS,
                    surfaceStroke: 'edge',
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
