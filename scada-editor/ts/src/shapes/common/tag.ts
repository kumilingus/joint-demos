import type { dia } from '@joint/plus';

/*
 * The tag of a cell (its `tag`): its ID in the plant (`P-101`) - generated, kept unique by `plant/tags.ts`. Its view
 * shows it in the DOM too (`data-tag`, see `markTag()`): the cursors of the runtime mode (see `canvas.css`).
 */

/** The tag of the cell; none (`undefined`): not bound to the plant */
export function getTag(cell: dia.Cell): string | undefined {
    return cell.get('tag') || undefined;
}

/** The tag of the cell on its view (`data-tag`); none - no attribute. Called when the view is drawn (its `tag` changed). */
export function markTag(view: dia.CellView): void {
    const tag = getTag(view.model);
    if (tag) {
        view.el.dataset.tag = tag;
    } else {
        delete view.el.dataset.tag;
    }
}
