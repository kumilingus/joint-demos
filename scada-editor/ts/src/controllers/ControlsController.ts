import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { addControls, removeControls, updateControl } from '../runtime/controls';
import { getTag } from '../shapes/common/tag';
import type { TagValue } from '../plant/properties';

/**
 * Shows the controls of the equipment (a pump switch, a valve slider, ...)
 * and keeps them in sync with the diagram. Active in every mode: the controls are
 * visible while editing too, they can be operated in the runtime mode only. A control changes nothing: it triggers the
 * `command` event of its element - sent to the plant from here (`app.plant`), which answers with an update.
 */
export default class ControlsController extends Controller {

    startListening(): void {
        const { graph, paper } = this.app;

        addControls(paper);

        this.listenTo(graph, {
            'reset': onGraphReset,
            'add': onCellAdd,
            // Turned on or off in the inspector
            'change:controls': onControlsChange,
            // Operated (a command of the operator, see `controls.ts`)
            'command': onCommand
        });
    }

    stopListening(): void {
        super.stopListening();
        removeControls(this.app.paper);
    }
}

function onGraphReset(app: App) {
    const { paper } = app;
    addControls(paper);
}

function onCellAdd(app: App, cell: dia.Cell) {
    const { paper } = app;
    if (!cell.isElement()) return;
    updateControl(paper, cell);
}

function onControlsChange(app: App, element: dia.Element) {
    const { paper } = app;
    updateControl(paper, element);
}

/** A command of the operator: sent to the plant of the run (none while editing) */
function onCommand(app: App, element: dia.Element, property: string, value: TagValue) {
    const { plant } = app;
    const tag = getTag(element);
    if (tag) plant?.send(tag, property, value);
}
