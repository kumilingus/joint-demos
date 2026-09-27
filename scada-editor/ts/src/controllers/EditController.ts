import { type dia, type g, ui } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, moveSelectionWith, selectCell, selectCells, toggleCell } from '../actions';
import { SELECTION_COLOR } from '../const';

/**
 * Selecting cells on the canvas: a click selects a cell, a click with Ctrl / Cmd / Shift
 * adds it to the selection (or removes it), a drag with Shift on the blank canvas selects
 * the cells in the region. The selected elements move together. Active in the edit mode only.
 */
export default class EditController extends Controller {

    region: ui.RectangularSelectionRegion;

    constructor(app: App) {
        super(app);
        this.region = new ui.RectangularSelectionRegion({ paper: app.paper, color: SELECTION_COLOR });
    }

    startListening(): void {
        const { paper, graph } = this.context;

        this.listenTo(paper, {
            'cell:pointerclick': onCellPointerclick,
            'blank:pointerdown': (app: App, evt: dia.Event) => onBlankPointerdown(app, this.region, evt)
        });

        this.listenTo(graph, {
            'change:position': onElementPositionChange
        });
    }
}

/** Whether the event adds to the selection (a cell picked, a region selected). */
export function isSelectionEvent(evt: dia.Event): boolean {
    return Boolean(evt.shiftKey || evt.ctrlKey || evt.metaKey);
}

function onCellPointerclick(app: App, cellView: dia.CellView, evt: dia.Event) {
    if (isSelectionEvent(evt)) {
        toggleCell(app, cellView.model);
    } else {
        selectCell(app, cellView.model);
    }
}

async function onBlankPointerdown(app: App, region: ui.RectangularSelectionRegion, evt: dia.Event) {
    // Otherwise the canvas is panned (see `CanvasController`).
    if (!evt.shiftKey) {
        clearSelection(app);
        return;
    }
    const rect = await region.getUserSelectionAsync();
    if (!rect) return;
    selectCells(app, findCellsInRegion(app.graph, rect));
}

/**
 * The cells that are whole in the region. A straight pipe has no height (or width):
 * the corners of its bounding box are in the region, not the empty box itself.
 */
function findCellsInRegion(graph: dia.Graph, rect: g.Rect): dia.Cell[] {
    const elements: dia.Cell[] = graph.findElementsInArea(rect, { strict: true });
    const links = graph.getLinks().filter((link) => {
        const bbox = link.getBBox();
        return rect.containsPoint(bbox.topLeft()) && rect.containsPoint(bbox.bottomRight());
    });
    return elements.concat(links);
}

/** The user moves a selected element: the rest of the selection moves with it. */
function onElementPositionChange(app: App, element: dia.Element, _position: dia.Point, options: dia.Cell.Options) {
    if (!options.ui || options.selectionMove) return;
    const previous = element.previous('position');
    if (!previous) return;
    const current = element.position();
    moveSelectionWith(app, element, current.x - previous.x, current.y - previous.y);
}
