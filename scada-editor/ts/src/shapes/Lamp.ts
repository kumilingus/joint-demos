import { type dia, util } from '@joint/plus';
import { labelAttributes, terminalPorts } from './ports';
import { glassGradient } from './gradients';
import Shape, { type Resizable } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <circle @selector='glass' />
    <path @selector='filament' />
    <rect @selector='base' />
    <path @selector='threads' />
    <text @selector='label' />
`;

/** A lamp: a load, a bulb hanging from its base, lit while it is energized (in the runtime mode, see `ElectricalController`). */
export default class Lamp extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get tagPrefix(): string {
        return 'LMP';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Lamp',
            size: {
                width: 50,
                height: 70
            },
            attrs: {
                root: {
                    magnetSelector: 'glass'
                },
                glass: {
                    cx: 'calc(0.5 * w)',
                    cy: 'calc(h - calc(0.5 * w))',
                    r: 'calc(0.5 * w)',
                    fill: glassGradient,
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                filament: {
                    d: 'M calc(0.4 * w) 22 L calc(0.4 * w) 34 L calc(0.45 * w) 40 L calc(0.5 * w) 34 L calc(0.55 * w) 40 L calc(0.6 * w) 34 L calc(0.6 * w) 22',
                    fill: 'none',
                    stroke: '#6b5b3a',
                    strokeWidth: 1.5,
                    strokeLinejoin: 'round'
                },
                // The screw base on the top
                base: {
                    x: 'calc(0.3 * w)',
                    width: 'calc(0.4 * w)',
                    height: 22,
                    rx: 3,
                    ry: 3,
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                threads: {
                    d: 'M calc(0.3 * w) 6 H calc(0.7 * w) M calc(0.3 * w) 11 H calc(0.7 * w) M calc(0.3 * w) 16 H calc(0.7 * w)',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Lamp'
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'top' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
