import { dia, V } from '@joint/plus';
import type { App } from '../app';
import type { LogHooks } from './LogView';
import type { PlantEvent, PlantMessage } from '../plant/plant';
import { setTint } from '../canvas/tint';

/*
 * What the log shows on the diagram (its hooks, see `LogController`): the element of the message clicked tinted, the
 * elements of the messages pinged (the tags: hold Alt, see `canvas/tag-badges.ts`).
 */

const PING_ID = 'log-ping';

/** What the log shows on the paper of the app */
export function logHooks(app: App): LogHooks {
    const { paper, tags } = app;
    let focused: dia.Element | null = null;
    let stopPinging: (() => void) | null = null;
    return {
        highlight: (tag) => {
            // An element of the tag (the tint and the ping draw on elements)
            const cell = tag ? tags.get(tag) : undefined;
            const element = cell?.isElement() ? cell : null;
            if (element === focused) return;
            if (focused) setTint(paper, focused, null);
            focused = element;
            // Tinted in the color of the selection (as its pings, see `ping()`), lighter
            if (element) setTint(paper, element, 'var(--tint-highlight)');
        },
        pingChanges: (pinged) => {
            stopPinging?.();
            stopPinging = null;
            if (!pinged) return;
            // A listener of the plant too: the element of a message pinged
            const plant = app.plant!;
            const onMessage = (kind: PlantEvent) => ({ tag }: PlantMessage) => {
                const cell = tags.get(tag);
                if (cell?.isElement()) ping(paper, cell, kind);
            };
            const onUpdate = onMessage('update');
            const onCommand = onMessage('command');
            plant.on('update', onUpdate);
            plant.on('command', onCommand);
            stopPinging = () => {
                plant.off('update', onUpdate);
                plant.off('command', onCommand);
                dia.HighlighterView.removeAll(paper, PING_ID);
            };
        }
    };
}

// How long a ping lasts (ms): as its rings in `log.css` (the second one starting later)
const PING_DURATION = 1400;
// How far the rings of a ping reach out of the element (at their largest)
const PING_REACH = 16;

/**
 * A ping: two rings out of the middle of the element, behind it (the first child of its view), growing and fading
 * (`.ping` in `log.css`) - an update of the plant in the color of the selection (as the element of the message
 * clicked, see `tint.ts`), a command in amber (as in the log)
 */
const Ping = dia.HighlighterView.extend({
    tagName: 'g',
    attributes: {
        class: 'scada-ping',
        'pointer-events': 'none'
    },
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const element = cellView.model as dia.Element;
        const { width, height } = element.size();
        const r = Math.hypot(width, height) / 2 + PING_REACH;
        const color = this.options.kind === 'update' ? 'var(--selection)' : 'var(--color-amber)';
        const ring = () => V('circle', { cx: width / 2, cy: height / 2, r, fill: color, 'fill-opacity': 0.2, stroke: color, 'stroke-width': 3 });
        this.vel.empty().append([ring(), ring()]);
    }
});

/** The element pinged (again from the start if it is pinged now) */
export function ping(paper: dia.Paper, element: dia.Element, kind: PlantEvent): void {
    const view = element.findView(paper);
    if (!view) return;
    Ping.remove(view, PING_ID);
    const ping = Ping.add(view, 'root', PING_ID, { layer: null, z: 0, kind });
    window.setTimeout(() => {
        if (Ping.get(view, PING_ID) === ping) Ping.remove(view, PING_ID);
    }, PING_DURATION);
}
