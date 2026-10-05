import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';
import { SURFACE_INK } from '../../../const';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <path @selector='mesh' />
    <rect @selector='cap' />
    <text @selector='label' />
`;

export default class Filter extends Shape {

    // The accent: the cap
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['cap', 'fill'] };
    }

    get stubLength(): number {
        return 30;
    }

    get overflow(): Overflow {
        return { top: 8 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Filter',
            // Its label (see `text-from`)
            label: { text: 'Filter', position: 'bottom' },
            size: {
                width: 60,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 8,
                    ry: 8,
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'cylinder'
                },
                // The filter element across the housing
                mesh: {
                    d: 'M calc(0.15 * w) calc(0.85 * h) L calc(0.85 * w) calc(0.15 * h)',
                    stroke: SURFACE_INK,
                    strokeWidth: 3,
                    strokeDasharray: '6,4',
                    strokeLinecap: 'round'
                },
                cap: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    x: 'calc(0.2 * w)',
                    y: -8,
                    width: 'calc(0.6 * w)',
                    height: 10,
                    rx: 2,
                    ry: 2,
                    fill: 'var(--shape-cap)',
                    stroke: '#333',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
