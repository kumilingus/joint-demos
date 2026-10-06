import type { App } from '../app';
import { ColorScheme, Mode } from '../const';
import { fitOptions, runtimeFitOptions } from '../canvas/config';
import { getScreen, isScreenShown } from '../canvas/screen';

/*
 * What the canvas shows, the color scheme of the app (remembered).
 */

/** Show the whole diagram: on loading, entering the runtime mode (a wider canvas) and with the toolbar button. */
export function zoomToFit(app: App): void {
    // The runtime mode with a screen: the screen fills the canvas (see `screen.ts`).
    const screen = isScreenShown(app) ? getScreen(app.graph) : undefined;
    if (screen) {
        app.scroller.zoomToRect(screen.getBBox(), { padding: 0, minScale: 0.01, maxScale: 100 });
        return;
    }
    app.scroller.zoomToFit(app.mode === Mode.Runtime ? runtimeFitOptions : fitOptions);
}

// Where the color scheme chosen is remembered (in this browser)
const COLOR_SCHEME_KEY = 'scada-editor:color-scheme';

/** The color scheme chosen last time, or the one of the system. */
export function storedColorScheme(): ColorScheme {
    try {
        const stored = localStorage.getItem(COLOR_SCHEME_KEY);
        if (stored === ColorScheme.Light || stored === ColorScheme.Dark) return stored;
    } catch {
        // No storage (a private window): the system decides.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? ColorScheme.Dark : ColorScheme.Light;
}

export function storeColorScheme(colorScheme: ColorScheme): void {
    try {
        localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
    } catch {
        // Not remembered, but switched.
    }
}
