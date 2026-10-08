import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField } from '../Shape';

const saddle = (x: number) => `M calc(${x} * w - 16) calc(h + 12) L calc(${x} * w - 10) calc(h - 8) H calc(${x} * w + 10) L calc(${x} * w + 16) calc(h + 12) Z`;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='saddles' />
    <rect @selector='manhole' />
    <rect @selector='vent' />
    <rect @selector='body' />
    <path @selector='welds' />
    <text @selector='label' />
`;

/** A horizontal storage tank ("bullet") resting on two saddles. */
export default class HorizontalTank extends Shape {

    // The accent: the saddles
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['saddles', 'fill'] };
    }

    get overflow(): Overflow {
        return { top: 16, bottom: 36 };
    }

    get tagPrefix(): string {
        return 'TK';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'HorizontalTank',
            // Its label (see `from-model`)
            label: { text: 'Horizontal Tank', position: 'bottom' },
            size: {
                width: 200,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                saddles: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    d: `${saddle(0.22)} ${saddle(0.78)}`,
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                manhole: {
                    x: 'calc(0.3 * w - 12)',
                    y: -10,
                    width: 24,
                    height: 12,
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'flat-2',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                vent: {
                    x: 'calc(0.7 * w - 5)',
                    y: -16,
                    width: 10,
                    height: 18,
                    surfaceFill: 'flat-2',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.4 * h)',
                    ry: 'calc(0.5 * h)',
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'pipe'
                },
                // The welds between the shell rings
                welds: {
                    d: 'M calc(0.35 * w) 2 V calc(h - 2) M calc(0.65 * w) 2 V calc(h - 2)',
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.5,
                    strokeWidth: 1.5
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
