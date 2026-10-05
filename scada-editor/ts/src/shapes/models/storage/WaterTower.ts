import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape from '../../common/Shape';

// The tank on the top (relative height of its bottom)
const TANK_BOTTOM = 0.42;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <path @selector='bracing' />
    <path @selector='riser' />
    <rect @selector='body' />
    <path @selector='roof' />
    <text @selector='label' />
`;

/** An elevated water tank: a tank on braced legs, with a conical roof. */
export default class WaterTower extends Shape {

    get overflow(): Overflow {
        return { top: 16, bottom: 34 };
    }

    get tagPrefix(): string {
        return 'WT';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'WaterTower',
            // Its label (see `text-from`)
            label: { text: 'Water Tower' },
            size: {
                width: 120,
                height: 220
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    d: `M calc(0.2 * w) calc(${TANK_BOTTOM} * h) L calc(0.08 * w) calc(h + 6) M calc(0.8 * w) calc(${TANK_BOTTOM} * h) L calc(0.92 * w) calc(h + 6)`,
                    stroke: 'var(--shape-legs)',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                // The cross bracing between the legs
                bracing: {
                    d: [
                        'M calc(0.18 * w) calc(0.5 * h) L calc(0.86 * w) calc(0.75 * h)',
                        'M calc(0.82 * w) calc(0.5 * h) L calc(0.14 * w) calc(0.75 * h)',
                        'M calc(0.14 * w) calc(0.75 * h) L calc(0.9 * w) calc(h)',
                        'M calc(0.86 * w) calc(0.75 * h) L calc(0.1 * w) calc(h)'
                    ].join(' '),
                    stroke: '#777',
                    strokeWidth: 2
                },
                // The riser pipe down the middle
                riser: {
                    d: `M calc(0.5 * w) calc(${TANK_BOTTOM} * h) V calc(h + 6)`,
                    surfaceStroke: 'edge',
                    strokeWidth: 8
                },
                body: {
                    y: 'calc(0.08 * h)',
                    width: 'calc(w)',
                    height: `calc(${(TANK_BOTTOM - 0.08).toFixed(2)} * h)`,
                    rx: 10,
                    ry: 10,
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'cylinder'
                },
                roof: {
                    d: 'M -4 calc(0.08 * h) L calc(0.5 * w) -16 L calc(w + 4) calc(0.08 * h) Z',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cone'
                },
                label: {
                    ...labelAttributes,
                    y: 'calc(h + 14)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
