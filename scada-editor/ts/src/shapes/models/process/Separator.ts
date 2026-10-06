import { type dia, util } from '@joint/plus';
import { pipePorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { LIQUID_COLOR } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../../common/Shape';

const saddle = (x: number) => `M calc(${x} * w - 14) calc(h + 12) L calc(${x} * w - 8) calc(h - 6) H calc(${x} * w + 8) L calc(${x} * w + 14) calc(h + 12) Z`;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='saddles' />
    <rect @selector='gasOutlet' />
    <rect @selector='body' />
    <path @selector='liquid' />
    <rect @selector='demister' />
    <text @selector='label' />
`;

/** A horizontal two-phase separator: the liquid settles at the bottom, the gas leaves on the top. */
export default class Separator extends Shape {

    // The accent: the saddles
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['saddles', 'fill'] };
    }

    get stubLength(): number {
        return 30;
    }

    get overflow(): Overflow {
        return { top: 12, bottom: 36 };
    }

    get tagPrefix(): string {
        return 'SEP';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Separator',
            // Its label (see `from-model`)
            label: { text: 'Separator', position: 'bottom' },
            size: {
                width: 180,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                saddles: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    d: `${saddle(0.25)} ${saddle(0.75)}`,
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                gasOutlet: {
                    x: 'calc(0.5 * w - 8)',
                    y: -12,
                    width: 16,
                    height: 14,
                    surfaceFill: 'flat-2',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.5 * h)',
                    ry: 'calc(0.5 * h)',
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'pipe'
                },
                // The liquid in the bottom third
                liquid: {
                    d: 'M calc(0.12 * w) calc(0.68 * h) H calc(0.88 * w)',
                    stroke: LIQUID_COLOR,
                    strokeOpacity: 0.7,
                    strokeWidth: 3,
                    strokeDasharray: '10,5'
                },
                // The mist eliminator near the gas outlet
                demister: {
                    x: 'calc(0.72 * w)',
                    y: 'calc(0.15 * h)',
                    width: 10,
                    height: 'calc(0.4 * h)',
                    fill: 'none',
                    stroke: '#555',
                    strokeWidth: 2,
                    strokeDasharray: '3,2'
                },
                label: {
                    ...labelAttributes,
                    y: 'calc(h + 18)'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
