import Controller from '../../controllers/Controller';
import type { App } from '../../app';
import { MockPlant } from './mock-plant';

/**
 * Runs the plant (a mock sending random updates, see `mock-plant.ts`). Active in the runtime mode only.
 * The mock is all in this folder: an app with a real plant deletes it, and the controller from `app.ts` - its own
 * controller calls `plant.update()` with the messages of its system and sends the commands of its `command` event
 * (see `plant.ts`, the README).
 */
export default class MockPlantController extends Controller {

    mock: MockPlant;

    constructor(app: App) {
        super(app);
        this.mock = new MockPlant(app.graph, app.tags);
    }

    startListening(): void {
        // Sending to the plant of the run
        this.mock.start(this.app.plant!);
    }

    stopListening(): void {
        super.stopListening();
        this.mock.stop();
    }
}
