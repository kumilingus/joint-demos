import type { dia } from '@joint/plus';

/*
 * The properties of the equipment as the plant knows them: by the tag of an element and the name of a property
 * (`power`, `open`, `level`, `value`), a plain value - a number or a boolean, nothing of the shapes. Here the diagram
 * binds them to its elements: what a property of an element of a type is (what it shows now, read as such a value) and
 * what a new value of it sets on the element. An element can have several properties (each set on its own).
 */

/** The value of a property: a reading (a number), a state (on / off, open / closed) */
export type TagValue = number | boolean;

interface Property {
    /** The value the element shows now */
    read: (element: dia.Element) => TagValue;
    /** The changes of the element showing the value (its attributes by their paths) */
    write: (element: dia.Element, value: TagValue) => Record<string, unknown>;
}

/** Running or not (a pump, a motor, an alarm) */
const power: Property = {
    read: element => Boolean(element.get('power')),
    write: (_element, value) => ({ power: value ? 1 : 0 })
};

/** Open or closed (a valve, a breaker) */
const open: Property = {
    read: element => Boolean(element.get('open')),
    write: (_element, value) => ({ open: Boolean(value) })
};

/** How much open, in % (a control valve) */
const opening: Property = {
    read: element => Math.round((element.get('open') ?? 0) * 100),
    write: (_element, value) => ({ open: Number(value) / 100 })
};

/** A level, in % (a tank, a battery) */
const level: Property = {
    read: element => element.get('level') ?? 0,
    write: (_element, value) => ({ level: Number(value) })
};

/** A value on a scale (a gauge, a thermometer) */
const scaled: Property = {
    read: element => element.get('value') ?? 0,
    write: (_element, value) => ({ value: Number(value) })
};

/** A reading shown as a number (a display, a meter): with one decimal */
const reading: Property = {
    read: element => Number.parseFloat(element.attr('value/text')) || 0,
    write: (_element, value) => ({ 'attrs/value/text': Number(value).toFixed(1) })
};

/** The newest value of a history (a trend): on the right, the oldest one drops out on the left */
const newest: Property = {
    read: (element) => {
        const values: number[] = element.get('values') ?? [];
        return values[values.length - 1] ?? 0;
    },
    write: (element, value) => ({ values: [...(element.get('values') ?? []).slice(1), Number(value)] })
};

const RUNNING = [
    'Pump', 'Compressor', 'Fan', 'Blower', 'Motor', 'Turbine', 'ConveyorBelt', 'AirCooler', 'MixingTank',
    'BucketElevator', 'Crusher', 'Mill', 'RotaryKiln', 'Reactor', 'Boiler', 'Generator', 'DieselGenerator', 'WindTurbine', 'Beacon'
];

const SWITCHED = ['HandValve', 'ButterflyValve', 'BallValve', 'SolenoidValve', 'GateValve', 'CircuitBreaker', 'Disconnector'];

/** The properties of each type of element, by their names */
const properties: Record<string, Record<string, Property>> = {
    Panel: { level },
    BatteryBank: { level },
    FuelTank: { level },
    Thermometer: { value: scaled },
    PressureGauge: { value: scaled },
    FlowMeter: { value: reading },
    Display: { value: reading },
    ElectricMeter: { value: reading },
    Trend: { value: newest },
    ControlValve: { open: opening },
    ...Object.fromEntries(SWITCHED.map(type => [type, { open }])),
    ...Object.fromEntries(RUNNING.map(type => [type, { power }]))
};

/** The names of the properties of the element (none if the plant knows nothing of it) */
export function propertiesOf(element: dia.Element): string[] {
    return Object.keys(properties[element.get('type')] ?? {});
}

/** The value of the property of the element: what it shows now (`undefined` if it has no such property) */
export function readProperty(element: dia.Element, name: string): TagValue | undefined {
    return properties[element.get('type')]?.[name]?.read(element);
}

/** Show the value of the property on the element; `false` if it has no such property */
export function writeProperty(element: dia.Element, name: string, value: TagValue, options?: dia.Cell.Options): boolean {
    const property = properties[element.get('type')]?.[name];
    if (!property) return false;
    Object.entries(property.write(element, value)).forEach(([path, change]) => element.prop(path, change, options));
    return true;
}
