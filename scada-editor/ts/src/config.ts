import { anchors, dia, ui } from '@joint/plus';
import { ColorScheme, GRID_SIZE, Mode, SELECTION_COLOR } from './const';
import type { RUNTIME } from './runtime/controls';
import { connectionStrategy, gridSide } from './canvas/connections';
import { type DERIVED, routerNamespace } from './shapes/common/routing';
import type { PREFERENCE } from './palette/favorites';
import Label from './shapes/models/instruments/Label';
import SignalLine from './shapes/models/instruments/SignalLine';
import Wire from './shapes/models/electrical/Wire';
import Conveyor from './shapes/models/bulk/Conveyor';
import Arrow from './shapes/models/instruments/Arrow';
import Screen from './shapes/models/diagram/Screen';
import { isTerminal } from './shapes/common/ports';
import ShapeView from './shapes/views/ShapeView';

export const ZOOM = { min: 0.2, max: 3 };

/** The pointer moves (events, not pixels) after which a press is not a click but a drag: on the canvas and in the palette */
export const CLICK_THRESHOLD = 10;

export const paperOptions: dia.Paper.Options = {
    // A shape without a view of its own (a chart has one): rendered again when its color changes (see `ShapeView`)
    elementView: (_element, namespaceView) => namespaceView ?? ShapeView,
    width: 1,
    height: 1,
    gridSize: GRID_SIZE,
    // A line every other grid step: every step would be too dense to read.
    drawGridSize: 2 * GRID_SIZE,
    // A click still counts as a click if the pointer moves a little in between - and moves nothing:
    // the dragging starts after as many moves (the element catches up with the pointer then).
    clickThreshold: CLICK_THRESHOLD,
    moveThreshold: CLICK_THRESHOLD,
    async: true,
    autoFreeze: true,
    viewManagement: true,
    frozen: true,
    // The center of a port (its pipe stub, see `pipeStubGroup()`), rotated with the element; a side of an element
    // has an anchor of its own (see `connectionStrategy`).
    defaultAnchor: { name: 'center', args: { useModelGeometry: true, rotate: true }},
    // The right angles leave the stubs of the rotated elements along them (see `routing.ts`).
    routerNamespace,
    // The anchor is on a side of the element already (see `connectionStrategy`).
    defaultConnectionPoint: { name: 'anchor' },
    // The anchors of the paper with the one of the ends of the pipes on the sides (see `gridSide`)
    anchorNamespace: { ...anchors, gridSide },
    // A dragged end of a pipe snaps to the ports (or the sides of the elements without ones) nearby.
    snapLinks: { radius: 2 * GRID_SIZE },
    // A dragged vertex or end of a link snaps in line with the other points of the link (straight segments).
    snapLinksSelf: { distance: GRID_SIZE },
    connectionStrategy,
    // Where a dragged pipe end would connect: the end of a pipe stub (see `pipePorts()`)
    // or an element, outlined in the color of the selection.
    highlighting: {
        [dia.CellView.Highlighting.CONNECTING]: {
            name: 'mask',
            options: {
                padding: 3,
                attrs: {
                    stroke: SELECTION_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                }
            }
        }
    },
    // The end of a link (moved with its arrowhead) connects to an element (not to another link nor the screen; a label
    // to an arrow only): a pipe to one of its pipe stubs if it has any (to its side otherwise), a wire to an electrical
    // terminal, a signal line, an arrow and a conveyor to its body.
    validateConnection: (sourceView, sourceMagnet, targetView, targetMagnet, end, linkView) => {
        const [view, magnet] = end === 'source' ? [sourceView, sourceMagnet] : [targetView, targetMagnet];
        if (!view || !view.model.isElement() || view.model instanceof Screen) return false;
        // A label: an arrow only (from a note to a part of the plant)
        if (view.model instanceof Label) return linkView.model instanceof Arrow;
        // Nor to a shape of the background
        if (['Rectangle', 'Ellipse'].includes(view.model.get('type'))) return false;
        const element = view.model as dia.Element;
        const portId = magnet ? view.findAttribute('port', magnet) : null;
        if (linkView.model instanceof Wire) return Boolean(portId) && isTerminal(element.getPort(portId!));
        if (linkView.model instanceof SignalLine || linkView.model instanceof Arrow) return !portId;
        // A conveyor: to the body of an element (not to a pipe stub nor a terminal), not to an electrical one
        if (linkView.model instanceof Conveyor) return !portId && !(element.getPorts().length > 0 && element.getPorts().every(isTerminal));
        // A pipe: not to an electrical element
        const ports = element.getPorts();
        if (ports.length === 0) return true;
        if (ports.every(isTerminal)) return false;
        return Boolean(portId) && !isTerminal(element.getPort(portId!));
    }
};

type Interactivity = (cellView: dia.CellView) => dia.CellView.InteractivityOptions | boolean;

