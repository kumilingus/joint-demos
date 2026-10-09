import { dia, mvc, ui } from '@joint/plus';
import { cellNamespace } from './shapes';
import { createStencil } from './palette/stencil';
import { createGraph } from './canvas/layers';
import { createSelection } from './canvas/selection';
import { createNavigator } from './canvas/navigator';
import { EXAMPLES } from './examples';
import { type ColorScheme, Mode } from './const';
import { getGrid, interactivity, paperOptions, scrollerOptions, snaplinesOptions } from './canvas/config';
import { createToolbar } from './toolbar/toolbar';
import { historyOptions } from './history';
import { tooltipOptions } from './tooltips';
import { addImages, clearSelection, refreshPalette, storedColorScheme, storeColorScheme, zoomToFit } from './actions';
import { loadPreferences } from './preferences';
import { isControlEvent, setControlsOperable } from './runtime/controls';
import { Plant } from './plant/plant';
import TagIndex from './plant/TagIndex';
import { tagNewCell } from './plant/tags';
import { setTablesLive } from './shapes/views/TableView';
import { getImages, IMAGES_ATTRIBUTE } from './palette/images';
import { FAVORITES_ATTRIBUTE } from './palette/favorites';
import { ANIMATIONS_ATTRIBUTE } from './runtime/animations';
import { applyDiagramStyle, STYLE_ATTRIBUTE } from './diagram-style';
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
    ToolbarController,
    LockController,
    FindController,
    TagBadgesController,
    RoutingController
} from './controllers';
// The mock of the plant (see `plant/mock/`): an app with a real plant deletes it and this line
import MockPlantController from './plant/mock/MockPlantController';
import Snaplines from './canvas/Snaplines';
import { showInspectorPlaceholder } from './inspector/placeholder';
import { hideToolsOverPanel, type PanelContent } from './inspector/panel';

/** A side panel of the edit mode (see `App.setPanelShown()`) */
export type SidePanel = 'palette' | 'inspector';

export class App {

    el: HTMLElement;
    inspectorEl: HTMLElement;
    /** What the inspector panel shows (see `inspector/panel.ts`) */
    panel: PanelContent | null = null;
    graph: dia.Graph;
    /** The elements by their tags (see `TagIndex`) */
    tags: TagIndex;
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
    colorScheme: ColorScheme = storedColorScheme();
    /** The preferences of the user remembered in this browser (see `preferences.ts`), set with the setters below */
    protected preferences = loadPreferences({
        snaplines: true,
        inUse: true,
        // A device used with a finger (a tablet): a drag mostly means to scroll
        moveSelectedOnly: window.matchMedia('(pointer: coarse)').matches
    });
    /** Whether a moved or resized element aligns with the others (see the settings) */
    snaplinesEnabled = this.preferences.snaplines;
    /** The cells as they were before the runtime mode (put back when it is left: its changes are not the diagram's) */
    runtimeCells: dia.Cell.JSON[] | null = null;
    /** Whether the palette has the group of the shapes in use (see `refreshPalette()`) */
    inUseShown = this.preferences.inUse;
    /**
     * Whether a drag moves a selected cell only - on any other it pans the canvas (see `EditController`): by default
     * on a device used with a finger (a tablet), where a drag mostly means to scroll
     */
    moveSelectedOnly = this.preferences.moveSelectedOnly;
    selection = new mvc.Collection<dia.Cell>();
    /** Shows the selection on the canvas: the region, the frames, moving the selected elements together */
    selectionView: ui.Selection;

    /** Controllers listening in every mode. */
    controllers: Controller[];
    /** Controllers listening only in the given mode. */
    modeControllers: Record<Mode, Controller[]>;

    constructor(el: HTMLElement) {
        this.el = el;
        this.setMoveSelectedOnly(this.moveSelectedOnly);
        this.inspectorEl = partOf(el, '.scada-inspector-panel');

        this.graph = createGraph();
        // The first listener of the graph: up to date for all the others
        this.tags = new TagIndex(this.graph);
        // The style of the diagram on the document (see `diagram-style.ts`): loaded with it, changed in the settings - the
        // graph's own (it triggers the `change:style` of its cells too: their own colors)
        this.graph.on(`change:${STYLE_ATTRIBUTE}`, (model: unknown) => {
            if (model === this.graph) {
                applyDiagramStyle(this, this.graph.previous(STYLE_ATTRIBUTE));
            }
        });

        this.history = new dia.CommandManager({ ...historyOptions, graph: this.graph });

        this.paper = new dia.Paper({
            ...paperOptions,
            model: this.graph,
            cellViewNamespace: cellNamespace,
            interactive: this.getInteractivity(this.mode),
            // Not an event of the paper on a control (in its layer, not in the view of the element: a press would be one
            // on the blank canvas, its default action - dragging the slider - prevented)
            guard: (evt: dia.Event) => isControlEvent(evt),
            getImages: () => getImages(this.graph)
        });
        // The paper of the diagram (not of the palette, the minimap, a preview): its cursors, ... (see `canvas.css`)
        this.paper.el.classList.add('scada-diagram');

        this.scroller = new ui.PaperScroller({
            ...scrollerOptions,
            paper: this.paper
        });
        partOf(el, '.scada-canvas').appendChild(this.scroller.el);
        this.scroller.render();

        this.selectionView = createSelection(this.scroller, this.selection);

        this.navigator = createNavigator(partOf(el, '.scada-navigator-panel'), this.scroller);

        this.keyboard = new ui.Keyboard();

        this.tooltip = new ui.Tooltip(tooltipOptions);

        this.controllers = [
            new CanvasController(this),
            new ControlsController(this),
            new SelectionController(this),
            new TagsController(this),
            new PipeColorController(this),
            new GroupController(this),
            // Hold Alt: the IDs (see `canvas/tag-badges.ts`)
            new TagBadgesController(this)
        ];
        // In both modes: one controller (its list)
        const findController = new FindController(this);
        this.modeControllers = {
            // Each listens to the toolbar of its mode.
            [Mode.Edit]: [
                new ToolbarController(this),
                new EditController(this),
                new KeyboardController(this),
                new PaletteController(this),
                new LockController(this),
                new RoutingController(this),
                findController
            ],
            [Mode.Runtime]: [
                new ToolbarController(this),
                new RuntimeController(this),
                new MockPlantController(this),
                new LogController(this),
                new AnimationsController(this),
                new ElectricalController(this),
                findController
            ]
        };

        this.controllers.forEach(controller => controller.startListening());
        this.enterMode(this.mode);
        this.setColorScheme(this.colorScheme);
        // What the inspector panel shows with nothing in it (see `inspector/placeholder.ts`): the app complete
        showInspectorPlaceholder(this);
        // The edited cell seen without its tools while the pointer is in the panel (see `panel.ts`)
        hideToolsOverPanel(this);
    }

