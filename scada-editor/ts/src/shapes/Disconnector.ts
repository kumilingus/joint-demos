import { type dia, util } from '@joint/plus';
import { labelAttributes, terminalPorts } from './ports';
import Shape, { type ControlKind, type Resizable } from './Shape';

// An insulator post standing on the base, at a part of the width
const post = (x: number) => ({
    x: `calc(${x} * w - 7)`,
    y: 'calc(0.35 * h)',
    width: 14,
    height: 'calc(0.5 * h)',
    rx: 3,
    ry: 3,
    materialFill: 'porcelain',
    stroke: 'var(--shape-porcelain-3)',
    strokeWidth: 1.5
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='hingePost' />
    <rect @selector='contactPost' />
    <path @selector='sheds' />
    <path @selector='straps' />
    <path @selector='blade' />
    <path @selector='jaw' />
    <text @selector='label' />
`;

// The blade from the hinge to the jaw of the contact (closed), or lifted off it (open)
const CLOSED_BLADE = 'M calc(0.2 * w) calc(0.35 * h) L calc(0.8 * w) calc(0.35 * h)';
const OPEN_BLADE = 'M calc(0.2 * w) calc(0.35 * h) L calc(0.7 * w) 0';

/** A disconnector: a knife switch on two insulators isolating a part of the circuit (its blade lifts off when open). */
export default class Disconnector extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get tagPrefix(): string {
        return 'DS';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Disconnector',
            size: {
                width: 100,
                height: 60
            },
            open: false,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The base (a steel channel)
                body: {
                    y: 'calc(0.85 * h)',
                    width: 'calc(w)',
                    height: 'calc(0.15 * h)',
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'dark',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1.5
                },
                hingePost: post(0.2),
                contactPost: post(0.8),
                sheds: {
                    d: [0.2, 0.8].map(x => `M calc(${x} * w - 10) calc(0.5 * h) H calc(${x} * w + 10) M calc(${x} * w - 10) calc(0.68 * h) H calc(${x} * w + 10)`).join(' '),
                    stroke: 'var(--shape-porcelain-3)',
                    strokeWidth: 3,
                    strokeLinecap: 'round'
                },
                // From the terminals to the tops of the posts
                straps: {
                    d: 'M 0 calc(0.35 * h) H calc(0.2 * w) M calc(0.8 * w) calc(0.35 * h) H calc(w)',
                    stroke: 'var(--shape-copper-3)',
                    strokeWidth: 4
                },
                blade: {
                    d: CLOSED_BLADE,
                    stroke: 'var(--shape-copper-2)',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                jaw: {
                    d: 'M calc(0.8 * w - 6) calc(0.35 * h - 7) V calc(0.35 * h) H calc(0.8 * w + 6) V calc(0.35 * h - 7)',
                    fill: 'none',
                    stroke: 'var(--shape-copper-3)',
                    strokeWidth: 3,
                    strokeLinejoin: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Disconnector'
                }
            },
            ports: terminalPorts([
                { id: 'in', side: 'left', along: 'calc(0.35 * h)' },
                { id: 'out', side: 'right', along: 'calc(0.35 * h)' }
            ])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateBlade();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateBlade(options));
    }

    updateBlade(options?: dia.Cell.Options): void {
        this.attr('blade/d', this.get('open') ? OPEN_BLADE : CLOSED_BLADE, options);
    }
}
