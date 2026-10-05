import type { dia } from '@joint/plus';

/*
 * The style of a cell (its `style`): how it looks - its color, its outline (its color, its width), its accent, the
 * finish of its surfaces, the size of a link (`lineWidth`). As the style of the diagram (see `diagram-style.ts`): none
 * of a key - Auto, the diagram's (or the shape's own default). One attribute of the model: the view draws the cell
 * again when it changes (see `ShapeView`).
 */

/** The names of the style */
export type StyleKey = 'color' | 'outline' | 'outlineWidth' | 'accent' | 'finish' | 'lineWidth';

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

/** Whether a change of the style of the cell changed any of the values */
export function styleChanged(cell: dia.Cell, ...keys: StyleKey[]): boolean {
    const previous = (cell.previous('style') ?? {}) as Record<string, unknown>;
    const current = (cell.get('style') ?? {}) as Record<string, unknown>;
    return keys.some(key => JSON.stringify(previous[key]) !== JSON.stringify(current[key]));
}

// The keys of the style at the top level of a cell in a diagram saved before it had one
const STYLE_KEYS: StyleKey[] = ['color', 'outline', 'outlineWidth', 'finish', 'lineWidth'];
// ... and those of a level panel, a table (by their names then)
const RENAMED: Record<string, Record<string, StyleKey>> = {
    Panel: { liquidColor: 'accent' },
    Table: { fill: 'color', stroke: 'outline', headerFill: 'accent' }
};

/** A diagram (its JSON) with the style of its cells in their `style`: as saved now */
export function withStyle(json: dia.Graph.JSON): dia.Graph.JSON {
    const cells = (json.cells ?? []).map((cell) => {
        const renamed = RENAMED[String(cell.type)] ?? {};
        const moves: Array<[string, StyleKey]> = [
            ...STYLE_KEYS.map(key => [key, key] as [string, StyleKey]),
            ...Object.entries(renamed)
        ].filter(([from]) => from in cell);
        if (moves.length === 0) return cell;
        const moved: Record<string, unknown> = { ...cell };
        const style: Record<string, unknown> = { ...(cell.style as object | undefined) };
        moves.forEach(([from, to]) => {
            style[to] = cell[from];
            delete moved[from];
        });
        moved.style = style;
        return moved as dia.Cell.JSON;
    });
    return { ...json, cells };
}
