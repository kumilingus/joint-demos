import { type dia, highlighters } from '@joint/plus';
import Screen from '../shapes/models/diagram/Screen';
import { getControl } from '../runtime/controls';

/*
 * Cells of the diagram dimmed (by the log: the ones its filter leaves out, the ones without an ID): a class on their views
 * (a highlighter: nothing of the diagram changes) and on their controls. Never the screen (the canvas of the runtime mode).
 */

const DIM_ID = 'dim';

// A dimmed cell: gray and flat - in the background (its shapes still read); faded in Safari, which does not draw the
// CSS filter functions on the SVG elements (see `canvas.css`)
const DIMMED_CLASS = isSafari() ? 'scada-faded' : 'scada-grayed';

/** Whether the browser is Safari (its engine: on iOS every browser) */
function isSafari(): boolean {
    const { userAgent } = navigator;
    return /AppleWebKit/.test(userAgent) && !/Chrome|Chromium|Edg|Android/.test(userAgent);
}

/** The cells of the paper dimmed (the ones dimmed before not any more) */
export function dimCells(paper: dia.Paper, cells: Set<dia.Cell>): void {
    undimCells(paper);
    cells.forEach((cell) => {
        const view = cell.findView(paper);
        if (!view || Screen.isScreen(cell)) {
            return;
        }
        highlighters.addClass.add(view, 'root', DIM_ID, { className: DIMMED_CLASS });
        getControl(view)?.el.classList.add(DIMMED_CLASS);
    });
}

/** None of the cells of the paper dimmed */
function undimCells(paper: dia.Paper): void {
    highlighters.addClass.removeAll(paper, DIM_ID);
    paper.model.getElements().forEach((element) => {
        const view = element.findView(paper);
        if (view) {
            getControl(view)?.el.classList.remove(DIMMED_CLASS);
        }
    });
}
