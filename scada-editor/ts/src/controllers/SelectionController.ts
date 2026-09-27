import { dia, linkTools, ui } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { GRID_SIZE, SELECTION_PADDING } from '../const';
import { closeInspector, openInspector } from '../inspector';
import { closePaletteShape } from '../palette';
import { SourceArrowhead, TargetArrowhead, VertexHandle } from '../tools';
import { type ResizeOptions, Shape } from '../shapes/Shape';

/**
 * Shows the selected cells in the inspector and a single selected cell with its tools: an element
 * with the free transform, a pipe with the link tools (the frames are drawn by `ui.Selection`,
 * see `selection.ts`). Active in every mode.
 */
export default class SelectionController extends Controller {

    startListening(): void {
        const { selection, graph } = this.context;

        this.listenTo(selection, 'add remove reset', updateSelection);
        this.listenTo(graph, 'remove', onCellRemove);
    }
}

/** A cell selected alone is shown with its tools (and in the inspector). */
function updateSelection(app: App) {
    const { selection } = app;
    hideSelected(app);
    if (selection.length === 1) showSelected(app, selection.at(0));
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

function showSelected(app: App, cell: dia.Cell) {
    const cellView = cell.findView(app.paper);
    if (!cellView) return;
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
            new linkTools.Vertices({ handleClass: VertexHandle }),
            // Reconnect the end, or move its anchor along the side of the same element
            new SourceArrowhead(),
            new TargetArrowhead()
        ]
    }));
}

/** The resize handles for the constraints: all of them, unless the width or the height can't change. */
function resizeDirections({ minWidth, maxWidth, minHeight, maxHeight }: ResizeOptions): dia.Direction[] {
    const fixedWidth = minWidth !== undefined && minWidth === maxWidth;
    const fixedHeight = minHeight !== undefined && minHeight === maxHeight;
    if (fixedWidth && fixedHeight) return [];
    if (fixedWidth) return ['top', 'bottom'];
    if (fixedHeight) return ['left', 'right'];
    return ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
}

/** How the shape can be transformed: resized (down to its minimal size, keeping its aspect ratio, ...) and rotated. */
function getTransformOptions(cell: dia.Cell): Partial<ui.FreeTransform.Options> {
    if (!Shape.isShape(cell)) return {};
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
function hideSelected(app: App) {
    ui.FreeTransform.clear(app.paper);
    app.paper.removeTools();
}
