import type { dia } from '@joint/plus';
import type TagIndex from './TagIndex';
import { featuresOf } from '../shapes/common/features';
import { getTag } from '../shapes/common/tag';

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

/** The prefix of the series of the cell's tags (see above); none - they can't be generated */
const tagPrefixOf = (cell: dia.Cell): string | null => featuresOf(cell)?.tagPrefix ?? null;

/** Whether the cell's tags can be generated (see above) */
export function isTaggable(cell: dia.Cell): boolean {
    return tagPrefixOf(cell) !== null;
}

/** The prefix of the series of the tag (the text before its number: `FT-101` → `FT`), none if it has no number */
function seriesOf(tag: string): string | null {
    const match = tag.match(/^(.*?)-?\d+$/);
    return match?.[1] || null;
}

/** The next free tag for the cell: in the series of its tag, else of its shape (`ID` - neither) */
export function nextTag(tags: TagIndex, cell: dia.Cell): string {
    const tag = getTag(cell);
    const prefix = (tag && seriesOf(tag)) || (tagPrefixOf(cell) ?? 'ID');
    return tags.next(prefix);
}

/** A new shape tagged if it is a part of the plant (`autoTag`, see `Shape`): before it is added (one step of the history) */
export function tagNewCell(tags: TagIndex, cell: dia.Cell): void {
    if (!getTag(cell) && isTaggable(cell) && featuresOf(cell)?.autoTag) cell.set('tag', nextTag(tags, cell));
}

/** A tag taken by another cell (a copy, a diagram loaded) replaced by the next free one of its series */
export function ensureUniqueTag(tags: TagIndex, cell: dia.Cell, options?: dia.Cell.Options): void {
    const tag = getTag(cell);
    if (tag && tags.isTaken(tag, cell)) cell.set('tag', nextTag(tags, cell), options);
}
