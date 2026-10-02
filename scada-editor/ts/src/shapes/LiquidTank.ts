import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import Shape from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='legs' />
    <rect @selector='body' />
    <rect @selector='top' />
    <text @selector='label' />
`;

export default class LiquidTank extends Shape {

    get tagPrefix(): string {
        return 'TK';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'LiquidTank',
            size: {
                width: 160,
                height: 300
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    fill: 'none',
                    stroke: 'var(--shape-tank-legs)',
                    strokeWidth: 8,
                    strokeLinecap: 'round',
                    d: 'M 20 calc(h) l -5 10 M calc(w - 20) calc(h) l 5 10'
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
                label: {
                    ...labelAttributes,
                    text: 'Tank'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
