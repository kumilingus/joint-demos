import { type dia, g } from '@joint/plus';
import { GRID_SIZE, PIPE_COLOR } from './const';
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
    const { width, height } = element.size();
    const point = new g.Rect(0, 0, width, height).pointNearestToPoint(element.getRelativePointFromAbsolute(coords));
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

/**
 * The point of the element under the pointer, relative to the element (its unrotated bounding box),
 * inside it: where an arrow points.
 */
function pinAnywhere(element: dia.Element, coords: g.PlainPoint): g.Point {
    const { width, height } = element.size();
    const { x, y } = element.getRelativePointFromAbsolute(coords);
    // Inside it as it is (dropped a little outside: on its edge)
    return new g.Point(Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y)));
}

export const connectionStrategy: dia.Paper.Options['connectionStrategy'] = (end, view, magnet, coords, link) => {
    const element = view.model as dia.Element;
    const { width, height } = element.size();
    // An arrow points anywhere on the element (see `Arrow`): pinned where it is dropped
    if (link.get('type') === 'Arrow') {
        const { x, y } = pinAnywhere(element, coords);
        end.anchor = { name: 'topLeft', args: { dx: percent(x, width), dy: percent(y, height), rotate: true, useModelGeometry: true }};
        return end;
    }
    // A port: the default anchor of the paper (the center of the pipe stub)
    if (view.findAttribute('port', magnet)) {
        delete end.anchor;
        return end;
    }
    const { x, y } = pinToSide(element, coords);
    // Relative to the size: the end stays on its side when the element is resized.
    end.anchor = { name: 'topLeft', args: { dx: percent(x, width), dy: percent(y, height), rotate: true, useModelGeometry: true }};
    return end;
};

/**
 * The color of the pipe an element sits on (the pipe seen through the window of a control valve):
 * of the pipe coming in, else of the one going out, else the default one.
 */
export function pipeColorAt(graph: dia.Graph, element: dia.Element): string {
    const pipes = graph.getConnectedLinks(element).filter(link => link.get('type') === 'Pipe');
    const incoming = pipes.find(pipe => pipe.target().id === element.id);
    const pipe = incoming ?? pipes.find(pipe => pipe.source().id === element.id);
    return pipe ? String(pipe.attr('line/stroke') ?? PIPE_COLOR) : PIPE_COLOR;
}
