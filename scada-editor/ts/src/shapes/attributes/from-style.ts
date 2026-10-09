import { type dia, util } from '@joint/plus';
import { type StyleKey, styleOf } from '../common/style';
import { outlineWidthOf } from '../common/gradients';

/*
 * The attributes of a part in the values of the style of the cell (see `style.ts`): `fromStyle: { fill: 'accent',
 * stroke: 'outline' }` on the part - each attribute the value of the style if the cell has one, else the part's own (its
 * `fill`, its `stroke` in the defaults of the shape: the default of the color field, see `ColorField.part`).
 * `outlineWidth` (a `strokeWidth`): in px (see `outlineWidthOf()`), of an outline set only - else the part's own width.
 */

/** The outline width of the cell in px, if it has an outline of its own (the field shows then, see `inspector.ts`) */
export function outlineWidthIfOutlined(model: dia.Cell): number | undefined {
    const outline = styleOf(model, 'outline');
    if (typeof outline !== 'string' || outline === '') {
        return undefined;
    }
    return outlineWidthOf(model);
}

export const fromStyleAttributes = {
    'from-style': {
        set(this: dia.CellView, keys: Record<string, StyleKey>) {
            const attributes: Record<string, unknown> = {};
            Object.entries(keys).forEach(([name, key]) => {
                const value = key === 'outlineWidth' ? outlineWidthIfOutlined(this.model) : styleOf(this.model, key);
                if (value !== undefined) {
                    attributes[util.toKebabCase(name)] = value;
                }
            });
            return attributes;
        }
    }
};
