import { dia, V } from '@joint/plus';

/*
 * A ping: two rings out of the middle of an element, behind it (the first child of its view), growing and fading
 * (`.scada-ping` in `canvas.css`) - in a color: the messages of the plant in the log (an update, a command), a cell
 * marked (see `marker.ts`).
 */

// How long a ping lasts (ms): as its rings in `canvas.css` (the second one starting later)
const PING_DURATION = 1400;
// How far the rings of a ping reach out of the element (at their largest)
const PING_REACH = 16;

const Ping = dia.HighlighterView.extend({
    tagName: 'g',
    attributes: {
        class: 'scada-ping',
        'pointer-events': 'none'
    },
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { width, height } = cellView.model.getBBox();
        const r = Math.hypot(width, height) / 2 + PING_REACH;
        const { color } = this.options;
        const ring = () => V('circle', { cx: width / 2, cy: height / 2, r, fill: color, 'fill-opacity': 0.2, stroke: color, 'stroke-width': 3 });
        this.vel.empty().append([ring(), ring()]);
    }
});

/** The element pinged in the color (again from the start if it is pinged by the id now) */
export function ping(paper: dia.Paper, element: dia.Element, color: string, id: string): void {
    const view = element.findView(paper);
    if (!view) {
        return;
    }
    Ping.remove(view, id);
    const added = Ping.add(view, 'root', id, { layer: null, z: 0, color });
    window.setTimeout(() => {
        if (Ping.get(view, id) === added) {
            Ping.remove(view, id);
        }
    }, PING_DURATION);
}

/** The pings of the id removed (the log closed) */
export function removePings(paper: dia.Paper, id: string): void {
    dia.HighlighterView.removeAll(paper, id);
}
