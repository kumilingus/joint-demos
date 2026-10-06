import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { hideEnergized, showEnergized } from '../runtime/electrical';

/**
 * Shows the energized circuits: a cell with `energized` from the plant (see `plant/mock/`) is shown energized
 * (see `runtime/electrical.ts`). Active in the runtime mode only.
 */
export default class ElectricalController extends Controller {

    startListening(): void {
        const { graph, paper } = this.app;
        graph.getCells().forEach(cell => showEnergized(paper, cell));
        this.listenTo(graph, 'change:energized', onEnergizedChange);
    }

    stopListening(): void {
        super.stopListening();
        hideEnergized(this.app.paper);
    }
}

function onEnergizedChange(app: App, cell: dia.Cell) {
    const { paper } = app;
    showEnergized(paper, cell);
}
