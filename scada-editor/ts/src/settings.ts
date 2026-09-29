import { dia, mvc, ui } from '@joint/plus';
import type { App } from './app';
import { clearSelection, selectCell } from './actions';
import { addScreen, getScreen } from './screen';
import Screen from './shapes/Screen';

/*
 * The settings of the diagram (the cog in the toolbar), in the inspector panel: whether the diagram has
 * a screen (see `screen.ts`) and its size. While they are open, the screen can be
 * moved (and selected, resized); it is out of the way otherwise.
 */

interface Shown {
    el: HTMLElement;
    inspector: ui.Inspector;
    listener: mvc.Listener<[]>;
}

let shown: Shown | null = null;

interface ScreenSettings {
    screen: boolean;
    size?: dia.Size;
}

/** A change of the settings following the diagram (not changing it back) */
type SettingsOptions = dia.Cell.Options & { diagram?: boolean };
const FROM_DIAGRAM: SettingsOptions = { diagram: true };

/** The settings of the screen of the diagram: whether it has one, and its size */
function getScreenSettings(graph: dia.Graph): ScreenSettings {
    const screen = getScreen(graph);
    return screen ? { screen: true, size: screen.size() } : { screen: false };
}

export function isSettingsOpen(): boolean {
    return shown !== null;
}

/**
 * The cog of the toolbar: open the settings (instead of the selection) or close them.
 * The screen is selected with them (it is edited in the settings, see `SelectionController`).
 */
export function toggleSettings(app: App): void {
    if (shown) {
        clearSelection(app);
        closeSettings(app);
        return;
    }
    const screen = getScreen(app.graph);
    if (screen) {
        selectCell(app, screen);
    } else {
        clearSelection(app);
        openSettings(app);
    }
}

/**
 * The settings are a model of their own, edited in the inspector: it changes the diagram (adds, removes
 * or resizes the screen) and follows it (the screen resized with the free transform, an undo, ...).
 */
export function openSettings(app: App): void {
    if (shown) return;
    const { graph } = app;
    const el = document.createElement('div');
    el.className = 'settings';
    const titleEl = document.createElement('h3');
    titleEl.className = 'settings-title';
    titleEl.textContent = 'Settings';
    el.append(titleEl);
    app.inspectorEl.append(el);

    // A cell (not in the graph): the inspector unsets its properties (`removeProp()`)
    const settings = new dia.Cell(getScreenSettings(graph));
    const listener = new mvc.Listener<[]>();
    // The settings change the diagram (the settings of the diagram are its cells)...
    listener.listenTo(settings, 'change:screen', (_cell: dia.Cell, enabled: boolean, options: SettingsOptions) => {
        if (options.diagram) return;
        if (enabled) {
            addScreen(app);
        } else {
            getScreen(graph)?.remove();
        }
    });
    listener.listenTo(settings, 'change:size', (_cell: dia.Cell, size: dia.Size | undefined, options: SettingsOptions) => {
        if (!options.diagram && size) getScreen(graph)?.resize(size.width, size.height);
    });
    // ... and follow it.
    listener.listenTo(graph, 'add remove reset change:size', () => {
        const { screen, size } = getScreenSettings(graph);
        settings.set({ screen }, FROM_DIAGRAM);
        if (size) settings.set({ size }, FROM_DIAGRAM);
    });
    // The screen back (an undo of its removal): selected, as when the settings are opened
    listener.listenTo(graph, 'add', (cell: unknown) => {
        if (cell instanceof Screen) selectCell(app, cell);
    });

    // The size of the screen if there is one (no size without it)
    const withScreen = { eq: { screen: true }, otherwise: { unset: true }};
    const inspector = new ui.Inspector({
        cell: settings,
        inputs: {
            screen: { type: 'toggle', label: 'Enabled', group: 'screen', index: 1 },
            size: {
                width: { type: 'number', label: 'Width', min: 100, group: 'screen', index: 2, when: withScreen },
                height: { type: 'number', label: 'Height', min: 100, group: 'screen', index: 3, when: withScreen }
            }
        },
        groups: { screen: { label: 'Screen', index: 1 }}
    });
    inspector.render();
    el.append(inspector.el);

    shown = { el, inspector, listener };
    app.paper.el.classList.add('screen-editable');
    app.toolbar.getWidgetByName('settings')?.el.classList.add('active');
}

export function closeSettings(app: App): void {
    if (!shown) return;
    shown.listener.stopListening();
    shown.inspector.remove();
    shown.el.remove();
    shown = null;
    app.paper.el.classList.remove('screen-editable');
    app.toolbar.getWidgetByName('settings')?.el.classList.remove('active');
}
