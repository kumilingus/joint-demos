import { dia, highlighters, linkTools, ui } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { GRID_SIZE, SELECTION_COLOR } from '../const';
import { closeInspector, openInspector } from '../inspector';
import { closePaletteShape } from '../palette';
import { SourceArrowhead, TargetArrowhead, VertexHandle } from '../tools';
import { Shape } from '../shapes/Shape';
import { Pipe } from '../shapes/Pipe';

const SELECTION_HIGHLIGHTER_ID = 'selection';

/** The frames showing the selection of elements. */
const freeTransforms = new WeakMap<dia.Cell, ui.FreeTransform>();

/** The cells shown as selected. */
const shown = new Set<dia.Cell>();

// How far the frame of an element in a multiple selection is around it
const FRAME_PADDING = 4;

/**
 * The frame of an element in a multiple selection: its bounding box (from the model),
 * drawn in the element (it rotates with it) and redrawn when it is resized.
 */
class SelectionFrame extends dia.HighlighterView {

    preinitialize(): void {
        this.tagName = 'rect';
        this.UPDATE_ATTRIBUTES = ['size'];
    }

    protected highlight(cellView: dia.CellView): void {
        const { width, height } = (cellView.model as dia.Element).size();
        this.vel.attr({
            x: -FRAME_PADDING,
            y: -FRAME_PADDING,
            width: width + 2 * FRAME_PADDING,
            height: height + 2 * FRAME_PADDING,
            fill: 'none',
            stroke: SELECTION_COLOR,
            'stroke-width': 1.5,
            'stroke-dasharray': '4 3',
            'pointer-events': 'none'
        });
    }
}

/**
 * Shows the selected cells on the canvas and in the inspector. Active in every mode.
 * A single selected cell can be transformed (an element) or reshaped (a pipe) and inspected;
 * a multiple selection is only framed (the elements) and outlined (the pipes).
 */
export default class SelectionController extends Controller {

    startListening(): void {
        const { selection, graph } = this.context;

        this.listenTo(selection, {
            'add': onSelectionAdd,
            'remove': onSelectionRemove,
            'reset': onSelectionReset
        });

        this.listenTo(graph, {
            'remove': onCellRemove
        });
    }
}

function onSelectionAdd(app: App) {
    updateSelection(app);
}

function onSelectionRemove(app: App) {
    updateSelection(app);
}

function onSelectionReset(app: App) {
    updateSelection(app);
}

/** A cell looks different when it is selected alone or with others: the whole selection is shown again. */
function updateSelection(app: App) {
    const { selection } = app;
    shown.forEach(cell => hideSelected(app, cell));
    shown.clear();
    const single = selection.length === 1;
    selection.each((cell) => {
        showSelected(app, cell, single);
        shown.add(cell);
    });
    updateInspector(app);
}

function onCellRemove(app: App, cell: dia.Cell) {
    app.selection.remove(cell);
}

/** The inspector shows a cell only when it is the only one selected. */
function updateInspector(app: App) {
    const { selection, inspectorEl } = app;
    // A selection replaces the shape of the palette shown in the panel.
    closePaletteShape();
    if (selection.length === 1) {
        openInspector(inspectorEl, selection.at(0));
    } else {
        closeInspector();
    }
}

function showSelected(app: App, cell: dia.Cell, single: boolean) {
    const cellView = cell.findView(app.paper);
    if (!cellView) return;
    if (!single) {
        if (cell.isElement()) {
            SelectionFrame.add(cellView, 'root', SELECTION_HIGHLIGHTER_ID);
        } else {
            outlinePipe(cellView);
        }
        return;
    }
    if (cell.isElement()) {
        // The frame of the free transform shows the selection of an element.
        const freeTransform = new ui.FreeTransform({
            cellView,
            ...getTransformOptions(cell),
            // The selection is cleared by the app.
            clearAll: false,
            clearOnBlankPointerdown: false
        });
        freeTransform.render();
        freeTransforms.set(cell, freeTransform);
        return;
    }
    // A pipe can be reshaped (vertices) and reconnected (arrowheads).
    cellView.addTools(new dia.ToolsView({
        tools: [
            new linkTools.Vertices({ handleClass: VertexHandle }),
            // Reconnect the end, or move its anchor along the side of the same element
            new SourceArrowhead(),
            new TargetArrowhead()
        ]
    }));
    outlinePipe(cellView);
}

/** A link is outlined without its (invisible) wrapper: a pipe by its outline, a signal line by its line. */
function outlinePipe(cellView: dia.CellView) {
    const selector = cellView.model instanceof Pipe ? 'outline' : 'line';
    highlighters.mask.add(cellView, selector, SELECTION_HIGHLIGHTER_ID, {
        padding: 6,
        layer: 'back',
        attrs: {
            'stroke': SELECTION_COLOR,
            'stroke-width': 2,
            'stroke-linejoin': 'round'
        }
    });
}

/** How the shape can be transformed: resized (down to its minimal size, keeping its aspect ratio, ...) and rotated. */
function getTransformOptions(cell: dia.Cell): Partial<ui.FreeTransform.Options> {
    if (!Shape.isShape(cell)) return {};
    const resizeOptions = cell.resizeOptions();
    return {
        allowRotation: cell.rotatable,
        // No resize handles at all, or the constraints of resizing (the minimal size, ...)
        ...(resizeOptions ? resizeOptions : { resizeDirections: [] }),
        // The size changes in two steps of the grid: the half of it (the center of the element,
        // where the pipes are often anchored) stays on the grid too.
        resizeGrid: { width: 2 * GRID_SIZE, height: 2 * GRID_SIZE }
    };
}

function hideSelected(app: App, cell: dia.Cell) {
    freeTransforms.get(cell)?.remove();
    freeTransforms.delete(cell);
    const cellView = cell.findView(app.paper);
    if (!cellView) return;
    dia.HighlighterView.remove(cellView, SELECTION_HIGHLIGHTER_ID);
    cellView.removeTools();
}
