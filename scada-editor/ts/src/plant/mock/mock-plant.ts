import type { dia } from '@joint/plus';
import { RUNTIME } from '../../runtime/controls';
import { findByTag, getTag } from '../tags';
import type { Plant, PlantMessage } from '../plant';
import { propertiesOf, readProperty, type TagValue } from '../properties';
import { getEnergized } from './energized';
import { CHART_POINTS, getScale } from '../../shapes/common/charts';
import type { Slice } from '../../shapes/models/charts/DonutChart';

/*
 * A mock of the plant: in random intervals it sends random updates of the plant data - the new value of a property
 * of an element by its tag, through the interface of the diagram (`plant.update()`, see `plant.ts`) as any system
 * would; the energized circuits (see `energized.ts`).
 * Some of the data follows the plant:
 * the flow and the pressure of the feedwater follow the feed pumps running, the charts (updated
 * every second) follow the flow.
 */

/**
 * An update of an element of the diagram itself (a chart, a table - they show the values of the plant, not values of
 * tags): the element (by its tag) and the new values of its attributes (by their paths).
 */
interface TagUpdate {
    tag: string;
    changes: Record<string, unknown>;
}

// The time between two updates (ms)
const MIN_INTERVAL = 300;
const MAX_INTERVAL = 1500;

// How long the equipment takes to do what the operator asked (ms): a valve travelling, a pump starting
const MIN_RESPONSE = 300;
const MAX_RESPONSE = 800;

// The alarm (a beacon) goes on above this pressure (on a display)
const HIGH_PRESSURE = 11;

// The charts are updated this often (ms); a bar of a bar chart is the mean of this many updates.
const CHART_INTERVAL = 1000;
const BAR_PERIOD = 10;

// The flow (m³/h) and the pressure (bar) of the feedwater with no, one or both feed pumps running
const PUMP_FLOW = [0, 18, 30];
const PUMP_PRESSURE = [0.3, 10.5, 12.5];

// The steam flow (t/h) the first fuel of a fuel mix covers; the second one covers the load above it.
const BASE_LOAD = 20;

const random = (min: number, max: number) => min + Math.random() * (max - min);

const chance = (probability: number) => Math.random() < probability;

/** The value moved by up to `step` either way, within `min` and `max`. */
function drift(value: number, step: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value + random(-step, step)));
}

/** How a display of the unit drifts (a pressure without a unit) */
const DISPLAY_RANGES: Record<string, { step: number; min: number; max: number }> = {
    bar: { step: 0.4, min: 0, max: 14 },
    Hz: { step: 0.05, min: 49.8, max: 50.2 },
    '%': { step: 0.5, min: 20, max: 100 },
    't/h': { step: 1.5, min: 150, max: 175 },
    '°C': { step: 2, min: 320, max: 360 }
};

/** The value rounded to two digits of the span (a whole number on a scale of 100, one decimal on a scale of 10) */
function roundTo(value: number, span: number): number {
    const digits = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(span) || 1)));
    return Number(value.toFixed(digits));
}

/** The value moved a part of the way to the target (a lag of the plant), with some noise */
function follow(value: number, target: number, noise: number): number {
    return value + (target - value) * 0.3 + random(-noise, noise);
}

/** How many feed pumps are running */
function pumpsRunning(graph: dia.Graph): number {
    return graph.getElements().filter(element => element.get('type') === 'Pump' && element.get('power')).length;
}

/** The target of a value of the plant with the pumps running (of the values with no, one or both pumps) */
function withPumps(graph: dia.Graph, values: number[]): number {
    return values[Math.min(pumpsRunning(graph), values.length - 1)];
}

/** The flow of the feedwater (the mean of the flow meters): as much steam comes out of the boilers */
function steamFlow(graph: dia.Graph): number {
    const flows = graph.getElements()
        .filter(element => element.get('type') === 'FlowMeter')
        .map(element => Number.parseFloat(element.attr('value/text')))
        .filter(value => !Number.isNaN(value));
    return flows.length > 0 ? flows.reduce((sum, value) => sum + value, 0) / flows.length : 0;
}

/** The next value of the tag of the element (see `properties.ts`), or `null` if it doesn't change this time */
type Generator = (element: dia.Element, graph: dia.Graph) => TagValue | null;

/** The property of the element the mock changes: its only one (see `properties.ts`) */
const propertyOf = (element: dia.Element) => propertiesOf(element)[0];

/** The value of the property of the element now (as the diagram shows it: a real plant knows it itself) */
const valueOf = (element: dia.Element) => readProperty(element, propertyOf(element));

