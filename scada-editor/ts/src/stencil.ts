import { dia, type g, layout, ui } from '@joint/plus';
import {
    cellNamespace,
    Pump, Compressor, Fan, Motor, Blower, Turbine, ConveyorBelt,
    ControlValve, HandValve, CheckValve, ButterflyValve, BallValve, SolenoidValve, ReliefValve,
    HeatExchanger, Filter, Boiler, Reactor, DistillationColumn, Separator, Cyclone,
    LiquidTank, ConicTank, MixingTank, Silo, SphericalTank, Hopper, HorizontalTank,
    Chimney, CoolingTower,
    Instrument, PressureGauge, Panel, Thermometer, FlowMeter, Beacon, Display,
    Zone, Join, Pipe, SignalLine, Label,
    GateValve, YStrainer, OrificePlate, AirCooler, Scrubber, WaterTower,
    Trend
} from './shapes';
import { getFootprint } from './shapes/footprint';
import { createGraph } from './layers';

// The shapes are shown in the palette smaller than on the canvas.
const STENCIL_SCALE = 0.5;

const STENCIL_WIDTH = 240;
const STENCIL_PADDING = 10;

// The width a group can take, in the (unscaled) coordinates of the shapes
const MAX_GROUP_WIDTH = (STENCIL_WIDTH - 2 * STENCIL_PADDING) / STENCIL_SCALE;

const GRID_MARGIN = 10;

// The number of the columns of each group is the maximum: fewer are used if they don't fit.
const groups: Record<string, ui.Stencil.Group> = {
    piping: { index: 1, label: 'Piping', layout: { columns: 4 }},
    rotating: { index: 2, label: 'Rotating Equipment', layout: { columns: 3 }},
    valves: { index: 3, label: 'Valves', layout: { columns: 3 }},
    process: { index: 4, label: 'Process', layout: { columns: 3 }},
    storage: { index: 5, label: 'Storage', layout: { columns: 3 }},
    structures: { index: 6, label: 'Structures', layout: { columns: 2 }},
    instruments: { index: 7, label: 'Instruments', layout: { columns: 4 }}
};

interface Item {
    cell: dia.Cell;
    footprint: g.Rect;
}

/** The cells of a similar size next to each other: by height, then by width. */
function bySize(items: Item[]): Item[] {
    return [...items].sort((a, b) => (a.footprint.height - b.footprint.height) || (a.footprint.width - b.footprint.width));
}

/**
 * The widest cell in the first column with the narrowest ones next to it, row by row:
 * two wide cells side by side might not fit the palette.
 */
function byWidthBalanced(items: Item[], columns: number): Item[] {
    const remaining = [...items].sort((a, b) => b.footprint.width - a.footprint.width);
    const ordered: Item[] = [];
    while (remaining.length > 0) {
        ordered.push(remaining.shift()!);
        for (let column = 1; column < columns && remaining.length > 0; column++) {
            ordered.push(remaining.pop()!);
        }
    }
    return ordered;
}

/** Lay the placeholders (the footprints) out in a compact grid, and return its width. */
function layoutPlaceholders(placeholders: dia.Element[], columns: number): number {
    const { bbox } = layout.GridLayout.layout(placeholders, {
        columns,
        columnWidth: 'compact',
        rowHeight: 'compact',
        columnGap: 20,
        rowGap: 20,
        marginX: GRID_MARGIN,
        marginY: GRID_MARGIN,
        horizontalAlign: 'middle',
        // The labels of a row are on one line.
        verticalAlign: 'bottom'
    });
    return bbox.width + 2 * GRID_MARGIN;
}

/**
 * Lay the cells of a group out in a compact grid: each column is as wide
 * and each row as tall as its largest cell.
 * The grid is computed for the footprints of the cells (the pipe stubs, the labels,
 * the actuators, ... included), not for their bounding boxes, so that nothing overlaps.
 * The cells are sorted by size (the cells of a row are of a similar size) unless
 * the grid wouldn't fit the palette then: the wide cells are put next to the narrow ones
 * before there are fewer columns.
 */
function layoutGroup(graph: dia.Graph, group: ui.Stencil.Group): void {
    const { columns: maxColumns = 2 } = (group.layout || {}) as layout.GridLayout.Options;
    const items: Item[] = graph.getCells().map(cell => ({ cell, footprint: getFootprint(cell) }));
    // An element of the size of each footprint to lay out instead of the cell
    const toPlaceholders = (ordered: Item[]) => ordered.map(({ footprint: { width, height }}) => {
        return new dia.Element({ type: 'Placeholder', size: { width, height }});
    });
    let ordered = bySize(items);
    let placeholders = toPlaceholders(ordered);
    search: for (let columns = maxColumns; columns >= 1; columns--) {
        for (const order of [bySize(items), byWidthBalanced(items, columns)]) {
            const candidates = toPlaceholders(order);
            if (layoutPlaceholders(candidates, columns) <= MAX_GROUP_WIDTH || columns === 1) {
                [ordered, placeholders] = [order, candidates];
                break search;
            }
        }
    }
    ordered.forEach(({ cell, footprint }, index) => {
        const { x, y } = placeholders[index].position();
        (cell as dia.Element | dia.Link).translate(x - footprint.x, y - footprint.y);
    });
}

export function createStencil(el: HTMLElement, scroller: ui.PaperScroller, snaplines: ui.Snaplines): ui.Stencil {

    const stencil = new ui.Stencil({
        el,
        paper: scroller,
        width: STENCIL_WIDTH,
        height: undefined,
        groups,
        layout: layoutGroup,
        dropAnimation: true,
        scaleClones: true,
        // A shape dragged from the palette aligns with the others too.
        snaplines,
        paperPadding: STENCIL_PADDING,
        // Search by the type (e.g. "tank", "valve") and by the texts of the shapes.
        search: {
            '*': ['type', 'attrs/label/text'],
            'Instrument': ['attrs/tag/text', 'attrs/loop/text']
        },
        paperOptions: () => ({
            // The palette has the layers too (a shape knows its layer).
            model: createGraph(),
            cellViewNamespace: cellNamespace
        })
    });

    stencil.render();

    Object.keys(groups).forEach((group) => {
        stencil.getPaper(group).scale(STENCIL_SCALE);
    });

    stencil.load({
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
            new Instrument({
                attrs: { tag: { text: 'FT' }, loop: { text: '102' }}
            }),
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
            new YStrainer(),
            new OrificePlate(),
            new Zone(),
            new Zone({ facing: 'right' })
        ]
    });

    return stencil;
}
