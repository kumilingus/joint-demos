import { type dia, g, ui } from '@joint/plus';
import {
    cellNamespace,
    Pump, Compressor, Fan, Motor, Blower, Turbine, ConveyorBelt,
    ControlValve, HandValve, CheckValve, ButterflyValve, BallValve, SolenoidValve, ReliefValve,
    HeatExchanger, Filter, Boiler, Reactor, DistillationColumn, Separator, Cyclone,
    LiquidTank, ConicTank, MixingTank, Silo, SphericalTank, Hopper, HorizontalTank,
    Chimney, CoolingTower,
    Instrument, PressureGauge, Panel, Thermometer, FlowMeter, Beacon, Display,
    Zone, Join, Tee, Cross, Elbow, EndCap, Manifold, Pipe, SignalLine, Label, CustomImage,
    GateValve, YStrainer, OrificePlate, AirCooler, Scrubber, WaterTower,
    Trend
} from './shapes';
import { getFootprint } from './shapes/footprint';
import { createGraph } from './layers';
import { pack } from './packing';
import { descriptions } from './descriptions';
import { CLICK_THRESHOLD } from './config';
import { type ImageEntry, type ImageLibrary, readImageFile } from './images';

// The shapes are shown in the palette smaller than on the canvas.
const STENCIL_SCALE = 0.5;

const STENCIL_WIDTH = 240;
const STENCIL_PADDING = 10;

// The width a group can take, in the (unscaled) coordinates of the shapes
const MAX_GROUP_WIDTH = (STENCIL_WIDTH - 2 * STENCIL_PADDING) / STENCIL_SCALE;

// The space around the cells of a group, and between them
const GROUP_MARGIN = 10;
const GAP = 20;

/** The groups of the palette filled with the shapes of the others (and hidden while empty) */
export enum DerivedGroup {
    Favorites = 'favorites',
    InUse = 'inUse'
}

const groups: Record<string, ui.Stencil.Group> = {
    // The shapes marked as favorite (in the inspector panel, see `shape-preview.ts`)
    [DerivedGroup.Favorites]: { index: 1, label: 'Favorites' },
    // The shapes used in the diagram
    [DerivedGroup.InUse]: { index: 2, label: 'In Use' },
    // The shapes of the user: uploaded images
    custom: { index: 3, label: 'Custom' },
    piping: { index: 4, label: 'Piping' },
    rotating: { index: 5, label: 'Rotating Equipment' },
    valves: { index: 6, label: 'Valves' },
    process: { index: 7, label: 'Process' },
    storage: { index: 8, label: 'Storage' },
    structures: { index: 9, label: 'Structures' },
    instruments: { index: 10, label: 'Instruments' }
};

/** The name of the shape of the palette (see `descriptions.ts`), shown in its tooltip */
function setTooltip(cell: dia.Cell): void {
    const { title } = descriptions[cell.get('type')] ?? { title: cell.get('type') };
    // An image of the user: its name
    const name = cell.get('type') === 'CustomImage' ? cell.attr('label/text') : title;
    cell.attr('root/data-tooltip', name);
}

/**
 * Pack the cells of a group into the width of the palette (see `packing.ts`) by their footprints
 * (the pipe stubs, the actuators, ... included, the labels not), from the top left corner.
 */
function layoutGroup(graph: dia.Graph): void {
    // The palette doesn't show the labels (see `styles.css`).
    const items = graph.getCells().map(cell => ({ data: cell, footprint: getFootprint(cell, { label: false }) }));
    const stripWidth = MAX_GROUP_WIDTH - 2 * GROUP_MARGIN;
    const { placements } = pack(
        items.map(({ data, footprint }) => ({ data: { cell: data, footprint }, width: footprint.width, height: footprint.height })),
        stripWidth,
        { gap: GAP, align: 'left' }
    );
    placements.forEach(({ data: { cell, footprint }, x, y }) => {
        (cell as dia.Element | dia.Link).translate(GROUP_MARGIN + x - footprint.x, GROUP_MARGIN + y - footprint.y);
    });
}

