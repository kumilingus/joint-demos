import { type dia, highlighters } from '@joint/plus';

/*
 * The locked elements (`locked: true`, see `actions/lock.ts`): in the edit mode, as if they weren't there - the
 * `scada-locked` class on their views (see `canvas.css`: no pointer events), the pointer on what is below them.
 * A locked group locks its members (it draws nothing itself: they are what is clicked).
 */

const LOCKED_HIGHLIGHTER_ID = 'locked';

/** Whether the cell is locked: itself, or a group it is in */
export function isLocked(cell: dia.Cell): boolean {
    return [cell, ...cell.getAncestors()].some(level => level.get('locked'));
}

/** What locks the cell: the outermost of itself and its groups that is locked (unlocked as a whole), if any */
export function lockOwner(cell: dia.Cell): dia.Cell | null {
    return [cell, ...cell.getAncestors()].filter(level => level.get('locked')).at(-1) ?? null;
}

/** The cell and its members (deep) shown locked, or not */
export function showLocked(paper: dia.Paper, cell: dia.Cell): void {
    [cell, ...cell.getEmbeddedCells({ deep: true })].forEach((level) => {
        const view = level.findView(paper);
        if (!view) return;
        if (isLocked(level)) {
            if (!highlighters.addClass.get(view, LOCKED_HIGHLIGHTER_ID)) {
                highlighters.addClass.add(view, 'root', LOCKED_HIGHLIGHTER_ID, { className: 'scada-locked' });
            }
        } else {
            highlighters.addClass.remove(view, LOCKED_HIGHLIGHTER_ID);
        }
    });
}

/** No cell shown locked (the edit mode left) */
export function hideLocked(paper: dia.Paper): void {
    highlighters.addClass.removeAll(paper, LOCKED_HIGHLIGHTER_ID);
}
