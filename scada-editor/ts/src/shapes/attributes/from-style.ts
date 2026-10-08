import { type dia, util } from '@joint/plus';
import { type StyleKey, styleOf } from '../common/style';

/*
 * The attributes of a part in the values of the style of the cell (see `style.ts`): `fromStyle: { fill: 'accent',
 * stroke: 'outline' }` on the part - each attribute the value of the style if the cell has one, else the part's own (its
 * `fill`, its `stroke` in the defaults of the shape: the default of the color field, see `ColorField.part`).
 */

export const fromStyleAttributes = {
    'from-style': {
        set(this: dia.CellView, keys: Record<string, StyleKey>) {
            const attributes: Record<string, unknown> = {};
            Object.entries(keys).forEach(([name, key]) => {
                const value = styleOf(this.model, key);
                if (value !== undefined) {
                    attributes[util.toKebabCase(name)] = value;
                }
            });
            return attributes;
        }
    }
};
