import type { dia } from '@joint/plus';
import type { App } from '../app';
import type { FindHooks } from './FindView';
import { Mode } from '../const';
import { getTag } from '../plant/tags';
import { isLocked } from '../canvas/lock';
import { descriptions } from '../palette/descriptions';
import { type SelectionOptions, selectCells } from '../actions';
import { setMarker } from '../canvas/marker';
import { isScreenShown } from '../canvas/screen';

/*
 * What the find list reads from the diagram and shows on it (its hooks, see `FindController`): the cells with an ID or a
 * name (not the locked ones: the background); the cell of the entry clicked scrolled into view (to the middle: picked to close the
 * list) - selected in the edit mode (the inspector shows it; with Ctrl / Cmd / Shift added to the selection, or out of
 * it), marked in the runtime mode (as the element of a message clicked in the log).
 */

/** A change of the selection by the find list (see `FindController`: not clearing its marks) */
export const FROM_FIND: SelectionOptions = { find: true };

/**
 * The cells scrolled to the middle of the canvas (the middle of their box): if they are not in view, or always (`center`)
 * - not while the screen is shown (the runtime mode: it fills the canvas, not panned - see `RuntimeController`)
 */
function scrollIntoView(app: App, cells: dia.Cell[], center: boolean): void {
    const { graph, scroller } = app;
    const bbox = graph.getCellsBBox(cells);
    if (!bbox || isScreenShown(app)) return;
    if (!center && scroller.getVisibleArea().containsRect(bbox)) return;
    const { x, y } = bbox.center();
    scroller.center(x, y, { animation: { duration: 300 }});
}

export function findHooks(app: App): FindHooks {
    const { graph, paper } = app;
    return {
        // By an ID or a name (a shape with neither: nothing to find it by)
        entries: () => graph.getCells()
            .filter(cell => !isLocked(cell))
            .map((cell) => {
                const type: string = cell.get('type');
                return {
                    id: String(cell.id),
                    tag: getTag(cell) ?? '',
                    name: cell.prop(['label', 'text']) ?? '',
                    kind: descriptions[type]?.title ?? type,
                    description: descriptions[type]?.description ?? ''
                };
            })
            .filter(({ tag, name }) => tag || name),
        multiple: () => app.mode === Mode.Edit,
        show: (ids, { focus, center = false } = {}) => {
            const cells = ids.map(id => graph.getCell(id)).filter((cell): cell is dia.Cell => Boolean(cell));
            // Picked (`center`): all of them in the middle; the one clicked (or moved to) in view otherwise
            const focused = focus ? graph.getCell(focus) : undefined;
            if (center) {
                scrollIntoView(app, cells, true);
            } else if (focused) {
                scrollIntoView(app, [focused], false);
            }
            if (app.mode === Mode.Edit) {
                // None: nothing selected by the list (the selection left as it is - the list closed)
                if (cells.length > 0 || focus) selectCells(app, cells, FROM_FIND);
                return;
            }
            // The runtime mode: one at a time (see `multiple`) - marked (an arrow pointing at it, flashed: see `marker.ts`) while
            // the list is open; none (the list closed): not any more
            const [cell] = cells;
            setMarker(paper, cell ?? null);
        }
    };
}
