import { type dia, util } from '@joint/plus';
import { labelAttributes, terminalPorts } from './ports';
import Shape, { type ControlKind, type Resizable } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <rect @selector='front' />
    <rect @selector='slot' />
    <rect @selector='lever' />
    <rect @selector='window' />
    <text @selector='state' />
    <text @selector='label' />
`;

/**
 * A molded-case circuit breaker: the current passes while it is closed (the lever up, ON in red),
 * open it cuts the circuit (the lever down, OFF in green); opened and closed in the runtime mode.
 */
export default class CircuitBreaker extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get tagPrefix(): string {
        return 'CB';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'CircuitBreaker',
            size: {
                width: 60,
                height: 80
            },
            open: false,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 4,
                    ry: 4,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                front: {
                    x: 'calc(0.15 * w)',
                    y: 'calc(0.12 * h)',
                    width: 'calc(0.7 * w)',
                    height: 'calc(0.76 * h)',
                    rx: 3,
                    ry: 3,
                    fill: '#3a434c',
                    stroke: '#222',
                    strokeWidth: 1.5
                },
                slot: {
                    x: 'calc(0.5 * w - 5)',
                    y: 'calc(0.2 * h)',
                    width: 10,
                    height: 'calc(0.36 * h)',
                    rx: 3,
                    ry: 3,
                    fill: '#1a1f24'
                },
                lever: {
                    x: 'calc(0.5 * w - 8)',
                    width: 16,
                    height: 'calc(0.16 * h)',
                    rx: 3,
                    ry: 3,
                    fill: '#e6e9ec',
                    stroke: '#222',
                    strokeWidth: 1.5
                },
                window: {
                    x: 'calc(0.25 * w)',
                    y: 'calc(0.64 * h)',
                    width: 'calc(0.5 * w)',
                    height: 'calc(0.16 * h)',
                    rx: 2,
                    ry: 2
                },
                state: {
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.72 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 11,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: '#ffffff'
                },
                label: {
                    ...labelAttributes,
                    text: 'Breaker'
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'left' }, { id: 'out', side: 'right' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateState();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateState(options));
    }

    /** The lever up (closed) or down (open), the state in its color in the window */
    updateState(options?: dia.Cell.Options): void {
        const open = Boolean(this.get('open'));
        this.attr({
            lever: { y: open ? 'calc(0.4 * h)' : 'calc(0.2 * h)' },
            window: { fill: open ? 'var(--shape-breaker-open)' : 'var(--shape-breaker-closed)' },
            state: { text: open ? 'OFF' : 'ON' }
        }, options);
    }
}
