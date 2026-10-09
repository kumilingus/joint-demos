import { type dia, g, ui, util } from '@joint/plus';
import {
    cellNamespace,
    Pump, Compressor, Fan, Motor, Blower, Turbine, ConveyorBelt,
    ControlValve, HandValve, CheckValve, ButterflyValve, BallValve, SolenoidValve, ReliefValve,
    HeatExchanger, Filter, Boiler, Reactor, DistillationColumn, Separator, Cyclone,
    LiquidTank, ConicTank, MixingTank, Silo, SphericalTank, Hopper, HorizontalTank,
    Stack, CoolingTower,
    Instrument, PressureGauge, Panel, Thermometer, FlowMeter, Beacon, Display,
    Zone, Join, Tee, Cross, Elbow, EndCap, Manifold, Pipe, SignalLine, Arrow, Label, CustomImage,
    GateValve, YStrainer, OrificePlate, AirCooler, Scrubber, WaterTower,
    Generator, Transformer, Busbar, Battery, CircuitBreaker, Disconnector, Fuse, SurgeArrester, Ground,
    Lamp, Heater, ElectricMeter, Wire,
    DieselGenerator, WindTurbine, SolarArray, PowerTransformer, Switchgear, MotorControlCenter, BatteryBank, FuelTank,
    LineChart, BarChart, DonutChart, GaugeChart,
    Conveyor, RotaryKiln, Crusher, Mill, BucketElevator, BagFilter, Table,
    Rectangle, Ellipse
} from '../shapes';
import { getFootprint } from '../shapes/common/footprint';
import { createGraph } from '../canvas/layers';
import { pack } from './packing';
import { descriptions } from './descriptions';
import { CLICK_THRESHOLD } from '../const';
import { LABEL_COLOR } from '../const';
import { type ImageEntry, type ImageLibrary, readImageFile } from './images';
import ShapeView from '../shapes/views/ShapeView';
import { routingPaperOptions } from '../shapes/common/routing';
import { besidePanel, setBesidePanel } from '../tooltips';

// The shapes are shown in the palette smaller than on the canvas.
const STENCIL_SCALE = 0.5;

const STENCIL_WIDTH = 240;
const STENCIL_PADDING = 10;

// The width a group can take, in the (unscaled) coordinates of the shapes
const MAX_GROUP_WIDTH = (STENCIL_WIDTH - 2 * STENCIL_PADDING) / STENCIL_SCALE;

// The space around the cells of a group, and between them
const GROUP_MARGIN = 10;
const GAP = 20;
// The links of a group: all of the same length, on the top rows, further from the elements below them
const LINK_LENGTH = 180;
const LINKS_GAP = 2 * GAP;

/** The groups of the palette filled with the shapes of the others (and hidden while empty) */
// What a search looks in: the type (e.g. "tank", "valve") and the texts of the shapes (of all, of a type)
const SEARCH_PATHS: Record<string, string[]> = {
    '*': ['type', 'label/text'],
    'Instrument': ['function', 'loop']
};

/**
 * Whether the shape of the palette matches the search: by its type and its texts (see `SEARCH_PATHS`). Not in the
 * derived groups (favorites, in use): their shapes are in their own groups too - found there, not twice.
 */
function matchShape(cell: dia.Cell, keyword: string, groupId: string): boolean {
    if (!keyword) {
        return true;
    }
    if (Object.values(DerivedGroup).some(group => group === groupId)) {
        return false;
    }
    const paths = [...SEARCH_PATHS['*'], ...(SEARCH_PATHS[cell.get('type')] ?? [])];
    const search = keyword.toLowerCase();
    return paths.some(path => String(util.getByPath(cell.attributes, path, '/') ?? '').toLowerCase().includes(search));
}

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
    bulk: { index: 9, label: 'Bulk Handling' },
    structures: { index: 10, label: 'Structures' },
    instruments: { index: 11, label: 'Instruments' },
    electrical: { index: 12, label: 'Electrical' },
    charts: { index: 13, label: 'Charts' },
    background: { index: 14, label: 'Background' }
};

/** What a shape of the palette does on a click, on a drag: the second line of its tooltip */
const PALETTE_HINT = 'Click for details · drag to add';

