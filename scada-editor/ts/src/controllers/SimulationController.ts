import Controller from './Controller';
import type { App } from '../app';
import { Simulation } from '../simulation';

/**
 * Runs the plant (a mock sending random updates, see `simulation.ts`). Active in the runtime mode only.
 */
export default class SimulationController extends Controller {

    simulation: Simulation;

    constructor(app: App) {
        super(app);
        this.simulation = new Simulation(app.graph);
    }

    startListening(): void {
        this.simulation.start();
    }

    stopListening(): void {
        super.stopListening();
        this.simulation.stop();
    }
}
