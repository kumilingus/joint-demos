import { type dia, util } from '@joint/plus';
import { labelAttributes, pipePorts } from './ports';
import type { Overflow } from './footprint';
import Shape from './Shape';

const nozzle = {
    width: 16,
    height: 14,
    surfaceFill: 'flat-2',
    surfaceStroke: 'edge',
    strokeWidth: 2
};

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='shellInlet' />
    <rect @selector='shellOutlet' />
    <rect @selector='body' />
    <path @selector='tubes' />
    <text @selector='label' />
`;

/** A shell-and-tube heat exchanger: the tubes run through the shell from the left to the right. */
export default class HeatExchanger extends Shape {

    get stubLength(): number {
        return 30;
    }

    get overflow(): Overflow {
        return { top: 12, bottom: 40 };
    }

    get tagPrefix(): string {
        return 'HX';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'HeatExchanger',
            size: {
                width: 160,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The shell side inlet (top left) and outlet (bottom right)
                shellInlet: {
                    ...nozzle,
                    x: 'calc(0.25 * w - 8)',
                    y: -12
                },
                shellOutlet: {
                    ...nozzle,
                    x: 'calc(0.75 * w - 8)',
                    y: 'calc(h - 2)'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.5 * h)',
                    ry: 'calc(0.5 * h)',
                    surfaceStroke: 'edge',
                    strokeWidth: 3,
                    surfaceFill: 'pipe'
                },
                tubes: {
                    d: [
                        'M calc(0.12 * w) calc(0.5 * h)',
                        'L calc(0.26 * w) calc(0.25 * h)',
                        'L calc(0.42 * w) calc(0.75 * h)',
                        'L calc(0.58 * w) calc(0.25 * h)',
                        'L calc(0.74 * w) calc(0.75 * h)',
                        'L calc(0.88 * w) calc(0.5 * h)'
                    ].join(' '),
                    fill: 'none',
                    stroke: '#E07A5F',
                    strokeWidth: 4,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Heat Exchanger',
                    y: 'calc(h + 20)'
                }
            },
            // The pipe stubs start in the middle of the shell and stick out 30 on each side.
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
