import { dia, mvc, ui } from '@joint/plus';
import type { App } from './app';
import { clearSelection, selectCell } from './actions';
import { addScreen, getScreen } from './screen';
import Screen from './shapes/Screen';
import { renderLabel } from './help';
import { ANIMATIONS_ATTRIBUTE, type AnimationLevel, getAnimationLevel } from './animations';
import { type DiagramStyle, getStyle, STYLE_ATTRIBUTE } from './style';
import { getColorFieldValue, renderColorField } from './color-field';

/*
 * The settings of the diagram (the cog in the toolbar), in the inspector panel: whether the diagram has
 * a screen (see `screen.ts`) and its size, the animations of the run mode; the preferences of the editor (the snaplines).
 * While they are open, the screen can be
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

/** The settings of the editor (not saved with the diagram) */
interface EditorSettings {
    snaplines: boolean;
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
    const editorSettings: EditorSettings = { snaplines: app.snaplinesEnabled };
    const settings = new dia.Cell({ ...getScreenSettings(graph), animations: getAnimationLevel(graph), style: getStyle(graph), ...editorSettings });
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
    listener.listenTo(settings, 'change:style', (_cell: dia.Cell, style: DiagramStyle, options: SettingsOptions) => {
        if (!options.diagram) graph.set(STYLE_ATTRIBUTE, { ...style });
    });
    listener.listenTo(graph, `change:${STYLE_ATTRIBUTE}`, () => settings.set({ style: getStyle(graph) }, FROM_DIAGRAM));
    listener.listenTo(settings, 'change:animations', (_cell: dia.Cell, level: AnimationLevel, options: SettingsOptions) => {
        if (!options.diagram) graph.set(ANIMATIONS_ATTRIBUTE, level);
    });
    listener.listenTo(settings, 'change:snaplines', (_cell: dia.Cell, enabled: boolean) => app.setSnaplinesEnabled(enabled));
    // ... and follow it.
    listener.listenTo(graph, 'add remove reset change:size', () => {
        const { screen, size } = getScreenSettings(graph);
        settings.set({ screen }, FROM_DIAGRAM);
        if (size) settings.set({ size }, FROM_DIAGRAM);
    });
    listener.listenTo(graph, 'change:animations', () => settings.set({ animations: getAnimationLevel(graph) }, FROM_DIAGRAM));
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
            },
            // The style of the diagram (see `style.ts`): none of a color - the defaults of the shapes (Auto)
            style: {
                finish: {
                    type: 'select-button-group',
                    label: 'Finish',
                    options: [
                        { value: 'shaded', content: 'Shaded' },
                        { value: 'flat', content: 'Flat' }
                    ],
                    defaultValue: 'shaded',
                    group: 'style',
                    index: 0
                },
                color: { type: 'color', label: 'Color', auto: true, graph, group: 'style', index: 1 },
                outline: { type: 'color', label: 'Outline', auto: true, graph, group: 'style', index: 2 },
                accent: { type: 'color', label: 'Accent', auto: true, graph, group: 'style', index: 3 }
            },
            // What moves in the run mode (see `AnimationLevel`)
            animations: {
                type: 'select-button-group',
                label: 'Animations',
                options: [
                    { value: 'full', content: 'Full' },
                    { value: 'alarms', content: 'Alarms only' }
                ],
                group: 'runtime',
                index: 1
            },
            // A moved or resized element aligns with the others
            snaplines: { type: 'toggle', label: 'Snaplines', group: 'editor', index: 1 }
        },
        groups: {
            screen: { label: 'Screen', index: 1 },
            style: { label: 'Style', index: 2 },
            runtime: { label: 'Run mode', index: 3 },
            editor: { label: 'Editor', index: 4 }
        },
        // The help of the screen (see `help.ts`)
        renderLabel,
        // The color fields of the style (see `color-field.ts`)
        renderFieldContent: renderColorField,
        getFieldValue: getColorFieldValue
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
