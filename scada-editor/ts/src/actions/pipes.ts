import { type dia, g } from '@joint/plus';
import type { App } from '../app';
import { GRID_SIZE } from '../const';
import Join from '../shapes/models/piping/Join';
import { selectCell } from './selection';
import { rememberEndDirections, sideOf, type LinkEnd } from '../shapes/common/routing';

/*
 * A pipe split at a point: into two pipes, or with a join inserted. The elements disconnected from their links.
 */

/** A link split at a point (see `splitLink()`, `insertJoin()`): its halves, not in the graph yet */
interface SplitLink {
    point: g.Point;
    first: dia.Link;
    second: dia.Link;
    /** The direction of the route at the point: from the first half to the second one */
    direction: g.Point;
}

/**
 * The link split at the point of its route nearest to the point (snapped to the grid) into two links with
 * disconnected ends there: the first one from the source, the second one to the target, each with the vertices on its side.
 * The route is the rendered one (the link is under the pointer, its view rendered): the vertices before the point
 * along it go to the first half, the direction of the route there says from where the halves come.
 */
function splitAt(app: App, link: dia.Link, point: dia.Point): SplitLink {
    const view = app.paper.requireView<dia.LinkView>(link);
    const length = view.getClosestPointLength(point);
    const split = view.getPointAtLength(length).snapToGrid(GRID_SIZE);
    const tangent = view.getTangentAtLength(length);
    const direction = tangent ? tangent.end.difference(tangent.start) : new g.Point(1, 0);
    const vertices = link.vertices();
    const isBefore = (vertex: dia.Point) => view.getClosestPointLength(vertex) < length;
    const first = link.clone();
    first.set({ target: split.toJSON(), vertices: vertices.filter(isBefore) });
    const second = link.clone();
    second.set({ source: split.toJSON(), vertices: vertices.filter(vertex => !isBefore(vertex)) });
    return { point: split, first, second, direction };
}

/** Split the link at the point into two links with disconnected ends there: the first one selected, one step of the history. */
export function splitLink(app: App, link: dia.Link, point: dia.Point): void {
    const { graph } = app;
    const { first, second } = splitAt(app, link, point);
    graph.startBatch('split-link');
    link.remove();
    graph.addCells([first, second]);
    graph.stopBatch('split-link');
    selectCell(app, first);
}

/**
 * Insert a join into the pipe at the point: the pipe split there (see `splitAt()`), both halves connected
 * to the join centered at the point, each to the side it comes from along the route. The join selected
 * (a branch can be added to it), one step of the history.
 */
export function insertJoin(app: App, link: dia.Link, point: dia.Point): void {
    const { graph } = app;
    const { point: center, first, second, direction } = splitAt(app, link, point);
    const join = new Join();
    join.position(center.x - join.size().width / 2, center.y - join.size().height / 2);
    const end = (side: string) => ({
        id: join.id,
        anchor: { name: side, args: { useModelGeometry: true, rotate: true }},
        connectionPoint: { name: 'anchor' }
    });
    // The first half comes in against the direction of the route, the second one goes on in it.
    first.set({ target: end(sideOf(direction.clone().scale(-1, -1))) });
    second.set({ source: end(sideOf(direction)) });
    graph.startBatch('insert-join');
    link.remove();
    graph.addCells([join, first, second]);
    graph.stopBatch('insert-join');
    selectCell(app, join);
}

/** The ends of the links attached to the selected elements (to their members too: a group) */
export function connectedEnds(app: App): Array<[dia.Link, 'source' | 'target']> {
    const { graph, selection } = app;
    const elements = selection.filter(cell => cell.isElement());
    const ids = new Set(elements.flatMap(element => [element, ...element.getEmbeddedCells({ deep: true })]).map(cell => cell.id));
    const links = new Set(elements.flatMap(element => graph.getConnectedLinks(element, { deep: true })));
    return [...links].flatMap(link => (['source', 'target'] as const)
        .filter((end) => {
            const id = link.get(end)?.id;
            return id !== undefined && ids.has(id);
        })
        .map((end): [dia.Link, LinkEnd] => [link, end]));
}

// How far the disconnected elements move: off the disconnected ends (a gap shows they are not connected)
const DISCONNECT_SHIFT = 2 * GRID_SIZE;

/**
 * The selected elements disconnected: the ends of their links disconnected where they are drawn (the end points of the
 * rendered links), the elements moved off them. One step of the history.
 */
export function disconnectSelection(app: App): void {
    const { graph, paper } = app;
    // The ends disconnected of each link (both of them: a link between two selected elements)
    const disconnected = new Map<dia.Link, LinkEnd[]>();
    connectedEnds(app).forEach(([link, end]) => disconnected.set(link, [...(disconnected.get(link) ?? []), end]));
    if (disconnected.size === 0) return;
    graph.startBatch('disconnect');
    disconnected.forEach((ends, link) => {
        // Rendered now if it isn't (out of the viewport): the ends as drawn, their directions (the route keeps its shape)
        const view = paper.requireView<dia.LinkView>(link);
        const points = ends.map(end => [end, (end === 'source' ? view.sourcePoint : view.targetPoint).toJSON()] as const);
        rememberEndDirections(link, view, ends);
        points.forEach(([end, point]) => link.prop(end, point, { rewrite: true }));
    });
    // The members of a selected group move with it
    app.selection.toArray().filter((cell): cell is dia.Element => cell.isElement() && !cell.getParentCell())
        .forEach(element => element.translate(DISCONNECT_SHIFT, DISCONNECT_SHIFT));
    graph.stopBatch('disconnect');
}
