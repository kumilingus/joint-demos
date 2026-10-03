import { dia, type g } from '@joint/plus';
import { LABEL_COLOR } from '../../const';
import { getFootprint } from '../footprint';

/**
 * Where the label of a shape is: below it (the default - as the shape draws it), above it, on its left or right -
 * of the shape as it is seen: a rotated element keeps its label on that side, horizontal.
 */
export type LabelPosition = 'bottom' | 'top' | 'left' | 'right';

// The space between a shape and its label, unless the label has a gap of its own (see `labelGap`)
const DEFAULT_GAP = 8;


type TextAttributes = Record<string, unknown>;

/** The point rotated by the angle (in degrees) around the center */
function rotate(x: number, y: number, angle: number, cx: number, cy: number): { x: number; y: number } {
    const radians = angle * Math.PI / 180;
    const [cos, sin] = [Math.cos(radians), Math.sin(radians)];
    return { x: cx + (x - cx) * cos - (y - cy) * sin, y: cy + (x - cx) * sin + (y - cy) * cos };
}

type Point = { x: number; y: number };

/**
 * How far the outline (a polygon) reaches within a band: of the points of it with the coordinate across (`y` for a
 * horizontal reach, `x` for a vertical one) from `low` to `high`, the furthest coordinate along (`x`, `y`) - the largest
 * one (`direction` 1) or the smallest one (-1).
 */
function extentInBand(corners: Point[], horizontal: boolean, low: number, high: number, direction: 1 | -1): number {
    const across = (p: Point) => (horizontal ? p.y : p.x);
    const along = (p: Point) => (horizontal ? p.x : p.y);
    const values: number[] = [];
    corners.forEach((a, i) => {
        const b = corners[(i + 1) % corners.length];
        if (across(a) >= low && across(a) <= high) values.push(along(a));
        // Where the edge crosses the lines of the band
        [low, high].forEach((line) => {
            const [from, to] = [across(a), across(b)];
            if ((from - line) * (to - line) >= 0 || from === to) return;
            const t = (line - from) / (to - from);
            values.push(along(a) + t * (along(b) - along(a)));
        });
    });
    // The band misses the outline (it can't: it is centered on the center, inside)
    if (values.length === 0) return 0;
    return direction === 1 ? Math.max(...values) : Math.min(...values);
}

interface Layout {
    x: number;
    y: number;
    anchor: string;
    verticalAnchor: string;
    // Turning the text back to horizontal (a rotated element)
    transform?: string;
}

/** The corners of the box (in the coordinates of the element) as they are seen: rotated with the element, around its center */
function seenCorners(element: dia.Element, x: number, y: number, width: number, height: number): Point[] {
    const size = element.size();
    const [cx, cy] = [size.width / 2, size.height / 2];
    const angle = element.angle();
    return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]].map(([px, py]) => rotate(px, py, angle, cx, cy));
}

