import type { dia } from '@joint/plus';
import type TagIndex from './TagIndex';

/*
 * The tags: the IDs of the cells (`P-101`, `FT-101`, ...), set by the user.
 * JointJS generates the `id` of a cell, but it can't be changed: the tag is an attribute of its own.
 * The runtime updates address the cells by their tags (see `plant/mock/`), found by the index of the app
 * (`app.tags`, see `TagIndex`). A cell has a tag if its shape has a prefix for them (`tagPrefix`, see `Shape`):
 * the shapes do, the screen and the links don't (a link that needs one - a conveyor - would define it).
 */

/** A cell with a tag: its shape has the prefix of its tags */
export type Taggable = dia.Cell & { tagPrefix: string };

/** Whether the cell has a tag (see above) */
export function isTaggable(cell: dia.Cell): cell is Taggable {
    return 'tagPrefix' in cell && typeof cell.tagPrefix === 'string';
}

export function getTag(cell: dia.Cell): string | undefined {
    return cell.get('tag');
}

/** Give the cell a tag if it has none, or if another cell has the same one. */
export function ensureTag(tags: TagIndex, cell: Taggable, options?: dia.Cell.Options): void {
    const tag = getTag(cell);
    if (tag && !tags.isTaken(tag, cell)) return;
    cell.set('tag', tags.next(cell.tagPrefix), options);
}
