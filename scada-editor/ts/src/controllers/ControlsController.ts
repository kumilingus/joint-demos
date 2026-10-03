import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { addControls, removeControls, updateControl } from '../runtime/controls';
import { getTag } from '../plant/tags';
import { propertiesOf, readProperty } from '../plant/properties';

/**
 * Shows the controls of the equipment (a pump switch, a valve slider, ...)
 * and keeps them in sync with the diagram. Active in every mode: the controls are
 * visible while editing too, they can be operated in the runtime mode only. A control only changes its element (with
 * the `command` option, see `COMMAND`): the change is sent to the plant from here (`app.plant`).
 */
export default class ControlsController extends Controller {

    startListening(): void {
        const { graph, paper } = this.context;

        addControls(paper);

        this.listenTo(graph, {
            'reset': onGraphReset,
            'add': onCellAdd,
            // Turned on or off in the inspector
            'change:controls': onControlsChange,
            // Operated (a command of the operator, not an update of the plant)
            'change': onCellChange
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

/** The changed properties of an element operated by its control: sent to the plant, as their values (see `properties.ts`) */
function onCellChange(app: App, cell: dia.Cell, options: dia.Cell.Options) {
    if (!options.command || !cell.isElement()) return;
    const tag = getTag(cell);
    if (!tag) return;
    propertiesOf(cell)
        .filter(property => cell.hasChanged(property))
        .forEach(property => app.plant?.send(tag, property, readProperty(cell, property)!));
}
