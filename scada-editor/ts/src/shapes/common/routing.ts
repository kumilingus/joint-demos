import { connectors, dia, g, routers } from '@joint/plus';

/*
 * The routing of a link (a pipe, a signal line) as the user chooses it (its `routing`): the router and the connector
 * of the papers follow from it (`defaultRouter`, `defaultConnector`, see `routingPaperOptions`) - the links store
 * neither (as the link routing presets of `@joint/react`).
 */

/** How a link goes through its vertices. */
export type Routing = 'straight' | 'orthogonal' | 'smooth';

// The corners of the straight and orthogonal pipes are rounded.
const roundedConnector = {
    name: 'straight',
    args: { cornerType: 'cubic', cornerRadius: 20, cornerPreserveAspectRatio: true }
};

/** The router and the connector of each routing. */
const ROUTINGS: Record<Routing, Pick<dia.Link.Attributes, 'router' | 'connector'>> = {
    straight: {
        router: { name: 'normal' },
        connector: roundedConnector
    },
    // The right angles go through the vertices added by the user.
    orthogonal: {
        router: { name: 'orthogonalRouting', args: { useVertices: true }},
        connector: roundedConnector
    },
    // The curve leaves the ends outwards (out of the element, along the pipe stub, see `smoothRouting`).
    smooth: {
        router: { name: 'normal' },
        connector: { name: 'smoothRouting' }
    }
};


/** A side a link leaves an end (of an element, its own when it is disconnected) from */
export type EndDirection = 'top' | 'right' | 'bottom' | 'left';

/** An end of a link */
export type LinkEnd = 'source' | 'target';

/**
 * The direction from the point to the next one: its angle (`theta()`, counter-clockwise) to the nearest side (see
 * `SIDE_BY_ANGLE`, clockwise)
 */
function sideTo(from: dia.Point, to: dia.Point): EndDirection {
    return SIDE_BY_ANGLE[g.normalizeAngle(-Math.round(new g.Point(from).theta(to) / 90) * 90)];
}

/** The direction the link leaves the end in as it is drawn: the tangent of its path there (out of the end), a unit vector */
function drawnDirection(view: dia.LinkView, end: LinkEnd): g.Point {
    const tangent = view.getTangentAtRatio(end === 'source' ? 0 : 1);
    const { start, end: next } = tangent;
    return (end === 'source' ? next.difference(start) : start.difference(next)).normalize(1);
}

const DIRECTION_ARGS: Record<LinkEnd, 'sourceDirection' | 'targetDirection'> = { source: 'sourceDirection', target: 'targetDirection' };

/**
 * Remember the directions the link (as it is drawn: `view`) leaves the ends in, on the target - the link itself (a shape
 * disconnected) or its copy (dragged, pasted) - when they are disconnected: its route keeps its shape (the router and the
 * connector would guess them otherwise). As an explicit router (orthogonal: the side) or connector (curved: the vector),
 * with the directions it has already; none for a straight one. A connected end does not take its direction (see
 * `orthogonalRouting`, `smoothRouting`); forgotten when the end is connected again (see `forgetEndDirection()`).
 */
export function rememberEndDirections(
    link: dia.Link,
    view: dia.LinkView,
    ends: LinkEnd[],
    target = link,
    options?: dia.Cell.Options
): void {
    const routing: Routing = link.get('routing') ?? 'orthogonal';
    switch (routing) {
        case 'orthogonal': {
            const args: Record<string, unknown> = { useVertices: true, ...link.prop(['router', 'args']) };
            ends.forEach((end) => {
                args[DIRECTION_ARGS[end]] = sideTo({ x: 0, y: 0 }, drawnDirection(view, end));
            });
            target.router({ name: 'orthogonalRouting', args }, options);
            break;
        }
        case 'smooth': {
            const args: Record<string, unknown> = { ...link.prop(['connector', 'args']) };
            ends.forEach((end) => {
                args[DIRECTION_ARGS[end]] = drawnDirection(view, end).toJSON();
            });
            target.connector({ name: 'smoothRouting', args }, options);
            break;
        }
        // A straight line goes the same way whichever direction
        case 'straight':
            break;
    }
}

/**
 * The direction of the end forgotten (it is connected again): the router, the connector of the link without it - none
 * (the ones of its routing, see `routingPaperOptions`) when no direction is left
 */
export function forgetEndDirection(link: dia.Link, end: LinkEnd, options?: dia.Cell.Options): void {
    const attribute = link.get('routing') === 'smooth' ? 'connector' : 'router';
    const other = end === 'source' ? 'target' : 'source';
    if (link.prop([attribute, 'args', DIRECTION_ARGS[other]]) === undefined) {
        link.removeProp(attribute, options);
    } else {
        link.removeProp([attribute, 'args', DIRECTION_ARGS[end]], options);
    }
}

/** Whether the end of the link is connected (to an element, a stub of it) */
const isConnected = (link: dia.Link, end: LinkEnd) => link.prop([end, 'id']) !== undefined;

