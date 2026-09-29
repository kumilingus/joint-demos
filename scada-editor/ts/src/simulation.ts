import type { dia } from '@joint/plus';
import { RUNTIME } from './controls';
import { findByTag, getTag } from './tags';
import { isEnergized } from './energized';
import { CHART_POINTS, getScale } from './shapes/charts';
import type { Slice } from './shapes/DonutChart';

/*
 * A mock of the plant: in random intervals it sends random updates of the plant data,
 * addressed by the tags of the elements - as a SCADA server would. Some of the data follows the plant:
 * the flow and the pressure of the feedwater follow the feed pumps running, the charts (updated
 * every second) follow the flow.
 */

/** An update of the plant data: the element (by its tag) and the new values of its attributes (by their paths). */
export interface TagUpdate {
    tag: string;
    changes: Record<string, unknown>;
}

// The time between two updates (ms)
const MIN_INTERVAL = 300;
const MAX_INTERVAL = 1500;

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

/** A number shown as a text (on a display, a flow meter), moved like `drift()`. */
function driftText(text: string, step: number, min: number, max: number): string {
    const value = Number.parseFloat(text);
    return drift(Number.isNaN(value) ? min : value, step, min, max).toFixed(1);
}

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

type Generator = (element: dia.Element, graph: dia.Graph) => Record<string, unknown> | null;

const togglePower = (probability: number): Generator => element => {
    return chance(probability) ? { power: element.get('power') ? 0 : 1 } : null;
};

const toggleOpen = (probability: number): Generator => element => {
    return chance(probability) ? { open: !element.get('open') } : null;
};

/** The highest pressure shown on the displays with the `bar` unit */
function highestPressure(graph: dia.Graph): number {
    const pressures = graph.getElements()
        .filter(element => element.get('type') === 'Display' && element.attr('unit/text') === 'bar')
        .map(element => Number.parseFloat(element.attr('value/text')))
        .filter(value => !Number.isNaN(value));
    return pressures.length > 0 ? Math.max(...pressures) : 0;
}

/** How the data of each type of element changes. */
const generators: Record<string, Generator> = {
    Panel: element => ({ level: Math.round(drift(element.get('level') ?? 50, 6, 0, 100)) }),
    Thermometer: element => ({ value: Math.round(drift(element.get('value') ?? 50, 4, 0, 100)) }),
    PressureGauge: element => ({ value: Math.round(drift(element.get('value') ?? 50, 8, 0, 100)) }),
    // The feed pumps push the water.
    FlowMeter: (element, graph) => {
        const flow = Number.parseFloat(element.attr('value/text')) || 0;
        return { 'attrs/value/text': Math.max(0, follow(flow, withPumps(graph, PUMP_FLOW), 0.5)).toFixed(1) };
    },
    Display: element => ({ 'attrs/value/text': driftText(element.attr('value/text'), 0.4, 0, 14) }),
    ControlValve: element => {
        const open = element.get('open') ?? 0;
        const step = chance(0.5) ? 0.25 : -0.25;
        return { open: Math.max(0, Math.min(1, open + step)) };
    },
    // The equipment is switched now and then only.
    Pump: togglePower(0.15),
    Compressor: togglePower(0.15),
    Fan: togglePower(0.15),
    Blower: togglePower(0.15),
    Motor: togglePower(0.15),
    Turbine: togglePower(0.15),
    ConveyorBelt: togglePower(0.15),
    AirCooler: togglePower(0.15),
    MixingTank: togglePower(0.15),
    Reactor: togglePower(0.15),
    HandValve: toggleOpen(0.1),
    ButterflyValve: toggleOpen(0.1),
    BallValve: toggleOpen(0.1),
    SolenoidValve: toggleOpen(0.1),
    GateValve: toggleOpen(0.1),
    // The newest value on the right, the oldest one drops out on the left.
    Trend: element => {
        const values: number[] = element.get('values') || [];
        const last = values.length > 0 ? values[values.length - 1] : 50;
        return { values: [...values.slice(1), Math.round(drift(last, 8, 5, 95))] };
    },
    // The electrical equipment: a breaker trips now and then, a generator stops; a meter shows the voltage.
    CircuitBreaker: toggleOpen(0.08),
    Generator: togglePower(0.05),
    DieselGenerator: togglePower(0.05),
    WindTurbine: togglePower(0.05),
    // The charge of a battery bank, the fuel of a day tank
    BatteryBank: element => ({ level: Math.round(drift(element.get('level') ?? 80, 3, 20, 100)) }),
    FuelTank: element => ({ level: Math.round(drift(element.get('level') ?? 70, 3, 10, 100)) }),
    ElectricMeter: (element, graph) => ({
        'attrs/value/text': isEnergized(graph, element) ? driftText(element.attr('value/text'), 1.5, 225, 235) : '0.0'
    }),
    // The alarm follows the pressure.
    Beacon: (_element, graph) => ({ power: highestPressure(graph) > HIGH_PRESSURE ? 1 : 0 })
};

