import { anchors, type dia, g } from '@joint/plus';
import { GRID_SIZE, PIPE_COLOR } from '../const';
import { DERIVED } from '../history';
import Shape from '../shapes/models/Shape';
import { styleOf } from '../shapes/common/style';

/*
 * Where the end of a pipe connects (when its arrowhead is dropped or snapped):
 * to the center of a port (a pipe stub), or to a side of an element - pinned to the side,
 * in the steps of the grid, or to the middle of the side (`Shape.anchors`). An arrow and a conveyor are pinned where
 * they are dropped (see `connectionStrategy`).
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
    const { model: element } = view;
    // Connected to an element only (see `validateConnection`)
    if (!element.isElement()) {
        return end;
    }
    const { width, height } = element.size();
    const type = link.get('type');
    // An arrow points anywhere on the element (see `Arrow`), a conveyor drops onto (or takes from) the equipment
    // anywhere - on a part drawn out of its box too (a chute): pinned where it is dropped
    if (type === 'Arrow' || type === 'Conveyor') {
        const { x, y } = type === 'Arrow' ? pinAnywhere(element, coords) : element.getRelativePointFromAbsolute(coords);
        end.anchor = { name: 'topLeft', args: { dx: percent(x, width), dy: percent(y, height), rotate: true, useModelGeometry: true }};
        return end;
    }
    // A port: the default anchor of the paper (the center of the pipe stub)
    if (view.findAttribute('port', magnet)) {
        delete end.anchor;
        return end;
    }
    const { x, y } = pinToSide(element, coords);
    // Relative to the size: the end stays on its side when the element is resized - on the grid (see `gridSide`)
    end.anchor = { name: 'gridSide', args: { dx: percent(x, width), dy: percent(y, height), rotate: true, useModelGeometry: true }};
    return end;
};

/** A part of the length (`'37.5%'`) or a length */
const lengthOf = (value: number | string | undefined, length: number) =>
    (typeof value === 'string' && value.endsWith('%') ? parseFloat(value) / 100 * length : Number(value) || 0);

/**
 * The anchor of the end of a pipe on a side of an element (see `connectionStrategy`): the point at the parts of its
 * size (`dx`, `dy`: as `topLeft`), snapped to the grid along the side (of the paper) - the end stays on the grid when
 * the element is resized (a pipe straight between the elements on the grid).
 */
export const gridSide: anchors.GenericAnchor<'topLeft'> = function(this: dia.LinkView, view, magnet, ref, opt, endType, linkView) {
    const { model: element } = view;
    // Of an element only (see `connectionStrategy`): as `topLeft` otherwise
    if (!element.isElement()) {
        return anchors.topLeft.call(this, view, magnet, ref, opt, endType, linkView);
    }
    const { width, height } = element.size();
    const { x: left, y: top } = element.position();
    let x = lengthOf(opt.dx, width);
    let y = lengthOf(opt.dy, height);
    const snap = (value: number, origin: number, max: number) => {
        return Math.max(0, Math.min(max, g.snapToGrid(origin + value, GRID_SIZE) - origin));
    };
    if (x <= 0 || x >= width) {
        y = snap(y, top, height);
    } else {
        x = snap(x, left, width);
    }
    return anchors.topLeft.call(this, view, magnet, ref, { ...opt, dx: x, dy: y }, endType, linkView);
};

/**
 * The color of the pipe an element sits on (the pipe seen through the window of a control valve):
 * of the pipe coming in, else of the one going out, else the default one.
 */
export function pipeColorAt(graph: dia.Graph, element: dia.Element): string {
    const pipes = graph.getConnectedLinks(element).filter(link => link.get('type') === 'Pipe');
    const incoming = pipes.find(pipe => pipe.target().id === element.id);
    const pipe = incoming ?? pipes.find(pipe => pipe.source().id === element.id);
    // Its color (of its style, see `style.ts`), else its own
    return pipe ? String(styleOf(pipe, 'color') ?? pipe.attr('line/stroke') ?? PIPE_COLOR) : PIPE_COLOR;
}

/** The elements showing the pipe they sit on (its color): the control valves (the pipe through the window) */
const SHOWS_PIPE = ['ControlValve'];

/** The element showing its pipe in the color of the pipe (see `pipeColorAt()`): derived, not in the history */
function showPipeColor(graph: dia.Graph, element: dia.Element): void {
    if (!SHOWS_PIPE.includes(element.get('type'))) {
        return;
    }
    const color = pipeColorAt(graph, element);
    if (element.attr('liquid/stroke') !== color) {
        element.attr('liquid/stroke', color, DERIVED);
    }
}

/** All the elements showing their pipes */
export function showPipeColors(graph: dia.Graph): void {
    graph.getElements().forEach(element => showPipeColor(graph, element));
}
