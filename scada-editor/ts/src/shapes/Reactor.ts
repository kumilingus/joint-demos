import { type dia, util } from '@joint/plus';
import { labelAttributes } from './ports';
import { METAL_STROKE, cylinderGradient } from './gradients';
import type { Overflow } from './footprint';
import { type ControlKind, Shape } from './Shape';

/** A jacketed reactor: a vessel with dished ends, a heating jacket and an agitator. */
export class Reactor extends Shape {

    // The agitator is switched on and off (it stirs while on, see `animations.ts`).
    get control(): ControlKind {
        return 'power';
    }

    get overflow(): Overflow {
        return { top: 30, right: 6, bottom: 34, left: 6 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Reactor',
            power: 1,
            size: {
                width: 100,
                height: 160
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                legs: {
                    d: 'M 16 calc(h - 20) V calc(h + 10) M calc(w - 16) calc(h - 20) V calc(h + 10)',
                    stroke: '#555',
                    strokeWidth: 6,
                    strokeLinecap: 'round'
                },
                // The jacket around the lower part of the vessel
                jacket: {
                    x: -6,
                    y: 'calc(0.35 * h)',
                    width: 'calc(w + 12)',
                    height: 'calc(0.55 * h)',
                    rx: 10,
                    ry: 10,
                    fill: '#9aa3ab',
                    stroke: METAL_STROKE,
                    strokeWidth: 2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.5 * w)',
                    ry: 24,
                    stroke: METAL_STROKE,
                    strokeWidth: 3,
                    fill: cylinderGradient
                },
                shaft: {
                    d: 'M calc(w / 2) -6 V calc(0.75 * h)',
                    stroke: '#333',
                    strokeWidth: 4
                },
                impeller: {
                    d: 'M -24 0 H 24 M -24 -6 V 6 M 24 -6 V 6',
                    transform: 'translate(calc(w / 2), calc(0.75 * h))',
                    stroke: '#333',
                    strokeWidth: 4,
                    strokeLinecap: 'round'
                },
                motor: {
                    x: 'calc(w / 2 - 14)',
                    y: -30,
                    width: 28,
                    height: 24,
                    rx: 4,
                    ry: 4,
                    fill: '#555',
                    stroke: '#222',
                    strokeWidth: 2
                },
                label: {
                    ...labelAttributes,
                    text: 'Reactor',
                    y: 'calc(h + 16)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <path @selector='legs' />
            <rect @selector='jacket' />
            <rect @selector='body' />
            <path @selector='shaft' />
            <path @selector='impeller' />
            <rect @selector='motor' />
            <text @selector='label' />
        `;
    }
}
