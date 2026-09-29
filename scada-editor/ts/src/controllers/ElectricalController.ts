import { type dia, highlighters } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { getEnergized } from '../energized';

const ENERGIZED_HIGHLIGHTER_ID = 'energized';

/**
 * Shows the energized circuits (see `energized.ts`): the energized cells get the `energized` class
 * (a live wire, a lit lamp, a glowing heater in `styles.css`), following the generators and the switches.
 * The model doesn't change. Active in the runtime mode only.
 */
export default class ElectricalController extends Controller {

    startListening(): void {
        const { graph } = this.context;
        updateEnergized(this.context);
        this.listenTo(graph, 'change:power change:open', updateEnergized);
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

function updateEnergized(app: App) {
    const { graph, paper } = app;
    const energized = getEnergized(graph);
    graph.getCells().forEach((cell: dia.Cell) => {
        const view = cell.findView(paper);
        if (!view) return;
        const highlighted = Boolean(highlighters.addClass.get(view, ENERGIZED_HIGHLIGHTER_ID));
        if (energized.has(cell) && !highlighted) {
            highlighters.addClass.add(view, 'root', ENERGIZED_HIGHLIGHTER_ID, { className: 'energized' });
        } else if (!energized.has(cell) && highlighted) {
            highlighters.addClass.remove(view, ENERGIZED_HIGHLIGHTER_ID);
        }
    });
}
