import { type dia, util } from '@joint/plus';
import { LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import { Shape } from './Shape';

/** The side the tip of the zone points to: where the pipe comes from. */
export type TipSide = 'left' | 'right';

/** The outline of a zone of the size, with the tip at the middle of the side. */
function zoneOutline(side: TipSide, width: number, height: number): string {
    const tip = height / 2;
    return side === 'right'
        ? `M ${width} ${tip} L ${width - tip} 0 H 0 V ${height} H ${width - tip} Z`
        : `M 0 ${tip} L ${tip} 0 H ${width} V ${height} H ${tip} Z`;
}

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
            attrs: {
                body: {
                    fill: 'var(--shape-face)',
                    stroke: 'var(--shape-zone-stroke)',
                    strokeWidth: 1,
                    // The outline (see `tip-side` below), edited in the inspector
                    tipSide: 'left'
                },
                label: {
                    text: 'Zone',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: LIQUID_COLOR,
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    x: 'calc(w / 2)',
                    y: 'calc(h / 2)'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    static attributes = {
        // The outline of the body for its size, the tip on the side (`tipSide` in the attributes:
        // the names are looked up in the kebab case).
        'tip-side': {
            set(this: dia.ElementView, side: TipSide, refBBox: dia.BBox) {
                return { d: zoneOutline(side === 'right' ? 'right' : 'left', refBBox.width, refBBox.height) };
            },
            unset: 'd'
        }
    };
}
