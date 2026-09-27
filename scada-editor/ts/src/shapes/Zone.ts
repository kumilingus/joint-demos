import { type dia, util } from '@joint/plus';
import { LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import { Shape } from './Shape';

/** The side the tip of the zone points to: where the pipe comes from. */
export type ZoneFacing = 'left' | 'right';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='body' />
    <text @selector='label' />
`;

export class Zone extends Shape {

    get rotatable(): boolean {
        return false;
    }

    get overflow(): Overflow {
        return { bottom: 0 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Zone',
            size: {
                width: 120,
                height: 40
            },
            facing: 'left',
            attrs: {
                body: {
                    fill: '#ffffff',
                    stroke: '#cad8e3',
                    strokeWidth: 1,
                    // The tip on the left (see `updateFacing()` for the right)
                    d: 'M 0 calc(0.5*h) calc(0.5*h) 0 H calc(w) V calc(h) H calc(0.5*h) Z'
                },
                label: {
                    text: 'Zone',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: LIQUID_COLOR,
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    y: 'calc(h / 2)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateFacing();
        this.on('change:facing', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateFacing(options));
    }

    /**
     * A zone facing right is the mirror image of the one facing left
     * (`calc()` can't express the tip at `w - h / 2`).
     * The label is centered in the body, next to the tip.
     */
    updateFacing(options?: dia.Cell.Options): void {
        const right = (this.get('facing') as ZoneFacing) === 'right';
        this.attr({
            body: { transform: right ? 'translate(calc(w), 0) scale(-1, 1)' : null },
            label: { x: right ? 'calc(w / 2 - 10)' : 'calc(w / 2 + 10)' }
        }, options);
    }
}
