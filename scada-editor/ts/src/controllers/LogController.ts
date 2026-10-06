import { dia, V } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import Log, { type LogHooks } from '../log/Log';
import type { PlantEvent, PlantMessage } from '../plant/plant';
import { findByTag, getTag } from '../plant/tags';
import { propertiesOf } from '../plant/properties';
import { setTint } from '../canvas/tint';

/**
 * The log of the messages between the diagram and the plant (see `log/Log.ts`): opened by the Log button.
 * Active in the runtime mode only: a new run starts a new log, closed with the mode. While it is open, the element
 * of the message clicked is tinted blue; the tags of the elements are shown, the elements of the messages pinged if asked.
 */
export default class LogController extends Controller<[App, Log]> {

    constructor(app: App) {
        // The log of the app (its options kept from a run to the next one): passed to the handlers too
        super(app, new Log(logHooks(app)));
    }

    get log(): Log {
        return this.callbackArguments[1];
    }

    startListening(): void {
        this.log.clear();
        // A listener of the plant (as any system): the updates and the commands
        this.listenTo(this.context.plant, {
            'update': onPlantUpdate,
            'command': onPlantCommand
        });
        this.listenTo(this.context.toolbar, {
            'log:pointerclick': onLogPointerclick
        });
        // An element clicked while the log is open: its tag in the filter of the log (or out of it)
        this.listenTo(this.context.paper, {
            'element:pointerclick': onElementPointerclick
        });
    }

    stopListening(): void {
        super.stopListening();
        this.log.close();
    }
}

function onPlantUpdate(_app: App, log: Log, message: PlantMessage) {
    log.add('update', message);
}

function onPlantCommand(_app: App, log: Log, message: PlantMessage) {
    log.add('command', message);
}

function onLogPointerclick(app: App, log: Log) {
    log.toggle(app.el, app.toolbar.getWidgetByName('log')?.el);
}

function onElementPointerclick(_app: App, log: Log, elementView: dia.ElementView) {
    const tag = getTag(elementView.model);
    if (tag && log.isOpen) log.toggleFilterTag(tag);
}

const TAG_BADGE_ID = 'tag-badge';
const PING_ID = 'log-ping';

// The tag badge: its font (monospace: its width from the number of the characters), its padding and height
const BADGE_FONT_SIZE = 11;
const BADGE_CHAR_WIDTH = 6.7;
const BADGE_PADDING = 8;
const BADGE_HEIGHT = 20;

/**
 * The tag of an element: a pill in the middle of it (black and white, as the text on the page in the theme, inverted;
 * outlined in the color of the canvas: apart from the drawing under it), upright - moved with the element, not rotated
 * with it (as the controls, see `controls.ts`)
 */
const TagBadge = dia.HighlighterView.extend({
    tagName: 'g',
    attributes: {
        'pointer-events': 'none'
    },
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const element = cellView.model as dia.Element;
        const tag = getTag(element) ?? '';
        const width = tag.length * BADGE_CHAR_WIDTH + 2 * BADGE_PADDING;
        // The middle of the element: of its box as it is seen too (it is rotated around it)
        const { width: w, height: h } = element.size();
        const [x, y] = [w / 2, h / 2];
        this.vel.empty().append([
            V('rect', { x: x - width / 2, y: y - BADGE_HEIGHT / 2, width, height: BADGE_HEIGHT, rx: BADGE_HEIGHT / 2, fill: 'var(--foreground)', stroke: 'var(--shape-canvas)', 'stroke-width': 2 }),
            V('text', {
                x,
                y,
                'text-anchor': 'middle',
                'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace',
                'font-size': BADGE_FONT_SIZE,
                'font-weight': 600,
                fill: 'var(--background)'
            }).text(tag, { textVerticalAnchor: 'middle' })
        ]);
    },
    transform(this: dia.HighlighterView) {
        const { transformGroup, cellView } = this;
        if (!transformGroup) return;
        const { x, y } = cellView.model.position();
        transformGroup.attr('transform', `translate(${x},${y})`);
    }
});

/** What the log shows on the paper of the app */
function logHooks(app: App): LogHooks {
    const { paper, graph } = app;
    let focused: dia.Element | null = null;
    let stopPinging: (() => void) | null = null;
    return {
        highlight: (tag) => {
            const element = tag ? findByTag(graph, tag) ?? null : null;
            if (element === focused) return;
            if (focused) setTint(paper, focused, null);
            focused = element;
            // Tinted in the color of the selection (as its pings, see `ping()`), lighter
            if (element) setTint(paper, element, 'var(--tint-highlight)');
        },
        showTags: (shown) => {
            dia.HighlighterView.removeAll(paper, TAG_BADGE_ID);
            if (!shown) return;
            // Of the elements the plant knows (with properties, see `plant/properties.ts`)
            graph.getElements().filter(element => getTag(element) && propertiesOf(element).length > 0).forEach((element) => {
                const view = element.findView(paper);
                if (view) TagBadge.add(view, 'root', TAG_BADGE_ID, { layer: dia.Paper.Layers.FRONT, z: 1 });
            });
        },
        pingChanges: (pinged) => {
            stopPinging?.();
            stopPinging = null;
            if (!pinged) return;
            // A listener of the plant too: the element of a message pinged
            const plant = app.plant!;
            const onMessage = (kind: PlantEvent) => ({ tag }: PlantMessage) => {
                const element = findByTag(graph, tag);
                if (element) ping(paper, element, kind);
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
 * (`.jj-ping` in `log.css`) - an update of the plant in the color of the selection (as the element of the message clicked, see `tint.ts`), a command in amber (as in the log)
 */
const Ping = dia.HighlighterView.extend({
    tagName: 'g',
    attributes: {
        class: 'jj-ping',
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
function ping(paper: dia.Paper, element: dia.Element, kind: PlantEvent): void {
    const view = element.findView(paper);
    if (!view) return;
    Ping.remove(view, PING_ID);
    const ping = Ping.add(view, 'root', PING_ID, { layer: null, z: 0, kind });
    window.setTimeout(() => {
        if (Ping.get(view, PING_ID) === ping) Ping.remove(view, PING_ID);
    }, PING_DURATION);
}
