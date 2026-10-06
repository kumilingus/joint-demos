import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField } from '../../common/Shape';

/** Where the filter bags are across the housing (relative to the width) */
export const BAGS = [0.2, 0.4, 0.6, 0.8];

/** A filter bag hanging in the housing at a part of the width */
const bag = (x: number) => ({
    x: `calc(${x} * w - 9)`,
    y: 'calc(0.17 * h)',
    width: 18,
    height: 'calc(0.36 * h)',
    rx: 8,
    ry: 8,
    fill: 'var(--shape-filter-bag)',
    stroke: '#8a8270',
    strokeWidth: 1
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <path @selector='hopper' />
    <rect @selector='valve' />
    <rect @selector='body' />
    <rect @selector='window' />
    ${BAGS.map((_, i) => `<rect @selector='bag${i + 1}' />`).join('')}
    <rect @selector='plenum' />
    <text @selector='label' />
`;

/**
 * A bag filter (a baghouse): the dusty gas comes in on the left, the dust stays on the filter bags and falls
 * into the hopper, the clean gas leaves the plenum on the top right. In the runtime mode the bags are cleaned
 * by pulses of air, one after the other.
 */
export default class BagFilter extends Shape {

    // The accent: the legs
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['legs', 'stroke'] };
    }

    get stubLength(): number {
        return 20;
    }

    get tagPrefix(): string {
        return 'BF';
    }

    defaults(): dia.Element.Attributes {
        const bags = Object.fromEntries(BAGS.map((x, i) => [`bag${i + 1}`, bag(x)]));
        return {
            ...super.defaults,
            type: 'BagFilter',
            // Its label (see `from-model`)
            label: { text: 'Bag Filter', position: 'bottom' },
            size: {
                width: 160,
                height: 200
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'accent' },
                    d: 'M calc(0.06 * w) calc(0.6 * h) V calc(h) M calc(0.94 * w) calc(0.6 * h) V calc(h)',
                    stroke: 'var(--shape-legs)',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                hopper: {
                    d: 'M 0 calc(0.6 * h) H calc(w) L calc(0.6 * w) calc(0.88 * h) H calc(0.4 * w) Z',
                    surfaceFill: 'cone',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                // The rotary valve the dust leaves the hopper through
                valve: {
                    x: 'calc(0.4 * w)',
                    y: 'calc(0.88 * h)',
                    width: 'calc(0.2 * w)',
                    height: 'calc(0.08 * h)',
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'dark',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                body: {
                    y: 'calc(0.1 * h)',
                    width: 'calc(w)',
                    height: 'calc(0.5 * h)',
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                window: {
                    x: 'calc(0.08 * w)',
                    y: 'calc(0.14 * h)',
                    width: 'calc(0.84 * w)',
                    height: 'calc(0.42 * h)',
                    fill: '#2b2f33'
                },
                ...bags,
                // The clean gas plenum on the top
                plenum: {
                    width: 'calc(w)',
                    height: 'calc(0.1 * h)',
                    surfaceFill: 'mid',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes
                }
            },
            // The dusty gas in on the left, the clean gas out of the plenum on the right
            ports: pipePorts(this.stubLength, { left: 0.4, right: 0.05 })
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
