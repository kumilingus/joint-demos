import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import { LIQUID_COLOR } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';

// The packing bed in the middle of the column (relative heights)
const BED_TOP = 0.35;
const BED_BOTTOM = 0.62;

// The hatching of the packing (relative positions)
const PACKING = Array.from({ length: 5 }, (_, i) => {
    const x = 0.1 + i * 0.15;
    return `M calc(${x.toFixed(2)} * w) calc(${BED_BOTTOM} * h) L calc(${(x + 0.15).toFixed(2)} * w) calc(${BED_TOP} * h)`;
}).join(' ');

// The spray nozzles under the header
const NOZZLES = [0.3, 0.5, 0.7].map(x => `M calc(${x} * w) calc(0.2 * h) l -5 10 h 10 Z`).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='outlet' />
    <path @selector='skirt' />
    <rect @selector='body' />
    <rect @selector='sump' />
    <rect @selector='bed' />
    <path @selector='packing' />
    <path @selector='header' />
    <path @selector='nozzles' />
    <text @selector='label' />
`;

/** A gas scrubber: the gas rises through the packing, washed by the liquid sprayed from the top. */
export default class Scrubber extends Shape {

    // The accent: the skirt
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['skirt', 'fill'] };
    }

    get overflow(): Overflow {
        return { top: 14, bottom: 36 };
    }

    get tagPrefix(): string {
        return 'SC';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Scrubber',
            // Its label (see `text-from`)
            label: { text: 'Scrubber' },
            size: {
                width: 80,
                height: 220
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                outlet: {
                    x: 'calc(w / 2 - 8)',
                    y: -14,
                    width: 16,
                    height: 16,
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
                // The liquid collected at the bottom
                sump: {
                    x: 4,
                    y: 'calc(0.82 * h)',
                    width: 'calc(w - 8)',
                    height: 'calc(0.18 * h - 10)',
                    rx: 'calc(0.5 * w - 4)',
                    ry: 12,
                    fill: LIQUID_COLOR,
                    fillOpacity: 0.35
                },
                bed: {
                    x: 4,
                    y: `calc(${BED_TOP} * h)`,
                    width: 'calc(w - 8)',
                    height: `calc(${(BED_BOTTOM - BED_TOP).toFixed(2)} * h)`,
                    fill: 'none',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                packing: {
                    d: PACKING,
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.6,
                    strokeWidth: 1.5
                },
                header: {
                    d: 'M calc(0.15 * w) calc(0.2 * h) H calc(0.85 * w)',
                    stroke: '#555',
                    strokeWidth: 4,
                    strokeLinecap: 'round'
                },
                nozzles: {
                    d: NOZZLES,
                    surfaceFill: 'dark'
                },
                label: {
                    ...labelAttributes,
                    y: 'calc(h + 18)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
