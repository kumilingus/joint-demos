import { dia, V } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearLog, closeLog, isLogOpen, type LogHooks, logMessage, toggleFilterTag, toggleLog } from '../event-log';
import { type MessageDirection, plant } from '../plant';
import { findByTag, getTag } from '../tags';
import { propertiesOf } from '../tag-values';
import { setTint } from '../tint';

/**
 * The log of the messages between the diagram and the plant (see `event-log.ts`): opened by the Log button.
 * Active in the runtime mode only: a new run starts a new log, closed with the mode. While it is open, the element
 * of a message under the pointer is tinted blue; the tags of the elements are shown, the elements of the messages flashed if asked.
 */
export default class LogController extends Controller {

    unsubscribe: (() => void) | null = null;

    startListening(): void {
        clearLog();
        // A listener of the plant (as any system): the updates and the commands
        this.unsubscribe = plant.subscribe(logMessage);
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
        this.unsubscribe?.();
        this.unsubscribe = null;
        closeLog();
    }
}

function onLogPointerclick(app: App) {
    toggleLog(app.el, logHooks(app), app.toolbar.getWidgetByName('log')?.el);
}

function onElementPointerclick(_app: App, elementView: dia.ElementView) {
    const tag = getTag(elementView.model);
    if (tag && isLogOpen()) toggleFilterTag(tag);
}

const TAG_BADGE_ID = 'tag-badge';
const FLASH_ID = 'log-flash';

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
        const { x, y } = (cellView.model as dia.Element).position();
        transformGroup.attr('transform', `translate(${x},${y})`);
    }
});

/** What the log shows on the paper of the app */
function logHooks(app: App): LogHooks {
    const { paper, graph } = app;
    let focused: dia.Element | null = null;
    let stopFlashing: (() => void) | null = null;
    return {
        hover: (tag) => {
            const element = tag ? findByTag(graph, tag) ?? null : null;
            if (element === focused) return;
            if (focused) setTint(paper, focused, null);
            focused = element;
            // Tinted in the color of the selection (as its pings, see `flash()`)
            if (element) setTint(paper, element, 'var(--selection)');
        },
        showTags: (shown) => {
            dia.HighlighterView.removeAll(paper, TAG_BADGE_ID);
            if (!shown) return;
            // Of the elements the plant knows (with properties, see `tag-values.ts`)
            graph.getElements().filter(element => getTag(element) && propertiesOf(element).length > 0).forEach((element) => {
                const view = element.findView(paper);
                if (view) TagBadge.add(view, 'root', TAG_BADGE_ID, { layer: dia.Paper.Layers.FRONT, z: 1 });
            });
        },
        flashChanges: (flashed) => {
            stopFlashing?.();
            stopFlashing = null;
            if (!flashed) return;
            // A listener of the plant too: the element of a message flashed
            const unsubscribe = plant.subscribe(({ tag, direction }) => {
                const element = findByTag(graph, tag);
                if (element) flash(paper, element, direction);
            });
            stopFlashing = () => {
                unsubscribe();
                dia.HighlighterView.removeAll(paper, FLASH_ID);
            };
        }
    };
}

// How long a flash lasts (ms): as its rings in `styles.css` (the second one starting later)
const FLASH_DURATION = 1400;
// How far the rings of a flash reach out of the element (at their largest)
const FLASH_REACH = 24;

/**
 * A ping: two rings out of the middle of the element, behind it (the first child of its view), growing and fading
 * (`.jj-ping` in `styles.css`) - an update of the plant in the color of the selection (as the element under the pointer, see `tint.ts`), a command in amber (as in the log)
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
        const r = Math.hypot(width, height) / 2 + FLASH_REACH;
        const color = this.options.direction === 'in' ? 'var(--selection)' : 'var(--color-amber)';
        const ring = () => V('circle', { cx: width / 2, cy: height / 2, r, fill: color, 'fill-opacity': 0.35, stroke: color, 'stroke-width': 5 });
        this.vel.empty().append([ring(), ring()]);
    }
});

/** The element pinged (again from the start if it is pinged now) */
function flash(paper: dia.Paper, element: dia.Element, direction: MessageDirection): void {
    const view = element.findView(paper);
    if (!view) return;
    Ping.remove(view, FLASH_ID);
    const ping = Ping.add(view, 'root', FLASH_ID, { layer: null, z: 0, direction });
    window.setTimeout(() => {
        if (Ping.get(view, FLASH_ID) === ping) Ping.remove(view, FLASH_ID);
    }, FLASH_DURATION);
}
