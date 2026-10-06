import { dia, mvc, ui } from '@joint/plus';
import { cellNamespace } from './shapes';
import { createStencil } from './palette/stencil';
import { createGraph } from './canvas/layers';
import { createSelection } from './canvas/selection';
import { createNavigator } from './canvas/navigator';
import { EXAMPLES, type Example } from './examples';
import { ColorScheme, Mode } from './const';
import { canvasColors, getGrid, interactivity, paperOptions, scrollerOptions, snaplinesOptions } from './canvas/config';
import { getToolbarOptions } from './toolbar/config';
import { historyOptions } from './actions/history';
import { tooltipOptions } from './tooltips';
import { addImages, clearSelection, confirmReplace, refreshPalette, zoomToFit } from './actions';
import { isControlEvent, setControlsOperable } from './runtime/controls';
import { Plant } from './plant/plant';
import { setTablesLive } from './shapes/views/TableView';
import { getImages, IMAGES_ATTRIBUTE, type ImagesPaperOptions } from './palette/images';
import { FAVORITES_ATTRIBUTE } from './palette/favorites';
import { ANIMATIONS_ATTRIBUTE } from './runtime/animations';
import { applyStyle, getStyle, STYLE_ATTRIBUTE } from './diagram-style';
import { hideScreen, showScreen } from './canvas/screen';
import {
    type Controller,
    AnimationsController,
    CanvasController,
    ControlsController,
    EditController,
    ElectricalController,
    KeyboardController,
    LogController,
    PaletteController,
    RuntimeController,
    SelectionController,
    TagsController,
    PipeColorController,
    GroupController,
    ToolbarController
} from './controllers';
// The mock of the plant (see `plant/mock/`): an app with a real plant deletes it and this line
import MockPlantController from './plant/mock/MockPlantController';
import Snaplines from './canvas/Snaplines';
import { toggleSettings } from './inspector/settings';

export class App {

    el: HTMLElement;
    inspectorEl: HTMLElement;
    graph: dia.Graph;
    /** The interface of the diagram to the plant (see `plant.ts`): a new one for each run, none while editing */
    plant: Plant | null = null;
    history: dia.CommandManager;
    paper: dia.Paper;
    scroller: ui.PaperScroller;
    /** The palette: in the edit mode only. */
    stencil: ui.Stencil | null = null;
    /** The alignment of a moved element with the others: in the edit mode only. */
    snaplines: ui.Snaplines | null = null;
    clipboard = new ui.Clipboard();
    navigator: ui.Navigator;
    /** The toolbar of the current mode */
    toolbar!: ui.Toolbar;
    keyboard: ui.Keyboard;
    tooltip: ui.Tooltip;

    mode: Mode = Mode.Edit;
    colorScheme: ColorScheme = getInitialColorScheme();
    /** Whether a moved or resized element aligns with the others (see the settings) */
    snaplinesEnabled = true;
    /** The cells as they were before the runtime mode (put back when it is left: its changes are not the diagram's) */
    runtimeCells: dia.Cell.JSON[] | null = null;
    /** Whether the palette has the group of the shapes in use (see `refreshPalette()`) */
    inUseShown = true;
    selection = new mvc.Collection<dia.Cell>();
    /** Shows the selection on the canvas: the region, the frames, moving the selected elements together */
    selectionView: ui.Selection;

    /** Controllers listening in every mode. */
    controllers: Controller[];
    /** Controllers listening only in the given mode. */
    modeControllers: Record<Mode, Controller[]>;

    constructor(el: HTMLElement) {
        this.el = el;
        this.inspectorEl = el.querySelector<HTMLElement>('.inspector-panel')!;
        // The empty state of the panel: put back when its content is replaced (an inspector empties it)
        const emptyEl = this.createInspectorEmpty();
        this.inspectorEl.append(emptyEl);
        new MutationObserver(() => {
            if (!emptyEl.isConnected) this.inspectorEl.append(emptyEl);
        }).observe(this.inspectorEl, { childList: true });

        this.graph = createGraph();
        // The style of the diagram on the document (see `diagram-style.ts`): loaded with it, changed in the settings
        this.graph.on(`change:${STYLE_ATTRIBUTE}`, () => this.applyStyle());

        this.history = new dia.CommandManager({ ...historyOptions, graph: this.graph });

        this.paper = new dia.Paper({
            ...paperOptions,
            model: this.graph,
            cellViewNamespace: cellNamespace,
            interactive: this.interactivityOf(this.mode),
            // Not an event of the paper on a control (in its layer, not in the view of the element: a press would be one
            // on the blank canvas, its default action - dragging the slider - prevented)
            guard: (evt: dia.Event) => isControlEvent(evt),
            getImages: () => getImages(this.graph)
        } as dia.Paper.Options & ImagesPaperOptions);

        this.scroller = new ui.PaperScroller({
            ...scrollerOptions,
            paper: this.paper
        });
        el.querySelector('.canvas')!.appendChild(this.scroller.el);
        this.scroller.render();

        this.selectionView = createSelection(this.scroller, this.selection);

        this.navigator = createNavigator(el.querySelector('.navigator-panel')!, this.scroller);

        this.keyboard = new ui.Keyboard();

        this.tooltip = new ui.Tooltip(tooltipOptions);

        this.controllers = [
            new CanvasController(this),
            new ControlsController(this),
            new SelectionController(this),
            new TagsController(this),
            new PipeColorController(this),
            new GroupController(this)
        ];
        this.modeControllers = {
            // Each listens to the toolbar of its mode.
            [Mode.Edit]: [
                new ToolbarController(this),
                new EditController(this),
                new KeyboardController(this),
                new PaletteController(this)
            ],
            [Mode.Runtime]: [
                new ToolbarController(this),
                new RuntimeController(this),
                new MockPlantController(this),
                new LogController(this),
                new AnimationsController(this),
                new ElectricalController(this)
            ]
        };

        this.controllers.forEach(controller => controller.startListening());
        this.enterMode(this.mode);
        this.setColorScheme(this.colorScheme);
    }

