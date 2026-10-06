import type { dia } from '@joint/plus';

/*
 * The data of an element (its `data`): what its drawing shows - the values the plant sends (`power`, `open`, `level`,
 * `value`, `values` - named as the properties of the plant, see `plant/properties.ts`) and their scale (`min`, `max`,
 * `thresholds`, the `slices` of a donut). One attribute of the model: the view renders the element again when it
 * changes (see `ShapeView`).
 */

/** The names of the data */
export type DataKey = 'power' | 'open' | 'level' | 'value' | 'values' | 'min' | 'max' | 'thresholds' | 'slices';

/** A value of the data of the element (`undefined` if it has none) */
export function dataOf<T = unknown>(cell: dia.Cell, key: DataKey): T | undefined {
    return cell.prop(['data', key]);
}

/** Whether the element has the value (it shows it) */
export function hasData(cell: dia.Cell, key: DataKey): boolean {
    return dataOf(cell, key) !== undefined;
}

/** Set a value of the data of the element (an array, an object replaced - not merged into the one before) */
export function setData(cell: dia.Cell, key: DataKey, value: unknown, options: dia.Cell.Options = {}): void {
    cell.prop(['data', key], value, { ...options, rewrite: true });
}