/** How the data of each type of chart changes (every `CHART_INTERVAL`, see `Simulation`) */
type ChartGenerator = (element: dia.Element, graph: dia.Graph, tick: number) => Record<string, unknown> | null;

/** The sum of the steam flow of the current period of each bar chart (by its id): its next bar is their mean */
const periodFlows = new Map<string, number>();

const chartGenerators: Record<string, ChartGenerator> = {
    // The steam flow: the newest value on the right, the oldest one drops out on the left
    LineChart: (element, graph) => {
        const { max } = getScale(element);
        const values: number[] = element.get('values') || [];
        return { values: [...values, roundTo(steamFlow(graph), max)].slice(-CHART_POINTS) };
    },
    // The steam produced in the last period (the mean flow): a new bar on the right
    BarChart: (element, graph, tick) => {
        const sum = (periodFlows.get(element.id as string) ?? 0) + steamFlow(graph);
        if (tick % BAR_PERIOD !== 0) {
            periodFlows.set(element.id as string, sum);
            return null;
        }
        periodFlows.delete(element.id as string);
        const { max } = getScale(element);
        const values: number[] = element.get('values') || [];
        return { values: [...values.slice(1), roundTo(sum / BAR_PERIOD, max)] };
    },
    // The fuels burnt: the first one up to the base load, the second one above it, the others steadily
    DonutChart: (element, graph) => {
        const slices: Slice[] = element.get('slices') || [];
        const flow = steamFlow(graph);
        return {
            slices: slices.map((slice, index) => {
                const value = index === 0 ? Math.min(flow, BASE_LOAD) : index === 1 ? Math.max(0, flow - BASE_LOAD) : Number(slice.value) || 0;
                return { ...slice, value: Math.round(Math.max(0, follow(Number(slice.value) || 0, value, 0.3))) };
            })
        };
    },
    // The pressure of the feedwater: with the feed pumps running
    GaugeChart: (element, graph) => {
        const { min, max } = getScale(element);
        const value = follow(Number(element.get('value')) || 0, withPumps(graph, PUMP_PRESSURE), 0.1);
        return { value: roundTo(Math.max(min, Math.min(max, value)), max - min) };
    }
};

/** The updates of the charts (of those with a tag) */
export function createChartUpdates(graph: dia.Graph, tick: number): TagUpdate[] {
    return graph.getElements()
        .filter(element => getTag(element) && element.get('type') in chartGenerators)
        .map(element => ({ tag: getTag(element)!, changes: chartGenerators[element.get('type')](element, graph, tick) }))
        .filter((update): update is TagUpdate => update.changes !== null);
}

/** A random update of a random element (of those with data), or `null` if nothing changes this time. */
export function createRandomUpdate(graph: dia.Graph): TagUpdate | null {
    const elements = graph.getElements().filter(element => getTag(element) && element.get('type') in generators);
    if (elements.length === 0) return null;
    const element = elements[Math.floor(Math.random() * elements.length)];
    const changes = generators[element.get('type')](element, graph);
    if (!changes) return null;
    return { tag: getTag(element)!, changes };
}

/** Apply an update to the element with its tag (a runtime change: not recorded in the history). */
export function applyUpdate(graph: dia.Graph, { tag, changes }: TagUpdate): void {
    const element = findByTag(graph, tag);
    if (!element) return;
    Object.entries(changes).forEach(([path, value]) => element.prop(path, value, RUNTIME));
}

export class Simulation {

    graph: dia.Graph;
    timer: number | null = null;
    chartTimer: number | null = null;
    tick = 0;

    constructor(graph: dia.Graph) {
        this.graph = graph;
    }

    get running(): boolean {
        return this.timer !== null;
    }

    start(): void {
        if (this.running) return;
        this.schedule();
        // The charts on a timer of their own: they move steadily
        this.chartTimer = window.setInterval(() => {
            this.tick++;
            createChartUpdates(this.graph, this.tick).forEach(update => applyUpdate(this.graph, update));
        }, CHART_INTERVAL);
    }

    stop(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
        if (this.chartTimer !== null) window.clearInterval(this.chartTimer);
        this.timer = null;
        this.chartTimer = null;
        this.tick = 0;
        periodFlows.clear();
    }

    protected schedule(): void {
        this.timer = window.setTimeout(() => {
            const update = createRandomUpdate(this.graph);
            if (update) applyUpdate(this.graph, update);
            this.schedule();
        }, random(MIN_INTERVAL, MAX_INTERVAL));
    }
}
