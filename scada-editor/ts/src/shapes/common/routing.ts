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
        router: { name: 'rightAngle', args: { useVertices: true }},
        connector: roundedConnector
    },
    // The curve leaves the ends outwards (out of the element, along the pipe stub).
    smooth: {
        router: { name: 'normal' },
        connector: { name: 'curve', args: { sourceDirection: 'outwards', targetDirection: 'outwards' }}
    }
};

/** A change derived from another one (not recorded in the history, see `historyOptions`). */
export const DERIVED = { derived: true };

/** Whether the user chooses how the link goes (see `Routing`). */
export function isRouted(cell: dia.Cell): boolean {
    return cell.isLink() && cell.has('routing');
}

// The sides of an element by the angle they face (clockwise from the right)
const SIDE_BY_ANGLE: Record<number, string> = { 0: 'right', 90: 'bottom', 180: 'left', 270: 'top' };
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
 * The `rightAngle` router leaving (and reaching) the ports of the rotated elements along their pipe stubs
 * (see `portDirection()`); a direction set on the link stays.
 */
const rightAngle = ((vertices: dia.Point[], args: Record<string, unknown> = {}, linkView: dia.LinkView) => {
    const link = linkView.model;
    const sourceDirection = args.sourceDirection ?? portDirection(link.source(), link.graph);
    const targetDirection = args.targetDirection ?? portDirection(link.target(), link.graph);
    return routers.rightAngle(vertices, { ...args, sourceDirection, targetDirection } as never, linkView);
}) as unknown as typeof routers.rightAngle;

/**
 * The routers of the papers: the `rightAngle` one aware of the rotated ports (under its own name,
 * so a saved diagram is the same as with the library router).
 */
export const routerNamespace = { ...routers, rightAngle };

/** The router and the connector of the routing of the link (orthogonal by default) */
const routingOf = (link: dia.Link) => ROUTINGS[link.get('routing') as Routing] ?? ROUTINGS.orthogonal;

/** The router of the papers: of the routing of the link */
const routingRouter = ((vertices: dia.Point[], _args: unknown, linkView: dia.LinkView) => {
    const { name, args } = routingOf(linkView.model).router as { name: keyof typeof routerNamespace; args?: object };
    return (routerNamespace[name] as routers.Router).call(linkView, vertices, { ...args }, linkView);
}) as routers.Router;

/** The connector of the papers: of the routing of the link (its own options too: a raw path asked by the view) */
const routingConnector = ((sourcePoint: g.Point, targetPoint: g.Point, route: g.Point[], options: object, linkView: dia.LinkView) => {
    const { name, args } = routingOf(linkView.model).connector as { name: keyof typeof connectors; args?: object };
    return (connectors[name] as connectors.Connector).call(linkView, sourcePoint, targetPoint, route, { ...args, ...options }, linkView);
}) as connectors.Connector;

/** The options of a paper drawing the links by their routing */
export const routingPaperOptions = {
    routerNamespace,
    defaultRouter: routingRouter,
    defaultConnector: routingConnector
};

/** The views of the links drawn again when their routing changes (as when their router, their connector change) */
export const routingPresentationAttributes = {
    routing: [dia.LinkView.Flags.UPDATE, dia.LinkView.Flags.CONNECTOR]
};
