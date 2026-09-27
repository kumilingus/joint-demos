import Controller from './Controller';
import type { App } from '../app';
import { ColorScheme, Mode } from '../const';

/**
 * The toolbar buttons. Active in every mode.
 * (Zooming is handled by the built-in toolbar tools.)
 */
export default class ToolbarController extends Controller {

    startListening(): void {
        const { toolbar } = this.context;

        this.listenTo(toolbar, {
            'mode:pointerclick': onModePointerclick,
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