/** The text as HTML (the tooltips render their content as such): the name of an image of the user safe */
const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, char => HTML_ENTITIES[char] ?? char);

/** The attributes of the tooltip of a shape of the palette: its name and the hint, outside the palette (see `besidePanel()`) */
function paletteTooltip(name: string): Record<string, string> {
    return {
        'data-tooltip': `<strong>${escapeHtml(name)}</strong><span class="scada-tooltip-hint">${PALETTE_HINT}</span>`,
        ...besidePanel('palette')
    };
}

/**
 * The name of the shape of the palette (see `descriptions.ts`), shown in its tooltip (with a hint); a link has it
 * as its label too, on the right of it (a line is hard to tell apart without it). Not on the dragged
 * and the dropped shape (see `dragStartClone`).
 */
function setTooltip(cell: dia.Cell): void {
    const { title } = descriptions[cell.get('type')] ?? { title: cell.get('type') };
    // An image of the user: its name
    const name = cell.get('type') === 'CustomImage' ? cell.prop(['label', 'text']) : title;
    cell.attr('root', paletteTooltip(name));
    if (cell.isLink()) {
        cell.labels([nameLabel(name)]);
    }
}

/**
 * The label of a link of the palette: its name after its end (in the size of the palette, see `STENCIL_SCALE`),
 * a part of the link - the link can be dragged by it too.
 */
function nameLabel(name: string): dia.Link.Label {
    return {
        markup: [{ tagName: 'text', selector: 'name' }],
        position: { distance: 1, offset: { x: 16, y: 0 }},
        attrs: {
            name: {
                text: name,
                fill: LABEL_COLOR,
                fontSize: 13 / STENCIL_SCALE,
                fontFamily: 'sans-serif',
                fontStyle: 'italic',
                textAnchor: 'start',
                textVerticalAnchor: 'middle'
            }
        }
    };
}

/**
 * Lay out the cells of a group by their footprints (the pipe stubs, the actuators, ... included, the labels not),
 * from the top left corner: the links first, each on a row of its own (thin, they would be lost among
 * the elements), then the elements packed into the width of the palette below them (see `packing.ts`).
 */
function layoutGroup(graph: dia.Graph): void {
    // The palette doesn't show the labels (see `palette.css`).
    const footprintOf = (cell: dia.Cell) => getFootprint(cell, { label: false });
    let top = GROUP_MARGIN;
    const links = graph.getLinks();
    links.forEach((link, index) => {
        const footprint = footprintOf(link);
        link.translate(GROUP_MARGIN - footprint.x, top - footprint.y);
        top += footprint.height + (index === links.length - 1 ? LINKS_GAP : GAP);
    });
    const items = graph.getElements().map(element => ({ data: element, footprint: footprintOf(element) }));
    const stripWidth = MAX_GROUP_WIDTH - 2 * GROUP_MARGIN;
    const { placements } = pack(
        items.map(({ data, footprint }) => ({ data: { element: data, footprint }, width: footprint.width, height: footprint.height })),
        stripWidth,
        { gap: GAP, align: 'left' }
    );
    placements.forEach(({ data: { element, footprint }, x, y }) => {
        element.translate(GROUP_MARGIN + x - footprint.x, top + y - footprint.y);
    });
}

/**
 * What the palette gets from the app: the images of the diagram (its shapes of the user); it tells when the user uploads
 * some, when a shape is dropped
 */
export interface StencilHooks {
    getImages: () => ImageLibrary;
    onUpload: (images: ImageEntry[]) => void;
    /** The shape dropped on the canvas, before it is added (its ID, see `tagNewCell()`) */
    onDrop: (cell: dia.Cell) => void;
}

