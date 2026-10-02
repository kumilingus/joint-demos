import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import type { Overflow } from './footprint';
import Shape, { type ColorField } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='body' />
    <path @selector='material' />
    <rect @selector='rim' />
    <text @selector='label' />
`;

/** An open bin narrowing into a chute at the bottom. */
export default class Hopper extends Shape {

    // The accent: the material in it
    get accentField(): ColorField {
        return { path: ['attrs', 'material', 'fill'] };
    }

    get overflow(): Overflow {
        return { top: 4, right: 4, left: 4 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Hopper',
            size: {
                width: 120,
                height: 120
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    d: 'M 0 0 H calc(w) L calc(0.62 * w) calc(0.75 * h) V calc(h) H calc(0.38 * w) V calc(0.75 * h) Z',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    surfaceFill: 'cone'
                },
                // The material in the bin
                material: {
                    d: 'M calc(0.12 * w) calc(0.2 * h) Q calc(0.5 * w) 2 calc(0.88 * w) calc(0.2 * h) Z',
                    fill: 'var(--shape-hopper-material)',
                    stroke: '#5e4f3d',
                    strokeWidth: 1
                },
                rim: {
                    x: -4,
                    y: -4,
                    width: 'calc(w + 8)',
                    height: 8,
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'mid',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Hopper'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
