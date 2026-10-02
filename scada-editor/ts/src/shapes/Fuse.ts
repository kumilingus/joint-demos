import { type dia, util } from '@joint/plus';
import { labelAttributes, terminalPorts } from './ports';
import { porcelainGradient } from './gradients';
import Shape, { type Resizable } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='leftCap' />
    <rect @selector='rightCap' />
    <text @selector='rating' />
    <text @selector='label' />
`;

// The metal caps on the ends of the cartridge: how wide
const CAP = 14;

/** A fuse: a ceramic cartridge between metal caps, it protects the circuit from an overcurrent. */
export default class Fuse extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get tagPrefix(): string {
        return 'FU';
    }

    defaults(): dia.Element.Attributes {
        const cap = { width: CAP, height: 'calc(h)', rx: 3, ry: 3, surfaceFill: 'pipe', surfaceStroke: 'edge', strokeWidth: 1.5 };
        return {
            ...super.defaults,
            type: 'Fuse',
            size: {
                width: 80,
                height: 28
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    x: CAP - 2,
                    y: 3,
                    width: `calc(w - ${2 * (CAP - 2)})`,
                    height: 'calc(h - 6)',
                    fill: porcelainGradient,
                    stroke: 'var(--shape-porcelain-3)',
                    strokeWidth: 1.5
                },
                leftCap: cap,
                rightCap: { ...cap, x: `calc(w - ${CAP})` },
                rating: {
                    text: '63 A',
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 11,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: '#6b5b3a'
                },
                label: {
                    ...labelAttributes,
                    text: 'Fuse'
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'left' }, { id: 'out', side: 'right' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
