/*
 * Packing of rectangles into a strip of a fixed width (as short as possible): the skyline
 * bottom-left algorithm. The skyline is the top edge of what has been packed so far,
 * as horizontal segments from the left to the right; each rectangle (in turn, in a few orders)
 * goes where it would be the highest (the leftmost of such places), resting on the skyline.
 */

export interface PackItem<T> {
    data: T;
    width: number;
    height: number;
}

export interface Placement<T> {
    data: T;
    x: number;
    y: number;
}

export interface PackOptions {
    /** The space between the rectangles */
    gap?: number;
    /** Where the packed rectangles are in the strip (if they don't take all of its width), default `left` */
    align?: 'left' | 'middle' | 'right';
}

export interface Packing<T> {
    placements: Array<Placement<T>>;
    width: number;
    height: number;
}

/** A part of the skyline: `width` from `x` at the height `y` (downwards from the top of the strip). */
interface Segment {
    x: number;
    y: number;
    width: number;
}

/**
 * Where a rectangle of the width would rest on the skyline if its left side was at the segment:
 * on the highest segment under it (the one reaching the lowest). `null` if it doesn't fit the strip.
 */
function restingY(skyline: Segment[], index: number, width: number, stripWidth: number): number | null {
    const { x } = skyline[index];
    if (x + width > stripWidth) return null;
    let y = 0;
    for (let i = index; i < skyline.length && skyline[i].x < x + width; i++) {
        y = Math.max(y, skyline[i].y);
    }
    return y;
}

/** Raise the skyline where the rectangle has been put. */
function addToSkyline(skyline: Segment[], x: number, y: number, width: number): Segment[] {
    const right = x + width;
    const next: Segment[] = [];
    skyline.forEach((segment) => {
        const segmentRight = segment.x + segment.width;
        // The parts of the segment not covered by the rectangle stay.
        if (segment.x < x) {
            next.push({ x: segment.x, y: segment.y, width: Math.min(segmentRight, x) - segment.x });
        }
        if (segmentRight > right) {
            const left = Math.max(segment.x, right);
            next.push({ x: left, y: segment.y, width: segmentRight - left });
        }
    });
    next.push({ x, y, width });
    next.sort((a, b) => a.x - b.x);
    // The neighbors at the same height are one segment.
    return next.reduce<Segment[]>((merged, segment) => {
        const last = merged[merged.length - 1];
        if (last && last.y === segment.y && last.x + last.width === segment.x) {
            last.width += segment.width;
        } else {
            merged.push({ ...segment });
        }
        return merged;
    }, []);
}

type Order = (a: PackItem<unknown>, b: PackItem<unknown>) => number;

/**
 * The orders to try: the result of the greedy packing depends on the order, the shortest one is taken.
 * The tallest first is tried first (the short rectangles fill the room next to the tall ones).
 */
const ORDERS: Order[] = [
    (a, b) => (b.height - a.height) || (b.width - a.width),
    (a, b) => (b.width - a.width) || (b.height - a.height),
    (a, b) => (b.width * b.height - a.width * a.height),
    (a, b) => (Math.max(b.width, b.height) - Math.max(a.width, a.height))
];

/** Pack the rectangles in the order into the strip of the width (the gaps included). */
function packInOrder<T>(ordered: Array<PackItem<T>>, width: number, gap: number): Packing<T> {
    let skyline: Segment[] = [{ x: 0, y: 0, width }];
    const placements: Array<Placement<T>> = [];
    let packedWidth = 0;
    let packedHeight = 0;
    ordered.forEach((item) => {
        const itemWidth = item.width + gap;
        const itemHeight = item.height + gap;
        // Something always fits: the strip is as wide as the widest rectangle.
        let x = 0;
        let y = Infinity;
        for (let index = 0; index < skyline.length; index++) {
            const restingOn = restingY(skyline, index, itemWidth, width);
            if (restingOn === null || restingOn >= y) continue;
            [x, y] = [skyline[index].x, restingOn];
        }
        placements.push({ data: item.data, x, y });
        skyline = addToSkyline(skyline, x, y + itemHeight, itemWidth);
        packedWidth = Math.max(packedWidth, x + item.width);
        packedHeight = Math.max(packedHeight, y + item.height);
    });
    return { placements, width: packedWidth, height: packedHeight };
}

/**
 * Pack the rectangles into a strip of the width, as short as possible. A rectangle wider
 * than the strip makes the strip wider (it is put on its own).
 */
export function pack<T>(items: Array<PackItem<T>>, stripWidth: number, options: PackOptions = {}): Packing<T> {
    const { gap = 0, align = 'left' } = options;
    // Each rectangle takes the gap on its right and below it (the strip is wider by one gap for the last one).
    const width = Math.max(stripWidth, ...items.map(item => item.width)) + gap;
    const packing = ORDERS
        .map(order => packInOrder([...items].sort(order), width, gap))
        .reduce((best, candidate) => (candidate.height < best.height ? candidate : best));
    const room = width - gap - packing.width;
    const offset = align === 'middle' ? room / 2 : align === 'right' ? room : 0;
    if (offset > 0) packing.placements.forEach((placement) => { placement.x += offset; });
    return packing;
}
