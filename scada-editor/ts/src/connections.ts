import { type dia, g } from '@joint/plus';
import { GRID_SIZE } from './const';
import Shape from './shapes/Shape';

/*
 * Where the end of a pipe connects (when its arrowhead is dropped or snapped):
 * to the center of a port (a pipe stub), or to a side of an element - pinned to the side,
 * in the steps of the grid, or to the middle of the side (`Shape.anchors`).
 * The arrowhead moves the anchor too: there is no anchor tool.
 */

/**
 * The point on a side of the element nearest to the pointer, relative to the element
 * (its unrotated bounding box). Along the side, it moves in the steps of the grid
 * (the corners and the middles of the sides are on the grid: the sizes are in two grid steps),
 * or it stays in the middle of the side.
 */
function pinToSide(element: dia.Element, coords: g.PlainPoint): g.Point {
    const bbox = element.getBBox();
    const { width, height } = bbox;
    const relative = new g.Point(coords).rotate(bbox.center(), element.angle()).difference(bbox.topLeft());
    const point = new g.Rect(0, 0, width, height).pointNearestToPoint(relative);
    const snap = (value: number, max: number) => Math.max(0, Math.min(max, g.snapToGrid(value, GRID_SIZE)));
    const onVerticalSide = point.x === 0 || point.x === width;
    const middles = Shape.isShape(element) && element.anchors === 'middles';
    if (onVerticalSide) {
        point.y = middles ? height / 2 : snap(point.y, height);
    } else {
        point.x = middles ? width / 2 : snap(point.x, width);
    }
    return point;
}

/** A part of the length as a percentage (`'37.5%'`) */
const percent = (value: number, length: number) => `${length > 0 ? Number((value / length * 100).toFixed(3)) : 0}%`;

export const connectionStrategy: dia.Paper.Options['connectionStrategy'] = (end, view, magnet, coords) => {
    // A port: the default anchor of the paper (the center of the pipe stub)
    if (view.findAttribute('port', magnet)) {
        delete end.anchor;
        return end;
    }
    const element = view.model as dia.Element;
    const { x, y } = pinToSide(element, coords);
    const { width, height } = element.size();
    // Relative to the size: the end stays on its side when the element is resized.
    end.anchor = { name: 'topLeft', args: { dx: percent(x, width), dy: percent(y, height), rotate: true, useModelGeometry: true }};
    return end;
};
