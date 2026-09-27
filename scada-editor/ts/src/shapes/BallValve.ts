import { type dia, util } from '@joint/plus';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import { bowTieAttributes, leverAttributes } from './valve-body';
import { sphereGradient } from './gradients';
import type { Overflow } from './footprint';
import Shape, { type Resizable, type ControlKind } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='lever' />
    <path @selector='body' />
    <circle @selector='ball' />
    <path @selector='bore' />
    <text @selector='label' />
`;

/** A quarter-turn valve with a ball: the bore is along the flow when open, across it when closed. */
export default class BallValve extends Shape {

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

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'BallValve',
            size: {
                width: 60,
                height: 40
            },
            open: true,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                lever: leverAttributes,
                body: bowTieAttributes,
                ball: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 11,
                    fill: sphereGradient,
                    stroke: '#333',
                    strokeWidth: 2
                },
                bore: {
                    d: 'M -7 0 H 7',
                    stroke: '#333',
                    strokeWidth: 4,
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Ball Valve'
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
        this.updateBore();
        this.on('change:open', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateBore(options));
    }

    updateBore(options?: dia.Cell.Options): void {
        const angle = this.get('open') ? 0 : 90;
        this.attr('bore/transform', `translate(calc(w / 2), calc(h / 2)) rotate(${angle})`, options);
    }
}
