import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, cylinderGradient } from './gradients';
import { Shape } from './Shape';

export class LiquidTank extends Shape {

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
                    stroke: '#350100',
                    strokeWidth: 8,
                    strokeLinecap: 'round',
                    d: 'M 20 calc(h) l -5 10 M calc(w - 20) calc(h) l 5 10'
                },
                body: {
                    stroke: METAL_STROKE,
                    strokeWidth: 4,
                    x: 0,
                    y: 0,
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 120,
                    ry: 10,
                    fill: cylinderGradient
                },
                top: {
                    x: 0,
                    y: 20,
                    width: 'calc(w)',
                    height: 20,
                    fill: 'none',
                    stroke: METAL_STROKE,
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
        this.markup = util.svg/* xml */`
            <path @selector='legs' />
            <rect @selector='body' />
            <rect @selector='top' />
            <text @selector='label' />
        `;
    }
}
