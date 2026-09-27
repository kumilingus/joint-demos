import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, refreshPalette } from '../actions';
import { showShapePreview } from '../shape-preview';

/**
 * A shape clicked in the palette (not dragged, see `dragThreshold`) is shown in the inspector panel.
 * The groups of the palette made of the diagram follow it: the shapes in use, the images of the user.
 * Active in the edit mode only (the palette exists in it only).
 */
export default class PaletteController extends Controller {

    startListening(): void {
        const { stencil, graph } = this.context;
        if (!stencil) return;
        refreshPalette(this.context);
        this.listenTo(graph, {
            // A shape added or removed (the shapes in use), the images uploaded, renamed or removed,
            // the favorites changed; a diagram loaded (`fromJSON()` sets them silently and resets the cells)
            'add remove reset change:images change:favorites': onDiagramChange
        });
        Object.keys(stencil.options.groups || {}).forEach((group) => {
            this.listenTo(stencil.getPaper(group), 'cell:pointerclick', onPaletteShapeClick);
        });
    }
}

function onPaletteShapeClick(app: App, cellView: dia.CellView) {
    // The inspector panel shows the shape of the palette instead of the selection.
    clearSelection(app);
    showShapePreview(app, cellView);
}

let refreshScheduled = false;

/** Many cells added at once (a paste, a drop of a group) refresh the palette once. */
function onDiagramChange(app: App) {
    if (refreshScheduled) return;
    refreshScheduled = true;
    queueMicrotask(() => {
        refreshScheduled = false;
        refreshPalette(app);
    });
}
