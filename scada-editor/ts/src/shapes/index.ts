import { shapes } from '@joint/plus';
import Pump from './Pump';
import Compressor from './Compressor';
import Fan from './Fan';
import ControlValve from './ControlValve';
import HandValve from './HandValve';
import CheckValve from './CheckValve';
import HeatExchanger from './HeatExchanger';
import Filter from './Filter';
import Boiler from './Boiler';
import LiquidTank from './LiquidTank';
import ConicTank from './ConicTank';
import MixingTank from './MixingTank';
import Chimney from './Chimney';
import CoolingTower from './CoolingTower';
import Instrument from './Instrument';
import PressureGauge from './PressureGauge';
import Panel from './Panel';
import Motor from './Motor';
import Blower from './Blower';
import ConveyorBelt from './ConveyorBelt';
import Turbine from './Turbine';
import ButterflyValve from './ButterflyValve';
import BallValve from './BallValve';
import SolenoidValve from './SolenoidValve';
import ReliefValve from './ReliefValve';
import Separator from './Separator';
import Reactor from './Reactor';
import DistillationColumn from './DistillationColumn';
import Cyclone from './Cyclone';
import Silo from './Silo';
import Hopper from './Hopper';
import SphericalTank from './SphericalTank';
import HorizontalTank from './HorizontalTank';
import FlowMeter from './FlowMeter';
import Thermometer from './Thermometer';
import Beacon from './Beacon';
import Display from './Display';
import GateValve from './GateValve';
import YStrainer from './YStrainer';
import OrificePlate from './OrificePlate';
import AirCooler from './AirCooler';
import Scrubber from './Scrubber';
import WaterTower from './WaterTower';
import Trend from './Trend';
import Zone from './Zone';
import Join from './Join';
import Pipe from './Pipe';
import Label from './Label';
import CustomImage from './CustomImage';
import Tee from './Tee';
import Cross from './Cross';
import Elbow from './Elbow';
import EndCap from './EndCap';
import Manifold from './Manifold';
import SignalLine from './SignalLine';
import Screen from './Screen';
import Generator from './Generator';
import Transformer from './Transformer';
import Busbar from './Busbar';
import Battery from './Battery';
import CircuitBreaker from './CircuitBreaker';
import Disconnector from './Disconnector';
import Fuse from './Fuse';
import SurgeArrester from './SurgeArrester';
import Ground from './Ground';
import Lamp from './Lamp';
import Heater from './Heater';
import ElectricMeter from './ElectricMeter';
import Wire from './Wire';
import DieselGenerator from './DieselGenerator';
import WindTurbine from './WindTurbine';
import SolarArray from './SolarArray';
import PowerTransformer from './PowerTransformer';
import Switchgear from './Switchgear';
import MotorControlCenter from './MotorControlCenter';
import BatteryBank from './BatteryBank';
import FuelTank from './FuelTank';
import LineChart from './LineChart';
import BarChart from './BarChart';
import DonutChart from './DonutChart';
import GaugeChart from './GaugeChart';
import { chartView } from './charts';
import Rectangle from './Rectangle';
import Ellipse from './Ellipse';

export {
    Pump, Compressor, Fan, Motor, Blower, Turbine, ConveyorBelt,
    ControlValve, HandValve, CheckValve, ButterflyValve, BallValve, SolenoidValve, ReliefValve, GateValve,
    HeatExchanger, Filter, Boiler, Reactor, DistillationColumn, Separator, Cyclone, AirCooler, Scrubber,
    LiquidTank, ConicTank, MixingTank, Silo, SphericalTank, Hopper, HorizontalTank, WaterTower,
    Chimney, CoolingTower,
    Instrument, PressureGauge, Panel, Thermometer, FlowMeter, Beacon, Display, Trend,
    Zone, Join, Tee, Cross, Elbow, EndCap, Manifold, Pipe, Label, SignalLine, CustomImage, YStrainer, OrificePlate,
    Screen,
    Generator, Transformer, Busbar, Battery, CircuitBreaker, Disconnector, Fuse, SurgeArrester, Ground, Lamp, Heater, ElectricMeter, Wire,
    DieselGenerator, WindTurbine, SolarArray, PowerTransformer, Switchgear, MotorControlCenter, BatteryBank, FuelTank,
    LineChart, BarChart, DonutChart, GaugeChart,
    Rectangle, Ellipse
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
    Chimney,
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
    Pipe,
    SignalLine,
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
    // The charts, with the views rendering them again when their data changes (a view is looked up by the type)
    LineChart,
    LineChartView: chartView(['values', 'thresholds', 'min', 'max']),
    BarChart,
    BarChartView: chartView(['values', 'min', 'max']),
    DonutChart,
    DonutChartView: chartView(['slices']),
    GaugeChart,
    GaugeChartView: chartView(['value', 'min', 'max']),
    Rectangle,
    Ellipse
};