/** On / off, open / closed: switched now and then */
const toggle = (probability: number): Generator => element => (chance(probability) ? !valueOf(element) : null);

/** The highest pressure shown on the displays with the `bar` unit */
function highestPressure(graph: dia.Graph): number {
    const pressures = graph.getElements()
        .filter(element => element.get('type') === 'Display' && element.attr('unit/text') === 'bar')
        .map(element => Number.parseFloat(element.attr('value/text')))
        .filter(value => !Number.isNaN(value));
    return pressures.length > 0 ? Math.max(...pressures) : 0;
}

/** How the value of the tag of each type of element changes. */
const generators: Record<string, Generator> = {
    Panel: element => Math.round(drift(Number(valueOf(element) ?? 50), 6, 0, 100)),
    Thermometer: element => Math.round(drift(Number(valueOf(element) ?? 50), 4, 0, 100)),
    PressureGauge: element => Math.round(drift(Number(valueOf(element) ?? 50), 8, 0, 100)),
    // The feed pumps push the water.
    FlowMeter: (element, graph) => roundTo(Math.max(0, follow(Number(valueOf(element)), withPumps(graph, PUMP_FLOW), 0.5)), 10),
    Display: (element) => {
        const { step, min, max } = DISPLAY_RANGES[element.attr('unit/text')] ?? DISPLAY_RANGES.bar;
        return roundTo(drift(Number(valueOf(element)) || min, step, min, max), 10);
    },
    // How much it is open (%), in steps of a quarter
    ControlValve: (element) => {
        const step = chance(0.5) ? 25 : -25;
        return Math.max(0, Math.min(100, Number(valueOf(element)) + step));
    },
    // The equipment is switched now and then only.
    Pump: toggle(0.15),
    Compressor: toggle(0.15),
    Fan: toggle(0.15),
    Blower: toggle(0.15),
    Motor: toggle(0.15),
    Turbine: toggle(0.15),
    ConveyorBelt: toggle(0.15),
    AirCooler: toggle(0.15),
    MixingTank: toggle(0.15),
    BucketElevator: toggle(0.1),
    Crusher: toggle(0.1),
    Mill: toggle(0.1),
    RotaryKiln: toggle(0.03),
    Reactor: toggle(0.15),
    HandValve: toggle(0.1),
    ButterflyValve: toggle(0.1),
    BallValve: toggle(0.1),
    SolenoidValve: toggle(0.1),
    GateValve: toggle(0.1),
    // The newest value of a trend
    Trend: element => Math.round(drift(Number(valueOf(element) ?? 50), 8, 5, 95)),
    // The electrical equipment: a breaker trips now and then, a generator stops; a meter shows the voltage.
    CircuitBreaker: toggle(0.08),
    Generator: toggle(0.05),
    DieselGenerator: toggle(0.05),
    WindTurbine: toggle(0.05),
    // The charge of a battery bank, the fuel of a day tank
    BatteryBank: element => Math.round(drift(Number(valueOf(element) ?? 80), 3, 20, 100)),
    FuelTank: element => Math.round(drift(Number(valueOf(element) ?? 70), 3, 10, 100)),
    ElectricMeter: element => (element.get('energized') ? roundTo(drift(Number(valueOf(element) ?? 230), 1.5, 225, 235), 10) : 0),
    // The alarm follows the pressure.
    Beacon: (_element, graph) => highestPressure(graph) > HIGH_PRESSURE
};

/**
 * How the values of a table change (not the values of tags: a table shows those of the diagram, see `readoutStates()`) -
 * the changes of the table, or `null` if nothing changes this time.
 */
const readoutGenerators: Record<string, (element: dia.Element, graph: dia.Graph) => Record<string, unknown> | null> = {
    // A value of a table changes: a state switches now and then, a number (as many decimals as it has) drifts.
    // A table of a source (an element): its states follow it (see `readoutStates()`), its numbers drift while it runs.
    Table: (element, graph) => {
        const values: string[][] = element.get('values') ?? [];
        const kinds: Array<string | undefined> = (element.get('columns') ?? []).map((column: { kind?: string }) => column.kind);
        const source = sourceOf(element, graph);
        if (source && !isRunning(source)) return null;
        const cells = values.flatMap((row, rowIndex) => row
            .map((value, column) => ({ value, rowIndex, column, kind: kinds[column] }))
            .filter(({ value, kind }) => (kind === 'state'
                ? !source && (value === 'on' || value === 'off')
                : /^-?\d+(\.\d+)?$/.test(value))));
        if (cells.length === 0) return null;
        const { value, rowIndex, column, kind } = cells[Math.floor(Math.random() * cells.length)];
        let next: string;
        if (kind === 'state') {
            if (!chance(0.4)) return null;
            next = value === 'on' ? 'off' : 'on';
        } else {
            const number = Number(value);
            const decimals = value.split('.')[1]?.length ?? 0;
            // By its share, at least five of its last digit (a whole number from 0 gets going)
            next = drift(number, Math.max(5 * 10 ** -decimals, Math.abs(number) * 0.05), 0, Number.MAX_VALUE).toFixed(decimals);
        }
        return { values: values.map((row, index) => (index === rowIndex ? row.map((cell, c) => (c === column ? next : cell)) : row)) };
    }
};

