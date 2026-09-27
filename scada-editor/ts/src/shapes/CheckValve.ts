import { type dia, util } from '@joint/plus';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import type { Overflow } from './footprint';
import { Shape, type Resizable } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='body' />
    <path @selector='inlet' />
    <path @selector='arrow' />
    <text @selector='label' />
`;

/** A valve letting the liquid flow in one direction only (from left to right). */
export class CheckValve extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 14 };
    }

    get tagPrefix(): string {
        return 'NRV';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'CheckValve',
            size: {
                width: 60,
                height: 40
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The bow tie of a valve...
                body: {
                    d: 'M 0 0 L calc(w) calc(h) V 0 L 0 calc(h) Z',
                    fill: '#fff',
                    stroke: '#555',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                // ...with the inlet half filled.
                inlet: {
                    d: 'M 0 0 L calc(0.5 * w) calc(0.5 * h) L 0 calc(h) Z',
                    fill: '#555'
                },
                arrow: {
                    d: 'M calc(0.2 * w) -10 H calc(0.8 * w) m -6 -4 l 6 4 l -6 4',
                    fill: 'none',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Check Valve'
                }
            },
            ports: pipePorts(centerPortPosition)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
