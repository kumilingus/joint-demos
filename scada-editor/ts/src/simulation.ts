import type { dia } from '@joint/plus';
import { RUNTIME } from './controls';
import { findByTag, getTag } from './tags';
import { isEnergized } from './energized';

/*
 * A mock of the plant: in random intervals it sends random updates of the plant data,
 * addressed by the tags of the elements - as a SCADA server would.
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
    FlowMeter: element => ({ 'attrs/value/text': driftText(element.attr('value/text'), 0.8, 0, 40) }),
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

    constructor(graph: dia.Graph) {
        this.graph = graph;
    }

    get running(): boolean {
        return this.timer !== null;
    }

    start(): void {
        if (this.running) return;
        this.schedule();
    }

    stop(): void {
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = null;
    }

    protected schedule(): void {
        this.timer = window.setTimeout(() => {
            const update = createRandomUpdate(this.graph);
            if (update) applyUpdate(this.graph, update);
            this.schedule();
        }, random(MIN_INTERVAL, MAX_INTERVAL));
    }
}
