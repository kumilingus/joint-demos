import { dia, highlighters, type mvc, ui, V } from '@joint/plus';
import Pipe, { pipeOutlineWidth } from '../shapes/models/piping/Pipe';
import Group from '../shapes/models/diagram/Group';
import { GRID_SIZE, SELECTION_COLOR, SELECTION_PADDING } from '../const';
import { SourceArrowhead, TargetArrowhead, Vertices, verticesOptions } from './tools';
import Shape, { type ResizeOptions } from '../shapes/models/Shape';
import { scaledWidth } from '../shapes/common/line-width';
import { isLocked } from './lock';

/*
 * The selection on the canvas (`ui.Selection` over the collection of the app): the region
 * (a drag with Shift on the blank canvas, see `EditController`), the frames of the selected cells
 * and moving several selected elements together. A single selected cell is interacted with as usual
 * (see `SelectionController` for its free transform and link tools).
 */

// The class of the view of a selected cell (see `SelectionFrame`): its cursor (see `canvas.css`)
const SELECTED_CLASS = 'scada-selected';

/**
 * The frame of a cell (selected, hovered): an element in a rectangle of its size (the model geometry: without
 * the pipe stubs and the label), rotated with it; a link along its route (the stroke highlighter).
 */
class CellFrame extends highlighters.stroke {

    // A link framed again when it gets wider or narrower (see `linkFrameWidth()`)
    UPDATE_ATTRIBUTES = ['style'];

