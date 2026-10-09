import { type dia, g } from '@joint/plus';
import type Shape from '../models/Shape';
import { flipOf } from '../attributes/flip';

/** How far the drawing of a shape reaches out of its model bounding box (on top of the default). */
export interface Overflow {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

/** Most of the shapes have their label below them. */
const DEFAULT_OVERFLOW: Overflow = { bottom: 30 };

// The half of the stroke of a pipe
export const PIPE_HALF_WIDTH = 8;

// The flanges at the ends of the pipe stubs are a little taller than the stubs (see `pipeStubGroup()`).
const PORT_END_OVERHANG = 3;

/**
 * How far the drawing of the element reaches out of its bounding box if its label is not shown:
 * the label is the last thing below (above, or on the right of) the shape - the drawing ends where the label starts.
 */
function withoutLabel(element: dia.Element, overflow: Required<Overflow>): Required<Overflow> {
    const { x, y } = element.attr('label') || {};
    // A label of the model (see `from-model`)
    if (element.prop(['label', 'text']) === undefined) {
        return overflow;
    }
    // On the right: `calc(w + 10)` (from the start of the text)
    const right = typeof x === 'string' ? x.match(/^calc\(w\s*\+\s*(\d+(?:\.\d+)?)\)$/) : null;
    if (right) {
        return { ...overflow, right: Math.min(overflow.right, Number(right[1])) };
    }
    // Below: `calc(h + 18)` (from the top of the text)
    const below = typeof y === 'string' ? y.match(/^calc\(h\s*\+\s*(\d+(?:\.\d+)?)\)$/) : null;
    if (below) {
        return { ...overflow, bottom: Math.min(overflow.bottom, Number(below[1])) };
    }
    // Above: `-10` (from the bottom of the text)
    if (typeof y === 'number' && y < 0) {
        return { ...overflow, top: Math.min(overflow.top, -y) };
    }
    return overflow;
}

/**
 * How much further down the label below the element is (`label.offset`, see `ModelLabel`): the room of the label counted
 * in the overflow below (the labels on the other sides are not)
 */
function bottomLabelOffset(element: dia.Element): number {
    const { position = 'bottom', offset = 0 } = element.get('label') ?? {};
    return position === 'bottom' ? Math.max(0, Number(offset) || 0) : 0;
}

export interface FootprintOptions {
    /** Whether the label of the element is shown (and counted), `true` by default */
    label?: boolean;
}

/**
 * The area the cell takes on the paper, computed from the model only:
 * the bounding box, the ports and the overflow of the shape (`Shape.overflow`),
 * with or without its label.
 */
export function getFootprint(cell: dia.Cell, { label = true }: FootprintOptions = {}): g.Rect {
    const bbox = cell.getBBox();
    if (cell.isLink()) {
        return bbox.inflate(PIPE_HALF_WIDTH);
    }
    if (!cell.isElement()) {
        return bbox;
    }

    const element = cell;
    let footprint = bbox.clone();

    // A port is its pipe stub: centered on its position, turned by its angle.
    const groups: Record<string, dia.Element.PortGroup> = element.prop(['ports', 'groups']) || {};
    Object.entries(groups).forEach(([name, group]) => {
        const { width = 0, height = 0 } = group.size || {};
        Object.values(element.getPortsPositions(name)).forEach(({ x, y, angle }) => {
            const stub = new g.Rect(
                bbox.x + x - width / 2,
                bbox.y + y - height / 2 - PORT_END_OVERHANG,
                width,
                height + 2 * PORT_END_OVERHANG
            );
            footprint = footprint.union(stub.bbox(angle));
        });
    });

    // Of a shape (not the class itself: the shapes import this module through their attributes, see `attributes/label.ts`)
    const overflow = 'overflow' in element ? (element as Shape).overflow : {};
    // Flipped (see `flip.ts`): the drawing of the shape reaches out of the other side (not the room of its label below)
    const flip = flipOf(element);
    const own: Overflow = {
        ...overflow,
        ...(flip.includes('x') ? { left: overflow.right, right: overflow.left } : {}),
        ...(flip.includes('y') ? { top: overflow.bottom, bottom: overflow.top } : {})
    };
    const defined = Object.fromEntries(Object.entries(own).filter(([, value]) => value !== undefined));
    const { top = 0, right = 0, bottom = 0, left = 0 } = { ...DEFAULT_OVERFLOW, ...defined };
    const drawing = label
        ? { top, right, bottom: bottom + bottomLabelOffset(element), left }
        : withoutLabel(element, { top, right, bottom, left });
    return footprint.moveAndExpand({
        x: -drawing.left,
        y: -drawing.top,
        width: drawing.left + drawing.right,
        height: drawing.top + drawing.bottom
    });
}
