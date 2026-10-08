import { dia, V } from '@joint/plus';
import { getTag } from '../plant/tags';
import Group from '../shapes/models/diagram/Group';

/*
 * The IDs of the cells (their tags, see `plant/tags.ts`) shown as badges while Alt is held (see `TagBadgesController`),
 * in both modes: highlighters - nothing of the diagram changes, the cells can be edited meanwhile (the badges follow).
 */

const TAG_BADGE_ID = 'tag-badge';

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
        const tag = getTag(cellView.model) ?? '';
        const width = tag.length * BADGE_CHAR_WIDTH + 2 * BADGE_PADDING;
        const { x, y } = badgeCenter(cellView, width);
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
        const { model } = cellView;
        // A link: in the coordinates of the paper already (see `badgeCenter()`)
        if (!transformGroup || !model.isElement()) return;
        const { x, y } = model.position();
        transformGroup.attr('transform', `translate(${x},${y})`);
    }
});

/**
 * Where the tag badge of the width is: the middle of an element (in its coordinates: of its box as it is seen too, it
 * is rotated around it); on the top left corner of a group (where the badge of its selection is - its middle is a member);
 * the middle of the route of a link (a conveyor, in the coordinates of the paper)
 */
function badgeCenter(cellView: dia.CellView, badgeWidth: number): dia.Point {
    if (cellView instanceof dia.LinkView) return cellView.getPointAtRatio(0.5);
    if (Group.isGroup(cellView.model)) return { x: badgeWidth / 2, y: 0 };
    const { width, height } = cellView.model.getBBox();
    return { x: width / 2, y: height / 2 };
}

/** The badges of the IDs of a paper: shown, hidden, drawn again (the cells added, removed, their IDs changed) */
export default class TagBadges {

    protected paper: dia.Paper;
    protected shown = false;
    /** The badges shown soon (see `showSoon()`), none */
    protected timer: number | null = null;

    constructor(paper: dia.Paper) {
        this.paper = paper;
    }

    get isShown(): boolean {
        return this.shown;
    }

    /** A badge on every cell with an ID */
    show(): void {
        const { paper } = this;
        this.shown = true;
        dia.HighlighterView.removeAll(paper, TAG_BADGE_ID);
        paper.model.getCells().filter(cell => getTag(cell)).forEach((cell) => {
            const view = cell.findView(paper);
            if (view) TagBadge.add(view, 'root', TAG_BADGE_ID, { layer: dia.Paper.Layers.FRONT, z: 1 });
        });
    }

    /** Shown after the delay (ms) - unless hidden before */
    showSoon(delay: number): void {
        if (this.shown || this.timer !== null) return;
        this.timer = window.setTimeout(() => {
            this.timer = null;
            this.show();
        }, delay);
    }

    hide(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
        this.shown = false;
        dia.HighlighterView.removeAll(this.paper, TAG_BADGE_ID);
    }

    /** Drawn again if shown */
    refresh(): void {
        if (this.shown) this.show();
    }
}
