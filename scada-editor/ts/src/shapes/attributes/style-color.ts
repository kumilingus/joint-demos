import type { dia } from '@joint/plus';
import { type StyleKey, styleOf } from '../common/style';

/*
 * A part of a shape in a color of its style (see `style.ts`): `styleFill: 'accent'`, `styleStroke: 'color'` on the
 * part - its fill, its stroke the color of the cell if it has one, else the part's own (its `fill`, its `stroke` in
 * the defaults of the shape: the default of the color field, see `ColorField.part`).
 */

const styleColor = (property: 'fill' | 'stroke') => ({
    set(this: dia.CellView, key: StyleKey) {
        const color = styleOf<string>(this.model, key);
        return color === undefined ? {} : { [property]: color };
    }
});

export const styleColorAttributes = {
    'style-fill': styleColor('fill'),
    'style-stroke': styleColor('stroke')
};

/** The color fields of a cell (see `ColorField`): by the key of the style */
type Fields = Partial<Record<'colorField' | 'outlineField' | 'accentField', { path: string[]; part?: [string, string] } | null>>;

/**
 * The colors of the parts set on the element itself (a diagram saved before its style had them) moved into its style
 * (silently): its parts back to their own colors, the default ones.
 */
export function withPartColorsInStyle(cell: dia.Cell, defaultsOf: (cell: dia.Cell, part: [string, string]) => unknown): void {
    const fields = cell as dia.Cell & Fields;
    (['colorField', 'outlineField', 'accentField'] as const).forEach((name) => {
        const field = fields[name];
        if (!field?.part || field.path[0] !== 'style') return;
        const color = cell.attr(field.part);
        const own = defaultsOf(cell, field.part);
        if (color === undefined || color === own) return;
        if (styleOf(cell, field.path[1] as StyleKey) === undefined) cell.prop(field.path, color, { silent: true });
        cell.attr(field.part, own, { silent: true });
    });
}
