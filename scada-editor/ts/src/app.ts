import { dia, mvc, ui } from '@joint/plus';
import { cellNamespace } from './shapes';
import { createStencil } from './stencil';
import { createGraph } from './layers';
import { createSelection } from './selection';
import { createNavigator } from './navigator';
import boilerHouse from './diagram/boiler-house.json';
import { ColorScheme, Mode } from './const';
import {
    canvasColors, getGrid, getToolbarOptions, historyOptions, interactivity, paperOptions, scrollerOptions, snaplinesOptions, tooltipOptions
} from './config';
import { addImages, clearSelection, zoomToFit } from './actions';
import { setControlsOperable } from './controls';
import { getImages, IMAGES_ATTRIBUTE, type ImagesPaperOptions } from './images';
import { FAVORITES_ATTRIBUTE } from './favorites';
import {
    type Controller,
    AnimationsController,
    CanvasController,
    ControlsController,
    EditController,
    KeyboardController,
    PaletteController,
    RuntimeController,
    SelectionController,
    SimulationController,
    TagsController,
    ToolbarController
} from './controllers';

export class App {

    el: HTMLElement;
    inspectorEl: HTMLElement;
    graph: dia.Graph;
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

        this.graph = createGraph();

        this.history = new dia.CommandManager({ ...historyOptions, graph: this.graph });

        this.paper = new dia.Paper({
            ...paperOptions,
            model: this.graph,
            cellViewNamespace: cellNamespace,
            interactive: interactivity[this.mode],
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
            new TagsController(this)
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
                new SimulationController(this),
                new AnimationsController(this)
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
        // A diagram without images (or favorites) has none (not those of the previous one).
        this.graph.fromJSON({ [IMAGES_ATTRIBUTE]: {}, [FAVORITES_ATTRIBUTE]: [], ...json });
        this.history.reset();
        zoomToFit(this);
        this.paper.unfreeze();
    }

    /** The colors of the page (the design tokens in `variables.css`) and of the canvas. */
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
        this.modeControllers[mode].forEach(controller => controller.startListening());
        this.paper.setInteractivity(interactivity[mode]);
        setControlsOperable(this.paper, mode === Mode.Runtime);
        this.paper.setGrid(getGrid(mode, this.colorScheme));
        this.el.dataset.mode = mode;
        // The side panels are hidden in the runtime mode only (the attribute above): the canvas changes its size.
        zoomToFit(this);
    }

    protected leaveMode(mode: Mode): void {
        clearSelection(this);
        this.modeControllers[mode].forEach(controller => controller.stopListening());
        this.destroyStencil();
        this.destroySnaplines();
        this.toolbar.remove();
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

    protected destroyStencil(): void {
        this.stencil?.remove();
        this.stencil = null;
    }

    protected createSnaplines(): void {
        this.snaplines = new ui.Snaplines({ ...snaplinesOptions, paper: this.paper });
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
    // The example (a boiler house), saved with the Save button: its cells, its images and favorites
    app.loadJSON(boilerHouse as dia.Graph.JSON);
    return app;
}
