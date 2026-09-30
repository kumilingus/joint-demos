import { type dia, highlighters } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';

const ENERGIZED_HIGHLIGHTER_ID = 'energized';

/**
 * Shows the energized circuits: a cell with `energized` from the plant (see `simulation/`) gets the `energized`
 * class (a live wire, a lit lamp, a glowing heater in `styles.css`). Active in the runtime mode only.
 */
export default class ElectricalController extends Controller {

    startListening(): void {
        const { graph } = this.context;
        graph.getCells().forEach(cell => showEnergized(this.context, cell));
        this.listenTo(graph, 'change:energized', showEnergized);
    }

    stopListening(): void {
        super.stopListening();
        const { graph, paper } = this.context;
        graph.getCells().forEach((cell) => {
            const view = cell.findView(paper);
            if (view) highlighters.addClass.remove(view, ENERGIZED_HIGHLIGHTER_ID);
        });
    }
}

function showEnergized(app: App, cell: dia.Cell) {
    const view = cell.findView(app.paper);
    if (!view) return;
    if (cell.get('energized')) {
        if (!highlighters.addClass.get(view, ENERGIZED_HIGHLIGHTER_ID)) {
            highlighters.addClass.add(view, 'root', ENERGIZED_HIGHLIGHTER_ID, { className: 'energized' });
        }
    } else {
        highlighters.addClass.remove(view, ENERGIZED_HIGHLIGHTER_ID);
    }
}
