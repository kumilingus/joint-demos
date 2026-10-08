import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { forgetEndDirection, type LinkEnd } from '../shapes/common/routing';

/**
 * The directions of the disconnected ends of the links (an explicit router, connector - see `rememberEndDirections()`): forgotten when
 * an end is connected again (dropped on a stub, a side), all of them when the routing of the link changes (the router,
 * the connector of the routing again). Active in the edit mode only.
 */
export default class RoutingController extends Controller {

    startListening(): void {
        const { paper, graph } = this.app;
        this.listenTo(paper, {
            'link:connect': onLinkConnect
        });
        this.listenTo(graph, {
            'change:routing': onRoutingChange
        });
    }
}

function onLinkConnect(_app: App, linkView: dia.LinkView, _evt: dia.Event, _cellView: dia.CellView, _magnet: SVGElement, end: LinkEnd) {
    forgetEndDirection(linkView.model, end);
}

function onRoutingChange(_app: App, link: dia.Cell, _routing: unknown, options: dia.Cell.Options) {
    if (!link.isLink()) {
        return;
    }
    link.unset('router', options);
    link.unset('connector', options);
}
