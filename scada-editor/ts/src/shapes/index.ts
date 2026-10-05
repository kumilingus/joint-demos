import { shapes } from '@joint/plus';
import Pump from './models/rotating/Pump';
import Compressor from './models/rotating/Compressor';
import Fan from './models/rotating/Fan';
import ControlValve from './models/valves/ControlValve';
import HandValve from './models/valves/HandValve';
import CheckValve from './models/valves/CheckValve';
import HeatExchanger from './models/process/HeatExchanger';
import Filter from './models/process/Filter';
import Boiler from './models/process/Boiler';
import LiquidTank from './models/storage/LiquidTank';
import ConicTank from './models/storage/ConicTank';
import MixingTank from './models/storage/MixingTank';
import Stack from './models/structures/Stack';
import CoolingTower from './models/structures/CoolingTower';
import Instrument from './models/instruments/Instrument';
import PressureGauge from './models/instruments/PressureGauge';
import Panel from './models/instruments/Panel';
import Motor from './models/rotating/Motor';
import Blower from './models/rotating/Blower';
import ConveyorBelt from './models/bulk/ConveyorBelt';
import Turbine from './models/rotating/Turbine';
import ButterflyValve from './models/valves/ButterflyValve';
import BallValve from './models/valves/BallValve';
import SolenoidValve from './models/valves/SolenoidValve';
import ReliefValve from './models/valves/ReliefValve';
import Separator from './models/process/Separator';
import Reactor from './models/process/Reactor';
import DistillationColumn from './models/process/DistillationColumn';
import Cyclone from './models/process/Cyclone';
import Silo from './models/storage/Silo';
import Hopper from './models/storage/Hopper';
import SphericalTank from './models/storage/SphericalTank';
import HorizontalTank from './models/storage/HorizontalTank';
import FlowMeter from './models/instruments/FlowMeter';
import Thermometer from './models/instruments/Thermometer';
import Beacon from './models/instruments/Beacon';
import Display from './models/instruments/Display';
import GateValve from './models/valves/GateValve';
import YStrainer from './models/piping/YStrainer';
import OrificePlate from './models/piping/OrificePlate';
import AirCooler from './models/process/AirCooler';
import Scrubber from './models/process/Scrubber';
import WaterTower from './models/storage/WaterTower';
import Trend from './models/charts/Trend';
import Zone from './models/piping/Zone';
import Join from './models/piping/Join';
import Pipe, { PipeView } from './models/piping/Pipe';
import { StyledLinkView } from './common/line-width';
import Conveyor from './models/bulk/Conveyor';
import RotaryKiln from './models/bulk/RotaryKiln';
import Table from './models/charts/Table';
import TableView from './views/TableView';
import Crusher from './models/bulk/Crusher';
import Mill from './models/bulk/Mill';
import BucketElevator from './models/bulk/BucketElevator';
import BagFilter from './models/process/BagFilter';
import Label from './models/instruments/Label';
import CustomImage from './models/custom/CustomImage';
import Tee from './models/piping/Tee';
import Cross from './models/piping/Cross';
import Elbow from './models/piping/Elbow';
import EndCap from './models/piping/EndCap';
import Manifold from './models/piping/Manifold';
import SignalLine from './models/instruments/SignalLine';
import Arrow, { ArrowView } from './models/instruments/Arrow';
import Screen from './models/diagram/Screen';
import Generator from './models/electrical/Generator';
import Transformer from './models/electrical/Transformer';
import Busbar from './models/electrical/Busbar';
import Battery from './models/electrical/Battery';
import CircuitBreaker from './models/electrical/CircuitBreaker';
import Disconnector from './models/electrical/Disconnector';
import Fuse from './models/electrical/Fuse';
import SurgeArrester from './models/electrical/SurgeArrester';
import Ground from './models/electrical/Ground';
import Lamp from './models/electrical/Lamp';
import Heater from './models/electrical/Heater';
import ElectricMeter from './models/electrical/ElectricMeter';
import Wire from './models/electrical/Wire';
import DieselGenerator from './models/electrical/DieselGenerator';
import WindTurbine from './models/electrical/WindTurbine';
import SolarArray from './models/electrical/SolarArray';
import PowerTransformer from './models/electrical/PowerTransformer';
import Switchgear from './models/electrical/Switchgear';
import MotorControlCenter from './models/electrical/MotorControlCenter';
import BatteryBank from './models/electrical/BatteryBank';
import FuelTank from './models/storage/FuelTank';
import LineChart from './models/charts/LineChart';
import BarChart from './models/charts/BarChart';
import DonutChart from './models/charts/DonutChart';
import GaugeChart from './models/charts/GaugeChart';
import { shapeView } from './views/ShapeView';
import Rectangle from './models/background/Rectangle';
import Ellipse from './models/background/Ellipse';
import Group from './models/diagram/Group';