/** The palette gets the images of the diagram (its shapes of the user) and tells when the user uploads some. */
export interface StencilImages {
    getImages: () => ImageLibrary;
    onUpload: (images: ImageEntry[]) => void;
}

export function createStencil(
    el: HTMLElement,
    scroller: ui.PaperScroller,
    snaplines: ui.Snaplines,
    { getImages, onUpload }: StencilImages
): ui.Stencil {

    const stencil = new ui.Stencil({
        el,
        paper: scroller,
        width: STENCIL_WIDTH,
        height: undefined,
        groups,
        layout: layoutGroup,
        dropAnimation: true,
        // The shape dropped on the canvas has no tooltip (see `setTooltip()`).
        dragEndClone: (cell: dia.Cell) => {
            const clone = cell.clone();
            clone.removeAttr('root/data-tooltip');
            return clone;
        },
        // A click shows the shape in the inspector panel (see `PaletteController`): the dragging starts
        // with a move, where a click ends (the same threshold as on the canvas).
        dragThreshold: CLICK_THRESHOLD,
        scaleClones: true,
        // A shape dragged from the palette aligns with the others too.
        snaplines,
        paperPadding: STENCIL_PADDING,
        // Search by the type (e.g. "tank", "valve") and by the texts of the shapes.
        search: {
            '*': ['type', 'attrs/label/text'],
            'Instrument': ['attrs/tag/text', 'attrs/loop/text']
        },
        // The shape dragged out of the palette shows its image too.
        paperDragOptions: () => ({ getImages }),
        paperOptions: () => ({
            // The palette has the layers too (a shape knows its layer).
            model: createGraph(),
            // The shapes of the user show the images of the diagram.
            getImages,
            clickThreshold: CLICK_THRESHOLD,
            cellViewNamespace: cellNamespace
        })
    });

    // Every load, reload and search of a group fits its paper (see `fitToFootprints()`).
    // `fitPaperToContent()` is a method of the stencil not in its typings.
    (stencil as ui.Stencil & { fitPaperToContent: (paper: dia.Paper) => void }).fitPaperToContent = fitToFootprints;
    stencil.render();

    Object.keys(groups).forEach((group) => {
        stencil.getPaper(group).scale(STENCIL_SCALE);
    });

    stencil.load({
        ...createShapes(),
        custom: customShapes(getImages())
    });

    addUploadButton(stencil, onUpload);

    return stencil;
}

/** The shapes of the palette by the groups (new ones each time: a shape is in one graph only), with their tooltips */
function createShapes(): Record<string, dia.Cell[]> {
    const shapes: Record<string, dia.Cell[]> = {
        rotating: [
            new Pump(),
            new Compressor(),
            new Fan(),
            new Blower(),
            new Motor(),
            new Turbine(),
            new ConveyorBelt()
        ],
        valves: [
            new ControlValve({
                attrs: { label: { text: 'Control Valve' }}
            }),
            new HandValve({
                attrs: { label: { text: 'Hand Valve' }}
            }),
            new CheckValve(),
            new ButterflyValve(),
            new BallValve(),
            new SolenoidValve(),
            new ReliefValve(),
            new GateValve()
        ],
        process: [
            new HeatExchanger(),
            new Filter(),
            new Separator(),
            new Boiler(),
            new Reactor(),
            new DistillationColumn(),
            new Cyclone(),
            new AirCooler(),
            new Scrubber()
        ],
        storage: [
            new LiquidTank(),
            new ConicTank(),
            new MixingTank(),
            new Silo(),
            new SphericalTank(),
            new Hopper(),
            new HorizontalTank(),
            new WaterTower()
        ],
        structures: [
            new Chimney(),
            new CoolingTower()
        ],
        instruments: [
            new Instrument(),
            new PressureGauge(),
            new Panel({ level: 70 }),
            new Thermometer(),
            new FlowMeter(),
            new Beacon({ power: 1 }),
            new Display(),
            new Trend(),
            new SignalLine({
                source: { x: 0, y: 0 },
                target: { x: 100, y: 0 }
            }),
            new Label()
        ],
        piping: [
            new Pipe({
                source: { x: 0, y: 0 },
                target: { x: 140, y: 0 }
            }),
            new Join(),
            new Tee(),
            new Cross(),
            new Elbow(),
            new EndCap(),
            new Manifold(),
            new YStrainer(),
            new OrificePlate(),
            new Zone()
        ]
    };
}
    Object.values(shapes).flat().forEach(setTooltip);
    return shapes;

