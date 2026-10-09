import { type dia, g } from '@joint/plus';
import { LABEL_COLOR } from '../../const';
import { getFootprint } from '../common/footprint';
import { flipOf } from './flip';
import { builtInSet } from './built-in';
import { getTag } from '../common/tag';
import { getStyle, LABEL_SIZES } from '../../diagram-style';

/**
 * Where the label of a shape is: below it (the default - as the shape draws it), above it, on its left or right -
 * of the shape as it is seen: a rotated element keeps its label on that side, horizontal.
 */
export type LabelPosition = 'bottom' | 'top' | 'left' | 'right';

// The space between a shape and its label
const LABEL_GAP = 8;

type TextAttributes = Record<string, unknown>;

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
        if (across(a) >= low && across(a) <= high) {
            values.push(along(a));
        }
        // Where the edge crosses the lines of the band
        [low, high].forEach((line) => {
            const [from, to] = [across(a), across(b)];
            if ((from - line) * (to - line) >= 0 || from === to) {
                return;
            }
            const t = (line - from) / (to - from);
            values.push(along(a) + t * (along(b) - along(a)));
        });
    });
    // The band misses the outline (it can't: it is centered on the center, inside)
    if (values.length === 0) {
        return 0;
    }
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
    // Clockwise (`g.Point.rotate()` turns the other way)
    const center = new g.Point(cx, cy);
    return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]].map(([px, py]) => new g.Point(px, py).rotate(center, -angle));
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

/** How much further from the shape the label is (see `ModelLabel.offset`): 0 if none */
export function labelOffset(label: ModelLabel | undefined): number {
    return Math.max(0, Number(label?.offset) || 0);
}

/** The side of the label (see `LabelPosition`), the bottom if none */
export function sideOf(position: unknown): LabelPosition {
    return position === 'top' || position === 'left' || position === 'right' ? position : 'bottom';
}

/**
 * Whether the label below the element is where the shape draws it (its own `y`, clear of its drawing): not when the
 * element is flipped vertically (its drawing mirrored up and down, see `flip.ts`; horizontally nothing below changes),
 * nor when its pipe stubs point down (the outlets of a manifold)
 */
function drawnBelowAsIs(element: dia.Element): boolean {
    if (flipOf(element).includes('y')) {
        return false;
    }
    const groups = Object.keys(element.prop(['ports', 'groups']) ?? {});
    return !groups.some(group => Object.values(element.getPortsPositions(group)).some(({ angle }) => angle === 90));
}

/**
 * The layout of the label at its position: the point, the horizontal and the vertical anchor of the text - beside the
 * element on the side as it is seen (see `besideElement()`), the text kept horizontal. `null` below an element not
 * rotated: as the shape draws it.
 */
function layoutOf(view: dia.ElementView, position: unknown, gap: number, size: { width: number; height: number }): Layout | null {
    const side = sideOf(position);
    const element = view.model;
    const angle = element.angle();
    if (side === 'bottom' && angle % 360 === 0 && drawnBelowAsIs(element)) {
        return null;
    }
    const point = besideElement(element, side, size, gap);
    const anchors = {
        bottom: { anchor: 'middle', verticalAnchor: 'top' },
        top: { anchor: 'middle', verticalAnchor: 'bottom' },
        left: { anchor: 'end', verticalAnchor: 'middle' },
        right: { anchor: 'start', verticalAnchor: 'middle' }
    }[side];
    // ... in the coordinates of the element (turned back with it: the text is drawn in its view)
    const { width, height } = element.size();
    const { x, y } = new g.Point(point).rotate(new g.Point(width / 2, height / 2), angle);
    const layout: Layout = { ...anchors, x, y };
    // Rotated: turned back to horizontal
    if (angle % 360 !== 0) {
        layout.transform = `rotate(${-angle},${x},${y})`;
    }
    return layout;
}

/**
 * The text drawn by the built-in definition, at the position of the label if it has one: drawn first (its size, the
 * box kept clear of the shape), then with the `x` and the vertical anchor of the layout (its lines are placed by them);
 * the point, the anchor and the transform of the layout set on the node - the transform always (none: the identity),
 * one left from a rotation before is not removed.
 */
