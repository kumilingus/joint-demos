import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

// An insulator of a bushing on the top of the tank, at a part of the width: a stack of sheds
const bushing = (x: number) => `M calc(${x} * w - 6) 0 H calc(${x} * w + 6) M calc(${x} * w - 8) -8 H calc(${x} * w + 8) M calc(${x} * w - 6) -16 H calc(${x} * w + 6) M calc(${x} * w - 8) -24 H calc(${x} * w + 8) M calc(${x} * w) 0 V -32`;

// The cooling fins on the sides
const fins = (x0: number, x1: number) => [0, 1, 2, 3, 4].map(i => `M calc(${(x0 + (x1 - x0) * i / 4).toFixed(3)} * w) calc(0.3 * h) V calc(0.9 * h)`).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='radiators' />
    <rect @selector='conservator' />
    <path @selector='pipe' />
    <path @selector='bushings' />
    <rect @selector='body' />
    <path @selector='seams' />
    <text @selector='label' />
`;

/** A power transformer: the tank with its cooling radiators, the oil conservator and the bushings on top. */
export default class PowerTransformer extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    // The bushings above it
    get overflow(): Overflow {
        return { top: 34 };
    }

    get tagPrefix(): string {
        return 'TX';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'PowerTransformer',
            // Its label (see `text-from`)
            label: { text: 'Power Transformer', position: 'bottom' },
            size: {
                width: 160,
                height: 150
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                radiators: {
                    d: `${fins(0.02, 0.16)} ${fins(0.84, 0.98)}`,
                    surfaceStroke: 'edge',
                    strokeWidth: 4,
                    strokeLinecap: 'round'
                },
                // The oil conservator on the top, piped to the tank
                conservator: {
                    x: 'calc(0.55 * w)',
                    y: 'calc(0.02 * h)',
                    width: 'calc(0.4 * w)',
                    height: 'calc(0.14 * h)',
                    rx: 'calc(0.07 * h)',
                    ry: 'calc(0.07 * h)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                pipe: {
                    d: 'M calc(0.62 * w) calc(0.16 * h) V calc(0.22 * h)',
                    surfaceStroke: 'edge',
                    strokeWidth: 4
                },
                bushings: {
                    d: `${bushing(0.28)} ${bushing(0.42)}`,
                    stroke: '#8a6d3b',
                    strokeWidth: 4,
                    strokeLinecap: 'round',
                    transform: 'translate(0, calc(0.22 * h))'
                },
                body: {
                    x: 'calc(0.16 * w)',
                    y: 'calc(0.22 * h)',
                    width: 'calc(0.68 * w)',
                    height: 'calc(0.78 * h)',
                    rx: 3,
                    ry: 3,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 3
                },
                seams: {
                    d: 'M calc(0.16 * w) calc(0.34 * h) H calc(0.84 * w) M calc(0.16 * w) calc(0.9 * h) H calc(0.84 * w)',
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.5,
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: terminalPorts([
                { id: 'hv', side: 'left', along: 'calc(0.6 * h)' },
                { id: 'lv', side: 'right', along: 'calc(0.6 * h)' }
            ])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