/** The bounding box of the element as it is seen (rotated), in its coordinates */
export function seenBBox(element: dia.Element): { x: number; y: number; width: number; height: number } {
    const { width, height } = element.size();
    const corners = seenCorners(element, 0, 0, width, height);
    const xs = corners.map(p => p.x);
    const ys = corners.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

/**
 * Where a box of the size is beside the element, on the side as it is seen (the element rotated or not) - clear of
 * its drawing (the element, its pipe stubs, its overflow: see `getFootprint()`) by the gap: the middle of the edge of the
 * box towards the element, in the coordinates of the element as it is seen (its position the origin, not rotated).
 * Across the side the box is centered on the center of the element; along it, as far as the drawing reaches in its band.
 */
export function besideElement(element: dia.Element, side: LabelPosition, size: { width: number; height: number }, gap: number): Point {
    const bbox = element.getBBox();
    const footprint = getFootprint(element, { label: false });
    const corners = seenCorners(element, footprint.x - bbox.x, footprint.y - bbox.y, footprint.width, footprint.height);
    const [cx, cy] = [bbox.width / 2, bbox.height / 2];
    const horizontal = side === 'left' || side === 'right';
    const half = (horizontal ? size.height : size.width) / 2;
    const band = horizontal ? [cy - half, cy + half] : [cx - half, cx + half];
    const reach = extentInBand(corners, horizontal, band[0], band[1], side === 'right' || side === 'bottom' ? 1 : -1);
    return {
        x: horizontal ? reach + (side === 'right' ? gap : -gap) : cx,
        y: horizontal ? cy : reach + (side === 'bottom' ? gap : -gap)
    };
}

/** The side of the label (see `LabelPosition`), the bottom if none */
export function sideOf(position: unknown): LabelPosition {
    return position === 'top' || position === 'left' || position === 'right' ? position : 'bottom';
}

/**
 * The layout of the label at its position: the point, the horizontal and the vertical anchor of the text - beside the
 * element on the side as it is seen (see `besideElement()`), the text kept horizontal. `null` below an element not
 * rotated: as the shape draws it.
 */
function layoutOf(view: dia.ElementView, position: unknown, gap: number, size: { width: number; height: number }): Layout | null {
    const side = sideOf(position);
    const element = view.model as dia.Element;
    const angle = element.angle();
    if (side === 'bottom' && angle % 360 === 0) return null;
    const point = besideElement(element, side, size, gap);
    const anchors = {
        bottom: { anchor: 'middle', verticalAnchor: 'top' },
        top: { anchor: 'middle', verticalAnchor: 'bottom' },
        left: { anchor: 'end', verticalAnchor: 'middle' },
        right: { anchor: 'start', verticalAnchor: 'middle' }
    }[side];
    // ... in the coordinates of the element (turned back with it: the text is drawn in its view)
    const { width, height } = element.size();
    const { x, y } = rotate(point.x, point.y, -angle, width / 2, height / 2);
    return { ...anchors, x, y, ...(angle % 360 !== 0 ? { transform: `rotate(${-angle},${x},${y})` } : {}) };
}

/**
 * The text laid out at its label position (if it has one, see `labelPosition`): drawn by the built-in definition
 * with the `x` and the vertical anchor of the layout (its lines are placed by them), the point, the anchor and the
 * transform of the layout set on the node - the transform always (none: the identity), one left from a rotation
 * before is not removed.
 */
function positioned(
    view: dia.ElementView,
    set: dia.Cell.SetCallback<dia.ElementView>,
    value: unknown,
    refBBox: g.Rect,
    node: Element,
    attrs: TextAttributes
): ReturnType<dia.Cell.SetCallback<dia.ElementView>> {
    // None: a text of its own (not a label at a side of the shape)
    if (attrs['label-position'] == null) return set.call(view, value, refBBox, node, attrs, view);
    const gap = attrs['label-gap'] == null ? DEFAULT_GAP : Number(attrs['label-gap']);
    // The text drawn first: its size (the box kept clear of the shape)
    set.call(view, value, refBBox, node, attrs, view);
    const { width, height } = (node as SVGGraphicsElement).getBBox();
    const layout = layoutOf(view, attrs['label-position'], gap, { width, height });
    const transform = layout?.transform ?? 'matrix(1,0,0,1,0,0)';
    if (!layout) return { transform };
    set.call(view, value, refBBox, node, { ...attrs, x: layout.x, 'text-vertical-anchor': layout.verticalAnchor }, view);
    return { x: layout.x, y: layout.y, 'text-anchor': layout.anchor, transform };
}

// The built-in definitions of the text (of an element without the ones of the shapes): their `set` called with the layout
const text = dia.Element.getAttributeDefinition('text')!;
const textWrap = dia.Element.getAttributeDefinition('text-wrap')!;
const textSet = text.set as dia.Cell.SetCallback<dia.ElementView>;
const textWrapSet = textWrap.set as dia.Cell.SetCallback<dia.ElementView>;

/**
 * The special attributes of the label of a shape: `labelPosition` (see `LabelPosition`) - read by the text (`text`,
 * `textWrap`) laid out at it: the point and the anchors of the text, the lines of the text placed by them.
 */
export const labelPositionAttributes: Record<string, dia.Cell.PresentationAttributeDefinition<dia.ElementView>> = {
    'label-position': {
        // Not an attribute of the node (no `set`): read by the text
    },
    'label-gap': {
        // The space between the shape (as it is drawn: its pipe stubs, its overflow - see `getFootprint()`) and its
        // label at its position (8 unless set); not an attribute of the node: read by the text
    },
    text: {
        ...text,
        set(this: dia.ElementView, value: unknown, refBBox: g.Rect, node: Element, attrs: TextAttributes) {
            return positioned(this, textSet, value, refBBox, node, attrs);
        }
    },
    'text-wrap': {
        ...textWrap,
        set(this: dia.ElementView, value: unknown, refBBox: g.Rect, node: Element, attrs: TextAttributes) {
            return positioned(this, textWrapSet, value, refBBox, node, attrs);
        }
    }
};

/** The label of a shape: below it (see `LabelPosition`), as most of the shapes have it */
export const labelAttributes = {
    // Below the shape - as it is seen: kept horizontal when the element is rotated (see `labelPositionAttributes`)
    labelPosition: 'bottom',
    textAnchor: 'middle',
    textVerticalAnchor: 'top',
    x: 'calc(0.5*w)',
    y: 'calc(h+10)',
    fontSize: 14,
    fontFamily: 'sans-serif',
    fill: LABEL_COLOR
};