function drawText(
    view: dia.ElementView,
    set: dia.Cell.SetCallback<dia.ElementView>,
    value: unknown,
    refBBox: g.Rect,
    node: Element,
    attrs: TextAttributes,
    label: ModelLabel | undefined
): TextAttributes | undefined {
    set.call(view, value, refBBox, node, attrs, view);
    const position = label?.position;
    // None: a text of its own (not a label at a side of the shape)
    if (!position || !(node instanceof SVGGraphicsElement)) {
        return undefined;
    }
    const offset = labelOffset(label);
    const { width, height } = node.getBBox();
    const layout = layoutOf(view, position, LABEL_GAP + offset, { width, height });
    // Below, as the shape draws it: moved down by the offset
    if (!layout) {
        return { transform: `matrix(1,0,0,1,0,${offset})` };
    }
    const transform = layout.transform ?? 'matrix(1,0,0,1,0,0)';
    set.call(view, value, refBBox, node, { ...attrs, x: layout.x, 'text-vertical-anchor': layout.verticalAnchor }, view);
    return { x: layout.x, y: layout.y, 'text-anchor': layout.anchor, transform };
}

/** The font size of the labels of the diagram of the element (its style), none for an element of no diagram (the palette) */
function styleLabelSize(element: dia.Element): TextAttributes {
    const { graph } = element;
    return graph ? { 'font-size': LABEL_SIZES[getStyle(graph).labelSize ?? 'medium'].px } : {};
}

/** A part of a text in bold (the built-in `annotations` of a text) */
type TextAnnotation = { start: number; end: number; attrs: TextAttributes };

/**
 * The text of the label of a shape: its name, its ID (the tag), or both - the ID in bold above the name - as the diagram
 * shows them (`labels` of its style, see `diagram-style.ts`; none - a shape of the palette: the name). The ID alone (in
 * bold with the name) if it has no name; a shape without an ID (not bound to the plant) its name only.
 */
function shapeLabelText(model: dia.Element, name: string): { text: string; annotations?: TextAnnotation[] } {
    const content = model.graph ? getStyle(model.graph).labels : undefined;
    const tag = getTag(model);
    if (!tag || !content || content === 'name') {
        return { text: name };
    }
    if (content === 'tag') {
        return { text: tag };
    }
    // The ID in bold (alone if there is no name)
    const annotations = [{ start: 0, end: tag.length, attrs: { 'font-weight': 700 }}];
    return { text: name ? `${tag}\n${name}` : tag, annotations };
}

// The built-in definitions of the text: their `set` called with the layout
const textSet = builtInSet('text');
const textWrapSet = builtInSet('text-wrap');

export const fromModelAttributes: Record<string, dia.Cell.PresentationAttributeDefinition<dia.ElementView>> = {
    // Read by `from-model` (wrapping the text of the model), not drawn by itself: the built-in one would draw over it
    'text-wrap': {},
    /**
     * `fromModel: { text: path }` in the attributes: the text of the model at the path (`['label', 'text']`, `['unit']`) -
     * not stored in the attributes. A label (`['label', …]`): at its position (`label.position`, see `LabelPosition`), none -
     * where the shape draws it; the size, the weight, the styles, the alignment (`label.size`, `label.weight`,
     * `label.styles`, `label.align`) of a text of its own (the Label shape). The label of a shape (`shapeLabel`, see
     * `labelAttributes`): its name, its ID or both, as the diagram shows them (see `shapeLabelText()`).
     */
    'from-model': {
        set(this: dia.ElementView, { text: path, shapeLabel }: FromModel, refBBox: g.Rect, node: Element, attrs: TextAttributes) {
            const { model } = this;
            const value = model.prop(path);
            const name = value == null ? '' : String(value);
            const { text, annotations } = shapeLabel ? shapeLabelText(model, name) : { text: name, annotations: undefined };
            const label: ModelLabel | undefined = path[0] === 'label' ? model.get('label') : undefined;
            const own: TextAttributes = {
                ...(label?.size ? { 'font-size': label.size } : {}),
                ...(label?.weight ? { 'font-weight': label.weight } : {}),
                ...(label?.styles ? textStyleAttributes(label.styles) : {}),
                // Aligned in its box (a text of its own: the Label shape)
                ...(label?.align ? alignedText(label.align, refBBox) : {})
            };
            const wrap = attrs['text-wrap'];
            // Wrapped, in the label size of the diagram (a zone: the CSS sizes its text, see `--style-label-size`) -
            // measured in it too, unless it has a size of its own
            const measured = wrap && !label?.size ? styleLabelSize(model) : {};
            const textAttrs: TextAttributes = { ...attrs, ...measured, ...own, text, ...(annotations ? { annotations } : {}) };
            const drawn = wrap
                ? drawText(this, textWrapSet, wrap, refBBox, node, textAttrs, label)
                : drawText(this, textSet, text, refBBox, node, textAttrs, label);
            if (!drawn) {
                return own;
            }
            return { ...own, ...drawn };
        }
    }
};

