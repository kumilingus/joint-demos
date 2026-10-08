import type { dia } from '@joint/plus';
import type { App } from '../app';
import { GRID_SIZE } from '../const';

/*
 * The selection moved by the keyboard (the arrow keys): a grid step, or a few with Shift - on the grid as it was.
 * One step of the history.
 */

export type MoveDirection = 'left' | 'right' | 'up' | 'down';

// The large step: a line of the major grid (see `getGrid()`)
const LARGE_STEP = 5 * GRID_SIZE;

const DIRECTIONS: Record<MoveDirection, [number, number]> = {
    left: [-1, 0],
    right: [1, 0],
    up: [0, -1],
    down: [0, 1]
};

/**
 * Move the selected cells: an element with its members (a group), a link with its bends (its ends attached stay) - and
 * a link between the moved elements with its bends, as a drag of the selection moves it. Whether anything was moved.
 */
export function moveSelection(app: App, direction: MoveDirection, large = false): boolean {
    const { graph, selection } = app;
    const selected = selection.toArray();
    // A member of a selected group moves with it
    const moved = selected.filter(cell => !cell.getAncestors().some(ancestor => selection.has(ancestor)));
    if (moved.length === 0) {
        return false;
    }
    const step = large ? LARGE_STEP : GRID_SIZE;
    const [dx, dy] = DIRECTIONS[direction].map(unit => unit * step);
    const elements = new Set(moved.filter(cell => cell.isElement()).flatMap(cell => [cell, ...cell.getEmbeddedCells({ deep: true })]));
    const links = new Set<dia.Link>([
        ...moved.filter((cell): cell is dia.Link => cell.isLink()),
        ...graph.getSubgraph([...elements]).filter((cell): cell is dia.Link => cell.isLink())
    ]);
    graph.startBatch('move');
    moved.forEach((cell) => {
        if (cell.isElement()) {
            cell.translate(dx, dy);
        }
    });
    links.forEach(link => link.translate(dx, dy));
    graph.stopBatch('move');
    return true;
}
