import { type dia, util } from '@joint/plus';
import { labelAttributes, pipePorts, pipeThroughAttributes } from './ports';
import { bowTieAttributes, leverAttributes } from './valve-body';
import type { Overflow } from './footprint';
import Shape, { type Resizable, type ControlKind } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <path @selector='lever' />
    <path @selector='body' />
    <path @selector='disc' />
    <circle @selector='pivot' />
    <text @selector='label' />
`;

/** A quarter-turn valve with a disc: along the flow when open, across it when closed. */
export default class ButterflyValve extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 17 };
    }

    get tagPrefix(): string {
        return 'BFV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ButterflyValve',
            size: {
                width: 60,
                height: 40
            },
            open: true,
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                lever: leverAttributes,
                body: bowTieAttributes,
                disc: {
                    d: 'M 0 -16 V 16',
                    stroke: '#333',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                pivot: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 4,
                    fill: '#333'
                },
                label: {
                    ...labelAttributes,
                    text: 'Butterfly Valve'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateDisc();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateDisc(options));
    }

    updateDisc(options?: dia.Cell.Options): void {
        const angle = this.get('open') ? 90 : 0;
        this.attr('disc/transform', `translate(calc(w / 2), calc(h / 2)) rotate(${angle})`, options);
    }
}