/** Whether the link is connected to a cell by any of its ends. */
function isConnected(link: dia.Link): boolean {
    return Boolean(link.getSourceCell() || link.getTargetCell());
}

/** What the user can do with the cells in each mode. */
export const interactivity: Record<Mode, Interactivity | false> = {
    [Mode.Edit]: ({ model }) => ({
        elementMove: true,
        // A pipe is moved as a whole only while it is not attached to anything.
        linkMove: model.isLink() && !isConnected(model),
        // The pipes come from the palette, not from the ports.
        // Their ends are moved (and reconnected) with the arrowheads of the selected pipe.
        addLinkFromMagnet: false,
        labelMove: false
    }),
    [Mode.Runtime]: false
};

/**
 * The canvas in each color scheme: its background and the lines of its grid (drawn in the tones of the canvas by
 * `canvas.css`, these until its style applies).
 */
export const canvasColors: Record<ColorScheme, { background: string; grid: string; majorGrid: string }> = {
    // The background: of the theme (`--shape-canvas`, the surfaces of the finish `none` are of it too)
    [ColorScheme.Light]: { background: 'var(--shape-canvas)', grid: '#e1e8e6', majorGrid: '#c9d4d1' },
    [ColorScheme.Dark]: { background: 'var(--shape-canvas)', grid: '#12223a', majorGrid: '#1d3354' }
};

// A thick line every this many thin ones
const MAJOR_GRID_FACTOR = 5;

/** The grid is drawn only while the diagram is edited (it is what the elements snap to). */
export function getGrid(mode: Mode, colorScheme: ColorScheme): dia.Paper.GridOptions | false {
    if (mode === Mode.Runtime) return false;
    const { grid, majorGrid } = canvasColors[colorScheme];
    // Thin lines, and thick ones every few of them
    return {
        name: 'doubleMesh',
        args: [
            { color: grid, thickness: 1 },
            { color: majorGrid, thickness: 1.5, scaleFactor: MAJOR_GRID_FACTOR }
        ]
    };
}

/**
 * The history records the editing of the diagram (the images of the user included), not the changes
 * in the runtime mode, nor the changes derived from other ones (they follow them on undo and redo),
 * nor the preferences of the user (the favorite shapes).
 */
export const historyOptions: Partial<dia.CommandManager.Options> = {
    cmdBeforeAdd: (_eventName: string, ...eventArgs: unknown[]) => {
        // The options are the last argument of every graph event.
        const options = eventArgs[eventArgs.length - 1] as Partial<typeof RUNTIME & typeof DERIVED & typeof PREFERENCE> | undefined;
        return !options?.runtime && !options?.derived && !options?.preference;
    }
};

/** A moved (or resized) element aligns with the others, on the grid otherwise. */
export const snaplinesOptions: Partial<ui.Snaplines.Options> = {
    usePaperGrid: true,
    // The screen (see `screen.ts`) doesn't snap to the elements; they snap to it (its sides, its center).
    canSnap: elementView => elementView.model.get('type') !== 'Screen'
};

export const scrollerOptions: Partial<ui.PaperScroller.Options> = {
    autoResizePaper: true,
    borderless: true,
    scrollWhileDragging: true,
    cursor: 'grab',
    baseWidth: 10,
    baseHeight: 10,
    contentOptions: {
        allowNewOrigin: 'any',
        useModelGeometry: true,
        padding: 200
    }
};

export const fitOptions: dia.Paper.TransformToFitContentOptions = {
    useModelGeometry: true,
    padding: 40,
    minScale: ZOOM.min,
    maxScale: 1
};

/**
 * The runtime mode fits the diagram to the canvas, larger than its actual size
 * too (the side panels are hidden and there's room for it).
 * The padding leaves room for the controls below the elements.
 */
export const runtimeFitOptions: dia.Paper.TransformToFitContentOptions = {
    ...fitOptions,
    padding: 50,
    maxScale: 2
};

/** The label of the mode button says which mode it switches to. */
export const modeButtonText: Record<Mode, string> = {
    [Mode.Edit]: 'Run',
    [Mode.Runtime]: 'Edit'
};

/** What the mode button does (it switches to the other mode). */
const modeButtonTooltip: Record<Mode, string> = {
    [Mode.Edit]: 'Run the plant (the runtime mode)',
    [Mode.Runtime]: 'Back to editing the diagram'
};

/**
 * The tooltips of the app: of every element with the `data-tooltip` attribute (the toolbar buttons,
 * the shapes of the palette, the help of the inspector, ...), next to it - on the right of the palette,
 * on the left of the inspector, below the toolbar.
 */