/** How the data of each type of chart changes (every `CHART_INTERVAL`, see `MockPlant`) */
type ChartGenerator = (element: dia.Element, graph: dia.Graph, tick: number) => Record<string, unknown> | null;

/** The sum of the steam flow of the current period of each bar chart (by its id): its next bar is their mean */
const periodFlows = new Map<string, number>();

/** Whether the charts follow the steam of a plant (its flow meters: a boiler house); otherwise they drift on their own */
const hasSteam = (graph: dia.Graph) => graph.getElements().some(element => element.get('type') === 'FlowMeter');

/** A value of a chart moved a little (by a share of its scale), within the scale */
function driftOnScale(value: number, min: number, max: number, share = 0.04): number {
    return roundTo(drift(value, (max - min) * share, min, max), max - min);
}

const chartGenerators: Record<string, ChartGenerator> = {
    // The steam flow (or its own value drifting): the newest value on the right, the oldest one drops out on the left
    LineChart: (element, graph) => {
        const { min, max } = getScale(element);
        const values: number[] = element.get('values') || [];
        const next = hasSteam(graph) ? roundTo(steamFlow(graph), max - min) : driftOnScale(values[values.length - 1] ?? (min + max) / 2, min, max);
        return { values: [...values, next].slice(-CHART_POINTS) };
    },
    // The steam produced in the last period (the mean flow; or near the last bar): a new bar on the right
    BarChart: (element, graph, tick) => {
        if (!hasSteam(graph)) {
            // A new bar now and then, near the last one
            if (tick % BAR_PERIOD !== 0) return null;
            const { min, max } = getScale(element);
            const values: number[] = element.get('values') || [];
            return { values: [...values.slice(1), driftOnScale(values[values.length - 1] ?? (min + max) / 2, min, max, 0.08)] };
        }
        const sum = (periodFlows.get(element.id as string) ?? 0) + steamFlow(graph);
        if (tick % BAR_PERIOD !== 0) {
            periodFlows.set(element.id as string, sum);
            return null;
        }
        periodFlows.delete(element.id as string);
        const { min, max } = getScale(element);
        const values: number[] = element.get('values') || [];
        return { values: [...values.slice(1), roundTo(sum / BAR_PERIOD, max - min)] };
    },
    // The fuels burnt: the first one up to the base load, the second one above it, the others steadily (or each drifting)
    DonutChart: (element, graph) => {
        const slices: Slice[] = element.get('slices') || [];
        // Without steam: each part a little more or less (the shares stay close)
        if (!hasSteam(graph)) {
            return { slices: slices.map(slice => ({ ...slice, value: Number(drift(Number(slice.value) || 0, (Number(slice.value) || 0) * 0.03, 0, Number.MAX_VALUE).toFixed(1)) })) };
        }
        const flow = steamFlow(graph);
        return {
            slices: slices.map((slice, index) => {
                // The others as they are
                if (index > 1) return slice;
                const value = index === 0 ? Math.min(flow, BASE_LOAD) : Math.max(0, flow - BASE_LOAD);
                return { ...slice, value: Number(Math.max(0, follow(Number(slice.value) || 0, value, 0.3)).toFixed(1)) };
            })
        };
    },
    // The pressure of the feedwater: with the feed pumps running (or its own value drifting)
    GaugeChart: (element, graph) => {
        const { min, max } = getScale(element);
        // Without the feed pumps: its own value drifting
        if (!graph.getElements().some(other => other.get('type') === 'Pump')) {
            return { value: driftOnScale(Number(element.get('value')) || 0, min, max, 0.02) };
        }
        const value = follow(Number(element.get('value')) || 0, withPumps(graph, PUMP_PRESSURE), 0.1);
        return { value: roundTo(Math.max(min, Math.min(max, value)), max - min) };
    }
};

/** The element a table shows the values of (its `sourceTag`, an ID), if any */
function sourceOf(table: dia.Element, graph: dia.Graph): dia.Element | undefined {
    const source = table.get('sourceTag');
    return source ? findByTag(graph, source) : undefined;
}

