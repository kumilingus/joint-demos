import { dia, highlighters, type mvc, ui, V } from '@joint/plus';
import Pipe from './shapes/Pipe';
import { isGroup } from './shapes/Group';
import { SELECTION_COLOR, SELECTION_PADDING } from './const';

/*
 * The selection on the canvas (`ui.Selection` over the collection of the app): the region
 * (a drag with Shift on the blank canvas, see `EditController`), the frames of the selected cells
 * and moving several selected elements together. A single selected cell is interacted with as usual
 * (see `SelectionController` for its free transform and link tools).
 */

/**
 * The frame of a selected cell: an element in a rectangle of its size (the model geometry: without
 * the pipe stubs and the label), rotated with it; a link along its route (the stroke highlighter).
 */
export class SelectionFrame extends highlighters.stroke {

    protected highlight(cellView: dia.CellView, node: SVGElement): void {
        const { model } = cellView;
        if (!model.isElement()) {
            super.highlight(cellView, node);
            return;
        }
        const { padding = 0, rx, ry, attrs } = this.options;
        const { width, height } = model.size();
        this.vel.attr(attrs ?? {});
        this.vel.attr('d', V.rectToPath({
            x: -padding,
            y: -padding,
            width: width + 2 * padding,
            height: height + 2 * padding,
            rx,
            ry
        }));
    }
}

/** A link is outlined: a wider stroke behind it. */
function frameOptions(cell: dia.Cell): highlighters.StrokeHighlighterArguments {
    if (cell.isLink()) {
        const lineWidth = Number(cell.attr(cell instanceof Pipe ? 'outline/strokeWidth' : 'line/strokeWidth')) || 0;
        return {
            layer: 'back',
            attrs: {
                stroke: SELECTION_COLOR,
                strokeWidth: lineWidth + 6,
                strokeLinejoin: 'round',
                strokeLinecap: 'square'
            }
        };
    }
    return {
        padding: SELECTION_PADDING,
        rx: 2,
        ry: 2,
        // A group (see `Group`): dashed, over the shapes (it is in the background layer itself)
        ...(isGroup(cell) ? { layer: 'front' } : {}),
        attrs: {
            stroke: SELECTION_COLOR,
            strokeWidth: 1.5,
            ...(isGroup(cell) ? { strokeDasharray: '6 4' } : {})
        }
    };
}

/** The badge of a selected group: over its frame, its ID and how many elements it has (`⧉ GRP-101 · 2`) */
const GroupBadge = dia.HighlighterView.extend({
    tagName: 'text',
    attributes: {
        'font-family': 'sans-serif',
        'font-size': 13,
        'font-weight': 600,
        fill: SELECTION_COLOR,
        'pointer-events': 'none'
    },
    highlight(this: dia.HighlighterView, cellView: dia.CellView) {
        const { model } = cellView;
        const count = model.getEmbeddedCells().filter(cell => cell.isElement()).length;
        this.vel.attr({ x: -SELECTION_PADDING, y: -SELECTION_PADDING - 6 });
        this.vel.text(`⧉ ${model.get('tag') ?? 'Group'} · ${count}`);
    }
});

const GROUP_BADGE_ID = 'group-badge';
const HOVER_ID = 'hover';

/** The badges of the selected groups (and none of the others) */
export function showGroupBadges(paper: dia.Paper, selection: mvc.Collection<dia.Cell>): void {
    paper.model.getElements().filter(isGroup).forEach((group) => {
        const view = group.findView(paper);
        if (!view) return;
        const shown = Boolean(GroupBadge.get(view, GROUP_BADGE_ID));
        if (selection.has(group) && !shown) {
            GroupBadge.add(view, 'root', GROUP_BADGE_ID, { layer: 'front' });
        } else if (!selection.has(group) && shown) {
            GroupBadge.remove(view, GROUP_BADGE_ID);
        }
    });
}

/** The badge of the group again (its members changed: an undo, ...), if it has one */
export function updateGroupBadge(paper: dia.Paper, group: dia.Cell): void {
    const view = group.findView(paper);
    if (view) GroupBadge.update(view, GROUP_BADGE_ID, true);
}

/** The hovered cell: what a click selects (see `clickTarget()`), framed as selected, faintly */
let hovered: dia.Cell | null = null;

export function showHover(paper: dia.Paper, cell: dia.Cell | null): void {
    if (hovered === cell) return;
    const previous = hovered && hovered.findView(paper);
    if (previous) SelectionFrame.remove(previous, HOVER_ID);
    hovered = cell;
    const view = cell && cell.findView(paper);
    if (!view) return;
    const options = frameOptions(cell);
    SelectionFrame.add(view, 'root', HOVER_ID, {
        ...options,
        attrs: { ...options.attrs, strokeOpacity: 0.4 }
    });
}
export function createSelection(scroller: ui.PaperScroller, collection: mvc.Collection<dia.Cell>): ui.Selection {
    return new ui.Selection({
        paper: scroller,
        collection,
        // The links in a region too: tested against their route (not their bounding box)
        selectLinks: true,
        // The screen is selected in the settings only (see `settings.ts`), the members of a group with it.
        filter: (cell: dia.Cell) => cell.get('type') === 'Screen' || cell.isEmbedded(),
        // A single selected cell is dragged as usual, several are moved together by the selection.
        allowCellInteraction: true,
        translateConnectedLinks: ui.Selection.ConnectedLinksTranslation.SUBGRAPH,
        handles: [],
        wrapper: false,
        frames: new ui.HighlighterSelectionFrameList({
            highlighter: SelectionFrame,
            selector: 'root',
            options: frameOptions
        })
    });
}