export const tooltipOptions: Partial<ui.Tooltip.Options> = {
    rootTarget: document.body,
    target: '[data-tooltip]',
    padding: 8,
    // Shown after a while (not while the pointer passes over), fading in
    animation: { delay: '400ms', duration: '150ms', timingFunction: 'ease-out' },
    direction: 'auto' as ui.Tooltip.Options['direction'],
    position: (element: Element) => {
        // The side of the tooltip with its arrow (pointing to the element): the palette on the left edge
        // has the tooltips on its right (their arrows on the left), the inspector on the right edge on its left.
        const position = element.closest('.stencil-panel') ? 'left' : element.closest('.inspector-panel') ? 'right' : 'bottom';
        return position as ui.Tooltip.TooltipPosition;
    }
};

export function getToolbarOptions(mode: Mode): Partial<ui.Toolbar.Options> {
    // A new diagram is started, the diagram is saved (as JSON) and opened in the edit mode.
    const file: ui.Toolbar.Options['tools'] = mode === Mode.Edit ? [{
        type: 'button',
        name: 'new',
        group: 'file',
        attrs: { button: { 'data-tooltip': 'A new diagram' }}
    }, {
        type: 'button',
        name: 'open',
        group: 'file',
        attrs: { button: { 'data-tooltip': 'Open a diagram (JSON)' }}
    }, {
        type: 'button',
        name: 'save',
        group: 'file',
        attrs: { button: { 'data-tooltip': 'Save the diagram (JSON)' }}
    }, {
        type: 'button',
        name: 'export',
        group: 'file',
        attrs: { button: { 'data-tooltip': 'Export the diagram as an image (WebP): the screen if there is one' }}
    }] : [];
    // The settings of the diagram (see `settings.ts`): edited in the edit mode
    const settings: ui.Toolbar.Options['tools'] = mode === Mode.Edit ? [{
        type: 'button',
        name: 'settings',
        group: 'settings',
        // Labeled: what is behind it is not obvious from the icon (the screen, the animations, the editor)
        text: 'Settings',
        attrs: { button: { 'data-tooltip': 'The settings of the diagram (the screen, the animations) and of the editor' }}
    }] : [];
    // The messages between the diagram and the plant (see `log/log.ts`): in the runtime mode
    const log: ui.Toolbar.Options['tools'] = mode === Mode.Runtime ? [{
        type: 'button',
        name: 'log',
        group: 'settings',
        text: 'Log',
        attrs: { button: { 'data-tooltip': 'The messages between the diagram and the plant: the updates, the commands' }}
    }] : [];
    const history: ui.Toolbar.Options['tools'] = mode === Mode.Edit ? [{
        type: 'undo',
        name: 'undo',
        group: 'history',
        attrs: { button: { 'data-tooltip': 'Undo (Ctrl+Z)' }}
    }, {
        type: 'redo',
        name: 'redo',
        group: 'history',
        attrs: { button: { 'data-tooltip': 'Redo (Ctrl+Y)' }}
    }] : [];
    return {
        // Disable the undo / redo buttons when there's nothing to undo / redo (and the zoom ones at the limits).
        autoToggle: true,
        groups: {
            title: { index: 1 },
            file: { index: 2 },
            history: { index: 3 },
            zoom: { index: 4 },
            // The settings of the diagram: with the editing (on the left); the view of the app on the right
            settings: { index: 5 },
            view: { index: 6, align: ui.Toolbar.Align.Right },
            mode: { index: 7, align: ui.Toolbar.Align.Right }
        },
        tools: [{
            type: 'label',
            name: 'title',
            text: 'SCADA Editor',
            group: 'title'
        },
        ...file,
        ...history,
        {
            type: 'zoomOut',
            name: 'zoomOut',
            group: 'zoom',
            min: ZOOM.min,
            attrs: { button: { 'data-tooltip': 'Zoom out' }}
        }, {
            type: 'zoomIn',
            name: 'zoomIn',
            group: 'zoom',
            max: ZOOM.max,
            attrs: { button: { 'data-tooltip': 'Zoom in' }}
        }, {
            // Not the `zoomToFit` tool (it rounds the zoom): the same fit as on loading (see `zoomToFit()`)
            type: 'button',
            name: 'zoomToFit',
            group: 'zoom',
            attrs: { button: { 'data-tooltip': 'Zoom to fit the diagram' }}
        },
        ...settings,
        ...log,
        {
            // The whole page (hidden by the tool itself in an iframe, where the page can't be full screen)
            type: 'fullscreen',
            name: 'fullscreen',
            group: 'view',
            target: document.documentElement,
            attrs: { button: { 'data-tooltip': 'Full screen' }}
        }, {
            type: 'button',
            name: 'colorScheme',
            group: 'view',
            attrs: { button: { 'data-tooltip': 'Light / dark' }}
        }, {
            type: 'button',
            name: 'mode',
            group: 'mode',
            text: modeButtonText[mode],
            attrs: { button: { 'data-tooltip': modeButtonTooltip[mode] }}
        }]
    };
}
