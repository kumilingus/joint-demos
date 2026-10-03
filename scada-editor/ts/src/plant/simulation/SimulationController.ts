import Controller from '../../controllers/Controller';
import type { App } from '../../app';
import { Simulation } from './simulation';

/**
 * Runs the plant (a mock sending random updates, see `simulation.ts`). Active in the runtime mode only.
 * The mock is all in this folder: an app with a real plant deletes it, and the controller from `app.ts` - its own
 * controller calls `plant.update()` with the messages of its system and sends the commands of `plant.subscribe()`
 * (see `plant.ts`, the README).
 */
export default class SimulationController extends Controller {

    simulation: Simulation;

    constructor(app: App) {
        super(app);
        this.simulation = new Simulation(app.graph);
    }

    startListening(): void {
        // Sending to the plant of the run
        this.simulation.start(this.context.plant!);
    }

    stopListening(): void {
        super.stopListening();
        this.simulation.stop();
    }
}
