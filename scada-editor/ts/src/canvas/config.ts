import { anchors, dia, type ui } from '@joint/plus';
import { CANVAS_COLOR, CLICK_THRESHOLD, GRID_SIZE, Mode, SELECTION_COLOR } from '../const';
import { connectionStrategy, gridSide } from './connections';
import { routingPaperOptions } from '../shapes/common/routing';
import Label from '../shapes/models/instruments/Label';
import SignalLine from '../shapes/models/instruments/SignalLine';
import Wire from '../shapes/models/electrical/Wire';
import Conveyor from '../shapes/models/bulk/Conveyor';
import Arrow from '../shapes/models/instruments/Arrow';
import Screen from '../shapes/models/diagram/Screen';
import { isTerminal } from '../shapes/common/ports';
import ShapeView from '../shapes/views/ShapeView';

/*
 * The options of the canvas: the paper (its interactions in each mode, its colors, its grid), the scroller, the
 * snaplines, the zoom and the fit of the diagram.
 */

export const ZOOM = { min: 0.2, max: 3 };

export const paperOptions: dia.Paper.Options = {
    // The color of the canvas: of the theme and the style of the diagram (`--shape-canvas`, see `shapes.css`)
    background: { color: CANVAS_COLOR },
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
    // The routers and the connectors of the routings of the links; the right angles leave the stubs of the rotated
    // elements along them (see `routing.ts`)
    ...routingPaperOptions,
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
        if (!view || !view.model.isElement() || Screen.isScreen(view.model)) return false;
        // A label: an arrow only (from a note to a part of the plant)
        if (Label.isLabel(view.model)) return Arrow.isArrow(linkView.model);
        // Nor to a shape of the background
        if (['Rectangle', 'Ellipse'].includes(view.model.get('type'))) return false;
        const element = view.model;
        const portId = magnet ? view.findAttribute('port', magnet) : null;
        if (linkView.model instanceof Wire) return Boolean(portId) && isTerminal(element.getPort(portId!));
        if (SignalLine.isSignalLine(linkView.model) || Arrow.isArrow(linkView.model)) return !portId;
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

// A thick line every this many thin ones
const MAJOR_GRID_FACTOR = 5;

/** The grid is drawn only while the diagram is edited (it is what the elements snap to). */
export function getGrid(mode: Mode): dia.Paper.GridOptions | false {
    if (mode === Mode.Runtime) return false;
    // Thin lines, and thick ones every few of them: in the tones of the canvas (`--canvas-grid*` in `shapes.css`, of the
    // color scheme and the style of the diagram)
    return {
        name: 'doubleMesh',
        args: [
            { color: 'var(--canvas-grid)', thickness: 1 },
            { color: 'var(--canvas-grid-major)', thickness: 1.5, scaleFactor: MAJOR_GRID_FACTOR }
        ]
    };
}

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