/** `fromModel` in the attributes: the path of the text in the model; the label of a shape (its name, its ID or both) */
interface FromModel {
    text: string[];
    shapeLabel?: boolean;
}

/** The label of an element in its model: its text, its position; the size, the weight, the styles, the alignment of a text of its own */
export interface ModelLabel {
    text?: string;
    position?: LabelPosition;
    /** How much further from the shape it is (px): clear of what is drawn beside it (a pipe under a silo) */
    offset?: number;
    size?: number;
    weight?: number;
    styles?: TextStyle[];
    align?: TextAlign;
}

/** A style of a text (several at once): its slant, its lines */
export type TextStyle = 'italic' | 'underline' | 'line-through';

const DECORATIONS: TextStyle[] = ['underline', 'line-through'];

/** The SVG attributes of the styles of a text (`font-style`, `text-decoration`) */
function textStyleAttributes(styles: TextStyle[]): TextAttributes {
    const decorations = DECORATIONS.filter(style => styles.includes(style));
    return {
        'font-style': styles.includes('italic') ? 'italic' : 'normal',
        'text-decoration': decorations.length > 0 ? decorations.join(' ') : 'none'
    };
}

/** The alignment of a text in its box */
export type TextAlign = 'left' | 'middle' | 'right';

/** The x and the anchor of a text aligned in the box */
function alignedText(align: TextAlign, { width }: g.Rect): TextAttributes {
    const x = { left: 0, middle: width / 2, right: width }[align] ?? width / 2;
    const anchor = { left: 'start', middle: 'middle', right: 'end' }[align] ?? 'middle';
    return { x, 'text-anchor': anchor };
}

/** The label of a shape: below it (see `LabelPosition`), as most of the shapes have it */
export const labelAttributes = {
    // The text of the label of the model, at its position - the name, the ID or both (see `from-model`)
    fromModel: { text: ['label', 'text'], shapeLabel: true },
    textAnchor: 'middle',
    textVerticalAnchor: 'top',
    x: 'calc(0.5*w)',
    y: 'calc(h+10)',
    fontSize: 14,
    fontFamily: 'sans-serif',
    fill: LABEL_COLOR,
    // Its size and color: of the style of the diagram (see `diagram-style.ts`, `.scada-shape-label` in `shapes.css`)
    class: 'scada-shape-label'
};

// The height of a line of a label (of its size)
const LINE_HEIGHT = 1.2;

/**
 * How far the label of the element reaches out of its drawing on the side (with the gap), if it is there (see
 * `LabelPosition`; none set - below): its lines (see `shapeLabelText()`) in the label size of the diagram - of the model,
 * not measured; 0 otherwise
 */
export function labelReach(element: dia.Element, side: 'top' | 'bottom'): number {
    if (sideOf(element.prop(['label', 'position'])) !== side) {
        return 0;
    }
    const name = element.prop(['label', 'text']);
    const { text } = shapeLabelText(element, name == null ? '' : String(name));
    if (!text) {
        return 0;
    }
    const size = LABEL_SIZES[(element.graph && getStyle(element.graph).labelSize) || 'medium'].px;
    return text.split('\n').length * size * LINE_HEIGHT + LABEL_GAP + labelOffset(element.get('label'));
}