    setMode(mode: Mode): void {
        if (mode === this.mode) {
            return;
        }
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
        this.graph.fromJSON({
            [IMAGES_ATTRIBUTE]: {},
            [FAVORITES_ATTRIBUTE]: [],
            [ANIMATIONS_ATTRIBUTE]: 'full',
            [STYLE_ATTRIBUTE]: {},
            ...json
        });
        applyDiagramStyle(this);
        this.history.reset();
        zoomToFit(this);
        this.paper.unfreeze();
    }

    /** Show or hide a side panel of the edit mode: the palette, the inspector (the canvas takes its place) */
    setPanelShown(panel: SidePanel, shown: boolean): void {
        this.el.dataset[panel] = shown ? 'shown' : 'hidden';
    }

    isPanelShown(panel: SidePanel): boolean {
        return this.el.dataset[panel] !== 'hidden';
    }

    /** The colors of the page (the design tokens in `theme/tokens.css`): the canvas and its grid follow them. */
    setColorScheme(colorScheme: ColorScheme): void {
        this.colorScheme = colorScheme;
        document.documentElement.dataset.colorScheme = colorScheme;
        storeColorScheme(colorScheme);
    }

    /**
     * What the user can't do in a mode doesn't exist in it (it's not only hidden):
     * the palette is created for the edit mode only, the toolbar for each mode (with its tools).
     */
    protected enterMode(mode: Mode): void {
        this.toolbar = createToolbar(partOf(this.el, '.scada-toolbar-panel'), this, mode);
        if (mode === Mode.Edit) {
            const snaplines = this.createSnaplines();
            this.stencil = createStencil(partOf(this.el, '.scada-main'), this.scroller, snaplines, {
                getImages: () => getImages(this.graph),
                onUpload: images => addImages(this, images),
                // A part of the plant gets an ID (see `plant/tags.ts`)
                onDrop: cell => tagNewCell(this.tags, cell)
            });
        }
        if (mode === Mode.Runtime) {
            // Nothing of the runtime mode in the history; the diagram kept as it is
            this.history.stopListening();
            // All their attributes, the defaults too (left out, a sync would remove them)
            this.runtimeCells = this.graph.getCells().map(cell => cell.toJSON({ ignoreDefaults: false }));
        }
        // A plant for the run (see `plant.ts`): before the controllers of the mode, they listen to it
        if (mode === Mode.Runtime) {
            this.plant = new Plant(this.tags);
        }
        this.modeControllers[mode].forEach(controller => controller.startListening());
        this.paper.setInteractivity(this.getInteractivity(mode));
        setControlsOperable(this.paper, mode === Mode.Runtime);
        setTablesLive(this.paper, mode === Mode.Runtime);
        this.paper.setGrid(getGrid(mode));
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
    protected getInteractivity(mode: Mode): dia.Paper.Options['interactive'] {
        const base = interactivity[mode];
        if (!base) {
            return false;
        }
        return (cellView: dia.CellView) => {
            const options = base(cellView);
            return typeof options === 'object' ? { ...options, stopDelegation: this.selection.has(cellView.model) } : options;
        };
    }

    protected destroyStencil(): void {
        this.stencil?.remove();
        this.stencil = null;
    }

    /** Whether a drag moves a selected cell only (see `moveSelectedOnly`): shown by the cursors too (see `canvas.css`) */
    setMoveSelectedOnly(selectedOnly: boolean): void {
        this.moveSelectedOnly = selectedOnly;
        this.el.dataset.move = selectedOnly ? 'selected' : 'any';
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

    protected createSnaplines(): ui.Snaplines {
        // With a fix of the library for the dragged groups (see `Snaplines`)
        const snaplines = this.snaplines = new Snaplines({ ...snaplinesOptions, paper: this.paper });
        if (!this.snaplinesEnabled) {
            snaplines.disable();
        }
        return snaplines;
    }

    protected destroySnaplines(): void {
        this.snaplines?.remove();
        this.snaplines = null;
    }
}

/** A part of the markup of the app (see `index.html`): there, or the app can't start */
function partOf(container: ParentNode, selector: string): HTMLElement {
    const part = container.querySelector<HTMLElement>(selector);
    if (!part) {
        throw new Error(`The SCADA editor: no "${selector}" in the page`);
    }
    return part;
}

export function init(el: HTMLElement = partOf(document, '.scada-app')): App {
    const app = new App(el);
    // The first example (a boiler house), saved with the Save button: its cells, its images and favorites
    app.loadJSON(EXAMPLES[0].json);
    return app;
}
