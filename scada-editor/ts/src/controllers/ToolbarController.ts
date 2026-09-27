import Controller from './Controller';
import type { App } from '../app';
import { ColorScheme, Mode } from '../const';
import { openDiagram, saveDiagram, zoomToFit } from '../actions';

/**
 * The toolbar buttons. Active in every mode.
 * (Zooming is handled by the built-in toolbar tools.)
 */
export default class ToolbarController extends Controller {

    startListening(): void {
        const { toolbar } = this.context;

        this.listenTo(toolbar, {
            'mode:pointerclick': onModePointerclick,
            'zoomToFit:pointerclick': onZoomToFitPointerclick,
            // In the edit mode only (the buttons are not in the toolbar of the runtime mode)
            'save:pointerclick': onSavePointerclick,
            'open:pointerclick': onOpenPointerclick,
            'colorScheme:pointerclick': onColorSchemePointerclick
        });
    }
}

function onModePointerclick(app: App) {
    app.setMode(app.mode === Mode.Edit ? Mode.Runtime : Mode.Edit);
}

function onColorSchemePointerclick(app: App) {
    app.setColorScheme(app.colorScheme === ColorScheme.Light ? ColorScheme.Dark : ColorScheme.Light);
}

function onSavePointerclick(app: App) {
    saveDiagram(app);
}

function onOpenPointerclick(app: App) {
    openDiagram(app);
}

function onZoomToFitPointerclick(app: App) {
    zoomToFit(app);
}
