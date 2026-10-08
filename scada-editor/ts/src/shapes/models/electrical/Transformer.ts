import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../Shape';

// A bushing on the lid, at a part of the width: a porcelain insulator with its sheds
const bushing = (x: number) => ({
    x: `calc(${x} * w - 6)`,
    y: -22,
    width: 12,
    height: 24,
    rx: 3,
    ry: 3,
    materialFill: 'porcelain',
    stroke: 'var(--shape-porcelain-3)',
    strokeWidth: 1.5
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='hvBushing' />
    <rect @selector='lvBushing' />
    <path @selector='sheds' />
    <path @selector='fins' />
    <rect @selector='body' />
    <rect @selector='lid' />
    <text @selector='label' />
`;

/** A distribution transformer: a round tank with cooling fins and the bushings of its two sides on the lid. */
export default class Transformer extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    // The bushings above it
    get overflow(): Overflow {
        return { top: 22 };
    }

    get tagPrefix(): string {
        return 'TR';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Transformer',
            // Its label (see `from-model`)
            label: { text: 'Transformer', position: 'bottom' },
            size: {
                width: 80,
                height: 100
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                hvBushing: bushing(0.3),
                lvBushing: bushing(0.7),
                sheds: {
                    d: [0.3, 0.7].map(x => `M calc(${x} * w - 8) -16 H calc(${x} * w + 8) M calc(${x} * w - 8) -8 H calc(${x} * w + 8)`).join(' '),
                    stroke: 'var(--shape-porcelain-3)',
                    strokeWidth: 3,
                    strokeLinecap: 'round'
                },
                // The cooling fins on the sides of the tank
                fins: {
                    d: [0.2, 0.35, 0.5, 0.65, 0.8].map(y => `M 0 calc(${y} * h) H calc(0.12 * w) M calc(0.88 * w) calc(${y} * h) H calc(w)`).join(' '),
                    surfaceStroke: 'edge',
                    strokeWidth: 4,
                    strokeLinecap: 'round'
                },
                body: {
                    x: 'calc(0.1 * w)',
                    y: 4,
                    width: 'calc(0.8 * w)',
                    height: 'calc(h - 4)',
                    rx: 'calc(0.1 * w)',
                    ry: 6,
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                lid: {
                    x: 'calc(0.08 * w)',
                    width: 'calc(0.84 * w)',
                    height: 8,
                    rx: 3,
                    ry: 3,
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'left', along: 'calc(0.5 * h)' }, { id: 'out', side: 'right', along: 'calc(0.5 * h)' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
