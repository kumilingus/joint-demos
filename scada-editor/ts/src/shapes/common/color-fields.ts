import { type dia, util } from '@joint/plus';
import type { ColorField } from '../models/Shape';
import { featuresOf } from './features';
import { getCellDefaults } from '../defaults';

/*
 * The colors the user sets on a cell (see `ColorField`): its color, its outline, its accent - and their defaults. Of the
 * shapes (their views draw them, see `TableView`), set in the inspector (see `inspector/color-field.ts`).
 */

/** The color the user sets on the cell (a shape, a link of ours), if any: see `ColorField` */
export function colorFieldOf(cell: dia.Cell): ColorField | null {
    return featuresOf(cell)?.colorField ?? null;
}

/** The color of the outline the user sets on the cell, if any (see `ColorField`) */
export function outlineFieldOf(cell: dia.Cell): ColorField | null {
    return featuresOf(cell)?.outlineField ?? null;
}

/** The color of the accent the user sets on the cell, if any (see `ColorField`) */
export function accentFieldOf(cell: dia.Cell): ColorField | null {
    return featuresOf(cell)?.accentField ?? null;
}

/**
 * The default of the color field of the cell (see `ColorField`): of the defaults of its shape at the path, else the
 * default of the field, else the color its part is drawn in (in the defaults of the shape); none - Auto
 */
export function fieldDefault(cell: dia.Cell, field: ColorField): string | undefined {
    const defaults = getCellDefaults(cell);
    const own = util.getByPath(defaults, field.path.join('/'), '/');
    if (own !== undefined) {
        return own;
    }
    if (field.defaultValue !== undefined || !field.part) {
        return field.defaultValue;
    }
    return util.getByPath(defaults, ['attrs', ...field.part].join('/'), '/');
}
