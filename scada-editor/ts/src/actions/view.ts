import type { App } from '../app';
import { Mode } from '../const';
import { fitOptions, runtimeFitOptions } from '../canvas/config';
import { getScreen, isScreenShown } from '../canvas/screen';

/*
 * What the canvas shows.
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
