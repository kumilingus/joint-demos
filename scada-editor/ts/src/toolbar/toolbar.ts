import { ui } from '@joint/plus';
import type { App } from '../app';
import type { Mode } from '../const';
import { getToolbarOptions } from './config';

/** The toolbar of the mode, on top of the app (see `config.ts`: its tools, `toolbar.css`) */
export function createToolbar(app: App, mode: Mode): ui.Toolbar {
    const el = document.createElement('div');
    el.className = 'toolbar-panel';
    app.el.prepend(el);
    const toolbar = new ui.Toolbar({
        ...getToolbarOptions(mode),
        el,
        references: { paperScroller: app.scroller, commandManager: app.history }
    });
    toolbar.render();
    return toolbar;
}