// The switches of the circuits: open, they cut it (a valve open lets the liquid through)
const SWITCHES = ['CircuitBreaker', 'Disconnector'];

/** Whether the element runs: switched on (a pump, a generator), open (a valve) or closed (a breaker), or neither */
function isRunning(element: dia.Element): boolean {
    if (element.has('power')) return Boolean(element.get('power'));
    if (element.has('open')) return SWITCHES.includes(element.get('type')) ? !element.get('open') : Boolean(element.get('open'));
    return true;
}

/** The numbers of the tables of a stopped source, as they were while it ran (or as saved): back when it runs again */
const runningValues = new WeakMap<dia.Element, string[][]>();

/** Whether the value is a number (shown as it is, with its decimals) */
const isNumber = (value: string) => /^-?\d+(\.\d+)?$/.test(value);

/**
 * The tables of a source as it is: their states `on` while it runs, `off` while not (an alarm stays); their numbers
 * zero while it is stopped (the ones before kept, see `runningValues`), back when it runs again
 */
function readoutStates(graph: dia.Graph): void {
    graph.getElements().filter(element => element.get('type') === 'Table').forEach((table) => {
        const source = sourceOf(table, graph);
        if (!source) return;
        const running = isRunning(source);
        const kinds: Array<string | undefined> = (table.get('columns') ?? []).map((column: { kind?: string }) => column.kind);
        const values: string[][] = table.get('values') ?? [];
        let numbers = values;
        if (running) {
            numbers = runningValues.get(table) ?? values;
            runningValues.delete(table);
        } else if (!runningValues.has(table)) {
            runningValues.set(table, values);
            numbers = values.map(row => row.map((value, column) => (kinds[column] === 'number' && isNumber(value)
                ? (0).toFixed(value.split('.')[1]?.length ?? 0)
                : value)));
        }
        const state = running ? 'on' : 'off';
        const next = numbers.map(row => row.map((value, column) => (kinds[column] === 'state' && value !== 'alarm' ? state : value)));
        if (JSON.stringify(next) !== JSON.stringify(values)) table.set('values', next, RUNTIME);
    });
}

/**
 * The empty cells of the tables filled (the plant sends every value): a number like the others of its column
 * (or a percentage), a text the name of its row, a state running
 */
function fillTables(graph: dia.Graph): void {
    graph.getElements().filter(element => element.get('type') === 'Table').forEach((table) => {
        const kinds: Array<string | undefined> = (table.get('columns') ?? []).map((column: { kind?: string }) => column.kind);
        const values: string[][] = table.get('values') ?? [];
        if (values.every(row => row.every(value => value !== ''))) return;
        const filled = values.map((row, r) => row.map((value, c) => {
            if (value !== '') return value;
            if (kinds[c] === 'state') return 'on';
            if (kinds[c] === 'number') {
                const numbers = values.map(other => other[c]).filter(isNumber);
                if (numbers.length === 0) return random(0, 100).toFixed(1);
                const sample = numbers[Math.floor(Math.random() * numbers.length)];
                return drift(Number(sample), Math.abs(Number(sample)) * 0.2, 0, Number.MAX_VALUE).toFixed(sample.split('.')[1]?.length ?? 0);
            }
            return `Row ${r + 1}`;
        }));
        table.set('values', filled, RUNTIME);
    });
}

/** The numbers of the tables of the stopped sources as they were (the runtime mode left: they are not saved as zeros) */
function restoreReadouts(graph: dia.Graph): void {
    graph.getElements().forEach((element) => {
        const numbers = runningValues.get(element);
        if (!numbers) return;
        runningValues.delete(element);
        // The numbers only: the states as they are (of the source now)
        const kinds: Array<string | undefined> = (element.get('columns') ?? []).map((column: { kind?: string }) => column.kind);
        const values: string[][] = element.get('values') ?? [];
        element.set('values', values.map((row, r) => row.map((value, c) => (kinds[c] === 'number' ? numbers[r]?.[c] ?? value : value))), RUNTIME);
    });
}

/** The updates of the charts (of those with a tag) */
function createChartUpdates(graph: dia.Graph, tick: number): TagUpdate[] {
    return graph.getElements()
        .filter(element => getTag(element) && element.get('type') in chartGenerators)
        .map(element => ({ tag: getTag(element)!, changes: chartGenerators[element.get('type')](element, graph, tick) }))
        .filter((update): update is TagUpdate => update.changes !== null);
}

/** An update of the plant: the new value of a property of an element (by its tag) */
interface PlantUpdate {
    tag: string;
    property: string;
    value: TagValue;
}

