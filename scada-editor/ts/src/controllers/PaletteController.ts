import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, refreshPalette, selectCell } from '../actions';
import { showShapePreview } from '../palette/shape-preview';

/**
 * A shape clicked in the palette (not dragged, see `dragThreshold`) is shown in the inspector panel,
 * a shape dropped on the canvas is selected.
 * The groups of the palette made of the diagram follow it: the shapes in use, the images of the user.
 * Active in the edit mode only (the palette exists in it only).
 */
/** A refresh of the palette waiting for the changes of the moment to end (see `onDiagramChange()`) */
interface PaletteRefresh {
    scheduled: boolean;
}

export default class PaletteController extends Controller<[App, PaletteRefresh]> {

    constructor(app: App) {
        super(app, { scheduled: false });
    }

    startListening(): void {
        const { stencil, graph } = this.context;
        if (!stencil) return;
        refreshPalette(this.context);
        this.listenTo(graph, {
            // A shape added or removed (the shapes in use), the images uploaded, renamed or removed,
            // the favorites changed; a diagram loaded (`fromJSON()` sets them silently and resets the cells)
            'add remove reset change:images change:favorites': onDiagramChange
        });
        this.listenTo(stencil, 'element:drop', onPaletteShapeDrop);
        Object.keys(stencil.options.groups || {}).forEach((group) => {
            this.listenTo(stencil.getPaper(group), 'cell:pointerclick', onPaletteShapeClick);
        });
    }
}

/** Many cells added at once (a paste, a drop of a group) refresh the palette once. */
function onDiagramChange(app: App, refresh: PaletteRefresh) {
    if (refresh.scheduled) return;
    refresh.scheduled = true;
    queueMicrotask(() => {
        refresh.scheduled = false;
        refreshPalette(app);
    });
}

function onPaletteShapeClick(app: App, _refresh: PaletteRefresh, cellView: dia.CellView) {
    // The inspector panel shows the shape of the palette instead of the selection.
    clearSelection(app);
    showShapePreview(app, cellView);
}

/** The view of the dropped cell (a link too) in the canvas */
function onPaletteShapeDrop(app: App, _refresh: PaletteRefresh, cellView: dia.CellView) {
    selectCell(app, cellView.model);
}

