import { type dia, util } from '@joint/plus';
import { LIQUID_COLOR } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable } from '../Shape';

/** The side the tip of the zone points to: where the pipe comes from. */
export type TipSide = 'left' | 'right' | 'top' | 'bottom';

/** The tip out of the zone, as of a tooltip: how far it reaches, how wide it is at the side - whatever the size of the zone */
const TIP_DEPTH = 12;
const TIP_WIDTH = 30;

/** How small the zone can get: the tip fits its side (the whole side of the lowest one) */
const MIN_SIZE = { width: 40, height: TIP_WIDTH };

/**
 * The outline of a zone of the size: its box, and the tip out of it at the middle of the side
 * (not in its bounding box: the box is the text's, the pipe ends at its side under the tip).
 */
function zoneOutline(side: TipSide, width: number, height: number): string {
    const [cx, cy, half] = [width / 2, height / 2, TIP_WIDTH / 2];
    switch (side) {
        case 'right': return `M 0 0 H ${width} V ${cy - half} L ${width + TIP_DEPTH} ${cy} L ${width} ${cy + half} V ${height} H 0 Z`;
        case 'top': return `M 0 0 H ${cx - half} L ${cx} ${-TIP_DEPTH} L ${cx + half} 0 H ${width} V ${height} H 0 Z`;
        case 'bottom': return `M 0 0 H ${width} V ${height} H ${cx + half} L ${cx} ${height + TIP_DEPTH} L ${cx - half} ${height} H 0 Z`;
        default: return `M 0 0 H ${width} V ${height} H 0 V ${cy + half} L ${-TIP_DEPTH} ${cy} L 0 ${cy - half} Z`;
    }
}

const TIP_SIDES: TipSide[] = ['left', 'right', 'top', 'bottom'];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='body' />
    <text @selector='label' />
`;

export default class Zone extends Shape {

    // An area of the drawing (its name): never a part of the plant - no ID (see `plant/tags.ts`)
    get tagPrefix(): string | null {
        return null;
    }

    get rotatable(): boolean {
        return false;
    }

    // Not smaller than its tip takes
    get resizable(): Resizable {
        return { minWidth: MIN_SIZE.width, minHeight: MIN_SIZE.height };
    }

    // The tip out of the box on its side
    get overflow(): Overflow {
        const side: TipSide = this.get('tipSide') ?? 'left';
        return { bottom: 0, [side]: TIP_DEPTH };
    }

    // Its color: the fill; its outline: the border; its accent: the text (of the medium of the pipe it stands for)
    get colorField(): ColorField {
        return { path: ['style', 'color'], part: ['body', 'fill'] };
    }

    get outlineField(): ColorField {
        return { path: ['style', 'outline'], part: ['body', 'stroke'] };
    }

    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['label', 'fill'] };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Zone',
            // Its label (see `from-model`)
            label: { text: 'Zone' },
            size: {
                width: 100,
                height: 40
            },
            attrs: {
                body: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { stroke: 'outline', fill: 'color', strokeWidth: 'outlineWidth' },
                    fill: 'var(--shape-face)',
                    stroke: 'var(--shape-zone-stroke)',
                    strokeWidth: 1,
                    // The outline: of its `tipSide` (see `tip-side` below), on the left by default
                    tipSide: 'left'
                },
                label: {
                    // In the colors of its style (see `from-style.ts`)
                    fromStyle: { fill: 'accent' },
                    // The text of the label of the model (see `from-model`)
                    fromModel: { text: ['label', 'text'] },
                    // On as many lines as the zone is high, cut with an ellipsis; in the size of the labels of the diagram
                    // (its style, see `diagram-style.ts`) - all the zones alike, as off-page connectors
                    textWrap: {
                        width: 'calc(w - 10)',
                        height: 'calc(h - 4)',
                        ellipsis: true
                    },
                    style: { fontSize: 'var(--style-label-size, 14px)' },
                    fontFamily: 'sans-serif',
                    fontWeight: 700,
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
        ...Shape.attributes,
        // The outline of the body for its size, the tip on the side (`tipSide` in the attributes:
        // the names are looked up in the kebab case).
        'tip-side': {
            set(this: dia.ElementView, side: TipSide, refBBox: dia.BBox) {
                // Its own side (set in the inspector), else the default one
                side = this.model.get('tipSide') ?? side;
                return { d: zoneOutline(TIP_SIDES.includes(side) ? side : 'left', refBBox.width, refBBox.height) };
            },
            unset: 'd'
        }
    };
}
