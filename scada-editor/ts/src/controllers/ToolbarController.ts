import Controller from './Controller';
import type { App } from '../app';
import { ColorScheme, Mode } from '../const';
import { exportImage, newDiagram, openDiagram, saveDiagram, zoomToFit } from '../actions';
import { isSettingsOpen, toggleSettings } from '../inspector/settings';

/**
 * The toolbar buttons. Active in every mode.
 * (Zooming is handled by the built-in toolbar tools.)
 */
export default class ToolbarController extends Controller {

    startListening(): void {
        const { toolbar } = this.app;

        this.listenTo(toolbar, {
            'mode:pointerclick': onModePointerclick,
            'zoomToFit:pointerclick': onZoomToFitPointerclick,
            // In the edit mode only (the buttons are not in the toolbar of the runtime mode)
            'new:pointerclick': onNewPointerclick,
            'save:pointerclick': onSavePointerclick,
            'export:pointerclick': onExportPointerclick,
            'open:pointerclick': onOpenPointerclick,
            'settings:pointerclick': toggleSettings,
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

/** A new diagram: its settings open (the screen, the style) - the first thing to set */
function onNewPointerclick(app: App) {
    if (newDiagram(app) && !isSettingsOpen(app)) toggleSettings(app);
}

function onSavePointerclick(app: App) {
    saveDiagram(app);
}

function onExportPointerclick(app: App) {
    exportImage(app);
}

function onOpenPointerclick(app: App) {
    openDiagram(app);
}

function onZoomToFitPointerclick(app: App) {
    zoomToFit(app);
}
