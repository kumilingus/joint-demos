import type { App } from '../app';

/*
 * The inspector panel shows one thing at a time (see `App.panel`): the inspector of the selection, the settings,
 * a shape of the palette - or, with nothing in it, what it can show (see `empty.ts`).
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
