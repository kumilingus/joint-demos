import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ControlKind, type Resizable } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='feet' />
    <rect @selector='body' />
    <path @selector='ribs' />
    <rect @selector='endBell' />
    <rect @selector='shaft' />
    <rect @selector='shaftMark' />
    <rect @selector='terminalBox' />
    <text @selector='label' />
`;

/** A generator (an alternator): a source of the power while it runs (switched in the runtime mode). */
export default class Generator extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'power';
    }

    get tagPrefix(): string {
        return 'G';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Generator',
            // What it shows (see `data.ts`)
            data: {
                power: 1
            },
            size: {
                width: 120,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                feet: {
                    d: 'M calc(0.2 * w) calc(0.85 * h) V calc(h) M calc(0.7 * w) calc(0.85 * h) V calc(h) M calc(0.1 * w) calc(h) H calc(0.3 * w) M calc(0.6 * w) calc(h) H calc(0.8 * w)',
                    stroke: '#555',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                // The frame of the stator (a horizontal cylinder)
                body: {
                    x: 'calc(0.1 * w)',
                    y: 'calc(0.2 * h)',
                    width: 'calc(0.7 * w)',
                    height: 'calc(0.66 * h)',
                    rx: 6,
                    ry: 6,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The cooling ribs
                ribs: {
                    d: [0.22, 0.32, 0.42, 0.52, 0.62, 0.72].map(x => `M calc(${x} * w) calc(0.24 * h) V calc(0.82 * h)`).join(' '),
                    surfaceStroke: 'edge',
                    strokeOpacity: 0.55,
                    strokeWidth: 2
                },
                endBell: {
                    x: 'calc(0.8 * w)',
                    y: 'calc(0.28 * h)',
                    width: 'calc(0.1 * w)',
                    height: 'calc(0.5 * h)',
                    rx: 4,
                    ry: 4,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                shaft: {
                    y: 'calc(0.47 * h)',
                    width: 'calc(0.1 * w)',
                    height: 'calc(0.12 * h)',
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                // A key on the shaft: swept across it while the generator runs (see `animations.ts`), hidden otherwise
                shaftMark: {
                    x: 'calc(0.05 * w - 2)',
                    y: 'calc(0.47 * h)',
                    width: 4,
                    height: 2,
                    fill: '#333',
                    opacity: 0
                },
                terminalBox: {
                    x: 'calc(0.375 * w)',
                    y: 0,
                    width: 'calc(0.25 * w)',
                    height: 'calc(0.22 * h)',
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Generator'
                }
            },
            // The cables out of the terminal box on the top
            ports: terminalPorts([{ id: 'out', side: 'top' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