/** Whether the user chooses how the link goes (see `Routing`). */
export function isRouted(cell: dia.Cell): boolean {
    return cell.isLink() && cell.has('routing');
}

// The sides of an element by the angle they face (clockwise from the right)
const SIDE_BY_ANGLE: Record<number, EndDirection> = { 0: 'right', 90: 'bottom', 180: 'left', 270: 'top' };
const ANGLE_BY_SIDE: Record<string, number> = { right: 0, bottom: 90, left: 180, top: 270 };

/**
 * The direction a link leaves a port of a rotated element in (its pipe stub): the side of the element
 * the port is on, turned with the element. The `rightAngle` router takes it from the unrotated box of the
 * element (a bug): a pipe on a stub of a rotated element would leave it the wrong way.
 */
function portDirection(end: dia.Link.EndJSON, graph: dia.Graph | undefined): string | undefined {
    if (!graph || !end.id || end.port === undefined) return undefined;
    const element = graph.getCell(end.id);
    if (!element?.isElement() || !element.angle()) return undefined;
    const port = element.getPort(String(end.port));
    if (!port) return undefined;
    const position = element.getPortsPositions(port.group ?? '')[String(end.port)];
    if (!position) return undefined;
    const bbox = element.getBBox();
    const side = bbox.sideNearestToPoint(new g.Point(bbox.x + position.x, bbox.y + position.y));
    const angle = g.normalizeAngle(Math.round((ANGLE_BY_SIDE[side] + element.angle()) / 90) * 90);
    return SIDE_BY_ANGLE[angle];
}

/**
 * The router of the orthogonal routing: the `rightAngle` one of the library leaving (and reaching) the ports of the
 * rotated elements along their pipe stubs (see `portDirection()`); a disconnected end in the direction set on the link (see
 * `rememberEndDirections()`) - a connected one not: as its stub, its side (while an end is dragged over a stub too)
 */
const orthogonalRouting = ((vertices: dia.Point[], args: Record<string, unknown> = {}, linkView: dia.LinkView) => {
    const link = linkView.model;
    const sourceDirection = isConnected(link, 'source') ? portDirection(link.source(), link.graph) : args.sourceDirection;
    const targetDirection = isConnected(link, 'target') ? portDirection(link.target(), link.graph) : args.targetDirection;
    return routers.rightAngle(vertices, { ...args, sourceDirection, targetDirection } as never, linkView);
});

/**
 * The routers of the papers: the one of the orthogonal routing (named after it - not the `rightAngle` of the library:
 * it is not the same) with the routers of the library
 */
export const routerNamespace = { ...routers, orthogonalRouting };

/** The router and the connector of the routing of the link (orthogonal by default) */
const routingOf = (link: dia.Link) => ROUTINGS[link.get('routing') as Routing] ?? ROUTINGS.orthogonal;

/** The router of the papers: of the routing of the link */
const routingRouter = ((vertices: dia.Point[], _args: unknown, linkView: dia.LinkView) => {
    const { name, args } = routingOf(linkView.model).router as { name: keyof typeof routerNamespace; args?: object };
    return (routerNamespace[name] as routers.Router).call(linkView, vertices, { ...args }, linkView);
});

/**
 * The connector of the smooth routing: the `curve` one of the library leaving the ends outwards (out of the element,
 * along its stub) - a disconnected one in the direction set on the link if it has one (see `rememberEndDirections()`)
 */
const smoothRouting = ((
    sourcePoint: g.Point, targetPoint: g.Point, route: g.Point[], args: Record<string, unknown>, linkView: dia.LinkView
) => {
    const link = linkView.model;
    const directions = {
        sourceDirection: isConnected(link, 'source') ? 'outwards' : args?.sourceDirection ?? 'outwards',
        targetDirection: isConnected(link, 'target') ? 'outwards' : args?.targetDirection ?? 'outwards'
    };
    return connectors.curve(sourcePoint, targetPoint, route, { ...args, ...directions } as never, linkView);
});

/** The connectors of the papers: the one of the smooth routing (named after it, see `routerNamespace`) with the library's */
export const connectorNamespace = { ...connectors, smoothRouting };

/** The connector of the papers: of the routing of the link (its own options too: a raw path asked by the view) */
const routingConnector = ((sourcePoint: g.Point, targetPoint: g.Point, route: g.Point[], options: object, linkView: dia.LinkView) => {
    const { name, args } = routingOf(linkView.model).connector as { name: keyof typeof connectorNamespace; args?: object };
    const connector = connectorNamespace[name] as connectors.Connector;
    return connector.call(linkView, sourcePoint, targetPoint, route, { ...args, ...options }, linkView);
});

/** The options of a paper drawing the links by their routing */
export const routingPaperOptions = {
    routerNamespace,
    connectorNamespace,
    defaultRouter: routingRouter,
    defaultConnector: routingConnector
};

/** The views of the links drawn again when their routing changes (as when their router, their connector change) */
export const routingPresentationAttributes = {
    routing: [dia.LinkView.Flags.UPDATE, dia.LinkView.Flags.CONNECTOR]
};
