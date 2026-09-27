import type { dia } from '@joint/plus';
import {
    Beacon, Boiler, CheckValve, Chimney, ControlValve, Display, Filter, FlowMeter, HandValve,
    HeatExchanger, Instrument, Join, LiquidTank, Panel, Pipe, PressureGauge, Pump, SignalLine, Thermometer, Zone
} from '../shapes';

// The flue gas goes to the stacks in gray ducts (the green pipes carry water and steam).
const FLUE_COLOR = '#9aa3ab';

const anchorPoint = { name: 'anchor' };

/**
 * A boiler house: the water from the supply is filtered into the feedwater tank,
 * pumped (by one of the two feed pumps) through the flow meter and the feed valve
 * into two boilers. The steam of both is collected in the header and heats the process;
 * the flue gas of each boiler leaves through its stack.
 */
export function createBoilerHouse(): dia.Cell[] {

    // Water treatment

    const supply = new Zone({
        tag: 'Z-101',
        position: { x: 0, y: 380 },
        facing: 'right',
        attrs: { label: { text: 'Water Supply' }}
    });

    const inletValve = new HandValve({
        tag: 'HV-101',
        position: { x: 170, y: 370 },
        attrs: { label: { text: 'Inlet Valve' }}
    });

    const filter = new Filter({
        tag: 'F-101',
        position: { x: 290, y: 360 },
        attrs: { label: { text: 'Softener' }}
    });

    const feedwaterTank = new LiquidTank({
        tag: 'TK-101',
        position: { x: 430, y: 250 },
        attrs: { label: { text: 'Feedwater Tank' }}
    });

    const feedwaterLevel = new Panel({
        tag: 'LI-101',
        position: { x: 460, y: 300 },
        level: 65
    });

    // Feed pumps (one on duty, one on standby)

    const pump1 = new Pump({
        tag: 'P-101',
        position: { x: 690, y: 230 },
        power: 1,
        attrs: { label: { text: 'Feed Pump 1' }}
    });

    const pump2 = new Pump({
        tag: 'P-102',
        position: { x: 690, y: 400 },
        attrs: { label: { text: 'Feed Pump 2' }}
    });

    const checkValve1 = new CheckValve({
        tag: 'NRV-101',
        position: { x: 870, y: 240 },
        attrs: { label: { text: 'NRV 1' }}
    });

    const checkValve2 = new CheckValve({
        tag: 'NRV-102',
        position: { x: 870, y: 410 },
        attrs: { label: { text: 'NRV 2' }}
    });

    const pumpHeader = new Join({
        tag: 'J-101',
        position: { x: 980, y: 320 }
    });

    const flowMeter = new FlowMeter({
        tag: 'FM-101',
        position: { x: 1090, y: 310 },
        attrs: {
            label: { text: 'Feedwater Flow' },
            value: { text: '18.6' }
        }
    });

    const flowTransmitter = new Instrument({
        tag: 'FT-101',
        position: { x: 1100, y: 200 },
        attrs: { tag: { text: 'FT' }, loop: { text: '101' }}
    });

    const feedValve = new ControlValve({
        tag: 'CV-101',
        position: { x: 1230, y: 310 },
        open: 0.75,
        attrs: { label: { text: 'Feed Valve' }}
    });

    const boilerFeed = new Join({
        tag: 'J-102',
        position: { x: 1340, y: 320 }
    });

    // Boilers and their stacks

    const boiler1 = new Boiler({
        tag: 'B-101',
        position: { x: 1430, y: 300 },
        attrs: { label: { text: 'Boiler 1' }}
    });

    const stack1 = new Chimney({
        tag: 'ST-101',
        position: { x: 1590, y: 160 },
        attrs: { label: { text: 'Stack 1' }}
    });

    const boiler2 = new Boiler({
        tag: 'B-102',
        position: { x: 1730, y: 300 },
        attrs: { label: { text: 'Boiler 2' }}
    });

    const stack2 = new Chimney({
        tag: 'ST-102',
        position: { x: 1890, y: 160 },
        attrs: { label: { text: 'Stack 2' }}
    });

    // Steam

    const steamOutlet1 = new Join({
        tag: 'J-103',
        position: { x: 1470, y: 20 }
    });

    const steamOutlet2 = new Join({
        tag: 'J-104',
        position: { x: 1770, y: 20 }
    });

    const heater = new HeatExchanger({
        tag: 'HX-101',
        position: { x: 2010, y: 10 },
        attrs: { label: { text: 'Process Heater' }}
    });

    const process = new Zone({
        tag: 'Z-102',
        position: { x: 2240, y: 20 },
        attrs: { label: { text: 'Process' }}
    });

    // Instruments

    const steamPressure = new Display({
        tag: 'DI-101',
        position: { x: 1560, y: -110 },
        attrs: {
            label: { text: 'Steam Pressure' },
            value: { text: '10.4' },
            unit: { text: 'bar' }
        }
    });

    const headerGauge = new PressureGauge({
        tag: 'PG-101',
        position: { x: 1710, y: -110 },
        attrs: { label: { text: 'Header' }}
    });

    const highPressure = new Beacon({
        tag: 'AL-101',
        position: { x: 1850, y: -110 },
        attrs: { label: { text: 'High Pressure' }}
    });

    const steamTemperature = new Thermometer({
        tag: 'TI-101',
        position: { x: 2200, y: -130 },
        value: 75,
        attrs: { label: { text: 'Steam Temp.' }}
    });

    const pipe = (source: dia.Link.EndJSON, target: dia.Link.EndJSON, attributes: dia.Link.Attributes = {}) => {
        return new Pipe({ source, target, ...attributes });
    };

    const port = (element: dia.Element, id: 'left' | 'right'): dia.Link.EndJSON => ({
        id: element.id,
        port: id,
        anchor: { name: id, args: { rotate: true }},
        connectionPoint: anchorPoint
    });

    const side = (element: dia.Element, name: string, args: Record<string, number> = {}): dia.Link.EndJSON => ({
        id: element.id,
        anchor: { name, args },
        connectionPoint: anchorPoint
    });

    const flue = { attrs: { line: { stroke: FLUE_COLOR }}};

    const pipes = [
        // Water treatment
        pipe(side(supply, 'right'), port(inletValve, 'left')),
        pipe(port(inletValve, 'right'), port(filter, 'left')),
        pipe(port(filter, 'right'), side(feedwaterTank, 'left')),
        // Feed pumps
        pipe(side(feedwaterTank, 'right', { dy: -100 }), port(pump1, 'left')),
        pipe(side(feedwaterTank, 'right', { dy: 70 }), port(pump2, 'left')),
        pipe(port(pump1, 'right'), port(checkValve1, 'left')),
        pipe(port(pump2, 'right'), port(checkValve2, 'left')),
        pipe(port(checkValve1, 'right'), side(pumpHeader, 'top')),
        pipe(port(checkValve2, 'right'), side(pumpHeader, 'bottom')),
        // Feedwater to the boilers
        pipe(side(pumpHeader, 'right'), port(flowMeter, 'left')),
        pipe(port(flowMeter, 'right'), port(feedValve, 'left')),
        pipe(port(feedValve, 'right'), side(boilerFeed, 'left')),
        pipe(side(boilerFeed, 'right'), side(boiler1, 'left', { dy: -40 })),
        pipe(side(boilerFeed, 'bottom'), side(boiler2, 'left', { dy: 40 }), {
            // Below boiler 1 and in front of stack 1
            vertices: [{ x: 1360, y: 520 }, { x: 1690, y: 520 }, { x: 1690, y: 420 }]
        }),
        // Steam
        pipe(side(boiler1, 'top'), side(steamOutlet1, 'bottom')),
        pipe(side(boiler2, 'top'), side(steamOutlet2, 'bottom')),
        pipe(side(steamOutlet1, 'right'), side(steamOutlet2, 'left')),
        pipe(side(steamOutlet2, 'right'), port(heater, 'left')),
        pipe(port(heater, 'right'), side(process, 'left')),
        // Flue gas
        pipe(side(boiler1, 'right', { dy: -20 }), side(stack1, 'left', { dy: 80 }), flue),
        pipe(side(boiler2, 'right', { dy: -20 }), side(stack2, 'left', { dy: 80 }), flue)
    ];

    // The signal of the transmitter: a dashed line, no pipe
    const signal = new SignalLine({
        source: { id: flowTransmitter.id, anchor: { name: 'bottom' }},
        target: { id: flowMeter.id, anchor: { name: 'top' }}
    });

    return [
        supply, inletValve, filter, feedwaterTank, feedwaterLevel,
        pump1, pump2, checkValve1, checkValve2, pumpHeader,
        flowMeter, flowTransmitter, feedValve, boilerFeed,
        boiler1, stack1, boiler2, stack2,
        steamOutlet1, steamOutlet2, heater, process,
        steamPressure, headerGauge, highPressure, steamTemperature,
        ...pipes,
        signal
    ];
}
