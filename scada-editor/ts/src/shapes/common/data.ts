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
    return cell.prop(['data', key]) as T | undefined;
}

/** Whether the element has the value (it shows it) */
export function hasData(cell: dia.Cell, key: DataKey): boolean {
    return dataOf(cell, key) !== undefined;
}

/** Set a value of the data of the element (an array, an object replaced - not merged into the one before) */
export function setData(cell: dia.Cell, key: DataKey, value: unknown, options: dia.Cell.Options = {}): void {
    cell.prop(['data', key], value, { ...options, rewrite: true });
}

/** Whether a change of the data of the element changed any of the values */
export function dataChanged(cell: dia.Cell, ...keys: DataKey[]): boolean {
    const previous = (cell.previous('data') ?? {}) as Record<string, unknown>;
    const current = (cell.get('data') ?? {}) as Record<string, unknown>;
    return keys.some(key => JSON.stringify(previous[key]) !== JSON.stringify(current[key]));
}

// The values at the top level of a cell in a diagram saved before they were its data
const DATA_KEYS: DataKey[] = ['power', 'open', 'level', 'value', 'values', 'min', 'max', 'thresholds', 'slices'];

// The shapes showing a reading as a number of their data (saved before: as a text)
const READINGS = ['Display', 'FlowMeter', 'ElectricMeter'];

/** A diagram (its JSON) with the values of its cells in their data: as saved now */
export function withData(json: dia.Graph.JSON): dia.Graph.JSON {
    const cells = (json.cells ?? []).map((saved) => {
        let cell = saved;
        // The reading of a display, a meter: was its text
        const reading = READINGS.includes(String(cell.type)) ? (cell.attrs as { value?: { text?: string }} | undefined)?.value?.text : undefined;
        if (reading !== undefined && !('value' in cell)) cell = { ...cell, value: Number.parseFloat(reading) || 0 };
        const keys = DATA_KEYS.filter(key => key in cell);
        if (keys.length === 0) return cell;
        const moved: Record<string, unknown> = { ...cell, data: { ...(cell.data as object | undefined) }};
        keys.forEach((key) => {
            (moved.data as Record<string, unknown>)[key] = cell[key];
            delete moved[key];
        });
        return moved as dia.Cell.JSON;
    });
    return { ...json, cells };
}
