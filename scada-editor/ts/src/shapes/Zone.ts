import { type dia, util } from '@joint/plus';
import { LIQUID_COLOR } from '../const';
import type { Overflow } from './footprint';
import Shape, { type ColorField } from './Shape';

/** The side the tip of the zone points to: where the pipe comes from. */
export type TipSide = 'left' | 'right' | 'top' | 'bottom';

/** How far the tip reaches out of the zone: half of its height */
const tipDepth = (height: number) => height / 2;

/**
 * The outline of a zone of the size: its box, and the tip out of it at the middle of the side
 * (not in its bounding box: the box is the text's, the pipe ends at its side under the tip).
 */
function zoneOutline(side: TipSide, width: number, height: number): string {
    const tip = tipDepth(height);
    switch (side) {
        case 'right': return `M 0 0 H ${width} L ${width + tip} ${height / 2} L ${width} ${height} H 0 Z`;
        case 'top': return `M 0 0 L ${width / 2} ${-tip} L ${width} 0 V ${height} H 0 Z`;
        case 'bottom': return `M 0 0 H ${width} V ${height} L ${width / 2} ${height + tip} L 0 ${height} Z`;
        default: return `M 0 0 H ${width} V ${height} H 0 L ${-tip} ${height / 2} Z`;
    }
}

const TIP_SIDES: TipSide[] = ['left', 'right', 'top', 'bottom'];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='body' />
    <text @selector='label' />
`;

export default class Zone extends Shape {

    get rotatable(): boolean {
        return false;
    }

    // The tip out of the box on its side
    get overflow(): Overflow {
        const side: TipSide = this.attr('body/tipSide') ?? 'left';
        return { bottom: 0, [side]: tipDepth(this.size().height) };
    }

    // Its color: the fill; its outline: the border; its accent: the text (of the medium of the pipe it stands for)
    get colorField(): ColorField {
        return { path: ['attrs', 'body', 'fill'] };
    }

    get outlineField(): ColorField {
        return { path: ['attrs', 'body', 'stroke'] };
    }

    get accentField(): ColorField {
        return { path: ['attrs', 'label', 'fill'] };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Zone',
            size: {
                width: 100,
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
                    // On one line in the zone, cut with an ellipsis; its size set in the inspector
                    text: 'Zone',
                    textWrap: {
                        width: 'calc(w - 6)',
                        maxLineCount: 1,
                        ellipsis: true
                    },
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
                return { d: zoneOutline(TIP_SIDES.includes(side) ? side : 'left', refBBox.width, refBBox.height) };
            },
            unset: 'd'
        }
    };
}
