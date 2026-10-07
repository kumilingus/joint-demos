import type { dia } from '@joint/plus';
import type TagIndex from './TagIndex';

/*
 * The tags: the IDs of the cells (`P-101`, `FT-101`, ...) - a cell bound to the plant has one, any other has none.
 * JointJS generates the `id` of a cell, but it can't be changed: the tag is an attribute of its own.
 * The runtime updates address the cells by their tags (see `plant/mock/`), found by the index of the app
 * (`app.tags`, see `TagIndex`). Unique: a tag taken by another cell is not accepted.
 * The tags are generated in the series of a prefix: of the shape (`tagPrefix`, see `Shape`: the initials of its type by
 * default; none - a text, a zone: never a part of the plant), of a tag a copy has (`FT-101` → `FT-102`). A new shape gets
 * one if it is a part of the plant (`autoTag`): dropped from the palette, a group created; any other only when asked (the
 * ID field of the inspector). A copy gets one if the original had one.
 */

/** A cell whose tags can be generated: its shape has the prefix of their series */
export type Taggable = dia.Cell & { tagPrefix: string };

/** Whether the cell's tags can be generated (see above) */
export function isTaggable(cell: dia.Cell): cell is Taggable {
    return 'tagPrefix' in cell && typeof cell.tagPrefix === 'string';
}

/** The tag of the cell; none (`undefined`): not bound to the plant */
export function getTag(cell: dia.Cell): string | undefined {
    return cell.get('tag') || undefined;
}

/** The prefix of the series of the tag (the text before its number: `FT-101` → `FT`), none if it has no number */
function seriesOf(tag: string): string | null {
    const match = tag.match(/^(.*?)-?\d+$/);
    return match?.[1] || null;
}

/** The next free tag for the cell: in the series of its tag, else of its shape (`ID` - neither) */
export function nextTag(tags: TagIndex, cell: dia.Cell): string {
    const tag = getTag(cell);
    const prefix = (tag && seriesOf(tag)) || (isTaggable(cell) ? cell.tagPrefix : 'ID');
    return tags.next(prefix);
}

/** A new shape tagged if it is a part of the plant (`autoTag`, see `Shape`): before it is added (one step of the history) */
export function tagNewCell(tags: TagIndex, cell: dia.Cell): void {
    const autoTag = !('autoTag' in cell) || cell.autoTag !== false;
    if (!getTag(cell) && isTaggable(cell) && autoTag) cell.set('tag', nextTag(tags, cell));
}

/** A tag taken by another cell (a copy, a diagram loaded) replaced by the next free one of its series */
export function ensureUniqueTag(tags: TagIndex, cell: dia.Cell, options?: dia.Cell.Options): void {
    const tag = getTag(cell);
    if (tag && tags.isTaken(tag, cell)) cell.set('tag', nextTag(tags, cell), options);
}