/** The palette in its panel, the first of the container (left of the canvas). */
export function createStencil(
    container: HTMLElement,
    scroller: ui.PaperScroller,
    snaplines: ui.Snaplines,
    { getImages, onUpload, onDrop }: StencilHooks
): ui.Stencil {

    const el = document.createElement('aside');
    el.className = 'scada-stencil-panel';
    el.setAttribute('aria-label', 'Palette');
    container.prepend(el);

    // The labels with icons (elements of this palette)
    const labeledGroups: Record<string, ui.Stencil.Group> = {
        ...groups,
        [DerivedGroup.Favorites]: { ...groups[DerivedGroup.Favorites], label: groupLabel('Favorites', 'star') },
        [DerivedGroup.InUse]: { ...groups[DerivedGroup.InUse], label: groupLabel('In Use', 'layers') },
        custom: { ...groups.custom, label: groupLabel('Custom', 'image') }
    };

    const stencil = new ui.Stencil({
        el,
        paper: scroller,
        width: STENCIL_WIDTH,
        height: undefined,
        groups: labeledGroups,
        layout: layoutGroup,
        dropAnimation: true,
        // The dragged shape (and the dropped one, cloned from it) has no tooltip, a link no name (see `setTooltip()`).
        dragStartClone: (cell: dia.Cell) => {
            const clone = cell.clone();
            Object.keys(paletteTooltip('')).forEach(name => clone.removeAttr(['root', name]));
            if (clone.isLink()) {
                clone.labels([]);
            }
            return clone;
        },
        // The dropped shape (cloned from the dragged one): made ready before it is added - one step of the history
        dragEndClone: (cell: dia.Cell) => {
            const clone = cell.clone();
            onDrop(clone);
            return clone;
        },
        // A click shows the shape in the inspector panel (see `PaletteController`): the dragging starts
        // with a move, where a click ends (the same threshold as on the canvas).
        dragThreshold: CLICK_THRESHOLD,
        // Over the shapes and the names of the links (the links fixed in `theme/theme-minimal.css`)
        cellCursor: 'grab',
        scaleClones: true,
        // A shape dragged from the palette aligns with the others too.
        snaplines,
        paperPadding: STENCIL_PADDING,
        search: matchShape,
        // The shape dragged out of the palette shows its image too.
        paperDragOptions: () => ({ getImages }),
        paperOptions: () => ({
            // The palette has the layers too (a shape knows its layer).
            model: createGraph(),
            // The shapes of the user show the images of the diagram.
            getImages,
            clickThreshold: CLICK_THRESHOLD,
            // The hover frame of a shape at the edge of a group (the first link) drawn out of the paper, not cut
            overflow: true,
            cellViewNamespace: cellNamespace,
            // The links by their routing (see `routing.ts`)
            ...routingPaperOptions,
            // Rendered again when an attribute its special attributes read changes (see `ShapeView`)
            elementView: (_element, namespaceView) => namespaceView ?? ShapeView
        })
    });

    // Every load, reload and search of a group fits its paper (see `fitToFootprints()`).
    // TODO: `fitPaperToContent()` is an internal method of the stencil (not in its typings); `contentOptions` can't fit
    // a filtered group from the models (the hidden shapes are fitted too) - until it can (requested from JointJS+)
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
            new Turbine()
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
            new Scrubber(),
            new BagFilter()
        ],
        storage: [
            new LiquidTank(),
            new ConicTank(),
            new MixingTank(),
            new Silo(),
            new SphericalTank(),
            new Hopper(),
            new HorizontalTank(),
            new WaterTower(),
            new FuelTank()
        ],
        bulk: [
            new Conveyor({
                source: { x: 0, y: 0 },
                target: { x: LINK_LENGTH, y: 0 }
            }),
            new ConveyorBelt(),
            new BucketElevator(),
            new Crusher(),
            new Mill(),
            new RotaryKiln()
        ],
        structures: [
            new Stack(),
            new CoolingTower()
        ],
        instruments: [
            new Instrument(),
            new PressureGauge(),
            new Panel({ data: { level: 70 }}),
            new Thermometer(),
            new FlowMeter(),
            new Beacon({ data: { power: 1 }}),
            new Display(),
            new SignalLine({
                source: { x: 0, y: 0 },
                target: { x: LINK_LENGTH, y: 0 }
            }),
            new Label(),
            new Arrow({
                source: { x: 0, y: 0 },
                target: { x: LINK_LENGTH, y: 0 }
            })
        ],
        background: [
            new Rectangle(),
            new Ellipse()
        ],
        charts: [
            // With a title and the names of the columns, and a row of a state and a value (neither)
            new Table(),
            new Table({
                header: false,
                names: false,
                columns: [{ name: 'State', kind: 'state' }, { name: 'Value', kind: 'number' }, { name: 'Unit', kind: 'text' }],
                rows: 1,
                values: [['on', '12.4', 'm³/h']]
            }),
            new LineChart(),
            new BarChart(),
            new DonutChart(),
            new GaugeChart()
        ],
        electrical: [
            new DieselGenerator(),
            new WindTurbine(),
            new SolarArray(),
            new PowerTransformer(),
            new Switchgear(),
            new MotorControlCenter(),
            new BatteryBank(),
            new Generator(),
            new Transformer(),
            new Busbar(),
            new Battery(),
            new CircuitBreaker(),
            new Disconnector(),
            new Fuse(),
            new SurgeArrester(),
            new Ground(),
            new Lamp(),
            new Heater(),
            new ElectricMeter(),
            new Wire({
                source: { x: 0, y: 0 },
                target: { x: LINK_LENGTH, y: 0 }
            })
        ],
        piping: [
            new Pipe({
                source: { x: 0, y: 0 },
                target: { x: LINK_LENGTH, y: 0 }
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
    Object.values(shapes).flat().forEach(setTooltip);
    return shapes;
}

/**
 * What identifies a shape of the palette (computed from the shape, so that the shapes of any diagram
 * are found in the palette): the type, plus the image for an uploaded image.
 */
export function paletteKey(cell: dia.Cell): string {
    const type = cell.get('type');
    if (type === 'CustomImage') {
        return `${type}:${cell.get('imageId')}`;
    }
    // A table (its names of the columns shown), a readout (neither the title nor the names): two shapes of the palette
    if (type === 'Table') {
        return cell.get('names') ? 'Table' : 'Table:list';
    }
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
    // Shown before loading: the paper is fitted on load (a hidden group has nothing to measure). The element of the
    // group by the stencil's markup (internal): TODO - removed and added again once `ui.Stencil` can (add / remove groups)
    const groupEl = stencil.el.querySelector<HTMLElement>(`.group[data-name="${group}"]`);
    if (groupEl) {
        groupEl.hidden = shapes.length === 0;
    }
    stencil.loadGroup(shapes, group);
}

/** The keys of the palette shapes used in the diagram */
export function keysInUse(graph: dia.Graph): Set<string> {
    // A group is not a shape of the palette (see `Group`).
    return new Set(graph.getCells().filter(cell => cell.get('type') !== 'Group').map(paletteKey));
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
        // TODO: the class of a shape the search hides is internal to the stencil - until it tells (requested from JointJS+)
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

/** The label of a group of the palette (its `label`: an element, see `ui.Stencil.Group`) with an icon (see `palette.css`) */
function groupLabel(text: string, icon: string): HTMLElement {
    const label = document.createElement('span');
    label.className = 'scada-group-label';
    const iconEl = document.createElement('span');
    iconEl.className = `scada-group-icon scada-group-icon-${icon}`;
    label.append(iconEl, text);
    return label;
}

/** A button in the group of the custom shapes: it uploads images (into the diagram, see `onUpload`). */
function addUploadButton(stencil: ui.Stencil, onUpload: StencilHooks['onUpload']): void {
    const groupEl = stencil.el.querySelector('.group[data-name="custom"]');
    if (!groupEl) {
        return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.hidden = true;
    const button = document.createElement('label');
    button.className = 'scada-stencil-upload';
    button.dataset.tooltip = 'Upload images (PNG, JPEG, SVG, ...) as shapes of your own';
    setBesidePanel(button, 'palette');
    button.textContent = 'Upload images';
    button.append(input);
    // Under the header of the group: its element by the stencil's markup
    // TODO: internal - until a group can have content of an app's own (requested from JointJS+)
    groupEl.querySelector('.group-label')?.after(button);

    input.addEventListener('change', async() => {
        const files = Array.from(input.files || []);
        // The same files can be uploaded again.
        input.value = '';
        const images = (await Promise.all(files.map(readImageFile))).filter((image): image is ImageEntry => image !== null);
        if (images.length === 0) {
            return;
        }
        onUpload(images);
        stencil.openGroup('custom');
    });
}
