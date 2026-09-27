import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, coneGradient, cylinderGradient, pipeGradient } from './gradients';
import type { Overflow } from './footprint';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='inlet' />
    <rect @selector='outlet' />
    <path @selector='cone' />
    <rect @selector='body' />
    <rect @selector='dustOutlet' />
    <text @selector='label' />
`;

/** A cyclone separator: the dust spins down the cone, the clean gas leaves through the top. */
export default class Cyclone extends Shape {

    get overflow(): Overflow {
        return { top: 18, left: 24 };
    }

    get tagPrefix(): string {
        return 'CY';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Cyclone',
            size: {
                width: 80,
                height: 160
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The tangential inlet on the top left
                inlet: {
                    x: -24,
                    y: 8,
                    width: 30,
                    height: 20,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: pipeGradient
                },
                outlet: {
                    x: 'calc(0.3 * w)',
                    y: -18,
                    width: 'calc(0.4 * w)',
                    height: 22,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: cylinderGradient
                },
                cone: {
                    d: 'M 0 calc(0.4 * h) H calc(w) L calc(0.6 * w) calc(h - 10) H calc(0.4 * w) Z',
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    fill: coneGradient
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(0.4 * h)',
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: cylinderGradient
                },
                dustOutlet: {
                    x: 'calc(0.4 * w)',
                    y: 'calc(h - 12)',
                    width: 'calc(0.2 * w)',
                    height: 12,
                    fill: '#777',
                    stroke: '#333',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Cyclone'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
