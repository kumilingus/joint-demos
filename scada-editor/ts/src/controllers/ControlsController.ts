import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { addControls, removeControls, updateControl } from '../controls';

/**
 * Shows the controls of the equipment (a pump switch, a valve slider, ...)
 * and keeps them in sync with the diagram. Active in every mode: the controls are
 * visible while editing too, they can be operated in the runtime mode only.
 */
export default class ControlsController extends Controller {

    startListening(): void {
        const { graph, paper } = this.context;

        addControls(paper);

        this.listenTo(graph, {
            'reset': onGraphReset,
            'add': onCellAdd,
            // Turned on or off in the inspector
            'change:controls': onControlsChange
        });
    }

    stopListening(): void {
        super.stopListening();
        removeControls(this.context.paper);
    }
}

function onGraphReset(app: App) {
    addControls(app.paper);
}

function onCellAdd(app: App, cell: dia.Cell) {
    if (!cell.isElement()) return;
    updateControl(app.paper, cell);
}

function onControlsChange(app: App, element: dia.Element) {
    updateControl(app.paper, element);
}