/**
 * What identifies a shape of the palette (computed from the shape, so that the shapes of any diagram
 * are found in the palette): the type, plus the image for an uploaded image.
 */
export function paletteKey(cell: dia.Cell): string {
    const type = cell.get('type');
    if (type === 'CustomImage') return `${type}:${cell.attr('image/imageId')}`;
    return type;
}

/** The shapes of the palette (the images of the diagram included) by their keys */
function shapesByKey(images: ImageLibrary): Map<string, dia.Cell> {
    const shapes = [...Object.values(createShapes()).flat(), ...customShapes(images)];
    return new Map(shapes.map(cell => [paletteKey(cell), cell]));
}

/** A group of the palette with the shapes of the keys (in the order of the palette), hidden if there are none. */
export function loadDerivedGroup(stencil: ui.Stencil, group: DerivedGroup, keys: Set<string>, images: ImageLibrary): void {
    const shapes = [...shapesByKey(images)].filter(([key]) => keys.has(key)).map(([, cell]) => cell);
    // Shown before loading: the paper is fitted on load (a hidden group has nothing to measure).
    const groupEl = stencil.el.querySelector<HTMLElement>(`.group[data-name="${group}"]`);
    if (groupEl) groupEl.hidden = shapes.length === 0;
}
    stencil.loadGroup(shapes, group);

/** The keys of the palette shapes used in the diagram */
export function keysInUse(graph: dia.Graph): Set<string> {
    return new Set(graph.getCells().map(paletteKey));
}

/** A shape for each image of the diagram (the group of the custom shapes), with its tooltip */
export function customShapes(images: ImageLibrary): dia.Cell[] {
    const shapes = Object.entries(images).map(([imageId, image]) => CustomImage.fromImage(imageId, image));
    shapes.forEach(setTooltip);
    return shapes;
}

/**
 * Fit the paper of a group to the footprints of its shapes (the model geometry, as their layout),
 * not to the rendered views: nothing is measured in a hidden or a collapsed group.
 * While searching, to the shapes that match.
 */
function fitToFootprints(paper: dia.Paper): void {
    const footprints = paper.model.getCells()
        .filter(cell => !paper.findViewByModel(cell)?.el.classList.contains('unmatched'))
        .map(cell => getFootprint(cell, { label: false }));
    const contentArea = footprints.length > 0
        ? footprints.reduce((area, footprint) => area.union(footprint))
        : new g.Rect(0, 0, 0, 0);
    paper.fitToContent({
        contentArea,
        padding: STENCIL_PADDING,
        minWidth: paper.getComputedSize().width
    });
}

/** Show the images of the diagram in the group of the custom shapes (after an upload, after loading a diagram). */
export function loadCustomShapes(stencil: ui.Stencil, images: ImageLibrary): void {
    stencil.loadGroup(customShapes(images), 'custom');
}

/** A button in the group of the custom shapes: it uploads images (into the diagram, see `onUpload`). */
function addUploadButton(stencil: ui.Stencil, onUpload: StencilImages['onUpload']): void {
    const groupEl = stencil.el.querySelector('.group[data-name="custom"]');
    if (!groupEl) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.hidden = true;
    const button = document.createElement('label');
    button.className = 'stencil-upload';
    button.dataset.tooltip = 'Upload images (PNG, JPEG, SVG, ...) as shapes of your own';
    button.textContent = 'Upload images';
    button.append(input);
    groupEl.querySelector('.group-label')?.after(button);

    input.addEventListener('change', async() => {
        const files = Array.from(input.files || []);
        // The same files can be uploaded again.
        input.value = '';
        const images = (await Promise.all(files.map(readImageFile))).filter((image): image is ImageEntry => image !== null);
        if (images.length === 0) return;
        onUpload(images);
        stencil.openGroup('custom');
    });
}
