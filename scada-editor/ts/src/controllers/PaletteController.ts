import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { clearSelection, refreshFavorites, refreshPalette, selectCell } from '../actions';
import { showShapePreview } from '../palette/shape-preview';
import { restylePaper } from '../diagram-style';

/**
 * A shape clicked in the palette (not dragged, see `dragThreshold`) is shown in the inspector panel,
 * a shape dropped on the canvas is selected.
 * The groups of the palette made of the diagram follow it: the shapes in use, the images of the user.
 * Active in the edit mode only (the palette exists in it only).
 */
export default class PaletteController extends Controller {

    startListening(): void {
        const { stencil, graph, history } = this.app;
        if (!stencil) {
            return;
        }
        refreshPalette(this.app);
        // A change of the diagram recorded - once for all of it (a paste, a drop of a group: one batch), an undo, a redo;
        // a diagram loaded (its history reset): the shapes in use, the images of the user
        this.listenTo(history, 'stack', onDiagramChange);
        // Not recorded (a preference, see `history.ts`): the favorites group only
        this.listenTo(graph, 'change:favorites', onFavoritesChange);
        this.listenTo(stencil, {
            'element:drop': onPaletteShapeDrop,
            // The events of the papers of its groups (the paper of the group first)
            'group:cell:pointerclick': onPaletteShapeClick,
            // A group opened: in the style of the diagram (not restyled while it was closed, see `applyDiagramStyle()`)
            'group:open': onGroupOpen
        });
    }
}

function onDiagramChange(app: App) {
    refreshPalette(app);
}

function onFavoritesChange(app: App) {
    refreshFavorites(app);
}

function onPaletteShapeClick(app: App, _paper: dia.Paper, cellView: dia.CellView) {
    // The inspector panel shows the shape of the palette instead of the selection.
    clearSelection(app);
    showShapePreview(app, cellView);
}

/** The view of the dropped cell (a link too) in the canvas */
function onPaletteShapeDrop(app: App, cellView: dia.CellView) {
    selectCell(app, cellView.model);
}


function onGroupOpen(app: App, group: string) {
    const { stencil } = app;
    if (stencil) {
        restylePaper(stencil.getPaper(group));
    }
}
