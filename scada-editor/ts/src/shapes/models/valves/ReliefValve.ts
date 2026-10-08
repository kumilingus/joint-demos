import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable } from '../Shape';

// The spring inside the bonnet: a zig-zag between the relative heights 0.08 and 0.42
const SPRING = Array.from({ length: 7 }, (_, i) => {
    const x = i % 2 === 0 ? 0.35 : 0.65;
    const y = 0.08 + i * (0.34 / 6);
    return `${i === 0 ? 'M' : 'L'} calc(${x} * w) calc(${y.toFixed(3)} * h)`;
}).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <rect @selector='bonnet' />
    <path @selector='spring' />
    <rect @selector='cap' />
    <path @selector='body' />
    <text @selector='label' />
`;

/** A safety valve: the spring keeps it shut until the pressure lifts the disc. */
export default class ReliefValve extends Shape {

    // The accent: the cap
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['cap', 'fill'] };
    }

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
            // Its label (see `from-model`)
            label: { text: 'Relief Valve', position: 'bottom' },
            size: {
                width: 60,
                height: 80
            },
            attrs: {
                pipe: pipeThroughAttributes(0.75),
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
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
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
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    x: 'calc(0.3 * w)',
                    y: -8,
                    width: 'calc(0.4 * w)',
                    height: 10,
                    rx: 2,
                    ry: 2,
                    fill: 'var(--shape-cap)',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                // The bow tie of the valve in the bottom half
                body: {
                    d: 'M 0 calc(0.5 * h) L calc(w) calc(h) V calc(0.5 * h) L 0 calc(h) Z',
                    fill: 'var(--shape-face)',
                    stroke: 'var(--shape-valve-stroke)',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                label: {
                    ...labelAttributes
                }
            },
            // The pipes enter the bottom half.
            ports: pipePorts(this.stubLength, { left: 0.75, right: 0.75 })
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
