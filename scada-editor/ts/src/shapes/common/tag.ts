import type { dia } from '@joint/plus';

/*
 * The tag of a cell (its `tag`): its ID in the plant (`P-101`) - generated, kept unique by `plant/tags.ts`. Its view
 * (and its control) shows it in the DOM too (`data-tag`, see `markTag()`): the cursors of the runtime mode (see
 * `canvas.css`), the cells dimmed by the log (see `canvas/dim.ts`).
 */

/** The tag of the cell; none (`undefined`): not bound to the plant */
export function getTag(cell: dia.Cell): string | undefined {
    return cell.get('tag') || undefined;
}

/**
 * The tag of the cell on its node (`data-tag`): its view, its control; none - no attribute. Called when the node is drawn
 * (its `tag` changed).
 */
export function markTag(node: HTMLElement | SVGElement, cell: dia.Cell): void {
    const tag = getTag(cell);
    if (tag) {
        node.dataset.tag = tag;
    } else {
        delete node.dataset.tag;
    }
}
