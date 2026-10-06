import type { dia } from '@joint/plus';

/*
 * The style of a cell (its `style`): how it looks - its color, its outline (its color, its width), its accent, the
 * finish of its surfaces, the size of a link (`lineWidth`), the opacity of an image, of a shape of the background. As the style of the diagram (see `diagram-style.ts`): none
 * of a key - Auto, the diagram's (or the shape's own default). One attribute of the model: the view draws the cell
 * again when it changes (see `ShapeView`).
 */

/** The names of the style */
export type StyleKey = 'color' | 'outline' | 'outlineWidth' | 'accent' | 'finish' | 'lineWidth' | 'opacity';

/** A value of the style of the cell (`undefined`: none of its own - Auto) */
export function styleOf<T = unknown>(cell: dia.Cell, key: StyleKey): T | undefined {
    return cell.prop(['style', key]) as T | undefined;
}

/** Set a value of the style of the cell */
export function setStyle(cell: dia.Cell, key: StyleKey, value: unknown, options: dia.Cell.Options = {}): void {
    cell.prop(['style', key], value, { ...options, rewrite: true });
}

/** None of the value of its own (Auto) */
export function unsetStyle(cell: dia.Cell, key: StyleKey, options: dia.Cell.Options = {}): void {
    if (styleOf(cell, key) !== undefined) cell.removeProp(['style', key], options);
}
