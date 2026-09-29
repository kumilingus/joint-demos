/*
 * What the shapes of the palette are: the name and a description shown when a shape is clicked
 * in the palette (see `shape-preview.ts`).
 */

export interface ShapeDescription {
    title: string;
    description: string;
}

export const descriptions: Record<string, ShapeDescription> = {
    // Piping
    Pipe: { title: 'Pipe', description: 'Carries the liquid or the gas between the equipment. Connect its ends to the pipe stubs of the equipment (or to the sides of the elements without stubs).' },
    Join: { title: 'Join', description: 'A point where pipes meet, without stubs: a pipe connects to the middle of any of its sides.' },
    Tee: { title: 'Tee', description: 'A pipe fork: the line goes through and a branch leaves it. Rotate it to turn the branch.' },
    Cross: { title: 'Cross', description: 'Four pipes meet: a line with a branch on each side.' },
    Elbow: { title: 'Elbow', description: 'The line turns by 90 degrees. Rotate it to choose the turn.' },
    EndCap: { title: 'End Cap', description: 'Closes the end of a line (a blind end for a future connection).' },
    Manifold: { title: 'Manifold', description: 'A distribution header: one inlet, three outlets feeding parallel lines.' },
    YStrainer: { title: 'Y-Strainer', description: 'Catches the debris in the line before it reaches the pumps and the valves.' },
    OrificePlate: { title: 'Orifice Plate', description: 'A flow element: the flow is measured from the pressure drop across the plate.' },
    Zone: { title: 'Zone', description: 'Where a pipe comes from or goes to outside of the diagram (another plant section, the supply, the drain).' },

    // Rotating equipment
    Pump: { title: 'Pump', description: 'Moves the liquid through the pipes. Switched on and off in the runtime mode.' },
    Compressor: { title: 'Compressor', description: 'Raises the pressure of a gas (air, steam, a process gas).' },
    Fan: { title: 'Fan', description: 'Moves air or a gas at a low pressure (ventilation, combustion air).' },
    Blower: { title: 'Blower', description: 'Moves air or a gas at a moderate pressure (aeration, conveying).' },
    Motor: { title: 'Motor', description: 'An electric motor driving the equipment next to it.' },
    Turbine: { title: 'Turbine', description: 'Turns the energy of the steam or a gas into the rotation of a shaft (a generator, a compressor).' },
    ConveyorBelt: { title: 'Conveyor', description: 'Carries bulk material (coal, grain, parts) between the equipment.' },

    // Valves
    ControlValve: { title: 'Control Valve', description: 'Regulates the flow: open by a part, set by the controller (a slider in the runtime mode).' },
    HandValve: { title: 'Hand Valve', description: 'Opened and closed by hand, to isolate a part of the line.' },
    CheckValve: { title: 'Check Valve', description: 'Lets the flow go one way only (the arrow), and stops it from going back.' },
    ButterflyValve: { title: 'Butterfly Valve', description: 'A disc turning in the pipe: a quick shut-off for the large lines.' },
    BallValve: { title: 'Ball Valve', description: 'A ball with a hole turning in the pipe: a tight shut-off.' },
    SolenoidValve: { title: 'Solenoid Valve', description: 'Opened and closed by an electric signal (automation, interlocks).' },
    ReliefValve: { title: 'Relief Valve', description: 'Opens by itself when the pressure is too high, to protect the equipment.' },
    GateValve: { title: 'Gate Valve', description: 'A gate sliding across the pipe: fully open or fully closed, with little loss.' },

    // Process
    HeatExchanger: { title: 'Heat Exchanger', description: 'Passes the heat from one liquid to another through the walls of its tubes.' },
    Filter: { title: 'Filter', description: 'Removes the particles from the liquid or the gas.' },
    Separator: { title: 'Separator', description: 'Separates the phases of a mixture (the gas from the liquid, the oil from the water).' },
    Boiler: { title: 'Boiler', description: 'Burns a fuel to heat the water into steam.' },
    Reactor: { title: 'Reactor', description: 'A vessel with an agitator where the process reaction takes place.' },
    DistillationColumn: { title: 'Distillation Column', description: 'Separates a mixture by boiling: the lighter parts rise, the heavier ones go down.' },
    Cyclone: { title: 'Cyclone', description: 'Spins the gas to throw the dust out of it.' },
    AirCooler: { title: 'Air Cooler', description: 'Cools the liquid in its tubes with the air blown by its fans.' },
    Scrubber: { title: 'Scrubber', description: 'Washes the gas with a liquid sprayed over the packing, to remove the pollutants.' },

    // Storage
    LiquidTank: { title: 'Tank', description: 'Stores the liquid. The level is shown by a gauge (a level panel on the tank).' },
    ConicTank: { title: 'Conic Tank', description: 'A tank with a conical bottom that drains whole.' },
    MixingTank: { title: 'Mixer', description: 'A tank with an agitator driven by a motor, to blend the liquids.' },
    Silo: { title: 'Silo', description: 'Stores the bulk solids (grain, cement, pellets), emptied from the bottom.' },
    SphericalTank: { title: 'Sphere', description: 'Stores a gas under pressure (a sphere takes the pressure best).' },
    Hopper: { title: 'Hopper', description: 'Feeds the bulk material into the equipment below it.' },
    HorizontalTank: { title: 'Horizontal Tank', description: 'A horizontal vessel on saddles (fuel, chemicals, a buffer).' },
    WaterTower: { title: 'Water Tower', description: 'Stores the water up high: the height gives the pressure of the supply.' },

    // Structures
    Chimney: { title: 'Chimney', description: 'Takes the flue gas of the boilers and the furnaces up into the air.' },
    CoolingTower: { title: 'Cooling Tower', description: 'Cools the water by evaporation: the plume is the water vapor.' },

    // Instruments
    Instrument: { title: 'Instrument', description: 'An instrument bubble of the P&ID: the function (PT: a pressure transmitter, FT: a flow transmitter, ...) and the loop number.' },
    PressureGauge: { title: 'Pressure Gauge', description: 'Shows the pressure with a needle, in the warning colors above the thresholds.' },
    Panel: { title: 'Level Panel', description: 'Shows the level of a tank, in the warning colors below and above the thresholds. Put it on its tank.' },
    Thermometer: { title: 'Thermometer', description: 'Shows the temperature.' },
    FlowMeter: { title: 'Flow Meter', description: 'Measures and shows the flow through the line.' },
    Beacon: { title: 'Beacon', description: 'An alarm light: it pulses while the alarm is on.' },
    Display: { title: 'Display', description: 'Shows a value of the plant with its unit.' },
    Trend: { title: 'Trend', description: 'Shows the recent history of a value: the newest on the right.' },
    SignalLine: { title: 'Signal Line', description: 'Connects an instrument (a transmitter) to what it measures or controls.' },
    Label: { title: 'Label', description: 'A text on the diagram: a name of an area, a note.' },

    // Electrical
    DieselGenerator: { title: 'Diesel Generator', description: 'An engine and an alternator on a skid: a source of the power while it runs. The fuel comes in by the pipe on the left.' },
    WindTurbine: { title: 'Wind Turbine', description: 'A source of the power while it runs: its rotor spins.' },
    SolarArray: { title: 'Solar Array', description: 'A source of the power from the sun.' },
    PowerTransformer: { title: 'Power Transformer', description: 'The tank with its cooling radiators, the oil conservator and the bushings: changes the voltage between its high (left) and low (right) side.' },
    Switchgear: { title: 'Switchgear', description: 'Cabinet panels with the breakers: the power in on the sides, the feeders at the bottom. Its lamps are lit while it is energized.' },
    MotorControlCenter: { title: 'Motor Control Center', description: 'A cabinet of the starters of the motors: fed from the left, the motors connected at the bottom. Its lamps are lit while it is energized.' },
    BatteryBank: { title: 'Battery Bank', description: 'A storage of the energy (a UPS): a source of the power, its charge on the gauge.' },
    FuelTank: { title: 'Fuel Tank', description: 'The day tank of a generator: the fuel level in its sight glass, the fuel out by the pipes.' },
    Generator: { title: 'Generator', description: 'A source of the power while it runs (switched on and off in the runtime mode).' },
    Transformer: { title: 'Transformer', description: 'Changes the voltage between its two windings.' },
    Busbar: { title: 'Busbar', description: 'A conductor many circuits are connected to: terminals on its ends, on the top and on the bottom.' },
    Battery: { title: 'Battery', description: 'A source of the power, always.' },
    CircuitBreaker: { title: 'Circuit Breaker', description: 'The current passes while it is closed (red); open (green) it cuts the circuit. Opened and closed in the runtime mode.' },
    Disconnector: { title: 'Disconnector', description: 'A switch isolating a part of the circuit: its blade lifts off the contact when open.' },
    Fuse: { title: 'Fuse', description: 'Protects the circuit from an overcurrent.' },
    SurgeArrester: { title: 'Surge Arrester', description: 'Leads an overvoltage (a lightning strike) to the ground.' },
    Ground: { title: 'Ground', description: 'The earth: the reference of the voltage, where a fault current goes.' },
    Lamp: { title: 'Lamp', description: 'A load: lit while it is energized.' },
    Heater: { title: 'Heater', description: 'An electric heater, a load: glows while it is energized.' },
    ElectricMeter: { title: 'Voltmeter', description: 'Shows the voltage of the circuit: zero while it is not energized.' },
    Wire: { title: 'Wire', description: 'Connects the terminals of the electrical shapes. Live (in color) while the circuit is energized.' },

    // Custom
    CustomImage: { title: 'Image', description: 'An image of your own, uploaded into the diagram: it is saved with it, once, however many elements show it.' }
};
