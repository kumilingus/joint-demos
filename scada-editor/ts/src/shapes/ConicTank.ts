import { type dia, util } from '@joint/plus';
import { labelAttributes } from './attributes/label';
import type { Overflow } from './footprint';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='bottom' />
    <rect @selector='body' />
    <rect @selector='top' />
    <text @selector='label' />
`;

export default class ConicTank extends Shape {

    get overflow(): Overflow {
        return { top: 26, bottom: 62 };
    }

    get tagPrefix(): string {
        return 'TK';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'ConicTank',
            size: {
                width: 160,
                height: 100
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    surfaceStroke: 'edge',
                    strokeWidth: 4,
                    x: 0,
                    y: 0,
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 120,
                    ry: 10,
                    surfaceFill: 'cylinder'
                },
                top: {
                    x: 0,
                    y: 20,
                    width: 'calc(w)',
                    height: 20,
                    fill: 'none',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                bottom: {
                    d: 'M 0 0 L calc(w) 0 L calc(w / 2 + 10) 70 h -20 Z',
                    transform: 'translate(0, calc(h - 10))',
                    surfaceStroke: 'edge',
                    strokeLinejoin: 'round',
                    strokeWidth: 2,
                    surfaceFill: 'cone'
                },
                label: {
                    ...labelAttributes,
                    text: 'Conic Tank',
                    textVerticalAnchor: 'bottom',
                    x: 'calc(w / 2)',
                    y: -10
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
