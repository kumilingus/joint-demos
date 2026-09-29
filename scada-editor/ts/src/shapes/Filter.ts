import { type dia, util } from '@joint/plus';
import { labelAttributes, pipePorts } from './ports';
import { METAL_STROKE, cylinderGradient } from './gradients';
import type { Overflow } from './footprint';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <path @selector='mesh' />
    <rect @selector='cap' />
    <text @selector='label' />
`;

export default class Filter extends Shape {

    get stubLength(): number {
        return 30;
    }

    get overflow(): Overflow {
        return { top: 8 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Filter',
            size: {
                width: 60,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 8,
                    ry: 8,
                    stroke: METAL_STROKE,
                    strokeWidth: 3,
                    fill: cylinderGradient
                },
                // The filter element across the housing
                mesh: {
                    d: 'M calc(0.15 * w) calc(0.85 * h) L calc(0.85 * w) calc(0.15 * h)',
                    stroke: '#333',
                    strokeWidth: 3,
                    strokeDasharray: '6,4',
                    strokeLinecap: 'round'
                },
                cap: {
                    x: 'calc(0.2 * w)',
                    y: -8,
                    width: 'calc(0.6 * w)',
                    height: 10,
                    rx: 2,
                    ry: 2,
                    fill: '#666',
                    stroke: '#333',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes,
                    text: 'Filter'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
