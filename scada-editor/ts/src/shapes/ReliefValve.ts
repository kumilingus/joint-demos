import { type dia, util } from '@joint/plus';
import { labelAttributes, pipePorts } from './ports';
import { METAL_STROKE, cylinderGradient } from './gradients';
import type { Overflow } from './footprint';
import { Shape, type Resizable } from './Shape';

// The spring inside the bonnet: a zig-zag between the relative heights 0.08 and 0.42
const SPRING = Array.from({ length: 7 }, (_, i) => {
    const x = i % 2 === 0 ? 0.35 : 0.65;
    const y = 0.08 + i * (0.34 / 6);
    return `${i === 0 ? 'M' : 'L'} calc(${x} * w) calc(${y.toFixed(3)} * h)`;
}).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='bonnet' />
    <path @selector='spring' />
    <rect @selector='cap' />
    <path @selector='body' />
    <text @selector='label' />
`;

/** A safety valve: the spring keeps it shut until the pressure lifts the disc. */
export class ReliefValve extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 8 };
    }

    get tagPrefix(): string {
        return 'PSV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ReliefValve',
            size: {
                width: 60,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                bonnet: {
                    x: 'calc(0.2 * w)',
                    y: 0,
                    width: 'calc(0.6 * w)',
                    height: 'calc(0.5 * h)',
                    rx: 4,
                    ry: 4,
                    fill: cylinderGradient,
                    stroke: METAL_STROKE,
                    strokeWidth: 2
                },
                spring: {
                    d: SPRING,
                    fill: 'none',
                    stroke: '#ED2637',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                cap: {
                    x: 'calc(0.3 * w)',
                    y: -8,
                    width: 'calc(0.4 * w)',
                    height: 10,
                    rx: 2,
                    ry: 2,
                    fill: '#666',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                // The bow tie of the valve in the bottom half
                body: {
                    d: 'M 0 calc(0.5 * h) L calc(w) calc(h) V calc(0.5 * h) L 0 calc(h) Z',
                    fill: '#fff',
                    stroke: '#555',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Relief Valve'
                }
            },
            // The pipes enter the bottom half.
            ports: pipePorts({
                name: 'absolute',
                args: { x: 'calc(w / 2)', y: 'calc(0.75 * h)' }
            })
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
