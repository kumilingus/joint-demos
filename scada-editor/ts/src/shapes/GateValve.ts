import { type dia, util } from '@joint/plus';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import { bowTieAttributes } from './valveBody';
import type { Overflow } from './footprint';
import { Shape, type Resizable, type ControlKind } from './Shape';

// How high the handwheel is above the valve: the stem rises when the valve opens.
const HANDWHEEL_OPEN = -36;
const HANDWHEEL_CLOSED = -16;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='stem' />
    <rect @selector='yoke' />
    <rect @selector='handwheel' />
    <path @selector='body' />
    <text @selector='label' />
`;

/** A gate valve with a rising stem: the handwheel is up while the valve is open. */
export class GateValve extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 44 };
    }

    get tagPrefix(): string {
        return 'GV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'GateValve',
            size: {
                width: 60,
                height: 40
            },
            open: true,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                stem: {
                    stroke: '#555',
                    strokeWidth: 4
                },
                yoke: {
                    x: 'calc(w / 2 - 8)',
                    y: -8,
                    width: 16,
                    height: 10,
                    fill: '#777',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                handwheel: {
                    x: 'calc(w / 2 - 20)',
                    width: 40,
                    height: 8,
                    rx: 4,
                    ry: 4,
                    fill: '#666',
                    stroke: '#333',
                    strokeWidth: 2
                },
                body: bowTieAttributes,
                label: {
                    ...labelAttributes,
                    text: 'Gate Valve'
                }
            },
            ports: pipePorts(centerPortPosition)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateStem();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateStem(options));
    }

    updateStem(options?: dia.Cell.Options): void {
        const top = this.get('open') ? HANDWHEEL_OPEN : HANDWHEEL_CLOSED;
        this.attr({
            stem: { d: `M calc(w / 2) calc(h / 2) V ${top}` },
            handwheel: { y: top - 4 }
        }, options);
    }
}
