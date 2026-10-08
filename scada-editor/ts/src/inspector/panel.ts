import type { App } from '../app';

/*
 * The inspector panel shows one thing at a time (see `App.panel`): the inspector of the selection, the settings,
 * a shape of the palette - or, with nothing in it, what it can show (see `placeholder.ts`).
 */

/** What the inspector panel shows: removed with what it started (its listeners, its timers, its papers, ...) */
export interface PanelContent {
    el: HTMLElement;
    remove(): void;
}

/** Show the content in the inspector panel instead of what it shows */
export function showInPanel(app: App, content: PanelContent): void {
    closePanel(app);
    app.inspectorEl.append(content.el);
    app.panel = content;
}

/** Empty the inspector panel */
export function closePanel(app: App): void {
    app.panel?.remove();
    app.panel = null;
}

/**
 * The tools of the cells (the ends, the vertices of a selected link) hidden while the pointer is in the inspector
 * panel: what is edited seen as it is - the arrowheads of an arrow are under the handles of its ends.
 */
export function hideToolsOverPanel(app: App): void {
    const { inspectorEl, paper } = app;
    inspectorEl.addEventListener('mouseenter', () => paper.hideTools());
    inspectorEl.addEventListener('mouseleave', () => paper.showTools());
}

/**
 * The tools just shown (a selection changed while the pointer is in the panel: a shortcut, a member of a group
 * clicked) hidden too, as the ones before (see `hideToolsOverPanel()`)
 */
export function hideNewToolsOverPanel(app: App): void {
    if (app.inspectorEl.matches(':hover')) {
        app.paper.hideTools();
    }
}
