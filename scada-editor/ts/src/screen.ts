import { type dia, V } from '@joint/plus';
import type { App } from './app';
import { GRID_SIZE, Mode } from './const';
import Screen from './shapes/Screen';

/*
 * The screen of the diagram (see `Screen`): in the runtime mode, the canvas shows it only,
 * fitted to the canvas (see `zoomToFit()`) - not scrolled, panned nor zoomed, without the navigator.
 */

const CLIP_ID = 'screen-clip';

/** The screen of the diagram, if it has one */
export function getScreen(graph: dia.Graph): Screen | undefined {
    return graph.getElements().find((element): element is Screen => element instanceof Screen);
}

/** Add a screen in the middle of what the canvas shows (in one step of the history). */
export function addScreen(app: App): Screen {
    const screen = new Screen();
    const { width, height } = screen.size();
    const center = app.scroller.getVisibleArea().center();
    const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE || 0;
    screen.position(snap(center.x - width / 2), snap(center.y - height / 2));
    app.graph.addCell(screen);
    return screen;
}

/** Whether the canvas shows the screen only (the runtime mode of a diagram with a screen) */
export function isScreenShown(app: App): boolean {
    return app.el.dataset.screen === 'shown';
}

/** Show the screen only, clipped (see `styles.css` for the rest): on entering the runtime mode. */
export function showScreen(app: App): void {
    const screen = app.mode === Mode.Runtime ? getScreen(app.graph) : undefined;
    if (!screen) return;
    const { paper } = app;
    // The cells are clipped by the screen: in the coordinates of the diagram (the layers are transformed).
    const clipPath = V('clipPath', { id: CLIP_ID }).append(V('rect', screen.getBBox().toJSON()));
    V(paper.defs).append(clipPath);
    paper.layers.setAttribute('clip-path', `url(#${CLIP_ID})`);
    app.el.dataset.screen = 'shown';
    revealToolbar(app.toolbar.el);
}

// How long the toolbar stays down when the pointer isn't on it (ms)
const REVEAL_DURATION = 1500;

/**
 * The toolbar slides up (see `styles.css`) once the pointer leaves it: it is created again for the mode,
 * under the pointer that pressed Run, but not hovered until the pointer moves.
 */
function revealToolbar(el: HTMLElement): void {
    el.classList.add('revealed');
    const conceal = () => el.classList.remove('revealed');
    el.addEventListener('mouseleave', conceal, { once: true });
    window.setTimeout(() => {
        if (!el.matches(':hover')) conceal();
    }, REVEAL_DURATION);
}

export function hideScreen(app: App): void {
    const { paper } = app;
    paper.layers.removeAttribute('clip-path');
    paper.defs.querySelector(`#${CLIP_ID}`)?.remove();
    delete app.el.dataset.screen;
}