    setMode(mode: Mode): void {
        if (mode === this.mode) return;
        this.leaveMode(this.mode);
        this.mode = mode;
        this.enterMode(mode);
    }


    /**
     * Load a diagram saved with `saveDiagram()`: its cells, its images (see `images.ts`) and the favorite
     * shapes of the palette (see `favorites.ts`), into the layers of the app.
     */
    loadJSON(json: dia.Graph.JSON): void {
        // Tried on a graph of its own first (an unknown type of a shape, an unknown layer, ...):
        // the diagram is not replaced by a part of the file.
        createGraph().fromJSON(json);
        clearSelection(this);
        // A diagram without images (or favorites) has none (not those of the previous one), all of it animated.
        this.graph.fromJSON({ [IMAGES_ATTRIBUTE]: {}, [FAVORITES_ATTRIBUTE]: [], [ANIMATIONS_ATTRIBUTE]: 'full', [STYLE_ATTRIBUTE]: {}, ...json });
        this.applyStyle();
        this.history.reset();
        zoomToFit(this);
        this.paper.unfreeze();
    }

    /** The colors of the page (the design tokens in `theme/tokens.css`) and of the canvas. */
    setColorScheme(colorScheme: ColorScheme): void {
        this.colorScheme = colorScheme;
        document.documentElement.dataset.colorScheme = colorScheme;
        this.paper.drawBackground({ color: canvasColors[colorScheme].background });
        this.paper.setGrid(getGrid(this.mode, colorScheme));
        storeColorScheme(colorScheme);
    }

    /**
     * What the user can't do in a mode doesn't exist in it (it's not only hidden):
     * the palette is created for the edit mode only, the toolbar for each mode (with its tools).
     */
    protected enterMode(mode: Mode): void {
        this.createToolbar(mode);
        if (mode === Mode.Edit) {
            this.createSnaplines();
            this.createStencil(this.snaplines!);
        }
        if (mode === Mode.Runtime) {
            // Nothing of the runtime mode in the history; the diagram kept as it is
            this.history.stopListening();
            // All their attributes, the defaults too (left out, a sync would remove them)
            this.runtimeCells = this.graph.getCells().map(cell => cell.toJSON({ ignoreDefaults: false }));
        }
        // A plant for the run (see `plant.ts`): before the controllers of the mode, they listen to it
        if (mode === Mode.Runtime) this.plant = new Plant(this.graph);
        this.modeControllers[mode].forEach(controller => controller.startListening());
        this.paper.setInteractivity(this.interactivityOf(mode));
        setControlsOperable(this.paper, mode === Mode.Runtime);
        setTablesLive(this.paper, mode === Mode.Runtime);
        this.paper.setGrid(getGrid(mode, this.colorScheme));
        this.el.dataset.mode = mode;
        showScreen(this);
        // The side panels are hidden in the runtime mode only (the attribute above): the canvas changes its size.
        zoomToFit(this);
    }

    protected leaveMode(mode: Mode): void {
        clearSelection(this);
        hideScreen(this);
        this.modeControllers[mode].forEach(controller => controller.stopListening());
        this.plant = null;
        if (mode === Mode.Runtime && this.runtimeCells) {
            // The diagram as it was before the runtime mode (its values, the operated equipment)
            this.graph.syncCells(this.runtimeCells, { remove: true });
            this.runtimeCells = null;
            this.history.listen();
        }
        this.destroyStencil();
        this.destroySnaplines();
        this.toolbar.remove();
    }

    /**
     * The interactivity of the mode (see `config.ts`) and the drag of a member of a group (see `Group`):
     * a selected one moves on its own, any other one moves the group it is in.
     */
    protected interactivityOf(mode: Mode): dia.Paper.Options['interactive'] {
        const base = interactivity[mode];
        if (!base) return false;
        return (cellView: dia.CellView) => {
            const options = base(cellView);
            return typeof options === 'object' ? { ...options, stopDelegation: this.selection.has(cellView.model) } : options;
        };
    }

