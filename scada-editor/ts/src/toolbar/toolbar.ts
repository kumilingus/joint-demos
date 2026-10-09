import { ui } from '@joint/plus';
import type { App } from '../app';
import type { Mode } from '../const';
import { getToolbarOptions } from './config';

/** The toolbar of the mode, in its panel on top of the app (see `config.ts`: its tools, `toolbar.css`) */
export function createToolbar(container: HTMLElement, app: App, mode: Mode): ui.Toolbar {
    const toolbar = new ui.Toolbar({
        ...getToolbarOptions(mode),
        references: { paperScroller: app.scroller, commandManager: app.history }
    });
    toolbar.el.classList.add('scada-toolbar');
    container.append(toolbar.el);
    toolbar.render();
    return toolbar;
}