/**
 * An update of the plant (the new value of the property of a random element of those with data), or an update of
 * a table; `null` if nothing changes this time.
 */
function createRandomUpdate(graph: dia.Graph): PlantUpdate | TagUpdate | null {
    const elements = graph.getElements().filter(element => getTag(element) && (element.get('type') in generators || element.get('type') in readoutGenerators));
    if (elements.length === 0) return null;
    const element = elements[Math.floor(Math.random() * elements.length)];
    const tag = getTag(element)!;
    const type = element.get('type');
    if (type in readoutGenerators) {
        const changes = readoutGenerators[type](element, graph);
        return changes ? { tag, changes } : null;
    }
    const value = generators[type](element, graph);
    return value === null ? null : { tag, property: propertyOf(element), value };
}

/** Apply an update to the element with its tag (a runtime change: not recorded in the history). */
function applyUpdate(graph: dia.Graph, { tag, changes }: TagUpdate): void {
    const element = findByTag(graph, tag);
    if (!element) return;
    Object.entries(changes).forEach(([path, value]) => element.prop(path, value, RUNTIME));
}

export class MockPlant {

    graph: dia.Graph;
    timer: number | null = null;
    chartTimer: number | null = null;
    tick = 0;

    /** The interface of the diagram the updates are sent to (as any system would): of the run */
    plant: Plant | null = null;

    constructor(graph: dia.Graph) {
        this.graph = graph;
    }

    get running(): boolean {
        return this.timer !== null;
    }

    start(plant: Plant): void {
        if (this.running) return;
        this.plant = plant;
        // The commands of the operator done (as a SCADA server answers them: with the new state)
        plant.on('command', this.respond, this);
        // The energized circuits and the states of the readouts of the equipment: now, and again when a generator,
        // a pump or a switch changes
        this.updateEnergized();
        this.graph.on('change:power change:open', this.updateEnergized, this);
        fillTables(this.graph);
        readoutStates(this.graph);
        this.graph.on('change:power change:open', this.updateReadouts, this);
        this.schedule();
        // The charts on a timer of their own: they move steadily
        this.chartTimer = window.setInterval(() => {
            this.tick++;
            createChartUpdates(this.graph, this.tick).forEach(update => applyUpdate(this.graph, update));
        }, CHART_INTERVAL);
    }

    stop(): void {
        this.plant?.off('command', this.respond, this);
        this.responses.forEach(timer => window.clearTimeout(timer));
        this.responses.clear();
        this.graph.off('change:power change:open', this.updateEnergized, this);
        this.graph.off('change:power change:open', this.updateReadouts, this);
        restoreReadouts(this.graph);
        // Not a part of the diagram: not saved with it
        this.graph.getCells().forEach(cell => cell.removeProp('energized', RUNTIME));
        if (this.timer !== null) window.clearTimeout(this.timer);
        if (this.chartTimer !== null) window.clearInterval(this.chartTimer);
        this.timer = null;
        this.chartTimer = null;
        this.tick = 0;
        this.plant = null;
        periodFlows.clear();
    }

    /** The timers of the answers to the commands (see `respond()`) */
    protected responses = new Set<number>();

    /** A command of the operator done after a while: the plant updates the property to the value asked for */
    protected respond({ tag, property, value }: PlantMessage): void {
        const timer = window.setTimeout(() => {
            this.responses.delete(timer);
            this.plant?.update(tag, property, value);
        }, random(MIN_RESPONSE, MAX_RESPONSE));
        this.responses.add(timer);
    }

    /** The states of the readouts follow their sources (see `readoutStates()`) */
    protected updateReadouts(): void {
        readoutStates(this.graph);
    }

    /** The `energized` of the cells (as a SCADA server would send it): the circuits traced from the sources */
    protected updateEnergized(): void {
        const energized = getEnergized(this.graph);
        this.graph.getCells().forEach((cell) => {
            const value = energized.has(cell);
            if (Boolean(cell.get('energized')) === value) return;
            if (value) {
                cell.set('energized', true, RUNTIME);
            } else {
                cell.removeProp('energized', RUNTIME);
            }
        });
    }

    protected schedule(): void {
        this.timer = window.setTimeout(() => {
            const update = createRandomUpdate(this.graph);
            if (update && 'property' in update) {
                // As any system would: through the interface of the diagram
                this.plant?.update(update.tag, update.property, update.value);
            } else if (update) {
                applyUpdate(this.graph, update);
            }
            this.schedule();
        }, random(MIN_INTERVAL, MAX_INTERVAL));
    }
}
