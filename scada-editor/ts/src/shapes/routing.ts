import { type dia, util } from '@joint/plus';

/*
 * The routing of a link (a pipe, a signal line) as the user chooses it: the router and the connector
 * follow from it (as the link routing presets of `@joint/react`).
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

/** The router and the connector of the routing (a copy: the attributes of a link are its own). */
export function routingAttributes(routing: Routing): Pick<dia.Link.Attributes, 'router' | 'connector'> {
    return util.cloneDeep(ROUTINGS[routing] ?? ROUTINGS.orthogonal);
}

/** A change derived from another one (not recorded in the history, see `historyOptions`). */
export const DERIVED = { derived: true };

/** The router and the connector of the link follow its routing (derived changes, not in the history). */
export function followRouting(link: dia.Link): void {
    link.on('change:routing', (_link: dia.Link, routing: Routing, options: dia.Cell.Options) => {
        link.set(routingAttributes(routing), { ...options, ...DERIVED });
    });
}

/** Whether the user chooses how the link goes (see `Routing`). */
export function isRouted(cell: dia.Cell): boolean {
    return cell.isLink() && cell.has('routing');
}
