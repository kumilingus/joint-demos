import { type dia, highlighters } from '@joint/plus';

/*
 * The energized circuits on the paper (see `ElectricalController`): a cell with `energized` from the plant (see
 * `plant/mock/`) has the `energized` class - a live wire, a lit lamp, a glowing heater in `runtime.css`.
 */

const ENERGIZED_HIGHLIGHTER_ID = 'energized';

/** The cell shown energized, or not (by its `energized`) */
export function showEnergized(paper: dia.Paper, cell: dia.Cell): void {
    const view = cell.findView(paper);
    if (!view) return;
    if (cell.get('energized')) {
        if (!highlighters.addClass.get(view, ENERGIZED_HIGHLIGHTER_ID)) {
            highlighters.addClass.add(view, 'root', ENERGIZED_HIGHLIGHTER_ID, { className: 'energized' });
        }
    } else {
        highlighters.addClass.remove(view, ENERGIZED_HIGHLIGHTER_ID);
    }
}

/** No cell shown energized (the runtime mode left) */
export function hideEnergized(paper: dia.Paper): void {
    highlighters.addClass.removeAll(paper, ENERGIZED_HIGHLIGHTER_ID);
}
