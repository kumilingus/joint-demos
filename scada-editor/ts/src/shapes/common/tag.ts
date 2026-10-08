import type { dia } from '@joint/plus';

/*
 * The tag of a cell (its `tag`): its ID in the plant (`P-101`) - generated, kept unique by `plant/tags.ts`.
 */

/** The tag of the cell; none (`undefined`): not bound to the plant */
export function getTag(cell: dia.Cell): string | undefined {
    return cell.get('tag') || undefined;
}