export {
    Pump, Compressor, Fan, Motor, Blower, Turbine, ConveyorBelt,
    ControlValve, HandValve, CheckValve, ButterflyValve, BallValve, SolenoidValve, ReliefValve, GateValve,
    HeatExchanger, Filter, Boiler, Reactor, DistillationColumn, Separator, Cyclone, AirCooler, Scrubber,
    LiquidTank, ConicTank, MixingTank, Silo, SphericalTank, Hopper, HorizontalTank, WaterTower,
    Stack, CoolingTower,
    Instrument, PressureGauge, Panel, Thermometer, FlowMeter, Beacon, Display, Trend,
    Zone, Join, Tee, Cross, Elbow, EndCap, Manifold, Pipe, Label, SignalLine, Arrow, CustomImage, YStrainer, OrificePlate,
    Screen,
    Generator, Transformer, Busbar, Battery, CircuitBreaker, Disconnector, Fuse, SurgeArrester, Ground, Lamp, Heater, ElectricMeter, Wire,
    DieselGenerator, WindTurbine, SolarArray, PowerTransformer, Switchgear, MotorControlCenter, BatteryBank, FuelTank,
    LineChart, BarChart, DonutChart, GaugeChart,
    Conveyor, RotaryKiln, Crusher, Mill, BucketElevator, BagFilter, Table,
    Rectangle, Ellipse, Group
};

export const cellNamespace = {
    ...shapes,
    Pump,
    Compressor,
    Fan,
    ControlValve,
    HandValve,
    CheckValve,
    HeatExchanger,
    Filter,
    Boiler,
    LiquidTank,
    ConicTank,
    MixingTank,
    Stack,
    CoolingTower,
    Instrument,
    PressureGauge,
    Panel,
    Motor,
    Blower,
    ConveyorBelt,
    Turbine,
    ButterflyValve,
    BallValve,
    SolenoidValve,
    ReliefValve,
    Separator,
    Reactor,
    DistillationColumn,
    Cyclone,
    Silo,
    Hopper,
    SphericalTank,
    HorizontalTank,
    FlowMeter,
    Thermometer,
    Beacon,
    Display,
    GateValve,
    YStrainer,
    OrificePlate,
    AirCooler,
    Scrubber,
    WaterTower,
    // Not in the palette anymore (the line chart instead): a saved diagram with it still loads.
    Trend,
    Zone,
    Join,
    Label,
    // The links drawn again when their style changes (see `style.ts`)
    WireView: StyledLinkView,
    SignalLineView: StyledLinkView,
    ConveyorView: StyledLinkView,
    // A pipe with a view of its own (its outline drawn again with its outline width)
    Pipe,
    PipeView,
    SignalLine,
    // An arrow with a view of its own (its line ends where its arrowheads start)
    Arrow,
    ArrowView,
    CustomImage,
    Tee,
    Cross,
    Elbow,
    EndCap,
    Manifold,
    Screen,
    Generator,
    Transformer,
    Busbar,
    Battery,
    CircuitBreaker,
    Disconnector,
    Fuse,
    SurgeArrester,
    Ground,
    Lamp,
    Heater,
    ElectricMeter,
    Wire,
    DieselGenerator,
    WindTurbine,
    SolarArray,
    PowerTransformer,
    Switchgear,
    MotorControlCenter,
    BatteryBank,
    FuelTank,
    Conveyor,
    RotaryKiln,
    Crusher,
    Mill,
    BucketElevator,
    BagFilter,
    // A table with a view of its own (a change of a value updates its cell only)
    Table,
    TableView,
    // The charts, with the views rendering them again when their data changes (a view is looked up by the type)
    LineChart,
    LineChartView: shapeView(['data']),
    BarChart,
    BarChartView: shapeView(['data']),
    DonutChart,
    DonutChartView: shapeView(['data']),
    GaugeChart,
    GaugeChartView: shapeView(['data']),
    Rectangle,
    Ellipse,
    Group
};