    protected highlight(cellView: dia.CellView, node: SVGElement): void {
        const { model } = cellView;
        if (!model.isElement()) {
            super.highlight(cellView, node);
            this.vel.attr('stroke-width', linkFrameWidth(model));
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

/** The frame of a selected cell: its view marked as selected meanwhile (`SELECTED_CLASS`) */
export class SelectionFrame extends CellFrame {

    protected highlight(cellView: dia.CellView, node: SVGElement): void {
        super.highlight(cellView, node);
        cellView.el.classList.add(SELECTED_CLASS);
    }

    protected unhighlight(cellView: dia.CellView, node: SVGElement): void {
        super.unhighlight(cellView, node);
        cellView.el.classList.remove(SELECTED_CLASS);
    }
}

/** The width of the frame of a link: wider than the link (a pipe: its outline) on each side */
function linkFrameWidth(link: dia.Cell): number {
    // A pipe: its outline; a wire: its line at its size (see `line-width.ts`); another link: its line
    const base = Number(link.attr('line/strokeWidthBase'));
    const width = Pipe.isPipe(link) ? pipeOutlineWidth(link) : base ? scaledWidth(link, base) : Number(link.attr('line/strokeWidth')) || 0;
    return width + 6;
}

/** A link is outlined: a wider stroke behind it, in its own view (drawn in its layer, not under all of the cells). */
function frameOptions(cell: dia.Cell): highlighters.StrokeHighlighterArguments {
    if (cell.isLink()) {
        return {
            // The first child of the view: behind the paths of the link
            layer: null,
            z: 0,
            attrs: {
                stroke: SELECTION_COLOR,
                strokeWidth: linkFrameWidth(cell),
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
        ...(Group.isGroup(cell) ? { layer: 'front' } : {}),
        attrs: {
            stroke: SELECTION_COLOR,
            strokeWidth: 1.5,
            ...(Group.isGroup(cell) ? { strokeDasharray: '6 4' } : {})
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
    paper.model.getElements().filter(Group.isGroup).forEach((group) => {
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

/** Frame the hovered cell: what a click selects (see `clickTarget()`), framed as selected, faintly - or none */
export function showHover(paper: dia.Paper, cell: dia.Cell | null): void {
    const view = cell && cell.findView(paper);
    // Framed already (the frames of the paper know the hovered cell)
    if (view && CellFrame.get(view, HOVER_ID)) return;
    CellFrame.removeAll(paper, HOVER_ID);
    if (!cell || !view) return;
    const options = frameOptions(cell);
    CellFrame.add(view, 'root', HOVER_ID, {
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
        // The screen is selected in the settings only (see `settings.ts`), the members of a group with it; a locked
        // element not at all (see `lock.ts`).
        filter: (cell: dia.Cell) => cell.get('type') === 'Screen' || cell.isEmbedded() || isLocked(cell),
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

/**
 * The selection doesn't move the selected cells with the pressed one (as `preventDefaultInteraction()` of a view), after
 * it handled the press: by its data of the event - `interactionPrevented`, and its batch (started at the press) closed,
 * as it doesn't close it then. Internals of `ui.Selection`: until it has an API of its own.
 */
export function preventSelectionInteraction(selection: ui.Selection, evt: dia.Event): void {
    const { action, interactionPrevented } = selection.eventData(evt);
    if (interactionPrevented) return;
    if (action === 'translating') selection.options.graph?.stopBatch('selection-translate');
    selection.eventData(evt, { interactionPrevented: true });
}

/**
 * The selection on the paper (its frames are drawn by `ui.Selection`, see `createSelection()`): a cell selected alone
 * with its tools, the selected groups with their badges; a hover frame is out of date.
 */
export function showSelection(paper: dia.Paper, selection: mvc.Collection<dia.Cell>): void {
    hideSelectedTools(paper);
    showGroupBadges(paper, selection);
    showHover(paper, null);
    if (selection.length === 1) showSelectedTools(paper, selection.at(0));
}

/** A cell selected alone: an element with the free transform, a pipe with the link tools */
function showSelectedTools(paper: dia.Paper, cell: dia.Cell): void {
    const cellView = cell.findView(paper);
    // A group is moved only (by its members), its frame is the one of the selection.
    if (!cellView || Group.isGroup(cell)) return;
    if (cell.isElement()) {
        // An element can be resized and rotated.
        new ui.FreeTransform({
            cellView,
            ...getTransformOptions(cell),
            // The padding in the coordinates of the graph: as the frame of the selection (see `selection.ts`)
            usePaperScale: true,
            padding: SELECTION_PADDING,
            // The selection is cleared by the app.
            clearAll: false,
            clearOnBlankPointerdown: false,
        }).render();
        return;
    }
    // A pipe can be reshaped (vertices) and reconnected (arrowheads).
    cellView.addTools(new dia.ToolsView({
        tools: [
            new Vertices(verticesOptions),
            // Reconnect the end, or move its anchor along the side of the same element
            new SourceArrowhead(),
            new TargetArrowhead()
        ]
    }));
}

/** The resize handles: those of the shape, or for the constraints - all of them, unless the width or the height can't change. */
function resizeDirections({ minWidth, maxWidth, minHeight, maxHeight, directions }: ResizeOptions): dia.Direction[] {
    if (directions) return directions;
    const fixedWidth = minWidth !== undefined && minWidth === maxWidth;
    const fixedHeight = minHeight !== undefined && minHeight === maxHeight;
    if (fixedWidth && fixedHeight) return [];
    if (fixedWidth) return ['top', 'bottom'];
    if (fixedHeight) return ['left', 'right'];
    return ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
}

/** How the shape can be transformed: resized (down to its minimal size, keeping its aspect ratio, ...) and rotated. */
function getTransformOptions(cell: dia.Cell): Partial<ui.FreeTransform.Options> {
    // The screen: any size, not rotated
    if (!Shape.isShape(cell)) return { allowRotation: false };
    const resizeOptions = cell.resizeOptions();
    return {
        allowRotation: cell.rotatable,
        // No resize handles at all, or the constraints of resizing (the minimal size, ...)
        ...(resizeOptions ? resizeOptions : { resizeDirections: [] }),
        // A fixed width or height: the handles of the other one only
        ...(resizeOptions ? { resizeDirections: resizeDirections(resizeOptions) } : {}),
        // The size changes in two steps of the grid: the half of it (the center of the element,
        // where the pipes are often anchored) stays on the grid too.
        resizeGrid: { width: 2 * GRID_SIZE, height: 2 * GRID_SIZE }
    };
}

/** The tools of the cells are the ones of the selection only. */
function hideSelectedTools(paper: dia.Paper): void {
    ui.FreeTransform.clear(paper);
    paper.removeTools();
}