    /** What the empty inspector panel says (shown while it has nothing else, see `inspector/inspector.css`): with a way to the settings */
    protected createInspectorEmpty(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'inspector-empty';
        // Two ways: a shape, or (an "or" between them) the settings with what they have
        const text = document.createElement('p');
        text.textContent = 'Select a shape on the canvas or in the palette to see its properties.';
        const or = document.createElement('div');
        or.className = 'inspector-empty-or';
        or.textContent = 'or';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Diagram settings';
        button.addEventListener('click', () => toggleSettings(this));
        const caption = document.createElement('p');
        caption.className = 'inspector-empty-caption';
        caption.textContent = 'the screen, the animations, the editor';
        el.append(text, or, button, caption, this.createExamples());
        return el;
    }

    /** The example diagrams to open (see `examples.ts`) */
    protected createExamples(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'inspector-examples';
        const title = document.createElement('h4');
        title.textContent = 'Examples';
        el.append(title);
        EXAMPLES.forEach((example) => {
            const button = document.createElement('button');
            button.type = 'button';
            const name = document.createElement('strong');
            name.textContent = example.name;
            const description = document.createElement('span');
            description.textContent = example.description;
            button.append(name, description);
            button.addEventListener('click', () => this.openExample(example));
            el.append(button);
        });
        return el;
    }

    /** Open the example instead of the diagram: as a file, asked first if the diagram was changed */
    openExample(example: Example): void {
        if (!confirmReplace(this, `Open the ${example.name} example?`)) return;
        this.loadJSON(example.json);
    }

    protected createToolbar(mode: Mode): void {
        const el = document.createElement('div');
        el.className = 'toolbar-panel';
        this.el.prepend(el);
        this.toolbar = new ui.Toolbar({
            ...getToolbarOptions(mode),
            el,
            references: { paperScroller: this.scroller, commandManager: this.history }
        });
        this.toolbar.render();
    }

    protected createStencil(snaplines: ui.Snaplines): void {
        const el = document.createElement('div');
        el.className = 'stencil-panel';
        this.el.querySelector('.main')!.prepend(el);
        this.stencil = createStencil(el, this.scroller, snaplines, {
            getImages: () => getImages(this.graph),
            onUpload: images => addImages(this, images)
        });
    }

    /** The style of the diagram on the document (see `diagram-style.ts`), its finish on the shapes: on the canvas, in the palette */
    applyStyle(): void {
        applyStyle(getStyle(this.graph));
        const papers: dia.Paper[] = [this.paper];
        if (this.stencil) papers.push(...Object.keys(this.stencil.options.groups ?? {}).map(group => this.stencil!.getPaper(group)));
        // The elements (their surfaces) rendered again, the links updated (the borders of the pipes)
        papers.forEach((paper) => {
            paper.model.getElements().forEach(element => element.findView(paper)?.render());
            paper.model.getLinks().forEach(link => (link.findView(paper) as dia.LinkView | undefined)?.update());
        });
    }

    protected destroyStencil(): void {
        this.stencil?.remove();
        this.stencil = null;
    }

    /** Show or hide the group of the palette with the shapes in use. */
    setInUseShown(shown: boolean): void {
        this.inUseShown = shown;
        refreshPalette(this);
    }

    /** Turn the snaplines on or off. */
    setSnaplinesEnabled(enabled: boolean): void {
        this.snaplinesEnabled = enabled;
        if (enabled) {
            this.snaplines?.enable();
        } else {
            this.snaplines?.disable();
        }
    }

    protected createSnaplines(): void {
        // With a fix of the library for the dragged groups (see `Snaplines`)
        this.snaplines = new Snaplines({ ...snaplinesOptions, paper: this.paper });
        if (!this.snaplinesEnabled) this.snaplines.disable();
    }

    protected destroySnaplines(): void {
        this.snaplines?.remove();
        this.snaplines = null;
    }
}

const COLOR_SCHEME_KEY = 'scada-editor:color-scheme';
/** The color scheme chosen last time, or the one of the system. */
function getInitialColorScheme(): ColorScheme {
    try {
        const stored = localStorage.getItem(COLOR_SCHEME_KEY);
        if (stored === ColorScheme.Light || stored === ColorScheme.Dark) return stored;
    } catch {
        // No storage (a private window): the system decides.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? ColorScheme.Dark : ColorScheme.Light;
}

function storeColorScheme(colorScheme: ColorScheme): void {
    try {
        localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
    } catch {
        // Not remembered, but switched.
    }
}

export function init(el: HTMLElement = document.querySelector<HTMLElement>('.app')!): App {
    const app = new App(el);
    // The first example (a boiler house), saved with the Save button: its cells, its images and favorites
    app.loadJSON(EXAMPLES[0].json);
    return app;
}
